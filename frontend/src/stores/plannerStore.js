import { create } from "zustand";

export const usePlannerStore = create((set) => ({
  activeTab: "today", // 'today' | 'tasks' | 'goals' | 'notes'
  selectedDate: new Date().toISOString().split("T")[0],
  viewMode: "day", // 'day' | 'week' | 'month'
  selectedTaskId: null,
  selectedGoalId: null,
  selectedNoteId: null,
  taskFilter: "all", // 'all' | 'active' | 'completed' | 'today'
  searchQuery: "",

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
  setSelectedGoalId: (selectedGoalId) => set({ selectedGoalId }),
  setSelectedNoteId: (selectedNoteId) => set({ selectedNoteId }),
  setTaskFilter: (taskFilter) => set({ taskFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
