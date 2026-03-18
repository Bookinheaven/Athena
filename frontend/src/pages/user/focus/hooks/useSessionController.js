import { useEffect, useRef, useCallback } from "react";
import { useSegmentTimer } from "./useSegmentTimer";
import { useSessionMachine } from "./useSessionMachine"
import { useAutoSaveSession } from "./useAutoSaveSession";


export const useSessionController = ({ 
    sessionData,
    setSessionData,
    sessionTitle,
    sessionReview,
    saveFunction,
    autoStartBreaks
}) => {
    const [machineState, dispatch] = useSessionMachine(sessionData?.segments?.length || 0);
    const {
        segmentIndex, 
        currentSegment, 
        elapsed, 
        timeLeft, 
        start, 
        pause,
        reset, 
        status: timerStatus
    } = useSegmentTimer(
        sessionData?.segments || [],
        (updater) => {
            setSessionData((prev) => ({
                ...prev,
                segments: updater(prev.segments),
            }));
        }
    );

      const buildPayload = useCallback(
        (type) => {
          if (!sessionData || !sessionData.sessionId) return null;
    
          const current = sessionData.segments[segmentIndex];
          if (!current) return null;
          
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
                  segmentIndex,
                  duration: current.duration,
                },
              };
    
            case "segment_complete":
              return {
                sessionId: sessionData.sessionId,
                segment: {
                  segmentIndex,
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
        [sessionData, sessionTitle, sessionReview, segmentIndex],
      );

    const { markDirty, saveStatus, forceSave } = useAutoSaveSession({ 
        buildPayload,
        saveFunction,
        enabled: ["running", "finished"].includes(machineState.status),
        allowedWhenDisabled: ["progress"],
    })

    // title update
    const titleTimeoutRef = useRef(null);
    useEffect(() => {
        if (!sessionTitle) return;
        clearTimeout(titleTimeoutRef.current);
        titleTimeoutRef.current = setTimeout(() => {
            markDirty("title");
        }, 1000);
        return () => clearTimeout(titleTimeoutRef.current);
    }, [sessionTitle]);

    // start and pause
    useEffect(() => {
      if(machineState.status === "running" && timerStatus !== "running") {
          start();
          markDirty("start");
        } else if(machineState.status === "paused" && timerStatus !== "running") {
          pause();
          markDirty("progress");
        }
      }, [machineState.status]);

    // progress save
    useEffect(() => {
        if (machineState.status !== "running") return;
        const interval = setInterval(() => {
            markDirty("progress");
        }, 15000)
        return () => clearInterval(interval);
    }, [machineState.status])
    
    // time up -> inform machine
    useEffect(() => {
        if (timeLeft === 0 && machineState.status === "running") {
            markDirty("segment_complete")
            dispatch({ type: "TIME_UP"});
        }
    }, [timeLeft])

    // segment transition and auto start for breaks
    useEffect(() => {
      if (machineState.status !== "transition") return;
      const nextIndex = segmentIndex + 1;
      const nextSegment = sessionData?.segments?.[nextIndex];
      dispatch({ type: "NEXT_SEGMENT" });
      reset();
      if (!nextSegment) return;
      if (nextSegment.type === "break") {
        if (autoStartBreaks) {
          dispatch({ type: "START" });
        }
      } else {
        // focus segment -> always start
        dispatch({ type: "START" });
      }

    }, [machineState.status]);

    // finish
    useEffect(() => {
        if (machineState.status === "finished") {
            markDirty("finish");
            forceSave();
        }
    }, [machineState.status]);

    return {
    machineState,
    dispatch,
    currentSegment,
    segmentIndex,
    elapsed,
    timeLeft,
    saveStatus,
    forceSave
  };
}