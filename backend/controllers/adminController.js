import userRepository from "../repositories/userRepository.js";
import streakRepository from "../repositories/streakRepository.js";
import { getDrizzleDb } from "../db/index.js";
import { sessions } from "../db/schema/sessions.js";
import { count, desc } from "drizzle-orm";

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

  static async getSessions(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const skip = (page - 1) * limit;

      const db = getDrizzleDb();
      const [countResult, rows] = await Promise.all([
        db.select({ count: count() }).from(sessions),
        db.select().from(sessions).orderBy(desc(sessions.createdAt)).offset(skip).limit(limit),
      ]);

      const total = Number(countResult[0]?.count || 0);

      res.status(200).json({
        success: true,
        sessions: rows,
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
}

export default adminController;
