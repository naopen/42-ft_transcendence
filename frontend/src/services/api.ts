import axios from 'axios';

// Dynamically get API URL to avoid caching issues
const getApiUrl = () => {
  // Use relative URL for API calls to avoid hardcoded domain issues
  // This way, the API will always use the same domain as the frontend
  const currentUrl = window.location.origin;
  
  // If we're in development mode and have VITE_API_URL set, use it
  if (import.meta.env.DEV && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Otherwise, use relative path (works with both ngrok and localhost)
  return `${currentUrl}/api`;
};

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
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

// Handle auth errors
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
