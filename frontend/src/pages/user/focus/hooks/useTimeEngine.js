import { useEffect, useState, useCallback } from "react";

export const useTimeEngine = ({ segment, status, onTimeUp, updateSegment }) => {
  const [now, setNow] = useState(Date.now());

  const calculateTimeLeft = useCallback(() => {
    if (!segment) return 0;

    const { totalDuration, duration = 0, startTimestamp } = segment;

    if (!startTimestamp || status !== "running") {
      return totalDuration - duration;
    }

    const elapsed = Math.floor(
      (Date.now() - new Date(startTimestamp).getTime()) / 1000,
    );

    return Math.max(totalDuration - (duration + elapsed), 0);
  }, [segment, status]);

  const timeLeft = calculateTimeLeft();

  // UI refresh tick
  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Detect completion
  useEffect(() => {
    if (!segment) return;

    if (timeLeft === 0 && status === "running") {
      onTimeUp?.();
    }
  }, [timeLeft, status]);

  const start = () => {
    if (!segment) return;

    if (!segment.startTimestamp) {
      const nowC = new Date().toISOString();

      updateSegment({
        startTimestamp: nowC,
        startedAt: segment.startedAt ?? nowC,
      });
    }
  };

  const pause = () => {
    if (!segment?.startTimestamp) return;

    const elapsed = Math.floor(
      (Date.now() - new Date(segment.startTimestamp).getTime()) / 1000,
    );

    updateSegment({
      duration: (segment.duration || 0) + elapsed,
      startTimestamp: null,
    });
  };

  return {
    timeLeft,
    start,
    pause,
    isRunning: status === "running",
    isPaused: status === "paused",
  };
};
