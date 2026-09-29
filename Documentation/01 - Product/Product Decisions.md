# Product Decisions

This document records architectural, behavioral, and product decisions locked by the team. Every decision is explicitly flagged as either **IMPLEMENTED** in the current codebase or **DECIDED / NOT IMPLEMENTED**.

---
## Summary Status

- **Implemented:** 8 decisions active in codebase.
- **Decided / Not Implemented:** 13 architectural & behavioral invariants committed for upcoming development.

---
## Section A: Implemented Decisions

### 1. Route-Persistent Focus Runtime
- **Status:** `IMPLEMENTED`
- **Location:** `frontend/src/pages/layouts/UserLayout.jsx`, `frontend/src/features/focus/contexts/FocusContext.jsx`
- **Decision:** The Focus execution runtime (`FocusProvider`) is mounted at the `UserLayout` level, strictly above individual page routes.
- **Consequence:** Navigating between `/focus-page`, `/planner`, `/dashboard`, or `/settings` does not destroy the active timer or reset session state.

### 2. Pure Wall-Clock Timer Architecture
- **Status:** `IMPLEMENTED`
- **Location:** `frontend/src/features/focus/runtime/TimerClock.js`
- **Decision:** Elapsed time is derived from wall-clock timestamps (`Date.now() - startTime`) rather than accumulated `requestAnimationFrame` (RAF) or `setInterval` tick counts.
- **Consequence:** Zero timer drift across background tabs, OS sleep, and browser throttling.

### 3. Dedicated Review Prompt on Session Discard
- **Status:** `IMPLEMENTED`
- **Location:** `frontend/src/features/focus/components/review/SessionReview.jsx`, `frontend/src/features/focus/hooks/useFocusRuntime.js`
- **Decision:** When a user ends or stops a focus session prematurely, the system does not discard data silently. It transitions to `Session Review` with empathetic copy ("Session Ended Early"), capturing reasons for abandonment while offering an explicit skip option.

### 4. Non-Destructive Multi-Tenant UI Scoping
- **Status:** `IMPLEMENTED`
- **Location:** `frontend/services/userStateService.js`
- **Decision:** All browser `localStorage` keys for UI preferences (theme, sidebar collapsed state, workspace layout) must be scoped with the active user's ID via `getUserScopedKey(key, userId)`.
- **Consequence:** Switching accounts on the same machine cannot leak or overwrite another user's UI layout or workspace preferences.

### 5. Backend Ownership and Mass-Assignment Defense
- **Status:** `IMPLEMENTED`
- **Location:** `backend/controllers/userController.js`, `backend/services/userService.js`
- **Decision:** Profile updates are strictly restricted to explicit allowlists (`fullName`, `settings.theme`, etc.). Identity fields (`_id`, `email`, `role`, `isEmailVerified`) cannot be modified via profile endpoints.

### 6. Serialized Session Write Pipeline
- **Status:** `IMPLEMENTED`
- **Location:** `frontend/src/features/focus/runtime/PersistenceQueue.js`
- **Decision:** All HTTP PATCH persistence calls to `/session/:id` must pass through a single-worker serial queue.
- **Consequence:** Completely eliminates race conditions where an autosave progress update overwrites a final session completion payload.

### 7. Explicit Session Context Precedence Over Stale Records
- **Status:** `IMPLEMENTED`
- **Location:** `frontend/src/features/focus/hooks/useFocusRuntime.js`
- **Decision:** When navigating from Planner or Today with an explicit task (`navContext.taskIds`), the runtime will not resurrect an old uncompleted session; it marks the stale session abandoned and boots a new session with the newly selected task and duration.

### 8. Context-Aware Focus Scratchpad Notes
- **Status:** `IMPLEMENTED`
- **Location:** `frontend/src/features/focus/components/notes/Notes.jsx`
- **Decision:** Focus notes support viewing "All Notes", "General Notes", or filtering by linked task context, with automated background synchronization to `/notes`.

---
## Section B: Decided / Not Implemented Decisions

### 9. Decoupling Task Completion from Focus Completion
- **Status:** `DECIDED / NOT IMPLEMENTED`
- **Decision:** Completing a Focus session does **not** automatically mark its associated Task as `completed`. Similarly, completing a Task does not stop a running Focus session.
- **Rationale:** A 25-minute focus session on "Draft Thesis Chapter" may finish successfully while the task itself requires 10 more hours of work.
- **Current State:** The code already exhibits this separation (Task remains `todo` or `in-progress` when a session finishes). However, formal outcome integration during [[Session Review]] is not yet wired.

### 10. Explicit Task Outcome Question in Session Review
- **Status:** `DECIDED / NOT IMPLEMENTED`
- **Decision:** At the end of a single-task Focus session, the [[Session Review]] modal will explicitly prompt:
  - *Task Completed*
  - *Partially Completed*
  - *Not Completed / Blocked*
- **Current State:** Session review currently collects mood, focus depth, and distractions, but does not yet mutate `Task.status`.

### 11. Rescheduling Semantics are Strictly Neutral
- **Status:** `DECIDED / NOT IMPLEMENTED`
- **Decision:** Rescheduling a task to a future date is an act of realistic planning, **not a failure** and **not a completion**. It must not increment failure metrics, nor reset streaks.
- **Current State:** Re-dating tasks in Planner changes `Task.plannedDate`, but there is no occurrence-level tracking to differentiate an on-time completion from a rescheduled one.

### 12. Unfinished Work Remains Anchored to Original Plan Date
- **Status:** `DECIDED / NOT IMPLEMENTED`
- **Decision:** Athena will **not** silently auto-roll unfinished tasks to "Today" at midnight. An uncompleted task planned for Tuesday must remain historically associated with Tuesday until the user explicitly triages or reschedules it.
- **Current State:** Today currently hides tasks where `plannedDate < today` (see [[Today]]), but the backlog triage view for overdue work is not yet built.

### 13. Unified Streak Based on Planned Work Consistency
- **Status:** `DECIDED / NOT IMPLEMENTED`
- **Decision:** The overall Athena streak will represent **consistency of following through on planned daily work**, rather than raw focus minutes alone. Focus minutes will remain a secondary behavioral telemetry metric.
- **Current State:** Streaks currently evaluate purely against `DailyStats.focusMinutes >= Streak.dailyTargetMinutes`.

### 14. Recurring Tasks as Distinct Daily Occurrences
- **Status:** `DECIDED / NOT IMPLEMENTED`
- **Decision:** Recurring tasks will be defined by a recurrence rule that generates distinct daily occurrences. The user interacts with the occurrence, preserving historical records of past days.
- **Current State:** The current `Task` model has no recurrence schema.

### 15. Multi-State Activity Heatmap
- **Status:** `DECIDED / NOT IMPLEMENTED`
- **Decision:** The dashboard streak calendar will support 4 visual states per day:
  - **Success (Green):** Planned work achieved.
  - **Partial (Yellow):** Meaningful work done, but target missed.
  - **Freeze Saved (Blue/Shield):** Missed day protected by freeze balance.
  - **Rest / Neutral (Gray):** Scheduled rest day or rescheduling day (not red).
  - **Failed (Red):** Zero follow-through without freeze protection.
- **Current State:** Backend `DailyStats.state` stores `"green" | "yellow" | "red"`, but frontend heatmap visualization is basic.

### 16. Common Core Engine with Contextual Personas
- **Status:** `DECIDED / NOT IMPLEMENTED`
- **Decision:** Student, Professor, and Developer features will exist as lightweight contextual extensions of the unified Task/Focus/Streak engine, rather than distinct application modes.
- **Current State:** Persona features are in exploratory phase (see [[Personas and Contexts]]).

### 17. Scope Exclusion: Explicit Non-Goals
- **Status:** `DECIDED / LOCKED`
- **Decision:** The following will **not** be built in the core roadmap:
  - Full Google Calendar replacement (Athena is for execution, not calendar invites).
  - Unconstrained AI conversational chatbot.
  - Social feeds, leaderboards, or public friend networks.
  - Complex multi-user enterprise permissions or Gantt charting.
