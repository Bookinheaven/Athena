// ─────────────────────────────────────────────────────────────────────────────
// focusReducer.test.js
//
// Pure unit tests for the transition() function.
// No React, no DOM, no side effects.
// All tests are deterministic — timestamps are injected via payloads.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { transition, INITIAL_STATE } from '../runtime/focusReducer.js';
import { PHASES, EVENTS, EFFECTS } from '../runtime/constants.js';
import { createSegments } from '../runtime/segmentUtils.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSegments(count = 3, focusDuration = 1500, breakDuration = 300) {
  return createSegments(focusDuration * count + breakDuration * (count - 1), breakDuration, count - 1);
}

function singleSegment() {
  return [
    { type: 'focus', totalDuration: 1500, startedAt: null, completedAt: null, elapsedAtPause: 0, duration: 0 },
  ];
}

function threeSegments() {
  return [
    { type: 'focus', totalDuration: 1500, startedAt: null, completedAt: null, elapsedAtPause: 0, duration: 0 },
    { type: 'break', totalDuration: 300,  startedAt: null, completedAt: null, elapsedAtPause: 0, duration: 0 },
    { type: 'focus', totalDuration: 1500, startedAt: null, completedAt: null, elapsedAtPause: 0, duration: 0 },
  ];
}

const T0 = '2024-01-01T10:00:00.000Z';
const T1 = '2024-01-01T10:25:00.000Z';
const T2 = '2024-01-01T10:30:00.000Z';
const T3 = '2024-01-01T10:55:00.000Z';
const T0ms = new Date(T0).getTime();
const T1ms = new Date(T1).getTime();
const T2ms = new Date(T2).getTime();

// ── Section 1: Lifecycle transitions ─────────────────────────────────────────

describe('MOUNT', () => {
  it('transitions IDLE → LOADING and emits FETCH_ACTIVE_SESSION', () => {
    const { state, effects } = transition(INITIAL_STATE, { type: EVENTS.MOUNT });
    expect(state.phase).toBe(PHASES.LOADING);
    expect(effects).toContainEqual({ type: EFFECTS.FETCH_ACTIVE_SESSION });
  });

  it('is a no-op if already LOADING', () => {
    const loading = { ...INITIAL_STATE, phase: PHASES.LOADING };
    const { state, effects } = transition(loading, { type: EVENTS.MOUNT });
    expect(state.phase).toBe(PHASES.LOADING);
    expect(effects).toHaveLength(0);
  });
});

describe('SESSION_LOADED', () => {
  it('transitions LOADING → PAUSED with backend session data', () => {
    const loading = { ...INITIAL_STATE, phase: PHASES.LOADING };
    const session = {
      sessionId:      'abc',
      title:          'Test Session',
      plannedDuration: 1500,
      sessionSegments: [
        { type: 'focus', totalDuration: 1500, startedAt: null, completedAt: null, duration: 0 },
      ],
      taskIds:      ['t1'],
      sessionType:  'task',
      todos:        [],
      pauseEvents:  [],
      scheduleBlockId: null,
    };
    const { state, effects } = transition(loading, { type: EVENTS.SESSION_LOADED, payload: { session } });
    expect(state.phase).toBe(PHASES.PAUSED);
    expect(state.sessionId).toBe('abc');
    expect(state.backendCreated).toBe(true);
    expect(effects).toHaveLength(0);
  });

  it('sets isScheduled true when scheduleBlockId is present', () => {
    const loading = { ...INITIAL_STATE, phase: PHASES.LOADING };
    const session = {
      sessionId: 'x', title: 'X', plannedDuration: 1500,
      sessionSegments: [{ type: 'focus', totalDuration: 1500, startedAt: null, completedAt: null, duration: 0 }],
      scheduleBlockId: 'block_1',
      taskIds: [], sessionType: 'task', todos: [], pauseEvents: [],
    };
    const { state } = transition(loading, { type: EVENTS.SESSION_LOADED, payload: { session } });
    expect(state.isScheduled).toBe(true);
    expect(state.scheduleBlockId).toBe('block_1');
  });
});

describe('NO_SESSION', () => {
  it('stays IDLE and populates context from entry point', () => {
    const loading = { ...INITIAL_STATE, phase: PHASES.LOADING };
    const context = {
      taskIds:         ['t1'],
      scheduleBlockId: null,
      title:           'My Task',
      source:          'today',
      plannedDuration: 3000,
    };
    const { state, effects } = transition(loading, { type: EVENTS.NO_SESSION, payload: { context } });
    expect(state.phase).toBe(PHASES.IDLE);
    expect(state.sessionTitle).toBe('My Task');
    expect(state.source).toBe('today');
    expect(state.plannedDuration).toBe(3000);
    expect(effects).toHaveLength(0);
  });
});

describe('LOAD_FAILED', () => {
  it('falls back to IDLE', () => {
    const loading = { ...INITIAL_STATE, phase: PHASES.LOADING };
    const { state } = transition(loading, { type: EVENTS.LOAD_FAILED });
    expect(state.phase).toBe(PHASES.IDLE);
  });
});

// ── Section 2: START ──────────────────────────────────────────────────────────

describe('START from IDLE', () => {
  it('transitions to RUNNING and emits POST_SESSION + START_TIMER for new session', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.IDLE, segments: singleSegment() };
    const { state: next, effects } = transition(state, {
      type: EVENTS.START, payload: { startedAtIso: T0 },
    });
    expect(next.phase).toBe(PHASES.RUNNING);
    expect(effects.map(e => e.type)).toContain(EFFECTS.POST_SESSION);
    expect(effects.map(e => e.type)).toContain(EFFECTS.START_TIMER);
  });

  it('does NOT emit POST_SESSION when backendCreated is true', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.IDLE, backendCreated: true, segments: singleSegment() };
    const { effects } = transition(state, { type: EVENTS.START, payload: { startedAtIso: T0 } });
    expect(effects.map(e => e.type)).not.toContain(EFFECTS.POST_SESSION);
    expect(effects.map(e => e.type)).toContain(EFFECTS.START_TIMER);
  });

  it('sets startedAt on the current segment', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.IDLE, segments: singleSegment() };
    const { state: next } = transition(state, { type: EVENTS.START, payload: { startedAtIso: T0 } });
    expect(next.segments[0].startedAt).toBe(T0);
  });

  it('does not overwrite an existing startedAt', () => {
    const segs = [{ ...singleSegment()[0], startedAt: T0 }];
    const state = { ...INITIAL_STATE, phase: PHASES.IDLE, backendCreated: true, segments: segs };
    const { state: next } = transition(state, { type: EVENTS.START, payload: { startedAtIso: T1 } });
    expect(next.segments[0].startedAt).toBe(T0);  // not overwritten
  });
});

describe('START from READY', () => {
  it('transitions READY → RUNNING', () => {
    const state = {
      ...INITIAL_STATE,
      phase: PHASES.READY,
      backendCreated: true,
      segments: threeSegments(),
      segmentIndex: 1,  // break
    };
    const { state: next } = transition(state, { type: EVENTS.START, payload: { startedAtIso: T1 } });
    expect(next.phase).toBe(PHASES.RUNNING);
  });

  it('is a no-op from RUNNING', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.RUNNING };
    const { state: next, effects } = transition(state, { type: EVENTS.START, payload: {} });
    expect(next.phase).toBe(PHASES.RUNNING);
    expect(effects).toHaveLength(0);
  });
});

// ── Section 3: PAUSE ──────────────────────────────────────────────────────────

describe('PAUSE', () => {
  it('transitions RUNNING → PAUSED and emits STOP_TIMER + PATCH_PAUSE', () => {
    const state = {
      ...INITIAL_STATE,
      phase: PHASES.RUNNING,
      segments: singleSegment(),
      segmentIndex: 0,
    };
    const { state: next, effects } = transition(state, {
      type: EVENTS.PAUSE, payload: { pausedAtMs: T0ms, elapsedSeconds: 300 },
    });
    expect(next.phase).toBe(PHASES.PAUSED);
    expect(next.pauseStartedAt).toBe(T0ms);
    expect(next.sessionStats.pauseCount).toBe(1);
    expect(next.segments[0].elapsedAtPause).toBe(300);
    expect(effects.map(e => e.type)).toContain(EFFECTS.STOP_TIMER);
    expect(effects.map(e => e.type)).toContain(EFFECTS.PATCH_PAUSE);
  });

  it('does NOT clear startedAt (new pause model)', () => {
    const segs = [{ ...singleSegment()[0], startedAt: T0 }];
    const state = { ...INITIAL_STATE, phase: PHASES.RUNNING, segments: segs };
    const { state: next } = transition(state, {
      type: EVENTS.PAUSE, payload: { pausedAtMs: T1ms, elapsedSeconds: 400 },
    });
    // startedAt must remain — it is the wall-clock anchor for recovery
    expect(next.segments[0].startedAt).toBe(T0);
  });

  it('is a no-op from PAUSED', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.PAUSED };
    const { state: next, effects } = transition(state, {
      type: EVENTS.PAUSE, payload: { pausedAtMs: T0ms, elapsedSeconds: 0 },
    });
    expect(next.phase).toBe(PHASES.PAUSED);
    expect(effects).toHaveLength(0);
  });
});

// ── Section 4: RESUME ─────────────────────────────────────────────────────────

describe('RESUME', () => {
  it('transitions PAUSED → RUNNING and emits START_TIMER + PATCH_RESUME', () => {
    const pauseEvent = { id: 'p1', startTime: new Date(T1ms).toISOString(), endTime: null, duration: 0 };
    const state = {
      ...INITIAL_STATE,
      phase: PHASES.PAUSED,
      segments: singleSegment(),
      pauseStartedAt: T1ms,
      pauseEvents: [pauseEvent],
    };
    const { state: next, effects } = transition(state, {
      type: EVENTS.RESUME, payload: { resumedAtMs: T2ms },
    });
    expect(next.phase).toBe(PHASES.RUNNING);
    expect(next.pauseStartedAt).toBeNull();
    const closedPause = next.pauseEvents[0];
    expect(closedPause.endTime).toBe(new Date(T2ms).toISOString());
    expect(closedPause.duration).toBe(Math.floor((T2ms - T1ms) / 1000));
    expect(effects.map(e => e.type)).toContain(EFFECTS.START_TIMER);
    expect(effects.map(e => e.type)).toContain(EFFECTS.PATCH_RESUME);
  });

  it('is a no-op from RUNNING', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.RUNNING };
    const { state: next, effects } = transition(state, {
      type: EVENTS.RESUME, payload: { resumedAtMs: T2ms },
    });
    expect(next.phase).toBe(PHASES.RUNNING);
    expect(effects).toHaveLength(0);
  });
});

// ── Section 5: SEGMENT_COMPLETE ───────────────────────────────────────────────

describe('SEGMENT_COMPLETE (non-final)', () => {
  it('transitions RUNNING → READY, advances segmentIndex', () => {
    const state = {
      ...INITIAL_STATE,
      phase: PHASES.RUNNING,
      segments: threeSegments(),
      segmentIndex: 0,
      backendCreated: true,
    };
    const { state: next, effects } = transition(state, {
      type: EVENTS.SEGMENT_COMPLETE, payload: { completedAtIso: T1 },
    });
    expect(next.phase).toBe(PHASES.READY);
    expect(next.segmentIndex).toBe(1);
    expect(next.segments[0].completedAt).toBe(T1);
    expect(next.sessionStats.focusSegmentsCompleted).toBe(1);
    expect(effects.map(e => e.type)).toContain(EFFECTS.STOP_TIMER);
    expect(effects.map(e => e.type)).toContain(EFFECTS.PATCH_SEGMENT_COMPLETE);
  });
});

describe('SEGMENT_COMPLETE (final)', () => {
  it('transitions RUNNING → COMPLETING and emits PATCH_COMPLETE', () => {
    const segs = [
      { type: 'focus', totalDuration: 1500, startedAt: T0, completedAt: T1, elapsedAtPause: 1500, duration: 1500 },
      { type: 'break', totalDuration: 300,  startedAt: T1, completedAt: T2, elapsedAtPause: 300,  duration: 300 },
      { type: 'focus', totalDuration: 1500, startedAt: T2, completedAt: null, elapsedAtPause: 0, duration: 0 },
    ];
    const state = {
      ...INITIAL_STATE,
      phase: PHASES.RUNNING,
      segments: segs,
      segmentIndex: 2,  // last
      backendCreated: true,
    };
    const { state: next, effects } = transition(state, {
      type: EVENTS.SEGMENT_COMPLETE, payload: { completedAtIso: T3 },
    });
    expect(next.phase).toBe(PHASES.COMPLETING);
    expect(next.segments[2].completedAt).toBe(T3);
    expect(effects.map(e => e.type)).toContain(EFFECTS.PATCH_COMPLETE);
  });
});

describe('SEGMENT_COMPLETE idempotency guard', () => {
  it('is a no-op if segment already has completedAt', () => {
    const segs = [
      { type: 'focus', totalDuration: 1500, startedAt: T0, completedAt: T1, elapsedAtPause: 1500, duration: 1500 },
    ];
    const state = {
      ...INITIAL_STATE,
      phase: PHASES.RUNNING,
      segments: segs,
      segmentIndex: 0,
    };
    const { state: next, effects } = transition(state, {
      type: EVENTS.SEGMENT_COMPLETE, payload: { completedAtIso: T2 },
    });
    expect(next.phase).toBe(PHASES.RUNNING);  // no change
    expect(effects).toHaveLength(0);
  });
});

// ── Section 6: COMPLETING → COMPLETED ────────────────────────────────────────

describe('COMPLETE_CONFIRMED', () => {
  it('transitions COMPLETING → COMPLETED', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.COMPLETING };
    const { state: next, effects } = transition(state, { type: EVENTS.COMPLETE_CONFIRMED });
    expect(next.phase).toBe(PHASES.COMPLETED);
    expect(next.completionError).toBeNull();
    expect(effects).toHaveLength(0);
  });

  it('is a no-op if not COMPLETING', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.RUNNING };
    const { state: next } = transition(state, { type: EVENTS.COMPLETE_CONFIRMED });
    expect(next.phase).toBe(PHASES.RUNNING);
  });
});

describe('COMPLETE_FAILED', () => {
  it('stays COMPLETING and sets completionError', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.COMPLETING };
    const { state: next } = transition(state, {
      type: EVENTS.COMPLETE_FAILED, payload: { error: { message: 'Network error' } },
    });
    expect(next.phase).toBe(PHASES.COMPLETING);
    expect(next.completionError).toBe('Network error');
  });
});

// ── Section 7: SKIP_BREAK ─────────────────────────────────────────────────────

describe('SKIP_BREAK', () => {
  it('advances past break when READY', () => {
    const segs = [
      { type: 'focus', totalDuration: 1500, completedAt: T1, startedAt: T0, elapsedAtPause: 1500, duration: 1500 },
      { type: 'break', totalDuration: 300,  completedAt: null, startedAt: null, elapsedAtPause: 0, duration: 0 },
      { type: 'focus', totalDuration: 1500, completedAt: null, startedAt: null, elapsedAtPause: 0, duration: 0 },
    ];
    const state = {
      ...INITIAL_STATE,
      phase: PHASES.READY,
      segments: segs,
      segmentIndex: 1,  // at break
    };
    const { state: next } = transition(state, {
      type: EVENTS.SKIP_BREAK, payload: { skippedAtIso: T2 },
    });
    expect(next.phase).toBe(PHASES.READY);
    expect(next.segmentIndex).toBe(2);
    expect(next.segments[1].completedAt).toBe(T2);
  });

  it('is a no-op from RUNNING', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.RUNNING };
    const { state: next } = transition(state, {
      type: EVENTS.SKIP_BREAK, payload: { skippedAtIso: T2 },
    });
    expect(next.phase).toBe(PHASES.RUNNING);
  });
});

// ── Section 8: STOP / RESET ───────────────────────────────────────────────────

describe('STOP', () => {
  it('resets to INITIAL_STATE from any phase', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.RUNNING, sessionId: 'abc' };
    const { state: next, effects } = transition(state, { type: EVENTS.STOP });
    expect(next.phase).toBe(PHASES.IDLE);
    expect(next.sessionId).toBeNull();
    expect(effects.map(e => e.type)).toContain(EFFECTS.STOP_TIMER);
  });
});

// ── Section 9: SET_TITLE / SET_TODOS ─────────────────────────────────────────

describe('SET_TITLE', () => {
  it('updates sessionTitle; emits PATCH_TITLE when backendCreated', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.RUNNING, backendCreated: true };
    const { state: next, effects } = transition(state, {
      type: EVENTS.SET_TITLE, payload: { title: 'New Name' },
    });
    expect(next.sessionTitle).toBe('New Name');
    expect(effects.map(e => e.type)).toContain(EFFECTS.PATCH_TITLE);
  });

  it('does NOT emit PATCH_TITLE when backendCreated is false', () => {
    const state = { ...INITIAL_STATE, backendCreated: false };
    const { effects } = transition(state, { type: EVENTS.SET_TITLE, payload: { title: 'X' } });
    expect(effects).toHaveLength(0);
  });
});

// ── Section 10: SAVE_STATUS ───────────────────────────────────────────────────

describe('SAVE_STATUS', () => {
  it('updates saveStatus field only', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.RUNNING };
    const { state: next, effects } = transition(state, {
      type: EVENTS.SAVE_STATUS, payload: { status: 'saving' },
    });
    expect(next.saveStatus).toBe('saving');
    expect(next.phase).toBe(PHASES.RUNNING);
    expect(effects).toHaveLength(0);
  });
});

// ── Section 11: ScheduleBlock integration ─────────────────────────────────────

describe('ScheduleBlock session load', () => {
  it('sets isScheduled and scheduleBlockId from backend session', () => {
    const loading = { ...INITIAL_STATE, phase: PHASES.LOADING };
    const session = {
      sessionId: 's1', title: 'Scheduled', plannedDuration: 3600,
      sessionSegments: [{ type: 'focus', totalDuration: 3600, startedAt: null, completedAt: null, duration: 0 }],
      scheduleBlockId: { _id: 'block_001', taskId: 't1' },
      taskIds: ['t1'], sessionType: 'task', todos: [], pauseEvents: [],
    };
    const { state } = transition(loading, { type: EVENTS.SESSION_LOADED, payload: { session } });
    expect(state.isScheduled).toBe(true);
    expect(state.plannedDuration).toBe(3600);
  });
});

// ── Section 12: Unscheduled session ──────────────────────────────────────────

describe('Unscheduled session', () => {
  it('sets isScheduled false when scheduleBlockId is null', () => {
    const loading = { ...INITIAL_STATE, phase: PHASES.LOADING };
    const session = {
      sessionId: 's2', title: 'Quick', plannedDuration: 1500,
      sessionSegments: [{ type: 'focus', totalDuration: 1500, startedAt: null, completedAt: null, duration: 0 }],
      scheduleBlockId: null,
      taskIds: [], sessionType: 'quick', todos: [], pauseEvents: [],
    };
    const { state } = transition(loading, { type: EVENTS.SESSION_LOADED, payload: { session } });
    expect(state.isScheduled).toBe(false);
  });
});

// ── Section 13: Duplicate completion guard ────────────────────────────────────

describe('Duplicate completion prevention', () => {
  it('COMPLETE_CONFIRMED is a no-op if already COMPLETED', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.COMPLETED };
    const { state: next, effects } = transition(state, { type: EVENTS.COMPLETE_CONFIRMED });
    expect(next.phase).toBe(PHASES.COMPLETED);
    expect(effects).toHaveLength(0);
  });
});

// ── Section 14: Recovery state ────────────────────────────────────────────────

describe('SESSION_LOADED recovery', () => {
  it('finds the current incomplete segment for recovery', () => {
    const loading = { ...INITIAL_STATE, phase: PHASES.LOADING };
    const session = {
      sessionId: 'rec1', title: 'Recover', plannedDuration: 3300,
      sessionSegments: [
        { type: 'focus', totalDuration: 1500, startedAt: T0, completedAt: T1, duration: 1500 },
        { type: 'break', totalDuration: 300,  startedAt: T1, completedAt: T2, duration: 300 },
        { type: 'focus', totalDuration: 1500, startedAt: null, completedAt: null, duration: 400 },
      ],
      scheduleBlockId: null,
      taskIds: [], sessionType: 'quick', todos: [], pauseEvents: [],
    };
    const { state } = transition(loading, { type: EVENTS.SESSION_LOADED, payload: { session } });
    expect(state.segmentIndex).toBe(2);      // points to incomplete segment
    expect(state.phase).toBe(PHASES.PAUSED); // always paused on restore
  });
});

// ── Section 15: SESSION_CREATED callback ─────────────────────────────────────

describe('SESSION_CREATED', () => {
  it('sets backendCreated to true and updates sessionId', () => {
    const state = { ...INITIAL_STATE, phase: PHASES.RUNNING, sessionId: null };
    const { state: next } = transition(state, {
      type: EVENTS.SESSION_CREATED, payload: { sessionId: 'new_sid' },
    });
    expect(next.backendCreated).toBe(true);
    expect(next.sessionId).toBe('new_sid');
  });
});
