import axios from 'axios';

// Use Vite environment variable or fallback to relative path
// VITE_API_BASE_URL is set in Vercel environment variables at build time
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BACKEND_URL,
});

console.log('API Base URL:', BACKEND_URL);

// Add token to request headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ros_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ros_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
