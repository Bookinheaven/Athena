import { create } from "zustand";

export const useUIStore = create((set) => ({
  sidebarCollapsed: (() => {
    try {
      return localStorage.getItem("athena_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  })(),
  mobileNavOpen: false,
  activeModal: null,

  setSidebarCollapsed: (collapsed) => {
    try {
      localStorage.setItem("athena_sidebar_collapsed", String(collapsed));
    } catch {
      // ignore storage error
    }
    set({ sidebarCollapsed: collapsed });
  },

  toggleSidebarCollapsed: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      try {
        localStorage.setItem("athena_sidebar_collapsed", String(next));
      } catch {
        // ignore storage error
      }
      return { sidebarCollapsed: next };
    }),

  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  setActiveModal: (modalName) => set({ activeModal: modalName }),
}));
