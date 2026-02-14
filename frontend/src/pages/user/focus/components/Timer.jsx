import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Clock,
  Target,
  Coffee,
} from "lucide-react";
import toast from "react-hot-toast";
import { EditableTitle } from "./EditableTitle";

const R = 45;
const CIRCUMFERENCE = 2 * Math.PI * R;

export const Timer = ({
  timeLeft,
  isStarted,
  start,
  pause,
  reset,
  isBreak,
  sessionTitle,
  setSessionTitle,
  setTotalFocusDuration,
  totalFocusDuration,
  breaksLeft,
  currentSegmentData,
  setNewSession,
  currentSegmentIndex,
  totalSegments,
  totalfocusSegments,
  totalbreakSegments,
  onUpdateBackend,
  foucsSegments: focusSegmentsLeft,
}) => {
  const [customMinutes, setCustomMinutes] = useState(25);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [sessionType, setSessionType] = useState("");

  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const focusEndSound = useRef(null);
  const breakEndSound = useRef(null);

  // useEffect(() => {
  //   focusEndSound.current = new Audio("/focus_ended.mp3");
  //   breakEndSound.current = new Audio("/break_ended.mp3");
  //   if (currentSegmentData && currentSegmentData.duration > 0) {
  //     setPaused(true);
  //   }
  // }, []);

  const notify = useCallback((msg, type = "success") => {
    if (type === "success") toast.success(msg);
    else if (type === "error") toast.error(msg);
    else toast(msg);
  }, []);

  const durations = [
    { label: "15m", value: 15 * 60, type: "Short" },
    { label: "25m", value: 25 * 60, type: "Pomodoro" },
    { label: "45m", value: 45 * 60, type: "Long" },
  ];

  const handleStartPause = useCallback(() => {
    if (isStarted) {
      pause();
    } else {
      start();
    }
  }, [isStarted, pause, start]);

  const formatTime = useCallback((totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const pad = (n) => n.toString().padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }, []);

  const getTimeSizeClass = (seconds) =>
    Math.floor(seconds / 3600) > 0 ? "text-4xl" : "text-6xl";

  const progress = useMemo(() => {
    const total = currentSegmentData?.totalDuration || totalFocusDuration || 1;
    const remaining = Math.max(0, timeLeft);
    return CIRCUMFERENCE * (remaining / total);
  }, [timeLeft, totalFocusDuration, currentSegmentData?.totalDuration]);

  const handleDecrement = useCallback(
    () => setCustomMinutes((p) => Math.max(10, p - 1)),
    [],
  );
  const handleIncrement = useCallback(
    () => setCustomMinutes((p) => Math.min(999, p + 1)),
    [],
  );

  const handleMouseUp = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  };

  const handleMouseDown = (action) => {
    action();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(action, 100);
    }, 400);
  };

  const handleCustomTimeSet = useCallback(() => {
    const customDuration = customMinutes * 60;
    setTotalFocusDuration(customDuration);
    setNewSession();
    setShowCustomInput(false);
    setSessionType(`${customMinutes}m Custom`);
  }, [customMinutes, setTotalFocusDuration, setNewSession, setSessionType]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isTyping = /^(input|textarea)$/i.test(event.target.tagName);

      if (event.code === "Space" && !isTyping) {
        event.preventDefault();
        handleStartPause();
      } else if (event.key.toLowerCase() === "r" && !isTyping) {
        reset();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleStartPause, reset]);

  const activeTime = timeLeft;

  useEffect(()=> {
    console.log(isStarted)
    console.log(isBreak)
  }, [isStarted, isBreak])
  useEffect(() => {
    if (timeLeft === 0 && isStarted) {
      if (isBreak) {
        // breakEndSound.current?.play().catch(console.error);
        notify("☕ Break ended! Time to focus again!");
      } else {
        // focusEndSound.current?.play().catch(console.error);
        notify("🎯 Focus session complete!");
      }
    }
  }, [timeLeft, isStarted, isBreak, notify]);

  useEffect(
    () => () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    },
    [],
  );

  const completedFocusSegments = totalfocusSegments - focusSegmentsLeft;
  const completedBreakSegments = totalbreakSegments - breaksLeft;

  return (
    <div className="lg:min-w-lg lg:max-w-md md:min-w-lg min-w-full p-8 rounded-3xl shadow-2xl w-full bg-card-background border border-card-border card-hover relative flex flex-col hover:border-blue-400">
      <div className="text-center mb-6 pt-4 h-10 flex items-center justify-center">
        <EditableTitle
          title={sessionTitle}
          setTitle={setSessionTitle}
          onUpdateBackend={onUpdateBackend}
        />
      </div>
      {totalSegments > 0 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {Array.from({ length: totalSegments }).map((_, i) => {
            const done = i < currentSegmentIndex;
            const active = i === currentSegmentIndex;
            return (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  active ? "w-3 h-3 shadow-md" : "w-2 h-2"
                } ${
                  done
                    ? "bg-text-muted opacity-30"
                    : active
                      ? isBreak
                        ? "bg-button-success"
                        : "bg-button-primary animate-pulse"
                      : "bg-border-secondary opacity-50"
                }`}
              />
            );
          })}
        </div>
      )}

      <div className="text-center mb-6 pt-4 h-10 flex items-center justify-center">
        <span
          className={`group inline-flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium border transition-colors ${
            isBreak
              ? "bg-success-bg text-success-text border-button-success"
              : "bg-background-secondary text-text-accent border-button-primary hover:bg-card-border cursor-pointer"
          }`}
          title={isBreak ? "" : "Click to edit title"}
        >
          {isBreak ? "☕ Break Time" : `🎯 ${sessionType || "Focus Session"}`}
        </span>
      </div>

      <div className="flex flex-col items-center mb-8 flex-grow">
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
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={progress}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          </svg>
          <div className="text-center w-full">
            <div
              className={`font-bold text-text-primary ${getTimeSizeClass(
                activeTime,
              )}`}
            >
              {formatTime(activeTime)}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mt-auto pt-4 border-t border-card-border/50">
        <div className="flex justify-around text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-text-secondary">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Focus</span>
            </div>
            <span className="text-lg font-bold text-text-primary">
              {completedFocusSegments} / {totalfocusSegments}
            </span>
          </div>
          {totalbreakSegments > 0 && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-text-secondary">
                <Coffee className="w-4 h-4" />
                <span className="text-sm font-medium">Breaks</span>
              </div>
              <span className="text-lg font-bold text-text-primary">
                {completedBreakSegments} / {totalbreakSegments}
              </span>
            </div>
          )}
        </div>
      </div>

      {!isStarted && !isBreak && !currentSegmentData?.duration > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-2 justify-center flex-wrap">
            {durations.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setShowCustomInput(false);
                  setSessionType(opt.type);
                  setTotalFocusDuration(opt.value);
                  setNewSession();
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border border-card-border ${
                  totalFocusDuration === opt.value && !showCustomInput
                    ? "bg-button-primary text-button-primary-text scale-105"
                    : "bg-button-secondary text-button-secondary-text hover:scale-105"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border border-card-border ${
                showCustomInput
                  ? "bg-button-primary text-button-primary-text scale-105"
                  : "bg-button-secondary text-button-secondary-text hover:scale-105"
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" /> Custom
            </button>
          </div>

          {showCustomInput && (
            <div className="bg-background-secondary/50 p-4 rounded-xl border border-card-border">
              <div className="flex items-center justify-center gap-4">
                <button
                  onMouseDown={() => handleMouseDown(handleDecrement)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={() => handleMouseDown(handleDecrement)}
                  onTouchEnd={handleMouseUp}
                  className="w-12 h-12 rounded-full bg-button-secondary text-button-secondary-text border border-card-border hover:bg-button-secondary-hover transition-all duration-200 flex items-center justify-center active:scale-95"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  min="10"
                  max="999"
                  value={customMinutes}
                  onChange={(e) => {
                    const val = Math.min(
                      999,
                      Math.max(10, +e.target.value || 1),
                    );
                    setCustomMinutes(val);
                  }}
                  className="w-20 h-12 text-center text-xl font-bold bg-input-background border border-input-border rounded-xl text-text-primary focus:ring-2 focus:ring-button-primary focus:border-transparent transition-all"
                />
                <span className="text-text-secondary font-medium">min</span>
                <button
                  onMouseDown={() => handleMouseDown(handleIncrement)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={() => handleMouseDown(handleIncrement)}
                  onTouchEnd={handleMouseUp}
                  className="w-12 h-12 rounded-full bg-button-secondary text-button-secondary-text border border-card-border hover:bg-button-secondary-hover transition-all duration-200 flex items-center justify-center active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleCustomTimeSet}
                className="w-full mt-4 px-4 py-2 bg-button-primary text-button-primary-text rounded-lg hover:bg-button-primary-hover transition-all duration-200 font-medium"
              >
                Set {customMinutes} minute{customMinutes !== 1 ? "s" : ""}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={handleStartPause}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-button-primary text-button-primary-text shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {isStarted ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          {isStarted
            ? "Pause"
            : currentSegmentData?.duration > 0
              ? "Resume"
              : "Start"}
        </button>
        <button
          onClick={() => {
            setNewSession(true);
            reset();
          }}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-button-secondary text-button-secondary-text border border-card-border transition-all duration-300 hover:scale-105 active:scale-95"
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
