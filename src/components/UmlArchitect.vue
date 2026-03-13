<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import mermaid from 'mermaid';
import '../assets/uml.css';

// Configuración de Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'forest',
    securityLevel: 'loose',
});

const userInput = ref('');
const chartContainer = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const diagramGenerated = ref(false);

// 1. Referencia para controlar la cancelación
const abortController = ref<AbortController | null>(null);

// Acceso a la API Key desde el .env
const apiKey = import.meta.env.VITE_AI_API_KEY;

const renderMermaid = async (code: string) => {
    if (!chartContainer.value) return;

    chartContainer.value.innerHTML = '';
    const id = `mermaid-svg-${Date.now()}`;

    try {
        const { svg } = await mermaid.render(id, code);
        chartContainer.value.innerHTML = svg;
    } catch (error) {
        console.error("Error de sintaxis Mermaid:", error);
        chartContainer.value.innerHTML = `
      <div class="error-container">
        <p class="error-text">La IA generó un código con errores. Prueba a ser más específico.</p>
      </div>`;
    }
};

const generarDiagrama = async () => {
    if (!userInput.value.trim()) return;

    isLoading.value = true;
    diagramGenerated.value = false;

    // 2. Inicializamos el AbortController antes de la petición
    abortController.value = new AbortController();

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "llama-3.3-70b-versatile",
                messages: [{
                    role: "user",
                    content: `Genera el código Mermaid para: ${userInput.value}. No incluyas markdown ni explicaciones.`
                }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                // 3. Vinculamos la señal de cancelación
                signal: abortController.value.signal
            }
        );

        let rawContent = response.data.choices[0].message.content;

        let cleanCode = rawContent.replace(/```mermaid/gi, '').replace(/```/g, '').trim();

        const startMatch = cleanCode.match(/(graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram)/i);
        if (startMatch) {
            cleanCode = cleanCode.substring(startMatch.index);

            if (cleanCode.toLowerCase().startsWith('sequencediagram')) {
                cleanCode = cleanCode.replace(/^sequencediagram/i, 'sequenceDiagram');
            }
            else if (cleanCode.toLowerCase().startsWith('graph')) {
                cleanCode = cleanCode.replace(/^graph/i, 'graph');
            }
        }

        await renderMermaid(cleanCode);
        diagramGenerated.value = true;

    } catch (error) {
        // 4. Manejamos el aviso de cancelación
        if (axios.isCancel(error)) {
            alert("Petición cancelada por el usuario.");
        } else {
            console.error("Error:", error);
        }
    } finally {
        isLoading.value = false;
        abortController.value = null; // Limpiamos el controlador
    }
};

// 5. Función para abortar la petición
const cancelarGeneracion = () => {
    if (abortController.value) {
        abortController.value.abort();
    }
};

// 6. Función para exportar el SVG
const exportarDiagrama = () => {
    if (!chartContainer.value) return;
    
    // Obtenemos el contenido SVG renderizado
    const svgData = chartContainer.value.innerHTML;
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `diagrama_uml_${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
};
</script>

<template>
    <div class="uml-container">
        <header class="uml-header">
            <h1>UML Architect</h1>
            <p>Transforma tus ideas en diagramas profesionales mediante IA</p>
        </header>

        <main class="uml-content">
            <div class="input-section">
                <textarea v-model="userInput"
                    placeholder="Describe el proceso (ej: El usuario se registra, recibe un email y confirma su cuenta)..."
                    :disabled="isLoading"></textarea>

                <div class="actions-row">
                    <button v-if="!isLoading" @click="generarDiagrama" :disabled="!userInput.trim()" class="btn-generate">
                        Generar Diagrama
                    </button>
                    <button v-else @click="cancelarGeneracion" class="btn-cancel">
                        Cancelar Generación
                    </button>

                    <button v-if="diagramGenerated" @click="exportarDiagrama" class="btn-export">
                        Descargar SVG
                    </button>
                </div>
            </div>

            <section v-show="diagramGenerated" class="output-section">
                <div class="card-diagram">
                    <div ref="chartContainer" class="mermaid-target"></div>
                </div>
            </section>
        </main>
    </div>
</template>