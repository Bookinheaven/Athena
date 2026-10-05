import React from "react";
import { formatDisplayDate } from "../utils/dateUtils.js";

/**
 * Compact day summary — the opening line of a journal record.
 *
 * Hierarchy:
 *   Tuesday, September 29, 2026          [state label]
 *   No planned work · 14 sessions · 6m focused
 *
 * NOT a KPI dashboard. NOT four giant number cards.
 */
export function SelectedDaySummary({ productDate, stats, occurrenceCount, sessionCount }) {
  const tasksPlanned = stats?.tasksPlanned ?? occurrenceCount ?? 0;
  const tasksCompleted = stats?.tasksCompleted ?? 0;
  const tasksPartiallyCompleted = stats?.tasksPartiallyCompleted ?? 0;
  const tasksRescheduled = stats?.tasksRescheduled ?? 0;
  const tasksCancelled = stats?.tasksCancelled ?? 0;
  const effectivePlanned = tasksPlanned - tasksRescheduled - tasksCancelled;
  const hasEffectivePlan = effectivePlanned > 0;
  const totalFocusMinutes = stats?.totalFocusMinutes ?? 0;

  const focusDisplay =
    totalFocusMinutes >= 60
      ? `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`
      : `${totalFocusMinutes}m`;

  const stateLabel =
    stats?.state === "successful"
      ? "All done"
      : stats?.state === "partial"
      ? "Partial"
      : stats?.state === "failed"
      ? "Missed"
      : null;

  const stateLabelColor =
    stats?.state === "successful"
      ? "text-emerald-500"
      : stats?.state === "partial"
      ? "text-amber-500"
      : stats?.state === "failed"
      ? "text-rose-500"
      : "text-muted-foreground";

  // Build the secondary line as dot-separated fragments
  const fragments = [];

  if (hasEffectivePlan) {
    fragments.push(`${tasksCompleted}/${effectivePlanned} tasks done`);
    if (tasksPartiallyCompleted > 0) {
      fragments.push(`${tasksPartiallyCompleted} partial`);
    }
  } else {
    fragments.push("No planned work");
  }

  if (sessionCount > 0) {
    fragments.push(`${sessionCount} ${sessionCount === 1 ? "session" : "sessions"}`);
  }

  if (totalFocusMinutes > 0) {
    fragments.push(`${focusDisplay} focused`);
  }

  return (
    <div className="pb-4 border-b border-border">
      {/* Primary: Date + state */}
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground leading-snug">
          {formatDisplayDate(productDate)}
        </h2>
        {stateLabel && (
          <span className={`text-xs font-medium shrink-0 ${stateLabelColor}`}>
            {stateLabel}
          </span>
        )}
      </div>

      {/* Secondary: dot-separated inline stats */}
      <p className="text-sm text-muted-foreground mt-0.5">
        {fragments.join(" · ")}
      </p>
    </div>
  );
}
