import { CheckCircle2, Circle, Play } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";

export default function TodayTaskItem({
  task,
  goalObj,
  onToggleStatus,
  onStartFocus,
}) {
  const isCompleted = task.status === "completed";

  return (
    <div
      className={`group flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
        isCompleted
          ? "bg-secondary/30 border-transparent opacity-65"
          : "bg-card border-border hover:border-border/80 shadow-2xs"
      }`}
    >
      {/* Left: Checkbox + Title + Metadata */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggleStatus(task._id, task.status)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
          aria-label={
            isCompleted ? "Mark as uncompleted" : "Mark as completed"
          }
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
              <span className="font-medium text-foreground/80">
                {goalObj.title}
              </span>
            )}
            {goalObj && task.priority === "high" && <span>·</span>}
            {task.priority === "high" && (
              <span className="text-destructive font-medium">High</span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {!isCompleted && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2.5 text-xs font-semibold gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            onClick={() => onStartFocus(task)}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Focus
          </Button>
        )}
      </div>
    </div>
  );
}
