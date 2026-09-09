import axios from 'axios';
import toast from 'react-hot-toast';
import { config } from '../config';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request Interceptor: Attach Authorization Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pc_doctor_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for global error catching
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';

    // Show toast only for unexpected server errors (404 and 400 can be handled locally if needed)
    if (error.response?.status >= 500) {
      toast.error(`Server Error: ${message}`);
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;
