# API Architecture

Athena exposes a JSON RESTful HTTP API mounted under `/api`. Endpoints communicate via standard HTTP methods and JSON request/response bodies.

---

## Authentication & Transport Conventions

- **Transport Security:** All communication requires HTTPS in production.
- **Session Identification:** The primary authentication credential is a signed HTTP-only cookie (`jwt`) carrying the authenticated user ID and role.
- **CSRF / Cross-Origin Policy:** Controlled via `cors` middleware in `backend/server.js`, binding allowed origins strictly to `CLIENT_URL` and standard localhost dev ports.
- **Standard Response Envelope:**
  ```json
  // Success
  { "success": true, "session": { ... } }
  
  // Error
  { "success": false, "message": "Descriptive error message" }
  ```

---

## API Route Catalogue

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Auth | Purpose | Key Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new account | `username, email, password, fullName` |
| `POST` | `/api/auth/verify-email` | Public | Verify registration OTP | `email, otp` |
| `POST` | `/api/auth/resend-code` | Public | Resend verification code| `email` |
| `POST` | `/api/auth/login` | Public | Authenticate user | `email, password` |
| `POST` | `/api/auth/request-password-reset` | Public | Send reset OTP | `email` |
| `POST` | `/api/auth/reset-password` | Public | Reset password with OTP | `email, otp, newPassword` |
| `GET` | `/api/auth/check-auth` | User | Verify cookie & return user | None |
| `POST` | `/api/auth/logout` | User | Invalidate cookie | None |

### 2. User & Profile (`/api/user`)

| Method | Endpoint | Auth | Purpose | Key Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/user/profile` | User | Fetch profile & settings | None |
| `PATCH` | `/api/user/profile` | User | Update allowlisted fields | `fullName` |
| `PATCH` | `/api/user/password`| User | Change password | `currentPassword, newPassword` |
| `PATCH` | `/api/user/settings`| User | Update user settings | `theme, session` |

### 3. Focus Sessions (`/api/session`)

| Method | Endpoint | Auth | Purpose | Key Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/session/start` | User | Initialize active session | `sessionId, title, plannedDuration, taskIds, sessionSegments` |
| `PATCH` | `/api/session/:id` | User | Update session progress | `duration, sessionSegments, pauseEvents, status, completionType` |
| `POST` | `/api/session/:id/feedback`| User | Record session review | `mood, focus, distractions, submittedAt` |
| `GET` | `/api/session/active` | User | Fetch active session | None |
| `GET` | `/api/session/history`| User | List past completed sessions| `query: page, limit` |
| `GET` | `/api/session/today-insights` | User | Aggregate today's metrics | None |

### 4. Tasks (`/api/task`)

| Method | Endpoint | Auth | Purpose | Key Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/task` | User | List all user tasks | `query: status, goal` |
| `POST` | `/api/task` | User | Create task | `title, goal, priority, dueDate, plannedDate` |
| `PATCH` | `/api/task/:id` | User | Mutate task fields | `title, status, priority, plannedDate, dueDate` |
| `PATCH` | `/api/task/reorder` | User | Batch update task order | `orderedIds: [taskId]` |
| `DELETE` | `/api/task/:id` | User | Delete task | None |

### 5. Schedule Blocks (`/api/schedule-block`)

| Method | Endpoint | Auth | Purpose | Key Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/schedule-block` | User | Fetch schedule blocks | `query: date` |
| `POST` | `/api/schedule-block` | User | Schedule block | `taskId, date, startTime, endTime, durationMinutes` |
| `PATCH` | `/api/schedule-block/:id` | User | Resize or shift block | `startTime, endTime, durationMinutes, status` |
| `DELETE` | `/api/schedule-block/:id` | User | Remove scheduled block | None |

### 6. Streaks (`/api/streak`)

| Method | Endpoint | Auth | Purpose | Key Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/streak/summary` | User | Process & fetch streak | None |
| `PATCH` | `/api/streak/target` | User | Update daily focus target | `dailyTargetMinutes` |
| `POST` | `/api/streak/freeze` | User | Manually consume freeze | None |

### 7. Notes (`/api/notes`)

| Method | Endpoint | Auth | Purpose | Key Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notes` | User | Fetch user notes | None |
| `POST` | `/api/notes` | User | Create note | `title, content, task, goal, tags` |
| `PATCH` | `/api/notes/:id` | User | Update note content | `title, content, task, pinned` |
| `DELETE` | `/api/notes/:id` | User | Delete note | None |
