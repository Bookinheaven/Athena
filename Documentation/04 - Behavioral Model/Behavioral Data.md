# Behavioral Data

This document inventories what behavioral signals Athena is capable of observing today versus telemetry required for future analytical models.

---

## 1. Observable Telemetry Today

| Domain | Entity | Concrete Telemetry Collected |
| :--- | :--- | :--- |
| **Intention** | `Task` | Creation timestamp, planned execution date, external due date, priority. |
| **Scheduling** | `ScheduleBlock` | Planned calendar start/end times, allocated duration, task binding. |
| **Execution** | `Session` | Actual elapsed focus seconds, completed segments, start/end timestamps. |
| **Attention** | `Session` | Pause counts, pause durations, pause reasons, real-time distraction clicks. |
| **Subjective**| `Session` | Post-session mood rating (1-5), focus depth score (1-5), reflection notes. |
| **Habits** | `DailyStats`, `Streak` | Accumulated daily focus minutes, freeze consumption, streak continuity. |

---

## 2. Telemetry Required for Future Adaptive Models

Before Athena can power adaptive planning or AI interventions (see [[AI Direction]]), the following data gaps must be filled:

1. **Task Execution Ratios:**
   - Recording `Task.completedAt` to measure elapsed days between creation, plan, and completion.
   - Aggregating actual session duration spent per task against initial estimates.
2. **Context-Switch Frequency:**
   - Tracking how many distinct tasks are touched within a single day.
3. **Time-of-Day Adherence:**
   - Correlating scheduled start times (`ScheduleBlock.startTime`) with actual focus launch timestamps (`Session.startedAt`) to diagnose procrastination patterns.
4. **Rescheduling Velocity:**
   - Counting how many times a single task was re-dated before completion.
