import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // Definimos el prefijo que usaremos en el frontend
      '/hf-api': {
        target: 'https://api-inference.huggingface.co', // Destino real de la IA
        changeOrigin: true,
        secure: false, // Útil si hay problemas con certificados en local
        rewrite: (path) => path.replace(/^\/hf-api/, ''), // Eliminamos el prefijo al llegar al destino
      }
    }
  }
})