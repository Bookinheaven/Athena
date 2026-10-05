# Streaks and Daily Stats

The Streaks and Daily Stats subsystem (`backend/services/streakService.js`) measures habit consistency and maintains user motivation through non-punitive streaks.

---
## The Daily Evaluation Engine

Every day is evaluated against the user's `dailyTargetMinutes` (default: 25 minutes).

$$\text{streakRate} = \frac{\text{focusMinutes}}{\text{dailyTargetMinutes}}$$
### Health State Thresholds:
- **Green ($\text{streakRate} \ge 1.0$):** Target fully met. Result: `"success"`. Streak increments by 1.
- **Yellow ($0.7 \le \text{streakRate} < 1.0$):** Partial progress. Result: `"partial"`. Streak is preserved at current count without penalty.
- **Red ($\text{streakRate} < 0.7$):** Target missed. Result:
  - If `freezeBalance > 0`: Consumes 1 freeze token. Result: `"freeze_saved"`. Streak is preserved.
  - If `freezeBalance === 0`: Result: `"failed"`. Streak resets to 0.

---
## Streak Freeze Mechanics

- **Initial Balance:** Every user starts with 3 freeze tokens.
- **Maximum Ceiling:** Hard capped at `maxFreezeBalance: 3`.
- **Earning Freezes:** Completing a 7-day streak milestone (`currentStreak % 7 === 0`) awards +1 freeze token (if balance < 3).
- **Consumption:** Automatic when evaluating a red day with consecutive day gap ($diffDays = 1$).

---
## Evaluation Triggers

Daily evaluation does not rely on a brittle background cron job. It runs **reactively on-demand**:
1. When a focus session completes (`sessionController.js` invokes `dailyStreakUpdate` and `processDailyStreak`).
2. When the user loads Today dashboard or requests `/api/streak/summary`.
