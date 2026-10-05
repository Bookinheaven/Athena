# Security

Athena implements defensive engineering across authentication, input sanitization, multi-tenant isolation, and database access.

---

## 1. Authentication & Cookie Protection
- **JWT Delivery:** Distributed exclusively via `HttpOnly`, `SameSite=Lax`, and `Secure` (production) cookies.
- **XSS Token Defense:** Storing authentication tokens in cookies rather than `localStorage` prevents malicious client-side scripts from reading tokens.
- **Password Storage:** Salted and hashed using `bcryptjs` with a work factor of 12 before saving to MongoDB (`userModel.js`).

---

## 2. Mass-Assignment & Parameter Pollution
- In `backend/controllers/userController.js`, incoming mutation requests are filtered against strict allowlists.
- Sensitive fields (`id`, `email`, `role`, `isEmailVerified`) cannot be modified through general update endpoints.

---

## 3. Multi-Tenant Authorization Enforcements
- Every database query for user assets (Tasks, Notes, Goals, Sessions, ScheduleBlocks, Streaks) enforces `userId = req.user.id` or foreign key scoping.
- Attempting to query, update, or delete a task belonging to another user returns `404 Not Found` or `403 Forbidden`.

---

## 4. Rate Limiting & Denial-of-Service Defense
Configured via `express-rate-limit` in `backend/server.js`:
- `/api/auth/*`: 100 requests per 15 minutes (mitigates brute-force attacks on login and password reset).
- `/api/*` (General): 200 requests per 15 minutes.
- `/api/session/*`: 1000 requests per 15 minutes (allows high-frequency background heartbeat updates).
