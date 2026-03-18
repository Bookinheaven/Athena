import { useCallback, useEffect, useMemo } from "react";
import { useTimerEngine } from "./useTimerEngine";
import { useAutoSaveSession } from "./useAutoSaveSession";
import sessionService from "../../../../../services/sessionService";

export const useFocusSession = ({
  sessionData,
  setSessionData,
  machineState,
  dispatch,
  currentSegment,
  sessionTitle,
  sessionReview,
}) => {
  const buildPayload = useCallback(
    (type) => {
      if (!sessionData || !sessionData.sessionId) return null;

      const current = sessionData.segments[machineState.segmentIndex];

      switch (type) {
        case "start":
          return {
            sessionId: sessionData.sessionId,
            title: sessionTitle,
            plannedDuration: sessionData.plannedDuration,
            sessionSegments: sessionData.segments,
          };

        case "progress":
          return {
            sessionId: sessionData.sessionId,
            duration: sessionData.segments.reduce(
              (sum, seg) => sum + seg.duration,
              0,
            ),
            segment: {
              segmentIndex: machineState.segmentIndex,
              duration: current.duration,
            },
          };

        case "segment_complete":
          return {
            sessionId: sessionData.sessionId,
            segment: {
              segmentIndex: machineState.segmentIndex,
              completedAt: current.completedAt,
            },
          };

        case "title":
          return {
            sessionId: sessionData.sessionId,
            title: sessionTitle,
          };

        case "finish":
          return {
            sessionId: sessionData.sessionId,
            status: "completed",
            duration: sessionData.segments.reduce(
              (sum, seg) => sum + seg.duration,
              0,
            ),
          };

        case "feedback":
          return {
            sessionId: sessionData.sessionId,
            feedback: sessionReview,
          };

        default:
          return null;
      }
    },
    [sessionData, sessionTitle, sessionReview, machineState.segmentIndex],
  );
  const sendBackend = useCallback(async (payload) => {
    try {
      await sessionService.updateProgress(payload);
    } catch (err) {
      console.error("Session update error:", err);
    }
  }, []);

  const { markDirty, saveStatus, forceSave } = useAutoSaveSession({
    buildPayload,
    saveFunction: sendBackend,
    enabled: ["running", "paused", "finished"].includes(machineState.status),
    allowedWhenDisabled: ["title"],
  });

  const isRunning = machineState.status === "running";

  const initialElapsed = useMemo(() => {
    if (!currentSegment) return 0;

    if (currentSegment.completedAt) {
      return currentSegment.totalDuration;
    }

    if (currentSegment.startTimestamp) {
      const start = new Date(currentSegment.startTimestamp).getTime();
      return Math.floor((Date.now() - start) / 1000);
    }

    return currentSegment.duration || 0;
  }, [currentSegment]);

  // Timer Engine
  const { timeLeft, elapsed, start, pause, reset } = useTimerEngine({
    duration: currentSegment?.totalDuration || 0,
    initialElapsed,
  });

  // Segment complete logic
  useEffect(() => {
    if (timeLeft !== 0 || !isRunning) return;    
    setSessionData((prev) => {
      const segments = [...prev.segments];
      const current = segments[machineState.segmentIndex];
      if (!current) return prev;
      segments[machineState.segmentIndex] = {
        ...segments[machineState.segmentIndex],
        duration: segments[machineState.segmentIndex].totalDuration,
        completedAt: new Date().toISOString(),
      };

      return { ...prev, segments };
    });

    markDirty("progress");
    dispatch({ type: "TIME_UP" });
  }, [timeLeft, isRunning, machineState.segmentIndex, dispatch]);

  return {
    timeLeft,
    elapsed,
    start,
    pause,
    reset,
    markDirty,
    saveStatus,
    forceSave,
    buildPayload,
  };
};
