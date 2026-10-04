import crypto from "crypto";
import jwt from "jsonwebtoken";
import userRepository from "../repositories/userRepository.js";
import streakRepository from "../repositories/streakRepository.js";
import EmailService from "./emailService.js";
import env from "../config/env.js";

// Ephemeral in-memory OTP cache with TTL to avoid polluting relational PostgreSQL schema
const otpCache = new Map();

class AuthService {
  static generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
  }

  static hashOTP(otp) {
    return crypto.createHash("sha256").update(String(otp)).digest("hex");
  }

  static verifyOTPHash(storedHash, plainOtp) {
    if (!storedHash || !plainOtp) return false;
    const computedHash = this.hashOTP(plainOtp);
    const storedBuffer = Buffer.from(storedHash, "utf-8");
    const computedBuffer = Buffer.from(computedHash, "utf-8");
    if (storedBuffer.length !== computedBuffer.length) return false;
    return crypto.timingSafeEqual(storedBuffer, computedBuffer);
  }

  static setOtp(key, otp, ttlMs = 10 * 60 * 1000) {
    otpCache.set(key, {
      hash: this.hashOTP(otp),
      expires: Date.now() + ttlMs,
    });
  }

  static getValidOtpHash(key) {
    const entry = otpCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      otpCache.delete(key);
      return null;
    }
    return entry.hash;
  }

  static clearOtp(key) {
    otpCache.delete(key);
  }

  static generateToken(userId) {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  static async registerUser(userData) {
    const { username, email, password, fullName } = userData;
    const usernameLower = username.toLowerCase();

    const existingByEmail = await userRepository.findByEmail(email);
    if (existingByEmail) {
      throw new Error("Email already registered");
    }

    const existingByUsername = await userRepository.findByUsernameLower(usernameLower);
    if (existingByUsername) {
      throw new Error("Username already taken");
    }

    const otp = this.generateOTP();
    this.setOtp(`verify:${email.toLowerCase()}`, otp);

    const user = await userRepository.create({
      username,
      email,
      password,
      fullName,
      isEmailVerified: false,
    });

    await streakRepository.createForUser(user.id);

    try {
      await EmailService.sendVerificationOTP(email, otp, fullName);
    } catch (error) {
      console.warn(error);
    }

    return {
      message: "Registration successful. Please check your email for verification code.",
    };
  }

  static async resendCode(userData) {
    const { email, fullName } = userData || {};
    if (!email) {
      return { message: "Please check your email for verification code." };
    }

    const user = await userRepository.findByEmail(email);

    // If user does not exist or is already verified, do not alter account state or leak existence
    if (!user || user.isEmailVerified) {
      return { message: "Please check your email for verification code." };
    }

    const otp = this.generateOTP();
    this.setOtp(`verify:${email.toLowerCase()}`, otp);

    try {
      await EmailService.sendVerificationOTP(email, otp, fullName || user.fullName);
    } catch (error) {
      console.warn(error);
    }
    return { message: "Please check your email for verification code." };
  }

  static async verifyEmail(email, otp) {
    if (!email || !otp) {
      throw new Error("Invalid or expired verification code");
    }

    const key = `verify:${email.toLowerCase()}`;
    const storedHash = this.getValidOtpHash(key);

    if (!storedHash || !this.verifyOTPHash(storedHash, otp)) {
      throw new Error("Invalid or expired verification code");
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid or expired verification code");
    }

    await userRepository.update(user.id, { isEmailVerified: true });
    this.clearOtp(key);

    return { message: "Email verified successfully" };
  }

  static async loginUser(usernameOrEmail, password) {
    const user = await userRepository.findByEmailOrUsername(usernameOrEmail);

    if (!user || !(await user.comparePassword(password))) {
      throw new Error("Invalid credentials");
    }

    if (!user.isEmailVerified) {
      return {
        success: false,
        message: "Please verify your email before logging in",
        userData: { fullName: user.fullName, email: user.email },
      };
    }

    await userRepository.updateLastLogin(user.id);
    const token = this.generateToken(user.id);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        _id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        type: user.type,
        settings: user.settings,
      },
    };
  }

  static async requestPasswordReset(email) {
    const user = await userRepository.findByEmail(email);

    if (user && user.isActive) {
      const otp = this.generateOTP();
      this.setOtp(`reset:${email.toLowerCase()}`, otp);

      // Send reset email with plain OTP
      try {
        await EmailService.sendPasswordResetOTP(email, otp, user.fullName);
      } catch (error) {
        console.warn(error);
      }
    }

    return {
      message:
        "If an account exists with this email address, a password reset code has been sent.",
    };
  }

  static async resetPassword(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
      throw new Error("Invalid or expired reset code");
    }

    const key = `reset:${email.toLowerCase()}`;
    const storedHash = this.getValidOtpHash(key);

    if (!storedHash || !this.verifyOTPHash(storedHash, otp)) {
      throw new Error("Invalid or expired reset code");
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid or expired reset code");
    }

    await userRepository.update(user.id, { password: newPassword });
    this.clearOtp(key);

    return { message: "Password reset successfully" };
  }

  // Get user by ID
  static async getUserById(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  // Change authenticated password
  static async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new Error("Current password and new password are required");
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error("Current password is incorrect");
    }

    if (currentPassword === newPassword) {
      throw new Error("New password must be different from current password");
    }

    await userRepository.update(user.id, { password: newPassword });

    return { message: "Password changed successfully" };
  }
}

export default AuthService;
