import { create } from 'zustand';
import Cookies from 'js-cookie';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: Cookies.get('token') || null,
  isAuthenticated: !!Cookies.get('token'),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login({ username, password });
      const { token, user } = response.data;
      Cookies.set('token', token, { expires: 7, path: '/' });
      set({ user, token, isAuthenticated: true, loading: false });
      return response;
    } catch (error) {
      set({ error: error.message || '登录失败', loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // 静默处理登出失败
    }
    Cookies.remove('token', { path: '/' });
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchCurrentUser: async () => {
    if (!get().token) return;
    try {
      const response = await authAPI.getCurrentUser();
      set({ user: response.data });
    } catch (error) {
      Cookies.remove('token', { path: '/' });
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    set({ loading: true, error: null });
    try {
      await authAPI.changePassword({ oldPassword, newPassword });
      set({ loading: false });
    } catch (error) {
      set({ error: error.message || '修改密码失败', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
