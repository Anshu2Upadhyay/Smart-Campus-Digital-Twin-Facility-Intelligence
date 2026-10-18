import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000/api/v1';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token from localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('campus_jwt_token') ||
      localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract error details & handle session expiration
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      // Do not redirect if user is on public landing page or login pages
      if (
        !currentPath.includes('/login') &&
        !currentPath.includes('/staff-login') &&
        currentPath !== '/'
      ) {
        localStorage.removeItem('campus_jwt_token');
        localStorage.removeItem('campus_user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Enhance error with clean extracted detail message
    let detail =
      error.response?.data?.detail ||
      error.response?.data?.message;

    if (!detail) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        detail = 'Cannot connect to backend server. Please verify FastAPI is running on http://localhost:8000.';
      } else {
        detail = error.message || 'An unexpected network error occurred.';
      }
    }

    error.extractedDetail = typeof detail === 'string' ? detail : JSON.stringify(detail);
    return Promise.reject(error);
  }
);

export default axiosClient;
