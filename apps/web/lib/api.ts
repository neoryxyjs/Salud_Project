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

