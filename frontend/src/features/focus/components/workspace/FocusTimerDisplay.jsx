import React, { useMemo, useState } from "react";
import { Clock, Plus, Minus, Target, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";

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
          <div className="flex items-center gap-1.5 sm:gap-2">
            {presetDurations.map((p) => {
              const isSelected = plannedDuration === p.seconds && !showCustomInput;
              return (
                <Button
                  key={p.seconds}
                  type="button"
                  variant={isSelected ? "default" : "secondary"}
                  size="sm"
                  onClick={() => {
                    setShowCustomInput(false);
                    onSelectDuration(p.seconds);
                  }}
                  className={`h-7 px-3 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? "shadow-xs"
                      : "text-muted-foreground hover:text-foreground border border-border/40"
                  }`}
                >
                  {p.label}
                </Button>
              );
            })}
            <Button
              type="button"
              variant={showCustomInput ? "default" : "secondary"}
              size="sm"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`h-7 px-3 rounded-xl text-xs font-bold gap-1 transition-all ${
                showCustomInput
                  ? "shadow-xs"
                  : "text-muted-foreground hover:text-foreground border border-border/40"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Custom</span>
            </Button>
          </div>

          {showCustomInput && (
            <div className="flex items-center gap-2 p-1.5 px-2 bg-secondary/50 border border-border/60 rounded-2xl shadow-xs animate-in fade-in-50 zoom-in-95 duration-150">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCustomMinutes((m) => Math.max(5, m - 5))}
                className="h-7 w-7 rounded-xl hover:bg-background/60 active:scale-95 text-foreground shrink-0"
                title="Decrease 5 min"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>

              <div className="relative flex items-center">
                <Input
                  type="number"
                  min="5"
                  max="360"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(1, Number(e.target.value) || 1))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplyCustom();
                  }}
                  className="h-7 w-16 text-center font-bold text-xs pr-6 rounded-xl bg-background/60 border-border/60 focus-visible:ring-1 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] font-semibold text-muted-foreground absolute right-2 pointer-events-none select-none">
                  min
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCustomMinutes((m) => Math.min(360, m + 5))}
                className="h-7 w-7 rounded-xl hover:bg-background/60 active:scale-95 text-foreground shrink-0"
                title="Increase 5 min"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleApplyCustom}
                className="h-7 px-2.5 rounded-xl font-bold text-xs shadow-2xs shrink-0"
              >
                Set
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FocusTimerDisplay;
