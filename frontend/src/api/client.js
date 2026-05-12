import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: Handle token expiration/401 and sanitize server errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Handle Authentication Errors (401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }

    // 2. Sanitize Database/Server Errors to hide internal details
    const isServerError = error.response && error.response.status >= 500;
    const isDbError = error.response && typeof error.response.data === 'string' && 
      /sql|database|hibernate|exception|constraint|query|table/i.test(error.response.data);

    if (isServerError || isDbError) {
      error.message = "A system error occurred. Please try again later.";
      if (error.response) {
        error.response.data = "An unexpected error occurred. Please try again later or contact support.";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
