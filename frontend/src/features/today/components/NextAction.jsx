import { useNavigate } from "react-router-dom";
import { Play, Check, Target, Calendar, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";

export default function NextAction({
  nextTask,
  todayTasks = [],
  completedTasks = [],
  goals = [],
  onStartFocus,
  onOpenQuickAdd,
}) {
  const navigate = useNavigate();

  const allCompleted =
    todayTasks.length > 0 && completedTasks.length === todayTasks.length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Next Action
        </h2>
        {nextTask && (
          <span className="text-xs font-medium text-muted-foreground">
            Ready to focus
          </span>
        )}
      </div>

      {nextTask ? (
        <Card className="border-border bg-card hover:border-primary/40 transition-colors shadow-xs rounded-2xl">
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                {nextTask.goal && (
                  <Badge
                    variant="secondary"
                    className="rounded-md px-2.5 py-0.5 text-xs font-medium"
                  >
                    {goals.find((g) => g._id === nextTask.goal)?.title ||
                      "Project Task"}
                  </Badge>
                )}
                {nextTask.priority === "high" && (
                  <Badge
                    variant="destructive"
                    className="rounded-md px-2 py-0.5 text-xs font-medium"
                  >
                    High Priority
                  </Badge>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-card-foreground leading-snug">
                {nextTask.title}
              </h3>

              {nextTask.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {nextTask.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                size="lg"
                className="gap-2.5 font-semibold px-7 h-12 rounded-xl text-base shadow-sm"
                onClick={() => onStartFocus(nextTask)}
              >
                <Play className="w-4 h-4 fill-current" />
                Start Focus
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : allCompleted ? (
        /* All Tasks Completed State */
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  All today's tasks completed
                </h3>
                <p className="text-sm text-muted-foreground">
                  You've completed all {todayTasks.length} planned tasks for today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                className="rounded-xl font-medium"
                onClick={onOpenQuickAdd}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add task
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl font-medium"
                onClick={() => navigate("/planner")}
              >
                Plan more work
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card className="border-border bg-card shadow-xs rounded-2xl">
          <CardContent className="p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-card-foreground">
                No work planned yet
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose what you want to accomplish today and Athena will help
                you move from planning into focused execution.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Button
                className="rounded-xl font-semibold gap-2 h-11 px-6 shadow-xs"
                onClick={() => navigate("/planner")}
              >
                <Calendar className="w-4 h-4" />
                Plan your day
              </Button>
              <Button
                variant="outline"
                className="rounded-xl font-medium h-11 px-5"
                onClick={onOpenQuickAdd}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add a task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
