import { create } from "zustand";

export const usePlannerStore = create((set) => ({
  selectedDate: new Date().toISOString().split("T")[0],
  viewMode: "day", // 'day' | 'week' | 'month'

  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (viewMode) => set({ viewMode }),
}));
