import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatDuration,
  formatTimeOnly,
  formatTimeRange,
} from "../utils/dateUtils.js";

/**
 * Session history list with INLINE expansion.
 *
 * Collapsed row:
 *   Title                                              45m
 *   2:55 PM · Completed · 1 focus segment
 *
 * Clicking a row expands a detail panel directly below it.
 * Only one session can be expanded at a time.
 * No modal, no drawer, no overlay.
 */

const STATUS_COLOR = {
  completed: "text-muted-foreground",
  partial: "text-amber-500/70",
  abandoned: "text-rose-500/70",
  skipped: "text-muted-foreground/50",
};

const STATUS_LABEL = {
  completed: "Completed",
  partial: "Partial",
  abandoned: "Abandoned",
  skipped: "Skipped",
};

const OUTCOME_COLOR = {
  completed: "text-emerald-500",
  partial: "text-amber-500",
  abandoned: "text-rose-500",
  skipped: "text-muted-foreground",
};

/**
 * Expanded detail panel — renders below the clicked session row.
 * Uses only data from the already-loaded session object.
 */
function SessionExpandedDetail({ session }) {
  const snapshot = session.scheduleSnapshot;
  const actualDuration = formatDuration(session.duration || 0);
  const plannedDuration = snapshot?.plannedDurationMinutes
    ? `${snapshot.plannedDurationMinutes}m`
    : null;
  const outcome = session.completionType || session.status || "completed";
  const outcomeLabel = STATUS_LABEL[outcome] ?? outcome;
  const outcomeColor = OUTCOME_COLOR[outcome] ?? "text-muted-foreground";
  const focusSegs = session.sessionStats?.focusSegmentsCompleted ?? 0;
  const breakSegs = session.sessionStats?.breakSegmentsCompleted ?? 0;
  const interruptions =
    session.sessionStats?.interruptions ?? session.pauses ?? 0;
  const scheduleWindow = snapshot?.startTime
    ? formatTimeRange(snapshot.startTime, snapshot.endTime)
    : null;
  const fb = session.sessionFeedback;
  const hasReflection = fb && (fb.focus || fb.mood || fb.notes);

  return (
    <div
      data-testid={`session-detail-${session._id}`}
      className="mx-0 mb-1 rounded-b-lg border border-t-0 border-border/60 bg-muted/30 px-4 py-3 text-xs space-y-3"
    >
      {/* Section: Duration + Outcome */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Duration
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-muted-foreground">Actual</span>
          <span className="font-semibold font-mono text-foreground tabular-nums">
            {actualDuration}
          </span>
          {plannedDuration && (
            <>
              <span className="text-muted-foreground">Planned</span>
              <span className="font-semibold font-mono text-foreground tabular-nums">
                {plannedDuration}
              </span>
            </>
          )}
          <span className="text-muted-foreground">Outcome</span>
          <span className={`font-medium capitalize ${outcomeColor}`}>
            {outcomeLabel}
          </span>
        </div>
      </div>

      <div className="border-t border-border/40" />

      {/* Section: Telemetry */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Telemetry
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-muted-foreground">Focus segments</span>
          <span className="font-semibold text-foreground tabular-nums">
            {focusSegs}
          </span>
          <span className="text-muted-foreground">Break segments</span>
          <span className="font-semibold text-foreground tabular-nums">
            {breakSegs}
          </span>
          <span className="text-muted-foreground">Interruptions</span>
          <span className="font-semibold text-foreground tabular-nums">
            {interruptions}
          </span>
          {scheduleWindow && (
            <>
              <span className="text-muted-foreground">Scheduled</span>
              <span className="font-mono text-foreground">{scheduleWindow}</span>
            </>
          )}
        </div>
      </div>

      {/* Section: Reflection — only when data is present */}
      {hasReflection && (
        <>
          <div className="border-t border-border/40" />
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Reflection
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {fb.focus && (
                <>
                  <span className="text-muted-foreground">Focus quality</span>
                  <span className="font-semibold text-foreground">
                    {fb.focus} / 5
                  </span>
                </>
              )}
              {fb.mood && (
                <>
                  <span className="text-muted-foreground">Mood</span>
                  <span className="font-semibold text-foreground">
                    {fb.mood} / 5
                  </span>
                </>
              )}
            </div>
            {fb.notes && (
              <blockquote className="text-muted-foreground border-l-2 border-border pl-2.5 mt-1.5 leading-relaxed italic">
                {fb.notes}
              </blockquote>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function SessionHistoryList({
  sessions = [],
  pagination = {},
  isLoading = false,
  onPageChange,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const handleRowClick = (sessionId) => {
    setExpandedId((prev) => (prev === sessionId ? null : sessionId));
  };

  if (isLoading) {
    return (
      <div className="space-y-px">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-muted/20 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No focus sessions recorded for this day.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      <div>
        {sessions.map((session) => {
          const snapshot = session.scheduleSnapshot;
          const title =
            snapshot?.taskTitle || session.title || "Untitled Session";
          const completionType =
            session.completionType || session.status || "completed";
          const duration = formatDuration(session.duration || 0);
          const startedAt = formatTimeOnly(
            session.startTime || session.createdAt
          );
          const focusSegs =
            session.sessionStats?.focusSegmentsCompleted ?? 0;
          const pauses =
            session.sessionStats?.interruptions ?? session.pauses ?? 0;
          const statusLabel = STATUS_LABEL[completionType] ?? completionType;
          const statusColor =
            STATUS_COLOR[completionType] ?? "text-muted-foreground";

          const timePart = startedAt;
          const segsPart = `${focusSegs} focus ${
            focusSegs === 1 ? "segment" : "segments"
          }`;
          const pausesPart =
            pauses > 0
              ? `${pauses} ${pauses === 1 ? "pause" : "pauses"}`
              : null;
          const windowPart = snapshot?.startTime
            ? formatTimeRange(snapshot.startTime, snapshot.endTime)
            : null;

          const isExpanded = expandedId === session._id;

          return (
            <div key={session._id}>
              {/* Collapsed row */}
              <div
                data-testid={`session-item-${session._id}`}
                onClick={() => handleRowClick(session._id)}
                className={[
                  "flex items-start justify-between gap-4 py-2 cursor-pointer group transition-colors",
                  "border-b hover:-mx-2 hover:px-2 hover:rounded hover:bg-muted/20",
                  isExpanded
                    ? "border-border/60 rounded-t-lg bg-muted/10 -mx-2 px-2 border-b-0"
                    : "border-border/40 last:border-0",
                ].join(" ")}
              >
                {/* Left */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {title}
                    </span>
                    {snapshot?.blockId && (
                      <span className="text-[10px] text-primary/60 shrink-0 font-medium">
                        scheduled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {timePart}
                    {" · "}
                    <span className={statusColor}>{statusLabel}</span>
                    {" · "}
                    {segsPart}
                    {pausesPart && ` · ${pausesPart}`}
                    {windowPart && ` · ${windowPart}`}
                  </p>
                </div>

                {/* Right: duration */}
                <span className="text-sm font-semibold font-mono text-foreground shrink-0 tabular-nums pt-px">
                  {duration}
                </span>
              </div>

              {/* Inline expansion */}
              {isExpanded && <SessionExpandedDetail session={session} />}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <span>
            {pagination.page} / {pagination.totalPages} · {pagination.total}{" "}
            sessions
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange?.(pagination.page - 1)}
              className="p-1 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className="p-1 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
