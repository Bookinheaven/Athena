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

const TEST_DB_URI = "mongodb://localhost:27017/athena_streak_v2_test";

describe("Unified Daily Outcome + Streak V2 Integration Test Suite", () => {
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  before(async () => {
    await mongoose.connect(TEST_DB_URI);
    await Promise.all([
      Task.deleteMany({ user: { $in: [userA, userB] } }),
      TaskOccurrence.deleteMany({ userId: { $in: [userA, userB] } }),
      Streak.deleteMany({ userId: { $in: [userA, userB] } }),
      DailyStats.deleteMany({ userId: { $in: [userA, userB] } }),
    ]);
  });

  after(async () => {
    await Promise.all([
      Task.deleteMany({ user: { $in: [userA, userB] } }),
      TaskOccurrence.deleteMany({ userId: { $in: [userA, userB] } }),
      Streak.deleteMany({ userId: { $in: [userA, userB] } }),
      DailyStats.deleteMany({ userId: { $in: [userA, userB] } }),
    ]);
    await mongoose.connection.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // A. No plan → neutral
  // ─────────────────────────────────────────────────────────────────────────────
  it("A: No plan → neutral", async () => {
    const testDate = toStartOfDayUTC("2026-10-01");
    const summary = await StreakService.processDailyStreak(userA, testDate);

    assert.equal(summary.state, "neutral");
    assert.equal(summary.resultType, "neutral");
    assert.equal(summary.plannedCount, 0);
    assert.equal(summary.effectivePlanned, 0);
    assert.equal(summary.streakCount, 0);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // B. 100% completion → successful
  // ─────────────────────────────────────────────────────────────────────────────
  it("B: 100% completion → successful", async () => {
    const testDate = toStartOfDayUTC("2026-10-02");
    for (let i = 1; i <= 3; i++) {
      const task = await Task.create({
        user: userA,
        title: `Task B${i}`,
        plannedDate: testDate,
        status: "completed",
      });
      await TaskOccurrence.create({
        userId: userA,
        taskId: task._id,
        date: testDate,
        outcome: "completed",
        completedAt: new Date(),
      });
    }

    const summary = await StreakService.processDailyStreak(userA, testDate);
    assert.equal(summary.state, "green");
    assert.equal(summary.resultType, "success");
    assert.equal(summary.completedCount, 3);
    assert.equal(summary.effectivePlanned, 3);
    assert.equal(summary.completionRate, 1.0);
    assert.equal(summary.streakCount, 1);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // C. 80% completion → successful
  // ─────────────────────────────────────────────────────────────────────────────
  it("C: 80% completion → successful", async () => {
    const testDate = toStartOfDayUTC("2026-10-03");
    // 4 completed, 1 missed = 80%
    for (let i = 1; i <= 4; i++) {
      const task = await Task.create({
        user: userA,
        title: `Task C_comp_${i}`,
        plannedDate: testDate,
        status: "completed",
      });
      await TaskOccurrence.create({
        userId: userA,
        taskId: task._id,
        date: testDate,
        outcome: "completed",
      });
    }
    const missedTask = await Task.create({
      user: userA,
      title: "Task C_missed",
      plannedDate: testDate,
    });
    await TaskOccurrence.create({
      userId: userA,
      taskId: missedTask._id,
      date: testDate,
      outcome: "missed",
    });

    const summary = await StreakService.processDailyStreak(userA, testDate);
    assert.equal(summary.effectivePlanned, 5);
    assert.equal(summary.completedCount, 4);
    assert.equal(summary.completionRate, 0.8);
    assert.equal(summary.state, "green");
    assert.equal(summary.resultType, "success");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // D. 79% → partial/failed
  // ─────────────────────────────────────────────────────────────────────────────
  it("D: 79% → partial/failed", async () => {
    const testDate = toStartOfDayUTC("2026-10-04");
    // 7 completed (7.0) + 1 partial (0.5) + 2 missed (0) = 7.5 / 10 = 75% (< 80%)
    for (let i = 1; i <= 7; i++) {
      const task = await Task.create({
        user: userA,
        title: `Task D_comp_${i}`,
        plannedDate: testDate,
      });
      await TaskOccurrence.create({
        userId: userA,
        taskId: task._id,
        date: testDate,
        outcome: "completed",
      });
    }
    const partTask = await Task.create({
      user: userA,
      title: "Task D_part",
      plannedDate: testDate,
    });
    await TaskOccurrence.create({
      userId: userA,
      taskId: partTask._id,
      date: testDate,
      outcome: "partially_completed",
    });
    for (let i = 1; i <= 2; i++) {
      const task = await Task.create({
        user: userA,
        title: `Task D_miss_${i}`,
        plannedDate: testDate,
      });
      await TaskOccurrence.create({
        userId: userA,
        taskId: task._id,
        date: testDate,
        outcome: "missed",
      });
    }

    const evalResult = StreakService.evaluateOccurrencesArray(
      await TaskOccurrence.find({ userId: userA, date: testDate }),
      false
    );
    assert.equal(evalResult.effectivePlanned, 10);
    assert.equal(evalResult.completionRate, 0.75);
    assert.equal(evalResult.state, "yellow");
    assert.equal(evalResult.resultType, "partial");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // E. Rescheduled excluded from denominator
  // ─────────────────────────────────────────────────────────────────────────────
  it("E: Rescheduled excluded from denominator", async () => {
    const testDate = toStartOfDayUTC("2026-10-05");
    // 4 completed, 1 rescheduled = effective 4/4 = 100%
    for (let i = 1; i <= 4; i++) {
      const task = await Task.create({
        user: userA,
        title: `Task E_comp_${i}`,
        plannedDate: testDate,
      });
      await TaskOccurrence.create({
        userId: userA,
        taskId: task._id,
        date: testDate,
        outcome: "completed",
      });
    }
    const reschedTask = await Task.create({
      user: userA,
      title: "Task E_resched",
      plannedDate: testDate,
    });
    await TaskOccurrence.create({
      userId: userA,
      taskId: reschedTask._id,
      date: testDate,
      outcome: "rescheduled",
      rescheduledTo: toStartOfDayUTC("2026-10-06"),
    });

    const evalResult = StreakService.evaluateOccurrencesArray(
      await TaskOccurrence.find({ userId: userA, date: testDate }),
      true
    );
    assert.equal(evalResult.totalPlanned, 5);
    assert.equal(evalResult.effectivePlanned, 4);
    assert.equal(evalResult.completed, 4);
    assert.equal(evalResult.completionRate, 1.0);
    assert.equal(evalResult.state, "green");
    assert.equal(evalResult.resultType, "success");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // F. Cancelled excluded from denominator
  // ─────────────────────────────────────────────────────────────────────────────
  it("F: Cancelled excluded from denominator", async () => {
    const testDate = toStartOfDayUTC("2026-10-06");
    // 4 completed, 1 cancelled = effective 4/4 = 100%
    for (let i = 1; i <= 4; i++) {
      const task = await Task.create({
        user: userA,
        title: `Task F_comp_${i}`,
        plannedDate: testDate,
      });
      await TaskOccurrence.create({
        userId: userA,
        taskId: task._id,
        date: testDate,
        outcome: "completed",
      });
    }
    const cancTask = await Task.create({
      user: userA,
      title: "Task F_canc",
      plannedDate: testDate,
    });
    await TaskOccurrence.create({
      userId: userA,
      taskId: cancTask._id,
      date: testDate,
      outcome: "cancelled",
    });

    const evalResult = StreakService.evaluateOccurrencesArray(
      await TaskOccurrence.find({ userId: userA, date: testDate }),
      true
    );
    assert.equal(evalResult.totalPlanned, 5);
    assert.equal(evalResult.effectivePlanned, 4);
    assert.equal(evalResult.completionRate, 1.0);
    assert.equal(evalResult.state, "green");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // G. Missed included in denominator
  // ─────────────────────────────────────────────────────────────────────────────
  it("G: Missed included in denominator", async () => {
    const testDate = toStartOfDayUTC("2026-10-07");
    // 3 completed, 2 missed = effective 5, rate 3/5 = 60%
    for (let i = 1; i <= 3; i++) {
      const task = await Task.create({
        user: userA,
        title: `Task G_comp_${i}`,
        plannedDate: testDate,
      });
      await TaskOccurrence.create({
        userId: userA,
        taskId: task._id,
        date: testDate,
        outcome: "completed",
      });
    }
    for (let i = 1; i <= 2; i++) {
      const task = await Task.create({
        user: userA,
        title: `Task G_miss_${i}`,
        plannedDate: testDate,
      });
      await TaskOccurrence.create({
        userId: userA,
        taskId: task._id,
        date: testDate,
        outcome: "missed",
      });
    }

    const evalResult = StreakService.evaluateOccurrencesArray(
      await TaskOccurrence.find({ userId: userA, date: testDate }),
      false
    );
    assert.equal(evalResult.effectivePlanned, 5);
    assert.equal(evalResult.completionRate, 0.6);
    assert.equal(evalResult.state, "yellow");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // H. Partial completion weighted consistently
  // ─────────────────────────────────────────────────────────────────────────────
  it("H: Partial completion weighted consistently", async () => {
    // 2 completed (2.0) + 2 partially_completed (1.0) = 3.0 / 4 = 75% -> partial (<80%)
    const occs1 = [
      { outcome: "completed" },
      { outcome: "completed" },
      { outcome: "partially_completed" },
      { outcome: "partially_completed" },
    ];
    const eval1 = StreakService.evaluateOccurrencesArray(occs1, false);
    assert.equal(eval1.completionRate, 0.75);
    assert.equal(eval1.state, "yellow");

    // 3 completed (3.0) + 2 partially_completed (1.0) = 4.0 / 5 = 80% -> successful
    const occs2 = [
      { outcome: "completed" },
      { outcome: "completed" },
      { outcome: "completed" },
      { outcome: "partially_completed" },
      { outcome: "partially_completed" },
    ];
    const eval2 = StreakService.evaluateOccurrencesArray(occs2, false);
    assert.equal(eval2.completionRate, 0.8);
    assert.equal(eval2.state, "green");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // I. Successful day increments streak once
  // ─────────────────────────────────────────────────────────────────────────────
  it("I: Successful day increments streak once", async () => {
    const userI = new mongoose.Types.ObjectId();
    const testDate = toStartOfDayUTC("2026-11-01");

    const task = await Task.create({
      user: userI,
      title: "Task I",
      plannedDate: testDate,
    });
    await TaskOccurrence.create({
      userId: userI,
      taskId: task._id,
      date: testDate,
      outcome: "completed",
    });

    const summary = await StreakService.processDailyStreak(userI, testDate);
    assert.equal(summary.currentStreak, 1);
    assert.equal(summary.longestStreak, 1);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // J. Repeated evaluation same day is idempotent
  // ─────────────────────────────────────────────────────────────────────────────
  it("J: Repeated evaluation same day is idempotent", async () => {
    const userJ = new mongoose.Types.ObjectId();
    const testDate = toStartOfDayUTC("2026-11-02");

    const task = await Task.create({
      user: userJ,
      title: "Task J",
      plannedDate: testDate,
    });
    await TaskOccurrence.create({
      userId: userJ,
      taskId: task._id,
      date: testDate,
      outcome: "completed",
    });

    const run1 = await StreakService.processDailyStreak(userJ, testDate);
    const run2 = await StreakService.processDailyStreak(userJ, testDate);
    const run3 = await StreakService.processDailyStreak(userJ, testDate);

    assert.equal(run1.currentStreak, 1);
    assert.equal(run2.currentStreak, 1);
    assert.equal(run3.currentStreak, 1);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // K. Neutral day does not increment streak
  // ─────────────────────────────────────────────────────────────────────────────
  it("K: Neutral day does not increment streak", async () => {
    const userK = new mongoose.Types.ObjectId();
    const day1 = toStartOfDayUTC("2026-11-03");
    const day2 = toStartOfDayUTC("2026-11-04");

    // Day 1: 100% completed
    const task1 = await Task.create({
      user: userK,
      title: "Task K1",
      plannedDate: day1,
    });
    await TaskOccurrence.create({
      userId: userK,
      taskId: task1._id,
      date: day1,
      outcome: "completed",
    });
    await StreakService.processDailyStreak(userK, day1);

    // Day 2: No tasks planned (neutral)
    const summaryDay2 = await StreakService.processDailyStreak(userK, day2);
    assert.equal(summaryDay2.currentStreak, 1, "Neutral day should not increase streak");
    assert.equal(summaryDay2.state, "neutral");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // L. Neutral day does not break streak
  // ─────────────────────────────────────────────────────────────────────────────
  it("L: Neutral day does not break streak", async () => {
    const userL = new mongoose.Types.ObjectId();
    const day1 = toStartOfDayUTC("2026-11-05");
    const day2 = toStartOfDayUTC("2026-11-06");
    const day3 = toStartOfDayUTC("2026-11-07");

    // Day 1: Success
    const task1 = await Task.create({
      user: userL,
      title: "Task L1",
      plannedDate: day1,
    });
    await TaskOccurrence.create({
      userId: userL,
      taskId: task1._id,
      date: day1,
      outcome: "completed",
    });
    await StreakService.processDailyStreak(userL, day1);

    // Day 2: All tasks rescheduled (neutral)
    const task2 = await Task.create({
      user: userL,
      title: "Task L2",
      plannedDate: day2,
    });
    await TaskOccurrence.create({
      userId: userL,
      taskId: task2._id,
      date: day2,
      outcome: "rescheduled",
      rescheduledTo: day3,
    });
    await StreakService.processDailyStreak(userL, day2);

    // Day 3 arrives: complete day 3 task
    await TaskOccurrence.create({
      userId: userL,
      taskId: task2._id,
      date: day3,
      outcome: "completed",
    });
    const summaryDay3 = await StreakService.processDailyStreak(userL, day3);

    assert.equal(
      summaryDay3.currentStreak,
      2,
      "Streak should continue from 1 to 2 across neutral day"
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // M. Failed/partial day breaks streak
  // ─────────────────────────────────────────────────────────────────────────────
  it("M: Failed/partial day breaks streak", async () => {
    const userM = new mongoose.Types.ObjectId();
    const day1 = toStartOfDayUTC("2026-11-08");
    const day2 = toStartOfDayUTC("2026-11-09");
    const day3 = toStartOfDayUTC("2026-11-10");

    // Day 1: Success
    const task1 = await Task.create({
      user: userM,
      title: "Task M1",
      plannedDate: day1,
    });
    await TaskOccurrence.create({
      userId: userM,
      taskId: task1._id,
      date: day1,
      outcome: "completed",
    });
    await StreakService.processDailyStreak(userM, day1);

    // Day 2: 1 completed, 2 missed = 33% (< 80% -> partial/failed)
    const task2 = await Task.create({
      user: userM,
      title: "Task M2",
      plannedDate: day2,
    });
    await TaskOccurrence.create({
      userId: userM,
      taskId: task2._id,
      date: day2,
      outcome: "completed",
    });
    for (let i = 1; i <= 2; i++) {
      const taskMiss = await Task.create({
        user: userM,
        title: `Task M_miss_${i}`,
        plannedDate: day2,
      });
      await TaskOccurrence.create({
        userId: userM,
        taskId: taskMiss._id,
        date: day2,
        outcome: "missed",
      });
    }

    // Day 3 arrives
    const summaryDay3 = await StreakService.processDailyStreak(userM, day3);
    assert.equal(
      summaryDay3.currentStreak,
      0,
      "Day 2 partial/failed day should have broken the streak to 0"
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // N. Longest streak updates correctly
  // ─────────────────────────────────────────────────────────────────────────────
  it("N: Longest streak updates correctly", async () => {
    const userN = new mongoose.Types.ObjectId();
    const day1 = toStartOfDayUTC("2026-11-11");
    const day2 = toStartOfDayUTC("2026-11-12");
    const day3 = toStartOfDayUTC("2026-11-13");
    const day4 = toStartOfDayUTC("2026-11-14");

    // Day 1: Success -> streak = 1, longest = 1
    const t1 = await Task.create({ user: userN, title: "N1", plannedDate: day1 });
    await TaskOccurrence.create({ userId: userN, taskId: t1._id, date: day1, outcome: "completed" });
    const s1 = await StreakService.processDailyStreak(userN, day1);
    assert.equal(s1.currentStreak, 1);
    assert.equal(s1.longestStreak, 1);

    // Day 2: Success -> streak = 2, longest = 2
    const t2 = await Task.create({ user: userN, title: "N2", plannedDate: day2 });
    await TaskOccurrence.create({ userId: userN, taskId: t2._id, date: day2, outcome: "completed" });
    const s2 = await StreakService.processDailyStreak(userN, day2);
    assert.equal(s2.currentStreak, 2);
    assert.equal(s2.longestStreak, 2);

    // Day 3: Failed -> streak = 0, longest stays 2
    const t3 = await Task.create({ user: userN, title: "N3", plannedDate: day3 });
    await TaskOccurrence.create({ userId: userN, taskId: t3._id, date: day3, outcome: "missed" });
    const s3 = await StreakService.processDailyStreak(userN, day4); // Day 4 as of date
    assert.equal(s3.currentStreak, 0);
    assert.equal(s3.longestStreak, 2, "Longest streak should remain 2 after break");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // O. Future task completion does not complete future occurrence incorrectly
  // ─────────────────────────────────────────────────────────────────────────────
  it("O: Future task completion does not complete future occurrence incorrectly", async () => {
    const futureDate = toStartOfDayUTC("2026-12-25");
    const task = await TaskService.createTask(userA, {
      title: "Christmas Goal",
      plannedDate: futureDate,
    });

    const futureOcc = await TaskOccurrence.findOne({
      userId: userA,
      taskId: task._id,
      date: futureDate,
    });
    assert.ok(futureOcc, "Future occurrence exists");
    assert.equal(futureOcc.outcome, "pending");

    // Complete task today via taskService
    await TaskService.updateTask(userA, task._id, { status: "completed" });

    // Verify future occurrence is STILL pending
    const verifiedFutureOcc = await TaskOccurrence.findById(futureOcc._id);
    assert.equal(
      verifiedFutureOcc.outcome,
      "pending",
      "Completing a future-dated task today must not complete future occurrence"
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // P. Rescheduled never becomes missed
  // ─────────────────────────────────────────────────────────────────────────────
  it("P: Rescheduled never becomes missed", async () => {
    const pastDate = toStartOfDayUTC("2026-09-01");
    const today = toStartOfDayUTC("2026-10-01");

    const occ = await TaskOccurrence.create({
      userId: userA,
      taskId: new mongoose.Types.ObjectId(),
      date: pastDate,
      outcome: "rescheduled",
      rescheduledTo: today,
    });

    await TaskOccurrenceService.evaluateMissedOccurrences(userA, today);

    const verified = await TaskOccurrence.findById(occ._id);
    assert.equal(verified.outcome, "rescheduled");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Q. Cancelled never becomes missed
  // ─────────────────────────────────────────────────────────────────────────────
  it("Q: Cancelled never becomes missed", async () => {
    const pastDate = toStartOfDayUTC("2026-09-02");
    const today = toStartOfDayUTC("2026-10-01");

    const occ = await TaskOccurrence.create({
      userId: userA,
      taskId: new mongoose.Types.ObjectId(),
      date: pastDate,
      outcome: "cancelled",
    });

    await TaskOccurrenceService.evaluateMissedOccurrences(userA, today);

    const verified = await TaskOccurrence.findById(occ._id);
    assert.equal(verified.outcome, "cancelled");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // R. Multiple sessions cannot increment streak twice
  // ─────────────────────────────────────────────────────────────────────────────
  it("R: Multiple sessions cannot increment streak twice", async () => {
    const userR = new mongoose.Types.ObjectId();
    const testDate = toStartOfDayUTC("2026-11-20");

    // Complete 1 task -> streak = 1
    const t = await Task.create({ user: userR, title: "R1", plannedDate: testDate });
    await TaskOccurrence.create({ userId: userR, taskId: t._id, date: testDate, outcome: "completed" });
    await StreakService.processDailyStreak(userR, testDate);

    // Complete 3 focus sessions on that day
    await StreakService.dailyStreakUpdate(userR, 25, testDate);
    await StreakService.dailyStreakUpdate(userR, 30, testDate);
    await StreakService.dailyStreakUpdate(userR, 45, testDate);

    const summary = await StreakService.getSummaryData(userR, testDate);
    assert.equal(summary.sessions, 3);
    assert.equal(summary.focusMinutes, 100);
    assert.equal(summary.currentStreak, 1, "Streak must remain 1 despite 3 focus sessions");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // S. focusMinutes still accumulate independently
  // ─────────────────────────────────────────────────────────────────────────────
  it("S: focusMinutes still accumulate independently", async () => {
    const userS = new mongoose.Types.ObjectId();
    const testDate = toStartOfDayUTC("2026-11-21");

    await StreakService.dailyStreakUpdate(userS, 45, testDate);
    const stat = await DailyStats.findOne({ userId: userS, date: testDate });

    assert.equal(stat.focusMinutes, 45);
    assert.equal(stat.sessions, 1);
    assert.equal(stat.tasksCompleted, 0);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // T. tasksCompleted reflects completed occurrences only
  // ─────────────────────────────────────────────────────────────────────────────
  it("T: tasksCompleted reflects completed occurrences only", async () => {
    const userT = new mongoose.Types.ObjectId();
    const testDate = toStartOfDayUTC("2026-11-22");

    // 1 completed, 1 partial, 1 rescheduled, 1 cancelled, 1 missed
    const outcomes = ["completed", "partially_completed", "rescheduled", "cancelled", "missed"];
    for (const outcome of outcomes) {
      const task = await Task.create({ user: userT, title: `Task T_${outcome}`, plannedDate: testDate });
      await TaskOccurrence.create({
        userId: userT,
        taskId: task._id,
        date: testDate,
        outcome,
      });
    }

    const summary = await StreakService.processDailyStreak(userT, testDate);
    assert.equal(
      summary.completedCount,
      1,
      "tasksCompleted must strictly count completed occurrences only"
    );
    assert.equal(summary.partialCount, 1);
    assert.equal(summary.rescheduledCount, 1);
    assert.equal(summary.cancelledCount, 1);
    assert.equal(summary.missedCount, 1);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // U. User ownership isolation
  // ─────────────────────────────────────────────────────────────────────────────
  it("U: User ownership isolation", async () => {
    const testDate = toStartOfDayUTC("2026-11-23");

    // User A has 2 completed tasks
    for (let i = 1; i <= 2; i++) {
      const tA = await Task.create({ user: userA, title: `UserA_${i}`, plannedDate: testDate });
      await TaskOccurrence.create({ userId: userA, taskId: tA._id, date: testDate, outcome: "completed" });
    }
    // User B has 0 tasks
    const summaryA = await StreakService.processDailyStreak(userA, testDate);
    const summaryB = await StreakService.processDailyStreak(userB, testDate);

    assert.equal(summaryA.completedCount, 2);
    assert.equal(summaryA.currentStreak, 1);

    assert.equal(summaryB.completedCount, 0);
    assert.equal(summaryB.currentStreak, 0);
  });
});
