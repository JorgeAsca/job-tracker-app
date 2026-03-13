<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios'; // IMPORTANTE: Añade esta línea para las validaciones de error
import api from '../api/axios'; 
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
        const response = await api.post(
            'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1.5',
            { inputs: `pixel art sprite sheet, ${prompt.value}, white background` },
            {
                responseType: 'blob', 
                signal: abortController.value.signal,
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_HF_TOKEN}`,
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
        // CORRECCIÓN: Usamos axios.isCancel para que la referencia esté definida
        if (axios.isCancel(error) || error.name === 'AbortError') {
            alert("Generación de sprite cancelada por el usuario.");
        } else {
            console.error("Error con Hugging Face:", error);
            alert("Error al conectar con Hugging Face. Revisa el token en tu .env");
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
    link.click();
};
</script>