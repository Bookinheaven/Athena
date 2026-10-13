import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import scheduleService from "../../../../services/scheduleService.js";
import { getTodayProductDate } from "@/utils/dateUtils.js";
import toast from "react-hot-toast";

export const START_HOUR = 7;
export const END_HOUR = 23;
export const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 960 minutes

export const useTimelineData = (selectedDate, setSelectedDate) => {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [capacityAlert, setCapacityAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch adaptive capacity alert for selected date
  const loadCapacityAlert = useCallback(async (dateStr) => {
    if (!dateStr) return;
    try {
      const alert = await scheduleService.getCapacityAlert({ date: dateStr });
      setCapacityAlert(alert || null);
    } catch (err) {
      console.error("Failed to load capacity alert:", err);
    }
  }, []);

  // Fetch blocks for the selected calendar date
  const loadScheduleBlocks = useCallback(async (dateStr) => {
    if (!dateStr) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await scheduleService.getScheduleBlocks({ date: dateStr });
      setBlocks(Array.isArray(data) ? data : []);
      loadCapacityAlert(dateStr);
    } catch (err) {
      console.error("Failed to load schedule blocks:", err);
      setError(err.message || "Failed to load timeline schedule");
      toast.error("Could not load timeline for selected date");
    } finally {
      setIsLoading(false);
    }
  }, [loadCapacityAlert]);

  useEffect(() => {
    loadScheduleBlocks(selectedDate);
  }, [selectedDate, loadScheduleBlocks]);

  // Date Navigation Helpers
  const goToDate = useCallback(
    (newDateStr) => {
      if (setSelectedDate) setSelectedDate(newDateStr);
    },
    [setSelectedDate]
  );

  const goToToday = useCallback(() => {
    goToDate(getTodayProductDate());
  }, [goToDate]);

  const goToPrevDay = useCallback(() => {
    if (!selectedDate) return;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() - 1);
    const prevStr = dt.toISOString().split("T")[0];
    goToDate(prevStr);
  }, [selectedDate, goToDate]);

  const goToNextDay = useCallback(() => {
    if (!selectedDate) return;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + 1);
    const nextStr = dt.toISOString().split("T")[0];
    goToDate(nextStr);
  }, [selectedDate, goToDate]);

  // Create a new ScheduleBlock
  const handleCreateBlock = useCallback(
    async ({ taskId, startTime, endTime, date }) => {
      const targetDate = date || selectedDate;
      setIsSaving(true);
      try {
        const created = await scheduleService.createScheduleBlock({
          taskId,
          date: targetDate,
          startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
          endTime: endTime instanceof Date ? endTime.toISOString() : endTime,
        });

        if (created) {
          setBlocks((prev) => [...prev, created]);
          loadCapacityAlert(selectedDate);
          toast.success("Task scheduled on timeline");
          return created;
        }
      } catch (err) {
        console.error("Failed to create schedule block:", err);
        toast.error(err.message || "Failed to schedule task");
      } finally {
        setIsSaving(false);
      }
    },
    [selectedDate, loadCapacityAlert]
  );

  // Update an existing ScheduleBlock (optimistic with rollback)
  const handleUpdateBlock = useCallback(
    async (blockId, updates) => {
      const originalBlocks = [...blocks];
      setBlocks((prev) =>
        prev.map((b) => (b._id === blockId ? { ...b, ...updates } : b))
      );
      setIsSaving(true);
      try {
        const payload = { ...updates };
        if (payload.startTime instanceof Date) {
          payload.startTime = payload.startTime.toISOString();
        }
        if (payload.endTime instanceof Date) {
          payload.endTime = payload.endTime.toISOString();
        }
        if (payload.date instanceof Date) {
          payload.date = payload.date.toISOString();
        }

        const updated = await scheduleService.updateScheduleBlock(blockId, payload);
        if (updated) {
          setBlocks((prev) =>
            prev.map((b) => (b._id === blockId ? updated : b))
          );
          loadCapacityAlert(selectedDate);
        }
      } catch (err) {
        console.error("Failed to update schedule block:", err);
        toast.error(err.message || "Failed to update schedule block");
        // Rollback
        setBlocks(originalBlocks);
      } finally {
        setIsSaving(false);
      }
    },
    [blocks, selectedDate, loadCapacityAlert]
  );

  // Delete a ScheduleBlock (optimistic with rollback)
  const handleDeleteBlock = useCallback(
    async (blockId) => {
      const originalBlocks = [...blocks];
      setBlocks((prev) => prev.filter((b) => b._id !== blockId));
      try {
        await scheduleService.deleteScheduleBlock(blockId);
        loadCapacityAlert(selectedDate);
        toast.success("Schedule block removed");
      } catch (err) {
        console.error("Failed to delete schedule block:", err);
        toast.error(err.message || "Failed to remove schedule block");
        // Rollback
        setBlocks(originalBlocks);
      }
    },
    [blocks, selectedDate, loadCapacityAlert]
  );

  // Start Focus session from a ScheduleBlock.
  // Session creation is owned by Focus runtime (useFocusRuntime);
  // we pass scheduleBlockId in navigation context so the runtime can
  // validate the block and derive plannedDuration from the backend.
  const handleStartFocus = useCallback(
    (block) => {
      if (!block || block.status !== "scheduled") {
        toast.error("Can only start Focus from a scheduled block");
        return;
      }

      const durationSeconds = block.durationMinutes * 60;
      const task   = block.taskId;
      const taskId = task?._id || task;
      const title  = task?.title || "Scheduled Focus";

      navigate("/focus-page", {
        state: {
          scheduleBlockId: block._id,
          taskIds:         taskId ? [taskId] : [],
          title,
          source:          "timeline",
          plannedDuration: durationSeconds,
          startTime:       block.startTime,
          endTime:         block.endTime,
          durationMinutes: block.durationMinutes,
        },
      });
    },
    [navigate]
  );

  return {
    blocks,
    capacityAlert,
    isLoading,
    isSaving,
    error,
    refetch: () => loadScheduleBlocks(selectedDate),
    refreshCapacityAlert: () => loadCapacityAlert(selectedDate),
    createBlock: handleCreateBlock,
    updateBlock: handleUpdateBlock,
    deleteBlock: handleDeleteBlock,
    startFocus: handleStartFocus,
    dateNav: {
      goToDate,
      goToToday,
      goToPrevDay,
      goToNextDay,
    },
  };
};
