# Task Lifecycle

This document describes the state machine governing [[Tasks]] from initial capture to terminal disposition.

---

## State Transitions

```mermaid
stateDiagram-v2
    [*] --> todo: Task Created (Planner / Today)
    todo --> in_progress: Started in Focus or Status Shift
    in_progress --> todo: Reset to Todo
    todo --> completed: Checkbox Clicked
    in_progress --> completed: Checkbox Clicked
    todo --> cancelled: Mark Cancelled
    in_progress --> cancelled: Mark Cancelled
    completed --> todo: Reopened
    cancelled --> todo: Reopened
    completed --> [*]: Permanent Delete (DELETE /api/task/:id)
    cancelled --> [*]: Permanent Delete
    todo --> [*]: Permanent Delete
```

---

## Concrete Semantics

1. **Status Field:** Implemented as an explicit string enum on `Task.status`:
   - `"todo"`: Pending execution.
   - `"in-progress"`: Active engagement.
   - `"completed"`: Finished work.
   - `"cancelled"`: Work dismissed without completion.
2. **Reversibility:** Every transition is fully reversible; completed tasks can be reopened.
3. **No Automatic Mutators:** No automated system process (such as a cron job, timer expiration, or streak calculation) mutates `Task.status`. It is exclusively mutated by explicit user intent.
