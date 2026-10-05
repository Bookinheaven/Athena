import { create } from "zustand";
import { getUserScopedKey } from "../../services/userStateService";

export const useUIStore = create((set, get) => ({
  activeUserId: null,
  sidebarCollapsed: false,
  mobileNavOpen: false,
  activeModal: null,

  initSidebarForUser: (userId) => {
    try {
      const key = getUserScopedKey("athena_sidebar_collapsed", userId);
      const isCollapsed = localStorage.getItem(key) === "true";
      set({ activeUserId: userId, sidebarCollapsed: isCollapsed });
    } catch {
      set({ activeUserId: userId, sidebarCollapsed: false });
    }
  },

  setSidebarCollapsed: (collapsed, userId) => {
    const targetUserId = userId || get().activeUserId;
    try {
      const key = getUserScopedKey("athena_sidebar_collapsed", targetUserId);
      localStorage.setItem(key, String(collapsed));
    } catch {
      // ignore storage error
    }
    set({ sidebarCollapsed: collapsed });
  },

  toggleSidebarCollapsed: (userId) =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      const targetUserId = userId || state.activeUserId;
      try {
        const key = getUserScopedKey("athena_sidebar_collapsed", targetUserId);
        localStorage.setItem(key, String(next));
      } catch {
        // ignore storage error
      }
      return { sidebarCollapsed: next };
    }),

  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  setActiveModal: (modalName) => set({ activeModal: modalName }),
}));
