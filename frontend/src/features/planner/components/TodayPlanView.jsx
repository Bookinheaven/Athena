import { useState, useMemo } from "react";
import {
  Play,
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  Trash2,
  Edit2,
  MinusCircle,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { isTaskPlannedForToday } from "@/utils/dateUtils.js";
import { PLACEHOLDERS } from "@/constants/placeholders.js";

export default function TodayPlanView({
  tasks = [],
  goals = [],
  onToggleStatus,
  onStartFocus,
  onAddToToday,
  onRemoveFromToday,
  onEditTask,
  onDeleteTask,
  onOpenCreateTask,
}) {
  const [unplannedSearch, setUnplannedSearch] = useState("");

  const todayTasks = useMemo(() => {
    return tasks.filter((t) => isTaskPlannedForToday(t))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [tasks]);

  const completedTodayTasks = useMemo(() => {
    return todayTasks.filter((t) => t.status === "completed");
  }, [todayTasks]);

  const unplannedTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.status === "completed" || t.status === "cancelled") return false;
        return !isTaskPlannedForToday(t);
      })
      .filter((t) => {
        if (!unplannedSearch.trim()) return true;
        return t.title.toLowerCase().includes(unplannedSearch.toLowerCase());
      });
  }, [tasks, unplannedSearch]);

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Today's Plan</h2>
          <p className="text-sm text-muted-foreground">
            {todayTasks.length === 0
              ? "No tasks scheduled for today yet."
              : `${todayTasks.length} ${todayTasks.length === 1 ? "task" : "tasks"
              } planned · ${completedTodayTasks.length} completed`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onOpenCreateTask}
            className="gap-1.5 rounded-xl font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Task for Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Today's Tasks List */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {todayTasks.length > 0 ? (
            todayTasks.map((task) => {
              const isCompleted = task.status === "completed";
              const goalObj = goals.find((g) => g._id === task.goal);

              return (
                <div
                  key={task._id}
                  className={`group flex items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-200 ${isCompleted
                      ? "bg-secondary/30 border-transparent opacity-65"
                      : "bg-card border-border hover:border-border/80 shadow-2xs"
                    }`}
                >
                  {/* Left: Checkbox + Title + Meta */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(task._id, task.status)}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 hover:text-primary transition-colors" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <p
                        className={`text-sm font-medium truncate ${isCompleted
                            ? "line-through text-muted-foreground"
                            : "text-card-foreground"
                          }`}
                      >
                        {task.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {goalObj && (
                          <span className="font-medium text-foreground/80">
                            {goalObj.title}
                          </span>
                        )}
                        {goalObj && task.priority === "high" && (
                          <span>·</span>
                        )}
                        {task.priority === "high" && (
                          <span className="text-destructive font-medium">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs font-semibold gap-1.5 text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                        onClick={() => onStartFocus(task)}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Focus
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                      title="Remove from Today's Plan"
                      onClick={() => onRemoveFromToday(task._id)}
                    >
                      <MinusCircle className="w-4 h-4" />
                      <span className="sr-only">Remove from Today</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                      onClick={() => onEditTask(task)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive rounded-lg"
                      onClick={() => onDeleteTask(task._id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <Card className="border-border bg-card shadow-xs rounded-2xl">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base font-semibold text-foreground">
                    Nothing planned for today
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Decide what you want to achieve today. Pull tasks from your
                    inventory on the right or create a new task.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={onOpenCreateTask}
                  className="rounded-xl font-semibold gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create Task
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Add from Tasks Inventory */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          <Card className="border-border bg-card shadow-xs rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Task Inventory ({unplannedTasks.length})
                </h3>
              </div>

              {/* Search unplanned */}
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  placeholder={PLACEHOLDERS.tasks.filterAvailable}
                  value={unplannedSearch}
                  onChange={(e) => setUnplannedSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              {/* Available tasks list */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {unplannedTasks.length > 0 ? (
                  unplannedTasks.map((task) => {
                    const goalObj = goals.find((g) => g._id === task.goal);
                    return (
                      <div
                        key={task._id}
                        className="p-3 bg-secondary/30 hover:bg-secondary/60 rounded-xl border border-border/40 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-xs font-medium text-foreground truncate">
                            {task.title}
                          </p>
                          {goalObj && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {goalObj.title}
                            </p>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2.5 text-xs font-medium rounded-lg shrink-0 gap-1 bg-card hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => onAddToToday(task._id)}
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    {unplannedSearch
                      ? "No matching tasks found."
                      : "No unassigned tasks available."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
