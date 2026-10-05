# Profile

The Profile module manages user identity attributes, display metadata, and credential changes.

---

## Capabilities & Permissions

### 1. Editable Attributes
- **Full Name (`fullName`):** Updated via `PATCH /api/user/profile`. Validated between 2 and 50 characters.

### 2. Read-Only Attributes
The following fields are strictly immutable via general profile endpoints to maintain account integrity:
- `_id`: Database primary key.
- `username` / `usernameLower`: Immutable after registration.
- `email`: Immutable (prevents account takeover or unverified identity changes).
- `type` / `role`: User authorization level (`user` or `admin`).
- `isEmailVerified`: System-controlled boolean flag.
- `createdAt` / `updatedAt`: Automatic database timestamps.

### 3. In-App Password Modification
- **Endpoint:** `PATCH /api/user/password`
- **Validation:** Requires `currentPassword` and `newPassword` (minimum 8 characters).
- **Execution:** Validates `currentPassword` using `user.comparePassword()`. Upon verification, writes the new password (triggering bcrypt hashing in the model hook) and saves.

---

## Defensive Engineering & Allowlisting

In `backend/controllers/userController.js`, mass-assignment is strictly forbidden:

```javascript
// Whitelist pattern in updateProfile
const allowedUpdates = ["fullName"];
const updates = {};
for (const key of allowedUpdates) {
  if (req.body[key] !== undefined) {
    updates[key] = req.body[key];
  }
}
```

Any attempt by a client to submit `{ role: "admin" }` or `{ email: "attacker@domain.com" }` is stripped before hitting the service layer.
