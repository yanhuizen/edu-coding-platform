import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/auth';

const apiBase = import.meta.env.VITE_API_BASE || '/api';

export const http: AxiosInstance = axios.create({
  baseURL: apiBase,
  timeout: 15000,
});

let authStore: ReturnType<typeof useAuthStore> | null = null;

function getAuthStore() {
  if (!authStore) {
    try {
      authStore = useAuthStore();
    } catch {
      return null;
    }
  }
  return authStore;
}

http.interceptors.request.use((config) => {
  const auth = getAuthStore();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

http.interceptors.response.use(
  (resp) => resp,
  (err: AxiosError<any>) => {
    if (err.response?.status === 401) {
      const auth = getAuthStore();
      if (auth && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register')) {
        auth.logout();
        location.href = '/login?expired=1';
      }
    }
    const msg = err.response?.data?.message || err.message || '网络开了小差';
    return Promise.reject(new Error(msg));
  }
);
