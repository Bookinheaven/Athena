import { eq, and, or, desc, asc, sql, inArray, gte, lte, lt } from "drizzle-orm";
import { productDateToStart, productDateToEnd, normalizeTimezone } from "../utils/dateUtils.js";
import { getDrizzleDb, getPgPool } from "../db/index.js";
import { sessions } from "../db/schema/sessions.js";
import { sessionTasks } from "../db/schema/sessionTasks.js";
import { sessionSegments } from "../db/schema/sessionSegments.js";
import { sessionPauseEvents } from "../db/schema/sessionPauseEvents.js";
import { sessionFeedback } from "../db/schema/sessionFeedback.js";
import { scheduleBlocks } from "../db/schema/scheduleBlocks.js";
import { normalizeUserId } from "./userRepository.js";
import { normalizeTaskId } from "./taskRepository.js";
import { normalizeBlockId } from "./scheduleBlockRepository.js";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeSessionId(id) {
  if (!id) return null;
  const str = typeof id === "string" ? id.trim() : id.toString().trim();
  if (UUID_REGEX.test(str)) return str;
  return null;
}

/**
 * Hydrates a session header row with its relational child records
 */
async function hydrateSession(db, sessionRow) {
  if (!sessionRow) return null;
  const sId = sessionRow.id;

  const [tasksRows, segmentsRows, pausesRows, feedbackRows] = await Promise.all([
    db
      .select()
      .from(sessionTasks)
      .where(eq(sessionTasks.sessionId, sId))
      .orderBy(asc(sessionTasks.sortOrder)),
    db
      .select()
      .from(sessionSegments)
      .where(eq(sessionSegments.sessionId, sId))
      .orderBy(asc(sessionSegments.segmentIndex)),
    db
      .select()
      .from(sessionPauseEvents)
      .where(eq(sessionPauseEvents.sessionId, sId))
      .orderBy(asc(sessionPauseEvents.startTime)),
    db
      .select()
      .from(sessionFeedback)
      .where(eq(sessionFeedback.sessionId, sId))
      .limit(1),
  ]);

  const clientSessionId = sessionRow.clientSessionId || sessionRow.client_session_id;
  const scheduleBlockId = sessionRow.scheduleBlockId || sessionRow.schedule_block_id;
  const rawSchedDate = sessionRow.snapshotScheduleDate || sessionRow.snapshot_schedule_date;
  const pDate = rawSchedDate instanceof Date
    ? rawSchedDate.toISOString().slice(0, 10)
    : (rawSchedDate ? String(rawSchedDate).slice(0, 10) : null);

  const hasSnapshot = Boolean(
    scheduleBlockId ||
    sessionRow.snapshotScheduleDate ||
    sessionRow.snapshot_schedule_date ||
    sessionRow.snapshotScheduleStartTime ||
    sessionRow.snapshot_schedule_start_time ||
    sessionRow.snapshotScheduleDurationMinutes !== undefined ||
    sessionRow.snapshot_schedule_duration_minutes !== undefined
  );

  let durationMinutes = sessionRow.snapshotScheduleDurationMinutes ?? sessionRow.snapshot_schedule_duration_minutes ?? null;
  let startTime = sessionRow.snapshotScheduleStartTime || sessionRow.snapshot_schedule_start_time || null;
  let endTime = sessionRow.snapshotScheduleEndTime || sessionRow.snapshot_schedule_end_time || null;

  if (scheduleBlockId && (!durationMinutes || durationMinutes === 0)) {
    const blk = await db.select().from(scheduleBlocks).where(eq(scheduleBlocks.id, scheduleBlockId)).limit(1);
    if (blk[0]) {
      durationMinutes = blk[0].durationMinutes ?? durationMinutes ?? 0;
      if (!startTime) startTime = blk[0].startTime;
      if (!endTime) endTime = blk[0].endTime;
    }
  }

  const scheduleSnapshot = hasSnapshot
    ? {
        scheduleBlockId: scheduleBlockId || null,
        date: pDate,
        startTime,
        endTime,
        durationMinutes: durationMinutes ?? 0,
      }
    : null;

  const fb = feedbackRows[0];
  const feedbackObj = fb
    ? {
        mood: fb.moodRating,
        focus: fb.focusRating,
        moodRating: fb.moodRating,
        focusRating: fb.focusRating,
        distractions: fb.distractionsNotes || "",
        distractionsNotes: fb.distractionsNotes || "",
        submittedAt: fb.submittedAt,
      }
    : null;

  return {
    id: sessionRow.id,
    _id: sessionRow.id,
    sessionId: clientSessionId,
    clientSessionId,
    userId: sessionRow.userId || sessionRow.user_id,
    scheduleBlockId,
    scheduleSnapshot,
    title: sessionRow.title,
    sessionType: sessionRow.sessionType || sessionRow.session_type,
    status: sessionRow.status,
    completionType: sessionRow.completionType || sessionRow.completion_type || null,
    sessionTaskOutcome: sessionRow.sessionTaskOutcome || sessionRow.session_task_outcome || null,
    startedAt: sessionRow.startedAt || sessionRow.started_at,
    endedAt: sessionRow.endedAt || sessionRow.ended_at,
    checkpointRevision: sessionRow.checkpointRevision ?? sessionRow.checkpoint_revision ?? 0,
    plannedDuration: sessionRow.plannedDurationSeconds ?? sessionRow.planned_duration_seconds ?? 1500,
    duration: sessionRow.durationSeconds ?? sessionRow.duration_seconds ?? 0,
    totalFocusMinutes: sessionRow.totalFocusMinutes ?? sessionRow.total_focus_minutes ?? 0,
    totalBreakMinutes: sessionRow.totalBreakMinutes ?? sessionRow.total_break_minutes ?? 0,
    createdAt: sessionRow.createdAt || sessionRow.created_at,
    updatedAt: sessionRow.updatedAt || sessionRow.updated_at,
    sessionStats: {
      pauseCount: sessionRow.pauseCount ?? sessionRow.pause_count ?? pausesRows.length,
      totalPauseDuration: sessionRow.totalPauseDurationSeconds ?? sessionRow.total_pause_duration_seconds ?? 0,
      focusSegmentsCompleted: sessionRow.focusSegmentsCompleted ?? sessionRow.focus_segments_completed ?? 0,
      breakSegmentsCompleted: sessionRow.breakSegmentsCompleted ?? sessionRow.break_segments_completed ?? 0,
      interruptions: sessionRow.interruptions ?? 0,
    },
    taskIds: tasksRows.map((t) => t.taskId),
    tasks: tasksRows.map((t) => ({
      taskId: t.taskId,
      sortOrder: t.sortOrder,
      snapshotTitle: t.snapshotTitle,
      snapshotPriority: t.snapshotPriority,
    })),
    todos: tasksRows.map((t) => ({
      id: t.taskId,
      taskId: t.taskId,
      title: t.snapshotTitle,
      status: "Completed",
    })),
    sessionSegments: segmentsRows.map((s) => ({
      segmentIndex: s.segmentIndex,
      type: s.type,
      duration: s.durationSeconds ?? 0,
      totalDuration: s.totalDurationSeconds ?? (s.type === "break" ? 300 : 1500),
      startedAt: s.startedAt,
      completedAt: s.completedAt,
    })),
    pauseEvents: pausesRows.map((p) => ({
      id: p.clientPauseId,
      clientPauseId: p.clientPauseId,
      startTime: p.startTime,
      endTime: p.endTime,
      duration: p.durationSeconds ?? 0,
      reason: p.reason || "Manual Pause",
    })),
    sessionFeedback: feedbackObj,
    feedback: feedbackObj,
    createdAt: sessionRow.createdAt || sessionRow.created_at,
    updatedAt: sessionRow.updatedAt || sessionRow.updated_at,
  };
}

class SessionRepository {
  async findById(sessionId) {
    const cleanId = normalizeSessionId(sessionId);
    if (!cleanId) return null;
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, cleanId))
      .limit(1);
    return hydrateSession(db, rows[0]);
  }

  async findByClientSessionId(userId, clientSessionId) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !clientSessionId) return null;
    const db = getDrizzleDb();

    // Check client_session_id or id if UUID
    const cleanId = normalizeSessionId(clientSessionId);
    let condition = and(
      eq(sessions.userId, cleanUserId),
      eq(sessions.clientSessionId, String(clientSessionId))
    );
    if (cleanId) {
      condition = and(
        eq(sessions.userId, cleanUserId),
        sql`(${sessions.clientSessionId} = ${String(clientSessionId)} OR ${sessions.id} = ${cleanId}::uuid)`
      );
    }

    const rows = await db.select().from(sessions).where(condition).limit(1);
    return hydrateSession(db, rows[0]);
  }

  async findActiveSession(userId) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return null;
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, cleanUserId), eq(sessions.status, "active")))
      .orderBy(desc(sessions.createdAt))
      .limit(1);
    return hydrateSession(db, rows[0]);
  }

  async findUserSessions(userId) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return [];
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, cleanUserId))
      .orderBy(desc(sessions.createdAt));

    const hydrated = [];
    for (const r of rows) {
      hydrated.push(await hydrateSession(db, r));
    }
    return hydrated;
  }

  async findUserSessionsInDateRange(userId, startDate, endDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return [];
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, cleanUserId),
          gte(sessions.createdAt, new Date(startDate)),
          lt(sessions.createdAt, new Date(endDate))
        )
      )
      .orderBy(desc(sessions.createdAt));

    const hydrated = [];
    for (const r of rows) {
      hydrated.push(await hydrateSession(db, r));
    }
    return hydrated;
  }

  async create(userId, payload, scheduleBlock = null) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) throw new Error("Valid userId required for session creation");

    const pool = getPgPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Abandon existing active sessions for this user
      await client.query(
        `UPDATE sessions
         SET status = 'completed', completion_type = 'abandoned', ended_at = NOW(), updated_at = NOW()
         WHERE user_id = $1 AND status = 'active'`,
        [cleanUserId]
      );

      const clientSessionId = String(payload.sessionId || payload.clientSessionId);
      const title = (payload.title || (scheduleBlock ? "Focus Session" : "Untitled Work")).slice(0, 200);
      const sessionType = payload.sessionType === "task" ? "task" : (scheduleBlock ? "task" : "quick");
      const plannedDuration = Number(payload.plannedDuration) || 1500;
      const totalFocusMinutes = Number(payload.totalFocusMinutes) || 0;
      const totalBreakMinutes = Number(payload.totalBreakMinutes) || 0;

      const scheduleBlockId = scheduleBlock?.id ? normalizeBlockId(scheduleBlock.id) : null;
      const snapshotDate = scheduleBlock?.productDate || (scheduleBlock?.date ? String(scheduleBlock.date).slice(0, 10) : null);
      const snapshotStartTime = scheduleBlock?.startTime ? new Date(scheduleBlock.startTime) : null;
      const snapshotEndTime = scheduleBlock?.endTime ? new Date(scheduleBlock.endTime) : null;
      const snapshotDuration = scheduleBlock?.durationMinutes || null;

      const sessionInsertRes = await client.query(
        `INSERT INTO sessions (
          id, client_session_id, user_id, schedule_block_id, title, session_type, status,
          started_at, checkpoint_revision, planned_duration_seconds, duration_seconds,
          total_focus_minutes, total_break_minutes, snapshot_schedule_date,
          snapshot_schedule_start_time, snapshot_schedule_end_time, snapshot_schedule_duration_minutes,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, 'active',
          NOW(), 0, $6, 0, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        )
        ON CONFLICT (user_id, client_session_id)
        DO UPDATE SET updated_at = NOW()
        RETURNING *`,
        [
          clientSessionId,
          cleanUserId,
          scheduleBlockId,
          title,
          sessionType,
          plannedDuration,
          totalFocusMinutes,
          totalBreakMinutes,
          snapshotDate,
          snapshotStartTime,
          snapshotEndTime,
          snapshotDuration,
        ]
      );

      const sessionRow = sessionInsertRes.rows[0];
      const sessionPgId = sessionRow.id;

      // 2. Insert Session Tasks
      const taskIds = Array.isArray(payload.taskIds) ? payload.taskIds : [];
      let sortOrder = 0;
      for (const tId of taskIds) {
        const cleanTaskId = normalizeTaskId(tId);
        if (cleanTaskId) {
          await client.query(
            `INSERT INTO session_tasks (
              id, session_id, task_id, sort_order, snapshot_title, snapshot_priority, created_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, 'Task', 'medium', NOW()
            )
            ON CONFLICT (session_id, task_id) DO NOTHING`,
            [sessionPgId, cleanTaskId, sortOrder++]
          );
        }
      }

      // 3. Insert Session Segments
      const segments = Array.isArray(payload.sessionSegments) ? payload.sessionSegments : [];
      for (let idx = 0; idx < segments.length; idx++) {
        const seg = segments[idx];
        const segType = seg.type === "break" ? "break" : "focus";
        const duration = Number(seg.duration) || 0;
        const total = Number(seg.totalDuration) || (segType === "break" ? 300 : 1500);
        await client.query(
          `INSERT INTO session_segments (
            id, session_id, segment_index, type, duration_seconds, total_duration_seconds,
            started_at, completed_at, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
          )
          ON CONFLICT (session_id, segment_index) DO NOTHING`,
          [
            sessionPgId,
            idx,
            segType,
            duration,
            total,
            seg.startedAt ? new Date(seg.startedAt) : null,
            seg.completedAt ? new Date(seg.completedAt) : null,
          ]
        );
      }

      // 4. Insert Pause Events
      const pauses = Array.isArray(payload.pauseEvents) ? payload.pauseEvents : [];
      for (let pIdx = 0; pIdx < pauses.length; pIdx++) {
        const p = pauses[pIdx];
        const pId = String(p.id || p.clientPauseId || `p_${pIdx}`);
        await client.query(
          `INSERT INTO session_pause_events (
            id, session_id, client_pause_id, start_time, end_time, duration_seconds, reason, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
          )
          ON CONFLICT (session_id, client_pause_id) DO NOTHING`,
          [
            sessionPgId,
            pId,
            p.startTime ? new Date(p.startTime) : new Date(),
            p.endTime ? new Date(p.endTime) : null,
            Number(p.duration) || 0,
            (p.reason || "Manual Pause").slice(0, 100),
          ]
        );
      }

      await client.query("COMMIT");

      const db = getDrizzleDb();
      return hydrateSession(db, sessionRow);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async checkpoint(userId, clientSessionId, payload) {
    const cleanUserId = normalizeUserId(userId);
    const existing = await this.findByClientSessionId(cleanUserId, clientSessionId);
    if (!existing) {
      return null;
    }

    if (existing.status !== "active") {
      const err = new Error(`Cannot checkpoint a session with status '${existing.status}'`);
      err.statusCode = 409;
      throw err;
    }

    if (
      payload.checkpointRevision !== undefined &&
      existing.checkpointRevision !== undefined &&
      payload.checkpointRevision < existing.checkpointRevision
    ) {
      return existing;
    }

    const pool = getPgPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Merge segments
      if (Array.isArray(payload.sessionSegments)) {
        for (let idx = 0; idx < payload.sessionSegments.length; idx++) {
          const incoming = payload.sessionSegments[idx];
          if (!incoming) continue;
          const dur = Number(incoming.duration) || 0;
          const completedAt = incoming.completedAt ? new Date(incoming.completedAt) : null;
          const startedAt = incoming.startedAt ? new Date(incoming.startedAt) : null;

          await client.query(
            `UPDATE session_segments
             SET duration_seconds = GREATEST(duration_seconds, $1),
                 completed_at = COALESCE(completed_at, $2),
                 started_at = COALESCE(started_at, $3),
                 updated_at = NOW()
             WHERE session_id = $4 AND segment_index = $5`,
            [dur, completedAt, startedAt, existing.id, idx]
          );
        }
      }

      // Merge pause events
      if (Array.isArray(payload.pauseEvents)) {
        for (let pIdx = 0; pIdx < payload.pauseEvents.length; pIdx++) {
          const p = payload.pauseEvents[pIdx];
          const pId = String(p.id || p.clientPauseId || `p_${pIdx}`);
          await client.query(
            `INSERT INTO session_pause_events (
              id, session_id, client_pause_id, start_time, end_time, duration_seconds, reason, created_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
            )
            ON CONFLICT (session_id, client_pause_id)
            DO UPDATE SET end_time = EXCLUDED.end_time, duration_seconds = EXCLUDED.duration_seconds`,
            [
              existing.id,
              pId,
              p.startTime ? new Date(p.startTime) : new Date(),
              p.endTime ? new Date(p.endTime) : null,
              Number(p.duration) || 0,
              (p.reason || "Manual Pause").slice(0, 100),
            ]
          );
        }
      }

      // Compute total duration and minutes
      const segsRes = await client.query(
        `SELECT type, duration_seconds FROM session_segments WHERE session_id = $1`,
        [existing.id]
      );
      let totalDuration = 0;
      let focusSeconds = 0;
      let breakSeconds = 0;
      for (const row of segsRes.rows) {
        totalDuration += Number(row.duration_seconds) || 0;
        if (row.type === "focus") focusSeconds += Number(row.duration_seconds) || 0;
        if (row.type === "break") breakSeconds += Number(row.duration_seconds) || 0;
      }

      const totalFocusMinutes = Math.floor(focusSeconds / 60);
      const totalBreakMinutes = Math.floor(breakSeconds / 60);
      const newRev = Math.max(existing.checkpointRevision || 0, payload.checkpointRevision || 0);

      const stats = payload.sessionStats || {};
      const pauseCount = stats.pauseCount ?? (payload.pauseEvents ? payload.pauseEvents.length : existing.sessionStats?.pauseCount ?? 0);
      const totalPauseDuration = stats.totalPauseDuration ?? existing.sessionStats?.totalPauseDuration ?? 0;
      const focusSegmentsCompleted = stats.focusSegmentsCompleted ?? existing.sessionStats?.focusSegmentsCompleted ?? 0;
      const breakSegmentsCompleted = stats.breakSegmentsCompleted ?? existing.sessionStats?.breakSegmentsCompleted ?? 0;
      const interruptions = stats.interruptions ?? existing.sessionStats?.interruptions ?? 0;

      const updateRes = await client.query(
        `UPDATE sessions
         SET checkpoint_revision = GREATEST(checkpoint_revision, $1),
             duration_seconds = $2,
             total_focus_minutes = $3,
             total_break_minutes = $4,
             pause_count = $5,
             total_pause_duration_seconds = $6,
             focus_segments_completed = $7,
             break_segments_completed = $8,
             interruptions = $9,
             updated_at = NOW()
         WHERE id = $10 AND user_id = $11 AND status = 'active'
         RETURNING *`,
        [
          newRev,
          totalDuration,
          totalFocusMinutes,
          totalBreakMinutes,
          pauseCount,
          totalPauseDuration,
          focusSegmentsCompleted,
          breakSegmentsCompleted,
          interruptions,
          existing.id,
          cleanUserId,
        ]
      );

      await client.query("COMMIT");

      const db = getDrizzleDb();
      if (updateRes.rows.length === 0) {
        return this.findByClientSessionId(cleanUserId, clientSessionId);
      }
      return hydrateSession(db, updateRes.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async update(userId, clientSessionId, payload) {
    const cleanUserId = normalizeUserId(userId);
    const existing = await this.findByClientSessionId(cleanUserId, clientSessionId);
    if (!existing) {
      throw new Error("Session not found");
    }

    if (existing.status === "completed") {
      return { session: existing, transitionedToCompleted: false };
    }

    const pool = getPgPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      let transitionedToCompleted = false;
      const isTerminal = ["completed", "skipped", "abandoned"].includes(payload.status);

      if (isTerminal) {
        const completionType = payload.status;
        const dur = payload.duration !== undefined ? Number(payload.duration) : null;
        const ttl = payload.title ? payload.title.slice(0, 200) : null;
        const res = await client.query(
          `UPDATE sessions
           SET status = 'completed',
               completion_type = $1,
               duration_seconds = COALESCE($4, duration_seconds),
               title = COALESCE($5, title),
               ended_at = NOW(),
               updated_at = NOW()
           WHERE id = $2 AND user_id = $3 AND status != 'completed'
           RETURNING *`,
          [completionType, existing.id, cleanUserId, dur, ttl]
        );
        transitionedToCompleted = res.rows.length === 1;

        if (transitionedToCompleted && payload.status === "completed" && existing.scheduleBlockId) {
          await client.query(
            `UPDATE schedule_blocks
             SET status = 'completed', session_id = $1, updated_at = NOW()
             WHERE id = $2 AND user_id = $3 AND status = 'scheduled'`,
            [existing.id, existing.scheduleBlockId, cleanUserId]
          );
        }
      } else {
        if (payload.duration !== undefined) {
          await client.query(
            `UPDATE sessions SET duration_seconds = $1, updated_at = NOW() WHERE id = $2 AND status != 'completed'`,
            [Number(payload.duration) || 0, existing.id]
          );
        }

        if (payload.title) {
          await client.query(
            `UPDATE sessions SET title = $1, updated_at = NOW() WHERE id = $2 AND status != 'completed'`,
            [payload.title.slice(0, 200), existing.id]
          );
        }
      }

      // Update segment if provided
      if (payload.segment) {
        const seg = payload.segment;
        const dur = Number(seg.duration) || 0;
        const completedAt = seg.completedAt ? new Date(seg.completedAt) : null;
        await client.query(
          `UPDATE session_segments
           SET duration_seconds = GREATEST(duration_seconds, $1),
               completed_at = COALESCE(completed_at, $2),
               updated_at = NOW()
           WHERE session_id = $3 AND segment_index = $4`,
          [dur, completedAt, existing.id, seg.segmentIndex]
        );
      }

      await client.query("COMMIT");

      const db = getDrizzleDb();
      const updated = await this.findByClientSessionId(cleanUserId, clientSessionId);
      return {
        session: updated,
        transitionedToCompleted,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async recordFeedback(userId, clientSessionId, feedbackData) {
    const cleanUserId = normalizeUserId(userId);
    const existing = await this.findByClientSessionId(cleanUserId, clientSessionId);
    if (!existing) {
      const err = new Error("Session not found");
      err.statusCode = 404;
      throw err;
    }

    const mood = feedbackData.mood !== undefined ? Math.round(Number(feedbackData.mood)) : null;
    const focus = feedbackData.focus !== undefined ? Math.round(Number(feedbackData.focus)) : null;
    const distractions = (feedbackData.distractions || "").toString();
    const submittedAt = feedbackData.submittedAt ? new Date(feedbackData.submittedAt) : new Date();

    const db = getDrizzleDb();
    await db
      .insert(sessionFeedback)
      .values({
        sessionId: existing.id,
        moodRating: mood && mood >= 1 && mood <= 5 ? mood : null,
        focusRating: focus && focus >= 1 && focus <= 5 ? focus : null,
        distractionsNotes: distractions,
        submittedAt,
      })
      .onConflictDoUpdate({
        target: sessionFeedback.sessionId,
        set: {
          moodRating: mood && mood >= 1 && mood <= 5 ? mood : null,
          focusRating: focus && focus >= 1 && focus <= 5 ? focus : null,
          distractionsNotes: distractions,
          submittedAt,
        },
      });

    return this.findByClientSessionId(cleanUserId, clientSessionId);
  }

  async recordTaskOutcome(userId, clientSessionId, taskOutcome) {
    const cleanUserId = normalizeUserId(userId);
    const existing = await this.findByClientSessionId(cleanUserId, clientSessionId);
    if (!existing) {
      const err = new Error("Session not found or access denied");
      err.statusCode = 404;
      throw err;
    }

    const db = getDrizzleDb();
    await db
      .update(sessions)
      .set({
        sessionTaskOutcome: taskOutcome,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, existing.id));

    return this.findByClientSessionId(cleanUserId, clientSessionId);
  }

  async findHistory(userId, query = {}) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) {
      return {
        sessions: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      };
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const db = getDrizzleDb();
    const conditions = [eq(sessions.userId, cleanUserId)];

    if (query.status) {
      conditions.push(eq(sessions.status, query.status));
    }
    if (query.completionType) {
      conditions.push(eq(sessions.completionType, query.completionType));
    }
    if (query.taskId) {
      const cleanTaskId = normalizeTaskId(query.taskId);
      if (cleanTaskId) {
        conditions.push(
          inArray(
            sessions.id,
            db
              .select({ sessionId: sessionTasks.sessionId })
              .from(sessionTasks)
              .where(eq(sessionTasks.taskId, cleanTaskId))
          )
        );
      }
    }
    if (query.startDate) {
      const tz = normalizeTimezone(query.timezone || "UTC");
      const isDateOnly = (str) => typeof str === "string" && /^\d{4}-\d{2}-\d{2}$/.test(str);

      const startUtc = isDateOnly(query.startDate)
        ? productDateToStart(query.startDate, tz)
        : new Date(query.startDate);

      const endParam = query.endDate || query.startDate;
      const endUtc = isDateOnly(endParam)
        ? productDateToEnd(endParam, tz)
        : (String(endParam).includes("T") ? new Date(endParam) : new Date(`${endParam}T23:59:59.999Z`));

      const dateMatches = [
        and(gte(sessions.startedAt, startUtc), lte(sessions.startedAt, endUtc)),
        and(gte(sessions.createdAt, startUtc), lte(sessions.createdAt, endUtc)),
      ];

      if (isDateOnly(query.startDate)) {
        if (query.startDate === endParam) {
          dateMatches.push(eq(sessions.snapshotScheduleDate, query.startDate));
        } else {
          dateMatches.push(
            and(
              gte(sessions.snapshotScheduleDate, query.startDate),
              lte(sessions.snapshotScheduleDate, endParam)
            )
          );
        }
      }

      conditions.push(or(...dateMatches));
    }

    const whereClause = and(...conditions);

    const [rows, countRes] = await Promise.all([
      db
        .select()
        .from(sessions)
        .where(whereClause)
        .orderBy(desc(sessions.startedAt), desc(sessions.createdAt))
        .offset(skip)
        .limit(limit),
      db
        .select({ count: sql`count(*)` })
        .from(sessions)
        .where(whereClause),
    ]);

    const total = Number(countRes[0]?.count) || 0;
    const hydratedSessions = await Promise.all(rows.map((r) => hydrateSession(db, r)));

    return {
      sessions: hydratedSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async hasSessionsForTask(taskId) {
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanTaskId) return false;
    const db = getDrizzleDb();
    const rows = await db
      .select({ count: sql`count(*)` })
      .from(sessionTasks)
      .where(eq(sessionTasks.taskId, cleanTaskId));
    return Number(rows[0]?.count) > 0;
  }

  async getFocusSecondsForTask(userId, taskId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanUserId || !cleanTaskId) return 0;

    const pool = getPgPool();
    const query = `
      SELECT COALESCE(SUM(s.duration_seconds), 0)::int AS total_focus_seconds
      FROM (
        SELECT DISTINCT s.id, s.duration_seconds
        FROM sessions s
        LEFT JOIN session_tasks st ON st.session_id = s.id
        LEFT JOIN schedule_blocks sb ON sb.id = s.schedule_block_id
        WHERE s.user_id = $1
          AND s.duration_seconds > 0
          AND (st.task_id = $2 OR sb.task_id = $2)
      ) s
    `;
    const res = await pool.query(query, [cleanUserId, cleanTaskId]);
    return Number(res.rows[0]?.total_focus_seconds || 0);
  }
}

export const sessionRepository = new SessionRepository();
export default sessionRepository;
