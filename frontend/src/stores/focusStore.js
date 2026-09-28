import { create } from "zustand";

export const useFocusStore = create((set) => ({
  activeSessionId: null,
  sessionState: "idle", // 'idle' | 'running' | 'paused' | 'completed'

  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setSessionState: (state) => set({ sessionState: state }),
}));
