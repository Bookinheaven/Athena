import { useEffect, useRef, useCallback } from "react";
import { useSegmentTimer } from "./useSegmentTimer";
import { useSessionMachine } from "./useSessionMachine";
import { useAutoSaveSession } from "./useAutoSaveSession";

export const useSessionController = ({
  sessionData,
  setSessionData,
  sessionTitle,
  saveFunction,
  autoStartBreaks,
}) => {
  const completedIndexRef = useRef(null);
  const hasStartedSessionRef = useRef(false);
  const isRunningRef = useRef(false);
  const lastSavedElapsedRef = useRef(0);

  const [machineState, dispatch] = useSessionMachine(
    sessionData?.segments?.length || 0
  );

  const {
    segmentIndex,
    currentSegment,
    elapsed,
    timeLeft,
    start,
    pause,
    reset,
    status: timerStatus,
  } = useSegmentTimer(sessionData?.segments || [], (updater) => {
    setSessionData((prev) => ({
      ...prev,
      segments: updater(prev.segments),
    }));
  });

  const sessionId = sessionData?.sessionId;
  const plannedDuration = sessionData?.plannedDuration;
  const segments = sessionData?.segments;

  const buildPayload = useCallback(
    (type) => {
      if (!sessionId) return null;

      const current = segments?.[segmentIndex];
      if (!current) return null;

      switch (type) {
        case "start":
          return {
            sessionId,
            title: sessionTitle,
            plannedDuration,
            sessionSegments: segments,
          };

        case "progress":
          return {
            sessionId,
            segment: {
              segmentIndex,
              duration: elapsed,
            },
          };

        case "segment_complete":
          return {
            sessionId,
            segment: {
              segmentIndex: completedIndexRef.current,
              completedAt: new Date(),
            },
          };

        case "title":
          return {
            sessionId,
            title: sessionTitle,
          };

        case "finish":
          return {
            sessionId,
            status: "completed",
            duration: elapsed,
          };

        default:
          return null;
      }
    },
    [sessionId, plannedDuration, sessionTitle, segmentIndex, elapsed, segments]
  );

  const { markDirty, saveStatus, forceSave } = useAutoSaveSession({
    buildPayload,
    saveFunction,
    enabled: machineState.status !== "idle",
    allowedWhenDisabled: ["progress"],
  });

  const onTitleSet = () => {
    markDirty("title");
  }

  const onReset = () => {
    reset();
  }
  // const prevTitleRef = useRef(sessionTitle);
  // useEffect(() => {
  //   if (prevTitleRef.current !== sessionTitle) {
  //     prevTitleRef.current = sessionTitle;
  //   }
  // }, [sessionTitle, markDirty]);

  useEffect(() => {
    const status = machineState.status;
    if (status === "running") {
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        start();
        // only once per session
        if (!hasStartedSessionRef.current) {
          hasStartedSessionRef.current = true;
          markDirty("start");
        }
      }
    }
    if (status === "paused") {
      if (isRunningRef.current) {
        isRunningRef.current = false;
        pause();
        markDirty("progress");
      }
    }

    if (status === "transition") {
      dispatch({ type: "NEXT_SEGMENT" });
    }
    if (status === "ready") {
      const current = segments?.[segmentIndex];
      if (!current) return;

      if (current.type === "break") {
        if (autoStartBreaks) dispatch({ type: "START" });
      } else {
        dispatch({ type: "START" });
      }
    }
  }, [machineState.status, segmentIndex, autoStartBreaks, segments]);

  // useEffect(() => {
  //   reset();
  // }, [segmentIndex, reset]);

  useEffect(() => {
    if (
      timeLeft <= 0 &&
      machineState.status === "running" &&
      completedIndexRef.current !== segmentIndex
    ) {
      completedIndexRef.current = segmentIndex;

      markDirty("segment_complete");

      forceSave().finally(() => {
        dispatch({ type: "TIME_UP" });
      });
    }
  }, [timeLeft, machineState.status, segmentIndex, markDirty, forceSave]);

  useEffect(() => {
    if (machineState.status !== "running") return;

    const interval = setInterval(() => {
      if (Math.abs(elapsed - lastSavedElapsedRef.current) >= 5) {
        lastSavedElapsedRef.current = elapsed;
        markDirty("progress");
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [machineState.status, markDirty]);

  useEffect(() => {
    if (machineState.status === "finished") {
      markDirty("finish");
      forceSave();
    }
  }, [machineState.status, markDirty, forceSave]);

  return {
    machineState,
    dispatch,
    currentSegment,
    segmentIndex,
    elapsed,
    timeLeft,
    saveStatus,
    forceSave,
    timerStatus,
    onTitleSet,
    onReset,
  };
};