import crypto from 'crypto';
import User from '../models/userModel.js';
import Streak from '../models/streakModel.js'
import jwt from 'jsonwebtoken';
import EmailService from './emailService.js';
import env from '../config/env.js';

class AuthService {
  static generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
  }

  static hashOTP(otp) {
    return crypto.createHash('sha256').update(String(otp)).digest('hex');
  }

  static verifyOTPHash(storedHash, plainOtp) {
    if (!storedHash || !plainOtp) return false;
    const computedHash = this.hashOTP(plainOtp);
    const storedBuffer = Buffer.from(storedHash, 'utf-8');
    const computedBuffer = Buffer.from(computedHash, 'utf-8');
    if (storedBuffer.length !== computedBuffer.length) return false;
    return crypto.timingSafeEqual(storedBuffer, computedBuffer);
  }

  static generateToken(userId) {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });
  }

  static async registerUser(userData) {
    const { username, email, password, fullName } = userData;
    const usernameLower = username.toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ email }, { usernameLower }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email already registered');
      }
      if (existingUser.usernameLower === usernameLower) {
        throw new Error("Username already taken");
      }
    }

    const otp = this.generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = new User({
      username,
      usernameLower,
      email,
      password,
      fullName,
      emailVerificationOTP: this.hashOTP(otp),
      emailVerificationExpires: otpExpires
    });

    await user.save();
    await Streak.create({
      userId: user._id
    });

    try {
      await EmailService.sendVerificationOTP(email, otp, fullName);
    } catch (error) {
      console.warn(error)
    }

    return { message: 'Registration successful. Please check your email for verification code.' };
  }

  static async resendCode(userData) {
    const { email, fullName } = userData || {};
    if (!email) {
      return { message: 'Please check your email for verification code.' };
    }

    const user = await User.findOne({ email });

    // If user does not exist or is already verified, do not alter account state or leak existence
    if (!user || user.isEmailVerified) {
      return { message: 'Please check your email for verification code.' };
    }

    const otp = this.generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerificationOTP = this.hashOTP(otp);
    user.emailVerificationExpires = otpExpires;

    await user.save();

    try {
      await EmailService.sendVerificationOTP(email, otp, fullName || user.fullName);
    } catch (error) {
      console.warn(error)
    }
    return { message: 'Please check your email for verification code.' };

  }

  static async verifyEmail(email, otp) {
    if (!email || !otp) {
      throw new Error('Invalid or expired verification code');
    }

    const user = await User.findOne({
      email,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user || !user.emailVerificationOTP || !this.verifyOTPHash(user.emailVerificationOTP, otp)) {
      throw new Error('Invalid or expired verification code');
    }
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  static async loginUser(usernameOrEmail, password) {
    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ],
      isActive: true
    });

    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      return { success: false, message: 'Please verify your email before logging in', userData: { fullName: user.fullName, email: user.email } };
    }

    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user._id);

    return {
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        type: user.type
      }
    };
  }

  static async requestPasswordReset(email) {
    const user = await User.findOne({ email, isActive: true });

    if (user) {
      const otp = this.generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      user.passwordResetOTP = this.hashOTP(otp);
      user.passwordResetExpires = otpExpires;
      await user.save();

      // Send reset email with plain OTP
      await EmailService.sendPasswordResetOTP(email, otp, user.fullName);
    }

    return { message: 'If an account exists with this email address, a password reset code has been sent.' };
  }

  static async resetPassword(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
      throw new Error('Invalid or expired reset code');
    }

    const user = await User.findOne({
      email,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user || !user.passwordResetOTP || !this.verifyOTPHash(user.passwordResetOTP, otp)) {
      throw new Error('Invalid or expired reset code');
    }

    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  // Get user by ID
  static async getUserById(userId) {
    const user = await User.findById(userId).select('-password -emailVerificationOTP -passwordResetOTP');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

export default AuthService;
