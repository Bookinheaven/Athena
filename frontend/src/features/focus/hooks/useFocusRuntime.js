import { useReducer, useRef, useCallback, useEffect } from 'react';
import { PHASES, EVENTS, EFFECTS } from '../runtime/constants.js';
import { transition, INITIAL_STATE } from '../runtime/focusReducer.js';
import { WallClockTimer } from '../runtime/timerClock.js';
import { PersistenceQueue } from '../runtime/persistenceQueue.js';
import { createSegments, recoverElapsed } from '../runtime/segmentUtils.js';
import sessionService from '../../../../services/sessionService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 
 * @param {Array} effectsAccumRef - Mutable array ref to accumulate effects
 * @returns {function} Reducer wrapper function: (state, event) => nextState
 */
function makeReducer(effectsAccumRef) {
  return function reducerWrapper(state, event) {
    const { state: nextState, effects } = transition(state, event);
    // Accumulate effects without touching React state
    if (effects.length > 0) {
      effectsAccumRef.current.push(...effects);
    }
    return nextState;
  };
}

// Hooks

/**
 * @param {object} opts
 * @param {object}   opts.context Navigation context from React Router location.state
 * @param {object}   opts.settings Current session settings (breakDuration etc.)
 * @param {function} opts.onSoundEvent Called with { event, segType } for audio
 * @param {string}   opts.userId Required for log/debug; not used for scoping here
 */
export function useFocusRuntime({ context = {}, settings = {}, onSoundEvent, userId } = {}) {
  const effectsAccumRef = useRef([]);

  const [runtimeState, rawDispatch] = useReducer(
    makeReducer(effectsAccumRef),
    INITIAL_STATE,
  );

  // Stable refs
  const timerRef = useRef(null);   // WallClockTimer instance
  const completionRef = useRef(null);   // clearTimeout handle for segment boundary
  const queueRef = useRef(null);   // PersistenceQueue instance
  const settingsRef = useRef(settings);
  const contextRef = useRef(context);
  const onSoundRef = useRef(onSoundEvent);
  const runtimeStateRef = useRef(runtimeState);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { contextRef.current = context; }, [context]);
  useEffect(() => { onSoundRef.current = onSoundEvent; }, [onSoundEvent]);
  useEffect(() => { runtimeStateRef.current = runtimeState; }, [runtimeState]);

  // dispatch (public - wraps rawDispatch with timestamp injection) 
  const dispatch = useCallback((event) => {
    rawDispatch(event);
  }, [rawDispatch]);

  // Save function 

  /**
   * Build PATCH payloads for each write type and call sessionService.
   */
  const save = useCallback(async (type, payload) => {
    const state = runtimeStateRef.current;
    const targetSessionId = payload?.sessionId || state.sessionId;
    if (!targetSessionId) return;

    const base = { sessionId: targetSessionId };

    switch (type) {
      case 'pause':
        await sessionService.updateProgress({
          ...base,
          segment: {
            segmentIndex: state.segmentIndex,
            duration: payload.elapsedSeconds,
          },
          pauseEvents: state.pauseEvents,
        });
        break;

      case 'resume':
        await sessionService.updateProgress({
          ...base,
          pauseEvents: payload.pauseEvents,
        });
        break;

      case 'segment_complete':
        await sessionService.updateProgress({
          ...base,
          segment: {
            segmentIndex: payload.segmentIndex,
            completedAt: new Date(),
          },
        });
        break;

      case 'complete':
        await sessionService.updateProgress({
          ...base,
          status: 'completed',
          duration: state.segments.reduce((s, seg) => s + (seg.duration || 0), 0),
          sessionStats: payload?.sessionStats || state.sessionStats,
          pauseEvents: state.pauseEvents,
        });
        break;

      case 'progress':
        await sessionService.checkpointProgress({
          sessionId: targetSessionId,
          checkpointRevision: payload?.checkpointRevision,
          duration: payload?.duration,
          totalFocusMinutes: payload?.totalFocusMinutes,
          totalBreakMinutes: payload?.totalBreakMinutes,
          sessionSegments: payload?.sessionSegments,
          pauseEvents: payload?.pauseEvents,
          sessionStats: payload?.sessionStats,
        });
        break;

      case 'title':
        await sessionService.updateProgress({ ...base, title: payload.title });
        break;

      case 'todos':
        await sessionService.updateProgress({ ...base, todos: payload.todos });
        break;

      case 'abandon':
        await sessionService.updateProgress({
          ...base,
          status: 'abandoned',
          segment: payload?.segmentIndex !== undefined ? {
            segmentIndex: payload.segmentIndex,
            duration: payload.elapsedSeconds,
          } : undefined,
          sessionStats: payload?.sessionStats || state.sessionStats,
        });
        break;

      default:
        break;
    }
  }, []);

  // Initialise the PersistenceQueue 
  useEffect(() => {
    queueRef.current = new PersistenceQueue(save, (status) => {
      dispatch({ type: EVENTS.SAVE_STATUS, payload: { status } });
    });
    return () => {
      queueRef.current?.flush();
    };
  }, [save, dispatch]);

  // Timer helpers 
  const clearCompletionTimeout = useCallback(() => {
    if (completionRef.current != null) {
      clearTimeout(completionRef.current);
      completionRef.current = null;
    }
  }, []);

  /**
   * Check whether the active segment has elapsed its planned duration.
   * Prevents relying exclusively on setTimeout in background/throttled scenarios.
   */
  const checkSegmentCompletion = useCallback(() => {
    const current = runtimeStateRef.current;
    if (current.phase !== PHASES.RUNNING) return;
    const seg = current.segments[current.segmentIndex];
    if (!seg || seg.completedAt) return;

    const timer = timerRef.current;
    if (!timer) return;
    const elapsed = timer.getElapsedSeconds();
    if (elapsed >= seg.totalDuration) {
      clearCompletionTimeout();
      dispatch({
        type: EVENTS.SEGMENT_COMPLETE,
        payload: { completedAtIso: new Date().toISOString() },
      });
    }
  }, [clearCompletionTimeout, dispatch]);

  /**
   * Schedule a single wall-clock setTimeout that fires when the segment should complete. (replaces the RAF-based timeLeft check).
   *
   * @param {number} segmentIndex
   */
  const scheduleSegmentCompletion = useCallback((segmentIndex) => {
    clearCompletionTimeout();

    const state = runtimeStateRef.current;
    const seg = state.segments[segmentIndex];
    if (!seg || seg.completedAt) return;

    const elapsed = timerRef.current ? timerRef.current.getElapsedSeconds() : recoverElapsed(seg);
    const remaining = Math.max(0, seg.totalDuration - elapsed);

    if (remaining <= 0) {
      dispatch({
        type: EVENTS.SEGMENT_COMPLETE,
        payload: { completedAtIso: new Date().toISOString() },
      });
      return;
    }

    completionRef.current = setTimeout(() => {
      // Check guard again in case something changed (STOP, RESET)
      const current = runtimeStateRef.current;
      if (current.phase !== PHASES.RUNNING) return;
      if (current.segmentIndex !== segmentIndex) return;

      dispatch({
        type: EVENTS.SEGMENT_COMPLETE,
        payload: { completedAtIso: new Date().toISOString() },
      });
    }, remaining * 1000);
  }, [clearCompletionTimeout, dispatch]);

  useEffect(() => {
    return () => {
      clearCompletionTimeout();
    };
  }, [clearCompletionTimeout]);

  const startTimer = useCallback((segmentIndex) => {
    const state = runtimeStateRef.current;
    const seg = state.segments[segmentIndex];
    if (!seg) return;

    const elapsedMs = (seg.elapsedAtPause || 0) * 1000;

    if (!timerRef.current) {
      timerRef.current = new WallClockTimer(elapsedMs);
    } else {
      timerRef.current.syncTo(elapsedMs);
    }
    timerRef.current.start();
    scheduleSegmentCompletion(segmentIndex);
  }, [scheduleSegmentCompletion]);

  const stopTimer = useCallback(() => {
    timerRef.current?.pause();
    clearCompletionTimeout();
  }, [clearCompletionTimeout]);

  const resetTimer = useCallback(() => {
    timerRef.current?.reset();
    clearCompletionTimeout();
    timerRef.current = null;
  }, [clearCompletionTimeout]);

  // Effect executor

  /**
   * After every state change, drain any accumulated effects.
   * Effects are plain objects { type, payload? }.
   */
  useEffect(() => {
    const pending = effectsAccumRef.current.splice(0);
    if (!pending.length) return;

    for (const effect of pending) {
      executeEffect(effect);
    }
  }); // no dependency array - runs after every render (cheap: splice is O(n) on small arrays)

  function executeEffect(effect) {
    const { type, payload = {} } = effect;

    switch (type) {

      case EFFECTS.FETCH_ACTIVE_SESSION: {
        sessionService.getActiveSession()
          .then((session) => {
            // Guard: If runtime is already running, paused, or completing, ignore late bootstrap
            const currentPhase = runtimeStateRef.current.phase;
            if (
              currentPhase === PHASES.RUNNING ||
              currentPhase === PHASES.PAUSED ||
              currentPhase === PHASES.COMPLETING
            ) {
              return;
            }

            const hasExplicitNewTask = Boolean(
              contextRef.current?.source &&
              (contextRef.current?.title || contextRef.current?.taskIds?.length)
            );

            if (session?.status === 'active' && !hasExplicitNewTask) {
              dispatch({ type: EVENTS.SESSION_LOADED, payload: { session } });
            } else {
              dispatch({
                type: EVENTS.NO_SESSION,
                payload: {
                  context: contextRef.current,
                  existingSessionToAbandon: session?.status === 'active' && hasExplicitNewTask ? session : null,
                },
              });
            }
          })
          .catch((err) => {
            console.error('[useFocusRuntime] Failed to fetch active session:', err);
            const currentPhase = runtimeStateRef.current.phase;
            if (
              currentPhase === PHASES.RUNNING ||
              currentPhase === PHASES.PAUSED ||
              currentPhase === PHASES.COMPLETING
            ) {
              return;
            }
            dispatch({
              type: EVENTS.NO_SESSION,
              payload: { context: contextRef.current },
            });
          });
        break;
      }

      case EFFECTS.POST_SESSION: {
        const state = runtimeStateRef.current;
        const settings = settingsRef.current;
        const ctx = contextRef.current;

        // Build the start payload
        const startPayload = {
          sessionId: state.sessionId || uuidv4(),
          title: state.sessionTitle,
          plannedDuration: state.plannedDuration,
          sessionType: state.sessionType,
          taskIds: state.taskIds || [],
          sessionSegments: state.segments,
          totalBreakMinutes:
            state.segments.filter((s) => s.type === 'break').length,
          totalFocusMinutes:
            state.segments.filter((s) => s.type === 'focus').length,
          pauseEvents: [],
        };

        if (state.scheduleBlockId) {
          startPayload.scheduleBlockId = state.scheduleBlockId;
        }

        sessionService.startSession(startPayload)
          .then(() => {
            dispatch({
              type: EVENTS.SESSION_CREATED,
              payload: { sessionId: startPayload.sessionId },
            });
            triggerCheckpoint();
          })
          .catch((err) => {
            console.error('[useFocusRuntime] Session creation failed:', err);
            // Continue locally — session is already RUNNING in state
          });
        break;
      }

      case EFFECTS.START_TIMER:
        startTimer(payload.segmentIndex ?? runtimeStateRef.current.segmentIndex);
        break;

      case EFFECTS.STOP_TIMER:
        stopTimer();
        break;

      case EFFECTS.RESET_TIMER:
        resetTimer();
        break;

      case EFFECTS.PATCH_PAUSE:
        queueRef.current?.enqueue('pause', payload);
        triggerCheckpoint();
        break;

      case EFFECTS.PATCH_RESUME:
        queueRef.current?.enqueue('resume', payload);
        triggerCheckpoint();
        break;

      case EFFECTS.PATCH_SEGMENT_COMPLETE:
        queueRef.current?.enqueue('segment_complete', payload);
        triggerCheckpoint();
        break;

      case EFFECTS.PATCH_COMPLETE:
        queueRef.current?.enqueue('complete', payload);
        queueRef.current?.flush().then(() => {
          // After the write drains, confirm or fail
          const state = runtimeStateRef.current;
          if (state.phase === PHASES.COMPLETING) {
            dispatch({ type: EVENTS.COMPLETE_CONFIRMED });
          }
        }).catch((err) => {
          dispatch({
            type: EVENTS.COMPLETE_FAILED,
            payload: { error: err },
          });
        });
        break;

      case EFFECTS.PATCH_ABANDON:
        queueRef.current?.enqueue('abandon', payload);
        queueRef.current?.flush();
        break;

      case EFFECTS.PATCH_TITLE:
        queueRef.current?.enqueue('title', payload);
        break;

      case EFFECTS.PATCH_TODOS:
        queueRef.current?.enqueue('todos', payload);
        break;

      case EFFECTS.PATCH_PROGRESS:
        queueRef.current?.enqueue('progress', payload);
        break;

      case EFFECTS.PLAY_SOUND:
        onSoundRef.current?.(payload);
        break;

      default:
        break;
    }
  }

  // Active-session progress checkpointing (2-minute cadence + lifecycle)
  const CHECKPOINT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
  const checkpointRevisionRef = useRef(runtimeState.checkpointRevision || 0);
  const checkpointTimerRef = useRef(null);

  // Sync checkpoint revision counter whenever loaded/recovered from backend
  useEffect(() => {
    if (runtimeState.checkpointRevision !== undefined) {
      checkpointRevisionRef.current = Math.max(
        checkpointRevisionRef.current,
        runtimeState.checkpointRevision || 0
      );
    }
  }, [runtimeState.checkpointRevision]);

  const triggerCheckpoint = useCallback(() => {
    const state = runtimeStateRef.current;
    if (!state.sessionId || !state.backendCreated) return;
    if (state.phase !== PHASES.RUNNING && state.phase !== PHASES.PAUSED) return;

    checkpointRevisionRef.current += 1;
    const revision = checkpointRevisionRef.current;

    const currentElapsed = timerRef.current
      ? timerRef.current.getElapsedSeconds()
      : (state.segments[state.segmentIndex]?.elapsedAtPause || 0);

    const segments = (state.segments || []).map((seg, idx) => {
      let duration = seg.duration || 0;
      if (idx === state.segmentIndex) {
        duration = Math.max(duration, currentElapsed);
      }
      return {
        type: seg.type,
        totalDuration: seg.totalDuration,
        duration,
        startedAt: seg.startedAt,
        completedAt: seg.completedAt,
      };
    });

    const totalDuration = segments.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalFocusSeconds = segments
      .filter((s) => s.type === 'focus')
      .reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalBreakSeconds = segments
      .filter((s) => s.type === 'break')
      .reduce((sum, s) => sum + (s.duration || 0), 0);

    queueRef.current?.enqueue('progress', {
      sessionId: state.sessionId,
      checkpointRevision: revision,
      duration: totalDuration,
      totalFocusMinutes: Math.floor(totalFocusSeconds / 60),
      totalBreakMinutes: Math.floor(totalBreakSeconds / 60),
      sessionSegments: segments,
      pauseEvents: state.pauseEvents,
      sessionStats: state.sessionStats,
    });
  }, []);

  // 2-minute periodic checkpoint during RUNNING phase
  useEffect(() => {
    if (
      runtimeState.phase === PHASES.RUNNING &&
      runtimeState.sessionId &&
      runtimeState.backendCreated
    ) {
      checkpointTimerRef.current = setInterval(() => {
        triggerCheckpoint();
      }, CHECKPOINT_INTERVAL_MS);

      return () => {
        if (checkpointTimerRef.current) {
          clearInterval(checkpointTimerRef.current);
          checkpointTimerRef.current = null;
        }
      };
    } else {
      if (checkpointTimerRef.current) {
        clearInterval(checkpointTimerRef.current);
        checkpointTimerRef.current = null;
      }
    }
  }, [
    runtimeState.phase,
    runtimeState.sessionId,
    runtimeState.backendCreated,
    triggerCheckpoint,
  ]);

  // Lifecycle listeners: visibilitychange (hidden) and beforeunload / pagehide
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        const state = runtimeStateRef.current;
        if (state.phase === PHASES.RUNNING || state.phase === PHASES.PAUSED) {
          triggerCheckpoint();
          queueRef.current?.flush();
        }
      }
    };

    const handleBeforeUnload = () => {
      const state = runtimeStateRef.current;
      if (state.phase === PHASES.RUNNING || state.phase === PHASES.PAUSED) {
        triggerCheckpoint();
        queueRef.current?.flush();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
      }
    };
  }, [triggerCheckpoint]);

  // Auto-start READY segments
  // When phase transitions to READY:
  //  - If next segment is focus → auto-start
  //  - If next segment is break AND autoStartBreaks is true → auto-start
  //  - Otherwise → wait for user interaction
  useEffect(() => {
    if (runtimeState.phase !== PHASES.READY) return;

    const seg = runtimeState.segments[runtimeState.segmentIndex];
    if (!seg) return;

    const shouldAutoStart =
      seg.type === 'focus' || settingsRef.current.autoStartBreaks;

    if (shouldAutoStart) {
      dispatch({
        type: EVENTS.START,
        payload: { startedAtIso: new Date().toISOString() },
      });
    }
    // else: leave in READY, UI shows Break UI with manual start button
  }, [runtimeState.phase, runtimeState.segmentIndex, dispatch]);

  // MOUNT: bootstrap on first render
  useEffect(() => {
    dispatch({ type: EVENTS.MOUNT });
  }, []);

  // Source-based auto-start after NO_SESSION resolution
  // When an entry point (Today/Planner/Timeline) navigates to Focus with context
  // and there is no existing backend session, we want to auto-start immediately
  // (matching the current behaviour where Today/Planner pre-created the session).
  useEffect(() => {
    if (runtimeState.phase !== PHASES.IDLE) return;
    const src = runtimeState.source;
    if (!src || src === 'direct') return;

    // Build segments from current settings
    const s = settingsRef.current;
    const segs = createSegments(
      runtimeState.plannedDuration,
      s.breakDuration ?? 5 * 60,
      s.breaksNumber ?? 4,
    );

    dispatch({
      type: EVENTS.START,
      payload: {
        segments: segs,
        startedAtIso: new Date().toISOString(),
      },
    });
  }, [runtimeState.phase, runtimeState.source, dispatch]);

  // Immediate recalculation on visibility / focus resume
  useEffect(() => {
    const onResume = () => {
      if (document.visibilityState === 'visible') {
        checkSegmentCompletion();
      }
    };
    const onWindowFocus = () => {
      checkSegmentCompletion();
    };

    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', onWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [checkSegmentCompletion]);

  // Periodic completion check (safeguard against throttled setTimeout)
  useEffect(() => {
    if (runtimeState.phase !== PHASES.RUNNING) return;

    const interval = setInterval(() => {
      checkSegmentCompletion();
    }, 1000);

    return () => clearInterval(interval);
  }, [runtimeState.phase, checkSegmentCompletion]);

  // Public commands (typed, stable references)

  const commands = {
    start: useCallback((segments) => {
      const segs = segments || (() => {
        const s = settingsRef.current;
        return createSegments(
          runtimeState.plannedDuration,
          s.breakDuration ?? 5 * 60,
          s.breaksNumber ?? 4,
        );
      })();

      dispatch({
        type: EVENTS.START,
        payload: { segments: segs, startedAtIso: new Date().toISOString() },
      });
    }, [dispatch, runtimeState.plannedDuration]),

    pause: useCallback(() => {
      const elapsed = timerRef.current?.getElapsedSeconds() ?? 0;
      dispatch({
        type: EVENTS.PAUSE,
        payload: { pausedAtMs: Date.now(), elapsedSeconds: elapsed },
      });
    }, [dispatch]),

    resume: useCallback(() => {
      dispatch({
        type: EVENTS.RESUME,
        payload: { resumedAtMs: Date.now() },
      });
    }, [dispatch]),

    skipBreak: useCallback(() => {
      dispatch({
        type: EVENTS.SKIP_BREAK,
        payload: { skippedAtIso: new Date().toISOString() },
      });
    }, [dispatch]),

    stop: useCallback(() => {
      dispatch({ type: EVENTS.STOP });
    }, [dispatch]),

    discard: useCallback(() => {
      const elapsed = timerRef.current?.getElapsedSeconds() ?? 0;
      dispatch({
        type: EVENTS.DISCARD,
        payload: {
          elapsedSeconds: elapsed,
          segmentIndex: runtimeStateRef.current.segmentIndex,
        },
      });
    }, [dispatch]),

    reset: useCallback(() => {
      dispatch({ type: EVENTS.RESET });
    }, [dispatch]),

    setTitle: useCallback((title) => {
      dispatch({ type: EVENTS.SET_TITLE, payload: { title } });
    }, [dispatch]),

    setTodos: useCallback((todos) => {
      dispatch({ type: EVENTS.SET_TODOS, payload: { todos } });
    }, [dispatch]),

    retryComplete: useCallback(() => {
      if (runtimeStateRef.current.phase !== PHASES.COMPLETING) return;
      const state = runtimeStateRef.current;
      queueRef.current?.enqueue('complete', { sessionStats: state.sessionStats });
      queueRef.current?.flush().then(() => {
        dispatch({ type: EVENTS.COMPLETE_CONFIRMED });
      }).catch((err) => {
        dispatch({ type: EVENTS.COMPLETE_FAILED, payload: { error: err } });
      });
    }, [dispatch]),

    // Force-save (used for feedback write before new session)
    forceSave: useCallback(async () => {
      await queueRef.current?.flush();
    }, []),

    // Trigger an immediate progress checkpoint
    checkpoint: triggerCheckpoint,

    // Get current elapsed seconds from timer (for external reads)
    getElapsed: useCallback(() => {
      return timerRef.current?.getElapsedSeconds() ?? 0;
    }, []),

    // Start with navigation context from external pages (Today / Planner)
    startWithContext: useCallback((navCtx) => {
      if (!navCtx) return;
      const current = runtimeStateRef.current;
      if (
        current.phase === PHASES.RUNNING ||
        current.phase === PHASES.PAUSED ||
        current.phase === PHASES.COMPLETING
      ) {
        return;
      }
      contextRef.current = navCtx;
      dispatch({
        type: EVENTS.NO_SESSION,
        payload: { context: navCtx },
      });
    }, [dispatch]),
  };

  // Derived helpers
  const currentSegment = runtimeState.segments[runtimeState.segmentIndex] ?? null;

  return {
    // Full runtime state
    state: runtimeState,

    // Convenience flags / derived values
    phase: runtimeState.phase,
    sessionId: runtimeState.sessionId,
    sessionTitle: runtimeState.sessionTitle,
    isScheduled: runtimeState.isScheduled,
    segments: runtimeState.segments,
    segmentIndex: runtimeState.segmentIndex,
    currentSegment,
    todos: runtimeState.todos,
    saveStatus: runtimeState.saveStatus,
    completionError: runtimeState.completionError,
    sessionStats: runtimeState.sessionStats,
    isRunning: runtimeState.phase === PHASES.RUNNING,
    isPaused: runtimeState.phase === PHASES.PAUSED,
    isIdle: runtimeState.phase === PHASES.IDLE,
    isCompleted: runtimeState.phase === PHASES.COMPLETED,
    isCompleting: runtimeState.phase === PHASES.COMPLETING,

    // Timer ref (for display hook)
    timerRef,

    // Commands
    commands,
    dispatch,
  };
}
