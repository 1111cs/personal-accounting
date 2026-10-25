import request from './request';
import type { ApiResponse, DashboardData } from '../types';

export const dashboardApi = {
  getDashboard: () =>
    request.get<any, ApiResponse<DashboardData>>('/dashboard'),

  getOverview: (month?: string) =>
    request.get<any, ApiResponse<any>>('/stats/overview', { params: { month } }),

  getTrend: (months?: number, type?: string) =>
    request.get<any, ApiResponse<any>>('/stats/trend', { params: { months, type } }),

  getTagStats: (month?: string) =>
    request.get<any, ApiResponse<any>>('/stats/tags', { params: { month } }),
};
