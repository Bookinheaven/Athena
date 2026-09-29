import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import plannerService from "../../../../services/plannerService.js";
import taskService from "../../../../services/taskService.js";
import goalService from "../../../../services/goalService.js";
import notesService from "../../../../services/notesService.js";
import sessionService from "../../../../services/sessionService.js";
import { usePlannerStore } from "../../../stores/plannerStore.js";

export const usePlannerData = () => {
  const navigate = useNavigate();
  const { setSelectedTaskId, setSelectedGoalId, setSelectedNoteId } =
    usePlannerStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskDefaultGoalId, setTaskDefaultGoalId] = useState(null);
  const [taskDefaultPlannedToday, setTaskDefaultPlannedToday] = useState(false);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [tasksToStart, setTasksToStart] = useState([]);

  // 1. Initial Consolidated Data Fetch
  const loadPlannerData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [plannerRes, sessionRes] = await Promise.all([
        plannerService.getPlanner().catch(() => null),
        sessionService.getActiveSession().catch(() => null),
      ]);

      if (plannerRes && (plannerRes.tasks || plannerRes.goals || plannerRes.notes)) {
        setTasks(Array.isArray(plannerRes.tasks) ? plannerRes.tasks : []);
        setGoals(Array.isArray(plannerRes.goals) ? plannerRes.goals : []);

        const notesArray = Array.isArray(plannerRes.notes?.data)
          ? plannerRes.notes.data
          : Array.isArray(plannerRes.notes)
          ? plannerRes.notes
          : [];
        setNotes(
          notesArray.map((n) => ({
            ...n,
            id: n._id || n.id,
            taskId: n.task,
          }))
        );
      } else {
        // Fallback to individual services if combined endpoint is unavailable
        const [tasksRes, goalsRes, notesRes] = await Promise.all([
          taskService.getTasks().catch(() => []),
          goalService.getGoals().catch(() => []),
          notesService.getNotes().catch(() => []),
        ]);
        setTasks(Array.isArray(tasksRes) ? tasksRes : []);
        setGoals(Array.isArray(goalsRes) ? goalsRes : []);
        const notesArr = Array.isArray(notesRes?.data)
          ? notesRes.data
          : Array.isArray(notesRes)
          ? notesRes
          : [];
        setNotes(
          notesArr.map((n) => ({
            ...n,
            id: n._id || n.id,
            taskId: n.task,
          }))
        );
      }

      if (sessionRes?.status === "active") {
        setActiveSession(sessionRes);
      }
    } catch (err) {
      console.error("Failed to load planner data:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlannerData();
  }, [loadPlannerData]);

  // Derived Collections
  const todayStr = useMemo(() => new Date().toDateString(), []);

  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.plannedDate) return false;
      return new Date(t.plannedDate).toDateString() === todayStr;
    });
  }, [tasks, todayStr]);

  const activeTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.status !== "completed" && t.status !== "cancelled"
    );
  }, [tasks]);

  // 2. Task Mutations
  const handleToggleTaskStatus = useCallback(
    async (taskId, currentStatus) => {
      const newStatus = currentStatus === "completed" ? "todo" : "completed";
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );

      try {
        await taskService.updateTask(taskId, { status: newStatus });
      } catch (err) {
        console.error("Failed to toggle status:", err);
        setTasks((prev) =>
          prev.map((t) =>
            t._id === taskId ? { ...t, status: currentStatus } : t
          )
        );
      }
    },
    []
  );

  const handleAddToToday = useCallback(async (taskId) => {
    const today = new Date();
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, plannedDate: today } : t))
    );
    try {
      await taskService.updateTask(taskId, { plannedDate: today });
    } catch (err) {
      console.error("Failed to add task to today:", err);
    }
  }, []);

  const handleRemoveFromToday = useCallback(async (taskId) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, plannedDate: null } : t))
    );
    try {
      await taskService.updateTask(taskId, { plannedDate: null });
    } catch (err) {
      console.error("Failed to remove task from today:", err);
    }
  }, []);

  const handleSaveTask = useCallback(
    async (payload, taskId) => {
      if (taskId) {
        const updated = await taskService.updateTask(taskId, payload);
        setTasks((prev) =>
          prev.map((t) =>
            t._id === taskId ? { ...t, ...payload, ...updated } : t
          )
        );
      } else {
        const created = await taskService.createTask({
          ...payload,
          order: tasks.length,
        });
        if (created) {
          setTasks((prev) => [...prev, created]);
          setSelectedTaskId(created._id);
        }
      }
    },
    [tasks.length, setSelectedTaskId]
  );

  const handleDeleteTask = useCallback(
    async (taskId) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setSelectedTaskId((prev) => (prev === taskId ? null : prev));
      try {
        await taskService.deleteTask(taskId);
      } catch (err) {
        console.error("Failed to delete task:", err);
      }
    },
    [setSelectedTaskId]
  );

  // 3. Goal Mutations
  const handleSaveGoal = useCallback(
    async (payload, goalId) => {
      if (goalId) {
        const updated = await goalService.updateGoal(goalId, payload);
        setGoals((prev) =>
          prev.map((g) =>
            g._id === goalId ? { ...g, ...payload, ...updated } : g
          )
        );
      } else {
        const created = await goalService.createGoal(payload);
        if (created) {
          setGoals((prev) => [created, ...prev]);
          setSelectedGoalId(created._id);
        }
      }
    },
    [setSelectedGoalId]
  );

  const handleDeleteGoal = useCallback(
    async (goalId) => {
      setGoals((prev) => prev.filter((g) => g._id !== goalId));
      setSelectedGoalId((prev) => (prev === goalId ? null : prev));
      try {
        await goalService.deleteGoal(goalId);
      } catch (err) {
        console.error("Failed to delete goal:", err);
      }
    },
    [setSelectedGoalId]
  );

  // 4. Note Mutations
  const handleSaveNote = useCallback(
    async (payload, noteId) => {
      if (noteId) {
        await notesService.updateNote(noteId, payload);
        setNotes((prev) =>
          prev.map((n) =>
            (n._id || n.id) === noteId ? { ...n, ...payload } : n
          )
        );
      } else {
        const created = await notesService.createNotes(payload);
        const raw = created?.data || created;
        if (raw) {
          const formatted = { ...raw, id: raw._id || raw.id };
          setNotes((prev) => [formatted, ...prev]);
          setSelectedNoteId(formatted.id);
        }
      }
    },
    [setSelectedNoteId]
  );

  const handleDeleteNote = useCallback(
    async (noteId) => {
      setNotes((prev) => prev.filter((n) => (n._id || n.id) !== noteId));
      setSelectedNoteId((prev) => (prev === noteId ? null : prev));
      try {
        await notesService.deleteNote(noteId);
      } catch (err) {
        console.error("Failed to delete note:", err);
      }
    },
    [setSelectedNoteId]
  );

  // 5. Focus Navigation
  const handleStartFocus = useCallback((taskOrTasks) => {
    const arr = Array.isArray(taskOrTasks) ? taskOrTasks : [taskOrTasks];
    setTasksToStart(arr);
    setDurationModalOpen(true);
  }, []);

  const handleConfirmStartFocus = useCallback(
    (durationMinutes, taskList) => {
      const durationSeconds = durationMinutes * 60;
      const title =
        taskList.length > 1
          ? `Batch Focus (${taskList.length} tasks)`
          : taskList[0]?.title || "Focus Session";
      const taskIds = taskList.map((t) => t._id);

      // Session creation is owned by Focus runtime (useFocusRuntime).
      // Navigate with context only — no pre-creation race.
      setDurationModalOpen(false);
      navigate("/focus-page", {
        state: {
          taskIds,
          title,
          source:          "planner",
          plannedDuration: durationSeconds,
        },
      });
    },
    [navigate]
  );

  // 6. Modal Open Helpers
  const openCreateTask = useCallback(
    (defaultGoalId = null, defaultToday = false) => {
      setEditingTask(null);
      setTaskDefaultGoalId(defaultGoalId);
      setTaskDefaultPlannedToday(defaultToday);
      setTaskModalOpen(true);
    },
    []
  );

  const openEditTask = useCallback((task) => {
    setEditingTask(task);
    setTaskDefaultGoalId(null);
    setTaskDefaultPlannedToday(false);
    setTaskModalOpen(true);
  }, []);

  const openCreateGoal = useCallback(() => {
    setEditingGoal(null);
    setGoalModalOpen(true);
  }, []);

  const openEditGoal = useCallback((goal) => {
    setEditingGoal(goal);
    setGoalModalOpen(true);
  }, []);

  const openCreateNote = useCallback(() => {
    setEditingNote(null);
    setNoteModalOpen(true);
  }, []);

  return {
    isLoading,
    isError,
    refetch: loadPlannerData,
    activeSession,
    tasks,
    todayTasks,
    activeTasks,
    goals,
    notes,
    modals: {
      taskModalOpen,
      setTaskModalOpen,
      editingTask,
      taskDefaultGoalId,
      taskDefaultPlannedToday,
      goalModalOpen,
      setGoalModalOpen,
      editingGoal,
      noteModalOpen,
      setNoteModalOpen,
      editingNote,
      durationModalOpen,
      setDurationModalOpen,
      tasksToStart,
    },
    actions: {
      toggleTaskStatus: handleToggleTaskStatus,
      addToToday: handleAddToToday,
      removeFromToday: handleRemoveFromToday,
      saveTask: handleSaveTask,
      deleteTask: handleDeleteTask,
      saveGoal: handleSaveGoal,
      deleteGoal: handleDeleteGoal,
      saveNote: handleSaveNote,
      deleteNote: handleDeleteNote,
      startFocus: handleStartFocus,
      confirmStartFocus: handleConfirmStartFocus,
      openCreateTask,
      openEditTask,
      openCreateGoal,
      openEditGoal,
      openCreateNote,
    },
  };
};
