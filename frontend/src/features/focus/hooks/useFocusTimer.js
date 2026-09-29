// ─────────────────────────────────────────────────────────────────────────────
// useFocusTimer
//
// Display-only RAF hook.  Reads from a WallClockTimer ref and updates React
// state once per animation frame ONLY for the purpose of re-rendering the
// visual timer.
//
// This hook must NOT contain any business logic.
// It must NOT be used as a source of truth for completion detection.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { PHASES } from '../runtime/constants.js';

/**
 * @param {object} opts
 * @param {{ current: import('../runtime/timerClock').WallClockTimer | null }} opts.timerRef
 *   The same timerRef from useFocusRuntime.
 * @param {import('../runtime/focusReducer').FocusRuntimeState} opts.runtimeState
 * @returns {{ elapsed: number, timeLeft: number, progress: number }}
 */
export function useFocusTimer({ timerRef, runtimeState }) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef     = useRef(null);
  const lastRef    = useRef(-1);

  const currentSegment = runtimeState.segments[runtimeState.segmentIndex] ?? null;
  const totalDuration  = currentSegment?.totalDuration ?? 0;
  const isRunning      = runtimeState.phase === PHASES.RUNNING;

  useEffect(() => {
    if (!isRunning) {
      // When not running, show the static elapsed value from segment state
      const segElapsed = currentSegment?.elapsedAtPause
        ?? currentSegment?.duration
        ?? 0;
      setElapsed(segElapsed);
      cancelAnimationFrame(rafRef.current);
      return;
    }

    function loop() {
      const timer = timerRef.current;
      if (!timer) { rafRef.current = requestAnimationFrame(loop); return; }

      const val = timer.getElapsedSeconds();
      if (val !== lastRef.current) {
        lastRef.current = val;
        setElapsed(val);
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, timerRef, currentSegment]);

  // Also recover elapsed on visibility restore
  useEffect(() => {
    const onVisible = () => {
      if (!timerRef.current) return;
      const val = timerRef.current.getElapsedSeconds();
      lastRef.current = val;
      setElapsed(val);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [timerRef]);

  const clampedElapsed = Math.min(elapsed, totalDuration);
  const timeLeft       = Math.max(0, totalDuration - clampedElapsed);
  const progress       = totalDuration > 0 ? clampedElapsed / totalDuration : 0;

  return { elapsed: clampedElapsed, timeLeft, progress };
}
