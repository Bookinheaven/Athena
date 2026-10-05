import { create } from "zustand";
import { getTodayProductDate } from "@/utils/dateUtils.js";

/**
 * Planner Store
 * 
 * Centralized client-side state for the Planner interface.
 */
export const usePlannerStore = create((set) => ({
  activeTab: "today", // 'today' | 'tasks' | 'goals' | 'notes'
  selectedDate: getTodayProductDate(),
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
  reset: () =>
    set({
      activeTab: "today",
      selectedDate: getTodayProductDate(),
      viewMode: "day",
      selectedTaskId: null,
      selectedGoalId: null,
      selectedNoteId: null,
      taskFilter: "all",
      searchQuery: "",
    }),
}));
