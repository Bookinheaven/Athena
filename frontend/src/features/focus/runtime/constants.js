/**
 * Lifecycle phases of a Focus session.
 *
 * IDLE       – No session context. User has not started anything.
 * LOADING    – Checking backend for an active session.
 * READY      – Session loaded or segment complete; timer not running.
 *              Used as a staging state before START (e.g. before break or
 *              after segment complete while autoStartBreaks is false).
 * RUNNING    – Timer active. Current segment is in progress.
 * PAUSED     – Timer stopped by user.
 * COMPLETING – Final segment reached zero. Awaiting backend confirmation.
 * COMPLETED  – Backend confirmed completion. Review is available.
 */
export const PHASES = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETING: 'completing',
  COMPLETED: 'completed',
});

/**
 * Events that the runtime accepts.
 *
 * Each event is dispatched by the UI or by the effect executor.
 * The pure reducer handles every event deterministically.
 */
export const EVENTS = Object.freeze({
  // Lifecycle bootstrap
  MOUNT: 'MOUNT',
  SESSION_LOADED: 'SESSION_LOADED',   // backend returned an active session
  NO_SESSION: 'NO_SESSION',       // no active backend session found
  LOAD_FAILED: 'LOAD_FAILED',      // fetch threw

  // User actions
  START: 'START',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  SKIP_BREAK: 'SKIP_BREAK',
  STOP: 'STOP',
  DISCARD: 'DISCARD',
  RESET: 'RESET',

  // Internal — emitted by timer/effect layer, not by UI directly
  SEGMENT_COMPLETE: 'SEGMENT_COMPLETE',

  // Backend responses for completion flow
  COMPLETE_CONFIRMED: 'COMPLETE_CONFIRMED',
  COMPLETE_FAILED: 'COMPLETE_FAILED',

  // Data mutations (debounced persistence side-effects)
  SET_TITLE: 'SET_TITLE',
  SET_TODOS: 'SET_TODOS',

  // Internal — save status feedback loop
  SAVE_STATUS: 'SAVE_STATUS',

  // Internal — after POST_SESSION resolves
  SESSION_CREATED: 'SESSION_CREATED',
});

/**
 * Effect descriptors returned by the pure transition function.
 *
 * Effects are plain objects { type, payload? }.
 * The useFocusRuntime hook executes them; the reducer never does.
 */
export const EFFECTS = Object.freeze({
  // Network
  FETCH_ACTIVE_SESSION: 'FETCH_ACTIVE_SESSION',
  POST_SESSION: 'POST_SESSION',
  PATCH_PAUSE: 'PATCH_PAUSE',
  PATCH_RESUME: 'PATCH_RESUME',
  PATCH_SEGMENT_COMPLETE: 'PATCH_SEGMENT_COMPLETE',
  PATCH_COMPLETE: 'PATCH_COMPLETE',
  PATCH_ABANDON: 'PATCH_ABANDON',
  PATCH_TITLE: 'PATCH_TITLE',
  PATCH_TODOS: 'PATCH_TODOS',
  PATCH_PROGRESS: 'PATCH_PROGRESS',

  // Timer control (handled by useFocusRuntime, not by WallClockTimer directly)
  START_TIMER: 'START_TIMER',
  STOP_TIMER: 'STOP_TIMER',
  RESET_TIMER: 'RESET_TIMER',

  // UI signals
  PLAY_SOUND: 'PLAY_SOUND',
});
