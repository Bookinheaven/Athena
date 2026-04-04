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
  todos,
}) => {
  const completedIndexRef = useRef(null);
  const hasStartedSessionRef = useRef(false);
  const isRunningRef = useRef(false);
  const lastSavedElapsedRef = useRef(0);

  const [machineState, dispatch] = useSessionMachine(
    sessionData?.segments?.length || 0
  );

  const {
    currentSegment,
    elapsed,
    timeLeft,
    start,
    pause,
    reset,
    status: timerStatus,
  } = useSegmentTimer(
    sessionData?.segments || [],
    machineState.segmentIndex,
    (updater) => {
      setSessionData((prev) => ({
        ...prev,
        segments: updater(prev.segments),
      }));
    }
  );

  const segmentIndex = machineState.segmentIndex;
  const sessionId = sessionData?.sessionId;
  const plannedDuration = sessionData?.plannedDuration;
  const segments = sessionData?.segments;
  const segmentsRef = useRef(segments);
  const elapsedRef = useRef(elapsed);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

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
            sessionType: sessionData.sessionType,
            taskIds: sessionData.taskIds || [],
            sessionSegments: segments,
            totalBreakMinutes: sessionData.segments?.filter((x) => x.type === "break") ?.length || 1,
            totalFocusMinutes: sessionData.segments?.filter((x) => x.type === "focus") ?.length || 1,
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
        case "todos":
          return {
            sessionId,
            todos: todos,
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
    [sessionId, plannedDuration, sessionTitle, segmentIndex, elapsed, segments, todos]
  );

  const { markDirty, saveStatus, forceSave } = useAutoSaveSession({
    buildPayload,
    saveFunction,
    enabled: machineState.status !== "idle",
    allowedWhenDisabled: ["progress", "todos"],
  });

  const forceSaveRef = useRef(forceSave);
  const markDirtyRef = useRef(markDirty);
  useEffect(() => { forceSaveRef.current = forceSave; }, [forceSave]);
  useEffect(() => { markDirtyRef.current = markDirty; }, [markDirty]);

  // Sync totalSegments into machine after sessionData loads
  const totalSegments = sessionData?.segments?.length;
  useEffect(() => {
    if (!totalSegments) return;
    dispatch({ type: "INIT", payload: totalSegments });
  }, [totalSegments]);

  // Handle running/paused/ready transitions
  useEffect(() => {
    const status = machineState.status;

    if (status === "running") {
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        start();
        if (!hasStartedSessionRef.current) {
          hasStartedSessionRef.current = true;
          markDirtyRef.current("start");
        }
      }
    }

    if (status === "paused") {
      if (isRunningRef.current) {
        isRunningRef.current = false;
        pause();
        markDirtyRef.current("progress");
      }
    }

    if (status === "ready") {
      const current = segmentsRef.current?.[machineState.segmentIndex];
      if (!current) return;
      if (current.type === "break") {
        if (autoStartBreaks) dispatch({ type: "START" });
      } else {
        dispatch({ type: "START" });
      }
    }
  }, [machineState.status, machineState.segmentIndex, autoStartBreaks]);

  // Handle transition in isolation to avoid stale segmentIndex re-runs
  useEffect(() => {
    if (machineState.status === "transition") {
      dispatch({ type: "NEXT_SEGMENT" });
    }
  }, [machineState.status]);

  // Detect segment completion
  useEffect(() => {
    if (
      timeLeft <= 0 &&
      machineState.status === "running" &&
      completedIndexRef.current !== segmentIndex
    ) {
      completedIndexRef.current = segmentIndex;
      markDirtyRef.current("segment_complete");
      forceSaveRef.current().finally(() => {
        dispatch({ type: "TIME_UP" });
      });
    }
  }, [timeLeft, machineState.status, segmentIndex]);
  
  // Periodic progress save every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunningRef.current) return;
      if (Math.abs(elapsedRef.current - lastSavedElapsedRef.current) >= 5) {
        lastSavedElapsedRef.current = elapsedRef.current;
        markDirtyRef.current("progress");
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Save on finish
  useEffect(() => {
    if (machineState.status === "finished") {
      markDirtyRef.current("finish");
      isRunningRef.current = false;
      forceSaveRef.current();
    }
  }, [machineState.status]);

  const onTitleSet = () => {
    markDirtyRef.current("title");
  };

  const onTodoChange = () => {
    console.log(todos)
    markDirtyRef.current("todos");
  };

  const onReset = () => {
    hasStartedSessionRef.current = false;
    isRunningRef.current = false;
    lastSavedElapsedRef.current = 0;
    reset();
  };

  useEffect(() => {
    const handler = () => {
      forceSaveRef.current();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

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
    onTodoChange,
    onReset,
    buildPayload,
  };
};