import taskService from "../../../../../services/taskService";

export const useTaskActions = ({
  tasks,
  goals,
  setTasks,
  editingTaskTitle,
  setEditingTask,
  taskPlannedDate,
  setEditingTaskDate,
}) => {
  const handleAddTask = async (title, goal, priority) => {
    if (!title.trim()) return;
    try {
      const createdTask = await taskService.createTask({
        title,
        dueDate: new Date(),
        goal: goal || null,
        priority,
        order: tasks.length,
      });
      setTasks((prev) => [...prev, createdTask]);
    } catch (err) {
      console.error(err);
    }
  };

  // Reordering the task list <------ need to work on backend for it
  const handleReorder = async (newOrder) => {
    setTasks(newOrder);
    const payload = newOrder.map((task, index) => ({
      id: task._id,
      order: index,
    }));
    try {
      await taskService.reOrderTasks({ tasks: payload });
    } catch (error) {
      console.error("Failed to persist task reorder:", error);
    }
  };

  const handleToggleStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === "completed" ? "todo" : "completed";

    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)),
    );

    await taskService.updateTask(taskId, { status: newStatus });
  };

  const handleSetStatus = async (taskId, status) => {
    const taskObj = tasks.find((t) => t._id === taskId);
    let newStatus = status;
    console.log(status);
    if (status === "cancelled") {
      newStatus = taskObj.status === "cancelled" ? "todo" : "cancelled";
    }
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)),
    );
    await taskService.updateTask(taskId, { status: newStatus });
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      await taskService.deleteTask(taskId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTaskSave = async (taskId) => {
    if (!editingTaskTitle.trim()) {
      setEditingTask(null);
      return;
    }
    try {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, title: editingTaskTitle } : t,
        ),
      );
      await taskService.updateTask(taskId, { title: editingTaskTitle });
    } catch (err) {
      console.error(`Error handleEditTaskSave: ${err}`);
    }
    setEditingTask(null);
  };

  const handleEditTaskDateSave = async (taskId) => {
    if (!taskPlannedDate) return;
    try {
      const d = new Date(taskPlannedDate);
      const taskObj = tasks.find((t) => t._id === taskId);
      if (taskObj && taskObj.goal) {
        const goalObj = goals.find((g) => g._id === taskObj.goal);
        if (goalObj) {
          const goalStart = goalObj.startDate
            ? new Date(goalObj.startDate)
            : null;
          const goalEnd = goalObj.dueDate ? new Date(goalObj.dueDate) : null;
          if (goalStart) goalStart.setHours(0, 0, 0, 0);
          if (goalEnd) goalEnd.setHours(23, 59, 59, 999);
          if ((goalStart && d < goalStart) || (goalEnd && d > goalEnd)) {
            alert(`Task schedule must fall within its Goal's duration`);
            return;
          }
        }
      }
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, plannedDate: d } : t)),
      );
      await taskService.updateTask(taskId, { plannedDate: d });
    } catch (err) {
      console.error(`Error handleEditTaskDateSave: ${err}`);
    }
    setEditingTaskDate(null);
  };

  const handleDropTaskToTime = async (taskId, hour) => {
    const newDate = new Date();
    newDate.setHours(hour, 0, 0, 0);

    const taskObj = tasks.find((t) => t._id === taskId);
    if (
      !taskObj ||
      taskObj.status === "completed" ||
      taskObj.status === "cancelled"
    ) {
      return;
    }
    if (taskObj && taskObj.goal) {
      const goalObj = goals.find((g) => g._id === taskObj.goal);

      if (goalObj) {
        const goalStart = goalObj.startDate
          ? new Date(goalObj.startDate)
          : null;
        const goalEnd = goalObj.dueDate ? new Date(goalObj.dueDate) : null;

        if (goalStart) goalStart.setHours(0, 0, 0, 0);
        if (goalEnd) goalEnd.setHours(23, 59, 59, 999);

        if (
          (goalStart && newDate < goalStart) ||
          (goalEnd && newDate > goalEnd)
        ) {
          alert("Task must be within goal duration");
          return;
        }
      }
    }

    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, plannedDate: newDate } : t)),
    );

    try {
      await taskService.updateTask(taskId, { plannedDate: newDate });
    } catch (err) {
      console.error("Failed to update task date:", err);
    }
  };

  return {
    handleAddTask,
    handleReorder,
    handleToggleStatus,
    handleSetStatus,
    handleDeleteTask,
    handleEditTaskSave,
    handleEditTaskDateSave,
    handleDropTaskToTime,
  };
};
