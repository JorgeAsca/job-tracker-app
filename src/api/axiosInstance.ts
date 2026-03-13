import axios from 'axios';

const api = axios.create({
  baseURL: 'https://tracker-app.free.beeceptor.com',
  timeout: 5000,
});

export default api;