import axios from 'axios';
import { useAdminStore } from '../store/adminStore';

// 创建 axios 实例，统一管理请求配置
const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动注入 Authorization 头
client.interceptors.request.use((config) => {
  const token = useAdminStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理 401 未授权错误
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 令牌过期或无效，清空状态并跳转登录页
      useAdminStore.getState().logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  },
);

export default client;
