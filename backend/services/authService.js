import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import EmailService from './emailService.js';

class AuthService {
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  static async registerUser(userData) {
    const { username, email, password, fullName } = userData;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === username) {
        throw new Error('Username already taken');
      }
    }

    const otp = this.generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = new User({
      username,
      email,
      password,
      fullName,
      emailVerificationOTP: otp,
      emailVerificationExpires: otpExpires
    });

    await user.save();

    try {
      await EmailService.sendVerificationOTP(email, otp, fullName);
    } catch (error) {
      console.log(error)
    }

    return { message: 'Registration successful. Please check your email for verification code.' };
  }
  
  static async resendCode(userData) {
    const { email, fullName } = userData;

    const otp = this.generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.findOne({email});
    user.isEmailVerified = false;
    user.emailVerificationOTP = otp;
    user.emailVerificationExpires = otpExpires

    await user.save();

    try {
      await EmailService.sendVerificationOTP(email, otp, fullName);
    } catch (error) {
      console.log(error)
    }
    return { message: 'Please check your email for verification code.' };
  
  }

  static async verifyEmail(email, otp) {
    const user = await User.findOne({
      email,
      emailVerificationOTP: otp,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
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
      return { success:false, message: 'Please verify your email before logging in', userData: {fullName: user.fullName, email: user.email} };
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

    if (!user) {
      throw new Error('No account found with this email address');
    }

    const otp = this.generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    user.passwordResetOTP = otp;
    user.passwordResetExpires = otpExpires;
    await user.save();

    // Send reset email
    await EmailService.sendPasswordResetOTP(email, otp, user.fullName);

    return { message: 'Password reset code sent to your email' };
  }

  static async resetPassword(email, otp, newPassword) {
    const user = await User.findOne({
      email,
      passwordResetOTP: otp,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
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
