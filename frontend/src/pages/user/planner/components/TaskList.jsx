import { AnimatePresence, Reorder, motion } from "framer-motion";
import {
  GripVertical,
  CheckCircle2,
  Play,
  Edit2,
  Trash2,
  CalendarDays,
  Check,
  Target,
  Search,
  Filter,
  X,
  Save,
  MinusCircle
} from "lucide-react";
import { useMemo } from "react";
import CustomSelect from "../../../../components/customs/CustomSelect";

export default function TaskList(props) {
  const {
    tasks,
    goals,
    selectedTasks,
    setSelectedTasks,
    handleReorder,
    handleToggleStatus,
    handleSetStatus,
    handleDeleteTask,
    handleStartFocusButton,
    editingTask,
    setEditingTask,
    editingTaskTitle,
    setEditingTaskTitle,
    handleEditTaskSave,
    editingTaskDate,
    setEditingTaskDate,
    taskPlannedDate,
    setTaskPlannedDate,
    handleEditTaskDateSave,
    sortBy,
    setSortBy,
    filterByStatus,
    setFilterByStatus,
    filterByGoal,
    setFilterByGoal,
    searchQuery,
    setSearchQuery,
  } = props;

  const getPriorityStyles = (p) => {
    switch (p) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return "bg-background-secondary text-text-muted border-border-secondary";
    }
  };

  const sortOptions = [
    { value: "order", label: "Custom Order" },
    { value: "priority", label: "Priority Level" },
    { value: "deadline", label: "Nearest Deadline" },
    { value: "alpha", label: "Alphabetical" },
  ];

  const goalOptions = [
    { value: "all", label: "All Goals" },
    { value: "no_goals", label: "No Goals" },
    ...goals.map((g) => ({ value: g._id, label: g.title })),
  ];

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (searchQuery.trim()) {
      result = result.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filterByStatus !== "all") result = result.filter((t) => t.status === filterByStatus);
    if (filterByGoal !== "all") {
      result = filterByGoal === "no_goals" ? result.filter((t) => !t.goal) : result.filter((t) => t.goal === filterByGoal);
    }
    result.sort((a, b) => {
      if (sortBy === "alpha") return a.title.localeCompare(b.title);
      if (sortBy === "priority") {
        const pMap = { high: 3, medium: 2, low: 1 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      }
      if (sortBy === "deadline") {
        if (!a.plannedDate) return 1;
        if (!b.plannedDate) return -1;
        return new Date(a.plannedDate) - new Date(b.plannedDate);
      }
      return a.order - b.order;
    });
    return result;
  }, [tasks, searchQuery, sortBy, filterByStatus, filterByGoal]);

  return (
    <div className="flex-1 bg-card-background border border-card-border p-6 rounded-[2rem] shadow-2xl flex flex-col min-h-0 h-full transition-all duration-500">
      <div className="flex flex-col gap-5 shrink-0 mb-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black flex items-center gap-3 tracking-tighter text-text-primary uppercase">
            Tasks
            <span className="text-xs font-black text-button-primary bg-button-primary/10 px-3 py-1 rounded-full border border-button-primary/20">
              {filteredTasks.length}
            </span>
          </h2>
          <div className="relative group flex-1 max-w-[220px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4 group-focus-within:text-button-primary transition-colors" />
            <input
              type="text"
              placeholder="Search flow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background-secondary/40 border border-border-secondary/60 text-xs font-bold py-3 pl-11 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-button-primary/10 focus:border-button-primary/30 transition-all placeholder:text-text-muted/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 bg-background-secondary/20 p-2 rounded-[1.25rem] border border-border-secondary/40">
          <div className="flex items-center gap-2 px-3 text-text-muted shrink-0 border-r border-border-secondary/30 mr-1">
            <Filter size={14} className="stroke-[2.5px]" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Refine</span>
          </div>
          <CustomSelect value={sortBy} onChange={setSortBy} options={sortOptions} />
          <CustomSelect value={filterByStatus} onChange={setFilterByStatus} options={[{ value: "all", label: "All Status" }, { value: "todo", label: "To Do" }, { value: "completed", label: "Done" }]} />
          <CustomSelect value={filterByGoal} onChange={setFilterByGoal} options={goalOptions} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border-secondary/40 rounded-[2.5rem] bg-background-secondary/10 p-12 text-center">
              <CheckCircle2 size={40} className="text-text-muted mb-5 opacity-30 stroke-[1.5px]" />
              <p className="text-text-primary font-black text-xl tracking-tight">Clear skies ahead</p>
              <p className="text-text-muted text-sm font-medium mt-1">Ready for the next sprint?</p>
            </motion.div>
          ) : (
            <Reorder.Group axis="y" values={filteredTasks} onReorder={handleReorder} className="space-y-4">
              {filteredTasks.map((task) => {
                const goal = goals.find((g) => g._id === task.goal);
                const isCompleted = task.status === "completed";
                const isCancelled = task.status === "cancelled";

                return (
                  <Reorder.Item key={task._id} value={task} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <div className={`group relative p-5 rounded-[1.75rem] border transition-all duration-300 flex flex-col gap-4 bg-card-background ${isCompleted || isCancelled ? "opacity-60 border-border-secondary/40 grayscale-[0.4]" : "border-card-border/60 hover:border-button-primary/40 hover:shadow-xl hover:shadow-button-primary/5"
                      }`}>

                      <div className="flex items-center gap-4">
                        <div className="cursor-grab active:cursor-grabbing text-text-muted/40 p-1 -ml-2 opacity-0 group-hover:opacity-100 transition-all hover:text-text-primary">
                          <GripVertical size={18} />
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTasks(prev => prev.includes(task._id) ? prev.filter(id => id !== task._id) : [...prev, task._id]);
                          }}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${selectedTasks.includes(task._id) ? "bg-button-primary border-button-primary shadow-lg shadow-button-primary/30" : "border-border-secondary hover:border-button-primary/50"}`}
                        >
                          {selectedTasks.includes(task._id) && <Check size={14} className="text-white stroke-[4px]" />}
                        </motion.button>

                        <button
                          onClick={() => handleToggleStatus(task._id, task.status)}
                          className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${isCompleted ? "bg-button-success border-button-success text-white shadow-lg shadow-button-success/20" : "border-border-secondary hover:border-button-primary"}`}
                        >
                          {isCompleted && <CheckCircle2 size={16} strokeWidth={3} />}
                        </button>

                        <div className="flex-1 min-w-0">
                          {editingTask === task._id ? (
                            <input
                              autoFocus
                              value={editingTaskTitle}
                              onChange={(e) => setEditingTaskTitle(e.target.value)}
                              onBlur={() => handleEditTaskSave(task._id)}
                              onKeyDown={(e) => e.key === "Enter" && handleEditTaskSave(task._id)}
                              className="font-black text-lg bg-transparent border-b-2 border-button-primary/50 outline-none text-text-primary w-full py-1"
                            />
                          ) : (
                            <h3
                              onDoubleClick={() => { setEditingTask(task._id); setEditingTaskTitle(task.title); }}
                              className={`font-black text-lg leading-tight truncate cursor-pointer transition-all tracking-tight ${isCompleted || isCancelled ? "line-through text-text-muted/60 decoration-2" : "text-text-primary hover:text-button-primary"}`}
                            >
                              {task.title}
                            </h3>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0 translate-x-2 group-hover:translate-x-0">
                          {!isCompleted && (
                            <>
                              <button onClick={() => handleStartFocusButton(task)} className="p-3 rounded-2xl bg-button-primary text-white hover:scale-110 active:scale-95 shadow-lg shadow-button-primary/25 transition-all"><Play size={16} fill="currentColor" /></button>

                              <button
                                onClick={() => handleSetStatus(task._id, "cancelled")}
                                className={`p-3 rounded-2xl transition-all ${isCancelled ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-text-muted hover:bg-orange-500/10 hover:text-orange-500 hover:scale-110'}`}
                              >
                                <MinusCircle size={16} />
                              </button>
                            </>
                          )}
                          <button onClick={() => { setEditingTask(task._id); setEditingTaskTitle(task.title); }} className="p-3 rounded-2xl text-text-muted hover:bg-button-primary/10 hover:text-button-primary hover:scale-110 transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteTask(task._id)} className="p-3 rounded-2xl text-text-muted hover:bg-red-500/10 hover:text-red-500 hover:scale-110 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 ml-[68px]">
                        <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-xl border-2 transition-colors ${getPriorityStyles(task.priority)}`}>
                          {task.priority}
                        </span>

                        {goal && (
                          <span className="flex items-center gap-2 text-[10px] font-black text-button-primary uppercase tracking-[0.05em] bg-button-primary/5 px-3 py-1 rounded-xl border border-button-primary/20">
                            <Target size={12} strokeWidth={3} className="opacity-70" /> {goal.title}
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          {task.plannedDate ? (
                            <button
                              onClick={() => { setEditingTaskDate(task._id); setTaskPlannedDate(new Date(task.plannedDate).toISOString().slice(0, 16)); }}
                              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-button-primary bg-button-primary/10 px-3 py-1 rounded-xl border border-button-primary/20 hover:bg-button-primary hover:text-white transition-all shadow-sm"
                            >
                              <CalendarDays size={12} strokeWidth={2.5} />
                              {new Date(task.plannedDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </button>
                          ) : (
                            !isCompleted && (
                              <button
                                onClick={() => { setEditingTaskDate(task._id); setTaskPlannedDate(new Date().toISOString().slice(0, 16)); }}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted bg-background-secondary/50 px-3 py-1 rounded-xl border border-border-secondary/60 hover:text-button-primary hover:border-button-primary/40 transition-all"
                              >
                                <Edit2 size={12} /> Schedule
                              </button>
                            )
                          )}

                          {!isCompleted && (
                            <div
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData("taskId", task._id)}
                              className="cursor-grab active:cursor-grabbing flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-button-primary bg-button-primary/5 border border-dashed border-button-primary/40 px-3 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-button-primary/10"
                            >
                              <GripVertical size={12} /> Sync Time
                            </div>
                          )}
                        </div>
                      </div>

                      {editingTaskDate === task._id && (
                        <motion.div initial={{ height: 0, opacity: 0, y: -5 }} animate={{ height: 'auto', opacity: 1, y: 0 }} className="ml-[68px] flex flex-wrap items-center gap-3 p-4 bg-background-secondary/40 rounded-2xl border border-border-secondary/50 shadow-inner">
                          <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 mb-1">Schedule Execution</span>
                            <input
                              type="datetime-local"
                              value={taskPlannedDate}
                              onChange={(e) => setTaskPlannedDate(e.target.value)}
                              className="bg-card-background border-2 border-border-secondary/60 rounded-xl px-4 py-2 text-xs font-black outline-none text-text-primary focus:border-button-primary/50 focus:ring-4 focus:ring-button-primary/5 transition-all"
                            />
                          </div>
                          <div className="flex gap-2 self-end mb-0.5">
                            <button onClick={() => handleEditTaskDateSave(task._id)} className="p-2.5 rounded-xl bg-button-primary text-white shadow-lg shadow-button-primary/25 hover:scale-105 transition-all"><Save size={16} /></button>

                            <button
                              onClick={() => setEditingTaskDate(null)}
                              className="p-2.5 rounded-xl bg-background-secondary text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-all border border-border-secondary/50 group/cancel"
                            >
                              <X size={16} className="group-hover/cancel:rotate-90 transition-transform" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}