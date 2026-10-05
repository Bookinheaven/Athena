// ─────────────────────────────────────────────────────────────────────────────
// Segment Utilities
// Pure functions — no React, no side effects, no imports from this project.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the initial segment array for a new session.
 *
 * The algorithm mirrors the existing createSessionData() logic so that
 * visual behaviour is preserved.  All segments begin with no elapsed time.
 *
 * @param {number} totalFocusDuration  – Total planned session seconds
 * @param {number} breakDuration       – Break length in seconds
 * @param {number} maxBreaks           – Maximum number of breaks
 * @returns {Segment[]}
 */
export function createSegments(totalFocusDuration, breakDuration, maxBreaks) {
  const MIN_FOCUS_SEGMENT = 25 * 60; // 25 minutes minimum per focus block

  // To fit k breaks, we need at least (k + 1) focus segments of MIN_FOCUS_SEGMENT:
  // (k + 1) * MIN_FOCUS_SEGMENT + k * breakDuration <= totalFocusDuration
  const possibleBreaks =
    totalFocusDuration < MIN_FOCUS_SEGMENT * 2 + breakDuration
      ? 0
      : Math.min(
          maxBreaks,
          Math.floor((totalFocusDuration - MIN_FOCUS_SEGMENT) / (MIN_FOCUS_SEGMENT + breakDuration)),
        );

  const totalBreakTime    = possibleBreaks * breakDuration;
  const totalFocusTime    = totalFocusDuration - totalBreakTime;
  const focusSegDuration  = Math.floor(totalFocusTime / (possibleBreaks + 1));

  const segments = [];
  for (let i = 0; i < possibleBreaks + 1; i++) {
    segments.push(createSegment('focus', focusSegDuration));
    if (i < possibleBreaks) {
      segments.push(createSegment('break', breakDuration));
    }
  }
  return segments;
}

/**
 * Create a single blank segment object with the canonical shape.
 */
export function createSegment(type, totalDuration) {
  return {
    type,                    // 'focus' | 'break'
    totalDuration,           // planned seconds (immutable after creation)
    startedAt:     null,     // ISO string; set once on first start, NEVER cleared
    completedAt:   null,     // ISO string; set once when done
    elapsedAtPause: 0,       // seconds accumulated before the last pause
    duration:       0,       // seconds (mirrors elapsedAtPause; kept for backend compat)
  };
}

/**
 * Normalise segments coming from the backend.
 *
 * The backend stores segments in the old format (startedAt cleared on pause,
 * no elapsedAtPause field).  This function maps them to the new canonical
 * shape so that recovery works correctly.
 *
 * Elapsed is recovered from:
 *   1. completedAt → totalDuration (segment is done)
 *   2. startedAt present → wall-clock delta + duration
 *   3. duration only → use it as elapsedAtPause
 *
 * @param {object[]} rawSegments – segments array from backend
 * @returns {Segment[]}
 */
export function normaliseSegments(rawSegments) {
  return (rawSegments || []).map((seg) => {
    let elapsedAtPause = seg.elapsedAtPause ?? seg.duration ?? 0;

    // If the segment was running when the server snapshot was taken
    // (startedAt is set but not cleared — old format may have cleared it;
    // in that case fall back to stored duration)
    if (seg.completedAt) {
      elapsedAtPause = seg.totalDuration ?? seg.duration ?? 0;
    }

    return {
      type:           seg.type          || 'focus',
      totalDuration:  seg.totalDuration || 0,
      startedAt:      seg.startedAt     || null,
      completedAt:    seg.completedAt   || null,
      elapsedAtPause,
      duration:       elapsedAtPause,
    };
  });
}

/**
 * Compute how many seconds have elapsed for a segment right now.
 *
 * This is the authoritative wall-clock calculation used during recovery.
 * The result should NOT be stored in React state on every tick — it is
 * computed on demand for display and for snapshot payloads.
 *
 * @param {Segment} segment
 * @param {number}  [nowMs]   – override for testing; defaults to Date.now()
 * @returns {number} elapsed seconds (capped at totalDuration)
 */
export function recoverElapsed(segment, nowMs = Date.now()) {
  if (!segment) return 0;

  // Segment is done
  if (segment.completedAt) {
    return segment.totalDuration;
  }

  const base = segment.elapsedAtPause ?? segment.duration ?? 0;

  // Segment was running: startedAt is present and completedAt is absent.
  // In the new model startedAt is never cleared after first start.
  if (segment.startedAt) {
    const startMs  = new Date(segment.startedAt).getTime();
    const liveMs   = nowMs - startMs;
    const liveSecs = Math.max(0, Math.floor(liveMs / 1000));
    return Math.min(base + liveSecs, segment.totalDuration);
  }

  // Segment was paused before any start (edge case) — return base
  return base;
}

/**
 * Find the index of the first incomplete segment in an array.
 * Returns the last index if all are complete (fallback for corrupted state).
 */
export function findCurrentSegmentIndex(segments) {
  if (!segments?.length) return 0;
  const idx = segments.findIndex((s) => !s.completedAt);
  return idx < 0 ? segments.length - 1 : idx;
}
