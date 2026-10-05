# Goals

Goals provide the strategic container under which individual [[Tasks]] and [[Notes]] are organized.

---

## Schema & Attributes

Defined in `backend/models/goalModel.js`:
- `user` (ObjectId, ref: `User`, required, indexed).
- `title` (String, required, max 100 characters).
- `description` (String, default: `""`).
- `color` (String, default: `"#6366f1"`): Visual accent color used across badges and indicators.
- `targetDate` (Date, optional): Target milestone date.
- `status` (Enum): `"active" | "completed" | "archived"`. Default: `"active"`.

---

## Relational Cascading Rules

Defined in `backend/services/goalService.js`:
- **Task Association:** Tasks point to `Goal` via `Task.goal`.
- **Note Association:** Notes point to `Goal` via `Note.goal`.
- **Deletion Invariant:** Deleting a goal does **not** delete its associated tasks or notes. Instead, the service executes:
  ```javascript
  await Task.updateMany({ goal: goalId }, { goal: null });
  await Note.updateMany({ goal: goalId }, { goal: null });
  ```
  This preserves the user's historical work while detaching the obsolete category container.
