import React from "react";
import { formatDisplayDate } from "../utils/dateUtils.js";
import { Badge } from "@/components/ui/badge";

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

  const stateBadgeStyles = {
    "All done": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    "Partial": "bg-amber-500/10 text-amber-500 border-amber-500/20",
    "Missed": "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  return (
    <div className="pb-4 border-b border-border/60 space-y-3">
      {/* Primary: Date + state */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground leading-snug">
          {formatDisplayDate(productDate)}
        </h2>
        {stateLabel && (
          <Badge
            variant="outline"
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${stateLabelColor} ${
              stateBadgeStyles[stateLabel] || "bg-muted text-muted-foreground border-border"
            }`}
          >
            {stateLabel}
          </Badge>
        )}
      </div>

      {/* Secondary: dot-separated inline stats */}
      <p className="text-xs sm:text-sm text-muted-foreground/90 font-medium">
        {fragments.join(" · ")}
      </p>

      {/* Quick visual stat pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {totalFocusMinutes > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-mono font-semibold">{focusDisplay}</span> focused
          </div>
        )}
        {hasEffectivePlan && effectivePlanned > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-xs font-medium text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono font-semibold">{tasksCompleted + routinesCompleted}/{effectivePlanned}</span> commitments done
          </div>
        )}
        {sessionCount > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-xs font-medium text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{sessionCount}</span> {sessionCount === 1 ? "session" : "sessions"}
          </div>
        )}
      </div>
    </div>
  );
}
