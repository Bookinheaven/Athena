# Testing

Athena enforces automated testing on core runtime components to guarantee drift-free timing and deterministic state transitions.

---

## Test Suites & Coverage

Tests are executed with Vitest:

```bash
npx vitest run src/features/focus
```

### 1. `timerClock.test.js` (16 Tests)
Validates the pure `WallClockTimer` class:
- Start, pause, resume, and reset transitions.
- Mathematical precision: verifying elapsed milliseconds under simulated time warps.
- Immunity to background throttling and delayed frames.
- Multi-pause accumulation: ensuring multiple pause events fold correctly into `_baseMs`.

### 2. `focusReducer.test.js` (43 Tests)
Validates the pure session state machine:
- State transitions across all lifecycle phases (`IDLE`, `LOADING`, `RUNNING`, `PAUSED`, `COMPLETED`).
- Output of declarative side-effects (`EFFECTS.POST_SESSION`, `COMPLETE_SESSION`, etc.).
- Event handling for `START`, `PAUSE`, `RESUME`, `TICK`, `SEGMENT_COMPLETE`, `DISCARD`, `RESET`.
- Invariant verification: invalid transitions leave state strictly unmodified.
