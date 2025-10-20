import { useState, useEffect, useRef, useCallback } from "react";

export const useTimer = (initialDuration, onComplete) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isStarted, setIsStarted] = useState(false);
  const intervalRef = useRef(null);
  const latestOnComplete = useRef(onComplete);

  useEffect(() => {
    latestOnComplete.current = onComplete;
  }, [onComplete]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setIsStarted(true);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsStarted(false);
          latestOnComplete.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsStarted(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeLeft(initialDuration);
    setIsStarted(false);
  }, [initialDuration]);

  useEffect(() => {
    if (!isStarted) {
      setTimeLeft(initialDuration);
    }
  }, [initialDuration, isStarted]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);


  return { timeLeft, isStarted, start, pause, reset };
};
