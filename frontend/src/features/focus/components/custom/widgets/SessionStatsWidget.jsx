import React from "react";
import { Target, Coffee, PauseCircle, Clock } from "lucide-react";

export const SessionStatsWidget = ({
  runtime,
  timerData,
  totalFocusSegments,
  completedFocusSegments,
  totalBreakSegments,
  completedBreakSegments,
}) => {
  const { sessionStats, state } = runtime;
  const { elapsed } = timerData;

  const formatSecs = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const plannedMins = Math.round((state.plannedDuration || 1500) / 60);

  return (
    <div className="p-4 sm:p-5 flex flex-col h-full bg-transparent">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Session Metrics
          </span>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-foreground">
          {plannedMins}m Goal
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Target size={13} className="text-primary" /> Focus Segments
          </span>
          <span className="text-lg font-black text-foreground mt-1 tabular-nums">
            {completedFocusSegments} / {totalFocusSegments}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Coffee size={13} className="text-emerald-400" /> Break Segments
          </span>
          <span className="text-lg font-black text-foreground mt-1 tabular-nums">
            {completedBreakSegments} / {totalBreakSegments}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <PauseCircle size={13} className="text-amber-400" /> Pauses Taken
          </span>
          <span className="text-lg font-black text-foreground mt-1 tabular-nums">
            {sessionStats?.pauseCount || 0}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock size={13} className="text-blue-400" /> Elapsed Focus
          </span>
          <span className="text-lg font-black text-foreground mt-1 tabular-nums">
            {formatSecs(elapsed || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
