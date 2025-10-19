import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Plus, Minus, Clock } from "lucide-react";
const R = 45;
const CIRCUMFERENCE = 2 * Math.PI * R; // ~282.74

export const Timer = ({
  timeLeft,
  isStarted,
  start,
  pause,
  reset,
  isBreak,
  sessionType,
  setSessionType,
  setTotalFocusDuration,
  totalFocusDuration,
  breaksLeft,
  setCurrentFocusDuration,
  currentFocusDuration,
  currentSegmentData,
  onSegmentUpdate,
  setNewSession,
  currentSegmentIndex,
}) => {
  const [customMinutes, setCustomMinutes] = useState(25);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const timeoutRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const lastUpdateRef = useRef(0);

  const durations = [
    { label: "15m", value: 15 * 60, type: "Short" },
    { label: "25m", value: 25 * 60, type: "Pomodoro" },
    { label: "45m", value: 45 * 60, type: "Long" },
  ];

  const handleStartPause = () => {
    if (isStarted) {
      pause();
      setPaused(true);
        if (currentSegmentData?.startTimestamp) {
          const startTime = new Date(currentSegmentData.startTimestamp).getTime();
          const now = Date.now();
          const elapsedSinceStart = Math.floor((now - startTime) / 1000);
          onSegmentUpdate(currentSegmentIndex, {
            ...currentSegmentData,
            duration: localElapsedRef.current + elapsedSinceStart,
            startTimestamp: null,
          });

          localElapsedRef.current = 0;
        }

    } else {
      start();
      setPaused(false);
      if (currentSegmentData?.startTimestamp == null) {
        onSegmentUpdate(currentSegmentIndex, {
          ...currentSegmentData,
          startTimestamp: new Date().toISOString(), 
        });
      }
    }

  };

  const formatTime = useCallback((totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const pad = (n) => n.toString().padStart(2, "0");

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    } else {
      return `${pad(m)}:${pad(s)}`;
    }
  }, []);

  const getTimeSizeClass = (seconds) => {
    const h = Math.floor(seconds / 3600);
    return h > 0 ? "text-4xl" : "text-6xl";
  };

  const progress = useMemo(() => {
    const total = currentSegmentData?.totalDuration || totalFocusDuration || 0;
    if (total <= 0) return CIRCUMFERENCE;

    const remaining = Math.max(0, timeLeft);
    const fraction = remaining / total;
    return CIRCUMFERENCE * fraction;
  }, [timeLeft, totalFocusDuration, currentSegmentData?.totalDuration]);

  const nextMessage = useMemo(() => {
    if (!isStarted || !timeLeft) return "";
    const remainingMinutes = Math.ceil(timeLeft / 60);

    if (isBreak) {
      return `Focus session in ${remainingMinutes} min${remainingMinutes !== 1 ? "s" : ""}`;
    }
    if (breaksLeft > 0) {
      return `Break in ${remainingMinutes} min${remainingMinutes !== 1 ? "s" : ""}`;
    }
    return `No Breaks`;
  }, [isBreak, timeLeft, isStarted, breaksLeft]);

  const handleDecrement = useCallback(
    (decrement = 1) => setCustomMinutes((prev) => Math.max(1, prev - decrement)),
    []
  );
  const handleIncrement = useCallback(
    (increment = 1) =>
      setCustomMinutes((prev) => {
        const newValue = prev + increment;
        return newValue > 999 ? 999 : newValue;
      }),
    []
  );
  const startAcceleration = useCallback((action, initialValue = 1) => {
    let accelerationValue = initialValue;
    let accelerationStep = 0;

    const accelerate = () => {
      action(accelerationValue);
      accelerationStep++;

      if (accelerationStep % 10 === 0) {
        accelerationValue = Math.min(accelerationValue + 1, 10);
      }
      const interval = Math.max(50, 200 - accelerationStep * 5);
      timeoutRef.current = setTimeout(accelerate, interval);
    };
    timeoutRef.current = setTimeout(accelerate, 300);
  }, []);
  const stopAcceleration = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleCustomTimeSet = useCallback(() => {
    const customDuration = customMinutes * 60;
    setTotalFocusDuration(customDuration);
    setNewSession();
    setShowCustomInput(false);
    setSessionType(`${customMinutes}m Custom`);
  }, [customMinutes, setTotalFocusDuration, setNewSession, setSessionType]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  useEffect(() => {
    if (currentSegmentData?.startTimestamp) {
      setPaused(false);
    } else {
      setPaused(true);
    }
  }, [currentSegmentData]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        handleStartPause();
      } else if (event.key.toLowerCase() === "r") {
        setPaused(false);
        reset();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleStartPause, reset]);

const localElapsedRef = useRef((currentSegmentData?.duration || 0) || 0);

  useEffect(() => {
    if (!isStarted) return;

    const now = Date.now();

    if (now - lastUpdateRef.current >= 10000) {
      lastUpdateRef.current = now;
      localElapsedRef.current += 10;
      setCurrentFocusDuration((p) => p + 10);
    }
  }, [timeLeft, isStarted, setCurrentFocusDuration]);


  const activeTime = isStarted || paused ? timeLeft : totalFocusDuration;
  useEffect(()=> {
    console.log(isStarted)
  }, [isStarted])
  return (
    <div className="lg:min-w-md lg:max-w-md p-8 rounded-3xl shadow-2xl w-full max-w-md bg-card-background border border-card-border card-hover">
      <div className="text-center mb-6">
        <span
          className={`inline-block px-6 py-2 rounded-full text-sm font-medium border ${
            isBreak ? "bg-success-bg text-success-text border-button-success" : "bg-background-secondary text-text-accent border-button-primary"
          }`}
        >
          {isBreak ? "☕ Break Time" : `🎯 ${sessionType} Focus`}
        </span>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
              className={isBreak ? "stroke-button-success" : "stroke-button-primary"}
              strokeWidth="4"
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={progress}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          </svg>
          <div className="text-center w-full">
            <div className={`font-bold text-text-primary mb-1 ${getTimeSizeClass(activeTime)}`}>{formatTime(activeTime)}</div>
            <div className="text-sm text-text-muted">{nextMessage}</div>
          </div>
        </div>
      </div>

      {!isStarted && !isBreak && (
        <div className="mb-6 space-y-4">
          <div className="flex gap-2 justify-center flex-wrap">
            {durations.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setShowCustomInput(false);
                  setPaused(false);
                  setSessionType(opt.type);
                  setTotalFocusDuration(opt.value);
                  setNewSession();
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border border-card-border ${
                  totalFocusDuration === opt.value && !showCustomInput ? "bg-button-primary text-button-primary-text scale-105" : "bg-button-secondary text-button-secondary-text hover:scale-105"
                }`}
              >
                {opt.label}
              </button>
            ))}

            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border border-card-border ${
                showCustomInput ? "bg-button-primary text-button-primary-text scale-105" : "bg-button-secondary text-button-secondary-text hover:scale-105"
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" /> Custom
            </button>
          </div>

          {showCustomInput && (
            <div className="bg-background-secondary/50 p-4 rounded-xl border border-card-border">
              <div className="flex items-center justify-center gap-4">
                <button
                  onMouseDown={() => {
                    handleDecrement(1);
                    startAcceleration(handleDecrement, 1);
                  }}
                  onMouseUp={stopAcceleration}
                  onMouseLeave={stopAcceleration}
                  onTouchStart={() => {
                    handleDecrement(1);
                    startAcceleration(handleDecrement, 1);
                  }}
                  onTouchEnd={stopAcceleration}
                  className="w-12 h-12 rounded-full bg-button-secondary text-button-secondary-text border border-card-border hover:bg-button-secondary-hover transition-all duration-200 flex items-center justify-center active:scale-95"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <input
                  type="number"
                  min="1"
                  max="999"
                  value={customMinutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setCustomMinutes(Math.min(999, Math.max(1, value)));
                  }}
                  className="w-20 h-12 text-center text-xl font-bold bg-input-background border border-input-border rounded-xl text-text-primary focus:ring-2 focus:ring-button-primary focus:border-transparent transition-all"
                />
                <span className="text-text-secondary font-medium">min</span>

                <button
                  onMouseDown={() => {
                    handleIncrement(1);
                    startAcceleration(handleIncrement, 1);
                  }}
                  onMouseUp={stopAcceleration}
                  onMouseLeave={stopAcceleration}
                  onTouchStart={() => {
                    handleIncrement(1);
                    startAcceleration(handleIncrement, 1);
                  }}
                  onTouchEnd={stopAcceleration}
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

      <div className="flex justify-center gap-4">
        <button
          onClick={handleStartPause}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-button-primary text-button-primary-text shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {isStarted ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isStarted ? "Pause" : paused ? "Resume" : "Start"}
        </button>

        <button
          onClick={() => {
            setPaused(false);
            reset();
          }}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-button-secondary text-button-secondary-text border border-card-border transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-text-muted">
        <kbd className="px-2 py-1 rounded bg-background-secondary text-text-secondary">Space</kbd> Start/Pause •{" "}
        <kbd className="px-2 py-1 rounded bg-background-secondary text-text-secondary">R</kbd> Reset
      </div>
    </div>
  );
};
