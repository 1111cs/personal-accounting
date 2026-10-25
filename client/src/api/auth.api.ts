import request from './request';
import type { ApiResponse, User } from '../types';

export const authApi = {
  register: (username: string, password: string) =>
    request.post<any, ApiResponse<{ token: string; user: User }>>('/auth/register', { username, password }),

  login: (username: string, password: string) =>
    request.post<any, ApiResponse<{ token: string; user: User }>>('/auth/login', { username, password }),

  getMe: () =>
    request.get<any, ApiResponse<User>>('/auth/me'),
};
