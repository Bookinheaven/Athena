import crypto from "crypto";
import { getDrizzleDb } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { sessions } from "../db/schema/sessions.js";
import { sessionTasks } from "../db/schema/sessionTasks.js";
import { sessionSegments } from "../db/schema/sessionSegments.js";
import { sessionPauseEvents } from "../db/schema/sessionPauseEvents.js";
import { sessionFeedback } from "../db/schema/sessionFeedback.js";
import { goals } from "../db/schema/goals.js";
import { tasks } from "../db/schema/tasks.js";
import { taskOccurrences } from "../db/schema/taskOccurrences.js";
import { scheduleBlocks } from "../db/schema/scheduleBlocks.js";
import { notes } from "../db/schema/notes.js";
import { dailyStats } from "../db/schema/dailyStats.js";
import { streaks } from "../db/schema/streaks.js";
import { eq, like, inArray, and, or, sql, desc, asc, notInArray } from "drizzle-orm";
import userRepository from "../repositories/userRepository.js";
import streakRepository from "../repositories/streakRepository.js";
import dailyStatsRepository from "../repositories/dailyStatsRepository.js";
import streakService from "../services/streakService.js";
import {
  getUserTimezone,
  getProductDate,
  productDateToStart,
  productDateToEnd,
} from "../utils/dateUtils.js";
import {
  calculateRollingCapacity,
  calculatePlanningOverload,
} from "../utils/capacityEngine.js";

// Deterministic PRNG
function cyrb128(str) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function sfc32(a, b, c, d) {
  return function () {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

const SAMPLE_SUBJECTS = [
  "Algorithms & Data Structures",
  "System Architecture",
  "Frontend Engineering",
  "Database Optimization",
  "Distributed Systems",
  "Cloud Infrastructure",
];

const SAMPLE_TASK_TEMPLATES = [
  "Implement balanced binary search tree rotations",
  "Design multi-tier caching layer with Redis",
  "Draft OpenAPI specification document",
  "Solve 3 medium algorithmic problem sets",
  "Refactor atomic state reducer hooks",
  "Optimize PostgreSQL index execution plan",
  "Implement JWT refresh token rotation logic",
  "Profile web application rendering performance",
];

export default class DeveloperDataService {
  /**
   * Helper: Multipliers for activity levels
   */
  static getBehaviorMultiplier(activityLevel) {
    switch (activityLevel?.toLowerCase()) {
      case "low":
        return 0.55;
      case "high":
        return 1.6;
      case "intense":
        return 2.4;
      case "moderate":
      default:
        return 1.0;
    }
  }

  /**
   * Explanatory notes for profiles and behavior
   */
  static getPreviewNotes(profile, behavior, activityLevel) {
    const notes = [];
    switch (profile) {
      case "realistic":
        notes.push("Balanced task completion rate (~75%).");
        notes.push("1-3 focus sessions per active day (25m - 50m).");
        notes.push("Occasional rest day on weekends.");
        break;
      case "focus_heavy":
        notes.push("High focus density: 3-5 sessions/day (45-60 min blocks).");
        notes.push("150-250+ focus minutes per active day.");
        notes.push("Consistent high completion and positive feedback ratings.");
        break;
      case "planner_heavy":
        notes.push("Dense calendar scheduling: 3-5 schedule blocks daily.");
        notes.push("High task occurrence density across calendar.");
        notes.push("Moderate focus session time with extensive planning.");
        break;
      case "inconsistent":
        notes.push("Erratic activity: active clusters with gap/rest days.");
        notes.push("Elevated abandoned session rate (~25-30%).");
        notes.push("Lower completion rate with natural streak breaks.");
        break;
      case "overloaded":
        notes.push("Baseline capacity established over historical window.");
        notes.push("Recent days trigger Planning Overload (> 1.30x capacity).");
        notes.push("5-8 planned tasks daily with elevated reschedule outcomes.");
        break;
      case "custom":
        notes.push("Custom parameters based on selected activity level.");
        break;
      default:
        notes.push("Standard realistic simulation profile.");
    }

    if (behavior === "night_owl") {
      notes.push("Sessions concentrated in late night hours (21:00 - 02:00).");
    } else if (behavior === "early_bird") {
      notes.push("Sessions concentrated in morning hours (06:30 - 11:30).");
    } else if (behavior === "crammer") {
      notes.push("Bursts of high-density sessions clustered near deadlines.");
    } else if (behavior === "procrastinator") {
      notes.push("Higher frequency of rescheduled tasks and paused sessions.");
    } else if (behavior === "deep_worker") {
      notes.push("Long uninterrupted focus blocks with 0 pause events.");
    }

    return notes;
  }

  /**
   * Simulates timeline deterministically for a date range
   */
  static simulateTimeline({
    profile = "realistic",
    historyDays = 30,
    activityLevel = "moderate",
    behavior = "consistent_student",
    seed = "42",
    userTimezone = "UTC",
    existingSessions = [],
  }) {
    const days = Math.min(180, Math.max(1, parseInt(historyDays, 10) || 30));
    const actMult = this.getBehaviorMultiplier(activityLevel);

    const seedStr = `${profile}-${days}-${activityLevel}-${behavior}-${seed}`;
    const seed128 = cyrb128(seedStr);
    const rand = sfc32(seed128[0], seed128[1], seed128[2], seed128[3]);

    // Build product dates list up to today in user's timezone
    const now = new Date();
    const todayProductDate = getProductDate(now, userTimezone);
    const [tY, tM, tD] = todayProductDate.split("-").map(Number);
    const todayUtc = new Date(Date.UTC(tY, tM - 1, tD));

    const dateList = [];
    for (let d = days - 1; d >= 0; d--) {
      const dt = new Date(todayUtc.getTime() - d * 86400000);
      const pDate = dt.toISOString().slice(0, 10);
      dateList.push(pDate);
    }

    // Existing session dates set to avoid collisions
    const existingDatesWithSessions = new Set(
      existingSessions.map((s) => s.snapshotScheduleDate || getProductDate(s.startedAt, userTimezone))
    );

    const simulatedDays = [];
    let totalSessions = 0;
    let totalFocusMinutes = 0;
    let totalTasksPlanned = 0;
    let totalOccurrences = 0;
    let totalScheduleBlocks = 0;
    let completedOccurrences = 0;

    // Number of goal and task definitions to create
    const numGoals = 2;
    const numTasks = Math.max(4, Math.floor((6 + rand() * 4) * Math.min(1.5, actMult)));

    for (let i = 0; i < dateList.length; i++) {
      const pDate = dateList[i];
      const isWeekend = (() => {
        const d = new Date(pDate + "T12:00:00Z");
        const day = d.getUTCDay();
        return day === 0 || day === 6;
      })();

      const isRecentDays = i >= dateList.length - 4; // last 4 days

      let shouldHaveActivity = true;
      let sessionCount = 1;
      let occurrenceCount = Math.floor((2 + rand() * 2) * actMult);
      let sessionDurationMinutes = 25;
      let completionProbability = 0.75;
      let isOverloadedDay = false;

      // Profile specifics
      switch (profile) {
        case "focus_heavy":
          sessionCount = Math.floor((3 + rand() * 3) * actMult);
          sessionDurationMinutes = rand() > 0.4 ? 50 : 35;
          completionProbability = 0.85;
          if (isWeekend && rand() > 0.6) shouldHaveActivity = false;
          break;

        case "planner_heavy":
          sessionCount = Math.max(1, Math.floor((1 + rand() * 1.5) * actMult));
          occurrenceCount = Math.floor((4 + rand() * 3) * actMult);
          sessionDurationMinutes = 25;
          completionProbability = 0.7;
          break;

        case "inconsistent":
          // Inconsistent: 2-3 days active, 1-2 days skipped
          if (i % 4 === 2 || (isWeekend && rand() > 0.4)) {
            shouldHaveActivity = false;
          }
          sessionCount = shouldHaveActivity ? Math.floor((1 + rand() * 2) * actMult) : 0;
          occurrenceCount = Math.floor((2 + rand() * 3) * actMult);
          sessionDurationMinutes = 25;
          completionProbability = 0.45;
          break;

        case "overloaded":
          if (isRecentDays) {
            // Overloaded period! High tasks and schedule blocks
            isOverloadedDay = true;
            occurrenceCount = Math.floor((6 + rand() * 3) * actMult);
            sessionCount = Math.floor((3 + rand() * 2) * actMult);
            sessionDurationMinutes = 45;
            completionProbability = 0.55; // Lower completion under pressure
          } else {
            // Normal baseline capacity
            sessionCount = Math.floor((1 + rand() * 1.5) * actMult);
            sessionDurationMinutes = 30;
            completionProbability = 0.8;
          }
          break;

        case "realistic":
        default:
          if (isWeekend && rand() > 0.45 && behavior !== "night_owl") {
            shouldHaveActivity = false;
          }
          sessionCount = shouldHaveActivity ? Math.floor((1 + rand() * 2.2) * actMult) : 0;
          sessionDurationMinutes = rand() > 0.5 ? 25 : 50;
          completionProbability = 0.75;
          break;
      }

      if (!shouldHaveActivity) {
        sessionCount = 0;
      }

      // Check collision with existing sessions on this date
      const alreadyHasUserSessions = existingDatesWithSessions.has(pDate);
      if (alreadyHasUserSessions && sessionCount > 1) {
        // Safe merge: reduce synthetic session volume on dates user already worked
        sessionCount = 1;
      }

      const daySim = {
        productDate: pDate,
        isWeekend,
        isOverloadedDay,
        sessionCount,
        occurrenceCount,
        sessionDurationMinutes,
        completionProbability,
      };

      totalSessions += sessionCount;
      totalFocusMinutes += sessionCount * sessionDurationMinutes;
      totalOccurrences += occurrenceCount;
      totalScheduleBlocks += (profile === "planner_heavy" || isOverloadedDay) ? Math.max(sessionCount, occurrenceCount) : sessionCount;
      completedOccurrences += Math.floor(occurrenceCount * completionProbability);

      simulatedDays.push(daySim);
    }

    return {
      days,
      dateList,
      simulatedDays,
      numGoals,
      numTasks,
      totalSessions,
      totalFocusMinutes,
      totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
      totalOccurrences,
      totalScheduleBlocks,
      estimatedTasks: numTasks,
      expectedCompletionRate: `${Math.round((completedOccurrences / Math.max(1, totalOccurrences)) * 100)}%`,
    };
  }

  /**
   * Generates or fetches dataset list for test users
   */
  static async getDatasets() {
    const db = getDrizzleDb();
    const allDevUsers = await db
      .select()
      .from(users)
      .where(like(users.email, "%@athena.test"));

    const datasetsMap = new Map();
    for (const user of allDevUsers) {
      const emailParts = user.email.split("-dev-");
      if (emailParts.length === 2) {
        const datasetId = emailParts[0];

        if (!datasetsMap.has(datasetId)) {
          const parts = datasetId.split("-");
          const profile = parts[0] || "unknown";
          const seed = parts[1] || "0";
          const daysStr = parts[2] || "0d";
          const days = parseInt(daysStr.replace("d", ""), 10);

          datasetsMap.set(datasetId, {
            id: datasetId,
            name: `${profile.replace(/_/g, " ").toUpperCase()} Dataset`,
            profile,
            seed,
            days: days || 30,
            userCount: 0,
            createdAt: user.createdAt || new Date(),
          });
        }
        datasetsMap.get(datasetId).userCount++;
      }
    }

    return Array.from(datasetsMap.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  /**
   * Preview computation: 100% matches deterministic simulation
   */
  static async preview(payload) {
    const {
      profile = "realistic",
      numUsers = 1,
      historyDays = 30,
      activityLevel = "moderate",
      behavior = "consistent_student",
      seed = "42",
      userId,
    } = payload;

    const days = parseInt(historyDays, 10) || 30;
    const usersCount = parseInt(numUsers, 10) || 1;

    let targetUser = null;
    let tz = "UTC";
    let existingSessions = [];

    if (userId) {
      targetUser = await userRepository.findById(userId);
      if (targetUser) {
        tz = getUserTimezone(targetUser);
        const db = getDrizzleDb();
        existingSessions = await db
          .select({
            id: sessions.id,
            startedAt: sessions.startedAt,
            snapshotScheduleDate: sessions.snapshotScheduleDate,
          })
          .from(sessions)
          .where(eq(sessions.userId, targetUser.id));
      }
    }

    const sim = this.simulateTimeline({
      profile,
      historyDays: days,
      activityLevel,
      behavior,
      seed,
      userTimezone: tz,
      existingSessions,
    });

    const estimatedStreak =
      profile === "inconsistent"
        ? Math.floor(1 + ((days * 0.1) % 4))
        : Math.min(days, Math.floor(days * 0.65));

    return {
      targetUser: targetUser
        ? {
            id: targetUser.id,
            fullName: targetUser.fullName || targetUser.username,
            email: targetUser.email,
            timezone: tz,
          }
        : null,
      estimatedUsers: usersCount,
      estimatedDays: days,
      estimatedSessions: sim.totalSessions * usersCount,
      estimatedFocusHours: (parseFloat(sim.totalFocusHours) * usersCount).toFixed(1),
      estimatedTasks: sim.estimatedTasks * usersCount,
      estimatedOccurrences: sim.totalOccurrences * usersCount,
      estimatedScheduleBlocks: sim.totalScheduleBlocks * usersCount,
      expectedCompletionRate: sim.expectedCompletionRate,
      estimatedStreak,
      behavioralNotes: this.getPreviewNotes(profile, behavior, activityLevel),
    };
  }

  /**
   * Add coherent historical data to an existing user
   */
  static async addDataToUser(payload) {
    const {
      userId,
      profile = "realistic",
      historyDays = 30,
      activityLevel = "moderate",
      behavior = "consistent_student",
      seed = Math.floor(Math.random() * 100000).toString(),
    } = payload;

    if (!userId) {
      return { success: false, message: "Target userId is required." };
    }

    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      return { success: false, message: "Target user not found." };
    }

    const db = getDrizzleDb();
    const tz = getUserTimezone(targetUser);

    // 1. Critical Requirement: Check existing user sessions
    // Never modify an active Focus session!
    const existingSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, targetUser.id));

    const hasActiveSession = existingSessions.some((s) => s.status === "active");

    // Run deterministic timeline simulation
    const sim = this.simulateTimeline({
      profile,
      historyDays,
      activityLevel,
      behavior,
      seed,
      userTimezone: tz,
      existingSessions,
    });

    const seedStr = `${userId}-${profile}-${sim.days}-${activityLevel}-${behavior}-${seed}`;
    const seed128 = cyrb128(seedStr);
    const rand = sfc32(seed128[0], seed128[1], seed128[2], seed128[3]);

    const generatedRecordCounts = {
      goalsCreated: 0,
      tasksCreated: 0,
      occurrencesCreated: 0,
      scheduleBlocksCreated: 0,
      sessionsCreated: 0,
      sessionTasksCreated: 0,
      sessionSegmentsCreated: 0,
      pauseEventsCreated: 0,
      feedbackCreated: 0,
      notesCreated: 0,
    };

    // 2. Create Goals with [dev-data] tag for provenance
    const sampleGoalsSpec = [
      SAMPLE_SUBJECTS[Math.floor(rand() * SAMPLE_SUBJECTS.length)],
      SAMPLE_SUBJECTS[Math.floor(rand() * SAMPLE_SUBJECTS.length)],
    ];
    const createdGoalIds = [];

    const firstDate = sim.dateList[0];
    const lastDate = sim.dateList[sim.dateList.length - 1];

    for (const gTitle of sampleGoalsSpec) {
      try {
        const [newGoal] = await db
          .insert(goals)
          .values({
            userId: targetUser.id,
            title: gTitle,
            description: `[dev-data] Goal generated via Developer Fixture (${profile})`,
            status: "active",
            progress: (rand() * 85).toFixed(2),
            color: ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"][
              Math.floor(rand() * 5)
            ],
            startDate: firstDate,
            dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          })
          .returning({ id: goals.id });

        if (newGoal?.id) {
          createdGoalIds.push(newGoal.id);
          generatedRecordCounts.goalsCreated++;
        }
      } catch (err) {
        console.warn("Could not insert sample goal:", err.message);
      }
    }

    // 3. Create Tasks with [dev-data] tag
    const createdTasks = [];
    for (let t = 0; t < sim.numTasks; t++) {
      const templateTitle =
        SAMPLE_TASK_TEMPLATES[(t + Math.floor(rand() * 5)) % SAMPLE_TASK_TEMPLATES.length];
      const goalId =
        createdGoalIds.length > 0 ? createdGoalIds[t % createdGoalIds.length] : null;

      try {
        const [newTask] = await db
          .insert(tasks)
          .values({
            userId: targetUser.id,
            goalId,
            title: templateTitle,
            description: `[dev-data] Synthetic task for ${profile} scenario.`,
            status: rand() > 0.35 ? "completed" : "todo",
            priority: ["low", "medium", "high"][Math.floor(rand() * 3)],
            orderIndex: t,
            dueDate: new Date(Date.now() + (t - 2) * 86400000).toISOString().slice(0, 10),
          })
          .returning();

        if (newTask) {
          createdTasks.push(newTask);
          generatedRecordCounts.tasksCreated++;
        }
      } catch (err) {
        console.warn("Could not insert sample task:", err.message);
      }
    }

    // If no tasks were created, cannot proceed with timeline linking
    if (createdTasks.length === 0) {
      return { success: false, message: "Failed to initialize tasks." };
    }

    // 4. Generate Daily Timeline: occurrences -> schedule blocks -> sessions -> segments -> pauses -> feedback
    let totalFocusMinutesAccum = 0;

    for (let dayIdx = 0; dayIdx < sim.simulatedDays.length; dayIdx++) {
      const daySpec = sim.simulatedDays[dayIdx];
      const pDate = daySpec.productDate;

      // Product date bounds in user timezone
      const startOfDay = productDateToStart(pDate, tz);

      // (a) Task Occurrences for this day
      const dailyTasksForDay = [];
      const usedTaskIndices = new Set();

      for (let oc = 0; oc < daySpec.occurrenceCount; oc++) {
        const taskIdx = (dayIdx + oc) % createdTasks.length;
        if (usedTaskIndices.has(taskIdx)) continue;
        usedTaskIndices.add(taskIdx);

        const taskObj = createdTasks[taskIdx];
        dailyTasksForDay.push(taskObj);

        // Determine outcome based on completion probability
        const isCompleted = rand() < daySpec.completionProbability;
        let outcome = "completed";
        let rescheduledTo = null;

        if (!isCompleted) {
          if (profile === "inconsistent" || daySpec.isOverloadedDay) {
            outcome = rand() > 0.5 ? "rescheduled" : "missed";
          } else {
            outcome = rand() > 0.4 ? "rescheduled" : "partially_completed";
          }
          if (outcome === "rescheduled") {
            const nextDayUtc = new Date(startOfDay.getTime() + 86400000);
            rescheduledTo = nextDayUtc.toISOString().slice(0, 10);
          }
        }

        try {
          await db.insert(taskOccurrences).values({
            userId: targetUser.id,
            taskId: taskObj.id,
            productDate: pDate,
            outcome,
            rescheduledToDate: rescheduledTo,
            completedAt:
              outcome === "completed"
                ? new Date(startOfDay.getTime() + (14 * 3600 + oc * 1800) * 1000)
                : null,
            snapshotTitle: taskObj.title,
            snapshotPriority: taskObj.priority || "medium",
            notes: outcome === "rescheduled" ? "[dev-data] Rescheduled due to capacity" : "[dev-data]",
          });
          generatedRecordCounts.occurrencesCreated++;
        } catch (err) {
          // unique constraint uq_user_task_product_date
        }
      }

      // (b) Focus Sessions & Associated Entities for this day
      for (let s = 0; s < daySpec.sessionCount; s++) {
        // Determine start time in user timezone
        let startHour = 14;
        if (behavior === "night_owl") startHour = 21 + (s % 4);
        else if (behavior === "early_bird") startHour = 7 + s * 2;
        else if (behavior === "crammer") startHour = s % 2 === 0 ? 11 : 21;
        else startHour = 10 + s * 3; // 10, 13, 16

        const sessionStartTime = new Date(
          startOfDay.getTime() + (startHour * 3600 + Math.floor(rand() * 20) * 60) * 1000
        );

        const durationMinutes = daySpec.sessionDurationMinutes;
        const durationSeconds = durationMinutes * 60;
        const sessionEndTime = new Date(sessionStartTime.getTime() + durationSeconds * 1000);

        const isAbandoned = profile === "inconsistent" && rand() < 0.28;
        const completionType = isAbandoned ? "abandoned" : "completed";
        const focusMins = isAbandoned ? Math.floor(durationMinutes * 0.4) : durationMinutes;
        const actualDurationSec = isAbandoned ? Math.floor(durationSeconds * 0.4) : durationSeconds;
        const actualEndTime = isAbandoned
          ? new Date(sessionStartTime.getTime() + actualDurationSec * 1000)
          : sessionEndTime;

        const targetTask =
          dailyTasksForDay[s % dailyTasksForDay.length] || createdTasks[s % createdTasks.length];

        // 1. Create ScheduleBlock
        let scheduleBlockId = null;
        try {
          const [sb] = await db
            .insert(scheduleBlocks)
            .values({
              userId: targetUser.id,
              taskId: targetTask.id,
              productDate: pDate,
              startTime: sessionStartTime,
              endTime: actualEndTime,
              durationMinutes: Math.max(1, Math.round(actualDurationSec / 60)),
              status: isAbandoned ? "skipped" : "completed",
            })
            .returning({ id: scheduleBlocks.id });

          if (sb?.id) {
            scheduleBlockId = sb.id;
            generatedRecordCounts.scheduleBlocksCreated++;
          }
        } catch (err) {
          console.warn("Could not insert scheduleBlock:", err.message);
        }

        // 2. Create Session
        const clientSessionId = `dev-data-${targetUser.id.substring(0, 8)}-${pDate.replace(/-/g, "")}-${s}-${Math.floor(rand() * 9999)}`;
        let createdSession = null;

        try {
          const [sess] = await db
            .insert(sessions)
            .values({
              clientSessionId,
              userId: targetUser.id,
              scheduleBlockId,
              title: `Focus Session: ${targetTask.title.slice(0, 50)}`,
              sessionType: "task",
              status: "completed",
              completionType,
              sessionTaskOutcome: completionType === "completed" ? "completed" : "partially_completed",
              startedAt: sessionStartTime,
              endedAt: actualEndTime,
              plannedDurationSeconds: durationSeconds,
              durationSeconds: actualDurationSec,
              totalFocusMinutes: focusMins,
              totalBreakMinutes: Math.floor(durationMinutes * 0.18),
              pauseCount: behavior === "deep_worker" ? 0 : rand() > 0.7 ? 1 : 0,
              totalPauseDurationSeconds: behavior === "deep_worker" ? 0 : rand() > 0.7 ? 60 : 0,
              focusSegmentsCompleted: Math.max(1, Math.floor(focusMins / 25)),
              breakSegmentsCompleted: isAbandoned ? 0 : 1,
              snapshotScheduleDate: pDate,
            })
            .returning();

          if (sess) {
            createdSession = sess;
            generatedRecordCounts.sessionsCreated++;
            totalFocusMinutesAccum += focusMins;

            // Link session back to schedule block
            if (scheduleBlockId) {
              await db
                .update(scheduleBlocks)
                .set({ sessionId: sess.id })
                .where(eq(scheduleBlocks.id, scheduleBlockId));
            }
          }
        } catch (err) {
          console.warn("Could not insert session:", err.message);
        }

        if (createdSession) {
          // 3. Create SessionTask
          try {
            await db.insert(sessionTasks).values({
              sessionId: createdSession.id,
              taskId: targetTask.id,
              sortOrder: 0,
              snapshotTitle: targetTask.title,
              snapshotPriority: targetTask.priority || "medium",
            });
            generatedRecordCounts.sessionTasksCreated++;
          } catch (err) {
            console.warn("Could not insert sessionTask:", err.message);
          }

          // 4. Create SessionSegments
          try {
            const focusSegmentSec = Math.floor(actualDurationSec * 0.85);
            const breakSegmentSec = actualDurationSec - focusSegmentSec;

            // Focus Segment
            await db.insert(sessionSegments).values({
              sessionId: createdSession.id,
              segmentIndex: 0,
              type: "focus",
              durationSeconds: focusSegmentSec,
              totalDurationSeconds: focusSegmentSec,
              startedAt: sessionStartTime,
              completedAt: new Date(sessionStartTime.getTime() + focusSegmentSec * 1000),
            });
            generatedRecordCounts.sessionSegmentsCreated++;

            // Break Segment (if not abandoned early)
            if (!isAbandoned && breakSegmentSec > 0) {
              await db.insert(sessionSegments).values({
                sessionId: createdSession.id,
                segmentIndex: 1,
                type: "break",
                durationSeconds: breakSegmentSec,
                totalDurationSeconds: breakSegmentSec,
                startedAt: new Date(sessionStartTime.getTime() + focusSegmentSec * 1000),
                completedAt: actualEndTime,
              });
              generatedRecordCounts.sessionSegmentsCreated++;
            }
          } catch (err) {
            console.warn("Could not insert sessionSegments:", err.message);
          }

          // 5. Create SessionPauseEvent if session was paused
          if (createdSession.pauseCount > 0) {
            try {
              const pauseStart = new Date(sessionStartTime.getTime() + 300 * 1000);
              const pauseEnd = new Date(pauseStart.getTime() + 60 * 1000);
              await db.insert(sessionPauseEvents).values({
                sessionId: createdSession.id,
                clientPauseId: `dev-pause-${createdSession.id.slice(0, 8)}-1`,
                startTime: pauseStart,
                endTime: pauseEnd,
                durationSeconds: 60,
                reason: "Manual Pause",
              });
              generatedRecordCounts.pauseEventsCreated++;
            } catch (err) {
              console.warn("Could not insert pauseEvent:", err.message);
            }
          }

          // 6. Create SessionFeedback
          try {
            const mood = isAbandoned ? 2 : Math.min(5, Math.floor(3 + rand() * 3));
            const focus = isAbandoned ? 2 : Math.min(5, Math.floor(3 + rand() * 3));
            await db.insert(sessionFeedback).values({
              sessionId: createdSession.id,
              moodRating: mood,
              focusRating: focus,
              distractionsNotes: isAbandoned ? "Interrupted by notifications" : "Productive session",
              submittedAt: new Date(actualEndTime.getTime() + 15000),
            });
            generatedRecordCounts.feedbackCreated++;
          } catch (err) {
            console.warn("Could not insert sessionFeedback:", err.message);
          }

          // 7. Update DailyStats focus accumulation
          try {
            await dailyStatsRepository.incrementFocus(targetUser.id, pDate, focusMins);
          } catch (err) {
            console.warn("Could not increment dailyStats focus:", err.message);
          }
        }
      }

      // (c) Occasional Notes creation (1-2 notes across the timeline)
      if (dayIdx === Math.floor(sim.simulatedDays.length / 2) && createdTasks.length > 0) {
        try {
          const tNote = createdTasks[0];
          await db.insert(notes).values({
            userId: targetUser.id,
            goalId: tNote.goalId,
            taskId: tNote.id,
            title: `Engineering Log - ${tNote.title.slice(0, 40)}`,
            content: `[dev-data] Implementation progress captured during fixture generation for ${pDate}.`,
            isPinned: false,
          });
          generatedRecordCounts.notesCreated++;
        } catch (err) {
          console.warn("Could not insert note:", err.message);
        }
      }
    }

    // 5. Recompute canonical Athena streak state and daily stats
    try {
      await streakService.processDailyStreak(targetUser.id, new Date(), tz);
    } catch (err) {
      console.warn("Could not recalculate streak state:", err.message);
    }

    return {
      success: true,
      message: `Successfully generated coherent developer history for ${targetUser.fullName || targetUser.username}.`,
      counts: generatedRecordCounts,
      summary: {
        userId: targetUser.id,
        userName: targetUser.fullName || targetUser.username,
        timezone: tz,
        daysSimulated: sim.days,
        totalFocusHours: (totalFocusMinutesAccum / 60).toFixed(1),
        hasActiveSessionPreserved: hasActiveSession,
      },
    };
  }

  /**
   * Safely deletes ONLY developer-generated data for a user without risking normal user data
   */
  static async cleanupUserData(userId) {
    if (!userId) {
      return { success: false, message: "Target userId is required." };
    }

    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      return { success: false, message: "User not found." };
    }

    const db = getDrizzleDb();
    const tz = getUserTimezone(targetUser);

    // 1. Identify dev-generated sessions
    const devSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, targetUser.id),
          like(sessions.clientSessionId, "dev-data-%")
        )
      );
    const devSessionIds = devSessions.map((s) => s.id);

    // 2. Identify dev-generated tasks and goals
    const devTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, targetUser.id),
          like(tasks.description, "[dev-data]%")
        )
      );
    const devTaskIds = devTasks.map((t) => t.id);

    const devGoals = await db
      .select({ id: goals.id })
      .from(goals)
      .where(
        and(
          eq(goals.userId, targetUser.id),
          like(goals.description, "[dev-data]%")
        )
      );
    const devGoalIds = devGoals.map((g) => g.id);

    // 3. Delete ScheduleBlocks referencing dev sessions or dev tasks
    if (devSessionIds.length > 0 || devTaskIds.length > 0) {
      const sbConditions = [];
      if (devSessionIds.length > 0) {
        sbConditions.push(inArray(scheduleBlocks.sessionId, devSessionIds));
      }
      if (devTaskIds.length > 0) {
        sbConditions.push(inArray(scheduleBlocks.taskId, devTaskIds));
      }
      await db
        .delete(scheduleBlocks)
        .where(
          and(eq(scheduleBlocks.userId, targetUser.id), or(...sbConditions))
        );
    }

    // 4. Delete dev Sessions (cascades automatically to session_tasks, session_segments, session_pause_events, session_feedback)
    if (devSessionIds.length > 0) {
      await db
        .delete(sessions)
        .where(inArray(sessions.id, devSessionIds));
    }

    // 5. Delete TaskOccurrences referencing dev tasks
    if (devTaskIds.length > 0) {
      await db
        .delete(taskOccurrences)
        .where(
          and(
            eq(taskOccurrences.userId, targetUser.id),
            inArray(taskOccurrences.taskId, devTaskIds)
          )
        );
    }

    // 6. Delete dev Tasks
    if (devTaskIds.length > 0) {
      await db
        .delete(tasks)
        .where(inArray(tasks.id, devTaskIds));
    }

    // 7. Delete dev Goals
    if (devGoalIds.length > 0) {
      await db
        .delete(goals)
        .where(inArray(goals.id, devGoalIds));
    }

    // 8. Delete dev Notes
    await db
      .delete(notes)
      .where(
        and(
          eq(notes.userId, targetUser.id),
          like(notes.content, "[dev-data]%")
        )
      );

    // 9. Clean up empty DailyStats dates and recalculate streak
    try {
      await streakService.processDailyStreak(targetUser.id, new Date(), tz);
    } catch (err) {
      console.warn("Could not recalculate streak after cleanup:", err.message);
    }

    return {
      success: true,
      message: `Cleaned up ${devSessionIds.length} dev sessions, ${devTaskIds.length} dev tasks, and ${devGoalIds.length} dev goals for ${targetUser.fullName || targetUser.username}. Real user data preserved.`,
      cleaned: {
        sessions: devSessionIds.length,
        tasks: devTaskIds.length,
        goals: devGoalIds.length,
      },
    };
  }

  /**
   * Internal Validator: Validates integrity of user data
   */
  static async validateUserData(userId) {
    if (!userId) {
      return { valid: false, message: "Target userId is required." };
    }

    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      return { valid: false, message: "User not found." };
    }

    const db = getDrizzleDb();
    const tz = getUserTimezone(targetUser);
    const now = new Date();
    const todayProductDate = getProductDate(now, tz);

    const checks = {
      ownership: { passed: true, details: "All records belong to the target user." },
      taskRelationships: { passed: true, details: "All task occurrences and session tasks reference valid user tasks." },
      occurrenceUniqueness: { passed: true, details: "Zero duplicate occurrences for (user, task, date)." },
      scheduleValidity: { passed: true, details: "All schedule blocks have chronological validity (endTime > startTime)." },
      sessionIntegrity: { passed: true, details: "All sessions have valid startedAt/endedAt bounds." },
      segmentIntegrity: { passed: true, details: "All session segments fit within session bounds." },
      pauseIntegrity: { passed: true, details: "All pause events fit within session boundaries." },
      feedbackIntegrity: { passed: true, details: "All feedback ratings within 1 to 5." },
      productDates: { passed: true, details: "Product dates adhere to YYYY-MM-DD and are not in future." },
      dailyStats: { passed: true, details: "Daily stats focus minutes and rates are mathematically consistent." },
      streak: { passed: true, details: "Running streak matches consecutive active days." },
    };

    let allPassed = true;

    // 1. Fetch user's data
    const userGoals = await db.select().from(goals).where(eq(goals.userId, targetUser.id));
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, targetUser.id));
    const userOccurrences = await db.select().from(taskOccurrences).where(eq(taskOccurrences.userId, targetUser.id));
    const userScheduleBlocks = await db.select().from(scheduleBlocks).where(eq(scheduleBlocks.userId, targetUser.id));
    const userSessions = await db.select().from(sessions).where(eq(sessions.userId, targetUser.id));
    const userStreak = await streakRepository.findByUserId(targetUser.id);
    const userDailyStats = await db.select().from(dailyStats).where(eq(dailyStats.userId, targetUser.id));

    const taskIdsSet = new Set(userTasks.map((t) => t.id));
    const sessionIdsSet = new Set(userSessions.map((s) => s.id));

    // 2. Check Task Relationships
    for (const occ of userOccurrences) {
      if (!taskIdsSet.has(occ.taskId)) {
        checks.taskRelationships.passed = false;
        checks.taskRelationships.details = `Occurrence ${occ.id} references non-owned taskId ${occ.taskId}`;
        allPassed = false;
        break;
      }
    }

    // 3. Check Occurrence Uniqueness
    const occKeySet = new Set();
    for (const occ of userOccurrences) {
      const key = `${occ.taskId}-${occ.productDate}`;
      if (occKeySet.has(key)) {
        checks.occurrenceUniqueness.passed = false;
        checks.occurrenceUniqueness.details = `Duplicate occurrence found for ${key}`;
        allPassed = false;
        break;
      }
      occKeySet.add(key);
    }

    // 4. Check Schedule Validity
    for (const sb of userScheduleBlocks) {
      if (!taskIdsSet.has(sb.taskId)) {
        checks.scheduleValidity.passed = false;
        checks.scheduleValidity.details = `Schedule block ${sb.id} references invalid taskId`;
        allPassed = false;
        break;
      }
      if (new Date(sb.endTime).getTime() <= new Date(sb.startTime).getTime()) {
        checks.scheduleValidity.passed = false;
        checks.scheduleValidity.details = `Schedule block ${sb.id} has endTime <= startTime`;
        allPassed = false;
        break;
      }
    }

    // 5. Check Session Integrity & Children
    for (const sess of userSessions) {
      if (sess.endedAt && new Date(sess.endedAt).getTime() < new Date(sess.startedAt).getTime()) {
        checks.sessionIntegrity.passed = false;
        checks.sessionIntegrity.details = `Session ${sess.id} ended before it started`;
        allPassed = false;
        break;
      }
    }

    // Check Segments
    if (sessionIdsSet.size > 0) {
      const userSegments = await db
        .select()
        .from(sessionSegments)
        .where(inArray(sessionSegments.sessionId, Array.from(sessionIdsSet)));

      for (const seg of userSegments) {
        if (seg.durationSeconds < 0 || seg.totalDurationSeconds <= 0) {
          checks.segmentIntegrity.passed = false;
          checks.segmentIntegrity.details = `Segment ${seg.id} has invalid duration`;
          allPassed = false;
          break;
        }
      }

      // Check Pause Events
      const userPauses = await db
        .select()
        .from(sessionPauseEvents)
        .where(inArray(sessionPauseEvents.sessionId, Array.from(sessionIdsSet)));

      for (const pe of userPauses) {
        if (pe.endTime && new Date(pe.endTime).getTime() < new Date(pe.startTime).getTime()) {
          checks.pauseIntegrity.passed = false;
          checks.pauseIntegrity.details = `Pause ${pe.id} has endTime < startTime`;
          allPassed = false;
          break;
        }
      }

      // Check Feedback
      const userFeedback = await db
        .select()
        .from(sessionFeedback)
        .where(inArray(sessionFeedback.sessionId, Array.from(sessionIdsSet)));

      for (const fb of userFeedback) {
        if (fb.moodRating && (fb.moodRating < 1 || fb.moodRating > 5)) {
          checks.feedbackIntegrity.passed = false;
          checks.feedbackIntegrity.details = `Feedback ${fb.id} has invalid moodRating ${fb.moodRating}`;
          allPassed = false;
          break;
        }
      }
    }

    // 6. Check Product Dates (no historical records in the future)
    for (const occ of userOccurrences) {
      if (occ.productDate > todayProductDate) {
        // Only if not scheduled for future
        if (occ.outcome === "completed" || occ.outcome === "missed") {
          checks.productDates.passed = false;
          checks.productDates.details = `Completed occurrence date ${occ.productDate} is in the future`;
          allPassed = false;
          break;
        }
      }
    }

    // 7. Check DailyStats consistency
    for (const ds of userDailyStats) {
      if (ds.focusMinutes < 0) {
        checks.dailyStats.passed = false;
        checks.dailyStats.details = `Daily stats ${ds.productDate} has negative focus minutes`;
        allPassed = false;
        break;
      }
    }

    // 8. Streak check
    if (userStreak) {
      if (userStreak.currentStreak < 0 || userStreak.longestStreak < userStreak.currentStreak) {
        checks.streak.passed = false;
        checks.streak.details = `Streak counts invalid: current=${userStreak.currentStreak}, longest=${userStreak.longestStreak}`;
        allPassed = false;
      }
    }

    return {
      valid: allPassed,
      userId: targetUser.id,
      userName: targetUser.fullName || targetUser.username,
      checks,
      summary: allPassed ? "VALID" : "INVALID",
    };
  }

  /**
   * Delete entire test dataset (test user accounts)
   */
  static async deleteDataset(datasetId) {
    const db = getDrizzleDb();
    const allDevUsers = await db
      .select()
      .from(users)
      .where(like(users.email, `${datasetId}-dev-%@athena.test`));
    const userIds = allDevUsers.map((u) => u.id);

    if (userIds.length === 0) {
      return { success: false, message: "Dataset not found or already deleted." };
    }

    for (const uid of userIds) {
      await userRepository.delete(uid);
    }

    return { success: true };
  }

  /**
   * Generate brand new test accounts with dataset ID
   */
  static async generate(payload) {
    const {
      profile = "realistic",
      numUsers = 1,
      historyDays = 30,
      activityLevel = "moderate",
      behavior = "consistent_student",
      seed = Math.floor(Math.random() * 100000).toString(),
    } = payload;

    const datasetId = `${profile}-${seed}-${historyDays}d`;
    const generatedUsers = [];

    for (let i = 1; i <= (parseInt(numUsers, 10) || 1); i++) {
      const paddedId = i.toString().padStart(3, "0");
      const email = `${datasetId}-dev-${paddedId}@athena.test`;
      const username = `dev_${datasetId.replace(/-/g, "_")}_${paddedId}`;
      const fullName = `Dev User ${paddedId} (${profile.replace(/_/g, " ")})`;
      const password = "developerPassword123!";

      let user = await userRepository.findByEmail(email);
      if (!user) {
        user = await userRepository.create({
          username,
          fullName,
          email,
          password,
          accountType: "user",
          isEmailVerified: true,
        });
        await streakRepository.createForUser(user.id);
      }

      await this.addDataToUser({
        userId: user.id,
        profile,
        historyDays,
        activityLevel,
        behavior,
        seed: `${seed}-${i}`,
      });

      generatedUsers.push(user);
    }

    return {
      success: true,
      message: `Generated test dataset '${datasetId}' with ${generatedUsers.length} test user account(s).`,
      datasetId,
      userCount: generatedUsers.length,
    };
  }
}
