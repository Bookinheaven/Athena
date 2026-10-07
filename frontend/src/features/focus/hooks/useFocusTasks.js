import { useState, useEffect, useCallback, useRef } from "react";
import { PHASES } from "../runtime/constants.js";
import taskService from "@services/taskService.js";

/**
 * useFocusTasks
 *
 * Dedicated task and todo checklist hook for Focus sessions.
 *
 * Responsibilities:
 * - Hydrates tasks from taskService for the active Focus context
 * - Isolates tasks by runtime.taskIds when starting a specific task session
 * - Manages checklist items (todos) synced with the Focus runtime state
 * - Provides optimistic CRUD for tasks synced to backend taskService
 * - Exposes full task list for Focus Notes context linking without duplicate fetches
 */
export function useFocusTasks({ runtime }) {
  const { phase, sessionId, taskIds, todos, commands } = runtime;

  const [allTasks, setAllTasks] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const hasHydratedTasksRef = useRef(null);

  const updateTodos = useCallback(
    (newTodos) => {
      commands.setTodos(newTodos);
    },
    [commands]
  );

  // Reset hydration tracker when sessionId or taskIds changes
  useEffect(() => {
    hasHydratedTasksRef.current = null;
  }, [sessionId, taskIds]);

  // Sync tasks from backend into runtime todos only once per session if todos are empty
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
        const res = await taskService.getTasks();
        const tasks = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        setAllTasks(tasks);

        const relevantIds = taskIds || [];
        const filtered =
          relevantIds.length > 0
            ? tasks.filter((t) => relevantIds.includes(t._id || t.id))
            : tasks.filter(
                (t) => t.status !== "completed" && t.status !== "cancelled"
              );

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
        console.error("[useFocusTasks] Failed to fetch tasks for Focus:", err);
      }
    };

    fetchTasks();
  }, [phase, sessionId, taskIds, todos, updateTodos]);

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
      const createdId = created?._id || created?.id;
      if (createdId) {
        updateTodos(
          todos.map((t) =>
            t.id === optimisticId ? { ...t, id: createdId } : t
          )
        );
        setAllTasks((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error("[useFocusTasks] Failed to create task in DB:", err);
    }
  }, [newTodo, todos, updateTodos]);

  const handleUpdateTodoStatus = useCallback(
    async (id, status) => {
      if (!id) return;
      updateTodos(
        todos.map((t) => {
          const match =
            String(t.id) === String(id) || String(t._id) === String(id);
          return match ? { ...t, status } : t;
        })
      );

      const backendStatus =
        status === "Completed"
          ? "completed"
          : status === "In Progress"
          ? "in-progress"
          : status === "Cancelled"
          ? "cancelled"
          : "todo";

      setAllTasks((prev) =>
        prev.map((t) => {
          const match =
            String(t._id || t.id) === String(id);
          return match ? { ...t, status: backendStatus } : t;
        })
      );

      try {
        await taskService.updateTask(id, { status: backendStatus });
      } catch (err) {
        console.error("[useFocusTasks] Failed to update task status:", err);
      }
    },
    [todos, updateTodos]
  );

  const handleDeleteTodo = useCallback(
    async (id) => {
      if (!id) return;
      updateTodos(
        todos.filter(
          (t) => String(t.id) !== String(id) && String(t._id) !== String(id)
        )
      );
      setAllTasks((prev) =>
        prev.filter((t) => String(t._id || t.id) !== String(id))
      );

      try {
        await taskService.deleteTask(id);
      } catch (err) {
        console.error("[useFocusTasks] Failed to delete task:", err);
      }
    },
    [todos, updateTodos]
  );

  const handleUpdateTodoTitle = useCallback(
    async (id, newTitle) => {
      if (!id || !newTitle?.trim()) return;
      const trimmed = newTitle.trim();
      updateTodos(
        todos.map((t) => {
          const match =
            String(t.id) === String(id) || String(t._id) === String(id);
          return match ? { ...t, title: trimmed } : t;
        })
      );
      setAllTasks((prev) =>
        prev.map((t) => {
          const match = String(t._id || t.id) === String(id);
          return match ? { ...t, title: trimmed } : t;
        })
      );
      try {
        await taskService.updateTask(id, { title: trimmed });
      } catch (err) {
        console.error("[useFocusTasks] Failed to update task title:", err);
      }
    },
    [todos, updateTodos]
  );

  return {
    allTasks,
    todos,
    newTodo,
    setNewTodo,
    onAddTodo: handleAddTodo,
    onUpdateTodoStatus: handleUpdateTodoStatus,
    onUpdateTodoTitle: handleUpdateTodoTitle,
    onDeleteTodo: handleDeleteTodo,
    updateTodos,
  };
}

export default useFocusTasks;
