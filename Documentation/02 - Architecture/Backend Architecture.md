# Backend Architecture

Athena’s backend is an Express 5 Node.js service adhering to a layered architectural pattern:

$$\text{Route} \longrightarrow \text{Middleware} \longrightarrow \text{Controller} \longrightarrow \text{Service} \longrightarrow \text{Repository} \longrightarrow \text{PostgreSQL / Drizzle ORM}$$

---

## The Request Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as Browser / Desktop Client
    participant MW as Express Middleware Chain
    participant Ctrl as Domain Controller
    participant Svc as Business Service
    participant Repo as Data Repository
    participant DB as PostgreSQL (Drizzle ORM)

    Client->>MW: HTTP Request + Cookie (jwt)
    Note over MW: rateLimiter, cors, cookieParser, authMiddleware
    MW->>Ctrl: req.user attached
    Ctrl->>Ctrl: Validate payload & params
    Ctrl->>Svc: Call business method(userId, data)
    Svc->>Repo: Query / Mutate with { userId } guard
    Repo->>DB: Drizzle SQL Execution
    DB-->>Repo: Query result records
    Repo-->>Svc: Hydrated domain entities
    Svc-->>Ctrl: Business entity
    Ctrl-->>Client: 200/201 JSON { success: true, ... }
```

---

## Layer Definitions & Invariants

### 1. Routes (`backend/routes/`)
- Declares HTTP verbs (`GET`, `POST`, `PATCH`, `DELETE`) and URL patterns.
- Attaches endpoint-specific rate limiters (`authLimiter`, `apiLimiter`, `heavyLimiter`).
- Attaches route guards (`authMiddleware`, `roleMiddleware`).
- **Invariant:** Routes contain **zero business logic**; they delegate directly to controllers.

### 2. Middleware (`backend/middlewares/`)
- **`authMiddleware.js`:** Extracts and verifies JWT from cookies or `Authorization: Bearer` headers. Validates user existence and attaches `req.user` (`id`, `email`, `role`).
- **`roleMiddleware.js`:** Restricts administrative endpoints to `role: "admin"`.
- **`validationMiddleware.js`:** Sanitizes input strings and guards against injection.

### 3. Controllers (`backend/controllers/`)
- Extracts parameters from `req.params`, `req.query`, and `req.body`.
- Performs HTTP status code translation (200, 201, 400, 403, 404, 500).
- Catches errors and shapes standard JSON response envelopes:
  ```json
  { "success": true, "session": { ... } }
  { "success": false, "message": "Error description" }
  ```
- **Invariant:** Controllers do not interact with database tables or repositories directly; they must invoke Services.

### 4. Services (`backend/services/`)
- Encapsulates all domain business logic, invariants, multi-entity transactions, and intelligence engines.
- Examples:
  - `sessionService.js`: Session initialization, segment transitions, pause accounting, active session recovery.
  - `targetService.js`: Dynamic 7-day adaptive daily focus target calculation.
  - `streakService.js`: Daily streak progression, freeze deductions, target adaptations.
  - `taskService.js`: Task ordering, occurrence scheduling, status mutations.
- **Invariant:** Every repository query executed within a service must enforce `userId` tenancy boundaries.

### 5. Repositories (`backend/repositories/`)
- Clean data access layer abstracting Drizzle ORM operations against PostgreSQL.
- Performs schema entity hydration (`hydrateSession`, etc.) ensuring consistent object shapes for callers.
- Enforces SQL indexes, joins, and multi-tenant filtering.

### 6. Schema Definitions (`backend/db/schema/`)
- Drizzle ORM PostgreSQL table schemas (`users`, `tasks`, `taskOccurrences`, `scheduleBlocks`, `sessions`, `sessionSegments`, `sessionPauseEvents`, `sessionFeedback`, `streaks`, `dailyStats`, `goals`, `notes`).

---

## Architectural Exceptions

Where standard patterns were deviated from due to specific domain constraints:

1. **`plannerController.js` Aggregation:**
   - Aggregates tasks, notes, goals, and schedule blocks into a single consolidated payload for fast Planner hydration. Rather than calling multiple individual services, it coordinates queries directly within `plannerService` / `plannerController`.
2. **`sessionController.js` Streak Hook:**
   - When a session completes (`updateSession`), the controller synchronously invokes `StreakService.dailyStreakUpdate` and `StreakService.processDailyStreak` to immediately calculate updated streak status.
