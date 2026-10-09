import React, { useState } from "react";
import { RefreshCw, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TaskFrictionBadge({
  frictionSignal,
  task,
  isDismissed = false,
  onDismiss,
  onBreakDown,
  onMoveToBacklog,
}) {
  const [showWhy, setShowWhy] = useState(false);

  if (
    !frictionSignal ||
    !frictionSignal.trigger ||
    isDismissed ||
    !task ||
    task.status === "completed" ||
    task.status === "cancelled"
  ) {
    return null;
  }

  const rescheduleCount = frictionSignal.rescheduleCount ?? 0;
  const focusMinutes = frictionSignal.focusMinutes ?? 0;
  const explanation =
    frictionSignal.evidence?.explanation ||
    `Rescheduled ${rescheduleCount} times and only ${focusMinutes} minutes of Focus have been recorded.`;

  return (
    <div
      data-testid="task-friction-badge"
      className="rounded-xl border border-amber-500/30 bg-amber-500/8 dark:bg-amber-950/25 p-3.5 space-y-2.5 text-xs transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <RefreshCw className="h-3 w-3" />
          </span>
          <div>
            <span className="font-semibold text-foreground text-xs leading-none">
              Repeatedly rescheduled
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                data-testid="task-friction-evidence"
                className="text-[11px] font-medium text-amber-700 dark:text-amber-400/90"
              >
                {`${rescheduleCount} reschedules · ${focusMinutes}m Focus`}
              </span>
            </div>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-muted-foreground/70 hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
            title="Dismiss notice"
            aria-label="Dismiss task friction notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="text-[11.5px] text-muted-foreground leading-relaxed">
        This task may be easier to finish if you break it into a smaller action.
      </p>

      {/* Explainability toggle */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowWhy((prev) => !prev)}
          className="text-[11px] font-medium text-amber-600 dark:text-amber-400/90 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="h-3 w-3" />
          Why am I seeing this?
        </button>
        {showWhy && (
          <p
            data-testid="task-friction-explanation"
            className="mt-1.5 text-[11px] text-muted-foreground bg-background/60 border border-border/40 rounded-lg p-2 leading-relaxed"
          >
            {explanation}
          </p>
        )}
      </div>

      {/* Safe Non-judgmental Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-[11px] font-medium border-amber-500/30 hover:bg-amber-500/10 rounded-lg cursor-pointer"
          onClick={onBreakDown}
        >
          Break into smaller task
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-[11px] text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
          onClick={onMoveToBacklog}
        >
          Move to backlog
        </Button>
      </div>
    </div>
  );
}
