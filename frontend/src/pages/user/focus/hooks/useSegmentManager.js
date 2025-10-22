import { useState, useEffect, useCallback, useMemo } from "react";
import { useTimer } from "./useTimer";
import { useRef } from "react";

export const useSegmentManager = ({
  sessionData,
  setSessionData,
  autoStartBreaks,
  setSessionHistory,
}) => {
  
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(() => {
    if (sessionData?.segments) {
      const firstIncompleteIndex = sessionData.segments.findIndex(
        (seg) => seg.completedAt == null
      );
      if (firstIncompleteIndex !== -1) {
        return firstIncompleteIndex;
      } 
      return sessionData.segments.length > 0 ? sessionData.segments.length - 1 : 0;
    }
    return 0;
  });
  
  const currentSegment = useMemo(
    () => sessionData?.segments?.[currentSegmentIndex],
    [sessionData, currentSegmentIndex]
  );
  const prevSegmentIndexRef = useRef(currentSegmentIndex);

  const initialTimeLeft = useMemo(() => {
    if (!currentSegment) return 0;

    const total = currentSegment.totalDuration;
    const past = currentSegment.duration || 0;

    if (!currentSegment.startTimestamp) return total - past;

    const start = new Date(currentSegment.startTimestamp).getTime();
    const elapsed = Math.floor((Date.now() - start) / 1000);
    return Math.max(total - (past + elapsed), 0);
  }, [currentSegment]);

  const { timeLeft, isStarted, start, pause, reset } = useTimer(
    initialTimeLeft,
    () => {
      if (!sessionData?.segments) return;

      const completedSegment = sessionData.segments[currentSegmentIndex];

      if (!completedSegment || completedSegment.completedAt) {
        return;
      }
      const completedTimestamp = new Date().toISOString();

      setSessionHistory((prev) => [
        ...prev,
        {
          ...completedSegment,
          completedAt: completedTimestamp,
          duration: completedSegment.totalDuration,
          startTimestamp: null,
        },
      ]);

      const isLastSegment =
        currentSegmentIndex + 1 >= sessionData.segments.length;

      if (isLastSegment) {
        setSessionData((prev) => {
          const newSegments = [...prev.segments];
          newSegments[currentSegmentIndex] = {
            ...newSegments[currentSegmentIndex],
            completedAt: completedTimestamp,
            duration: newSegments[currentSegmentIndex].totalDuration,
            startTimestamp: null,
          };
          return { ...prev, segments: newSegments, isDone: true };
        });
      } else {
        const nextIndex = currentSegmentIndex + 1;
        setCurrentSegmentIndex(nextIndex);

        setSessionData((prev) => {
          const newSegments = [...prev.segments];
          newSegments[currentSegmentIndex] = {
            ...newSegments[currentSegmentIndex],
            completedAt: completedTimestamp,
            duration: newSegments[currentSegmentIndex].totalDuration,
            startTimestamp: null,
          };

          return {
            ...prev,
            segments: newSegments,
            segmentIndex: nextIndex,
          };
        });
      }
    }
  );

  useEffect(() => {
    if (!currentSegment) return;

    if (prevSegmentIndexRef.current !== currentSegmentIndex) {
      reset();

      if (currentSegment.type === "break" && autoStartBreaks) {
        start();
      }
      if (currentSegment.type === "focus") {
        start();
      }

      prevSegmentIndexRef.current = currentSegmentIndex;
    }
  }, [currentSegment, currentSegmentIndex, autoStartBreaks, start, reset]);

  const updateSegment = useCallback(
    (index, updates) => {
      setSessionData((prev) => {
        if (!prev?.segments) return prev;
        const newSegments = prev.segments.map((seg, idx) =>
          idx === index ? { ...seg, ...updates } : seg
        );
        return { ...prev, segments: newSegments };
      });
    },
    [setSessionData]
  );

  return {
    currentSegmentIndex,
    currentSegment,
    updateSegment,
    timeLeft,
    isStarted,
    start,
    pause,
    reset,
  };
};
