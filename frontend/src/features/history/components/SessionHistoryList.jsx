import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatDuration,
  formatTimeOnly,
  formatTimeRange,
} from "../utils/dateUtils.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


const STATUS_COLOR = {
  active: "text-emerald-500 font-semibold",
  completed: "text-muted-foreground",
  partial: "text-amber-500/70",
  abandoned: "text-rose-500/70",
  skipped: "text-muted-foreground/50",
};

const STATUS_LABEL = {
  active: "In Progress",
  completed: "Completed",
  partial: "Partial",
  abandoned: "Abandoned",
  skipped: "Skipped",
};

const OUTCOME_COLOR = {
  active: "text-emerald-500",
  completed: "text-emerald-500",
  partial: "text-amber-500",
  abandoned: "text-rose-500",
  skipped: "text-muted-foreground",
};

function SessionExpandedDetail({ session }) {
  const snapshot = session.scheduleSnapshot;
  const actualDuration = formatDuration(session.duration || 0);
  const plannedDuration = session.plannedDuration
    ? `${Math.round(session.plannedDuration / 60)}m`
    : snapshot?.plannedDurationMinutes || snapshot?.durationMinutes
      ? `${snapshot.plannedDurationMinutes || snapshot.durationMinutes}m`
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
  const fb = session.sessionFeedback || session.feedback;
  const hasReflection = fb && (fb.focus || fb.mood || fb.notes || fb.distractions);

  return (
    <div
      data-testid={`session-detail-${session._id}`}
      className="mx-0 mb-1.5 rounded-b-lg border border-t-0 border-border/50 bg-muted/20 px-4 py-3 text-xs space-y-3"
    >
      {/* Session Performance Breakdown */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Session Breakdown
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 bg-background/70 border border-border/50 rounded-md px-2.5 py-1">
            <span className="text-muted-foreground text-[11px]">Duration:</span>
            <span className="font-semibold text-foreground font-mono tabular-nums">
              {actualDuration}
            </span>
            {plannedDuration && (
              <span className="text-muted-foreground/70 text-[11px]">
                ({plannedDuration} planned)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-background/70 border border-border/50 rounded-md px-2.5 py-1">
            <span className="text-muted-foreground text-[11px]">Outcome:</span>
            <span className={`font-medium capitalize ${outcomeColor}`}>
              {outcomeLabel}
            </span>
          </div>

          {focusSegs > 0 && (
            <div className="flex items-center gap-1.5 bg-background/70 border border-border/50 rounded-md px-2.5 py-1">
              <span className="text-muted-foreground text-[11px]">Focus:</span>
              <span className="font-semibold text-foreground tabular-nums">
                {focusSegs} {focusSegs === 1 ? "segment" : "segments"}
              </span>
            </div>
          )}

          {breakSegs > 0 && (
            <div className="flex items-center gap-1.5 bg-background/70 border border-border/50 rounded-md px-2.5 py-1">
              <span className="text-muted-foreground text-[11px]">Breaks:</span>
              <span className="font-semibold text-foreground tabular-nums">
                {breakSegs} {breakSegs === 1 ? "segment" : "segments"}
              </span>
            </div>
          )}

          {interruptions > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-md px-2.5 py-1">
              <span className="text-[11px]">Pauses:</span>
              <span className="font-semibold tabular-nums">
                {interruptions}
              </span>
            </div>
          )}

          {scheduleWindow && (
            <div className="flex items-center gap-1.5 bg-background/70 border border-border/50 rounded-md px-2.5 py-1">
              <span className="text-muted-foreground text-[11px]">Scheduled:</span>
              <span className="font-medium text-foreground">{scheduleWindow}</span>
            </div>
          )}

          {session.routineTitle && (
            <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 text-primary rounded-md px-2.5 py-1">
              <span className="text-[11px]">Routine:</span>
              <span className="font-medium">
                {session.routineTitle}
                {session.routineStepTitle && ` · ${session.routineStepTitle}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Reflection & Notes */}
      {hasReflection && (
        <div className="border-t border-border/40 pt-2.5 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Reflection
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {fb.focus && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Focus quality:</span>
                <span className="font-semibold text-foreground">{fb.focus} / 5</span>
              </div>
            )}
            {fb.mood && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Mood:</span>
                <span className="font-semibold text-foreground">{fb.mood} / 5</span>
              </div>
            )}
          </div>
          {(fb.distractions || fb.notes) && (
            <blockquote className="text-xs text-foreground/80 bg-background/70 border-l-2 border-primary/60 rounded-r-md p-2.5 italic leading-relaxed mt-1">
              {fb.distractions || fb.notes}
            </blockquote>
          )}
        </div>
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
          const rawTitle =
            snapshot?.taskTitle || session.title || "Untitled Session";
          const title =
            rawTitle.replace(/^Focus Session:\s*/i, "").trim() || rawTitle;
          const completionType =
            session.completionType || session.status || "completed";
          const duration = formatDuration(session.duration || 0);
          const startedAt = formatTimeOnly(
            session.startedAt || session.startTime || session.createdAt
          );
          const focusSegs =
            session.sessionStats?.focusSegmentsCompleted ?? 0;
          const pauses =
            session.sessionStats?.interruptions ?? session.pauses ?? 0;
          const statusLabel = STATUS_LABEL[completionType] ?? completionType;
          const statusColor =
            STATUS_COLOR[completionType] ?? "text-muted-foreground";

          const windowPart = snapshot?.startTime
            ? formatTimeRange(snapshot.startTime, snapshot.endTime)
            : null;
          // Prefer scheduled time range if available; otherwise show start time
          const timePart = windowPart || startedAt;

          const segsPart = `${focusSegs} focus ${
            focusSegs === 1 ? "segment" : "segments"
          }`;
          const pausesPart =
            pauses > 0
              ? `${pauses} ${pauses === 1 ? "pause" : "pauses"}`
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
                      <Badge variant="secondary" className="text-[10px] text-primary/80 font-medium h-4 px-1.5">
                        scheduled
                      </Badge>
                    )}
                    {session.routineOccurrenceId && (
                      <Badge variant="outline" className="text-[10px] text-amber-500 font-medium h-4 px-1.5 border-amber-500/30">
                        routine
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {timePart && `${timePart} · `}
                    <span className={statusColor}>{statusLabel}</span>
                    {" · "}
                    {segsPart}
                    {pausesPart && ` · ${pausesPart}`}
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
        <div className="flex items-center justify-between pt-2.5 text-xs text-muted-foreground border-t border-border/40 mt-1.5">
          <span>
            {pagination.page} / {pagination.totalPages} · {pagination.total}{" "}
            sessions
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange?.(pagination.page - 1)}
              className="size-7"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className="size-7"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
