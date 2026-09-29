import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../contexts/AuthContext.jsx";
import sessionService from "../../../../services/sessionService.js";
import StreakService from "../../../../services/streakService.js";
import taskService from "../../../../services/taskService.js";
import goalService from "../../../../services/goalService.js";

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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [tasksData, goalsData, streakData, todaysInsights] =
        await Promise.all([
          taskService.getTasks().catch(() => []),
          goalService.getGoals().catch(() => []),
          StreakService.fetchStreak().catch(() => null),
          sessionService.getTodaysInsights().catch(() => null),
        ]);

      setData({
        tasks: Array.isArray(tasksData) ? tasksData : [],
        goals: Array.isArray(goalsData) ? goalsData : [],
        streak: streakData || null,
        insights: todaysInsights?.insights || null,
      });
    } catch (err) {
      console.error("Failed to load Today data", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived today's tasks
  const todayTasks = useMemo(() => {
    const todayStr = new Date().toDateString();
    return data.tasks
      .filter((t) => {
        if (!t.plannedDate) return false;
        return new Date(t.plannedDate).toDateString() === todayStr;
      })
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
          taskIds:         [task._id],
          title:           task.title,
          source:          "today",
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
          plannedDate: new Date(),
          priority: "medium",
          order: todayTasks.length,
        });

        if (created) {
          setData((prev) => ({
            ...prev,
            tasks: [...prev.tasks, created],
          }));
          return true;
        }
      } catch (err) {
        console.error("Failed to create task:", err);
      }
      return false;
    },
    [todayTasks.length]
  );

  return {
    isLoading,
    isError,
    refetch: loadData,
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
    progress: {
      focusMinutes,
      targetMinutes,
      progressPercent,
      remainingMinutes,
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
    },
  };
};
