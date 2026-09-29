import React from "react";
import { Clock, Calendar, Target, Coffee } from "lucide-react";
import { EditableTitle } from "./EditableTitle.jsx";

export const FocusTaskCard = ({
  taskTitle,
  setTaskTitle,
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

        {totalSegments > 1 && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isBreak
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-secondary/60 border-border/40 text-muted-foreground"
              }`}
          >
            {isBreak ? (
              <>
                <Coffee size={12} />
                <span>Break</span>
              </>
            ) : (
              <>
                <Clock size={12} />
                <span>
                  Block {segmentIndex + 1} of {totalSegments}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <EditableTitle
        title={taskTitle}
        setTitle={setTaskTitle}
        className="w-full"
      />

      {isBreak && (
        <p className="text-xs text-emerald-400/90 font-medium mt-1">
          Take a deep breath and stretch. Next focus block starts shortly.
        </p>
      )}
    </div>
  );
};

export default FocusTaskCard;
