
import { PHASES, EVENTS, EFFECTS } from './constants.js';
import {
  normaliseSegments,
  findCurrentSegmentIndex,
} from './segmentUtils.js';

/**
 * Focus Session Reducer  
 * 
 * This reducer is used by the focus session engine to manage the state of a focus session.
 * It is a pure function that takes the current state and an event, and returns the new state.
 */

export const INITIAL_STATE = {
  phase: PHASES.IDLE,

  // Session identity
  sessionId: null,
  sessionTitle: 'Untitled Work',
  isScheduled: false,
  scheduleBlockId: null,
  plannedDuration: 25 * 60,  // seconds
  taskIds: [],
  sessionType: 'quick',
  source: null, // ['today', 'planner', 'timeline', null]

  // Segments
  segments: [],
  segmentIndex: 0,

  // Pause tracking
  pauseStartedAt: null, // wall-clock ms — set on PAUSE, cleared on RESUME
  pauseEvents: [], // complete pause records

  // Stats
  sessionStats: {
    pauseCount: 0,
    totalPauseDuration: 0,
    focusSegmentsCompleted: 0,
    breakSegmentsCompleted: 0,
    interruptions: 0,
  },

  todos: [],
  backendCreated: false,
  checkpointRevision: 0,

  // UI feedback
  saveStatus: 'idle', // ['idle', 'saving', 'saved', 'error']
  completionError: null,
  completionType: null, // ['completed', 'abandoned', null]
};

// Helper Methods 

/** Mark segment at index i as started (only sets startedAt the first time). */
function markSegmentStarted(segments, index, startedAtIso) {
  return segments.map((seg, i) => {
    if (i !== index || seg.startedAt) return seg;
    return { ...seg, startedAt: startedAtIso };
  });
}

/** Mark segment at index i as complete. */
function markSegmentCompleted(segments, index, completedAtIso) {
  return segments.map((seg, i) => {
    if (i !== index) return seg;
    return {
      ...seg,
      completedAt: completedAtIso,
      elapsedAtPause: seg.totalDuration,
      duration: seg.totalDuration,
    };
  });
}

/** Snap segment elapsed-at-pause for the current index. */
function snapshotElapsed(segments, index, elapsedSeconds) {
  return segments.map((seg, i) => {
    if (i !== index) return seg;
    return {
      ...seg,
      elapsedAtPause: elapsedSeconds,
      duration: elapsedSeconds, // backend compat
    };
  });
}

/** Update sessionStats for a completed segment. */
function updateStatsForCompletion(stats, segType) {
  return {
    ...stats,
    focusSegmentsCompleted:
      segType === 'focus' ? stats.focusSegmentsCompleted + 1 : stats.focusSegmentsCompleted,
    breakSegmentsCompleted:
      segType === 'break' ? stats.breakSegmentsCompleted + 1 : stats.breakSegmentsCompleted,
  };
}

// Transition 

/**
 * Pure state transition function.
 *
 * @param {object}  state   – Current runtime state
 * @param {object}  event   – { type: EVENTS.*, payload?: object }
 * @returns {{ state: object, effects: object[] }}
 */
export function transition(state, event) {
  const { type, payload = {} } = event;

  switch (type) {
    // Bootstrap
    case EVENTS.MOUNT: {
      if (state.phase !== PHASES.IDLE) return noChange(state);
      return {
        state: { ...state, phase: PHASES.LOADING },
        effects: [{ type: EFFECTS.FETCH_ACTIVE_SESSION }],
      };
    }

    case EVENTS.SESSION_LOADED: {
      // payload: { session }
      // The backend session becomes the single source of truth.
      const { session } = payload;
      if (!session || session.status === 'completed' || session.status === 'abandoned' || session.status === 'skipped') {
        return {
          state: { ...INITIAL_STATE, phase: PHASES.IDLE },
          effects: [],
        };
      }

      const segments = normaliseSegments(session.sessionSegments || []);
      const allComplete = segments.length > 0 && segments.every((s) => s.completedAt);
      if (allComplete) {
        return {
          state: { ...INITIAL_STATE, phase: PHASES.IDLE },
          effects: [],
        };
      }

      const segmentIndex = findCurrentSegmentIndex(segments);

      return {
        state: {
          ...state,
          phase: PHASES.PAUSED,   // always load as paused (user must resume)
          sessionId: session.sessionId,
          sessionTitle: session.title || 'Untitled Work',
          isScheduled: !!session.scheduleBlockId,
          scheduleBlockId: session.scheduleBlockId || null,
          plannedDuration: session.plannedDuration || state.plannedDuration,
          segments,
          segmentIndex,
          taskIds: session.taskIds || [],
          sessionType: session.sessionType || 'quick',
          todos: (session.todos || []).map((t, idx) => ({
            ...t,
            id: t.id || t._id || `todo-${idx}`,
            _id: t._id || t.id || `todo-${idx}`,
          })),
          pauseEvents: session.pauseEvents || [],
          sessionStats: session.sessionStats
            ? { ...INITIAL_STATE.sessionStats, ...session.sessionStats }
            : state.sessionStats,
          backendCreated: true,
          checkpointRevision: session.checkpointRevision || 0,
          completionError: null,
          pauseStartedAt: null,
        },
        effects: [],
      };
    }

    case EVENTS.NO_SESSION: {
      const incomingContext = payload?.context || {};
      const isDifferentTask = Boolean(
        (incomingContext.title && incomingContext.title !== state.sessionTitle) ||
        (incomingContext.scheduleBlockId && incomingContext.scheduleBlockId !== state.scheduleBlockId) ||
        (incomingContext.taskIds?.length && JSON.stringify(incomingContext.taskIds) !== JSON.stringify(state.taskIds))
      );
      const hasExplicitNewTask = Boolean(
        incomingContext.source &&
        (incomingContext.title || incomingContext.taskIds?.length) &&
        isDifferentTask
      );

      // Guard: Never reset an in-flight RUNNING or COMPLETING session due to late async bootstrap
      if (state.phase === PHASES.RUNNING || state.phase === PHASES.COMPLETING) {
        return noChange(state);
      }

      // Guard: If PAUSED and there is NO explicit new task switch, preserve the paused session
      if (state.phase === PHASES.PAUSED && !hasExplicitNewTask) {
        return noChange(state);
      }

      // payload: { context } - navigation context from entry point
      // No active backend session. Prepare runtime from context.
      const {
        taskIds = [],
        scheduleBlockId = null,
        title = 'Untitled Work',
        source = null,
        plannedDuration = 25 * 60,
        sessionId = null,
      } = payload.context || {};

      const effects = [];
      const sessionToAbandon =
        payload?.existingSessionToAbandon?.sessionId ||
        (state.backendCreated ? state.sessionId : null);
      if (sessionToAbandon) {
        effects.push({
          type: EFFECTS.PATCH_ABANDON,
          payload: { sessionId: sessionToAbandon },
        });
      }
      if (state.phase === PHASES.RUNNING || state.phase === PHASES.PAUSED) {
        effects.push({ type: EFFECTS.STOP_TIMER });
      }

      return {
        state: {
          ...INITIAL_STATE,
          phase: PHASES.IDLE,
          sessionId,
          sessionTitle: title,
          isScheduled: !!scheduleBlockId,
          scheduleBlockId: scheduleBlockId || null,
          plannedDuration,
          taskIds,
          sessionType: taskIds.length > 0 ? 'task' : 'quick',
          source,
          backendCreated: false,
          segments: [],        // segments created by hook before START
          completionError: null,
          todos: [],
          pauseEvents: [],
          pauseStartedAt: null,
          sessionStats: { ...INITIAL_STATE.sessionStats },
          segmentIndex: 0,
        },
        effects,
      };
    }

    case EVENTS.LOAD_FAILED: {
      // Fall back to IDLE so the user can start a fresh session.
      return {
        state: { ...state, phase: PHASES.IDLE },
        effects: [],
      };
    }

    // Session created callback
    case EVENTS.SESSION_CREATED: {
      // payload: { sessionId? } - called by effect executor after POST resolves
      const sid = payload.sessionId || state.sessionId;
      return {
        state: { ...state, backendCreated: true, sessionId: sid },
        effects: [],
      };
    }

    // User controls
    case EVENTS.START: {
      // Allowed from IDLE or READY
      if (state.phase !== PHASES.IDLE && state.phase !== PHASES.READY) {
        return noChange(state);
      }

      // payload: { segments, startedAtIso }
      // The hook builds segments before dispatching if this is a new session.
      const { segments: newSegments, startedAtIso } = payload;
      const resolvedSegments = newSegments || state.segments;

      // Mark the current segment as started (idempotent — won't overwrite)
      const segments = markSegmentStarted(
        resolvedSegments,
        state.segmentIndex,
        startedAtIso,
      );

      const effects = [];
      if (!state.backendCreated) {
        effects.push({ type: EFFECTS.POST_SESSION });
      }
      effects.push({ type: EFFECTS.START_TIMER, payload: { segmentIndex: state.segmentIndex } });

      return {
        state: { ...state, phase: PHASES.RUNNING, segments },
        effects,
      };
    }

    case EVENTS.PAUSE: {
      if (state.phase !== PHASES.RUNNING) return noChange(state);

      // payload: { pausedAtMs, elapsedSeconds }
      const { pausedAtMs, elapsedSeconds } = payload;

      const pauseEvent = {
        id: `p_${pausedAtMs}`,
        startTime: new Date(pausedAtMs).toISOString(),
        endTime: null,
        duration: 0,
        reason: 'Manual Pause',
      };

      const segments = snapshotElapsed(
        state.segments,
        state.segmentIndex,
        elapsedSeconds,
      );

      return {
        state: {
          ...state,
          phase: PHASES.PAUSED,
          segments,
          pauseStartedAt: pausedAtMs,
          pauseEvents: [...state.pauseEvents, pauseEvent],
          sessionStats: {
            ...state.sessionStats,
            pauseCount: state.sessionStats.pauseCount + 1,
          },
        },
        effects: [
          { type: EFFECTS.STOP_TIMER },
          { type: EFFECTS.PATCH_PAUSE, payload: { elapsedSeconds, pausedAtMs } },
        ],
      };
    }

    case EVENTS.RESUME: {
      if (state.phase !== PHASES.PAUSED) return noChange(state);

      // payload: { resumedAtMs }
      const { resumedAtMs } = payload;

      // Close the most recent open pause event
      const pauseDuration = state.pauseStartedAt
        ? Math.floor((resumedAtMs - state.pauseStartedAt) / 1000)
        : 0;

      const pauseEvents = state.pauseEvents.map((pe, i) => {
        if (i !== state.pauseEvents.length - 1 || pe.endTime) return pe;
        return {
          ...pe,
          endTime: new Date(resumedAtMs).toISOString(),
          duration: pauseDuration,
        };
      });

      return {
        state: {
          ...state,
          phase: PHASES.RUNNING,
          pauseStartedAt: null,
          pauseEvents,
          sessionStats: {
            ...state.sessionStats,
            totalPauseDuration: state.sessionStats.totalPauseDuration + pauseDuration,
          },
        },
        effects: [
          { type: EFFECTS.START_TIMER, payload: { segmentIndex: state.segmentIndex } },
          { type: EFFECTS.PATCH_RESUME, payload: { pauseEvents, pauseDuration } },
        ],
      };
    }

    case EVENTS.SKIP_BREAK: {
      // Only allowed when READY and current segment is a break
      if (state.phase !== PHASES.READY) return noChange(state);
      const seg = state.segments[state.segmentIndex];
      if (!seg || seg.type !== 'break') return noChange(state);

      // payload: { skippedAtIso }
      const { skippedAtIso } = payload;

      const segments = markSegmentCompleted(state.segments, state.segmentIndex, skippedAtIso);
      const nextIndex = state.segmentIndex + 1;
      const isLast = nextIndex >= segments.length;

      if (isLast) {
        return {
          state: { ...state, phase: PHASES.COMPLETING, segments },
          effects: [{ type: EFFECTS.PATCH_COMPLETE }],
        };
      }

      return {
        state: {
          ...state,
          phase: PHASES.READY,
          segments,
          segmentIndex: nextIndex,
        },
        effects: [
          { type: EFFECTS.PATCH_SEGMENT_COMPLETE, payload: { segmentIndex: state.segmentIndex } },
        ],
      };
    }

    // Timer boundary
    case EVENTS.SEGMENT_COMPLETE: {
      // Guard: only fire from RUNNING, and only once per segment
      if (state.phase !== PHASES.RUNNING) return noChange(state);

      const currentSeg = state.segments[state.segmentIndex];
      if (!currentSeg || currentSeg.completedAt) return noChange(state); // idempotency guard

      // payload: { completedAtIso }
      const { completedAtIso } = payload;

      const segments = markSegmentCompleted(state.segments, state.segmentIndex, completedAtIso);
      const isLast = state.segmentIndex >= state.segments.length - 1;
      const sessionStats = updateStatsForCompletion(state.sessionStats, currentSeg.type);

      if (isLast) {
        // → COMPLETING: await backend confirmation before declaring done
        return {
          state: {
            ...state,
            phase: PHASES.COMPLETING,
            completionType: 'completed',
            segments,
            sessionStats,
          },
          effects: [
            { type: EFFECTS.STOP_TIMER },
            { type: EFFECTS.PATCH_SEGMENT_COMPLETE, payload: { segmentIndex: state.segmentIndex } },
            { type: EFFECTS.PATCH_COMPLETE, payload: { sessionStats } },
            { type: EFFECTS.PLAY_SOUND, payload: { event: 'session_complete' } },
          ],
        };
      }

      // Non-final: advance to next segment
      const nextIndex = state.segmentIndex + 1;

      return {
        state: {
          ...state,
          phase: PHASES.READY,
          segments,
          segmentIndex: nextIndex,
          sessionStats,
        },
        effects: [
          { type: EFFECTS.STOP_TIMER },
          { type: EFFECTS.PATCH_SEGMENT_COMPLETE, payload: { segmentIndex: state.segmentIndex } },
          { type: EFFECTS.PLAY_SOUND, payload: { event: 'segment_complete', segType: currentSeg.type } },
        ],
      };
    }

    // Completion responses
    case EVENTS.COMPLETE_CONFIRMED: {
      if (state.phase !== PHASES.COMPLETING) return noChange(state);
      return {
        state: { ...state, phase: PHASES.COMPLETED, completionError: null },
        effects: [],
      };
    }

    case EVENTS.COMPLETE_FAILED: {
      if (state.phase !== PHASES.COMPLETING) return noChange(state);
      const { error } = payload;
      return {
        state: { ...state, completionError: error?.message || 'Completion failed' },
        effects: [],
      };
    }

    // Stop / Discard / Reset
    case EVENTS.DISCARD: {
      if (state.phase !== PHASES.RUNNING && state.phase !== PHASES.PAUSED) {
        return noChange(state);
      }

      const { elapsedSeconds = 0 } = payload;
      const segments = snapshotElapsed(
        state.segments,
        state.segmentIndex,
        elapsedSeconds
      );

      const effects = [{ type: EFFECTS.STOP_TIMER }];

      if (state.sessionId && state.backendCreated) {
        effects.push({
          type: EFFECTS.PATCH_ABANDON,
          payload: {
            sessionId: state.sessionId,
            segmentIndex: state.segmentIndex,
            elapsedSeconds,
            sessionStats: state.sessionStats,
          },
        });
      }

      return {
        state: {
          ...state,
          phase: PHASES.COMPLETED,
          completionType: 'abandoned',
          segments,
        },
        effects,
      };
    }

    case EVENTS.STOP: {
      const effects = [{ type: EFFECTS.STOP_TIMER }];
      if (state.sessionId && state.backendCreated) {
        effects.push({
          type: EFFECTS.PATCH_ABANDON,
          payload: { sessionId: state.sessionId },
        });
      }
      return {
        state: { ...INITIAL_STATE },
        effects,
      };
    }

    case EVENTS.RESET: {
      const effects = [{ type: EFFECTS.RESET_TIMER }];
      if (state.sessionId && state.backendCreated) {
        effects.push({
          type: EFFECTS.PATCH_ABANDON,
          payload: { sessionId: state.sessionId },
        });
      }
      return {
        state: { ...INITIAL_STATE },
        effects,
      };
    }

    // Data mutations
    case EVENTS.SET_TITLE: {
      const { title } = payload;
      const effects = state.backendCreated
        ? [{ type: EFFECTS.PATCH_TITLE, payload: { title } }]
        : [];
      return {
        state: { ...state, sessionTitle: title },
        effects,
      };
    }

    case EVENTS.SET_TODOS: {
      const { todos } = payload;
      const effects = state.backendCreated
        ? [{ type: EFFECTS.PATCH_TODOS, payload: { todos } }]
        : [];
      return {
        state: { ...state, todos },
        effects,
      };
    }

    // Internal feedback
    case EVENTS.SAVE_STATUS: {
      const { status } = payload;
      return {
        state: { ...state, saveStatus: status },
        effects: [],
      };
    }

    default:
      return noChange(state);
  }
}

// Utility 
function noChange(state) {
  return { state, effects: [] };
}
