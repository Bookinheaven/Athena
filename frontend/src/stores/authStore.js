import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  status: "idle", // 'idle' | 'authenticated' | 'unauthenticated'

  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
      status: user ? "authenticated" : "unauthenticated",
    }),

  resetAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      status: "unauthenticated",
    }),
}));
