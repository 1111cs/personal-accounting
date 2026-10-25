import request from './request';
import type { ApiResponse, StreakData } from '../types';

export const streakApi = {
  getDetail: () =>
    request.get<any, ApiResponse<StreakData>>('/streak/detail'),
};
