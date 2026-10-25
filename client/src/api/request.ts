import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 200) {
      message.error(res.message || '请求失败');
      if (res.code === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(new Error(res.message));
    }
    return res;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    // 优先展示后端返回的错误信息
    const errMsg = error.response?.data?.message || error.message || '网络错误';
    message.error(errMsg);
    return Promise.reject(error);
  }
);

export default request;
