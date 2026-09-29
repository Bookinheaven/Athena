import React from "react";
import { Clock, Calendar, CheckCircle2, Target, Coffee } from "lucide-react";
import { EditableTitle } from "@/pages/user/focus/components/EditableTitle";

export const FocusTaskCard = ({
  taskTitle,
  setTaskTitle,
  onTitleSet,
  navContext,
  isScheduled,
  scheduleBlock,
  currentSegment,
  segmentIndex,
  totalSegments,
  totalFocusSegments,
  totalBreakSegments,
  plannedDuration,
  todos = [],
}) => {
  const plannedMinutes = Math.round((plannedDuration || 1500) / 60);

  // Format scheduled block time interval
  const formatTime = (isoString) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  };

  const startTimeStr =
    formatTime(navContext?.startTime) ||
    formatTime(scheduleBlock?.startTime);
  const endTimeStr =
    formatTime(navContext?.endTime) ||
    formatTime(scheduleBlock?.endTime);

  const scheduledTimeInterval =
    startTimeStr && endTimeStr ? `${startTimeStr} – ${endTimeStr}` : null;

  const completedTodos = todos.filter((t) => t.status === "Completed").length;
  const isBreak = currentSegment?.type === "break";

  return (
    <div className="w-full flex flex-col items-center text-center max-w-xl mx-auto mb-6 px-4">
      <div className="flex items-center gap-2 flex-wrap justify-center mb-3">
        {isScheduled || navContext?.source === "timeline" ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-wide">
            <Calendar size={13} />
            <span>
              {scheduledTimeInterval
                ? `Scheduled • ${scheduledTimeInterval}`
                : "Scheduled Block"}
            </span>
            <span className="opacity-40">•</span>
            <span>{plannedMinutes}m</span>
          </div>
        ) : navContext?.source === "today" ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold tracking-wide">
            <Target size={13} />
            <span>Today's Priority</span>
            <span className="opacity-40">•</span>
            <span>{plannedMinutes}m</span>
          </div>
        ) : navContext?.source === "planner" ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold tracking-wide">
            <Target size={13} />
            <span>Planner Task</span>
            <span className="opacity-40">•</span>
            <span>{plannedMinutes}m</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-wide">
            <Clock size={13} />
            <span>Quick Focus</span>
            <span className="opacity-40">•</span>
            <span>{plannedMinutes}m</span>
          </div>
        )}

        {todos.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 border border-border/40 text-muted-foreground text-xs font-medium">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>
              {completedTodos} / {todos.length} done
            </span>
          </div>
        )}
      </div>

      <div className="w-full">
        {isBreak ? (
          <div className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-black text-emerald-400">
            <Coffee size={26} />
            <span>Rest & Recharge</span>
          </div>
        ) : (
          <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight drop-shadow-sm">
            <EditableTitle
              title={taskTitle}
              setTitle={setTaskTitle}
              titleSet={onTitleSet}
            />
          </div>
        )}
      </div>

      {totalSegments > 0 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {Array.from({ length: totalSegments }).map((_, i) => {
            const isCompletedSeg = i < segmentIndex;
            const isActiveSeg = i === segmentIndex;
            return (
              <div
                key={i}
                className={`transition-all duration-300 rounded-full ${isActiveSeg
                    ? isBreak
                      ? "w-7 h-2 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      : "w-7 h-2 bg-primary shadow-[0_0_10px_rgba(124,58,237,0.5)] animate-pulse"
                    : isCompletedSeg
                      ? "w-2.5 h-2 bg-muted-foreground/30"
                      : "w-2.5 h-2 bg-border/40"
                  }`}
                title={`Segment ${i + 1} of ${totalSegments}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
