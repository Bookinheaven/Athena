import React from "react";
import { Clock, Activity, CheckCircle2, X, Target, Coffee } from "lucide-react";

export const CurrentProgress = ({
  todos = [],
  show = true,
  onClose,
  hideHeader = false,
  runtime,
}) => {
  if (!show) return null;

  const inProgress = todos.filter((t) => t.status === "In Progress");

  const currentSegment = runtime?.currentSegment || null;
  const segments = runtime?.segments || [];
  const segmentIndex = runtime?.segmentIndex ?? 0;
  const isBreak = currentSegment?.type === "break";

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {!hideHeader && (
        <div className="flex justify-between items-center px-5 py-4 border-b border-border-secondary shrink-0">
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-button-primary" />
            Current Focus
          </h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-background-secondary rounded-md transition text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0 space-y-5">
        {/* Active Segment Status (derived from runtime) */}
        {currentSegment && (
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-primary">
                {isBreak ? <Coffee size={13} /> : <Target size={13} />}
                {isBreak ? "Break Interval" : `Focus Block ${segmentIndex + 1}`}
              </span>
              {segments.length > 1 && (
                <span className="text-muted-foreground text-[10px]">
                  Segment {segmentIndex + 1} / {segments.length}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isBreak
                ? "Relax, hydrate, and get ready for the next block."
                : `Focusing on ${runtime?.sessionTitle || "current task"}.`}
            </p>
          </div>
        )}

        {/* In-Progress Tasks */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Active Task Checklist
          </h4>

          {inProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted opacity-60">
              <CheckCircle2 className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium">No active tasks</p>
              <p className="text-xs mt-1 text-center">
                Set a task to "In Progress" <br /> from your Task List.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgress.map((todo) => (
                <div
                  key={todo.id}
                  className="group relative p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 transition-all duration-300 hover:bg-amber-500/10 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 shrink-0">
                        <Clock className="w-4 h-4 relative z-10" />
                        <span className="absolute inset-0 rounded-full border border-amber-500 animate-ping opacity-30"></span>
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-semibold text-text-primary text-sm truncate">
                          {todo.title || todo.text}
                        </h4>
                        <p className="text-[10px] text-amber-500/80 font-medium uppercase tracking-wider mt-0.5">
                          In Progress
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {inProgress.length > 0 && (
        <div className="px-5 py-3 border-t border-border-secondary bg-background-secondary/30 shrink-0">
          <div className="flex justify-between items-center text-[11px] font-medium text-text-muted uppercase tracking-wider">
            <span>
              {inProgress.length} task{inProgress.length !== 1 && "s"} ongoing
            </span>
            <span className="flex items-center gap-1.5 text-amber-500">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentProgress;
