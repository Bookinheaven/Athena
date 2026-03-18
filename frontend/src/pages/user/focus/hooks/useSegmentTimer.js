import { useEffect, useState, useMemo } from "react"
import { useTimerEngine } from "./useTimerEngine";
import { recoverElapsed } from "../utils/recoverSession";

export const useSegmentTimer = (segments, onUpdateSegments) => {
    const [segmentIndex, setSegmentIndex] = useState(0);

    const currentSegment = segments[segmentIndex];
    const initialElapsed = useMemo(() => {
        if (!currentSegment) return 0;
        if (currentSegment.completedAt) return currentSegment.totalDuration;
        if (!currentSegment.startedAt) return currentSegment.duration || 0;
        return recoverElapsed(currentSegment);
    }, [currentSegment]);
  
  const { elapsed, start, pause, reset, status, syncElapsed } = useTimerEngine(initialElapsed || 0);

    const timeLeft = Math.max(currentSegment.totalDuration - elapsed, 0);

    // segment completion
    useEffect(() => {
        if (timeLeft !== 0 || status !== "running") return;
        onUpdateSegments((prev) => {
            const updated = [...prev];

            updated[segmentIndex] = {
                ...updated[segmentIndex],
                duration: updated[segmentIndex].totalDuration,
                completedAt: new Date().toISOString(),
                startedAt: null
            };
            return updated;
        })

        // move to next segment
        setSegmentIndex((prev) => prev + 1);
        reset();
    }, [timeLeft, status])

    const handleStart = () => {
        onUpdateSegments((prev) => {
            const updated = [...prev];
            const current = updated[segmentIndex];

            if (!current.startedAt) {
                updated[segmentIndex] = {
                    ...current,
                    startedAt: new Date().toISOString(),
                }
            }
            return updated
        })
        start();
    }

    const handlePause = () => {
        onUpdateSegments((prev) => {
            const updated = [...prev];
            const current = updated[segmentIndex];

            updated[segmentIndex] = {
            ...current,
            duration: recoverElapsed(current),
            startedAt: null,
            };

            return updated;
        });

        pause();
        };
    
    useEffect(() => {
        if (!currentSegment) return;

        syncElapsed(initialElapsed);
    }, [segmentIndex, initialElapsed, syncElapsed]);

    return { segmentIndex, currentSegment, elapsed, timeLeft, start: handleStart, pause: handlePause, reset, status }
}