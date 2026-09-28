import { create } from "zustand";

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => {
      const item = {
        id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        read: false,
        ...notification,
      };
      return {
        notifications: [item, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      let newlyRead = 0;
      const updated = state.notifications.map((n) => {
        if (n.id === id && !n.read) {
          newlyRead++;
          return { ...n, read: true };
        }
        return n;
      });
      return {
        notifications: updated,
        unreadCount: Math.max(0, state.unreadCount - newlyRead),
      };
    }),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
