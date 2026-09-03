import axios from 'axios';

// Use injected config from server if available, otherwise use default
const BACKEND_URL = typeof window !== 'undefined' && window.API_BASE_URL
  ? window.API_BASE_URL
  : 'https://restaurantos-backend-wg6g.onrender.com/api';

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
