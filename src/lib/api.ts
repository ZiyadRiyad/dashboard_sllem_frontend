import axios from 'axios';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/api`;
  }
  if (typeof window !== 'undefined') {
    // Dynamic client-side fallback to port 5000 on the same host
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${host}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add the Authorization header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sllem_admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle expired sessions and errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401 || status === 403) {
        if (typeof window !== 'undefined') {
          // Clear credentials and force redirect to login on expired/invalid session
          localStorage.removeItem('sllem_admin_token');
          localStorage.removeItem('sllem_admin_user');
          window.location.href = '/';
        }
      } else if (status === 429) {
        if (typeof window !== 'undefined') {
          alert('تم تجاوز حد الطلبات المسموح به. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
