import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  GripVertical,
  Target,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";

export default function UnscheduledTasks({
  tasks = [],
  goals = [],
  scheduledBlocks = [],
  selectedDate,
  onScheduleTask,
  onOpenCreateTask,
}) {
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'planned' | 'unscheduled'
  const [searchQuery, setSearchQuery] = useState("");

  const scheduledTaskIds = useMemo(() => {
    return new Set(
      scheduledBlocks
        .map((b) => (b.taskId?._id || b.taskId)?.toString())
        .filter(Boolean)
    );
  }, [scheduledBlocks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Must not be completed
      if (t.status === "completed" || t.status === "cancelled") return false;

      // Filter Mode
      if (filterMode === "unscheduled" && scheduledTaskIds.has(t._id.toString())) {
        return false;
      }
      if (filterMode === "planned") {
        if (!t.plannedDate) return false;
        const taskDateStr = new Date(t.plannedDate).toISOString().split("T")[0];
        if (taskDateStr !== selectedDate) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDescription = t.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) return false;
      }

      return true;
    });
  }, [tasks, filterMode, scheduledTaskIds, selectedDate, searchQuery]);

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "new_task",
        taskId: task._id,
        durationMinutes: 60,
      })
    );
    e.dataTransfer.effectAllowed = "copyMove";
  };

  const goalsMap = useMemo(() => {
    const map = new Map();
    goals.forEach((g) => map.set(g._id.toString(), g.title));
    return map;
  }, [goals]);

  return (
    <div className="flex flex-col h-full bg-card/60 border border-border/60 rounded-2xl p-4 space-y-4 backdrop-blur-xs">
      {/* Header & Create Action */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Task Queue
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Drag onto timeline or click + to schedule
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onOpenCreateTask}
          className="h-7 px-2.5 rounded-lg text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> New
        </Button>
      </div>

      {/* Filter tabs & Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8 h-8 text-xs rounded-xl bg-secondary/30"
          />
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-secondary/40 rounded-lg border border-border/30 text-[11px]">
          <button
            onClick={() => setFilterMode("all")}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
              filterMode === "all"
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Active
          </button>
          <button
            onClick={() => setFilterMode("unscheduled")}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
              filterMode === "unscheduled"
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unscheduled
          </button>
          <button
            onClick={() => setFilterMode("planned")}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
              filterMode === "planned"
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Planned
          </button>
        </div>
      </div>

      {/* Task List Area */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 border border-dashed border-border/50 rounded-xl space-y-2">
            <CheckCircle2 className="w-6 h-6 text-muted-foreground/50" />
            <p className="text-xs font-medium text-muted-foreground">
              {searchQuery ? "No matching tasks found." : "All your planned work is scheduled."}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isScheduled = scheduledTaskIds.has(task._id.toString());
            const goalTitle = task.goal ? goalsMap.get(task.goal.toString()) : null;

            // Date mismatch warning indicator
            const hasDateMismatch =
              task.plannedDate &&
              new Date(task.plannedDate).toISOString().split("T")[0] !== selectedDate;

            return (
              <div
                key={task._id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, task)}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                  isScheduled
                    ? "bg-secondary/30 border-border/40 opacity-70"
                    : "bg-background/90 hover:bg-background border-border/60 hover:border-primary/50 shadow-2xs"
                }`}
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground/80 mt-0.5 shrink-0 transition-colors" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {task.title}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                      {goalTitle && (
                        <span className="flex items-center gap-0.5 bg-secondary px-1.5 py-0.2 rounded-sm truncate max-w-[120px]">
                          <Target className="w-2.5 h-2.5" />
                          <span className="truncate">{goalTitle}</span>
                        </span>
                      )}

                      {task.priority && (
                        <span
                          className={`capitalize font-semibold ${
                            task.priority === "high"
                              ? "text-red-500"
                              : task.priority === "medium"
                              ? "text-amber-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {task.priority}
                        </span>
                      )}

                      {hasDateMismatch && (
                        <span
                          className="flex items-center gap-0.5 text-amber-500 font-medium"
                          title={`Planned for ${new Date(task.plannedDate).toLocaleDateString()}`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Planned diff date</span>
                        </span>
                      )}

                      {isScheduled && (
                        <span className="text-emerald-500 font-medium">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onScheduleTask(task._id)}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                  title="Quick-schedule on timeline"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
