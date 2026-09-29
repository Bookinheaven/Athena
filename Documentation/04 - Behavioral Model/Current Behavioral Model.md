# Current Behavioral Model

This document traces Athena’s exact runtime behavior as it executes **today**, verified directly against the production codebase.

---

## 10 Concrete Runtime Scenarios

### Scenario A: Create a Task but Never Focus It
1. User creates Task "Read Paper" in [[Planner]].
2. `Task` is written to MongoDB: `{ title: "Read Paper", status: "todo", plannedDate: null }`.
3. Task sits in the backlog. It never appears in `DailyStats`, has zero influence on streaks, and creates no `Session` document.
4. **Conclusion:** Unfocused tasks represent pure latent intention; they do not alter behavioral telemetry.

### Scenario B: Focus a Task but Do Not Complete It
1. User clicks **Start Focus** on Task "Write Thesis" (planned duration: 25m).
2. Runtime boots session `sess-123` with `taskIds: ["task-456"]`.
3. User works for 25 minutes. All segments complete naturally.
4. Session review modal opens; user submits mood 4, focus 5.
5. `Session` transitions to `status: "completed"`, `completionType: "completed"`, `duration: 1500`.
6. `DailyStats` increments `focusMinutes: +25`, `sessions: +1`.
7. **Task State:** `Task.status` remains `"todo"`. It is **not** automatically marked completed.

### Scenario C: Complete a Task Without Focus
1. User checks off Task "Reply to Email" in [[Today]] without launching a timer.
2. `taskService.updateTask("task-789", { status: "completed" })` writes to MongoDB.
3. Task moves to completed list.
4. **Telemetry State:** Zero focus minutes added. Zero streak influence. `DailyStats.tasksCompleted` remains 0.

### Scenario D: Abandon a Focus Session Early
1. User starts 45-minute focus session.
2. At minute 12, user clicks **Stop**.
3. Runtime halts `WallClockTimer`, folds 12m into duration, and emits `EVENTS.DISCARD`.
4. Runtime marks `completionType: "abandoned"`, `duration: 720`.
5. [[Session Review]] opens in "Session Ended Early" mode with empathetic guidance.
6. User selects distraction "Phone call", types note, and submits.
7. `DailyStats` receives `focusMinutes: +12`. The partial work counts toward the daily target.

### Scenario E: Complete Focus Session Naturally
1. 25-minute Pomodoro timer reaches 00:00.
2. Runtime dispatches `COMPLETE_SESSION` effect.
3. Sound chime plays (if enabled in [[Settings]]).
4. `SessionReview` opens. User rates depth and mood.
5. Full 25 minutes committed to `DailyStats`. Streak is re-evaluated; if daily target met, streak increments.

### Scenario F: Multiple Sessions on the Same Task
1. User works on "Refactor Engine" across three separate 25-minute sessions in one day.
2. Three distinct `Session` documents are created in MongoDB, each referencing `taskIds: ["refactor-task-id"]`.
3. `DailyStats` records `sessions: 3, focusMinutes: 75`.
4. User finally clicks checkmark on the task card; `Task.status` becomes `"completed"`.

### Scenario G: Rescheduling a Task
1. Task "Audit Logs" planned for Tuesday remains uncompleted at end of day.
2. On Wednesday, user opens [[Planner]] and drags task to Thursday.
3. `Task.plannedDate` updates to Thursday.
4. **Behavioral Invariant:** No penalty recorded. No streak reset. No failure flag assigned.

### Scenario H: Crossing the Day Boundary
1. Midnight passes while user is logged in.
2. If user completes a session at 12:05 AM UTC, `getStartOfDay()` generates a new UTC date timestamp.
3. A new `DailyStats` document is initialized for the new day.
4. Previous day is processed: if target was reached, streak increments; if missed and freeze available, freeze is deducted.

### Scenario I: Navigating to Another Page Mid-Focus
1. User starts 25-minute timer on `/focus-page`. At minute 10, user clicks `/planner`.
2. `FocusProvider` remains mounted in `UserLayout`.
3. `WallClockTimer` continues calculating accurate elapsed time in background.
4. User returns to `/focus-page` at minute 15: the timer smoothly reads 10:00 remaining without jumping or resetting.

### Scenario J: Browser Reload / Machine Crash Mid-Session
1. User is 14 minutes into an active session; browser tab is accidentally closed or refreshed.
2. In-memory `FocusContext` is destroyed.
3. On reload, `FocusProvider` mounts and fires `EFFECTS.FETCH_ACTIVE_SESSION`.
4. Backend finds session in MongoDB with `status: "active"`.
5. Runtime receives session, calculates elapsed time from segments/duration, and **restores session in PAUSED state**.
6. User clicks Resume to continue without data loss.
