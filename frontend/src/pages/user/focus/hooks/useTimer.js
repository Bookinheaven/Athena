import { useState, useEffect, useRef, useCallback } from "react";

export const useTimer = (initialDuration, onComplete) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isStarted, setIsStarted] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    if (!isStarted) {
      setIsStarted(true);
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setIsStarted(false);
            onComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  }, [isStarted, onComplete]);

  const pause = useCallback(() => {
    clearInterval(intervalRef.current);
    console.log("paused")
    setIsStarted(false);
  }, []);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setTimeLeft(initialDuration);
    setIsStarted(false);
  }, [initialDuration]);

  useEffect(() => {
    reset();
  }, [initialDuration, reset]);

  return { timeLeft, isStarted, start, pause, reset };
};
