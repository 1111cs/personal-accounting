import request from './request';
import type { ApiResponse, PriceRecord, PriceRanking } from '../types';

export const priceApi = {
  getList: (params?: Record<string, any>) =>
    request.get<any, ApiResponse<{ list: PriceRecord[]; total: number }>>('/prices', { params }),

  create: (data: Partial<PriceRecord>) =>
    request.post<any, ApiResponse<{ record: PriceRecord; stats: any }>>('/prices', data),

  getTrend: (itemName: string) =>
    request.get<any, ApiResponse<any>>(`/prices/trend/${encodeURIComponent(itemName)}`),

  getRanking: (month?: string) =>
    request.get<any, ApiResponse<PriceRanking[]>>('/prices/ranking', { params: { month } }),

  delete: (id: number) =>
    request.delete<any, ApiResponse>(`/prices/${id}`),
};
