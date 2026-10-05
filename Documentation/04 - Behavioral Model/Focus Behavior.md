# Focus Behavior

This document defines the rules governing how focus time is partitioned, counted, and regulated during active execution.

---

## Segment Partitioning Rules (`segmentUtils.js`)

Focus time is organized into structured sequences of **focus** and **break** segments:

1. **Short Sessions ($\le 45$ Minutes):**
   - Partitioned as a single, uninterrupted focus block (e.g. 25m focus, 45m focus).
   - Rationale: Inserting artificial breaks into a sub-45-minute sprint breaks cognitive flow unnecessarily.
2. **Extended Sessions ($> 45$ Minutes):**
   - Partitioned according to Pomodoro intervals: repeated 25-minute focus blocks separated by 5-minute short breaks, culminating in a 15-minute long break after 4 intervals.

---

## Pause Accounting & Distraction Invariants

- **Wall-Clock True Pause:** When paused, the clock stops accumulating focus seconds immediately.
- **Audit Logging:** Every pause appends a record to `Session.pauseEvents`:
  ```json
  {
    "id": "pause-1",
    "startTime": "2026-09-29T10:14:00.000Z",
    "endTime": "2026-09-29T10:16:30.000Z",
    "duration": 150,
    "reason": "Manual Pause"
  }
  ```
- **Distraction Logging:** Real-time clicks on distraction categories increment `sessionStats.interruptions` without forcing a timer pause, allowing users to note an interruption without halting their work rhythm.
