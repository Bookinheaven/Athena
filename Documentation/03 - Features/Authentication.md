# Authentication

Athena implements secure, stateless authentication using JSON Web Tokens (JWT) distributed exclusively via HTTP-only cookies.

---

## Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant FE as Frontend (AuthContext)
    participant API as Backend (/api/auth)
    participant Mail as Email Transport (Nodemailer)
    participant DB as MongoDB (User Model)

    Note over User,DB: 1. Registration & Verification
    User->>FE: Fill SignUp (username, email, password, fullName)
    FE->>API: POST /api/auth/register
    API->>API: Hash password (bcrypt cost 12), generate 6-digit OTP
    API->>DB: Save user (isEmailVerified: false, emailVerificationExpires: 10m)
    API->>Mail: Dispatch verification email
    API-->>FE: 201 Created
    User->>FE: Enter OTP
    FE->>API: POST /api/auth/verify-email (email, otp)
    API->>DB: Mark isEmailVerified: true, clear OTP fields
    API-->>FE: 200 OK

    Note over User,DB: 2. Login
    User->>FE: Enter email & password
    FE->>API: POST /api/auth/login
    API->>DB: Find user, comparePassword()
    API->>API: Sign JWT (userId, role)
    API-->>FE: Set-Cookie: jwt (HttpOnly, Secure, SameSite=Lax)
    API-->>FE: 200 OK (user object)

    Note over User,DB: 3. Session Verification on Boot
    FE->>API: GET /api/auth/check-auth
    API->>API: Verify cookie token
    API-->>FE: 200 OK (user object)
```

---

## Cookie Security Configuration

The authentication cookie is generated with the following security flags:
- `httpOnly: true`: Inaccessible to client-side JavaScript (`document.cookie`), preventing credential extraction via XSS.
- `secure: process.env.NODE_ENV === "production"`: Enforced over HTTPS in production.
- `sameSite: "lax"`: Protects against Cross-Site Request Forgery (CSRF).
- `maxAge: 7 * 24 * 60 * 60 * 1000`: 7-day expiration window.

---

## Multi-Account Management (`MultiAccountContext`)

Athena supports instant switching between multiple authenticated profiles on the same workstation:
- `MultiAccountProvider` stores accounts in client memory/storage.
- When an account switch is triggered, credentials for the selected account re-authenticate, resetting user-scoped cached state.
- **Invariant:** Switching accounts explicitly resets all `userStateService` scopes, ensuring no data bleed between accounts (see [[Multi Account Isolation]]).

---

## Password Reset Workflow

1. **Request:** User sends `POST /api/auth/request-password-reset` with `email`.
2. **Generation:** Server verifies email, writes `passwordResetOTP` and expiration (10 min) to `User` document, and dispatches an email.
3. **Execution:** User submits `POST /api/auth/reset-password` with `email`, `otp`, and `newPassword`.
4. **Validation:** Server verifies OTP validity, hashes the new password via Mongoose `pre("save")`, clears the reset fields, and completes the reset.
