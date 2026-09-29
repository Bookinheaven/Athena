import React, { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  StopCircle,
  SkipForward,
  Loader2,
  Sparkles,
  Coffee,
} from "lucide-react";

const PAUSE_REASONS = [
  { id: "Meeting", icon: "👥" },
  { id: "Phone Call", icon: "📞" },
  { id: "Emergency", icon: "🚨" },
  { id: "Lunch", icon: "🍱" },
  { id: "Break", icon: "☕" },
  { id: "Custom", icon: "✏️" },
];

export const FocusControls = ({
  phase,
  isRunning,
  isPaused,
  isCompleting,
  isCompleted,
  currentSegment,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onSkipBreak,
  onReview,
  onSelectPauseReason,
}) => {
  const [activeReason, setActiveReason] = useState("Break");
  const isBreak = currentSegment?.type === "break";

  const handleReasonClick = (reasonId) => {
    setActiveReason(reasonId);
    onSelectPauseReason?.(reasonId);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 mt-6 select-none w-full max-w-md mx-auto">
      <div className="flex items-center gap-3 p-1.5 rounded-full bg-secondary/40 backdrop-blur-xl border border-border/50 shadow-lg">
        {isCompleted ? (
          <button
            type="button"
            onClick={onReview}
            className="flex items-center gap-2.5 px-8 py-3 rounded-full bg-emerald-500 text-white font-bold text-sm shadow-md hover:bg-emerald-600 active:scale-95 transition-all"
          >
            <Sparkles size={18} />
            <span>Review Session</span>
          </button>
        ) : isCompleting ? (
          <div className="flex items-center gap-2.5 px-8 py-3 rounded-full bg-primary/80 text-primary-foreground font-bold text-sm shadow-md cursor-wait">
            <Loader2 size={18} className="animate-spin" />
            <span>Completing...</span>
          </div>
        ) : isRunning ? (
          <button
            type="button"
            onClick={onPause}
            className="flex items-center gap-2.5 px-9 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-95 active:scale-95 transition-all"
          >
            <Pause size={18} fill="currentColor" />
            <span>Pause</span>
          </button>
        ) : isPaused ? (
          <button
            type="button"
            onClick={onResume}
            className="flex items-center gap-2.5 px-9 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-95 active:scale-95 transition-all"
          >
            <Play size={18} fill="currentColor" />
            <span>Resume</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            className={`flex items-center gap-2.5 px-9 py-3.5 rounded-full font-bold text-sm shadow-md hover:opacity-95 active:scale-95 transition-all ${
              isBreak
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isBreak ? (
              <>
                <Coffee size={18} />
                <span>Start Break</span>
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                <span>Start Focus</span>
              </>
            )}
          </button>
        )}

        {isBreak && !isCompleted && (
          <button
            type="button"
            onClick={onSkipBreak}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all active:scale-95"
            title="Skip Break"
          >
            <SkipForward size={17} />
          </button>
        )}

        {(isRunning || isPaused) && (
          <button
            type="button"
            onClick={onStop}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-secondary/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all active:scale-95"
            title="Stop & Discard Session"
          >
            <StopCircle size={17} />
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all active:scale-95"
          title="Reset Session (R)"
        >
          <RotateCcw size={17} />
        </button>
      </div>

      {/* Pause reasons selector */}
      {isPaused && (
        <div className="w-full flex flex-col items-center gap-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Pause Reason
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {PAUSE_REASONS.map((r) => {
              const isSelected = activeReason === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleReasonClick(r.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                      : "bg-secondary/60 text-muted-foreground border-border/40 hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{r.icon}</span>
                  <span>{r.id}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Keyboard shortcuts reminder */}
      <div className="text-[11px] text-muted-foreground/70 text-center tracking-wide mt-2">
        <kbd className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono text-[10px]">
          Space
        </kbd>{" "}
        Start/Pause •{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono text-[10px]">
          R
        </kbd>{" "}
        Reset •{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono text-[10px]">
          Z
        </kbd>{" "}
        Zen
      </div>
    </div>
  );
};

export default FocusControls;
