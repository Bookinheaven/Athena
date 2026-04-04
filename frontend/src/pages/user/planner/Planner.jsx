import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Play, 
  Plus, 
  X, 
  Target, 
  Search, 
  Flag, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  TrendingUp 
} from "lucide-react";
import plannerService from "../../../../services/plannerService.js";
import taskService from "../../../../services/taskService.js";
import goalService from "../../../../services/goalService.js";
import sessionService from "../../../../services/sessionService.js";
import { useAuth } from "../../../../contexts/AuthContext.jsx";

export default function Planner() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newTask, setNewTask] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPlanner = async () => {
      try {
        const data = await plannerService.getPlanner();
        setTasks(data.tasks || []);
        setGoals(data.goals || []);
      } catch (err) {
        console.error("Failed to load planner:", err);
      }
    };
    loadPlanner();
  }, []);

  useEffect(() => {
    const checkActive = async () => {
      const session = await sessionService.getActiveSession();
      if (session?.status === "active" && session?.sessionType === "task") {
        navigate("/focus-page");
      }
    };
    checkActive();
  }, [navigate]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const handleStartFocus = async (task) => {
    try {
      const payload = {
        sessionId: Date.now().toString(),
        title: task.title,
        taskIds: [task._id],
        sessionSegments: [{ type: "focus", duration: 0, totalDuration: 1500 }],
        plannedDuration: 1500,
        totalBreakMinutes: 0,
        totalFocusMinutes: 0,
      };
      await sessionService.startSession(payload);
      navigate("/focus-page", {
        state: {
          taskIds: [task._id],
          title: task.title,
          source: "planner",
          plannedDuration: 25 * 60
        }
      });
    } catch (err) {
      console.error("Failed to start session:", err);
    }
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

  const getPriorityStyles = (p) => {
    switch (p) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return "bg-background-secondary text-text-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background-color text-text-primary px-6 lg:px-12 py-10">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-button-primary/10 rounded-xl">
              <TrendingUp className="text-button-primary w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-button-primary/80">Daily Mission</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Today’s Plan</h1>
          <p className="text-text-muted font-medium mt-1">Ready to gain some XP? One task at a time.</p>
        </header>

        {/* INPUT BAR */}
        <section className="bg-card-background border border-card-border p-2 rounded-2xl shadow-xl mb-10 flex flex-wrap gap-2">
          <div className="flex-1 min-w-[200px] relative">
            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-transparent pl-11 pr-4 py-3 outline-none font-medium placeholder:text-text-muted/50"
            />
          </div>
          
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-background-secondary text-sm font-bold px-4 rounded-xl outline-none border border-transparent focus:border-button-primary/30 transition-all"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <select
            value={selectedGoal}
            onChange={(e) => setSelectedGoal(e.target.value)}
            className="bg-background-secondary text-sm font-bold px-4 rounded-xl outline-none border border-transparent focus:border-button-primary/30 transition-all"
          >
            <option value="">No Goal</option>
            {goals.map((g) => <option key={g._id} value={g._id}>{g.title}</option>)}
          </select>

          <button
            onClick={handleAddTask}
            disabled={loading}
            className="bg-button-primary text-white font-black px-6 py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-button-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Task"}
          </button>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* TASKS COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-2">
                Active Tasks <span className="text-sm font-bold text-text-muted bg-background-secondary px-2 rounded-full">{filteredTasks.length}</span>
              </h2>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-3.5 h-3.5" />
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background-secondary text-xs font-bold py-2 pl-9 pr-4 rounded-full border border-border-secondary focus:border-button-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-20 bg-background-secondary/30 rounded-3xl border border-dashed border-border-secondary">
                  <p className="text-text-muted font-bold text-sm">No tasks found. Start by adding one!</p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const goal = goals.find((g) => g._id === task.goal);
                  const isCompleted = task.status === "completed";

                  return (
                    <div
                      key={task._id}
                      className={`group p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 bg-card-background hover:shadow-lg hover:shadow-black/5 ${isCompleted ? 'opacity-60 border-transparent bg-background-secondary/50' : 'border-card-border'}`}
                    >
                      <button 
                        onClick={() => handleToggleStatus(task._id, task.status)}
                        className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isCompleted ? 'bg-button-success border-button-success text-white' : 'border-border-secondary group-hover:border-button-primary'}`}
                      >
                        {isCompleted && <CheckCircle2 size={14} strokeWidth={3} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-base truncate ${isCompleted ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${getPriorityStyles(task.priority)}`}>
                            {task.priority}
                          </span>
                          {goal && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-button-primary uppercase tracking-wider">
                              <Target size={10} /> {goal.title}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isCompleted && (
                          <button
                            onClick={() => handleStartFocus(task)}
                            className="p-2 rounded-xl bg-button-primary/10 text-button-primary hover:bg-button-primary hover:text-white transition-all shadow-sm"
                            title="Start Focus Session"
                          >
                            <Play size={16} fill="currentColor" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* GOALS COLUMN */}
          <div className="space-y-6">
            <h2 className="text-xl font-black">Long-term Goals</h2>
            
            <div className="bg-card-background border border-card-border p-4 rounded-2xl shadow-xl">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="New goal..."
                  className="flex-1 bg-background-secondary px-3 py-2 text-sm rounded-xl outline-none focus:ring-2 focus:ring-button-primary/20 transition-all"
                />
                <button
                  onClick={handleAddGoal}
                  className="bg-button-primary p-2 rounded-xl text-white shadow-lg shadow-button-primary/20"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>

              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal._id} className="p-4 rounded-2xl bg-background-secondary/50 border border-border-secondary hover:border-button-primary/30 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-black text-sm tracking-tight">{goal.title}</p>
                      <Flag size={14} className="text-button-primary opacity-40" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-border-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-button-primary to-brand-400 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(124,58,237,0.3)]"
                          style={{ width: `${goal.progress || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{goal.progress || 0}% Complete</span>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 rounded-full bg-button-primary animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}