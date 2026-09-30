import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import Task from "../models/taskModel.js";
import TaskOccurrence from "../models/taskOccurrenceModel.js";
import Streak from "../models/streakModel.js";
import DailyStats from "../models/dailyStatsModel.js";
import StreakService from "../services/streakService.js";
import TaskOccurrenceService from "../services/taskOccurrenceService.js";
import TaskService from "../services/taskService.js";
import { toStartOfDayUTC } from "../utils/dateUtils.js";

const TEST_DB_URI = "mongodb://localhost:27017/athena_dailystats_correctness_test";

describe("DailyStats + TaskOccurrence State Representation & Invariants", () => {
  const user1 = new mongoose.Types.ObjectId();
  const user2 = new mongoose.Types.ObjectId();

  before(async () => {
    await mongoose.connect(TEST_DB_URI);
    await Promise.all([
      Task.deleteMany({ user: { $in: [user1, user2] } }),
      TaskOccurrence.deleteMany({ userId: { $in: [user1, user2] } }),
      Streak.deleteMany({ userId: { $in: [user1, user2] } }),
      DailyStats.deleteMany({ userId: { $in: [user1, user2] } }),
    ]);
  });

  after(async () => {
    await Promise.all([
      Task.deleteMany({ user: { $in: [user1, user2] } }),
      TaskOccurrence.deleteMany({ userId: { $in: [user1, user2] } }),
      Streak.deleteMany({ userId: { $in: [user1, user2] } }),
      DailyStats.deleteMany({ userId: { $in: [user1, user2] } }),
    ]);
    await mongoose.connection.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Invariant 1: State Representation & Transitions (No Event Accumulation)
  // ─────────────────────────────────────────────────────────────────────────────
  it("Invariant 1: State transitions pending -> completed -> completed -> pending -> rescheduled -> completed", async () => {
    const today = toStartOfDayUTC("2026-10-15");

    // Step 1: Create task planned for today -> pending
    const task = await TaskService.createTask(user1, {
      title: "State Representation Task",
      plannedDate: today,
    });

    let occ = await TaskOccurrence.findOne({ userId: user1, taskId: task._id, date: today });
    assert.equal(occ.outcome, "pending");

    let summary = await StreakService.processDailyStreak(user1, today);
    let stats = await DailyStats.findOne({ userId: user1, date: today });
    assert.equal(stats.tasksCompleted, 0);
    assert.equal(stats.totalPlanned, 1);
    assert.equal(stats.effectivePlanned, 1);
    assert.equal(summary.streakCount, 0);

    // Step 2: pending -> completed
    await TaskService.updateTask(user1, task._id, { status: "completed" }, today);
    occ = await TaskOccurrence.findOne({ userId: user1, taskId: task._id, date: today });
    assert.equal(occ.outcome, "completed");

    summary = await StreakService.processDailyStreak(user1, today);
    stats = await DailyStats.findOne({ userId: user1, date: today });
    assert.equal(stats.tasksCompleted, 1);
    assert.equal(stats.completionRate, 1.0);
    assert.equal(stats.state, "green");
    assert.equal(summary.currentStreak, 1);
    assert.equal(summary.longestStreak, 1);

    // Step 3: completed -> completed (redundant update/process)
    await TaskService.updateTask(user1, task._id, { status: "completed" }, today);
    summary = await StreakService.processDailyStreak(user1, today);
    stats = await DailyStats.findOne({ userId: user1, date: today });
    assert.equal(stats.tasksCompleted, 1, "tasksCompleted must not increment on repeated completed");
    assert.equal(summary.currentStreak, 1, "currentStreak must not double increment");
    assert.equal(summary.longestStreak, 1);

    // Step 4: completed -> pending (reopen)
    await TaskService.updateTask(user1, task._id, { status: "todo" }, today);
    occ = await TaskOccurrence.findOne({ userId: user1, taskId: task._id, date: today });
    assert.equal(occ.outcome, "pending");

    summary = await StreakService.processDailyStreak(user1, today);
    stats = await DailyStats.findOne({ userId: user1, date: today });
    assert.equal(stats.tasksCompleted, 0, "tasksCompleted must revert to 0 on reopen");
    assert.equal(stats.completionRate, 0);
    assert.equal(stats.state, "neutral");
    assert.equal(summary.currentStreak, 0, "currentStreak must revert on reopen");

    // Step 5: pending -> rescheduled (move to tomorrow)
    const tomorrow = toStartOfDayUTC("2026-10-16");
    await TaskService.updateTask(user1, task._id, { plannedDate: tomorrow }, today);

    const todayOcc = await TaskOccurrence.findOne({ userId: user1, taskId: task._id, date: today });
    const tomorrowOcc = await TaskOccurrence.findOne({ userId: user1, taskId: task._id, date: tomorrow });
    assert.equal(todayOcc.outcome, "rescheduled");
    assert.equal(tomorrowOcc.outcome, "pending");

    summary = await StreakService.processDailyStreak(user1, today);
    stats = await DailyStats.findOne({ userId: user1, date: today });
    assert.equal(stats.tasksRescheduled, 1);
    assert.equal(stats.tasksCompleted, 0);
    assert.equal(stats.effectivePlanned, 0, "Rescheduled task excluded from effectivePlanned");
    assert.equal(stats.state, "neutral");

    // Step 6: rescheduled destination -> completed on tomorrow
    await TaskService.updateTask(user1, task._id, { status: "completed" }, tomorrow);
    const completedTomorrowOcc = await TaskOccurrence.findOne({
      userId: user1,
      taskId: task._id,
      date: tomorrow,
    });
    // Complete tomorrow's occurrence
    await TaskOccurrenceService.recordOutcome(user1, completedTomorrowOcc._id, {
      outcome: "completed",
    });

    const tomorrowSummary = await StreakService.processDailyStreak(user1, tomorrow);
    const tomorrowStats = await DailyStats.findOne({ userId: user1, date: tomorrow });
    assert.equal(tomorrowStats.tasksCompleted, 1);
    assert.equal(tomorrowStats.effectivePlanned, 1);
    assert.equal(tomorrowStats.completionRate, 1.0);
    assert.equal(tomorrowSummary.state, "green");

    // Today's stats remain pristine and non-double-counted
    const recheckedTodayStats = await DailyStats.findOne({ userId: user1, date: today });
    assert.equal(recheckedTodayStats.tasksCompleted, 0);
    assert.equal(recheckedTodayStats.tasksRescheduled, 1);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Invariant 2: Completed Occurrence Safe Recalculation (No Corruption)
  // ─────────────────────────────────────────────────────────────────────────────
  it("Invariant 2: Multiple recalculations of completed occurrence do not corrupt counters or streak", async () => {
    const testDate = toStartOfDayUTC("2026-10-20");
    const task = await TaskService.createTask(user2, {
      title: "Recalculation Invariant Task",
      plannedDate: testDate,
    }, testDate);
    await TaskService.updateTask(user2, task._id, { status: "completed" }, testDate);

    // Process daily streak 5 times in succession
    for (let i = 1; i <= 5; i++) {
      const summary = await StreakService.processDailyStreak(user2, testDate);
      const stats = await DailyStats.findOne({ userId: user2, date: testDate });

      assert.equal(stats.tasksCompleted, 1, `tasksCompleted must remain 1 on iteration ${i}`);
      assert.equal(stats.totalPlanned, 1, `totalPlanned must remain 1 on iteration ${i}`);
      assert.equal(stats.effectivePlanned, 1, `effectivePlanned must remain 1 on iteration ${i}`);
      assert.equal(stats.completionRate, 1.0, `completionRate must remain 1.0 on iteration ${i}`);
      assert.equal(stats.state, "green");
      assert.equal(summary.currentStreak, 1, `currentStreak must remain 1 on iteration ${i}`);
      assert.equal(summary.longestStreak, 1, `longestStreak must remain 1 on iteration ${i}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Invariant 3: Overdue Behavior (Pending -> Missed, Others Immutable)
  // ─────────────────────────────────────────────────────────────────────────────
  it("Invariant 3: Overdue transitions pending -> missed, but strictly preserves rescheduled, cancelled, completed, and partially_completed", async () => {
    const pastDate = toStartOfDayUTC("2026-09-01");
    const today = toStartOfDayUTC("2026-10-01");

    const user3 = new mongoose.Types.ObjectId();

    // Create 5 occurrences on pastDate with each distinct outcome
    const tPending = await Task.create({ user: user3, title: "Pending" });
    const occPending = await TaskOccurrence.create({
      userId: user3,
      taskId: tPending._id,
      date: pastDate,
      outcome: "pending",
    });

    const tRescheduled = await Task.create({ user: user3, title: "Rescheduled" });
    const occRescheduled = await TaskOccurrence.create({
      userId: user3,
      taskId: tRescheduled._id,
      date: pastDate,
      outcome: "rescheduled",
      rescheduledTo: today,
    });

    const tCancelled = await Task.create({ user: user3, title: "Cancelled" });
    const occCancelled = await TaskOccurrence.create({
      userId: user3,
      taskId: tCancelled._id,
      date: pastDate,
      outcome: "cancelled",
    });

    const tCompleted = await Task.create({ user: user3, title: "Completed" });
    const occCompleted = await TaskOccurrence.create({
      userId: user3,
      taskId: tCompleted._id,
      date: pastDate,
      outcome: "completed",
    });

    const tPartial = await Task.create({ user: user3, title: "Partial" });
    const occPartial = await TaskOccurrence.create({
      userId: user3,
      taskId: tPartial._id,
      date: pastDate,
      outcome: "partially_completed",
    });

    // Run missed evaluation as of today
    await TaskOccurrenceService.evaluateMissedOccurrences(user3, today);

    // Verify outcomes
    const verifiedPending = await TaskOccurrence.findById(occPending._id);
    const verifiedRescheduled = await TaskOccurrence.findById(occRescheduled._id);
    const verifiedCancelled = await TaskOccurrence.findById(occCancelled._id);
    const verifiedCompleted = await TaskOccurrence.findById(occCompleted._id);
    const verifiedPartial = await TaskOccurrence.findById(occPartial._id);

    assert.equal(verifiedPending.outcome, "missed", "Pending past occurrence MUST become missed");
    assert.equal(verifiedRescheduled.outcome, "rescheduled", "Rescheduled past occurrence must NOT become missed");
    assert.equal(verifiedCancelled.outcome, "cancelled", "Cancelled past occurrence must NOT become missed");
    assert.equal(verifiedCompleted.outcome, "completed", "Completed past occurrence must NOT become missed");
    assert.equal(verifiedPartial.outcome, "partially_completed", "Partially completed past occurrence must NOT become missed");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Invariant 4: Explicit Inspection: Planned Monday -> Missed -> Completed Tuesday
  // ─────────────────────────────────────────────────────────────────────────────
  it("Invariant 4: Task planned Monday becomes missed; completing task Tuesday updates Task without rewriting Monday history", async () => {
    const monday = toStartOfDayUTC("2026-10-05");
    const tuesday = toStartOfDayUTC("2026-10-06");

    const user4 = new mongoose.Types.ObjectId();

    // 1. Task created for Monday
    const task = await TaskService.createTask(user4, {
      title: "Monday Task",
      plannedDate: monday,
    });
    const mondayOcc = await TaskOccurrence.findOne({ userId: user4, taskId: task._id, date: monday });
    assert.equal(mondayOcc.outcome, "pending");

    // 2. Tuesday arrives -> Monday occurrence transitions to missed
    await TaskOccurrenceService.evaluateMissedOccurrences(user4, tuesday);
    const missedMondayOcc = await TaskOccurrence.findById(mondayOcc._id);
    assert.equal(missedMondayOcc.outcome, "missed");

    // 3. User marks the task completed on Tuesday
    const updatedTask = await TaskService.updateTask(user4, task._id, { status: "completed" });
    assert.equal(updatedTask.status, "completed");

    // Verify Monday occurrence is STILL missed (historical truth preserved)
    const preservedMondayOcc = await TaskOccurrence.findById(mondayOcc._id);
    assert.equal(
      preservedMondayOcc.outcome,
      "missed",
      "Monday occurrence must remain missed and not be rewritten to completed"
    );

    // Verify Tuesday has no automatic occurrence (unless user explicitly planned/rescheduled for Tuesday)
    const tuesdayOcc = await TaskOccurrence.findOne({ userId: user4, taskId: task._id, date: tuesday });
    assert.equal(
      tuesdayOcc,
      null,
      "No automatic occurrence created for Tuesday without explicit planning"
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Invariant 5: Concurrent / Repeated processDailyStreak Calls Cannot Double Increment
  // ─────────────────────────────────────────────────────────────────────────────
  it("Invariant 5: Concurrent processDailyStreak calls cannot increment the same day twice", async () => {
    const user5 = new mongoose.Types.ObjectId();
    const testDate = toStartOfDayUTC("2026-10-25");

    const task = await TaskService.createTask(user5, {
      title: "Concurrent Task",
      plannedDate: testDate,
    }, testDate);
    await TaskService.updateTask(user5, task._id, { status: "completed" }, testDate);

    // Fire 10 concurrent processDailyStreak calls simultaneously
    const results = await Promise.all([
      StreakService.processDailyStreak(user5, testDate),
      StreakService.processDailyStreak(user5, testDate),
      StreakService.processDailyStreak(user5, testDate),
      StreakService.processDailyStreak(user5, testDate),
      StreakService.processDailyStreak(user5, testDate),
      StreakService.processDailyStreak(user5, testDate),
      StreakService.processDailyStreak(user5, testDate),
      StreakService.processDailyStreak(user5, testDate),
      StreakService.processDailyStreak(user5, testDate),
      StreakService.processDailyStreak(user5, testDate),
    ]);

    for (const res of results) {
      assert.equal(res.currentStreak, 1, "Concurrent call must not increment streak beyond 1");
    }

    const finalStreakDoc = await Streak.findOne({ userId: user5 });
    assert.equal(finalStreakDoc.currentStreak, 1, "Database streak must be exactly 1");
    assert.equal(finalStreakDoc.longestStreak, 1, "Database longestStreak must be exactly 1");

    const finalStatsDoc = await DailyStats.findOne({ userId: user5, date: testDate });
    assert.equal(finalStatsDoc.tasksCompleted, 1, "Database tasksCompleted must be exactly 1");
  });
});
