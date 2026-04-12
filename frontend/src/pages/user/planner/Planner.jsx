import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Reorder } from "framer-motion";
import {
  Play,
  Plus,
  Target,
  Search,
  Flag,
  Trash2,
  CheckCircle2,
  Loader2,
  TrendingUp,
  CalendarDays,
  GripVertical,
  Edit2,
  Minus
} from "lucide-react";
import taskService from "../../../../services/taskService.js";
import goalService from "../../../../services/goalService.js";
import sessionService from "../../../../services/sessionService.js";
import { useNotes } from "../focus/hooks/useNotes.js";
import Notes from "../focus/components/Notes.jsx";

export default function Planner() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [newTask, setNewTask] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  const [editingGoal, setEditingGoal] = useState(null);
  const [editingGoalTitle, setEditingGoalTitle] = useState("");

  const [editingTask, setEditingTask] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");

  const [activeSession, setActiveSession] = useState(null);

  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [durationToStart, setDurationToStart] = useState("");
  const [tasksToStart, setTasksToStart] = useState([]);

  const [dateEditingGoal, setDateEditingGoal] = useState(null);
  const [goalStartDate, setGoalStartDate] = useState("");
  const [goalEndDate, setGoalEndDate] = useState("");

  const [editingTaskDate, setEditingTaskDate] = useState(null);
  const [taskPlannedDate, setTaskPlannedDate] = useState("");
  const { notes, createNote, updateNote, deleteNote } = useNotes();

  useEffect(() => {
    const loadPlanner = async () => {
      try {
        const [fetchedTasks, fetchedGoals] = await Promise.all([
          taskService.getTasks(),
          goalService.getGoals()
        ]);
        setTasks(fetchedTasks || []);
        setGoals(fetchedGoals || []);
      } catch (err) {
        console.error("Failed to load planner:", err);
      }
    };
    loadPlanner();
  }, []);

  useEffect(() => {
    const checkActive = async () => {
      try {
        const session = await sessionService.getActiveSession();
        if (session?.status === "active") {
          setActiveSession(session);
        }
      } catch (err) {
        console.error("Failed to check active session:", err);
      }
    };
    checkActive();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const handleStartFocusButton = (taskOrTasks) => {
    const tasksArray = Array.isArray(taskOrTasks) ? taskOrTasks : [taskOrTasks];
    setTasksToStart(tasksArray);
    setDurationToStart(25);
    setShowDurationModal(true);
  };

  const confirmStartFocus = async () => {
    try {
      const durationSeconds = durationToStart * 60;
      const title = tasksToStart.length > 1 ? `Batch Focus (${tasksToStart.length} tasks)` : tasksToStart[0].title;
      const taskIds = tasksToStart.map(t => t._id);

      const payload = {
        sessionId: Date.now().toString(),
        title,
        taskIds,
        sessionSegments: [{ type: "focus", duration: 0, totalDuration: durationSeconds }],
        plannedDuration: durationSeconds,
        totalBreakMinutes: 0,
        totalFocusMinutes: 0,
      };
      await sessionService.startSession(payload);
      navigate("/focus-page", {
        state: {
          taskIds,
          title,
          source: "planner",
          plannedDuration: durationSeconds
        }
      });
    } catch (err) {
      console.error("Failed to start session:", err);
    }
    setShowDurationModal(false);
    setSelectedTasks([]);
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    try {
      setLoading(true);
      const createdTask = await taskService.createTask({
        title: newTask,
        dueDate: new Date(),
        goal: selectedGoal || null,
        priority,
        order: tasks.length
      });
      setTasks((prev) => [...prev, createdTask]);
      setNewTask("");
      setSelectedGoal("");
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (newOrder) => {
    setTasks(newOrder);
    const payload = newOrder.map((task, index) => ({
      id: task._id,
      order: index
    }));

    try {
      await taskService.reOrderTasks({ tasks: payload });
    } catch (error) {
      console.error("Failed to persist task reorder:", error);
    }
  };

  const handleToggleStatus = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === "completed" ? "todo" : "completed";
      setTasks((prev) =>
        prev.map((t) => t._id === taskId ? { ...t, status: newStatus } : t)
      );
      await taskService.updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      await taskService.deleteTask(taskId);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.trim()) return;
    try {
      const createdGoal = await goalService.createGoal({ title: newGoal });
      setGoals((prev) => [createdGoal, ...prev]);
      setNewGoal("");
    } catch (err) {
      console.error("Failed to create goal:", err);
    }
  };

  const handleEditGoalSave = async (goalId) => {
    if (!editingGoalTitle.trim()) {
      setEditingGoal(null);
      return;
    }
    try {
      setGoals((prev) => prev.map((g) => g._id === goalId ? { ...g, title: editingGoalTitle } : g));
      await goalService.updateGoal(goalId, { title: editingGoalTitle });
    } catch (err) { console.error(err); }
    setEditingGoal(null);
  };

  const handleEditGoalDates = async (goalId) => {
    try {
      const updates = {};
      if (goalStartDate) updates.startDate = new Date(goalStartDate);
      if (goalEndDate) updates.dueDate = new Date(goalEndDate);

      if (Object.keys(updates).length > 0) {
        setGoals((prev) => prev.map((g) => g._id === goalId ? { ...g, ...updates } : g));
        await goalService.updateGoal(goalId, updates);
      }
    } catch (err) { console.error(err); }
    setDateEditingGoal(null);
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      setGoals((prev) => prev.filter((g) => g._id !== goalId));
      await goalService.deleteGoal(goalId);
    } catch (err) { console.error(err); }
  };

  const handleEditTaskSave = async (taskId) => {
    if (!editingTaskTitle.trim()) {
      setEditingTask(null);
      return;
    }
    try {
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, title: editingTaskTitle } : t));
      await taskService.updateTask(taskId, { title: editingTaskTitle });
    } catch (err) { console.error(err); }
    setEditingTask(null);
  };

  const handleEditTaskDateSave = async (taskId) => {
    try {
      if (taskPlannedDate) {
        const d = new Date(taskPlannedDate);

        const taskObj = tasks.find(t => t._id === taskId);
        if (taskObj && taskObj.goal) {
          const goalObj = goals.find(g => g._id === taskObj.goal);
          if (goalObj) {
            const goalStart = goalObj.startDate ? new Date(goalObj.startDate) : null;
            const goalEnd = goalObj.dueDate ? new Date(goalObj.dueDate) : null;
            if (goalStart) goalStart.setHours(0, 0, 0, 0);
            if (goalEnd) goalEnd.setHours(23, 59, 59, 999);

            if ((goalStart && d < goalStart) || (goalEnd && d > goalEnd)) {
              alert(`Task schedule must fall within its Goal's duration: ${goalStart ? goalStart.toLocaleDateString() : 'No start'} to ${goalEnd ? goalEnd.toLocaleDateString() : 'No end'}`);
              return;
            }
          }
        }

        setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, plannedDate: d } : t));
        await taskService.updateTask(taskId, { plannedDate: d });
      }
    } catch (err) { console.error(err); }
    setEditingTaskDate(null);
  };

  const getGoalTimeProgress = (goal) => {
    if (!goal.startDate || !goal.dueDate) return 0;
    const start = new Date(goal.startDate).getTime();
    const end = new Date(goal.dueDate).getTime();
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  const getPriorityStyles = (p) => {
    switch (p) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return "bg-background-secondary text-text-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background-color text-text-primary p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto h-full flex flex-col">

        {activeSession && (
          <div className="mb-6 p-4 rounded-2xl bg-button-primary/10 border border-button-primary/20 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-button-primary animate-pulse shadow-[0_0_10px_rgba(124,58,237,0.5)] shrink-0" />
              <div>
                <p className="text-sm font-black text-button-primary tracking-wide uppercase">Active Focus Session</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">{activeSession.title}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/focus-page")}
              className="bg-button-primary text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-button-primary/20 shrink-0"
            >
              Resume Focus
            </button>
          </div>
        )}

        {showDurationModal && (
          <div className="fixed inset-0 bg-background-color/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-card-background border border-card-border p-6 rounded-3xl shadow-2xl max-w-sm w-full relative">
              <h2 className="text-xl font-black text-text-primary mb-2">Set Focus Duration</h2>
              <p className="text-text-muted text-sm mb-6">How long do you want to focus on {tasksToStart.length > 1 ? `${tasksToStart.length} tasks` : 'this task'}?</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[15, 25, 45, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setDurationToStart(mins)}
                    className={`py-3 rounded-xl font-bold transition-all border ${durationToStart === mins ? 'bg-button-primary text-white border-button-primary scale-105 shadow-lg shadow-button-primary/20' : 'bg-background-secondary border-border-secondary text-text-primary hover:border-button-primary/30 hover:bg-background-secondary-contrast'}`}
                  >
                    {mins} min
                  </button>
                ))}
                <div className="col-span-2 relative mt-2">
                  <input
                    type="number"
                    placeholder="Custom duration in minutes..."
                    value={durationToStart}
                    onChange={(e) => setDurationToStart(parseInt(e.target.value) || "")}
                    className="w-full bg-input-background border border-border-secondary rounded-xl py-3 px-4 outline-none focus:border-button-primary transition-all font-medium text-text-primary placeholder:text-text-muted"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDurationModal(false)}
                  className="px-4 py-2 font-black text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStartFocus}
                  disabled={!durationToStart || durationToStart <= 0}
                  className="px-6 py-2 bg-button-primary text-white font-black rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-button-primary/20 text-sm"
                >
                  Start Session
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTasks.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card-background/90 backdrop-blur-xl border border-card-border p-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in shadow-[0_10px_40px_rgba(124,58,237,0.2)]">
            <span className="text-sm font-black text-text-primary px-2">
              {selectedTasks.length} Task{selectedTasks.length > 1 && 's'} Selected
            </span>
            <button
              onClick={() => handleStartFocusButton(tasks.filter(t => selectedTasks.includes(t._id)))}
              className="bg-button-primary text-white text-sm font-black px-6 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <Play size={16} fill="currentColor" /> Focus on Selected
            </button>
            <button
              onClick={() => setSelectedTasks([])}
              className="p-2 text-text-muted hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10"
            >
              <Minus size={18} />
            </button>
          </div>
        )}

        <header className="mb-8 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-button-primary/10 rounded-xl">
              <TrendingUp className="text-button-primary w-6 h-6" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-button-primary/80">Mission Control</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Daily Planner</h1>
          <p className="text-text-muted font-medium mt-2 text-lg">Organize your tasks, goals, and notes.</p>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

          <div className="lg:col-span-3 flex flex-col gap-6 h-full">

            <div className="bg-card-background border border-card-border p-5 rounded-3xl shadow-xl flex-1 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between shrink-0 mb-4">
                <h2 className="text-lg font-black flex items-center gap-2">Daily Timeline</h2>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => {
                  const hourLabel = hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`;
                  const plannedTasksHere = tasks.filter(t => {
                    if (!t.plannedDate) return false;
                    const d = new Date(t.plannedDate);
                    const isToday = new Date().toDateString() === d.toDateString();
                    return isToday && d.getHours() === hour;
                  });

                  return (
                    <div
                      key={hour}
                      className="flex gap-4 border-t border-border-secondary/30 min-h-[60px] relative group transition-colors"
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-button-primary/5"); }}
                      onDragLeave={(e) => { e.currentTarget.classList.remove("bg-button-primary/5"); }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("bg-button-primary/5");
                        const taskId = e.dataTransfer.getData("taskId");
                        if (!taskId) return;

                        const newDate = new Date();
                        newDate.setHours(hour, 0, 0, 0);

                        const taskObj = tasks.find(t => t._id === taskId);
                        if (taskObj && taskObj.goal) {
                          const goalObj = goals.find(g => g._id === taskObj.goal);
                          if (goalObj) {
                            const goalStart = goalObj.startDate ? new Date(goalObj.startDate) : null;
                            const goalEnd = goalObj.dueDate ? new Date(goalObj.dueDate) : null;
                            if (goalStart) goalStart.setHours(0, 0, 0, 0);
                            if (goalEnd) goalEnd.setHours(23, 59, 59, 999);
                            if ((goalStart && newDate < goalStart) || (goalEnd && newDate > goalEnd)) {
                              alert(`Cannot schedule: Task schedule must fall between its Goal dates.`);
                              return;
                            }
                          }
                        }

                        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, plannedDate: newDate } : t));
                        try {
                          await taskService.updateTask(taskId, { plannedDate: newDate });
                        } catch (err) { console.error(err); }
                      }}
                    >
                      <div className="w-12 shrink-0 py-2 text-right">
                        <span className="text-[10px] font-bold text-text-muted">{hourLabel}</span>
                      </div>
                      <div className="flex-1 border-l border-border-secondary/30 pl-3 py-2 flex flex-col gap-1 min-h-[40px]">
                        {plannedTasksHere.map(t => (
                          <div key={t._id} className="text-xs font-bold bg-button-primary text-white px-2 py-1.5 rounded-lg truncate shadow-sm">
                            {t.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card-background border border-card-border p-5 rounded-3xl shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="shrink-0 mb-4">
                <h2 className="text-lg font-black flex items-center gap-2">Long-term Goals</h2>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="New goal..."
                    className="flex-1 bg-background-secondary px-3 py-2 text-sm rounded-xl outline-none focus:ring-2 focus:ring-button-primary/20 transition-all font-medium"
                  />
                  <button
                    onClick={handleAddGoal}
                    className="bg-button-primary p-2 rounded-xl text-white shadow-lg shadow-button-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {goals.map((goal) => (
                  <div key={goal._id} className="p-4 rounded-2xl bg-background-secondary/50 border border-border-secondary hover:border-button-primary/30 transition-all group relative">
                    <div className="flex justify-between items-start mb-3">
                      {editingGoal === goal._id ? (
                        <input
                          autoFocus
                          value={editingGoalTitle}
                          onChange={(e) => setEditingGoalTitle(e.target.value)}
                          onBlur={() => handleEditGoalSave(goal._id)}
                          onKeyDown={(e) => e.key === "Enter" && handleEditGoalSave(goal._id)}
                          className="font-bold text-sm tracking-tight bg-transparent border-b border-button-primary outline-none text-text-primary px-1 py-0.5 w-[80%]"
                        />
                      ) : (
                        <p
                          onDoubleClick={() => { setEditingGoal(goal._id); setEditingGoalTitle(goal.title); }}
                          className="font-bold text-sm tracking-tight hover:text-button-primary cursor-pointer transition-colors"
                        >
                          {goal.title}
                        </p>
                      )}

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingGoal(goal._id); setEditingGoalTitle(goal.title); }}
                          className="text-text-muted hover:text-button-primary transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            setDateEditingGoal(goal._id);
                            setGoalStartDate(goal.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : "");
                            setGoalEndDate(goal.dueDate ? new Date(goal.dueDate).toISOString().split('T')[0] : "");
                          }}
                          className="text-text-muted hover:text-button-primary transition-colors"
                        >
                          <CalendarDays size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal._id)}
                          className="text-text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {dateEditingGoal === goal._id && (
                      <div className="mb-3 p-3 bg-background-color rounded-xl border border-border-secondary grid grid-cols-2 gap-2 animate-fade-in relative">
                        <button
                          onClick={() => setDateEditingGoal(null)}
                          className="absolute -top-2 -right-2 bg-text-muted text-white rounded-full p-0.5 hover:bg-black w-4 h-4 flex justify-center items-center"
                        >
                          <Minus size={10} />
                        </button>
                        <div>
                          <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Start</label>
                          <input type="date" value={goalStartDate} onChange={e => setGoalStartDate(e.target.value)} onBlur={() => handleEditGoalDates(goal._id)} className="w-full text-xs p-1.5 rounded-md bg-input-background border border-border-secondary outline-none text-text-primary" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">End</label>
                          <input type="date" value={goalEndDate} onChange={e => setGoalEndDate(e.target.value)} onBlur={() => handleEditGoalDates(goal._id)} className="w-full text-xs p-1.5 rounded-md bg-input-background border border-border-secondary outline-none text-text-primary" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      {goal.startDate && goal.dueDate && (
                        <div className="text-[9px] font-bold text-text-muted flex justify-between uppercase tracking-widest mt-1">
                          <span>{new Date(goal.startDate).toLocaleDateString()}</span>
                          <span>{new Date(goal.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      <div className="h-2 w-full bg-border-secondary rounded-full overflow-hidden relative">
                        <div
                          className="absolute top-0 left-0 h-full bg-border-primary/40 rounded-full transition-all duration-1000"
                          style={{ width: `${getGoalTimeProgress(goal)}%`, zIndex: 0 }}
                          title="Time elapsed"
                        />
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-button-primary to-brand-400 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(124,58,237,0.3)]"
                          style={{ width: `${goal.progress || 0}%`, zIndex: 1 }}
                          title="Goal Completion"
                        />
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{goal.progress || 0}% Done</span>
                        {goal.startDate && goal.dueDate && (
                          <span className="text-[9px] font-bold text-text-muted">{getGoalTimeProgress(goal)}% Time Passed</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="lg:col-span-5 flex flex-col gap-6 h-full min-h-[500px]">

            <div className="bg-card-background border border-card-border p-3 rounded-3xl shadow-xl shrink-0 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-background-secondary/50 rounded-2xl pl-11 pr-4 py-3 outline-none font-medium placeholder:text-text-muted/60 focus:bg-background-secondary transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="bg-background-secondary text-sm font-bold px-3 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-button-primary/20 transition-all cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Med</option>
                  <option value="high">High</option>
                </select>

                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="bg-background-secondary text-sm font-bold px-3 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-button-primary/20 transition-all cursor-pointer max-w-[120px] truncate"
                >
                  <option value="">No Goal</option>
                  {goals.map((g) => <option key={g._id} value={g._id}>{g.title}</option>)}
                </select>

                <button
                  onClick={handleAddTask}
                  disabled={loading}
                  className="bg-button-primary text-white font-black px-4 py-3 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shadow-lg shadow-button-primary/20 disabled:opacity-50 min-w-[56px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={20} strokeWidth={3} />}
                </button>
              </div>
            </div>

            <div className="flex-1 bg-card-background border border-card-border p-5 rounded-3xl shadow-xl flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between shrink-0 mb-4">
                <h2 className="text-xl font-black flex items-center gap-2">
                  Tasks <span className="text-sm font-bold text-text-muted bg-background-secondary px-2 py-0.5 rounded-full">{filteredTasks.length}</span>
                </h2>
                <div className="flex gap-3">
                  <div className="relative w-40">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-background-secondary text-xs font-bold py-2 pl-9 pr-4 rounded-full outline-none focus:ring-2 focus:ring-button-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-20 bg-background-secondary/30 rounded-3xl border border-dashed border-border-secondary h-full flex items-center justify-center">
                    <p className="text-text-muted font-bold text-sm">No tasks found. Add one above!</p>
                  </div>
                ) : (
                  <Reorder.Group
                    axis="y"
                    values={tasks}
                    onReorder={handleReorder}
                    className="space-y-3"
                  >
                    {filteredTasks.map((task) => {
                      const goal = goals.find((g) => g._id === task.goal);
                      const isCompleted = task.status === "completed";

                      return (
                        <Reorder.Item
                          key={task._id}
                          value={task}
                          className="relative"
                        >
                          <div className={`group p-4 py-3 rounded-2xl border transition-all duration-300 flex items-center gap-4 hover:shadow-lg bg-card-background ${isCompleted ? 'opacity-60 border-border-secondary bg-background-secondary/40' : 'border-card-border hover:border-button-primary/30'}`}>

                            {/* Drag Handle */}
                            <div className="cursor-grab active:cursor-grabbing text-border-secondary group-hover:text-text-muted transition-colors p-1 -ml-2 rounded-lg hover:bg-background-secondary">
                              <GripVertical size={16} />
                            </div>

                            <input
                              type="checkbox"
                              checked={selectedTasks.includes(task._id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedTasks(prev => [...prev, task._id]);
                                else setSelectedTasks(prev => prev.filter(id => id !== task._id));
                              }}
                              className="w-5 h-5 rounded-md border-border-secondary text-button-primary focus:ring-button-primary cursor-pointer -ml-1 mr-1 shadow-sm"
                            />

                            <button
                              onClick={() => handleToggleStatus(task._id, task.status)}
                              className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isCompleted ? 'bg-button-success border-button-success text-white scale-110' : 'border-border-secondary hover:border-button-primary'}`}
                            >
                              {isCompleted && <CheckCircle2 size={14} strokeWidth={3} />}
                            </button>

                            <div className="flex-1 min-w-0">
                              {editingTask === task._id ? (
                                <input
                                  autoFocus
                                  value={editingTaskTitle}
                                  onChange={(e) => setEditingTaskTitle(e.target.value)}
                                  onBlur={() => handleEditTaskSave(task._id)}
                                  onKeyDown={(e) => e.key === "Enter" && handleEditTaskSave(task._id)}
                                  className="font-bold text-base bg-transparent border-b border-button-primary outline-none text-text-primary px-1 py-0.5 w-[90%]"
                                />
                              ) : (
                                <p
                                  onDoubleClick={() => { setEditingTask(task._id); setEditingTaskTitle(task.title); }}
                                  className={`font-bold text-base truncate transition-colors cursor-pointer hover:text-button-primary ${isCompleted ? 'line-through text-text-muted' : 'text-text-primary'}`}
                                >
                                  {task.title}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${getPriorityStyles(task.priority)}`}>
                                  {task.priority}
                                </span>
                                {goal && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-button-primary uppercase tracking-wider bg-button-primary/10 px-2 py-0.5 rounded-md">
                                    <Target size={10} /> {goal.title}
                                  </span>
                                )}
                                <div
                                  draggable
                                  onDragStart={(e) => e.dataTransfer.setData("taskId", task._id)}
                                  className="opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing text-button-primary bg-button-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1 hover:bg-button-primary hover:text-white"
                                  title="Drag to timeline"
                                >
                                  <CalendarDays size={10} />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Drag to Time</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingTaskDate(task._id);
                                    if (task.plannedDate) setTaskPlannedDate(new Date(task.plannedDate).toISOString().slice(0, 16));
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-all text-text-muted hover:text-button-primary px-1 py-0.5"
                                  title="Schedule for Future"
                                >
                                  <Edit2 size={10} /> Schedule
                                </button>
                              </div>

                              {editingTaskDate === task._id && (
                                <div className="mt-2 flex items-center gap-2">
                                  <input
                                    type="datetime-local"
                                    value={taskPlannedDate}
                                    onChange={(e) => setTaskPlannedDate(e.target.value)}
                                    className="text-xs p-1.5 rounded-md bg-input-background border border-border-secondary outline-none text-text-primary"
                                  />
                                  <button onClick={() => handleEditTaskDateSave(task._id)} className="bg-button-primary text-white text-[10px] uppercase font-bold py-1.5 px-3 rounded-md">Save</button>
                                  <button onClick={() => setEditingTaskDate(null)} className="text-text-muted text-[10px] uppercase font-bold py-1.5 px-2">Cancel</button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 pr-2">
                              {!isCompleted && (
                                <button
                                  onClick={() => handleStartFocusButton(task)}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-button-primary/10 text-button-primary hover:bg-button-primary hover:text-white transition-all shadow-sm"
                                  title="Start Focus Session"
                                >
                                  <Play size={16} fill="currentColor" />
                                </button>
                              )}
                              <button
                                onClick={() => { setEditingTask(task._id); setEditingTaskTitle(task.title); }}
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-button-primary hover:bg-button-primary/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                          </div>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                )}
              </div>
            </div>

          </div>

          <div className="lg:col-span-4 h-[600px] lg:h-auto">
            <div className="bg-card-background border border-card-border rounded-3xl shadow-xl h-full flex flex-col overflow-hidden">
              <Notes
                show={true}
                onClose={() => { }}
                notes={notes}
                todos={tasks.map(t => ({ id: t._id, title: t.title, text: t.title, status: t.status }))}
                createNote={createNote}
                updateNote={updateNote}
                deleteNote={deleteNote}
              />
              <style>{`
                 .lg\\:col-span-4 .flex.justify-between.items-center > button { display: none; }
               `}</style>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}