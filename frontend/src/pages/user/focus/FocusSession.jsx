import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@contexts/AuthContext";
import { useFocusRuntime } from "@/features/focus/hooks/useFocusRuntime.js";
import { useFocusTimer } from "@/features/focus/hooks/useFocusTimer.js";
import { useFocusSettings } from "@/features/focus/hooks/useFocusSettings.js";
import { PHASES } from "@/features/focus/runtime/constants.js";
import { FocusWorkspace } from "@/features/focus/components/FocusWorkspace.jsx";
import { useNotes } from "./hooks/useNotes.js";
import sessionService from "@services/sessionService.js";
import taskService from "@services/taskService.js";

const FocusSession = () => {
  const location = useLocation();
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  // Navigation context passed by Today / Planner / Timeline
  const navContext = location.state || null;

  // Focus settings
  const { settings, setSetting, saveSettingsToBackend } = useFocusSettings(userId);

  // Sound handler
  const handleSoundEvent = useCallback(({ event: soundEvent }) => {
    if (!settings.isSoundEnabled || !settings.soundOnTransition) return;
  }, [settings.isSoundEnabled, settings.soundOnTransition]);

  // Focus runtime
  const runtime = useFocusRuntime({
    context: navContext,
    settings,
    onSoundEvent: handleSoundEvent,
    userId,
  });

  const {
    phase,
    sessionId,
    todos,
    timerRef,
    commands,
  } = runtime;

  // RAF-driven timer clock for display
  const { elapsed, timeLeft } = useFocusTimer({
    timerRef,
    runtimeState: runtime.state,
  });

  // Scratchpad notes
  const { notes, createNote, updateNote, deleteNote } = useNotes();

  // Session review & distractions state
  const [sessionReview, setSessionReview] = useState({
    mood: null,
    focus: null,
    distractions: "",
  });

  const handleReviewUpdate = useCallback((field, value) => {
    setSessionReview((p) => ({ ...p, [field]: value }));
  }, []);

  const handleDistractionToggle = useCallback((distraction) => {
    setSessionReview((p) => {
      const current = (p.distractions || "")
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
      const lower = distraction.toLowerCase();
      const updated = current.includes(lower)
        ? current.filter((d) => d !== lower)
        : [...current, distraction];
      return { ...p, distractions: updated.join(", ") };
    });
  }, []);

  // Todo checklist synced with backend
  const [newTodo, setNewTodo] = useState("");

  const updateTodos = useCallback((newTodos) => {
    commands.setTodos(newTodos);
  }, [commands]);

  // Sync tasks from backend into todos when Focus loads
  useEffect(() => {
    if (phase === PHASES.LOADING || phase === PHASES.IDLE) return;
    const fetchTasks = async () => {
      try {
        const tasks = await taskService.getTasks();
        const mapped = tasks.map((t) => ({
          id: t._id,
          title: t.title,
          status:
            t.status === "completed"
              ? "Completed"
              : t.status === "in-progress"
              ? "In Progress"
              : t.status === "cancelled"
              ? "Cancelled"
              : "Not Started",
          createdAt: t.createdAt,
        }));
        updateTodos(mapped);
      } catch (err) {
        console.error("Failed to fetch tasks for Focus:", err);
      }
    };
    fetchTasks();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddTodo = useCallback(async () => {
    if (!newTodo.trim()) return;
    const optimisticId = Date.now().toString();
    const obj = {
      id: optimisticId,
      title: newTodo.trim(),
      status: "Not Started",
      createdAt: new Date().toISOString(),
    };
    updateTodos([...todos, obj]);
    setNewTodo("");

    try {
      const created = await taskService.createTask({
        title: obj.title,
        dueDate: new Date(),
        priority: "medium",
      });
      updateTodos(
        todos.map((t) => (t.id === optimisticId ? { ...t, id: created._id } : t))
      );
    } catch (err) {
      console.error("Failed to create task in DB:", err);
    }
  }, [newTodo, todos, updateTodos]);

  const handleUpdateTodoStatus = useCallback(
    async (id, status) => {
      updateTodos(todos.map((t) => (t.id === id ? { ...t, status } : t)));
      try {
        const backendStatus =
          status === "Completed"
            ? "completed"
            : status === "In Progress"
            ? "in-progress"
            : status === "Cancelled"
            ? "cancelled"
            : "todo";
        await taskService.updateTask(id, { status: backendStatus });
      } catch (err) {
        console.error("Failed to update task status:", err);
      }
    },
    [todos, updateTodos]
  );

  const handleDeleteTodo = useCallback(
    async (id) => {
      updateTodos(todos.filter((t) => t.id !== id));
      try {
        await taskService.deleteTask(id);
      } catch (err) {
        console.error("Failed to delete task:", err);
      }
    },
    [todos, updateTodos]
  );

  // Save feedback and complete session
  const handleFinalSaveAndStartNew = useCallback(async () => {
    await commands.forceSave();
    if (sessionId) {
      try {
        await sessionService.sessionFeedback({
          sessionId,
          feedback: sessionReview,
        });
      } catch (err) {
        console.error("Feedback save failed:", err);
      }
    }
    commands.stop();
    setSessionReview({ mood: null, focus: null, distractions: "" });
    createNote({ title: "", content: "<p></p>", task: null }).catch(console.error);
  }, [commands, sessionId, sessionReview, createNote]);

  // Settings persistence
  const modifySettings = useCallback(
    async (changed) => {
      for (const [k, v] of Object.entries(changed)) {
        setSetting(k, v);
      }
      await saveSettingsToBackend(changed);
    },
    [setSetting, saveSettingsToBackend]
  );

  return (
    <FocusWorkspace
      userId={userId}
      runtime={runtime}
      timerData={{ elapsed, timeLeft }}
      settings={settings}
      modifySettings={modifySettings}
      notesProps={{ notes, createNote, updateNote, deleteNote }}
      todos={todos}
      newTodo={newTodo}
      setNewTodo={setNewTodo}
      onAddTodo={handleAddTodo}
      onUpdateTodoStatus={handleUpdateTodoStatus}
      onDeleteTodo={handleDeleteTodo}
      sessionReview={sessionReview}
      onReviewUpdate={handleReviewUpdate}
      onDistractionToggle={handleDistractionToggle}
      onFinalSaveAndStartNew={handleFinalSaveAndStartNew}
      navContext={navContext}
    />
  );
};

export default FocusSession;
