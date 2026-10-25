import request from './request';
import type { ApiResponse, Budget, BudgetCalculation } from '../types';

export const budgetApi = {
  getCurrent: (month?: string) =>
    request.get<any, ApiResponse<Budget | null>>('/budgets/current', { params: { month } }),

  update: (data: Partial<Budget>) =>
    request.put<any, ApiResponse<Budget>>('/budgets/current', data),

  calculate: (date?: string) =>
    request.get<any, ApiResponse<BudgetCalculation>>('/budgets/calculate', { params: { date } }),

  getHistory: (month?: string) =>
    request.get<any, ApiResponse<{ date: string; allowance: number }[]>>('/budgets/history', { params: { month } }),

  getReserveDetail: (month?: string) =>
    request.get<any, ApiResponse<{ list: { id: number; amount: number; note: string; bill_date: string; category: string }[]; totalDeducted: number }>>('/budgets/reserve/detail', { params: { month } }),

  getReserveHistory: (months?: number) =>
    request.get<any, ApiResponse<{ month: string; reserveUsed: number }[]>>('/budgets/reserve/history', { params: { months } }),
};
