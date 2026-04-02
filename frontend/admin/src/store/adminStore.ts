import { create } from 'zustand';

// 管理员认证状态存储
interface AdminState {
  /** JWT 访问令牌 */
  token: string | null;
  /** 设置令牌并持久化到 localStorage */
  setToken: (token: string) => void;
  /** 清空令牌并跳转登录页 */
  logout: () => void;
}

const TOKEN_KEY = 'ideas-admin-token';

export const useAdminStore = create<AdminState>((set) => ({
  // 初始化时从 localStorage 恢复令牌
  token: localStorage.getItem(TOKEN_KEY),

  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null });
  },
}));
