<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import mermaid from 'mermaid';
import '../assets/uml.css';

// Configuración inicial de Mermaid
onMounted(() => {
    mermaid.initialize({ 
        startOnLoad: false,
        theme: 'default'
    });
});

const prompt = ref('');
const diagramGenerated = ref(false);
const isLoading = ref(false);
const chartContainer = ref<HTMLElement | null>(null);

// 1. Manejo del AbortController para cancelación
let controller: AbortController | null = null;

const generateDiagram = async () => {
    if (!prompt.value) return;

    controller = new AbortController();
    isLoading.value = true;
    diagramGenerated.value = false;

    try {
        // 2. Petición con signal de cancelación 
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions', 
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: "Explica solo con sintaxis Mermaid. No uses bloques de código ni texto adicional."
                    }, 
                    { role: "user", content: `Crea un diagrama de: ${prompt.value}` }
                ]
            },
            { 
                signal: controller.signal, // Vinculación obligatoria para abortar 
                headers: { 
                    'Authorization': `Bearer ${import.meta.env.VITE_AI_API_KEY}`, // Uso de variables de entorno 
                    'Content-Type': 'application/json'
                } 
            }
        );

        const mermaidCode = response.data.choices[0].message.content;
        await renderMermaid(mermaidCode);
        diagramGenerated.value = true;

    } catch (error: any) {
        if (axios.isCancel(error)) {
            alert("Generación cancelada por el usuario.");
        } else {
            console.error("Error en la API de IA:", error);
        }
    } finally {
        isLoading.value = false;
    }
};

// 3. Función para abortar la petición en vuelo
const cancelGeneration = () => {
    if (controller) {
        controller.abort(); 
    }
};

const renderMermaid = async (code: string) => {
    if (chartContainer.value) {
        chartContainer.value.innerHTML = ''; // Limpiar previo
        try {
            // Renderizado dinámico en el DOM 
            const { svg } = await mermaid.render('mermaid-svg-id', code);
            chartContainer.value.innerHTML = svg;
        } catch (e) {
            console.error("Error al renderizar Mermaid:", e);
        }
    }
};

// 4. Función de exportación a SVG 
const downloadSVG = () => {
    if (!chartContainer.value) return;
    const svgElement = chartContainer.value.querySelector('svg');
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagrama-ia.svg';
    link.click();
    URL.revokeObjectURL(url);
};
</script>

<template>
    <div class="section-card">
        <h2>AI-UML Architect - Generador de Diagramas</h2>
        
        <div class="uml-controls">
            <input 
                v-model="prompt" 
                placeholder="Ej: Sistema de login de usuario..." 
                :disabled="isLoading" 
                class="input-prompt"
            />
            
            <div class="button-group">
                <button @click="generateDiagram" class="btn-primary" :disabled="isLoading">
                    {{ isLoading ? 'Procesando IA...' : 'Generar' }}
                </button>

                <button v-if="isLoading" @click="cancelGeneration" class="btn-delete">
                    Cancelar Generación [cite: 198]
                </button>
            </div>
        </div>

        <div ref="chartContainer" class="mermaid-output">
            <p v-if="!diagramGenerated && !isLoading">El diagrama aparecerá aquí...</p>
        </div>

        <div v-if="diagramGenerated" class="export-container">
            <button @click="downloadSVG" class="btn-export">
                Descargar .svg [cite: 203]
            </button>
        </div>
    </div>
</template>