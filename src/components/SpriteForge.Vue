<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { InferenceClient } from '@huggingface/inference'
import '../assets/sprite.css';

interface Milestone {
    at: number
    label: string
}

interface SpriteState {
    imageUrl: string | null
    frames: number
    isGenerating: boolean
    isAnimating: boolean
    progress: number
    progressLabel: string
    errorMsg: string | null
    wasCancelled: boolean
}

const prompt = ref<string>('')
const frameCount = ref<number>(4)
const state = ref<SpriteState>({
    imageUrl: null,
    frames: 4,
    isGenerating: false,
    isAnimating: false,
    progress: 0,
    progressLabel: '',
    errorMsg: null,
    wasCancelled: false,
})

let abortController: AbortController | null = null

// ── Variables de entorno 
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN as string

// ── Computed para v-bind CSS
const spriteAnimation = computed(() => ({
    '--frame-count': state.value.frames,
    '--anim-steps': `steps(${state.value.frames})`,
}))

// ── Barra de progreso simulada 
let progressInterval: ReturnType<typeof setInterval> | null = null

const MILESTONES: Milestone[] = [
    { at: 10, label: 'Inicializando modelo...' },
    { at: 25, label: 'Generando composición...' },
    { at: 45, label: 'Añadiendo detalles pixel art...' },
    { at: 65, label: 'Renderizando fotogramas...' },
    { at: 80, label: 'Finalizando sprite sheet...' },
    { at: 90, label: 'Descargando imagen...' },
]

function getActiveMilestone(progress: number): Milestone | undefined {
    let result: Milestone | undefined
    for (let i = 0; i < MILESTONES.length; i++) {
        if (progress >= MILESTONES[i].at) {
            result = MILESTONES[i]
        }
    }
    return result
}

function startProgressSimulation(): void {
    state.value.progress = 0
    state.value.progressLabel = 'Enviando prompt...'

    progressInterval = setInterval(() => {
        if (state.value.progress < 90) {
            const increment = state.value.progress < 50 ? 1.5 : 0.6
            state.value.progress = Math.min(90, state.value.progress + increment)

            const milestone = getActiveMilestone(state.value.progress)
            if (milestone) state.value.progressLabel = milestone.label
        }
    }, 200)
}

function stopProgressSimulation(success: boolean): void {
    if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
    }
    if (success) {
        state.value.progress = 100
        state.value.progressLabel = '¡Sprite sheet generado!'
    }
}

// ── Generación principal 
async function generateSprite(): Promise<void> {
    if (!prompt.value.trim()) {
        state.value.errorMsg = 'Escribe una descripción del personaje.'
        return
    }
    if (!HF_TOKEN) {
        state.value.errorMsg = 'Falta VITE_HF_TOKEN en tu archivo .env.local'
        return
    }

    state.value.errorMsg = null
    state.value.wasCancelled = false
    state.value.isGenerating = true
    state.value.imageUrl = null
    state.value.isAnimating = false

    abortController = new AbortController()
    startProgressSimulation()

    try {
        const client = new InferenceClient(HF_TOKEN)

        const enrichedPrompt = [
            prompt.value.trim(),
            'pixel art style',
            'sprite sheet',
            `${frameCount.value} animation frames in a horizontal row`,
            'game asset',
            'white background',
            '16-bit retro style',
            'clean edges',
            'no shadows outside sprite',
        ].join(', ')

        // textToImage devuelve Blob directamente (equivale a responseType: 'blob')
        const imageBlob: Blob = await client.textToImage(
            {
                model: 'black-forest-labs/FLUX.1-schnell',
                inputs: enrichedPrompt,
                parameters: {
                    width: 1024,
                    height: 256,
                    num_inference_steps: 4,
                },
            },
            { signal: abortController.signal }
        )

        // ── Blob → URL manejable por el navegador 
        const objectUrl = URL.createObjectURL(imageBlob)

        stopProgressSimulation(true)
        state.value.imageUrl = objectUrl
        state.value.frames = frameCount.value

        await new Promise<void>(resolve => setTimeout(resolve, 600))
        state.value.isAnimating = true

    } catch (error: unknown) {
        stopProgressSimulation(false)

        if (error instanceof Error && error.name === 'AbortError') {
            state.value.wasCancelled = true
            state.value.progressLabel = 'Generación cancelada.'
            state.value.progress = 0
        } else if (error instanceof Error) {
            const msg = error.message.toLowerCase()
            if (msg.includes('410')) {
                state.value.errorMsg = 'Modelo eliminado (410). Actualiza el modelo en el código.'
            } else if (msg.includes('503') || msg.includes('loading')) {
                state.value.errorMsg = 'Modelo cargando (503). Espera 20 segundos y reintenta.'
            } else if (msg.includes('401') || msg.includes('unauthorized')) {
                state.value.errorMsg = 'Token inválido (401). Revisa VITE_HF_TOKEN en .env.local'
            } else if (msg.includes('429')) {
                state.value.errorMsg = 'Límite de peticiones alcanzado (429). Espera un minuto.'
            } else {
                state.value.errorMsg = `Error inesperado: ${error.message}`
            }
        } else {
            state.value.errorMsg = 'Error desconocido. Revisa la consola.'
            console.error(error)
        }
    } finally {
        state.value.isGenerating = false
        abortController = null
    }
}

// ── Cancelar petición en vuelo 
function cancelGeneration(): void {
    abortController?.abort()
}

// ── Exportar imagen 
function exportImage(format: 'png' | 'svg'): void {
    if (!state.value.imageUrl) return

    if (format === 'png') {
        const a = document.createElement('a')
        a.href = state.value.imageUrl
        a.download = `spritesheet_${Date.now()}.png`
        a.click()
        return
    }

    const img = new Image()
    img.onload = () => {
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${img.naturalWidth}" height="${img.naturalHeight}"
     viewBox="0 0 ${img.naturalWidth} ${img.naturalHeight}">
  <image xlink:href="${state.value.imageUrl}"
         width="${img.naturalWidth}" height="${img.naturalHeight}"/>
</svg>`
        const blob = new Blob([svgContent], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `spritesheet_${Date.now()}.svg`
        a.click()
        URL.revokeObjectURL(url)
    }
    img.src = state.value.imageUrl
}

// ── Limpieza al desmontar 
onUnmounted(() => {
    if (state.value.imageUrl) URL.revokeObjectURL(state.value.imageUrl)
    if (progressInterval) clearInterval(progressInterval)
})
</script>

<template>
    <div class="forge-wrapper">
        <header class="forge-header">
            <span class="forge-icon">🎮</span>
            <h1>SpriteSheet AI Forge</h1>
            <p class="forge-subtitle">Genera y anima sprites pixel art con IA</p>
        </header>

        <!-- ── Formulario ── -->
        <section class="forge-form">
            <div class="form-group">
                <label for="prompt-input">Descripción del personaje</label>
                <textarea id="prompt-input" v-model="prompt" rows="3"
                    placeholder="Ej: Guerrero medieval corriendo, 4 fotogramas, fondo blanco"
                    :disabled="state.isGenerating" />
            </div>

            <div class="form-group form-inline">
                <label>Número de fotogramas</label>
                <div class="frame-control">
                    <button class="btn-icon" :disabled="frameCount <= 2 || state.isGenerating"
                        @click="frameCount = Math.max(2, frameCount - 1)">−</button>
                    <span class="frame-value">{{ frameCount }}</span>
                    <button class="btn-icon" :disabled="frameCount >= 12 || state.isGenerating"
                        @click="frameCount = Math.min(12, frameCount + 1)">+</button>
                </div>
            </div>

            <div class="form-actions">
                <button class="btn-primary" :disabled="state.isGenerating || !prompt.trim()" @click="generateSprite">
                    <span v-if="!state.isGenerating">✨ Generar Sprite</span>
                    <span v-else class="btn-spinner">⏳ Generando...</span>
                </button>

                <button v-if="state.isGenerating" class="btn-danger" @click="cancelGeneration">
                    ✖ Cancelar Generación
                </button>
            </div>
        </section>

        <!-- ── Barra de progreso ── -->
        <transition name="fade">
            <div v-if="state.isGenerating || state.progress > 0" class="progress-section">
                <div class="progress-track">
                    <div class="progress-fill" :style="{ width: state.progress + '%' }" />
                </div>
                <div class="progress-meta">
                    <span class="progress-label">{{ state.progressLabel }}</span>
                    <span class="progress-pct">{{ Math.round(state.progress) }}%</span>
                </div>
            </div>
        </transition>

        <!-- ── Alertas ── -->
        <transition name="fade">
            <div v-if="state.wasCancelled" class="alert alert-warning">
                Generación cancelada por el usuario.
            </div>
        </transition>

        <transition name="fade">
            <div v-if="state.errorMsg" class="alert alert-error">
                {{ state.errorMsg }}
            </div>
        </transition>

        <!-- ── Resultado ── -->
        <transition name="slide-up">
            <section v-if="state.imageUrl" class="result-section">

                <div class="result-card">
                    <h2>🖼️ Sprite Sheet generado</h2>
                    <img :src="state.imageUrl" alt="Sprite Sheet generado por IA" class="spritesheet-preview" />
                    <div class="export-actions">
                        <button class="btn-export" @click="exportImage('png')">⬇ Descargar PNG</button>
                        <button class="btn-export btn-export--svg" @click="exportImage('svg')">⬇ Descargar SVG</button>
                    </div>
                </div>

                <!-- v-bind en <style scoped>: inyecta frames reactivos en steps() -->
                <div class="result-card">
                    <h2>🎬 Vista animada <small>({{ state.frames }} frames)</small></h2>

                    <div v-if="state.isAnimating" class="sprite-viewport" :style="spriteAnimation">
                        <div class="sprite-runner" :style="{ backgroundImage: `url(${state.imageUrl})` }" />
                    </div>

                    <div class="animation-controls">
                        <button class="btn-secondary" @click="state.isAnimating = !state.isAnimating">
                            {{ state.isAnimating ? '⏸ Pausar' : '▶ Reanudar' }}
                        </button>
                    </div>
                </div>

            </section>
        </transition>

    </div>
</template>

<style scoped>
.sprite-runner {
    /* v-bind inyecta state.frames como variable CSS en tiempo real */
    width: calc(100% * v-bind('state.frames'));
    height: 100%;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: left center;
    /* steps(N) se actualiza automáticamente al cambiar frameCount */
    animation: sprite-walk 1s v-bind('`steps(${state.frames})`') infinite;
}

@keyframes sprite-walk {
    0% {
        transform: translateX(0);
    }

    100% {
        transform: translateX(calc(-100% + 100% / v-bind('state.frames')));
    }
}
</style>