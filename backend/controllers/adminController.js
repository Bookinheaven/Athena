import userRepository from "../repositories/userRepository.js";
import streakRepository from "../repositories/streakRepository.js";
import { getDrizzleDb } from "../db/index.js";
import { sessions } from "../db/schema/sessions.js";
import { users } from "../db/schema/users.js";
import { tasks } from "../db/schema/tasks.js";
import { goals } from "../db/schema/goals.js";
import { count, desc, eq, sql } from "drizzle-orm";
import DeveloperDataService from "../services/developerDataService.js";

class adminController {
  static async getUsers(req, res) {
    try {
      const usersList = await userRepository.findAll();
      const sanitized = usersList.map(({ password, passwordHash, ...u }) => u);
      res.json({
        success: true,
        users: sanitized,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async removeUsers(req, res) {
    const errors = [];
    async function deleteAccount(id) {
      const user = await userRepository.delete(id);
      if (!user) {
        errors.push({
          id,
          message: "User not found.",
        });
      }
    }
    try {
      const list = req.body?.data;
      if (Array.isArray(list) && list.length > 0) {
        for (const element of list) {
          await deleteAccount(element);
        }
      }
      if (errors.length > 0) {
        const errorDetails = errors.map((err) => `${err.id}: ${err.message}`).join(", ");
        return res.status(400).json({
          success: false,
          message: `Failed users: ${errorDetails}`,
          errors,
        });
      }
      res.json({
        success: true,
        message: "Users removed successfully.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async addUsers(req, res) {
    try {
      const { username, fullName, email, password, type } = req.body || {};

      const existingEmail = await userRepository.findByEmail(email);
      const existingUser = await userRepository.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists.",
        });
      }

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already used.",
        });
      }

      const user = await userRepository.create({
        username,
        fullName,
        email,
        password,
        accountType: type || "user",
        isEmailVerified: true,
      });

      await streakRepository.create(user.id);

      const { password: _p, passwordHash: _ph, ...userObj } = user;

      res.status(201).json({
        success: true,
        message: "User created successfully.",
        user: userObj,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id, user } = req.body || {};
      if (!id || !user || typeof user !== "object") {
        return res.status(400).json({
          success: false,
          message: "Invalid user update payload.",
        });
      }

      const existingUser = await userRepository.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const updateData = {};
      if (user.username !== undefined) updateData.username = user.username;
      if (user.fullName !== undefined) updateData.fullName = user.fullName;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.type !== undefined) updateData.accountType = user.type;
      if (user.isActive !== undefined) updateData.isActive = Boolean(user.isActive);
      if (user.isEmailVerified !== undefined) updateData.isEmailVerified = Boolean(user.isEmailVerified);
      if (user.password) updateData.password = user.password;

      const updated = await userRepository.update(id, updateData);
      const { password: _p, passwordHash: _ph, ...userObj } = updated;

      res.json({
        success: true,
        message: "User updated successfully.",
        updateUser: userObj,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getUserDetails(req, res) {
    try {
      const { id } = req.params;
      const user = await userRepository.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const db = getDrizzleDb();
      const [streak, sessionsStats, tasksStats, goalsStats, recentSessions, recentTasks] = await Promise.all([
        streakRepository.findByUserId(user.id),
        db
          .select({
            count: count(),
            totalMinutes: sql`coalesce(sum(${sessions.totalFocusMinutes}), 0)`,
          })
          .from(sessions)
          .where(eq(sessions.userId, user.id)),
        db
          .select({
            count: count(),
            completedCount: sql`coalesce(count(case when ${tasks.status} = 'completed' then 1 end), 0)`,
          })
          .from(tasks)
          .where(eq(tasks.userId, user.id)),
        db
          .select({ count: count() })
          .from(goals)
          .where(eq(goals.userId, user.id)),
        db
          .select()
          .from(sessions)
          .where(eq(sessions.userId, user.id))
          .orderBy(desc(sessions.createdAt))
          .limit(8),
        db
          .select()
          .from(tasks)
          .where(eq(tasks.userId, user.id))
          .orderBy(desc(tasks.createdAt))
          .limit(8),
      ]);

      const { password, passwordHash, ...sanitizedUser } = user;

      res.status(200).json({
        success: true,
        user: sanitizedUser,
        streak: streak || null,
        stats: {
          totalSessions: Number(sessionsStats[0]?.count || 0),
          totalFocusMinutes: Number(sessionsStats[0]?.totalMinutes || 0),
          totalTasks: Number(tasksStats[0]?.count || 0),
          completedTasks: Number(tasksStats[0]?.completedCount || 0),
          totalGoals: Number(goalsStats[0]?.count || 0),
        },
        recentSessions: recentSessions || [],
        recentTasks: recentTasks || [],
      });
    } catch (error) {
      console.error("Error in getUserDetails:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getSessions(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const skip = (page - 1) * limit;

      const db = getDrizzleDb();
      const [countResult, rows] = await Promise.all([
        db.select({ count: count() }).from(sessions),
        db
          .select({
            session: sessions,
            userFullName: users.fullName,
            username: users.username,
            userEmail: users.email,
          })
          .from(sessions)
          .leftJoin(users, eq(sessions.userId, users.id))
          .orderBy(desc(sessions.createdAt))
          .offset(skip)
          .limit(limit),
      ]);

      const total = Number(countResult[0]?.count || 0);

      const formatted = rows.map(({ session, userFullName, username, userEmail }) => ({
        ...session,
        userName: userFullName || username || "Unknown User",
        userEmail: userEmail || "",
      }));

      res.status(200).json({
        success: true,
        sessions: formatted,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error in getSessions:", error);
      res.status(500).json({
        message: "Server error while fetching session.",
        error: error.message,
      });
    }
  }

  static async getDeveloperDatasets(req, res) {
    try {
      const datasets = await DeveloperDataService.getDatasets();
      res.status(200).json({ success: true, datasets });
    } catch (error) {
      console.error("Error in getDeveloperDatasets:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async previewDeveloperData(req, res) {
    try {
      const preview = await DeveloperDataService.preview(req.body);
      res.status(200).json({ success: true, preview });
    } catch (error) {
      console.error("Error in previewDeveloperData:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async generateDeveloperData(req, res) {
    try {
      const result = await DeveloperDataService.generate(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in generateDeveloperData:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async addDataToUser(req, res) {
    try {
      const result = await DeveloperDataService.addDataToUser(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in addDataToUser:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteDeveloperDataset(req, res) {
    try {
      const result = await DeveloperDataService.deleteDataset(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in deleteDeveloperDataset:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default adminController;
