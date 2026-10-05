import { useState, useMemo, useCallback } from "react";
import { usePlannerStore } from "../../../stores/plannerStore.js";
import { useTimelineData, START_HOUR } from "../hooks/useTimelineData.js";
import TimelineHeader from "./TimelineHeader.jsx";
import TimelineGrid from "./TimelineGrid.jsx";
import UnscheduledTasks from "./UnscheduledTasks.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ListPlus, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export default function TimelineView({
  tasks = [],
  goals = [],
  onOpenCreateTask,
}) {
  const { selectedDate, setSelectedDate } = usePlannerStore();
  const [mobileView, setMobileView] = useState("timeline"); // 'timeline' | 'tasks'

  const {
    blocks,
    isLoading,
    isSaving,
    createBlock,
    updateBlock,
    deleteBlock,
    startFocus,
    dateNav,
  } = useTimelineData(selectedDate, setSelectedDate);

  // Quick schedule a task from the unscheduled queue into the next open slot or default 9 AM
  const handleQuickSchedule = useCallback(
    async (taskId, durationMinutes = 60) => {
      const [year, month, day] = selectedDate.split("-").map(Number);
      const effectiveMinutes = durationMinutes || 60;

      // Find an open hour slot
      const existingStarts = new Set(
        blocks.map((b) => new Date(b.startTime).getHours())
      );

      let targetHour = 9; // start search from 9 AM
      for (let h = 9; h <= 18; h++) {
        if (!existingStarts.has(h)) {
          targetHour = h;
          break;
        }
      }

      const startTime = new Date(year, month - 1, day, targetHour, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + effectiveMinutes * 60 * 1000);

      await createBlock({
        taskId,
        startTime,
        endTime,
        date: selectedDate,
      });
    },
    [selectedDate, blocks, createBlock]
  );

  // Click on empty grid slot to schedule first unscheduled task or prompt
  const handleEmptySlotClick = useCallback(
    async (snappedMinutes) => {
      const unscheduled = tasks.filter(
        (t) =>
          t.status !== "completed" &&
          t.status !== "cancelled" &&
          !blocks.some((b) => (b.taskId?._id || b.taskId)?.toString() === t._id.toString())
      );

      if (unscheduled.length === 0) {
        toast("All your active tasks are already scheduled on the timeline.");
        return;
      }

      const [year, month, day] = selectedDate.split("-").map(Number);
      const startHour = Math.floor(snappedMinutes / 60);
      const startMin = snappedMinutes % 60;
      const startTime = new Date(year, month - 1, day, startHour, startMin, 0, 0);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      // Schedule top unscheduled task
      const firstTask = unscheduled[0];
      await createBlock({
        taskId: firstTask._id,
        startTime,
        endTime,
        date: selectedDate,
      });
    },
    [tasks, blocks, selectedDate, createBlock]
  );

  return (
    <div className="space-y-6">
      {/* 1. Date Navigation & Stats Header */}
      <TimelineHeader
        selectedDate={selectedDate}
        dateNav={dateNav}
        blocks={blocks}
        isSaving={isSaving}
      />

      {/* Mobile Toggle Controls */}
      <div className="flex sm:hidden items-center justify-center p-1 bg-secondary/40 border border-border/40 rounded-xl">
        <button
          onClick={() => setMobileView("timeline")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mobileView === "timeline"
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>
        <button
          onClick={() => setMobileView("tasks")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mobileView === "tasks"
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListPlus className="w-3.5 h-3.5" />
          <span>Task Queue</span>
        </button>
      </div>

      {/* 2. Main Timeline + Unscheduled Tasks Layout */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Skeleton className="h-[700px] w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-[700px] w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Timeline Grid (8 cols on desktop) */}
          <div
            className={`lg:col-span-8 ${
              mobileView === "timeline" ? "block" : "hidden sm:block"
            }`}
          >
            <TimelineGrid
              blocks={blocks}
              selectedDate={selectedDate}
              onCreateBlock={createBlock}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
              onStartFocus={startFocus}
              onEmptySlotClick={handleEmptySlotClick}
            />
          </div>

          {/* Unscheduled Task Queue (4 cols on desktop) */}
          <div
            className={`lg:col-span-4 ${
              mobileView === "tasks" ? "block" : "hidden sm:block"
            }`}
          >
            <UnscheduledTasks
              tasks={tasks}
              goals={goals}
              scheduledBlocks={blocks}
              selectedDate={selectedDate}
              onScheduleTask={handleQuickSchedule}
              onOpenCreateTask={onOpenCreateTask}
            />
          </div>
        </div>
      )}
    </div>
  );
}
