import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import Task from "../models/taskModel.js";
import TaskOccurrence from "../models/taskOccurrenceModel.js";
import TaskService from "../services/taskService.js";
import TaskOccurrenceService from "../services/taskOccurrenceService.js";
import { toStartOfDayUTC } from "../utils/dateUtils.js";

const TEST_DB_URI = "mongodb://localhost:27017/athena_task_occurrence_test";

describe("Task + Planner → TaskOccurrence Integration Test Suite", () => {
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  before(async () => {
    await mongoose.connect(TEST_DB_URI);
    await Promise.all([
      Task.deleteMany({ user: { $in: [userA, userB] } }),
      TaskOccurrence.deleteMany({ userId: { $in: [userA, userB] } }),
    ]);
  });

  after(async () => {
    await Promise.all([
      Task.deleteMany({ user: { $in: [userA, userB] } }),
      TaskOccurrence.deleteMany({ userId: { $in: [userA, userB] } }),
    ]);
    await mongoose.connection.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // A. Planned task creates one pending occurrence
  // ─────────────────────────────────────────────────────────────────────────────
  it("A: Planned task creates one pending occurrence", async () => {
    const plannedDate = toStartOfDayUTC("2026-10-10");
    const task = await TaskService.createTask(userA, {
      title: "Write Q4 Roadmap",
      plannedDate,
      priority: "high",
    });

    assert.ok(task._id, "Task should be created");

    const occurrences = await TaskOccurrence.find({
      userId: userA,
      taskId: task._id,
    });

    assert.equal(occurrences.length, 1, "Exactly one occurrence should be created");
    assert.equal(occurrences[0].outcome, "pending");
    assert.equal(
      new Date(occurrences[0].date).toISOString(),
      plannedDate.toISOString()
    );
    assert.equal(occurrences[0].taskSnapshot.title, "Write Q4 Roadmap");
    assert.equal(occurrences[0].taskSnapshot.priority, "high");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // B. Task without plannedDate creates no occurrence
  // ─────────────────────────────────────────────────────────────────────────────
  it("B: Task without plannedDate creates no occurrence", async () => {
    const task = await TaskService.createTask(userA, {
      title: "Someday / Maybe Idea",
      priority: "low",
    });

    assert.ok(task._id);

    const occurrences = await TaskOccurrence.find({
      userId: userA,
      taskId: task._id,
    });

    assert.equal(occurrences.length, 0, "No occurrence should be created when plannedDate is omitted");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // C. plannedDate change: Sep 29 → Sep 30 creates Sep 29 = rescheduled, Sep 30 = pending
  // ─────────────────────────────────────────────────────────────────────────────
  it("C: plannedDate change reschedules original occurrence and creates pending next occurrence", async () => {
    const sep29 = toStartOfDayUTC("2026-09-29");
    const sep30 = toStartOfDayUTC("2026-09-30");

    const task = await TaskService.createTask(userA, {
      title: "Draft Press Release",
      plannedDate: sep29,
    });

    // Update plannedDate to Sep 30
    await TaskService.updateTask(userA, task._id.toString(), {
      plannedDate: sep30,
    });

    const occurrences = await TaskOccurrence.find({
      userId: userA,
      taskId: task._id,
    }).sort({ date: 1 });

    assert.equal(occurrences.length, 2, "Both Sep 29 and Sep 30 occurrences must exist");

    // Sep 29 occurrence
    assert.equal(occurrences[0].outcome, "rescheduled");
    assert.equal(
      new Date(occurrences[0].date).toISOString(),
      sep29.toISOString()
    );
    assert.equal(
      new Date(occurrences[0].rescheduledTo).toISOString(),
      sep30.toISOString()
    );

    // Sep 30 occurrence
    assert.equal(occurrences[1].outcome, "pending");
    assert.equal(
      new Date(occurrences[1].date).toISOString(),
      sep30.toISOString()
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // D. Rescheduling is neutral
  // ─────────────────────────────────────────────────────────────────────────────
  it("D: Rescheduling is neutral (neither completed nor cancelled nor missed)", async () => {
    const date1 = toStartOfDayUTC("2026-10-01");
    const date2 = toStartOfDayUTC("2026-10-02");

    const task = await TaskService.createTask(userA, {
      title: "Neutral Reschedule Verification",
      plannedDate: date1,
    });

    await TaskService.updateTask(userA, task._id.toString(), {
      plannedDate: date2,
    });

    const occurrences = await TaskOccurrence.find({
      userId: userA,
      taskId: task._id,
    });

    const orig = occurrences.find(
      (o) => new Date(o.date).toISOString() === date1.toISOString()
    );

    assert.equal(orig.outcome, "rescheduled");
    assert.notEqual(orig.outcome, "completed");
    assert.notEqual(orig.outcome, "missed");
    assert.notEqual(orig.outcome, "cancelled");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // E. Completing today's task marks today's occurrence completed
  // ─────────────────────────────────────────────────────────────────────────────
  it("E: Completing today's task marks today's occurrence completed", async () => {
    const today = toStartOfDayUTC(new Date());

    const task = await TaskService.createTask(userA, {
      title: "Finish Security Audit",
      plannedDate: today,
    });

    // Mark task completed
    await TaskService.updateTask(userA, task._id.toString(), {
      status: "completed",
    });

    const occ = await TaskOccurrence.findOne({
      userId: userA,
      taskId: task._id,
      date: today,
    });

    assert.ok(occ, "Today's occurrence must exist");
    assert.equal(occ.outcome, "completed");
    assert.ok(occ.completedAt instanceof Date, "completedAt must be set");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // F. Completing a task does not modify historical occurrences
  // ─────────────────────────────────────────────────────────────────────────────
  it("F: Completing a task does not modify historical occurrences", async () => {
    const pastDate1 = toStartOfDayUTC("2026-09-27");
    const pastDate2 = toStartOfDayUTC("2026-09-28");
    const today = toStartOfDayUTC(new Date());

    const task = await TaskService.createTask(userA, {
      title: "Multi-Day Project Work",
      plannedDate: pastDate1,
    });

    // Artificially establish historical occurrences
    const occ1 = await TaskOccurrence.findOne({
      userId: userA,
      taskId: task._id,
      date: pastDate1,
    });
    occ1.outcome = "completed";
    occ1.completedAt = new Date("2026-09-27T18:00:00.000Z");
    await occ1.save();

    await TaskOccurrence.create({
      userId: userA,
      taskId: task._id,
      date: pastDate2,
      outcome: "rescheduled",
      rescheduledTo: today,
    });

    await TaskOccurrence.create({
      userId: userA,
      taskId: task._id,
      date: today,
      outcome: "pending",
    });

    // Complete task today
    await TaskService.updateTask(userA, task._id.toString(), {
      status: "completed",
    });

    // Verify past occurrences were untouched
    const historicalOcc1 = await TaskOccurrence.findOne({
      userId: userA,
      taskId: task._id,
      date: pastDate1,
    });
    assert.equal(historicalOcc1.outcome, "completed");
    assert.equal(
      new Date(historicalOcc1.completedAt).toISOString(),
      "2026-09-27T18:00:00.000Z"
    );

    const historicalOcc2 = await TaskOccurrence.findOne({
      userId: userA,
      taskId: task._id,
      date: pastDate2,
    });
    assert.equal(historicalOcc2.outcome, "rescheduled");

    const todayOcc = await TaskOccurrence.findOne({
      userId: userA,
      taskId: task._id,
      date: today,
    });
    assert.equal(todayOcc.outcome, "completed");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // G. Reopening a task does not rewrite historical completed occurrences
  // ─────────────────────────────────────────────────────────────────────────────
  it("G: Reopening a task does not rewrite historical completed occurrences", async () => {
    const ancientDate = toStartOfDayUTC("2026-09-20");

    const task = await TaskService.createTask(userA, {
      title: "Fixed Bug in V1",
      plannedDate: ancientDate,
    });

    const ancientOcc = await TaskOccurrence.findOne({
      userId: userA,
      taskId: task._id,
      date: ancientDate,
    });
    ancientOcc.outcome = "completed";
    ancientOcc.completedAt = new Date("2026-09-20T17:00:00.000Z");
    await ancientOcc.save();

    // Mark task completed in Task model
    task.status = "completed";
    await task.save();

    // Now, days later, user reopens the task (status -> todo)
    await TaskService.updateTask(userA, task._id.toString(), {
      status: "todo",
    });

    // Verify historical completed occurrence was NOT rewritten
    const verified = await TaskOccurrence.findOne({
      userId: userA,
      taskId: task._id,
      date: ancientDate,
    });
    assert.equal(
      verified.outcome,
      "completed",
      "Historical completed occurrence must remain immutable"
    );
    assert.equal(
      new Date(verified.completedAt).toISOString(),
      "2026-09-20T17:00:00.000Z"
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // H. Cancelling today's planned task marks occurrence cancelled
  // ─────────────────────────────────────────────────────────────────────────────
  it("H: Cancelling today's planned task marks occurrence cancelled", async () => {
    const today = toStartOfDayUTC(new Date());

    const task = await TaskService.createTask(userA, {
      title: "Cancelled Meeting Prep",
      plannedDate: today,
    });

    await TaskService.updateTask(userA, task._id.toString(), {
      status: "cancelled",
    });

    const occ = await TaskOccurrence.findOne({
      userId: userA,
      taskId: task._id,
      date: today,
    });

    assert.ok(occ);
    assert.equal(occ.outcome, "cancelled");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // I. Duplicate occurrence creation is prevented
  // ─────────────────────────────────────────────────────────────────────────────
  it("I: Duplicate occurrence creation is prevented by unique constraint", async () => {
    const date = toStartOfDayUTC("2026-10-15");
    const task = await TaskService.createTask(userA, {
      title: "Idempotent Planning",
      plannedDate: date,
    });

    // Attempt second ensure on same date
    const duplicateAttempt = await TaskOccurrenceService.ensureOccurrence(userA, {
      taskId: task._id,
      date,
    });

    const count = await TaskOccurrence.countDocuments({
      userId: userA,
      taskId: task._id,
      date,
    });

    assert.equal(count, 1, "Exactly one occurrence must exist for that date");
    assert.ok(duplicateAttempt._id);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // J. User cannot manipulate another user's occurrence
  // ─────────────────────────────────────────────────────────────────────────────
  it("J: User cannot manipulate another user's occurrence", async () => {
    const date = toStartOfDayUTC("2026-10-20");
    const taskA = await TaskService.createTask(userA, {
      title: "User A Confidential",
      plannedDate: date,
    });

    const occA = await TaskOccurrence.findOne({
      userId: userA,
      taskId: taskA._id,
    });

    // User B tries to record outcome on User A's occurrence
    await assert.rejects(
      async () => {
        await TaskOccurrenceService.recordOutcome(userB, occA._id, {
          outcome: "completed",
        });
      },
      /Task occurrence not found or access denied/
    );

    // User B tries to reschedule User A's occurrence
    await assert.rejects(
      async () => {
        await TaskOccurrenceService.reschedule(
          userB,
          occA._id,
          toStartOfDayUTC("2026-10-21")
        );
      },
      /Task occurrence not found or access denied/
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // K. Task deletion preserves TaskOccurrence
  // ─────────────────────────────────────────────────────────────────────────────
  it("K: Task deletion preserves TaskOccurrence with taskSnapshot", async () => {
    const date = toStartOfDayUTC("2026-10-22");
    const task = await TaskService.createTask(userA, {
      title: "Deleted Task Occurrence Audit",
      plannedDate: date,
      priority: "high",
    });

    // Delete the task via TaskService
    await TaskService.deleteTask(userA, task._id.toString());

    // Verify task is deleted
    const deleted = await Task.findById(task._id);
    assert.equal(deleted, null);

    // Query occurrences via TaskOccurrenceService
    const occurrences = await TaskOccurrenceService.getOccurrences(userA, {
      date,
    });

    const occ = occurrences.find((o) => o.taskId === null);
    assert.ok(occ, "Occurrence must persist after task deletion");
    assert.equal(occ.taskTitle, "Deleted Task Occurrence Audit");
    assert.equal(occ.taskPriority, "high");
    assert.equal(occ.isTaskDeleted, true);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // L. Explicit rescheduling never becomes missed
  // ─────────────────────────────────────────────────────────────────────────────
  it("L: Explicit rescheduling never becomes missed", async () => {
    const pastDate = toStartOfDayUTC("2026-08-01");
    const futureDate = toStartOfDayUTC("2026-08-05");

    const task = await TaskService.createTask(userA, {
      title: "Early August Milestone",
      plannedDate: pastDate,
    });

    const occ = await TaskOccurrence.findOne({
      userId: userA,
      taskId: task._id,
      date: pastDate,
    });

    // Explicitly reschedule
    await TaskOccurrenceService.reschedule(userA, occ._id, futureDate);

    // Run missed occurrence evaluation as of today
    await TaskOccurrenceService.evaluateMissedOccurrences(userA, new Date());

    const verified = await TaskOccurrence.findById(occ._id);
    assert.equal(
      verified.outcome,
      "rescheduled",
      "Rescheduled occurrence must NOT become missed"
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // M. Existing Tasks without occurrences remain valid and update cleanly
  // ─────────────────────────────────────────────────────────────────────────────
  it("M: Existing Tasks without occurrences remain valid and update cleanly", async () => {
    // Insert raw Task mimicking legacy task without TaskOccurrence
    const legacyTask = await Task.create({
      user: userA,
      title: "Pre-V2 Legacy Task",
      priority: "medium",
      status: "todo",
      // plannedDate omitted
    });

    // Updating non-planning fields does not crash
    const updated1 = await TaskService.updateTask(userA, legacyTask._id.toString(), {
      title: "Pre-V2 Legacy Task Renamed",
    });
    assert.equal(updated1.title, "Pre-V2 Legacy Task Renamed");

    // Later setting plannedDate lazily creates the occurrence
    const plannedDay = toStartOfDayUTC("2026-11-01");
    await TaskService.updateTask(userA, legacyTask._id.toString(), {
      plannedDate: plannedDay,
    });

    const occ = await TaskOccurrence.findOne({
      userId: userA,
      taskId: legacyTask._id,
      date: plannedDay,
    });
    assert.ok(occ, "Occurrence is lazily created on subsequent planning");
    assert.equal(occ.outcome, "pending");
  });
});
