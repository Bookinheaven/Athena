# Known Issues

This document records confirmed technical limitations, unpopulated schema fields, and semantic mismatches verified directly in the current codebase.

---

## 1. Schema Gaps in Task Model (`backend/models/taskModel.js`)

- **No Estimate Field:** The `Task` schema contains no `estimatedDuration` or `estimateMinutes` field. Planning capacity cannot currently compare estimated vs. actual duration.
- **No Completion Timestamp:** `Task` has timestamps for `createdAt` and `updatedAt`, but no dedicated `completedAt` Date field. As a result, calculating historical task completion velocity requires parsing audit logs rather than simple database queries.
- **No Aggregated Time Spent:** Time spent is stored on `Session` documents. The parent `Task` document does not maintain a cached `totalFocusMinutes` counter.

---

## 2. Unpopulated Field: `DailyStats.tasksCompleted`

- **Location:** `backend/models/dailyStatsModel.js`, `backend/services/streakService.js`
- **Issue:** The `DailyStats` schema defines `tasksCompleted: { type: Number, default: 0 }`. However, in `streakService.js` (both `dailyStreakUpdate` and `processDailyStreak`), this field is never queried or incremented. It remains `0` on all records.

---

## 3. Unwired Adaptive Target Utility

- **Location:** `backend/utils/adaptiveTarget.js`
- **Issue:** A helper function `adaptDailyTarget(user)` exists to algorithmically scale daily focus targets up or down based on past 5-day performance. However, this utility is **never imported or invoked** in `streakService.js` or any controller. Target adjustment remains manual.

---

## 4. Today Dashboard Overdue Invisibility

- **Location:** `frontend/src/features/today/hooks/useTodayData.js`
- **Issue:** The filter for today's tasks strictly requires:
  ```javascript
  new Date(t.plannedDate).toDateString() === new Date().toDateString()
  ```
  If a task was planned for yesterday and left uncompleted, it completely disappears from the [[Today]] screen. The user must navigate to [[Planner]] to find and reschedule it.

---

## 5. Local Date vs. UTC Date Mismatch

- **Location:** `frontend/src/features/today` vs. `backend/utils/streakHelpers.js`
- **Issue:**
  - Client components group tasks and display day names using local browser time (`toLocaleDateString`).
  - Backend streak processing groups daily stats using strict UTC midnight (`Date.UTC(year, month, date, 0, 0, 0)`).
  - **Consequence:** Users working near UTC day boundaries (e.g. late evening in North America or early morning in Asia) may see a session attributed to a different calendar day in [[Streaks and Daily Stats]] compared to [[Today]].
