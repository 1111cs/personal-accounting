import request from './request';
import type { ApiResponse, SocialMode } from '../types';

export const socialApi = {
  getToday: () =>
    request.get<any, ApiResponse<SocialMode | null>>('/social/today'),

  toggle: (multiplier: number) =>
    request.post<any, ApiResponse<SocialMode | null>>('/social/toggle', { multiplier }),

  getReserveDetail: (month?: string) =>
    request.get<any, ApiResponse<{ list: SocialMode[]; totalDeducted: number }>>('/social/reserve-detail', { params: { month } }),

  getReserveHistory: (months?: number) =>
    request.get<any, ApiResponse<{ month: string; reserveUsed: number }[]>>('/social/reserve-history', { params: { months } }),
};
