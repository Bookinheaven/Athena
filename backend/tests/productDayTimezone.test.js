import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import jwt from "jsonwebtoken";
import env from "../config/env.js";
import auth from "../middlewares/authMiddleware.js";
import User from "../models/userModel.js";
import Task from "../models/taskModel.js";
import TaskOccurrence from "../models/taskOccurrenceModel.js";
import Streak from "../models/streakModel.js";
import DailyStats from "../models/dailyStatsModel.js";
import StreakService from "../services/streakService.js";
import TaskOccurrenceService from "../services/taskOccurrenceService.js";
import TaskService from "../services/taskService.js";
import userService from "../services/userService.js";
import {
  getProductDate,
  productDateToStart,
  productDateToEnd,
  isValidTimezone,
  normalizeTimezone,
  toStartOfDayUTC,
  isSameDay,
  resolveUserTimezone,
} from "../utils/dateUtils.js";

const TEST_DB_URI = "mongodb://localhost:27017/athena_timezone_test";

describe("Product Day / Timezone Foundation Regression Test Suite", () => {
  let userKolkata;
  let userNewYork;
  let userUTC;

  before(async () => {
    await mongoose.connect(TEST_DB_URI);

    const ts = Date.now().toString().slice(-6);
    userKolkata = await User.create({
      username: `kolk_${ts}`,
      usernameLower: `kolk_${ts}`,
      fullName: "Kolkata Tester",
      email: `kolkata_${ts}@example.com`,
      password: "password123",
      settings: { timezone: "Asia/Kolkata" },
    });

    userNewYork = await User.create({
      username: `ny_${ts}`,
      usernameLower: `ny_${ts}`,
      fullName: "NY Tester",
      email: `ny_${ts}@example.com`,
      password: "password123",
      settings: { timezone: "America/New_York" },
    });

    userUTC = await User.create({
      username: `utc_${ts}`,
      usernameLower: `utc_${ts}`,
      fullName: "UTC Tester",
      email: `utc_${ts}@example.com`,
      password: "password123",
      // default settings.timezone should be "UTC"
    });
  });

  after(async () => {
    const userIds = [userKolkata?._id, userNewYork?._id, userUTC?._id].filter(Boolean);
    await Promise.all([
      User.deleteMany({ _id: { $in: userIds } }),
      Task.deleteMany({ user: { $in: userIds } }),
      TaskOccurrence.deleteMany({ userId: { $in: userIds } }),
      Streak.deleteMany({ userId: { $in: userIds } }),
      DailyStats.deleteMany({ userId: { $in: userIds } }),
    ]);
    await mongoose.connection.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Timezone Validation and User Settings Persistence
  // ─────────────────────────────────────────────────────────────────────────────
  describe("1. Timezone Preference Persistence & Validation", () => {
    it("persists valid IANA timezone and rejects invalid timezones", async () => {
      assert.equal(isValidTimezone("Asia/Kolkata"), true);
      assert.equal(isValidTimezone("America/New_York"), true);
      assert.equal(isValidTimezone("UTC"), true);
      assert.equal(isValidTimezone("Invalid/Zone"), false);
      assert.equal(isValidTimezone("+05:30"), false); // numeric offset rejected

      // Default user timezone is null (unset) in database, resolving to fallback UTC
      assert.equal(userUTC.settings?.timezone, null);
      const userSettings = await userService.getSettings(userUTC._id);
      assert.equal(userSettings.timezone, "UTC");

      // Update settings with valid timezone
      const updated = await userService.updateSettings(userUTC._id, null, { timezone: "Europe/London" });
      assert.equal(updated.timezone, "Europe/London");

      // Attempting to update with invalid timezone throws error
      await assert.rejects(
        () => userService.updateSettings(userUTC._id, null, { timezone: "Mars/Olympus_Mons" }),
        /Invalid IANA timezone/
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Asia/Kolkata around Local Midnight (UTC+05:30)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("2. Asia/Kolkata around Local Midnight", () => {
    it("correctly identifies product date when crossing local midnight before UTC midnight", () => {
      // 00:15 AM IST on 2026-09-30 is 18:45 UTC on 2026-09-29
      const earlyMorningIST = new Date("2026-09-29T18:45:00.000Z");

      const productDateKolkata = getProductDate(earlyMorningIST, "Asia/Kolkata");
      const productDateUTC = getProductDate(earlyMorningIST, "UTC");

      assert.equal(productDateKolkata, "2026-09-30");
      assert.equal(productDateUTC, "2026-09-29");

      // Verify productDateToStart / productDateToEnd boundaries
      const startIST = productDateToStart("2026-09-30", "Asia/Kolkata");
      const endIST = productDateToEnd("2026-09-30", "Asia/Kolkata");

      // 2026-09-30 00:00:00 IST is 2026-09-29 18:30:00 UTC
      assert.equal(startIST.toISOString(), "2026-09-29T18:30:00.000Z");
      // 2026-09-30 23:59:59.999 IST is 2026-09-30 18:29:59.999 UTC
      assert.equal(endIST.toISOString(), "2026-09-30T18:29:59.999Z");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. America/New_York around Local Evening / Next-Day UTC (EDT UTC-04:00)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("3. America/New_York around Local Evening / UTC Next-Day Boundary", () => {
    it("correctly keeps evening work on the local product day even if UTC has crossed midnight", () => {
      // 21:30 EDT on 2026-09-29 is 01:30 UTC on 2026-09-30
      const eveningEDT = new Date("2026-09-30T01:30:00.000Z");

      const productDateNY = getProductDate(eveningEDT, "America/New_York");
      const productDateUTC = getProductDate(eveningEDT, "UTC");

      assert.equal(productDateNY, "2026-09-29");
      assert.equal(productDateUTC, "2026-09-30");

      // Boundaries for 2026-09-29 in NY (EDT is UTC-4)
      const startNY = productDateToStart("2026-09-29", "America/New_York");
      const endNY = productDateToEnd("2026-09-29", "America/New_York");

      // 2026-09-29 00:00:00 EDT is 2026-09-29 04:00:00 UTC
      assert.equal(startNY.toISOString(), "2026-09-29T04:00:00.000Z");
      // 2026-09-29 23:59:59.999 EDT is 2026-09-30 03:59:59.999 UTC
      assert.equal(endNY.toISOString(), "2026-09-30T03:59:59.999Z");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Planned Date Client -> API -> DB Roundtrip without Day Shift
  // ─────────────────────────────────────────────────────────────────────────────
  describe("4. Planned Date survives Client -> API -> DB Roundtrip", () => {
    it("preserves exact calendar date when creating and updating tasks in America/New_York", async () => {
      const calendarDay = "2026-10-15";
      const tz = "America/New_York";

      // Client sends customPlannedDate as "2026-10-15" with timezone
      const task = await TaskService.createTask(
        userNewYork._id,
        {
          title: "Evening Planning Session",
          plannedDate: calendarDay,
          customPlannedDate: calendarDay,
          estimatedMinutes: 45,
        },
        tz
      );

      // Verify task plannedDate represents the canonical calendar day
      assert.ok(task.plannedDate);
      const taskPDate = getProductDate(task.plannedDate, tz);
      assert.equal(taskPDate, calendarDay);

      // Verify TaskOccurrence has the exact productDate
      const occurrences = await TaskOccurrenceService.getOccurrences(
        userNewYork._id,
        { date: calendarDay },
        tz
      );

      assert.equal(occurrences.length, 1);
      assert.equal(occurrences[0].productDate, calendarDay);
      const returnedTaskId = occurrences[0].taskId?._id || occurrences[0].taskId;
      assert.equal(returnedTaskId.toString(), task._id.toString());
      assert.equal(occurrences[0].outcome, "pending");

      // Ensure querying by UTC Date or productDate returns the exact same record
      const occurrenceById = await TaskOccurrence.findById(occurrences[0]._id);
      assert.equal(occurrenceById.productDate, calendarDay);
      assert.equal(getProductDate(occurrenceById.date, "UTC"), calendarDay);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Missed Evaluation Uses User's Product Day
  // ─────────────────────────────────────────────────────────────────────────────
  describe("5. Missed Evaluation uses User's Product Day", () => {
    it("evaluates pending occurrences based on user's timezone, not server/UTC clock", async () => {
      // Create a task planned for 2026-09-29 in America/New_York
      const targetDay = "2026-09-29";
      const task = await TaskService.createTask(
        userNewYork._id,
        {
          title: "Late Night Work",
          plannedDate: targetDay,
          customPlannedDate: targetDay,
          estimatedMinutes: 30,
        },
        "America/New_York"
      );

      // Simulate a timestamp that is 2026-09-30 01:30:00 UTC
      // For America/New_York: 2026-09-29 21:30 EDT -> IT IS STILL TODAY (2026-09-29)!
      // For Asia/Kolkata: 2026-09-30 07:00 IST -> IT IS TOMORROW (2026-09-30)!
      const evaluationTime = new Date("2026-09-30T01:30:00.000Z");

      // 1. Evaluate for America/New_York user:
      // Product day is 2026-09-29. Occurrence planned for 2026-09-29 is NOT missed.
      await TaskOccurrenceService.evaluateMissedOccurrences(
        userNewYork._id,
        evaluationTime,
        "America/New_York"
      );

      const occNY = await TaskOccurrence.findOne({
        userId: userNewYork._id,
        taskId: task._id,
      });
      assert.equal(occNY.outcome, "pending", "Should still be pending in America/New_York");

      // 2. Evaluate for an Asia/Kolkata user who planned work on 2026-09-29:
      // For Asia/Kolkata, at 2026-09-30T01:30:00.000Z it is already the next day (07:00 IST).
      const taskKolkata = await TaskService.createTask(
        userKolkata._id,
        {
          title: "Kolkata Daytime Task",
          plannedDate: targetDay,
          customPlannedDate: targetDay,
          estimatedMinutes: 30,
        },
        "Asia/Kolkata"
      );

      await TaskOccurrenceService.evaluateMissedOccurrences(
        userKolkata._id,
        evaluationTime,
        "Asia/Kolkata"
      );

      const occKolkata = await TaskOccurrence.findOne({
        userId: userKolkata._id,
        taskId: taskKolkata._id,
      });
      assert.equal(occKolkata.outcome, "missed", "Should be marked missed in Asia/Kolkata");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Monthly Boundaries use User's Product Month/Day
  // ─────────────────────────────────────────────────────────────────────────────
  describe("6. Monthly Boundaries use User's Product Month/Day", () => {
    it("correctly includes end-of-month hours in September instead of October", async () => {
      // 2026-10-01 01:00:00 UTC is 2026-09-30 21:00:00 EDT (America/New_York)
      const sessionDate = new Date("2026-10-01T01:00:00.000Z");

      await StreakService.dailyStreakUpdate(
        userNewYork._id,
        50,
        sessionDate,
        "America/New_York"
      );

      // Verify the DailyStats document was recorded under productDate "2026-09-30"
      const statSept30 = await DailyStats.findOne({
        userId: userNewYork._id,
        productDate: "2026-09-30",
      });
      assert.ok(statSept30, "DailyStats must exist for 2026-09-30");
      assert.equal(statSept30.focusMinutes, 50);

      // Query monthly stats for September (month=9) in America/New_York
      const septStats = await StreakService.getMonthlyStats(
        userNewYork._id,
        2026,
        9,
        "America/New_York"
      );

      const hasSept30 = septStats.some((s) => s.productDate === "2026-09-30");
      assert.equal(hasSept30, true, "September monthly stats must include Sept 30");

      // Query monthly stats for October (month=10) in America/New_York
      const octStats = await StreakService.getMonthlyStats(
        userNewYork._id,
        2026,
        10,
        "America/New_York"
      );

      const hasSeptInOct = octStats.some((s) => s.productDate === "2026-09-30");
      assert.equal(hasSeptInOct, false, "October monthly stats must NOT include Sept 30");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Streak Evaluation Uses Product Days Consistently Across Timezones
  // ─────────────────────────────────────────────────────────────────────────────
  describe("7. Streak Evaluation Uses Product Days Consistently", () => {
    it("accumulates streak across consecutive product days in Asia/Kolkata", async () => {
      const tz = "Asia/Kolkata";
      const days = ["2026-10-01", "2026-10-02", "2026-10-03"];

      for (const day of days) {
        // Simulate local midday on that product day (e.g. 12:00 IST = 06:30 UTC)
        const dayTime = new Date(`${day}T06:30:00.000Z`);
        const task = await TaskService.createTask(
          userKolkata._id,
          {
            title: `Task for ${day}`,
            plannedDate: day,
            customPlannedDate: day,
            estimatedMinutes: 25,
          },
          dayTime,
          tz
        );

        // Mark completed on that day
        await TaskService.updateTask(
          userKolkata._id,
          task._id,
          { status: "completed" },
          dayTime,
          tz
        );
      }

      // Process streak on 2026-10-03 evening in Asia/Kolkata (e.g. 2026-10-03 16:00:00 UTC = 21:30 IST)
      const asOf = new Date("2026-10-03T16:00:00.000Z");
      const summary = await StreakService.processDailyStreak(userKolkata._id, asOf, tz);

      assert.equal(summary.currentStreak, 3, "Streak should be 3 for 3 consecutive completed product days");
      assert.equal(summary.state, "green");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Overdue Completion Preserves Old Missed Occurrence (Strict Semantics)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("8. Overdue Completion Preserves Old Missed Occurrence", () => {
    it("does not retroactively rewrite missed occurrence or auto-create today occurrence", async () => {
      const tz = "America/New_York";
      const oldDay = "2026-10-01";
      const currentDay = "2026-10-05";

      const oldDayTime = new Date(`${oldDay}T16:00:00.000Z`); // 12:00 EDT
      const currentDayTime = new Date(`${currentDay}T16:00:00.000Z`); // 12:00 EDT

      // 1. Create a task planned for oldDay
      const task = await TaskService.createTask(
        userNewYork._id,
        {
          title: "Overdue Item",
          plannedDate: oldDay,
          customPlannedDate: oldDay,
          estimatedMinutes: 30,
        },
        oldDayTime,
        tz
      );

      // 2. Mark occurrences missed as of currentDay
      await TaskOccurrenceService.evaluateMissedOccurrences(userNewYork._id, currentDayTime, tz);

      const oldOcc = await TaskOccurrence.findOne({
        userId: userNewYork._id,
        taskId: task._id,
        productDate: oldDay,
      });
      assert.ok(oldOcc, "Old occurrence should exist");
      assert.equal(oldOcc.outcome, "missed");

      // 3. User completes task on currentDay without explicit rescheduling
      await TaskService.updateTask(
        userNewYork._id,
        task._id,
        { status: "completed" },
        currentDayTime,
        tz
      );

      // Verify:
      // - old occurrence remains "missed" (never rewritten)
      const oldOccAfter = await TaskOccurrence.findOne({
        userId: userNewYork._id,
        taskId: task._id,
        productDate: oldDay,
      });
      assert.equal(oldOccAfter.outcome, "missed", "Old occurrence must remain missed");

      // - no new occurrence automatically created on currentDay
      const todayOcc = await TaskOccurrence.findOne({
        userId: userNewYork._id,
        taskId: task._id,
        productDate: currentDay,
      });
      assert.equal(todayOcc, null, "Completing overdue task must NOT auto-create a today occurrence");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Historical Compatibility with Legacy UTC Records
  // ─────────────────────────────────────────────────────────────────────────────
  describe("9. Historical Compatibility Strategy for Legacy UTC Records", () => {
    it("correctly reads and computes streaks for legacy records without productDate", async () => {
      // Insert raw legacy occurrence and DailyStats with only UTC `date` and no `productDate`
      const legacyDate = new Date("2026-09-10T00:00:00.000Z");

      const legacyTask = await Task.create({
        user: userUTC._id,
        title: "Legacy Task",
        status: "completed",
        type: "custom",
        plannedDate: legacyDate,
      });

      await TaskOccurrence.create({
        userId: userUTC._id,
        taskId: legacyTask._id,
        date: legacyDate,
        // no productDate specified - legacy schema simulation
        outcome: "completed",
        historicalTaskSnapshot: {
          title: legacyTask.title,
          type: legacyTask.type,
          estimatedMinutes: 25,
        },
      });

      // Process streak as of 2026-09-11
      const asOf = new Date("2026-09-11T12:00:00.000Z");
      const summary = await StreakService.processDailyStreak(userUTC._id, asOf, "UTC");

      assert.equal(summary.currentStreak, 1, "Legacy completed occurrence correctly counts toward streak");

      // Verify that DailyStats for 2026-09-10 was self-healed with productDate
      const healedStat = await DailyStats.findOne({
        userId: userUTC._id,
        date: legacyDate,
      });
      assert.ok(healedStat);
      assert.equal(healedStat.productDate, "2026-09-10", "Legacy stat should be self-healed with productDate");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Daylight Saving Time (DST) Transitions
  // ─────────────────────────────────────────────────────────────────────────────
  describe("10. Daylight Saving Time (DST) Transitions", () => {
    const tz = "America/New_York";

    // 2026 Spring-forward transition date: 2026-03-08 (EST -> EDT, jumps from 2:00 to 3:00)
    // 2026 Fall-back transition date: 2026-11-01 (EDT -> EST, falls back from 2:00 to 1:00)
    const dstDates = [
      "2026-03-07", // day before spring-forward (EST, UTC-5)
      "2026-03-08", // spring-forward transition day (23 hours duration)
      "2026-03-09", // day after spring-forward (EDT, UTC-4)
      "2026-10-31", // day before fall-back (EDT, UTC-4)
      "2026-11-01", // fall-back transition day (25 hours duration)
      "2026-11-02", // day after fall-back (EST, UTC-5)
    ];

    it("satisfies start < end, productDate roundtrips, and duration invariants across all DST boundaries", () => {
      for (const d of dstDates) {
        const start = productDateToStart(d, tz);
        const end = productDateToEnd(d, tz);

        // Invariant 1: start < end
        assert.ok(start.getTime() < end.getTime(), `Start must be before end on ${d}`);

        // Invariant 2: getProductDate(start, tz) === D
        const startPDate = getProductDate(start, tz);
        assert.equal(startPDate, d, `Start of product day must resolve to ${d}`);

        // Invariant 3: getProductDate(end, tz) === D
        const endPDate = getProductDate(end, tz);
        assert.equal(endPDate, d, `End of product day must resolve to ${d}`);
      }
    });

    it("correctly models 23-hour spring-forward and 25-hour fall-back day durations", () => {
      // Spring-forward: 2026-03-08 starts at 05:00Z and ends at 2026-03-09 03:59:59.999Z (exactly 23h - 1ms)
      const springStart = productDateToStart("2026-03-08", tz);
      const springEnd = productDateToEnd("2026-03-08", tz);
      const springDurationHours = (springEnd.getTime() + 1 - springStart.getTime()) / (1000 * 60 * 60);
      assert.equal(springDurationHours, 23, "Spring forward day must be exactly 23 hours");

      // Fall-back: 2026-11-01 starts at 04:00Z and ends at 2026-11-02 04:59:59.999Z (exactly 25h - 1ms)
      const fallStart = productDateToStart("2026-11-01", tz);
      const fallEnd = productDateToEnd("2026-11-01", tz);
      const fallDurationHours = (fallEnd.getTime() + 1 - fallStart.getTime()) / (1000 * 60 * 60);
      assert.equal(fallDurationHours, 25, "Fall back day must be exactly 25 hours");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Timezone Precedence & Multi-Device Isolation
  // ─────────────────────────────────────────────────────────────────────────────
  describe("11. Timezone Precedence & Multi-Device Isolation", () => {
    it("auto-populates unset timezone from first client, but preserves persisted preference across other devices", async () => {
      const ts = Date.now().toString().slice(-6);
      const multiUser = await User.create({
        username: `multi_${ts}`,
        usernameLower: `multi_${ts}`,
        fullName: "Multi Device Tester",
        email: `multi_${ts}@example.com`,
        password: "password123",
        // settings.timezone defaults to null (unset)
      });

      const token = jwt.sign({ userId: multiUser._id }, env.JWT_SECRET);

      // Device A arrives from Asia/Kolkata
      const reqA = {
        headers: { authorization: `Bearer ${token}`, "x-timezone": "Asia/Kolkata" },
      };
      await auth(reqA, {}, () => {});
      assert.equal(reqA.timezone, "Asia/Kolkata");

      // Wait a tick for async lazy update
      await new Promise((r) => setTimeout(r, 50));

      // Verify user's preference was lazily persisted as Asia/Kolkata
      const userAfterA = await User.findById(multiUser._id);
      assert.equal(userAfterA.settings?.timezone, "Asia/Kolkata");

      // Device B later arrives from America/New_York
      const reqB = {
        headers: { authorization: `Bearer ${token}`, "x-timezone": "America/New_York" },
      };
      await auth(reqB, {}, () => {});

      // Persisted user preference remains authoritative!
      assert.equal(reqB.timezone, "Asia/Kolkata", "Browser B must NOT desync the user's canonical product day");
      const userAfterB = await User.findById(multiUser._id);
      assert.equal(userAfterB.settings?.timezone, "Asia/Kolkata", "Persisted preference must not be overwritten by another device");
    });

    it("explicitly set UTC is distinct from unset and is not overwritten by client headers", async () => {
      const ts = Date.now().toString().slice(-6);
      const explicitUtcUser = await User.create({
        username: `eutc_${ts}`,
        usernameLower: `eutc_${ts}`,
        fullName: "Explicit UTC Tester",
        email: `eutc_${ts}@example.com`,
        password: "password123",
        settings: { timezone: "UTC" }, // explicitly set to UTC
      });

      const token = jwt.sign({ userId: explicitUtcUser._id }, env.JWT_SECRET);

      // Client sends x-timezone: Asia/Kolkata
      const req = {
        headers: { authorization: `Bearer ${token}`, "x-timezone": "Asia/Kolkata" },
      };
      await auth(req, {}, () => {});

      // Explicitly chosen UTC must remain authoritative!
      assert.equal(req.timezone, "UTC");
      const userCheck = await User.findById(explicitUtcUser._id);
      assert.equal(userCheck.settings?.timezone, "UTC", "Explicit UTC must not be overwritten by client header");
    });
  });
});
