import { create } from 'zustand';
import { systemAPI } from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (params = {}) => {
    set({ loading: true });
    try {
      const response = await systemAPI.getNotifications(params);
      set({ notifications: response.data.items, unreadCount: response.data.items.filter(n => !n.is_read).length, loading: false });
    } catch (error) {
      console.error('获取通知失败', error);
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await systemAPI.markNotificationRead(id);
      const notifications = get().notifications.map(n =>
        n.id === id ? { ...n, is_read: 1 } : n
      );
      set({ notifications, unreadCount: notifications.filter(n => !n.is_read).length });
    } catch (error) {
      console.error('标记已读失败', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await systemAPI.markAllNotificationsRead();
      const notifications = get().notifications.map(n => ({ ...n, is_read: 1 }));
      set({ notifications, unreadCount: 0 });
    } catch (error) {
      console.error('全部标记已读失败', error);
    }
  },
}));

export default useNotificationStore;
