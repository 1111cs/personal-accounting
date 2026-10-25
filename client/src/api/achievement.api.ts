import request from './request';
import type { ApiResponse, Achievement } from '../types';

export const achievementApi = {
  getList: () =>
    request.get<any, ApiResponse<{ list: Achievement[]; unlockedCount: number; totalCount: number }>>('/achievements'),
};
