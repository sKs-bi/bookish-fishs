import { create } from 'zustand';
import { systemAPI } from '../services/api';

const useAppStore = create((set, get) => ({
  statistics: null,
  sidebarCollapsed: false,
  systemConfigs: {},

  fetchStatistics: async () => {
    try {
      const response = await systemAPI.getStatistics();
      set({ statistics: response.data });
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  },

  fetchSystemConfigs: async () => {
    try {
      const response = await systemAPI.getSystemConfigs();
      set({ systemConfigs: response.data });
    } catch (error) {
      console.error('获取系统配置失败', error);
    }
  },

  updateSystemConfigs: async (configs) => {
    try {
      await systemAPI.updateSystemConfigs(configs);
      set({ systemConfigs: { ...get().systemConfigs, ...configs } });
    } catch (error) {
      throw error;
    }
  },

  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));

export default useAppStore;
