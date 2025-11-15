import axios from 'axios';

// Asegurar que la URL tenga el protocolo https://
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Si la URL no empieza con http:// o https://, agregar https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

export const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
});

// Interceptor para manejar errores 401 (no autenticado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si estamos en el cliente y no estamos en la página de login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        // No redirigir automáticamente aquí, dejar que cada componente maneje el error
      }
    }
    return Promise.reject(error);
  }
);

