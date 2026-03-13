// src/api/axios.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://tracker-apasp.free.beeceptor.com', 
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// INTERCEPTOR DE RESPUESTA: Manejar errores de seguridad 
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Sesión expirada o no autorizada');
      // Aquí podrías limpiar el store y redirigir al login
      localStorage.removeItem('auth_token');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default apiClient;