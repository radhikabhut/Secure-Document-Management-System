import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearAuthSession, getAccessToken, isTokenExpired } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';

export const AUTH_UNAUTHORIZED_EVENT = 'docuvault:unauthorized';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

export const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
  withCredentials: false,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();

  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      clearAuthSession();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));

        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
