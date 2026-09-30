import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import Session from "../models/sessionModel.js";
import ScheduleBlock from "../models/scheduleBlockModel.js";
import Task from "../models/taskModel.js";
import TaskOccurrence from "../models/taskOccurrenceModel.js";
import SessionService from "../services/sessionService.js";
import ScheduleService from "../services/scheduleService.js";
import TaskService from "../services/taskService.js";
import TaskOccurrenceService from "../services/taskOccurrenceService.js";
import { toStartOfDayUTC } from "../utils/dateUtils.js";

const TEST_DB_URI = "mongodb://localhost:27017/athena_history_test";

describe("History V2 Foundation Test Suite", () => {
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  before(async () => {
    await mongoose.connect(TEST_DB_URI);
    await Promise.all([
      Session.deleteMany({ userId: { $in: [userA, userB] } }),
      ScheduleBlock.deleteMany({ userId: { $in: [userA, userB] } }),
      Task.deleteMany({ user: { $in: [userA, userB] } }),
      TaskOccurrence.deleteMany({ userId: { $in: [userA, userB] } }),
    ]);
  });

  after(async () => {
    await Promise.all([
      Session.deleteMany({ userId: { $in: [userA, userB] } }),
      ScheduleBlock.deleteMany({ userId: { $in: [userA, userB] } }),
      Task.deleteMany({ user: { $in: [userA, userB] } }),
      TaskOccurrence.deleteMany({ userId: { $in: [userA, userB] } }),
    ]);
    await mongoose.connection.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // A. ScheduleBlock-linked session stores historical schedule data
  // ─────────────────────────────────────────────────────────────────────────────
  it("A: ScheduleBlock-linked session stores immutable scheduleSnapshot", async () => {
    const task = await Task.create({
      user: userA,
      title: "Write Architecture Spec",
      status: "todo",
    });

    const blockDate = toStartOfDayUTC("2026-10-01");
    const startTime = new Date("2026-10-01T09:00:00.000Z");
    const endTime = new Date("2026-10-01T09:45:00.000Z");

    const block = await ScheduleBlock.create({
      userId: userA,
      taskId: task._id,
      date: blockDate,
      startTime,
      endTime,
      durationMinutes: 45,
      status: "scheduled",
    });

    const sessionId = "session_test_snapshot_01";
    const session = await SessionService.start(userA, {
      sessionId,
      title: "Focus: Architecture Spec",
      scheduleBlockId: block._id.toString(),
      sessionSegments: [
        { type: "focus", totalDuration: 2700, duration: 0 },
      ],
      plannedDuration: 2700,
    });

    assert.ok(session, "Session should be created");
    assert.ok(session.scheduleSnapshot, "Session must contain scheduleSnapshot");
    assert.equal(
      session.scheduleSnapshot.scheduleBlockId.toString(),
      block._id.toString()
    );
    assert.equal(session.scheduleSnapshot.durationMinutes, 45);
    assert.equal(
      new Date(session.scheduleSnapshot.startTime).toISOString(),
      startTime.toISOString()
    );
    assert.equal(
      new Date(session.scheduleSnapshot.endTime).toISOString(),
      endTime.toISOString()
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // B. Deleting ScheduleBlock does not erase session schedule history
  // ─────────────────────────────────────────────────────────────────────────────
  it("B: Deleting ScheduleBlock does not erase session schedule history", async () => {
    const task = await Task.create({
      user: userA,
      title: "Client Pitch Deck",
      status: "todo",
    });

    const block = await ScheduleBlock.create({
      userId: userA,
      taskId: task._id,
      date: toStartOfDayUTC("2026-10-02"),
      startTime: new Date("2026-10-02T14:00:00.000Z"),
      endTime: new Date("2026-10-02T15:00:00.000Z"),
      durationMinutes: 60,
      status: "scheduled",
    });

    const sessionId = "session_test_snapshot_preserve_02";
    await SessionService.start(userA, {
      sessionId,
      title: "Focus: Pitch Deck",
      scheduleBlockId: block._id.toString(),
      sessionSegments: [
        { type: "focus", totalDuration: 3600, duration: 0 },
      ],
      plannedDuration: 3600,
    });

    // Complete session
    await SessionService.update(userA, {
      sessionId,
      status: "completed",
    });

    // Delete the schedule block using ScheduleService
    await ScheduleService.deleteScheduleBlock(userA, block._id.toString());

    // Verify ScheduleBlock document was removed
    const deletedBlock = await ScheduleBlock.findById(block._id);
    assert.equal(deletedBlock, null, "ScheduleBlock must be deleted");

    // Fetch session and verify scheduleSnapshot is STILL INTACT
    const historicalSession = await Session.findOne({ sessionId, userId: userA });
    assert.ok(historicalSession, "Session must exist");
    assert.equal(historicalSession.scheduleBlockId, null, "Live pointer was cleared");
    assert.ok(
      historicalSession.scheduleSnapshot,
      "scheduleSnapshot must remain preserved after block deletion"
    );
    assert.equal(
      historicalSession.scheduleSnapshot.scheduleBlockId.toString(),
      block._id.toString()
    );
    assert.equal(historicalSession.scheduleSnapshot.durationMinutes, 60);
    assert.equal(
      new Date(historicalSession.scheduleSnapshot.startTime).toISOString(),
      "2026-10-02T14:00:00.000Z"
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // C. Task deletion does not erase historical session title/todos
  // ─────────────────────────────────────────────────────────────────────────────
  it("C: Task deletion does not erase historical session title/todos", async () => {
    const task = await Task.create({
      user: userA,
      title: "Legacy Feature Maintenance",
      status: "in-progress",
    });

    const sessionId = "session_test_task_deletion_03";
    await SessionService.start(userA, {
      sessionId,
      title: task.title,
      taskIds: [task._id],
      sessionSegments: [
        { type: "focus", totalDuration: 1500, duration: 0 },
      ],
      plannedDuration: 1500,
    });

    // Update with session checklist items
    await SessionService.update(userA, {
      sessionId,
      todos: [
        { title: "Review pull request", status: "Completed" },
        { title: "Merge branch", status: "Not Started" },
      ],
      status: "completed",
    });

    // Delete the underlying task
    await TaskService.deleteTask(userA, task._id.toString());

    // Verify Task is gone
    const deletedTask = await Task.findById(task._id);
    assert.equal(deletedTask, null, "Task must be deleted");

    // Verify historical Session record is completely intact
    const historicalSession = await Session.findOne({ sessionId, userId: userA });
    assert.ok(historicalSession, "Historical session must remain");
    assert.equal(
      historicalSession.title,
      "Legacy Feature Maintenance",
      "Session title snapshot must be preserved"
    );
    assert.equal(historicalSession.todos.length, 2);
    assert.equal(historicalSession.todos[0].title, "Review pull request");
    assert.equal(historicalSession.todos[0].status, "Completed");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // D. TaskOccurrence can represent all 6 valid outcomes
  // ─────────────────────────────────────────────────────────────────────────────
  it("D: TaskOccurrence correctly represents all 6 valid outcomes", async () => {
    const task = await Task.create({
      user: userA,
      title: "Multi-Outcome Verification Task",
      priority: "high",
    });

    const outcomes = [
      "pending",
      "completed",
      "partially_completed",
      "rescheduled",
      "missed",
      "cancelled",
    ];

    for (let i = 0; i < outcomes.length; i++) {
      const outcome = outcomes[i];
      const date = toStartOfDayUTC(`2026-10-1${i}`);

      const occ = await TaskOccurrenceService.ensureOccurrence(userA, {
        taskId: task._id,
        date,
      });

      assert.equal(occ.outcome, "pending", "Initial state must be pending");

      const updated = await TaskOccurrenceService.recordOutcome(
        userA,
        occ._id,
        {
          outcome,
          notes: `Verified outcome ${outcome}`,
        }
      );

      assert.equal(updated.outcome, outcome);
      if (outcome === "completed") {
        assert.ok(updated.completedAt, "Completed outcome should store completedAt");
      }
    }

    // Invalid outcome should throw
    const invalidDate = toStartOfDayUTC("2026-10-25");
    const testOcc = await TaskOccurrenceService.ensureOccurrence(userA, {
      taskId: task._id,
      date: invalidDate,
    });

    await assert.rejects(
      async () => {
        await TaskOccurrenceService.recordOutcome(userA, testOcc._id, {
          outcome: "invalid_outcome_string",
        });
      },
      /Invalid outcome/
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // E. Rescheduled occurrence preserves original date and stores new date
  // ─────────────────────────────────────────────────────────────────────────────
  it("E: Rescheduled occurrence preserves original date and stores new date", async () => {
    const task = await Task.create({
      user: userA,
      title: "Quarterly Budget Review",
      priority: "medium",
    });

    const originalDate = toStartOfDayUTC("2026-09-29");
    const targetDate = toStartOfDayUTC("2026-09-30");

    // 1. Create occurrence on Sep 29
    const originalOcc = await TaskOccurrenceService.ensureOccurrence(userA, {
      taskId: task._id,
      date: originalDate,
    });

    // 2. Reschedule to Sep 30
    const { originalOccurrence, nextOccurrence } =
      await TaskOccurrenceService.reschedule(
        userA,
        originalOcc._id,
        targetDate
      );

    // Verify original occurrence on Sep 29 is preserved as "rescheduled"
    assert.equal(originalOccurrence.outcome, "rescheduled");
    assert.equal(
      new Date(originalOccurrence.date).toISOString(),
      originalDate.toISOString()
    );
    assert.equal(
      new Date(originalOccurrence.rescheduledTo).toISOString(),
      targetDate.toISOString()
    );

    // Verify next occurrence on Sep 30 is created as "pending"
    assert.equal(nextOccurrence.outcome, "pending");
    assert.equal(
      new Date(nextOccurrence.date).toISOString(),
      targetDate.toISOString()
    );
    assert.equal(
      nextOccurrence.taskSnapshot.title,
      "Quarterly Budget Review"
    );

    // 3. Mark the Sep 30 occurrence completed
    const completedNext = await TaskOccurrenceService.recordOutcome(
      userA,
      nextOccurrence._id,
      { outcome: "completed" }
    );
    assert.equal(completedNext.outcome, "completed");

    // Query both occurrences to verify historical audit trail
    const history = await TaskOccurrenceService.getOccurrences(userA, {
      taskId: task._id,
    });

    assert.equal(history.length, 2, "Both occurrences must persist in history");
    assert.equal(history[0].outcome, "rescheduled");
    assert.equal(history[1].outcome, "completed");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // F. History query: pagination, date range, task filtering, ownership, ordering
  // ─────────────────────────────────────────────────────────────────────────────
  it("F: History query supports pagination, date filtering, task filtering, ownership, and ordering", async () => {
    const taskX = await Task.create({ user: userA, title: "Task X" });
    const taskY = await Task.create({ user: userA, title: "Task Y" });

    // Create 5 sessions for userA across different days
    const createdIds = [];
    for (let i = 1; i <= 5; i++) {
      const startedAt = new Date(`2026-10-0${i}T10:00:00.000Z`);
      const s = await Session.create({
        sessionId: `history_session_A_${i}`,
        userId: userA,
        title: i % 2 === 0 ? "Task X Work" : "Task Y Work",
        taskIds: i % 2 === 0 ? [taskX._id] : [taskY._id],
        startedAt,
        status: "completed",
        completionType: "completed",
        duration: 1500,
        plannedDuration: 1500,
      });
      createdIds.push(s._id);
    }

    // Create 1 session for userB
    await Session.create({
      sessionId: "history_session_B_01",
      userId: userB,
      title: "User B Private Session",
      startedAt: new Date("2026-10-03T10:00:00.000Z"),
      status: "completed",
      completionType: "completed",
      duration: 1800,
    });

    // 1. Pagination & Ownership
    const page1 = await SessionService.history(userA, { page: 1, limit: 2 });
    assert.equal(page1.sessions.length, 2);
    assert.equal(page1.pagination.total >= 5, true);
    assert.equal(page1.pagination.page, 1);
    assert.equal(page1.pagination.hasNextPage, true);

    // Confirm no userB session leaked
    const hasUserB = page1.sessions.some(
      (s) => s.userId.toString() === userB.toString()
    );
    assert.equal(hasUserB, false, "Ownership isolation strictly enforced");

    // 2. Stable Newest-First Ordering
    const allA = await SessionService.history(userA, { limit: 10 });
    const times = allA.sessions.map((s) => new Date(s.startedAt).getTime());
    for (let i = 0; i < times.length - 1; i++) {
      assert.ok(
        times[i] >= times[i + 1],
        "Sessions must be sorted newest-first"
      );
    }

    // 3. Task Filtering
    const taskXHistory = await SessionService.history(userA, {
      taskId: taskX._id.toString(),
    });
    assert.ok(taskXHistory.sessions.length > 0);
    taskXHistory.sessions.forEach((s) => {
      assert.ok(
        s.taskIds.map((id) => id.toString()).includes(taskX._id.toString()),
        "Must only return sessions containing taskX"
      );
    });

    // 4. Date Range Filtering
    const dateFiltered = await SessionService.history(userA, {
      startDate: "2026-10-02",
      endDate: "2026-10-04",
    });
    assert.ok(dateFiltered.sessions.length > 0);
    dateFiltered.sessions.forEach((s) => {
      const t = new Date(s.startedAt).getTime();
      assert.ok(t >= new Date("2026-10-02T00:00:00.000Z").getTime());
      assert.ok(t <= new Date("2026-10-04T23:59:59.999Z").getTime());
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // G. Existing sessions without new fields still deserialize/load
  // ─────────────────────────────────────────────────────────────────────────────
  it("G: Existing sessions without new fields deserialize cleanly with synthetic fallback", async () => {
    // Insert raw document mimicking legacy pre-V2 session (no scheduleSnapshot)
    const legacySessionId = "legacy_session_pre_v2_99";
    const legacyBlock = await ScheduleBlock.create({
      userId: userA,
      taskId: new mongoose.Types.ObjectId(),
      date: toStartOfDayUTC("2026-08-15"),
      startTime: new Date("2026-08-15T08:00:00.000Z"),
      endTime: new Date("2026-08-15T08:30:00.000Z"),
      durationMinutes: 30,
      status: "completed",
    });

    await Session.collection.insertOne({
      sessionId: legacySessionId,
      userId: userA,
      title: "Ancient Legacy Focus",
      scheduleBlockId: legacyBlock._id,
      // scheduleSnapshot omitted on purpose
      status: "completed",
      completionType: "completed",
      duration: 1800,
      plannedDuration: 1800,
      createdAt: new Date("2026-08-15T08:00:00.000Z"),
      updatedAt: new Date("2026-08-15T08:30:00.000Z"),
    });

    // Query via SessionService.history
    const historyRes = await SessionService.history(userA, {
      startDate: "2026-08-14",
      endDate: "2026-08-16",
    });

    const targetSession = historyRes.sessions.find(
      (s) => s.sessionId === legacySessionId
    );
    assert.ok(targetSession, "Legacy session must load without error");
    assert.ok(
      targetSession.scheduleSnapshot,
      "Legacy session must receive synthetic scheduleSnapshot fallback"
    );
    assert.equal(
      targetSession.scheduleSnapshot.scheduleBlockId.toString(),
      legacyBlock._id.toString()
    );
    assert.equal(targetSession.scheduleSnapshot.durationMinutes, 30);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Terminal Session Immutability
  // ─────────────────────────────────────────────────────────────────────────────
  it("Terminal Session Immutability: completed session rejects execution mutations", async () => {
    const sessionId = "session_terminal_immutability_test";
    await SessionService.start(userA, {
      sessionId,
      title: "Completed Session Alpha",
      sessionSegments: [
        { type: "focus", totalDuration: 1500, duration: 1500 },
      ],
      plannedDuration: 1500,
    });

    await SessionService.update(userA, {
      sessionId,
      status: "completed",
    });

    // Attempt to mutate duration and title after completion
    const updateAttempt = await SessionService.update(userA, {
      sessionId,
      title: "Mutated Rogue Title",
      segment: { segmentIndex: 0, duration: 9999 },
    });

    assert.equal(updateAttempt.transitionedToCompleted, false);

    const verified = await Session.findOne({ sessionId, userId: userA });
    assert.equal(
      verified.title,
      "Completed Session Alpha",
      "Title must not be mutated on completed session"
    );
    assert.equal(
      verified.duration,
      1500,
      "Duration must not be mutated on completed session"
    );
  });
});
