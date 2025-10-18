import { useState, useEffect, useCallback, useRef } from "react";

export const useTimer = (initialDuration, onComplete, storageKey = "timerState") => {
  // Load initial state from localStorage or use defaults
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if the saved timer is still valid (not too old)
        const savedTime = new Date(parsed.lastUpdate).getTime();
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - savedTime) / 1000);
        
        // If timer was running, adjust timeLeft based on elapsed time
        if (parsed.isStarted && parsed.timeLeft > 0) {
          const adjustedTimeLeft = Math.max(0, parsed.timeLeft - elapsedSeconds);
          return {
            ...parsed,
            timeLeft: adjustedTimeLeft,
            // If time ran out while away, mark as not started
            isStarted: adjustedTimeLeft > 0,
          };
        }
        
        return parsed;
      }
    } catch (error) {
      console.error("Error loading timer state:", error);
    }
    
    return {
      isStarted: false,
      timeLeft: initialDuration,
      duration: initialDuration,
      lastUpdate: new Date().toISOString(),
    };
  };

  const initialState = getInitialState();
  const [isStarted, setIsStarted] = useState(initialState.isStarted);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [duration, setDuration] = useState(initialState.duration);
  const intervalRef = useRef(null);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((state) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        ...state,
        lastUpdate: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Error saving timer state:", error);
    }
  }, [storageKey]);

  // Save state whenever relevant values change
  useEffect(() => {
    saveState({
      isStarted,
      timeLeft,
      duration,
    });
  }, [isStarted, timeLeft, duration, saveState]);

  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          return newTime;
        });
      }, 1000);
    } else if (isStarted && timeLeft === 0) {
      onComplete?.();
      setIsStarted(false);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isStarted, timeLeft, onComplete]);

  const start = useCallback(() => {
    setIsStarted(true);
  }, []);

  const pause = useCallback(() => {
    setIsStarted(false);
  }, []);

  const reset = useCallback(() => {
    setIsStarted(false);
    setTimeLeft(duration);
  }, [duration]);

  const setNewDuration = useCallback((newDuration) => {
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsStarted(false);
  }, []);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing timer state:", error);
    }
  }, [storageKey]);

  return { 
    isStarted, 
    timeLeft, 
    duration, 
    start, 
    pause, 
    reset, 
    setNewDuration,
    clearStorage,
  };
};
