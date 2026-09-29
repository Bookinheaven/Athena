// ─────────────────────────────────────────────────────────────────────────────
// timerClock.test.js
//
// Pure unit tests for WallClockTimer.
// All time values are injected — no real Date.now() calls.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { WallClockTimer } from '../runtime/timerClock.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const T0 = 1_000_000;   // arbitrary epoch ms
const SEC = 1000;

function startAt(timer, atMs = T0) { timer.start(atMs); }
function pauseAt(timer, atMs)      { timer.pause(atMs); }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WallClockTimer — initial state', () => {
  it('returns 0 elapsed before start', () => {
    const t = new WallClockTimer();
    expect(t.getElapsedSeconds(T0)).toBe(0);
    expect(t.running).toBe(false);
  });

  it('accepts initial elapsed in ms', () => {
    const t = new WallClockTimer(30_000); // 30 seconds
    expect(t.getElapsedSeconds(T0)).toBe(30);
  });
});

describe('WallClockTimer — start / elapsed', () => {
  it('accumulates elapsed after start', () => {
    const t = new WallClockTimer();
    startAt(t, T0);
    expect(t.getElapsedSeconds(T0 + 60 * SEC)).toBe(60);
  });

  it('getElapsedMs returns milliseconds', () => {
    const t = new WallClockTimer();
    startAt(t, T0);
    expect(t.getElapsedMs(T0 + 500)).toBe(500);
  });

  it('start() is idempotent when already running', () => {
    const t = new WallClockTimer();
    startAt(t, T0);
    t.start(T0 + 10 * SEC); // second call ignored
    expect(t.getElapsedSeconds(T0 + 30 * SEC)).toBe(30);
  });
});

describe('WallClockTimer — pause', () => {
  it('freezes elapsed on pause', () => {
    const t = new WallClockTimer();
    startAt(t, T0);
    pauseAt(t, T0 + 25 * SEC); // elapsed: 25s
    // even 60s later, elapsed should still be 25s
    expect(t.getElapsedSeconds(T0 + 85 * SEC)).toBe(25);
    expect(t.running).toBe(false);
  });

  it('folds into baseMs on pause', () => {
    const t = new WallClockTimer();
    startAt(t, T0);
    pauseAt(t, T0 + 10 * SEC);
    expect(t.getElapsedMs()).toBe(10_000);
  });

  it('pause() is idempotent when not running', () => {
    const t = new WallClockTimer(5_000);
    pauseAt(t, T0); // no-op — not running
    expect(t.getElapsedMs()).toBe(5_000);
  });
});

describe('WallClockTimer — resume', () => {
  it('continues accumulating after resume', () => {
    const t = new WallClockTimer();
    startAt(t, T0);
    pauseAt(t, T0 + 20 * SEC); // 20s elapsed, paused
    t.start(T0 + 60 * SEC);    // resume 40s later
    expect(t.getElapsedSeconds(T0 + 90 * SEC)).toBe(50); // 20 + 30
  });

  it('pause duration is NOT counted in elapsed', () => {
    const t = new WallClockTimer();
    startAt(t, T0);
    pauseAt(t, T0 + 10 * SEC);   // 10s focus
    t.start(T0 + 70 * SEC);       // 60s pause, then resume
    pauseAt(t, T0 + 80 * SEC);    // 10s more focus
    // Total focus = 20s, pause = 60s
    expect(t.getElapsedSeconds(T0 + 80 * SEC)).toBe(20);
  });
});

describe('WallClockTimer — background / sleep simulation', () => {
  it('correctly catches up after long gap (simulating system sleep)', () => {
    const t = new WallClockTimer();
    startAt(t, T0);
    // Simulate 8 hours of sleep (no ticks)
    const EIGHT_HOURS = 8 * 3600 * SEC;
    expect(t.getElapsedSeconds(T0 + EIGHT_HOURS)).toBe(8 * 3600);
  });

  it('works correctly with initial elapsed (session restore)', () => {
    // Session was running, had 600s elapsed before restore
    const t = new WallClockTimer(600_000); // 600s = 10 minutes
    t.start(T0);
    expect(t.getElapsedSeconds(T0 + 60 * SEC)).toBe(660); // 600 + 60
  });
});

describe('WallClockTimer — syncTo', () => {
  it('warps to a new elapsed value while stopped', () => {
    const t = new WallClockTimer(1000);
    t.syncTo(5000, T0);
    expect(t.getElapsedMs(T0)).toBe(5000);
    expect(t.running).toBe(false);
  });

  it('warps to a new elapsed value while running and continues', () => {
    const t = new WallClockTimer(0);
    t.start(T0);
    t.syncTo(10_000, T0 + 5 * SEC); // mid-run sync
    expect(t.getElapsedMs(T0 + 15 * SEC)).toBe(20_000); // 10000 + 10000ms
  });
});

describe('WallClockTimer — reset', () => {
  it('returns to zero after reset', () => {
    const t = new WallClockTimer(5000);
    t.start(T0);
    t.reset();
    expect(t.getElapsedSeconds(T0 + 100 * SEC)).toBe(0);
    expect(t.running).toBe(false);
  });
});

describe('WallClockTimer — multiple stop/resume cycles', () => {
  it('correctly accumulates across many cycles', () => {
    const t = new WallClockTimer();
    // Run for 10s → pause → run for 10s → pause → run for 10s
    startAt(t, T0);
    pauseAt(t, T0 + 10 * SEC);
    t.start(T0 + 30 * SEC);       // 20s pause
    pauseAt(t, T0 + 40 * SEC);   // 10s focus
    t.start(T0 + 60 * SEC);       // 20s pause
    pauseAt(t, T0 + 70 * SEC);   // 10s focus
    expect(t.getElapsedSeconds(T0 + 70 * SEC)).toBe(30);
  });
});
