# Developer CLI Tools

> Small local developer-only utilities for database administration and user role management.

---

## Overview

Athena provides isolated command-line utilities to manage administrative permissions directly against the configured PostgreSQL database without exposing public API endpoints or modifying application-level auth middleware.

These commands run within the `backend/` directory using npm scripts and interact directly with the `users` table via parameterized queries.

---

## Available Commands

### 1. Promote User to Admin (`set-admin`)

Grants administrative access (`account_type = 'admin'`) to an existing user identified by their email address.

```bash
npm run set-admin -- <email>
```

**Example:**
```bash
npm run set-admin -- user@example.com
```

**Output:**
```
Admin access granted.

Email: user@example.com
ID:    1852601b-82d3-4111-8aef-bbd04c1c4a3d
Type:  admin
```

### 2. Demote Admin to Normal User (`set-user`)

Reverts an existing admin user back to a standard user account (`account_type = 'user'`).

```bash
npm run set-user -- <email>
```

**Example:**
```bash
npm run set-user -- user@example.com
```

**Output:**
```
Admin access removed.

Email: user@example.com
ID:    1852601b-82d3-4111-8aef-bbd04c1c4a3d
Type:  user
```

---

## Behavior & Safety Rules

- **Direct Database Execution**: These scripts connect directly to the database defined by `DATABASE_URL` in `backend/.env`.
- **Case-Insensitive Email Matching**: The target email is matched case-insensitively (`LOWER(email)`).
- **Targeted Updates**: Only the `account_type` column for the single matching user row is updated. No passwords, tokens, sessions, or tasks are modified.
- **Sensitive Data Redaction**: Password hashes, session tokens, and personal settings are never output to standard output or error.
- **Connection Safety**: The PostgreSQL connection pool is explicitly closed via `closePgPool()` in a `finally` block upon completion.
- **Exit Codes**:
  - `0`: Operation completed successfully.
  - `1`: Missing email argument, user not found, or database error.
