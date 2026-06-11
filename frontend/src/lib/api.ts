import type { AxiosRequestConfig } from 'axios';
import axiosInstance from '@/lib/axios';
import type { ApiResponse } from '@/types/api';

type RequestConfig = Omit<AxiosRequestConfig, 'data' | 'method' | 'url'>;

export const unwrapApiData = <TData>(response: ApiResponse<TData>): TData => response.data;

export const api = {
  async get<TData>(url: string, config?: RequestConfig): Promise<ApiResponse<TData>> {
    const response = await axiosInstance.get<ApiResponse<TData>>(url, config);

    return response.data;
  },

  async post<TData, TPayload = unknown>(
    url: string,
    payload?: TPayload,
    config?: RequestConfig,
  ): Promise<ApiResponse<TData>> {
    const response = await axiosInstance.post<ApiResponse<TData>>(url, payload, config);

    return response.data;
  },

  async put<TData, TPayload = unknown>(
    url: string,
    payload?: TPayload,
    config?: RequestConfig,
  ): Promise<ApiResponse<TData>> {
    const response = await axiosInstance.put<ApiResponse<TData>>(url, payload, config);

    return response.data;
  },

  async patch<TData, TPayload = unknown>(
    url: string,
    payload?: TPayload,
    config?: RequestConfig,
  ): Promise<ApiResponse<TData>> {
    const response = await axiosInstance.patch<ApiResponse<TData>>(url, payload, config);

    return response.data;
  },

  async delete<TData>(url: string, config?: RequestConfig): Promise<ApiResponse<TData>> {
    const response = await axiosInstance.delete<ApiResponse<TData>>(url, config);

    return response.data;
  },
};

export default api;
