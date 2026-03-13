<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios'; 
import '../assets/sprite.css';

const prompt = ref('');
const imageUrl = ref<string | null>(null);
const isDownloading = ref(false);
const downloadPercent = ref(0);
const abortController = ref<AbortController | null>(null);

const generateSprite = async () => {
    if (!prompt.value.trim()) return;

    isDownloading.value = true;
    downloadPercent.value = 0;
    imageUrl.value = null;
    
    abortController.value = new AbortController();

    try {
        // Hemos cambiado el modelo a stabilityai/stable-diffusion-2-1
        const response = await axios.post(
            '/hf-api/models/nerijs/pixel-art-xl',
            { 
                inputs: `pixel art sprite sheet, ${prompt.value}, white background, character sprites, 8-bit style` 
            },
            {
                responseType: 'blob', 
                signal: abortController.value.signal,
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        downloadPercent.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    }
                }
            }
        );

        imageUrl.value = URL.createObjectURL(response.data);
        
    } catch (error: any) {
        if (axios.isCancel(error)) {
            alert("Generación cancelada por el usuario.");
        } else {
            console.error("Error en SpriteForge:", error);
            // Si sale 404 o 410, es que el modelo no acepta inferencia gratuita ahora mismo
            alert("Error al conectar con la IA. El modelo puede estar saturado o no disponible.");
        }
    } finally {
        isDownloading.value = false;
        abortController.value = null;
    }
};

const cancelRequest = () => {
    if (abortController.value) {
        abortController.value.abort();
    }
};

const downloadImage = () => {
    if (!imageUrl.value) return;
    const link = document.createElement('a');
    link.href = imageUrl.value;
    link.download = `sprite-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
</script>

<template>
    <div class="forge-container">
        <header class="forge-header">
            <h1>SpriteForge</h1>
            <p>Crea tus personajes con IA</p>
        </header>

        <main class="forge-content">
            <div class="input-section">
                <input 
                    v-model="prompt" 
                    type="text" 
                    placeholder="Ej: Guerrero de fuego, arquero elfo..."
                    :disabled="isDownloading"
                />
                <div class="button-group">
                    <button v-if="!isDownloading" @click="generateSprite" :disabled="!prompt.trim()" class="btn-forge">
                        Forjar
                    </button>
                    <button v-else @click="cancelRequest" class="btn-cancel">
                        Cancelar ({{ downloadPercent }}%)
                    </button>
                </div>
            </div>

            <div v-if="isDownloading" class="progress-wrapper">
                <div class="progress-bar-container">
                    <div class="progress-fill" :style="{ width: downloadPercent + '%' }"></div>
                </div>
                <p>Procesando imagen... {{ downloadPercent }}%</p>
            </div>

            <section v-if="imageUrl" class="result-section">
                <div class="card-sprite">
                    <img :src="imageUrl" alt="Sprite Generado" class="pixel-art-display" />
                    <button @click="downloadImage" class="btn-download">Descargar</button>
                </div>
            </section>
        </main>
    </div>
</template>