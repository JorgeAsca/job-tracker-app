<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import mermaid from 'mermaid';
import '../assets/uml.css';

// Configuración inicial de Mermaid
onMounted(() => {
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: { useMaxWidth: true, htmlLabels: true }
    });
});

const requerimiento = ref(''); 
const diagramGenerated = ref(false);
const isLoading = ref(false);
const chartContainer = ref<HTMLElement | null>(null);

// Manejo del AbortController para cumplimiento de Actividad 2.3
let controller: AbortController | null = null;

const generarDiagrama = async () => {
    if (!requerimiento.value.trim()) return;

    // Inicializar controlador para permitir cancelación inmediata
    controller = new AbortController();
    isLoading.value = true;
    diagramGenerated.value = false;

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `Eres un generador estricto de diagramas Mermaid. 
                        REGLAS CRÍTICAS:
                        1. Responde ÚNICAMENTE con el código del diagrama (graph TD o graph LR).
                        2. NO uses bloques de código con comillas (no use \`\`\`).
                        3. NO incluyas introducciones ni despedidas.
                        4. Usa etiquetas simples en los nodos (solo letras y números).
                        5. Evita caracteres como | > < [ ] dentro de los textos de los nodos.`
                    },
                    {
                        role: "user",
                        content: `Genera un diagrama de flujo Mermaid para: ${requerimiento.value}`
                    }
                ]
            },
            {
                signal: controller.signal,
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_AI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        let rawContent = response.data.choices[0].message.content;
        
        // LIMPIEZA AVANZADA: Eliminar bloques markdown y basura técnica
        let cleanCode = rawContent
            .replace(/```mermaid/gi, '')
            .replace(/```/g, '')
            .replace(/graph\s+(TD|LR|TB|BT)/gi, (match: string) => match.toUpperCase())
            .trim();

        // Si la IA devolvió texto antes del código, buscamos dónde empieza el gráfico
        const graphStart = cleanCode.search(/graph\s/i);
        if (graphStart !== -1) {
            cleanCode = cleanCode.substring(graphStart);
        }

        await renderMermaid(cleanCode);
        diagramGenerated.value = true;

    } catch (error: any) {
        if (axios.isCancel(error)) {
            console.warn("Petición abortada por el usuario");
        } else {
            console.error("Error en la conexión con la IA:", error);
            if (chartContainer.value) {
                chartContainer.value.innerHTML = `<p style="color:red">Error de conexión: ${error.message}</p>`;
            }
        }
    } finally {
        isLoading.value = false;
    }
};

const cancelGeneration = () => {
    if (controller) {
        controller.abort();
    }
};

const renderMermaid = async (code: string) => {
    if (!chartContainer.value) return;

    chartContainer.value.innerHTML = ''; 

    try {
        // Generar un ID único para cada renderizado para evitar conflictos de caché de Mermaid
        const uniqueId = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, code);
        chartContainer.value.innerHTML = svg;
    } catch (error) {
        console.error("Error de sintaxis Mermaid:", error);
        chartContainer.value.innerHTML = `
            <div class="error-box">
                <strong>Error de Sintaxis IA:</strong> El código generado no es válido.
                <pre>${code.substring(0, 100)}...</pre>
                <button onclick="window.location.reload()">Reintentar</button>
            </div>`;
    }
};

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
    link.download = 'arquitectura-ia.svg';
    link.click();
    URL.revokeObjectURL(url);
};
</script>

<template>
    <div class="section-card">
        <h2>AI-UML Architect - Generador de Diagramas</h2>

        <div class="uml-controls">
            <textarea 
                v-model="requerimiento" 
                placeholder="Describe tu sistema (ej: Proceso de login con validación de email)..." 
                :disabled="isLoading"
                class="input-prompt"
            ></textarea>

            <div class="button-group">
                <button @click="generarDiagrama" class="btn-primary" :disabled="isLoading">
                    {{ isLoading ? 'Analizando Requerimiento...' : 'Generar Diagrama' }}
                </button>

                <button v-if="isLoading" @click="cancelGeneration" class="btn-delete">
                    Cancelar Generación
                </button>
            </div>
        </div>

        <div ref="chartContainer" class="mermaid-output">
            <p v-if="!diagramGenerated && !isLoading">Escribe un requerimiento para empezar.</p>
        </div>

        <div v-if="diagramGenerated" class="export-container">
            <button @click="downloadSVG" class="btn-export">
                Descargar Imagen (.svg)
            </button>
        </div>
    </div>
</template>