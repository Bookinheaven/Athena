# History V2

The **History** subsystem represents the definitive, chronological audit of actual work accomplished over time, contrasting planned intentions with ground-truth execution.

---

## Architectural Purpose

While [[Planner]] represents future intention and [[Focus]] represents present execution, **History represents past reality**.

It serves as the historical source of truth for:
* **True Focus Execution:** Exact elapsed focus seconds, pauses, and segmented intervals.
* **Plan vs. Reality:** Planned tasks and durations compared against actual completed work.
* **Habit Consistency:** Day-by-day outcome states evaluated against daily focus targets.
* **Qualitative Reflections:** Mood ratings, focus scores, and logged distraction notes.

---

## Core Components of History V2

### 1. Monday-First Interactive Calendar Grid
* **Deterministic Product Dates:** All calendar days and date ranges are parsed and queried using local product dates (`YYYY-MM-DD`), preventing timezone boundary shifts that traditionally shift late-night sessions into adjacent dates.
* **Month-to-Month Navigation:** Smooth pagination across calendar months with pre-filled day cells.
* **Visual Day Badges:** Each day in the calendar displays its evaluated outcome color (green, yellow, red, or neutral).

### 2. Day State Evaluation Model
Every calendar day is deterministically evaluated into one of four states:
* **Successful (Green):** User achieved $\ge 80\%$ task completion or met/exceeded their daily focus target.
* **Partial (Yellow):** User engaged in focus sessions or partially completed tasks without reaching the target threshold.
* **Missed / Failed (Red):** Planned tasks were scheduled, but no work was executed, or the day was abandoned without meeting minimum requirements.
* **Neutral (Gray / Rest Day):** Days with no planned commitments or designated rest days. These days never deduct freezes or penalize the user's streak.

### 3. Selected Day Summary
* **Plan Outcome Metrics:** Total planned tasks, completed tasks, and schedule blocks for the selected day.
* **Focus Telemetry:** Real-time accumulation of focus minutes, break minutes, and completed session counts.
* **Clear Separation:** Telemetry and planning are kept distinct to prevent misleading scores on rest days or ad-hoc focus days.

### 4. Inline Session Breakdown List
Clicking any session row expands an inline detail drawer with complete telemetry:
* **Duration:** Actual focus minutes vs. planned duration.
* **Outcome Badge:** Completed, Partial, or Abandoned.
* **Segments & Pauses:** Count of focus/break intervals and pause events.
* **Session Reflection:** Post-session mood rating (1–5), focus depth score (1–5), and qualitative distraction reflections.

### 5. Task Occurrence Audit
* Preserves immutable snapshots (`snapshotTaskTitle`, priority) of every task planned or completed on that date, guaranteeing historical auditability even if the canonical task is later edited or deleted.
