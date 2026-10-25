import request from './request';
import type { ApiResponse, Bill } from '../types';

export const billApi = {
  getList: (params?: Record<string, any>) =>
    request.get<any, ApiResponse<{ list: Bill[]; total: number; page: number; pageSize: number }>>('/bills', { params }),

  getById: (id: number) =>
    request.get<any, ApiResponse<Bill>>(`/bills/${id}`),

  create: (data: Partial<Bill>) =>
    request.post<any, ApiResponse<{ bill: Bill; priceHint: any }>>('/bills', data),

  update: (id: number, data: Partial<Bill>) =>
    request.put<any, ApiResponse<Bill>>(`/bills/${id}`, data),

  delete: (id: number) =>
    request.delete<any, ApiResponse>(`/bills/${id}`),

  batchDelete: (ids: number[]) =>
    request.delete<any, ApiResponse>('/bills/batch/delete', { data: { ids } }),
};
