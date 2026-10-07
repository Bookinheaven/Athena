import React from "react";
import { Play, RotateCcw, Clock, Target, Calendar, Sparkles } from "lucide-react";

/**
 * Format relative time or friendly string for session startedAt / createdAt
 */
function formatSessionTime(dateStr) {
  if (!dateStr) return "Earlier";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Earlier";
  }
}

export const ActiveSessionPromptModal = ({
  session,
  incomingContext,
  onResume,
  onStartNew,
}) => {
  if (!session) return null;

  const plannedMinutes = Math.round((session.plannedDuration || 1500) / 60);
  const sessionTitle = session.title || "Untitled Work";
  const startedText = formatSessionTime(session.createdAt || session.startedAt);
  const segments = session.sessionSegments || [];
  const completedSegments = segments.filter((s) => s.completedAt).length;
  const totalSegments = segments.length || 1;

  const hasIncomingTask = Boolean(
    incomingContext?.title &&
    incomingContext.title !== sessionTitle
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="active-session-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-7 flex flex-col gap-5 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Ambient subtle glow background */}
        <div
          className="absolute -top-20 -right-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div className="flex flex-col gap-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3 h-3" />
              Active Session Found
            </span>
          </div>
          <h2
            id="active-session-modal-title"
            className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
          >
            Resume or start new session?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            An in-progress focus session was detected from another device or previous visit. Choose how you would like to proceed.
          </p>
        </div>

        {/* Active Session Summary Card */}
        <div className="rounded-2xl bg-secondary/40 border border-border/60 p-4 sm:p-5 flex flex-col gap-3 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                In-Progress Session
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug break-words">
                {sessionTitle}
              </h3>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-semibold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs text-muted-foreground border-t border-border/40 pt-2.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary/70" />
              <span>{plannedMinutes}m target</span>
            </div>
            <span className="opacity-40">•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
              <span>{startedText}</span>
            </div>
            {totalSegments > 1 && (
              <>
                <span className="opacity-40">•</span>
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span>
                    Block {completedSegments + 1} of {totalSegments}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Incoming Task Context Notice (if navigating to a new task) */}
        {hasIncomingTask && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground relative z-10">
            <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-primary">
                Requested New Task
              </span>
              <span className="text-muted-foreground">
                You selected <strong className="text-foreground">{incomingContext.title}</strong>. Choosing "Start New Session" will discard the previous session and focus on this task.
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-1 relative z-10">
          <button
            type="button"
            onClick={onStartNew}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground font-semibold text-xs sm:text-sm border border-border/80 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            <span>Start New Session</span>
          </button>

          <button
            type="button"
            onClick={onResume}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer ring-2 ring-primary/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Continue Session</span>
          </button>
        </div>

        <p className="text-[11px] text-center text-muted-foreground/70 relative z-10">
          Starting a new session will mark the previous active session as abandoned.
        </p>
      </div>
    </div>
  );
};

export default ActiveSessionPromptModal;
