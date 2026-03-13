<script setup lang="ts">
import { ref, computed } from 'vue';
import api from '../api/axios';
import '../assets/sprite.css';

const prompt = ref('');
const frames = ref(4);
const downloadPercent = ref(0);
const imageUrl = ref('');
const isDownloading = ref(false);

// Formateamos la URL para el CSS (v-bind)
const spriteUrl = computed(() => imageUrl.value ? `url(${imageUrl.value})` : 'none');

const generateSprite = async () => {
    if (!prompt.value) return;

    isDownloading.value = true;
    downloadPercent.value = 0;

    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1.5',
            { inputs: `pixel art sprite sheet, ${prompt.value}, white background` },
            {
                responseType: 'blob', 
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_HF_TOKEN}`,
                    'x-use-cache': 'false'
                },
                onDownloadProgress: (progressEvent) => { 
                    if (progressEvent.total) {
                        progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    }
                }
            }
        );

        // Liberar memoria de la URL anterior si existía
        if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);

        // Convertir el binario recibido en una URL usable por la etiqueta <img> o el CSS
        imageUrl.value = URL.createObjectURL(response.data);
    } catch (error) {
        console.error("Error con Hugging Face:", error);
    } finally {
        isDownloading.value = false;
    }
};
</script>

<template>
    <div class="section-card">
        <h2>SpriteSheet AI Forge - Generador y Animador</h2>

        <div class="job-form">
            <input v-model="prompt" placeholder="Ej: Guerrero corriendo pixel art..." />
            <input type="number" v-model="frames" min="1" placeholder="Nº de frames" />
            <button @click="generateSprite" class="btn-primary" :disabled="isDownloading">
                Generar Sprite
            </button>
        </div>

        <div v-if="isDownloading" class="progress-container">
            <div class="progress-bar" :style="{ width: downloadPercent + '%' }"></div>
            <p>{{ downloadPercent }}% descargado...</p>
        </div>

        <div v-if="imageUrl" class="sprite-viewer">
            <h3>Previsualización Animada ({{ frames }} frames)</h3>
            <div class="sprite-display"></div>
        </div>
    </div>
</template>