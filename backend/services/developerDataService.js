import crypto from "crypto";
import { getDrizzleDb } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { sessions } from "../db/schema/sessions.js";
import { goals } from "../db/schema/goals.js";
import { tasks } from "../db/schema/tasks.js";
import { taskOccurrences } from "../db/schema/taskOccurrences.js";
import { streaks } from "../db/schema/streaks.js";
import { eq, like, inArray, sql } from "drizzle-orm";
import userRepository from "../repositories/userRepository.js";
import streakRepository from "../repositories/streakRepository.js";

// Deterministic PRNG
function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277,
      h3 = 1013904242, h4 = 2773480762;
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
  h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function sfc32(a, b, c, d) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
    let t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}

const SAMPLE_SUBJECTS = [
  "Algorithms & Data Structures",
  "System Architecture",
  "Frontend Engineering",
  "Database Optimization",
  "Distributed Systems",
  "Machine Learning Foundations",
  "Cloud Infrastructure",
  "Network Security"
];

const SAMPLE_TASK_TEMPLATES = [
  "Implement binary search tree rotations",
  "Design caching layer with Redis",
  "Draft API specification document",
  "Solve 3 medium LeetCode problems",
  "Refactor state reducer hooks",
  "Optimize Postgres indexing strategy",
  "Write unit tests for authentication flow",
  "Review microservices communication pattern",
  "Complete mock interview session",
  "Profile web app rendering performance"
];

export default class DeveloperDataService {
  static async getDatasets() {
    const db = getDrizzleDb();
    const allDevUsers = await db.select().from(users).where(like(users.email, "%@athena.test"));
    
    const datasetsMap = new Map();
    for (const user of allDevUsers) {
      const emailParts = user.email.split('-dev-');
      if (emailParts.length === 2) {
        const datasetId = emailParts[0];
        
        if (!datasetsMap.has(datasetId)) {
          const parts = datasetId.split('-');
          const profile = parts[0] || 'unknown';
          const seed = parts[1] || '0';
          const daysStr = parts[2] || '0d';
          const days = parseInt(daysStr.replace('d', ''), 10);

          datasetsMap.set(datasetId, {
            id: datasetId,
            name: `${profile.replace(/_/g, ' ').toUpperCase()} Dataset`,
            profile,
            seed,
            days: days || 30,
            userCount: 0,
            createdAt: user.createdAt || new Date()
          });
        }
        datasetsMap.get(datasetId).userCount++;
      }
    }
    
    return Array.from(datasetsMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  static getBehaviorMultiplier(activityLevel) {
    switch (activityLevel?.toLowerCase()) {
      case 'low': return 0.55;
      case 'high': return 1.6;
      case 'intense': return 2.4;
      case 'moderate':
      default: return 1.0;
    }
  }

  static getPreviewNotes(profile, behavior, activityLevel) {
    const notes = [];
    switch (profile) {
      case 'realistic':
        notes.push('Balanced task completion rate (~70%).');
        notes.push('1-3 focus sessions per active day.');
        notes.push('Realistic weekday vs weekend distribution.');
        break;
      case 'focus_heavy':
        notes.push('3-5 deep focus sessions per day.');
        notes.push('Extended pomodoro durations (45-60 min).');
        notes.push('High concentration of logged focus minutes.');
        break;
      case 'planner_heavy':
        notes.push('High task occurrence density across calendar.');
        notes.push('Frequent scheduled time blocks.');
        notes.push('Detailed todo breakdowns with scheduled dates.');
        break;
      case 'inconsistent':
        notes.push('Sporadic activity clusters with gaps of inactivity.');
        notes.push('Elevated abandoned session rate (~30%).');
        notes.push('Fluctuating streaks with frequent resets.');
        break;
      case 'overloaded':
        notes.push('High density of concurrent tasks (6+ tasks daily).');
        notes.push('Elevated rescheduled & overdue occurrences.');
        notes.push('Tight focus intervals with potential burnout triggers.');
        break;
      case 'custom':
        notes.push('Customized configuration parameters.');
        break;
      default:
        notes.push('Standard realistic activity profile.');
    }

    if (behavior === 'night_owl') {
      notes.push('Sessions concentrated in late night hours (21:00 - 02:30).');
    } else if (behavior === 'early_bird') {
      notes.push('Sessions concentrated in early morning (06:00 - 11:30).');
    } else if (behavior === 'crammer') {
      notes.push('Activity concentrated in high-intensity bursts before target milestones.');
    } else if (behavior === 'procrastinator') {
      notes.push('Higher rate of rescheduled occurrences and paused sessions.');
    } else if (behavior === 'deep_worker') {
      notes.push('Long continuous focus blocks with zero or minimal pause events.');
    }

    return notes;
  }

  static async preview(payload) {
    const {
      profile = 'realistic',
      numUsers = 1,
      historyDays = 30,
      activityLevel = 'moderate',
      behavior = 'consistent_student',
      seed = '42',
      userId
    } = payload;

    const days = parseInt(historyDays, 10) || 30;
    const usersCount = parseInt(numUsers, 10) || 1;
    const actMult = this.getBehaviorMultiplier(activityLevel);

    let profileSessionMult = 1.0;
    let profileTaskMult = 1.0;
    let completionRate = 0.75;

    if (profile === 'focus_heavy') { profileSessionMult = 2.2; profileTaskMult = 1.0; }
    else if (profile === 'planner_heavy') { profileSessionMult = 0.7; profileTaskMult = 2.4; }
    else if (profile === 'inconsistent') { profileSessionMult = 0.6; profileTaskMult = 0.8; completionRate = 0.45; }
    else if (profile === 'overloaded') { profileSessionMult = 1.4; profileTaskMult = 2.6; completionRate = 0.55; }
    else if (profile === 'realistic') { profileSessionMult = 1.1; profileTaskMult = 1.1; }

    const seedStr = `${profile}-${usersCount}-${days}-${activityLevel}-${behavior}-${seed}`;
    const seed128 = cyrb128(seedStr);
    const rand = sfc32(seed128[0], seed128[1], seed128[2], seed128[3]);

    const sessionsPerDay = (1.5 * profileSessionMult * actMult);
    const estimatedSessionsPerUser = Math.max(1, Math.floor(days * sessionsPerDay * (0.85 + rand() * 0.3)));
    const avgSessionMinutes = profile === 'focus_heavy' ? 45 : 30;
    const totalFocusMinutes = estimatedSessionsPerUser * avgSessionMinutes;
    const estimatedFocusHours = (totalFocusMinutes / 60).toFixed(1);

    const tasksPerUser = Math.max(3, Math.floor((6 + rand() * 8) * profileTaskMult * actMult));
    const occurrencesPerUser = Math.max(tasksPerUser, Math.floor(days * 2.2 * profileTaskMult * actMult));

    let userDetails = null;
    if (userId) {
      try {
        const u = await userRepository.findById(userId);
        if (u) {
          userDetails = {
            id: u.id,
            fullName: u.fullName || u.username,
            email: u.email
          };
        }
      } catch (e) {
        // ignore
      }
    }

    const estimatedStreak = profile === 'inconsistent' 
      ? Math.floor(1 + rand() * 3) 
      : Math.min(days, Math.floor(days * 0.4 + rand() * 5));

    return {
      targetUser: userDetails,
      estimatedUsers: usersCount,
      estimatedDays: days,
      estimatedSessions: estimatedSessionsPerUser * usersCount,
      estimatedFocusHours: (parseFloat(estimatedFocusHours) * usersCount).toFixed(1),
      estimatedTasks: tasksPerUser * usersCount,
      estimatedOccurrences: occurrencesPerUser * usersCount,
      expectedCompletionRate: `${Math.round(completionRate * 100)}%`,
      estimatedStreak,
      behavioralNotes: this.getPreviewNotes(profile, behavior, activityLevel)
    };
  }

  static async addDataToUser(payload) {
    const {
      userId,
      profile = 'realistic',
      historyDays = 30,
      activityLevel = 'moderate',
      behavior = 'consistent_student',
      seed = Math.floor(Math.random() * 100000).toString()
    } = payload;

    if (!userId) {
      return { success: false, message: "Target userId is required." };
    }

    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      return { success: false, message: "User not found." };
    }

    const days = Math.min(180, Math.max(1, parseInt(historyDays, 10) || 30));
    const actMult = this.getBehaviorMultiplier(activityLevel);

    const seedStr = `${userId}-${profile}-${days}-${activityLevel}-${behavior}-${seed}`;
    const seed128 = cyrb128(seedStr);
    const rand = sfc32(seed128[0], seed128[1], seed128[2], seed128[3]);

    const db = getDrizzleDb();
    const now = new Date();

    // 1. Create or ensure a couple of Goals for user
    const sampleGoalTitles = [
      SAMPLE_SUBJECTS[Math.floor(rand() * SAMPLE_SUBJECTS.length)],
      SAMPLE_SUBJECTS[Math.floor(rand() * SAMPLE_SUBJECTS.length)]
    ];
    const createdGoalIds = [];

    for (const gTitle of sampleGoalTitles) {
      try {
        const [newGoal] = await db.insert(goals).values({
          userId: targetUser.id,
          title: gTitle,
          description: `Goal generated via Developer Fixture (${profile})`,
          status: 'active',
          progress: (rand() * 85).toFixed(2),
          color: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(rand() * 5)],
          startDate: new Date(now.getTime() - days * 86400000).toISOString().split('T')[0],
          dueDate: new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0]
        }).returning({ id: goals.id });
        if (newGoal?.id) createdGoalIds.push(newGoal.id);
      } catch (err) {
        console.warn("Could not insert sample goal:", err.message);
      }
    }

    // 2. Create Tasks
    const taskCount = Math.max(3, Math.floor((5 + rand() * 6) * actMult));
    const createdTasks = [];

    for (let t = 0; t < taskCount; t++) {
      const templateTitle = SAMPLE_TASK_TEMPLATES[(t + Math.floor(rand() * 5)) % SAMPLE_TASK_TEMPLATES.length];
      const goalId = createdGoalIds.length > 0 ? createdGoalIds[t % createdGoalIds.length] : null;
      try {
        const [newTask] = await db.insert(tasks).values({
          userId: targetUser.id,
          goalId,
          title: templateTitle,
          description: `Synthetic task generated for ${profile} scenario.`,
          status: rand() > 0.35 ? 'completed' : 'todo',
          priority: ['low', 'medium', 'high'][Math.floor(rand() * 3)],
          orderIndex: t,
          dueDate: new Date(now.getTime() + (t - 2) * 86400000).toISOString().split('T')[0]
        }).returning();
        if (newTask) createdTasks.push(newTask);
      } catch (err) {
        console.warn("Could not insert sample task:", err.message);
      }
    }

    // 3. Generate Task Occurrences across historical days
    let occurrencesCreated = 0;
    if (createdTasks.length > 0) {
      for (let d = 0; d < days; d++) {
        // determine if this day has tasks
        const dayDate = new Date(now.getTime() - (days - d) * 86400000);
        const dayString = dayDate.toISOString().split('T')[0];

        // Weekend lower activity
        const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
        if (isWeekend && rand() > 0.4 && behavior !== 'night_owl') continue;

        const dailyCount = Math.floor((1 + rand() * 3) * actMult);
        for (let oc = 0; oc < dailyCount; oc++) {
          const taskObj = createdTasks[Math.floor(rand() * createdTasks.length)];
          const outcomeChoices = profile === 'inconsistent'
            ? ['completed', 'rescheduled', 'missed', 'partially_completed']
            : ['completed', 'completed', 'completed', 'partially_completed', 'rescheduled'];
          const outcome = outcomeChoices[Math.floor(rand() * outcomeChoices.length)];

          try {
            await db.insert(taskOccurrences).values({
              userId: targetUser.id,
              taskId: taskObj.id,
              productDate: dayString,
              outcome,
              completedAt: outcome === 'completed' ? new Date(dayDate.getTime() + 14 * 3600000) : null,
              snapshotTitle: taskObj.title,
              snapshotPriority: taskObj.priority || 'medium',
              notes: outcome === 'rescheduled' ? 'Rescheduled due to workload' : ''
            });
            occurrencesCreated++;
          } catch (err) {
            // ignore duplicate or foreign key issue
          }
        }
      }
    }

    // 4. Generate Sessions
    let sessionsCreated = 0;
    let totalFocusMinutesAccum = 0;

    for (let d = 0; d < days; d++) {
      const dayDate = new Date(now.getTime() - (days - d) * 86400000);
      const dayString = dayDate.toISOString().split('T')[0];

      // Inconsistent profile skips some days completely
      if (profile === 'inconsistent' && rand() > 0.5) continue;

      let sessionsToday = 1;
      if (profile === 'focus_heavy') sessionsToday = Math.floor((2 + rand() * 3) * actMult);
      else if (profile === 'planner_heavy') sessionsToday = Math.floor((1 + rand() * 1.5) * actMult);
      else sessionsToday = Math.floor((1 + rand() * 2.2) * actMult);

      for (let s = 0; s < sessionsToday; s++) {
        // determine start hour based on behavior
        let startHour = 14;
        if (behavior === 'night_owl') startHour = 21 + Math.floor(rand() * 4); // 21h - 01h
        else if (behavior === 'early_bird') startHour = 6 + Math.floor(rand() * 4); // 6h - 10h
        else if (behavior === 'crammer') startHour = rand() > 0.5 ? 22 : 11;
        else startHour = 9 + Math.floor(rand() * 9); // 9h - 18h

        const sessionStart = new Date(dayDate);
        sessionStart.setHours(startHour % 24, Math.floor(rand() * 50), 0, 0);

        const durationMinutes = profile === 'focus_heavy' ? (35 + Math.floor(rand() * 25)) : (20 + Math.floor(rand() * 15));
        const durationSec = durationMinutes * 60;
        const sessionEnd = new Date(sessionStart.getTime() + durationSec * 1000);

        const isAbandoned = profile === 'inconsistent' && rand() < 0.28;
        const completionType = isAbandoned ? 'abandoned' : 'completed';
        const focusMins = isAbandoned ? Math.floor(durationMinutes * 0.4) : durationMinutes;

        const clientSessionId = `dev-${targetUser.id.substring(0, 8)}-${Date.now()}-${d}-${s}`;

        try {
          await db.insert(sessions).values({
            clientSessionId,
            userId: targetUser.id,
            title: `Focus Session: ${SAMPLE_SUBJECTS[Math.floor(rand() * SAMPLE_SUBJECTS.length)]}`,
            sessionType: rand() > 0.4 ? 'task' : 'quick',
            status: 'completed',
            completionType,
            sessionTaskOutcome: completionType === 'completed' ? 'completed' : 'partially_completed',
            startedAt: sessionStart,
            endedAt: sessionEnd,
            plannedDurationSeconds: durationSec,
            durationSeconds: isAbandoned ? Math.floor(durationSec * 0.4) : durationSec,
            totalFocusMinutes: focusMins,
            totalBreakMinutes: Math.floor(durationMinutes * 0.18),
            pauseCount: behavior === 'deep_worker' ? 0 : Math.floor(rand() * 2),
            totalPauseDurationSeconds: behavior === 'deep_worker' ? 0 : Math.floor(rand() * 120),
            focusSegmentsCompleted: Math.max(1, Math.floor(durationMinutes / 25)),
            breakSegmentsCompleted: Math.floor(durationMinutes / 25) - 1,
            snapshotScheduleDate: dayString
          });
          sessionsCreated++;
          totalFocusMinutesAccum += focusMins;
        } catch (err) {
          console.warn("Could not insert session:", err.message);
        }
      }
    }

    // 5. Update Streaks for User
    try {
      const streakRecord = await streakRepository.findByUserId(targetUser.id);
      const calculatedCurrentStreak = profile === 'inconsistent' 
        ? Math.floor(1 + rand() * 3) 
        : Math.min(days, Math.floor(days * 0.5 + 2));
      const calculatedLongest = Math.max(calculatedCurrentStreak, Math.floor(days * 0.8));

      const streakData = {
        userId: targetUser.id,
        currentStreak: calculatedCurrentStreak,
        longestStreak: calculatedLongest,
        lastActiveDate: now.toISOString().split('T')[0],
        dailyTargetMinutes: 25,
        freezeBalance: profile === 'inconsistent' ? 1 : 3
      };

      if (streakRecord) {
        await streakRepository.update(targetUser.id, streakData);
      } else {
        await streakRepository.create(targetUser.id, streakData);
      }
    } catch (err) {
      console.warn("Could not update streaks:", err.message);
    }

    return {
      success: true,
      message: `Successfully generated ${sessionsCreated} sessions, ${createdTasks.length} tasks, and ${occurrencesCreated} occurrences for ${targetUser.fullName || targetUser.username}.`,
      summary: {
        userId: targetUser.id,
        userName: targetUser.fullName || targetUser.username,
        sessionsCreated,
        tasksCreated: createdTasks.length,
        occurrencesCreated,
        totalFocusHours: (totalFocusMinutesAccum / 60).toFixed(1),
        daysSimulated: days
      }
    };
  }

  static async deleteDataset(datasetId) {
    const db = getDrizzleDb();
    const allDevUsers = await db.select().from(users).where(like(users.email, `${datasetId}-dev-%@athena.test`));
    const userIds = allDevUsers.map(u => u.id);
    
    if (userIds.length === 0) {
      return { success: false, message: "Dataset not found or already deleted." };
    }
    
    for (const uid of userIds) {
      await userRepository.delete(uid);
    }
    
    return { success: true };
  }

  static async generate(payload) {
    const { profile = 'realistic', numUsers = 1, historyDays = 30, activityLevel = 'moderate', behavior = 'consistent_student', seed = Math.floor(Math.random() * 100000).toString() } = payload;
    
    const datasetId = `${profile}-${seed}-${historyDays}d`;
    const generatedUsers = [];
    
    for (let i = 1; i <= (parseInt(numUsers, 10) || 1); i++) {
      const paddedId = i.toString().padStart(3, '0');
      const email = `${datasetId}-dev-${paddedId}@athena.test`;
      const username = `dev_${datasetId.replace(/-/g, '_')}_${paddedId}`;
      const fullName = `Dev User ${paddedId} (${profile.replace(/_/g, ' ')})`;
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
        await streakRepository.create(user.id);
      }

      // Add data to this newly created test user using addDataToUser
      await this.addDataToUser({
        userId: user.id,
        profile,
        historyDays,
        activityLevel,
        behavior,
        seed: `${seed}-${i}`
      });

      generatedUsers.push(user);
    }
    
    return { 
      success: true, 
      message: `Generated test dataset '${datasetId}' with ${generatedUsers.length} test user account(s).`,
      datasetId,
      userCount: generatedUsers.length
    };
  }
}
