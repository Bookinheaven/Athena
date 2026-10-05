# Schedule Model

The Schedule Model defines how planned time is reserved on [[Timeline]] and its relationship to actual execution in [[Focus]].

---

## The Schedule Entity

Stored in `backend/models/scheduleBlockModel.js`:
- Binds a `taskId` to an exact calendar start and end timestamp (`startTime`, `endTime`).
- Stores `durationMinutes`, validated $\ge 1$.
- Tracks status: `"scheduled" | "completed" | "skipped"`.

---

## Overlap & Conflict Philosophy

- **Non-Destructive Overlaps:** Many productivity tools prevent overlaps or overwrite conflicting blocks. Athena permits overlapping schedule blocks visually via side-by-side positioning.
- **Rationale:** In real-world environments, users frequently schedule tentative or concurrent commitments (e.g., attending a lecture while running background code compilation). Enforcing rigid single-lane scheduling adds friction without improving adherence.

---

## Transition from Schedule to Execution

When a user launches Focus from a ScheduleBlock:
1. `Timeline` passes `scheduleBlockId` into navigation state.
2. `FocusRuntime` creates `Session` with `scheduleBlockId` populated.
3. Upon session completion, `sessionService.js` updates `ScheduleBlock.status = "completed"` and sets `ScheduleBlock.sessionId = session._id`.
4. This explicitly links the planned calendar intention to the actual recorded execution telemetry.
