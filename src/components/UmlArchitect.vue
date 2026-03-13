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
                    'Authorization': `Bearer ${import.meta.env.VITE_AI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        let rawContent = response.data.choices[0].message.content;

        // --- LIMPIEZA Y NORMALIZACIÓN ---
        // 1. Quitamos bloques markdown
        let cleanCode = rawContent.replace(/```mermaid/gi, '').replace(/```/g, '').trim();

        // 2. Buscamos el inicio del diagrama (ignorando basura previa)
        const startMatch = cleanCode.match(/(graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram)/i);
        if (startMatch) {
            cleanCode = cleanCode.substring(startMatch.index);

            // 3. NORMALIZACIÓN CRÍTICA: Mermaid necesita camelCase exacto
            // Si empieza por 'sequence...', forzamos 'sequenceDiagram'
            if (cleanCode.toLowerCase().startsWith('sequencediagram')) {
                cleanCode = cleanCode.replace(/^sequencediagram/i, 'sequenceDiagram');
            }
            // Si empieza por 'graph', lo dejamos en minúsculas
            else if (cleanCode.toLowerCase().startsWith('graph')) {
                cleanCode = cleanCode.replace(/^graph/i, 'graph');
            }
        }

        await renderMermaid(cleanCode);
        diagramGenerated.value = true;

    } catch (error) {
        console.error("Error:", error);
    } finally {
        isLoading.value = false;
    }
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

                <button @click="generarDiagrama" :disabled="isLoading || !userInput.trim()" class="btn-generate">
                    <span v-if="!isLoading">Generar Diagrama</span>
                    <span v-else class="loader"></span>
                </button>
            </div>

            <section v-show="diagramGenerated" class="output-section">
                <div class="card-diagram">
                    <div ref="chartContainer" class="mermaid-target"></div>
                </div>
            </section>
        </main>
    </div>
</template>