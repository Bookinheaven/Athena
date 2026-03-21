import { useCallback, useEffect, useState, useRef } from "react";
import { TimerEngine } from "../utils/TimerEngine";

export const useTimerEngine = (initialElapsed) => {
  const engineRef = useRef(null);
  const rafRef = useRef(null);
  const lastValueRef = useRef(null);

  const [elapsed, setElapsed] = useState(initialElapsed);
  const [status, setStatus] = useState("idle");
  const hasInitialized = useRef(false);


  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      engineRef.current = new TimerEngine(initialElapsed);
      setElapsed(initialElapsed);
      lastValueRef.current = initialElapsed;
    }
  }, []); 

  const loop = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !engine.running) return;
    const value = engine.getElapsed();
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      setElapsed(value);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, []);
  
  const syncElapsed = useCallback(
    (newElapsed) => {
      const wasRunning = engineRef.current?.running;

      engineRef.current = new TimerEngine(newElapsed);
      lastValueRef.current = newElapsed;
      setElapsed(newElapsed);

      if (wasRunning) {
        engineRef.current.start();

        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(loop);
      }
    },
    [loop]
  );

  const start = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.running) return;

    engine.start();
    setStatus("running");

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const pause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !engine.running) return;

    engine.pause();
    setStatus("paused");

    cancelAnimationFrame(rafRef.current);
  }, []);

  const reset = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.reset();
    setElapsed(0);
    lastValueRef.current = 0;
    setStatus("idle");
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      const engine = engineRef.current;
      if (!engine) return;

      if (document.visibilityState === "visible") {
        const value = engine.getElapsed();

        setElapsed(value);
        lastValueRef.current = value;

        if (engine.running) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(loop);
        }
      } else {
        cancelAnimationFrame(rafRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
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