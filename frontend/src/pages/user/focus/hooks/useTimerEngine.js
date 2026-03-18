import { useCallback, useEffect, useState, useRef } from "react";
import { TimerEngine } from "../utils/TimerEngine";

export const useTimerEngine = (initialElapsed = 0) => {
  const engineRef = useRef(null);
  const rafRef = useRef(null);
  const lastValueRef = useRef(null);

  const [elapsed, setElapsed] = useState(initialElapsed);
  const [status, setStatus] = useState("idle"); // idle | running | paused

  useEffect(() => {
    engineRef.current = new TimerEngine(initialElapsed);
    setElapsed(initialElapsed);
  }, []);

  // RAF loop 
  const loop = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const value = engine.getElapsed();

    // Prevent unnecessary re-renders (only update if changed)
    if (value !== lastValueRef.current) {
      setElapsed(value);
      lastValueRef.current = value;
    }

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || status === "running") return;

    engine.start();
    setStatus("running");

    // Prevent multiple RAF loops
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [status, loop]);

  const pause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || status !== "running") return;

    engine.pause();
    setStatus("paused");

    cancelAnimationFrame(rafRef.current);
  }, [status]);

  const reset = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.reset();
    setElapsed(0);
    lastValueRef.current = 0;

    setStatus("idle");
    cancelAnimationFrame(rafRef.current);
  }, []);

  // Sync external elapsed (for resume / segment change)
  const syncElapsed = useCallback(
    (newElapsed) => {
      const wasRunning = engineRef.current?.running;

      engineRef.current = new TimerEngine(newElapsed);
      setElapsed(newElapsed);
      lastValueRef.current = newElapsed;

      if (wasRunning) {
        engineRef.current.start();

        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(loop);
      }
    },
    [loop],
  );
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Handle tab visibility (fix freeze issue)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const engine = engineRef.current;
        if (!engine) return;

        const value = engine.getElapsed();

        setElapsed(value);
        lastValueRef.current = value;

        if (engine.running) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(loop);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loop]);

  return {
    elapsed,
    status,
    start,
    pause,
    reset,
    syncElapsed,
  };
};
