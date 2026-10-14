import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../contexts/AuthContext.jsx";
import sessionService from "../../../../services/sessionService.js";
import StreakService from "../../../../services/streakService.js";
import taskService from "../../../../services/taskService.js";
import goalService from "../../../../services/goalService.js";
import routineService from "../../../../services/routineService.js";
import { isTaskPlannedForToday, getTodayProductDate } from "@/utils/dateUtils.js";
import toast from "react-hot-toast";

export const formatMinutes = (minutes = 0) => {
  if (isNaN(minutes) || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const useTodayData = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState({
    tasks: [],
    goals: [],
    streak: null,
    insights: null,
  });

  const [routineOccurrences, setRoutineOccurrences] = useState([]);
  const [isRoutinesLoading, setIsRoutinesLoading] = useState(true);
  const [isRoutinesError, setIsRoutinesError] = useState(false);

  const loadData = useCallback(async ({ isInitial = false } = {}) => {
    if (isInitial) {
      setIsLoading(true);
      setIsError(false);
      setIsRoutinesLoading(true);
      setIsRoutinesError(false);
    }
    try {
      const [tasksData, goalsData, streakData, todaysInsights, routinesData] =
        await Promise.all([
          taskService.getTasks().catch(() => []),
          goalService.getGoals().catch(() => []),
          StreakService.fetchStreak().catch(() => null),
          sessionService.getTodaysInsights().catch(() => null),
          routineService.getTodayOccurrences().catch((err) => {
            console.error("Failed to load today routine occurrences:", err);
            return null;
          }),
        ]);

      setData({
        tasks: Array.isArray(tasksData) ? tasksData : [],
        goals: Array.isArray(goalsData) ? goalsData : [],
        streak: streakData || null,
        insights: todaysInsights?.insights || null,
      });

      if (routinesData === null) {
        if (isInitial) setIsRoutinesError(true);
      } else {
        // Exclude occurrences for archived routines from Today dashboard
        const activeOccurrences = Array.isArray(routinesData)
          ? routinesData.filter((occ) => occ.routineStatus !== "archived" && occ.status !== "archived")
          : [];
        setRoutineOccurrences(activeOccurrences);
        setIsRoutinesError(false);
      }
    } catch (err) {
      console.error("Failed to load Today data", err);
      if (isInitial) setIsError(true);
    } finally {
      if (isInitial) {
        setIsLoading(false);
        setIsRoutinesLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    return loadData({ isInitial: true });
  }, [loadData]);

  useEffect(() => {
    loadData({ isInitial: true });
  }, [loadData]);

  // Synchronize whenever task/outcome/routine changes occur across Today, Planner, or Focus
  useEffect(() => {
    const handleChanged = () => {
      loadData({ isInitial: false });
    };
    window.addEventListener("athena:tasks-changed", handleChanged);
    window.addEventListener("athena:routines-changed", handleChanged);
    return () => {
      window.removeEventListener("athena:tasks-changed", handleChanged);
      window.removeEventListener("athena:routines-changed", handleChanged);
    };
  }, [loadData]);

  // Derived today's tasks using canonical product date matching (drift-proof across timezones)
  const todayTasks = useMemo(() => {
    return data.tasks.filter((t) => isTaskPlannedForToday(t))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [data.tasks]);

  const completedTasks = useMemo(() => {
    return todayTasks.filter((t) => t.status === "completed");
  }, [todayTasks]);

  const nextTask = useMemo(() => {
    return todayTasks.find(
      (t) => t.status !== "completed" && t.status !== "cancelled"
    );
  }, [todayTasks]);

  // Derived metrics
  const targetMinutes = data.streak?.dailyTargetMinutes || 25;
  const focusMinutes = data.streak?.focusMinutes || 0;
  const progressPercent = Math.min(
    100,
    Math.round((focusMinutes / targetMinutes) * 100)
  );
  const remainingMinutes = Math.max(0, targetMinutes - focusMinutes);
  const streakDays = data.streak?.currentStreak || 0;

  // Header copy
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName =
    user?.firstName ||
    user?.fullName?.split(" ")[0] ||
    user?.name?.split(" ")[0] ||
    user?.username ||
    "there";

  const greeting = `${getGreeting()}, ${displayName}`;

  // Actions
  // Navigate to Focus with context only.
  // Session creation is now owned by the Focus runtime (useFocusRuntime),
  // eliminating the double-start race.
  const handleStartFocus = useCallback(
    (task) => {
      if (!task) return;
      navigate("/focus-page", {
        state: {
          taskIds: [task._id],
          title: task.title,
          source: "today",
          plannedDuration: 25 * 60,
        },
      });
    },
    [navigate]
  );

  const handleToggleTaskStatus = useCallback(
    async (taskId, currentStatus) => {
      const newStatus = currentStatus === "completed" ? "todo" : "completed";
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t._id === taskId ? { ...t, status: newStatus } : t
        ),
      }));

      try {
        await taskService.updateTask(taskId, { status: newStatus });
        window.dispatchEvent(new CustomEvent("athena:tasks-changed"));
      } catch (err) {
        console.error("Failed to update task status:", err);
        // Revert on failure
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t._id === taskId ? { ...t, status: currentStatus } : t
          ),
        }));
      }
    },
    []
  );

  const handleQuickAddTask = useCallback(
    async (title) => {
      if (!title?.trim()) return false;
      try {
        const created = await taskService.createTask({
          title: title.trim(),
          plannedDate: getTodayProductDate(),
          priority: "medium",
          order: todayTasks.length,
        });

        if (created) {
          setData((prev) => {
            const cleanId = created._id || created.id;
            if (prev.tasks.some((t) => (t._id || t.id) === cleanId)) return prev;
            return {
              ...prev,
              tasks: [...prev.tasks, created],
            };
          });
          window.dispatchEvent(new CustomEvent("athena:tasks-changed"));
          return true;
        }
      } catch (err) {
        console.error("Failed to create task:", err);
      }
      return false;
    },
    [todayTasks.length]
  );

  const handleApplyTarget = useCallback(
    async (targetMinutes = null) => {
      try {
        await StreakService.applyAdaptiveTarget(targetMinutes);
        await loadData();
        return true;
      } catch (err) {
        console.error("Failed to apply adaptive target:", err);
        return false;
      }
    },
    [loadData]
  );

  const handleCompleteRoutineStep = useCallback(
    async (occurrenceId, stepId, isCompleted = true) => {
      const prevOccurrences = [...routineOccurrences];

      // Optimistic update
      setRoutineOccurrences((prev) =>
        prev.map((occ) => {
          if ((occ.id || occ._id) !== occurrenceId) return occ;
          const updatedSteps = (occ.steps || []).map((s) => {
            if ((s.id || s._id) !== stepId) return s;
            return {
              ...s,
              status: isCompleted ? "completed" : "pending",
              completedAt: isCompleted ? new Date().toISOString() : null,
            };
          });

          const completedCount = updatedSteps.filter((s) => s.status === "completed").length;
          const totalCount = updatedSteps.length;
          let newStatus = "pending";
          if (completedCount === totalCount && totalCount > 0) {
            newStatus = "completed";
          } else if (completedCount > 0) {
            newStatus = "in_progress";
          }

          return {
            ...occ,
            steps: updatedSteps,
            completedSteps: completedCount,
            status: newStatus,
            completedAt: newStatus === "completed" ? new Date().toISOString() : null,
          };
        })
      );

      try {
        const canonical = await routineService.completeStep(occurrenceId, stepId, isCompleted);
        if (canonical) {
          setRoutineOccurrences((prev) =>
            prev.map((occ) => ((occ.id || occ._id) === occurrenceId ? canonical : occ))
          );
        }
        return true;
      } catch (err) {
        console.error("Failed to complete routine step:", err);
        toast.error(err.message || "Failed to update routine step");
        // Revert on failure
        setRoutineOccurrences(prevOccurrences);
        return false;
      }
    },
    [routineOccurrences]
  );

  const handleSkipRoutineOccurrence = useCallback(
    async (occurrenceId) => {
      const prevOccurrences = [...routineOccurrences];

      // Optimistic update
      setRoutineOccurrences((prev) =>
        prev.map((occ) =>
          (occ.id || occ._id) === occurrenceId ? { ...occ, status: "skipped" } : occ
        )
      );

      try {
        const canonical = await routineService.skipOccurrence(occurrenceId);
        if (canonical) {
          setRoutineOccurrences((prev) =>
            prev.map((occ) => ((occ.id || occ._id) === occurrenceId ? canonical : occ))
          );
        }
        toast.success("Routine skipped for today");
        return true;
      } catch (err) {
        console.error("Failed to skip routine occurrence:", err);
        toast.error(err.message || "Failed to skip routine");
        // Revert on failure
        setRoutineOccurrences(prevOccurrences);
        return false;
      }
    },
    [routineOccurrences]
  );

  const handleRefetchRoutines = useCallback(async () => {
    setIsRoutinesLoading(true);
    setIsRoutinesError(false);
    try {
      const data = await routineService.getTodayOccurrences();
      setRoutineOccurrences(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to refetch routines:", err);
      setIsRoutinesError(true);
    } finally {
      setIsRoutinesLoading(false);
    }
  }, []);

  return {
    isLoading,
    isError,
    refetch,
    header: {
      greeting,
      currentDate,
      displayName,
    },
    tasks: {
      all: data.tasks,
      today: todayTasks,
      completed: completedTasks,
      nextTask,
      goals: data.goals,
    },
    routines: {
      occurrences: routineOccurrences,
      isLoading: isRoutinesLoading,
      isError: isRoutinesError,
    },
    progress: {
      focusMinutes,
      targetMinutes,
      progressPercent,
      remainingMinutes,
      adaptiveTarget: data.streak?.adaptiveTarget || null,
    },
    streak: {
      streakDays,
      focusMinutes,
      targetMinutes,
    },
    insight: data.insights,
    actions: {
      handleStartFocus,
      handleToggleTaskStatus,
      handleQuickAddTask,
      handleApplyTarget,
      handleCompleteRoutineStep,
      handleSkipRoutineOccurrence,
      handleRefetchRoutines,
    },
  };
};
