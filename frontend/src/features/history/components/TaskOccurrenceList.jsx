import React from "react";
import { ArrowRight, Clock } from "lucide-react";
import { formatTimeOnly } from "../utils/dateUtils.js";

/**
 * Planned task history list.
 * Each row looks like a historical record, not a dashboard card.
 *
 * Layout:
 *   Task Title                      Outcome
 *   [priority if high] [metadata]
 */

const OUTCOME_LABEL = {
  completed: "Completed",
  partially_completed: "Partial",
  missed: "Missed",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  pending: "Pending",
};

const OUTCOME_COLOR = {
  completed: "text-emerald-500",
  partially_completed: "text-amber-500",
  missed: "text-rose-500",
  rescheduled: "text-muted-foreground",
  cancelled: "text-muted-foreground/50",
  pending: "text-muted-foreground/50",
};

export function TaskOccurrenceList({ occurrences = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="space-y-px">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 bg-muted/20 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!occurrences.length) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No tasks were planned for this day.
      </p>
    );
  }

  return (
    <div className="space-y-px">
      {occurrences.map((occ) => {
        const title =
          occ.taskSnapshot?.title ||
          (typeof occ.taskId === "object" ? occ.taskId?.title : null) ||
          "Untitled / Deleted Task";
        const priority =
          occ.taskSnapshot?.priority ||
          (typeof occ.taskId === "object" ? occ.taskId?.priority : null);
        const outcome = occ.outcome || "pending";
        const outcomeLabel = OUTCOME_LABEL[outcome] || outcome;
        const outcomeColor = OUTCOME_COLOR[outcome] || "text-muted-foreground";
        const isArchived = !occ.taskId && occ.taskSnapshot;

        return (
          <div
            key={occ._id}
            data-testid={`task-occurrence-${occ._id}`}
            className="flex items-center justify-between gap-4 py-2 px-0 border-b border-border/40 last:border-0 group hover:bg-muted/20 hover:-mx-2 hover:px-2 rounded transition-colors"
          >
            {/* Left: title + meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-sm font-medium text-foreground truncate"
                  title={title}
                >
                  {title}
                </span>
                {priority === "high" && (
                  <span className="text-[10px] text-rose-500 font-medium uppercase tracking-wide shrink-0">
                    High
                  </span>
                )}
                {isArchived && (
                  <span className="text-[10px] text-muted-foreground/40 italic shrink-0">
                    archived
                  </span>
                )}
              </div>

              {/* Secondary metadata */}
              <div className="flex items-center gap-2.5 mt-0.5 text-xs text-muted-foreground flex-wrap">
                {occ.rescheduledToDate && (
                  <span className="flex items-center gap-1">
                    <ArrowRight className="w-2.5 h-2.5" />
                    {occ.rescheduledToDate}
                  </span>
                )}
                {occ.completedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTimeOnly(occ.completedAt)}
                  </span>
                )}
                {occ.notes && (
                  <span
                    className="truncate max-w-[200px] text-muted-foreground/60"
                    title={occ.notes}
                  >
                    {occ.notes}
                  </span>
                )}
              </div>
            </div>

            {/* Right: outcome */}
            <span
              className={`text-xs font-medium shrink-0 ${outcomeColor}`}
            >
              {outcome === "rescheduled" && occ.rescheduledToDate
                ? `Rescheduled → ${occ.rescheduledToDate}`
                : outcomeLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
