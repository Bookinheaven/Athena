import { useEffect, useState, useMemo, useRef } from "react"
import { useTimerEngine } from "./useTimerEngine";
import { recoverElapsed } from "../utils/recoverSession";

export const useSegmentTimer = (segments, segmentIndex, onUpdateSegments) => {
    const currentSegment = segments[segmentIndex] ?? null;;
    
    const initialElapsed = useMemo(() => {
        if (!currentSegment) return 0;
        if (currentSegment.completedAt) return currentSegment.totalDuration;
        if (!currentSegment.startedAt) return currentSegment.duration || 0;
        return recoverElapsed(currentSegment);
    }, [currentSegment]);

    const { elapsed, start, pause, reset, status, syncElapsed } = useTimerEngine(initialElapsed);

    const timeLeft = currentSegment ? Math.max(currentSegment.totalDuration - elapsed, 0) : 0;

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

    }, [timeLeft, status, segmentIndex])

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
    
    const lastSyncedRef = useRef(null);
    useEffect(() => {
        if (!currentSegment) return;
        const newElapsed =
            currentSegment.completedAt
            ? currentSegment.totalDuration
            : currentSegment.startedAt
            ? recoverElapsed(currentSegment)
            : currentSegment.duration || 0;
        if (lastSyncedRef.current === newElapsed) return;
        lastSyncedRef.current = newElapsed;
        syncElapsed(newElapsed);
    }, [segmentIndex, currentSegment, syncElapsed]);

    return { segmentIndex, currentSegment, elapsed, timeLeft, start: handleStart, pause: handlePause, reset, status }
}