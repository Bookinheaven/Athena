# Planner

The Planner (`/planner`) is Athena’s central organization and date-triage workstation. It allows users to manage unassigned tasks, schedule work across upcoming days, and access scratchpad notes.

---

## Architecture & Views

Planner organizes work into three primary tab views:
1. **Board / Tasks View:** Kanban/list-based triage of tasks categorized by status, date, or goal.
2. **Timeline View:** Calendar grid allocating explicit clock intervals ([[Timeline]]).
3. **Notes View:** Full-page TipTap rich-text scratchpad and documentation repository ([[Notes]]).

---

## Planning Mechanisms

### 1. Date Allocation
- Users assign tasks to dates by setting `Task.plannedDate`.
- Dropping a task into "Today" sets `plannedDate = startOfToday()`.
- Dropping a task into a future date updates `plannedDate` accordingly.
- Clearing the date removes `plannedDate`, returning the task to the unscheduled backlog / inbox.

### 2. Task Launch Flow
- When launching Focus from Planner, the user can click the task's Focus action.
- Opens `DurationModal`, allowing custom focus duration selection (e.g. 25m, 45m, 60m).
- On confirm, navigates to `/focus-page` with:
  ```javascript
  {
    taskIds: [task._id],
    title: task.title,
    source: "planner",
    plannedDuration: selectedDurationSeconds,
  }
  ```
- **Invariant:** The selected duration directly configures the [[Focus Runtime]], superseding any previously active or default session duration.
