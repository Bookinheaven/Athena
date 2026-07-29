import { useEffect, useRef, useCallback } from "react";
import { useSegmentTimer } from "./useSegmentTimer";
import { useSessionMachine } from "./useSessionMachine";
import { useAutoSaveSession } from "./useAutoSaveSession";
import { v4 as uuidv4 } from "uuid";
import { rlTrackingService } from "../../../../../services/rlTrackingService";

export const useSessionController = ({
  sessionData,
  setSessionData,
  sessionTitle,
  saveFunction,
  autoStartBreaks,
  todos,
  sessionStats,
  setSessionStats,
}) => {
  const completedIndexRef = useRef(null);
  const hasStartedSessionRef = useRef(false);
  const isRunningRef = useRef(false);
  const lastSavedElapsedRef = useRef(0);
  const activePauseRef = useRef(null);

  const [machineState, dispatch] = useSessionMachine(
    sessionData?.segments?.length || 0
  );

  const setPauseReason = useCallback((reason) => {
    if (activePauseRef.current) {
      activePauseRef.current.reason = reason;
    }
  }, []);

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
            pauseEvents: sessionData.pauseEvents || [],
          };
        case "progress":
          return {
            sessionId,
            segment: {
              segmentIndex,
              duration: elapsed,
            },
            pauseEvents: sessionData?.pauseEvents || [],
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
        case "stop":
          return {
            sessionId,
            status: "skipped",
            duration: elapsed,
            sessionStats,
            pauseEvents: sessionData?.pauseEvents || [],
          };
        case "finish":
          return {
            sessionId,
            status: "completed",
            duration: elapsed,
            sessionStats,
            pauseEvents: sessionData?.pauseEvents || [],
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
        
        if (activePauseRef.current) {
          const p = activePauseRef.current;
          p.endTime = new Date().toISOString();
          p.duration = Math.floor((new Date(p.endTime) - new Date(p.startTime)) / 1000);
          
          setSessionData(prev => ({
            ...prev,
            pauseEvents: [...(prev.pauseEvents || []), p]
          }));
          
          rlTrackingService.trackPauseEvent(sessionData, p);
          
          if (setSessionStats) {
            setSessionStats(prev => ({
              ...prev,
              totalPauseDuration: (prev.totalPauseDuration || 0) + p.duration
            }));
          }
          activePauseRef.current = null;
        }

        if (!hasStartedSessionRef.current) {
          hasStartedSessionRef.current = true;
          rlTrackingService.trackSessionStart(sessionData);
          markDirtyRef.current("start");
        }
      }
    }

    if (status === "paused") {
      if (isRunningRef.current) {
        isRunningRef.current = false;
        pause();
        
        activePauseRef.current = {
          id: uuidv4(),
          startTime: new Date().toISOString(),
          endTime: null,
          duration: 0,
          reason: "Manual Pause"
        };
        
        markDirtyRef.current("progress");
        if (setSessionStats) {
          setSessionStats(prev => ({ 
            ...prev, 
            pauseCount: prev.pauseCount + 1 
          }));
        }
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

      if (setSessionStats) {
        const current = segmentsRef.current?.[segmentIndex];
        if (current) {
          if (current.type === "break") {
            setSessionStats(prev => ({
              ...prev,
              breakSegmentsCompleted: prev.breakSegmentsCompleted + 1
            }));
          } else {
            setSessionStats(prev => ({
              ...prev,
              focusSegmentsCompleted: prev.focusSegmentsCompleted + 1
            }));
          }
        }
      }

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
    setPauseReason,
  };
};