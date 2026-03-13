import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // Definimos el prefijo que usaremos en el frontend
      '/hf-api': {
        target: 'https://api-inference.huggingface.co', // Destino de la IA
        changeOrigin: true,
        secure: false, 
        rewrite: (path) => path.replace(/^\/hf-api/, ''),
      }
    }
  }
})