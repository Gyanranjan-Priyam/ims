import axios from 'axios';

// Get API base URL from environment variables with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ims-z37w.onrender.com';

// Debug logging for development
console.log('🔧 API Configuration:');
console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);
console.log('Final API_BASE_URL:', API_BASE_URL);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
