import { useState, useMemo } from "react";
import {
  Play,
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Trash2,
  Edit2,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { isTaskPlannedForToday } from "@/utils/dateUtils.js";
import { Input } from "@/components/ui/input.jsx";
import { PLACEHOLDERS } from "@/constants/placeholders.js";

export default function TasksView({
  tasks = [],
  goals = [],
  selectedTaskId = null,
  onSelectTask,
  onToggleStatus,
  onStartFocus,
  onAddToToday,
  onRemoveFromToday,
  onEditTask,
  onDeleteTask,
  onOpenCreateTask,
}) {
  const [filter, setFilter] = useState("all");
  const [goalFilter, setGoalFilter] = useState("all");
  const [search, setSearch] = useState("");

  const todayStr = useMemo(() => new Date().toDateString(), []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (
        filter === "active" &&
        (t.status === "completed" || t.status === "cancelled")
      ) {
        return false;
      }
      if (filter === "completed" && t.status !== "completed") {
        return false;
      }
      if (filter === "today") {
        if (!isTaskPlannedForToday(t)) return false;
      }

      // Goal filter
      if (goalFilter !== "all") {
        if (goalFilter === "none" && t.goal) return false;
        if (goalFilter !== "none" && t.goal !== goalFilter) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [tasks, filter, goalFilter, search, todayStr]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t._id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-xl w-fit border border-border/40">
          {[
            { id: "all", label: "All Tasks" },
            { id: "active", label: "Active" },
            { id: "completed", label: "Completed" },
            { id: "today", label: "Planned Today" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === tab.id
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Goal dropdown */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              placeholder={PLACEHOLDERS.tasks.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="h-9 px-2.5 rounded-xl border border-input bg-card text-foreground text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All Goals</option>
            <option value="none">No Goal</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id}>
                {g.title}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            onClick={onOpenCreateTask}
            className="gap-1.5 rounded-xl font-semibold shadow-xs h-9 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* 2-Column Master Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Task List */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-2.5">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const isCompleted = task.status === "completed";
              const isSelected = task._id === selectedTaskId;
              const isPlannedToday = isTaskPlannedForToday(task);
              const goalObj = goals.find((g) => g._id === task.goal);

              return (
                <div
                  key={task._id}
                  onClick={() => onSelectTask(task._id)}
                  className={`group flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-primary/5 shadow-xs"
                      : isCompleted
                      ? "bg-secondary/30 border-transparent opacity-65 hover:opacity-100"
                      : "bg-card border-border hover:border-border/80 shadow-2xs"
                  }`}
                >
                  {/* Left: Checkbox + Title + Badges */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(task._id, task.status);
                      }}
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
                        className={`text-sm font-medium truncate ${
                          isCompleted
                            ? "line-through text-muted-foreground"
                            : "text-card-foreground"
                        }`}
                      >
                        {task.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {goalObj && (
                          <span className="font-medium text-foreground/80 truncate max-w-[140px]">
                            {goalObj.title}
                          </span>
                        )}
                        {goalObj && task.priority === "high" && (
                          <span>·</span>
                        )}
                        {task.priority === "high" && (
                          <span className="text-destructive font-medium">
                            High
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Today Pill + Focus Button */}
                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isPlannedToday ? (
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md text-primary bg-primary/10 border-primary/20"
                      >
                        Today
                      </Badge>
                    ) : (
                      !isCompleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded-lg"
                          onClick={() => onAddToToday(task._id)}
                        >
                          + Today
                        </Button>
                      )
                    )}

                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs font-semibold gap-1 text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onStartFocus(task)}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Focus
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <Card className="border-border bg-card shadow-xs rounded-2xl">
              <CardContent className="p-8 text-center space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {search || filter !== "all" || goalFilter !== "all"
                    ? "No tasks match your filters."
                    : "No tasks created yet."}
                </p>
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

        {/* Right Column: Selected Task Detail Inspector */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {selectedTask ? (
            <Card className="border-border bg-card shadow-xs rounded-2xl sticky top-6">
              <CardContent className="p-5 sm:p-6 space-y-5">
                {/* Header with Goal badge and action icons */}
                <div className="flex items-center justify-between">
                  {selectedTask.goal ? (
                    <Badge
                      variant="secondary"
                      className="rounded-md font-medium"
                    >
                      {goals.find((g) => g._id === selectedTask.goal)?.title ||
                        "Goal Task"}
                    </Badge>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Task Details
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground rounded-lg"
                      onClick={() => onEditTask(selectedTask)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-muted-foreground hover:text-destructive rounded-lg"
                      onClick={() => onDeleteTask(selectedTask._id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Task Title & Status */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-card-foreground leading-snug">
                    {selectedTask.title}
                  </h3>

                  {selectedTask.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedTask.description}
                    </p>
                  )}
                </div>

                {/* Key metadata */}
                <div className="space-y-2.5 pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant={
                        selectedTask.status === "completed"
                          ? "default"
                          : "outline"
                      }
                      className="capitalize text-xs font-medium"
                    >
                      {selectedTask.status || "todo"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Priority</span>
                    <span
                      className={`font-medium capitalize ${
                        selectedTask.priority === "high"
                          ? "text-destructive"
                          : "text-foreground"
                      }`}
                    >
                      {selectedTask.priority || "medium"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Today's Plan</span>
                    {isTaskPlannedForToday(selectedTask) ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/20 text-xs"
                        >
                          Planned for Today
                        </Badge>
                        <button
                          type="button"
                          onClick={() => onRemoveFromToday(selectedTask._id)}
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddToToday(selectedTask._id)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        + Add to Today
                      </button>
                    )}
                  </div>

                  {selectedTask.dueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Due Date</span>
                      <span className="font-medium text-foreground">
                        {new Date(selectedTask.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Focus Action */}
                <div className="pt-3 border-t border-border/50">
                  <Button
                    className="w-full gap-2 font-semibold h-11 rounded-xl shadow-xs"
                    disabled={selectedTask.status === "completed"}
                    onClick={() => onStartFocus(selectedTask)}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {selectedTask.status === "completed"
                      ? "Task Completed"
                      : "Start Focus Session"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60 bg-card/40 border-dashed rounded-2xl">
              <CardContent className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <Target className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                <p className="font-medium text-foreground">No task selected</p>
                <p>Click on any task to view details or start focus.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
