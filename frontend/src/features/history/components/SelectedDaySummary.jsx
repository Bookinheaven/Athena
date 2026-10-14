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
  const routinesPlanned = stats?.routinesPlanned ?? 0;
  const routinesCompleted = stats?.routinesCompleted ?? 0;
  const routinesSkipped = stats?.routinesSkipped ?? 0;
  const effectiveRoutinesPlanned = Math.max(0, routinesPlanned - routinesSkipped);

  const tasksPlanned = stats?.tasksPlanned ?? occurrenceCount ?? 0;
  const tasksCompleted = stats?.tasksCompleted ?? 0;
  const tasksPartiallyCompleted = stats?.tasksPartiallyCompleted ?? 0;
  const tasksRescheduled = stats?.tasksRescheduled ?? 0;
  const tasksCancelled = stats?.tasksCancelled ?? 0;
  const effectiveTasksPlanned = Math.max(0, tasksPlanned - tasksRescheduled - tasksCancelled);

  const effectivePlanned = stats?.effectivePlanned ?? (effectiveTasksPlanned + effectiveRoutinesPlanned);
  const hasEffectivePlan = effectivePlanned > 0;
  const totalFocusMinutes = stats?.totalFocusMinutes ?? 0;

  const focusDisplay =
    totalFocusMinutes >= 60
      ? `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`
      : `${totalFocusMinutes}m`;

  const stateLabel =
    stats?.state === "successful" || stats?.state === "green"
      ? "All done"
      : stats?.state === "partial" || stats?.state === "yellow"
      ? "Partial"
      : stats?.state === "failed" || stats?.state === "red"
      ? "Missed"
      : null;

  const stateLabelColor =
    stats?.state === "successful" || stats?.state === "green"
      ? "text-emerald-500"
      : stats?.state === "partial" || stats?.state === "yellow"
      ? "text-amber-500"
      : stats?.state === "failed" || stats?.state === "red"
      ? "text-rose-500"
      : "text-muted-foreground";

  // Build the secondary line as dot-separated fragments
  const fragments = [];

  if (hasEffectivePlan) {
    if (effectiveTasksPlanned > 0 && effectiveRoutinesPlanned > 0) {
      fragments.push(`${tasksCompleted}/${effectiveTasksPlanned} tasks done`);
      fragments.push(`${routinesCompleted}/${effectiveRoutinesPlanned} routines done`);
    } else if (effectiveRoutinesPlanned > 0) {
      fragments.push(`${routinesCompleted}/${effectiveRoutinesPlanned} routines done`);
    } else {
      fragments.push(`${tasksCompleted}/${effectiveTasksPlanned} tasks done`);
      if (tasksPartiallyCompleted > 0) {
        fragments.push(`${tasksPartiallyCompleted} partial`);
      }
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
