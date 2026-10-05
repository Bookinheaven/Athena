import { useMemo } from "react";
import {
  Target,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Play,
  Edit2,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";

export default function GoalsView({
  goals = [],
  tasks = [],
  selectedGoalId = null,
  onSelectGoal,
  onToggleTaskStatus,
  onStartFocus,
  onEditGoal,
  onDeleteGoal,
  onOpenCreateGoal,
  onOpenCreateTaskForGoal,
}) {
  const selectedGoal = useMemo(() => {
    if (!selectedGoalId) return null;
    return goals.find((g) => g._id === selectedGoalId) || null;
  }, [goals, selectedGoalId]);

  const goalTasks = useMemo(() => {
    if (!selectedGoalId) return [];
    return tasks.filter((t) => t.goal === selectedGoalId);
  }, [tasks, selectedGoalId]);

  const goalStats = useMemo(() => {
    const statsMap = {};
    goals.forEach((g) => {
      const gTasks = tasks.filter((t) => t.goal === g._id);
      const completed = gTasks.filter((t) => t.status === "completed").length;
      const total = gTasks.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      statsMap[g._id] = { total, completed, progress };
    });
    return statsMap;
  }, [goals, tasks]);

  // If a goal is selected -> show Goal Detail
  if (selectedGoal) {
    const stats = goalStats[selectedGoal._id] || {
      total: 0,
      completed: 0,
      progress: 0,
    };

    return (
      <div className="space-y-6">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectGoal(null)}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg -ml-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Goals
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl text-xs font-medium"
              onClick={() => onEditGoal(selectedGoal)}
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Goal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-xl text-xs text-muted-foreground hover:text-destructive"
              onClick={() => onDeleteGoal(selectedGoal._id)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>

        {/* Goal Hero Card */}
        <Card className="border-border bg-card shadow-xs rounded-2xl overflow-hidden">
          <div
            className="h-2 w-full"
            style={{ backgroundColor: selectedGoal.color || "#6366f1" }}
          />
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target
                  className="w-5 h-5"
                  style={{ color: selectedGoal.color || "#6366f1" }}
                />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {selectedGoal.title}
                </h2>
              </div>
              {selectedGoal.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedGoal.description}
                </p>
              )}
            </div>

            {/* Progress bar & stats */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground">
                  {stats.completed} of {stats.total} tasks completed ({stats.progress}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.progress}%`,
                    backgroundColor: selectedGoal.color || "#6366f1",
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linked Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Goal Tasks ({goalTasks.length})
            </h3>
            <Button
              size="sm"
              onClick={() => onOpenCreateTaskForGoal(selectedGoal._id)}
              className="gap-1.5 rounded-xl font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Task to Goal
            </Button>
          </div>

          <div className="space-y-2.5">
            {goalTasks.length > 0 ? (
              goalTasks.map((task) => {
                const isCompleted = task.status === "completed";
                return (
                  <div
                    key={task._id}
                    className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                      isCompleted
                        ? "bg-secondary/30 border-transparent opacity-65"
                        : "bg-card border-border hover:border-border/80 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          onToggleTaskStatus(task._id, task.status)
                        }
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 hover:text-primary transition-colors" />
                        )}
                      </button>

                      <p
                        className={`text-sm font-medium truncate ${
                          isCompleted
                            ? "line-through text-muted-foreground"
                            : "text-card-foreground"
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isCompleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2.5 text-xs font-semibold gap-1.5 text-primary hover:bg-primary/10 rounded-lg"
                          onClick={() => onStartFocus(task)}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
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
                    No tasks assigned to this goal yet.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl font-medium gap-1.5"
                    onClick={() => onOpenCreateTaskForGoal(selectedGoal._id)}
                  >
                    <Plus className="w-4 h-4" /> Add First Task
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // All Goals Grid
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Goals</h2>
          <p className="text-sm text-muted-foreground">
            Long-term outcomes and projects guiding your daily tasks.
          </p>
        </div>

        <Button
          size="sm"
          onClick={onOpenCreateGoal}
          className="gap-1.5 rounded-xl font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const stats = goalStats[goal._id] || {
              total: 0,
              completed: 0,
              progress: 0,
            };

            return (
              <Card
                key={goal._id}
                onClick={() => onSelectGoal(goal._id)}
                className="group border-border bg-card hover:border-primary/40 transition-all cursor-pointer shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: goal.color || "#6366f1" }}
                  />
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {goal.title}
                      </h3>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                        style={{ backgroundColor: goal.color || "#6366f1" }}
                      />
                    </div>

                    {goal.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                  </CardContent>
                </div>

                <div className="px-5 pb-5 pt-1 space-y-2.5 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span>
                      {stats.completed}/{stats.total} tasks
                    </span>
                    <span>{stats.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.progress}%`,
                        backgroundColor: goal.color || "#6366f1",
                      }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardContent className="p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Target className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-semibold text-foreground">
                No goals yet
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Define your high-level goals to organize tasks and measure sustained progress.
              </p>
            </div>
            <Button
              size="sm"
              onClick={onOpenCreateGoal}
              className="rounded-xl font-semibold gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
