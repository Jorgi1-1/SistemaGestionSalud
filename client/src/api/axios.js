import axios from 'axios';

// Creamos la instancia de Axios
// Asegúrate de que el puerto coincida con tu servidor (5000 o el que estés usando)
const api = axios.create({
  baseURL: 'http://localhost:5001/api', 
});

// Interceptor para inyectar el Token automáticamente en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;