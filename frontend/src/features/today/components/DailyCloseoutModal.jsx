import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  Check,
  X,
  CalendarX,
  CalendarCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import taskOccurrenceService from "../../../../services/taskOccurrenceService.js";
import taskService from "../../../../services/taskService.js";
import {
  getTodayProductDate,
  getTomorrowProductDate,
  formatDisplayDate,
} from "@/utils/dateUtils.js";
import { formatMinutes } from "../hooks/useTodayData.js";

const PRIORITY_BADGES = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
  low: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
};

export default function DailyCloseoutModal({
  open,
  onOpenChange,
  todayTasks = [],
  completedTasks = [],
  progress = {},
  streak = {},
  goals = [],
}) {
  const navigate = useNavigate();
  const todayDate = useMemo(() => getTodayProductDate(), []);
  const tomorrowDate = useMemo(() => getTomorrowProductDate(), []);

  // Filter unresolved/unfinished tasks
  const unfinishedTasks = useMemo(() => {
    return todayTasks.filter(
      (t) => t.status !== "completed" && t.status !== "cancelled"
    );
  }, [todayTasks]);

  // Selected tasks for rollover
  const [selectedTaskIds, setSelectedTaskIds] = useState(() => {
    return new Set(unfinishedTasks.map((t) => t._id || t.id));
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Sync selection when unfinished tasks change
  const handleOpenModal = (nextOpen) => {
    if (nextOpen) {
      setSelectedTaskIds(new Set(unfinishedTasks.map((t) => t._id || t.id)));
      setActionFeedback(null);
    }
    onOpenChange(nextOpen);
  };

  const handleToggleSelect = (taskId) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedTaskIds(new Set(unfinishedTasks.map((t) => t._id || t.id)));
  };

  const handleClearAll = () => {
    setSelectedTaskIds(new Set());
  };

  // 1. Move selected to tomorrow
  const handleRolloverSelected = async () => {
    const taskIds = Array.from(selectedTaskIds);
    if (taskIds.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setActionFeedback(null);
    try {
      const res = await taskOccurrenceService.rollover({
        fromProductDate: todayDate,
        toProductDate: tomorrowDate,
        taskIds,
      });

      if (res?.success) {
        const rolledCount = res.rolledOver?.length || 0;
        const skippedCount = res.skipped?.length || 0;
        
        setActionFeedback({
          type: "success",
          message: `Moved ${rolledCount} task${rolledCount !== 1 ? "s" : ""} to Tomorrow${
            skippedCount > 0 ? ` (${skippedCount} skipped)` : ""
          }`,
          showPlanAction: true,
        });

        // Broadcast change so Today, Planner, and History update
        window.dispatchEvent(new CustomEvent("athena:tasks-changed"));

        setTimeout(() => {
          onOpenChange(false);
        }, 4000);
      } else {
        setActionFeedback({
          type: "error",
          message: res?.message || "Failed to rollover tasks.",
        });
      }
    } catch (err) {
      console.error("Rollover error:", err);
      setActionFeedback({
        type: "error",
        message: err.message || "Failed to rollover tasks.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Mark an individual task as completed directly during closeout
  const handleMarkCompleted = async (taskId) => {
    try {
      await taskService.updateTask(taskId, { status: "completed" });
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      window.dispatchEvent(new CustomEvent("athena:tasks-changed"));
    } catch (err) {
      console.error("Failed to mark task completed:", err);
    }
  };

  // 3. Unschedule task (remove from planned date)
  const handleUnschedule = async (taskId) => {
    try {
      await taskService.updateTask(taskId, {
        plannedDate: null,
        customPlannedDate: null,
      });
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      window.dispatchEvent(new CustomEvent("athena:tasks-changed"));
    } catch (err) {
      console.error("Failed to unschedule task:", err);
    }
  };

  // 4. Cancel task
  const handleCancelTask = async (taskId) => {
    try {
      await taskService.updateTask(taskId, { status: "cancelled" });
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      window.dispatchEvent(new CustomEvent("athena:tasks-changed"));
    } catch (err) {
      console.error("Failed to cancel task:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenModal}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border bg-card/50">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Wrap Up Today
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {formatDisplayDate(todayDate)} • Review progress and organize remaining work for tomorrow.
            </DialogDescription>
          </DialogHeader>

          {/* Today Summary Metrics */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-background/80 border border-border flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium">Tasks Done</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {completedTasks.length} / {todayTasks.length}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-background/80 border border-border flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium">Focus Logged</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {formatMinutes(progress.focusMinutes || 0)}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-background/80 border border-border flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium">Streak</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {streak.streakDays || 0}d Active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alert if any */}
        {actionFeedback && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between gap-3 ${
              actionFeedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/20"
                : "bg-red-500/10 text-red-600 dark:text-red-400 border-b border-red-500/20"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {actionFeedback.type === "success" ? (
                <Check className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">{actionFeedback.message}</span>
            </div>
            {actionFeedback.showPlanAction && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 shrink-0 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/planner?date=${tomorrowDate}&tab=timeline`);
                }}
              >
                View in Plan
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* Unfinished Work Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {unfinishedTasks.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  All planned tasks are complete!
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  You have completed all planned work for today. You can prepare tomorrow's plan in the Planner whenever you are ready.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Unfinished Work ({unfinishedTasks.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-muted-foreground text-xs">•</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {unfinishedTasks.map((task) => {
                  const taskId = task._id || task.id;
                  const isSelected = selectedTaskIds.has(taskId);
                  const goalObj = goals.find((g) => (g._id || g.id) === task.goal);

                  return (
                    <div
                      key={taskId}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-primary/5 border-primary/30"
                          : "bg-card border-border hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          id={`closeout-task-${taskId}`}
                          checked={isSelected}
                          onChange={() => handleToggleSelect(taskId)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                        />
                        <label
                          htmlFor={`closeout-task-${taskId}`}
                          className="min-w-0 cursor-pointer select-none"
                        >
                          <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-semibold px-1.5 py-0 rounded ${
                                PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium
                              }`}
                            >
                              {task.priority || "medium"}
                            </Badge>
                            {goalObj && (
                              <span className="text-[11px] text-muted-foreground truncate">
                                {goalObj.title}
                              </span>
                            )}
                          </div>
                        </label>
                      </div>

                      {/* Individual task action shortcuts */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                          title="Mark completed"
                          onClick={() => handleMarkCompleted(taskId)}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                          title="Unschedule (remove from plan)"
                          onClick={() => handleUnschedule(taskId)}
                        >
                          <CalendarX className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          title="Cancel task"
                          onClick={() => handleCancelTask(taskId)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-border bg-card/30 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-medium text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {unfinishedTasks.length > 0 ? (
              <Button
                size="sm"
                onClick={handleRolloverSelected}
                disabled={selectedTaskIds.size === 0 || isSubmitting}
                className="text-xs font-semibold px-4 h-9 rounded-xl shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Rolling over...
                  </>
                ) : (
                  <>
                    Move Selected to Tomorrow ({selectedTaskIds.size})
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/planner");
                }}
                className="text-xs font-semibold px-3 h-9 rounded-xl"
              >
                Go to Planner
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
