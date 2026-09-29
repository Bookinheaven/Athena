import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  useFocus,
  useFocusTimer,
  PHASES,
  FocusWorkspace,
  useNotes,
} from "@/features/focus";
import sessionService from "@services/sessionService.js";
import taskService from "@services/taskService.js";

const FocusSession = () => {
  const location = useLocation();
  const {
    runtime,
    settings,
    modifySettings,
    userId,
    sessionReview,
    updateReview: handleReviewUpdate,
    toggleReviewDistraction: handleDistractionToggle,
    submitSessionReview: handleFinalSaveAndStartNew,
    isSubmittingReview,
  } = useFocus();

  // Navigation context passed by Today / Planner / Timeline
  const navContext = location.state || null;
  const navContextHandledRef = useRef(null);

  // Explicit user intent to start a new task session
  const isExplicitTaskRequest = Boolean(
    navContext &&
      navContext.source &&
      (navContext.title || (navContext.taskIds && navContext.taskIds.length > 0))
  );

  // If arriving with navigation context and runtime can accept new session (idle or completed)
  // or user explicitly initiated a new focus session for a task
  const canStartNew = runtime.isIdle || runtime.isCompleted || isExplicitTaskRequest;

  useEffect(() => {
    if (navContext && canStartNew && navContextHandledRef.current !== navContext) {
      navContextHandledRef.current = navContext;
      runtime.commands.startWithContext(navContext);
      try {
        window.history.replaceState({}, document.title);
      } catch {}
    }
  }, [navContext, canStartNew, runtime.commands]);

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

  // Todo checklist synced with Focus runtime
  const [newTodo, setNewTodo] = useState("");
  const hasHydratedTasksRef = useRef(null);

  const updateTodos = useCallback(
    (newTodos) => {
      commands.setTodos(newTodos);
    },
    [commands]
  );

  // Reset hydration tracker when sessionId changes
  useEffect(() => {
    hasHydratedTasksRef.current = null;
  }, [sessionId]);

  // Sync tasks from backend into runtime todos only once if todos are empty
  useEffect(() => {
    if (phase === PHASES.LOADING || phase === PHASES.IDLE) return;
    if (hasHydratedTasksRef.current === (sessionId || "active")) return;
    if (todos && todos.length > 0) {
      hasHydratedTasksRef.current = sessionId || "active";
      return;
    }

    const fetchTasks = async () => {
      try {
        hasHydratedTasksRef.current = sessionId || "active";
        const tasks = await taskService.getTasks();
        const relevantIds = runtime.taskIds || [];
        const filtered =
          relevantIds.length > 0
            ? tasks.filter((t) => relevantIds.includes(t._id || t.id))
            : tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");

        const mapped = filtered.map((t) => ({
          id: t._id || t.id,
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

        if (mapped.length > 0) {
          updateTodos(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch tasks for Focus:", err);
      }
    };

    fetchTasks();
  }, [phase, sessionId, runtime.taskIds, todos, updateTodos]);

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
      if (created?._id) {
        updateTodos(
          todos.map((t) => (t.id === optimisticId ? { ...t, id: created._id } : t))
        );
      }
    } catch (err) {
      console.error("Failed to create task in DB:", err);
    }
  }, [newTodo, todos, updateTodos]);

  const handleUpdateTodoStatus = useCallback(
    async (id, status) => {
      if (!id) return;
      updateTodos(
        todos.map((t) => {
          const match = String(t.id) === String(id) || String(t._id) === String(id);
          return match ? { ...t, status } : t;
        })
      );
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
      if (!id) return;
      updateTodos(
        todos.filter((t) => String(t.id) !== String(id) && String(t._id) !== String(id))
      );
      try {
        await taskService.deleteTask(id);
      } catch (err) {
        console.error("Failed to delete task:", err);
      }
    },
    [todos, updateTodos]
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
      isSubmittingReview={isSubmittingReview}
      navContext={navContext}
    />
  );
};

export default FocusSession;
