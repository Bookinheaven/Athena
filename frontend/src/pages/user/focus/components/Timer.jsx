import { useMemo, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export const Timer = ({
  timer,
  isBreak,
  sessionType,
  setSessionType,
  breaksLeft,
  onReset,
}) => {
  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const progress = useMemo(
    () => ((timer.duration - timer.timeLeft) / timer.duration) * 283,
    [timer.duration, timer.timeLeft]
  );

  const durations = [
    { label: "15m", value: 15 * 60, type: "Short" },
    { label: "25m", value: 25 * 60, type: "Pomodoro" },
    { label: "45m", value: 45 * 60, type: "Long" },
  ];

  const nextMessage = useMemo(() => {
    const mins = Math.ceil(timer.timeLeft / 60);
    return isBreak
      ? `Next focus in ${mins} min${mins > 1 ? "s" : ""}`
      : `Next break in ${mins} min${mins > 1 ? "s" : ""}`;
  }, [isBreak, timer.timeLeft]);

  return (
    <div className="p-8 rounded-3xl shadow-2xl w-full max-w-md bg-card-background border border-card-border card-hover">
      <div className="text-center mb-6">
        <span
          className={`inline-block px-6 py-2 rounded-full text-sm font-medium border ${
            isBreak
              ? "bg-success-bg text-success-text border-button-success"
              : "bg-background-secondary text-text-accent border-button-primary"
          }`}
        >
          {isBreak ? "☕ Break Time" : `🎯 ${sessionType} Focus`}
        </span>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg
            className="absolute top-0 left-0 w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              className="stroke-border-secondary opacity-20"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              className={
                isBreak ? "stroke-button-success" : "stroke-button-primary"
              }
              strokeWidth="4"
              fill="none"
              strokeDasharray="283"
              strokeDashoffset={283 - progress}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          </svg>
          <div className="text-center">
            <div className="text-6xl font-bold text-text-primary mb-1">
              {formatTime(timer.timeLeft)}
            </div>
            <div className="text-sm text-text-muted">{nextMessage}</div>
          </div>
        </div>
      </div>

      {!timer.isStarted && !isBreak && (
        <div className="flex gap-2 justify-center mb-6 flex-wrap">
          {durations.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setSessionType(opt.type);
                timer.setNewDuration(opt.value);
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border border-card-border ${
                timer.duration === opt.value
                  ? "bg-button-primary text-button-primary-text scale-105"
                  : "bg-button-secondary text-button-secondary-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-4">
        <button
          onClick={timer.isStarted ? timer.pause : timer.start}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-button-primary text-button-primary-text shadow-lg transition-all duration-300"
        >
          {timer.isStarted ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {timer.isStarted ? "Pause" : "Start"}
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-button-secondary text-button-secondary-text border border-card-border transition-all duration-300"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-text-muted">
        <kbd className="px-2 py-1 rounded bg-background-secondary text-text-secondary">
          Space
        </kbd>{" "}
        Start/Pause •{" "}
        <kbd className="px-2 py-1 rounded bg-background-secondary text-text-secondary">
          R
        </kbd>{" "}
        Reset
      </div>
    </div>
  );
};
