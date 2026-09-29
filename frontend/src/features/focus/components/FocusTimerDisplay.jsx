import React, { useMemo, useState } from "react";
import { Clock, Plus, Minus, Target, Coffee } from "lucide-react";

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const FocusTimerDisplay = ({
  timeLeft,
  elapsed,
  currentSegment,
  isIdle,
  isRunning,
  plannedDuration,
  onSelectDuration,
  totalFocusSegments,
  completedFocusSegments,
  totalBreakSegments,
  completedBreakSegments,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);

  const total = currentSegment?.totalDuration || plannedDuration || 1500;
  const isBreak = currentSegment?.type === "break";

  // Calculate circular SVG progress stroke
  const strokeOffset = useMemo(() => {
    const remaining = Math.max(0, total - elapsed);
    return CIRCUMFERENCE * (remaining / total);
  }, [total, elapsed]);

  // Format time HH:MM:SS or MM:SS
  const formatTime = (totalSeconds) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => n.toString().padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  };

  const presetDurations = [
    { label: "15m", seconds: 15 * 60, title: "Short Focus" },
    { label: "25m", seconds: 25 * 60, title: "Pomodoro" },
    { label: "45m", seconds: 45 * 60, title: "Deep Work" },
  ];

  const handleApplyCustom = () => {
    onSelectDuration(customMinutes * 60);
    setShowCustomInput(false);
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full select-none">
      <div
        className={`absolute -inset-10 rounded-full blur-[90px] opacity-25 pointer-events-none transition-colors duration-1000 ${
          isBreak ? "bg-emerald-500" : "bg-primary"
        }`}
      />

      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
        <svg
          className="absolute inset-0 w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            className="stroke-muted/30"
            strokeWidth="4"
            fill="none"
          />

          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            className={`transition-all duration-300 ${
              isBreak
                ? "stroke-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "stroke-primary drop-shadow-[0_0_15px_rgba(124,58,237,0.4)]"
            }`}
            strokeWidth="4"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.35s linear" }}
          />
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <span
            className={`text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full mb-1 border ${
              isBreak
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-primary/10 text-primary border-primary/20"
            }`}
          >
            {isBreak ? "Break Interval" : "Deep Focus"}
          </span>

          <div
            className={`font-black tracking-tight tabular-nums drop-shadow-sm select-none ${
              timeLeft >= 3600 ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl"
            } ${isBreak ? "text-emerald-400" : "text-foreground"}`}
          >
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target size={12} className={isBreak ? "text-muted-foreground" : "text-primary"} />
              {completedFocusSegments} / {totalFocusSegments}
            </span>
            {totalBreakSegments > 0 && (
              <span className="flex items-center gap-1">
                <Coffee size={12} className={isBreak ? "text-emerald-400" : "text-muted-foreground"} />
                {completedBreakSegments} / {totalBreakSegments}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Duration picker before start */}
      {isIdle && elapsed === 0 && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            {presetDurations.map((p) => (
              <button
                key={p.seconds}
                onClick={() => {
                  setShowCustomInput(false);
                  onSelectDuration(p.seconds);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  plannedDuration === p.seconds && !showCustomInput
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-secondary/60 text-secondary-foreground border-border/40 hover:bg-secondary"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                showCustomInput
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-secondary/60 text-secondary-foreground border-border/40 hover:bg-secondary"
              }`}
            >
              <Clock size={12} />
              <span>Custom</span>
            </button>
          </div>

          {showCustomInput && (
            <div className="flex items-center gap-3 p-2 bg-secondary/40 border border-border/50 rounded-2xl">
              <button
                onClick={() => setCustomMinutes((m) => Math.max(5, m - 5))}
                className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 active:scale-95"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                min="5"
                max="360"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(1, Number(e.target.value) || 1))}
                className="w-14 text-center font-bold text-sm bg-transparent text-foreground border-none outline-none tabular-nums"
              />
              <span className="text-xs text-muted-foreground mr-1">min</span>
              <button
                onClick={() => setCustomMinutes((m) => Math.min(360, m + 5))}
                className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 active:scale-95"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={handleApplyCustom}
                className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Set
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
