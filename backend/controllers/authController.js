import AuthService from '../services/authService.js';
import User from '../models/userModel.js';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';

class AuthController {
  // Register
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const result = await AuthService.registerUser(req.body);
      res.status(201).json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  static async otpResend(req, res) {
    try {
      const result = await AuthService.resendCode(req.body)
      res.status(201).json({
        success: true,
        ...result
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      })
    }
  }
  // Verify email
  static async verifyEmail(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.verifyEmail(email, otp);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Login
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { usernameOrEmail, password, rememberMe } = req.body;
      const result = await AuthService.loginUser(usernameOrEmail, password);
      if (!result?.success) {
        res.json(result)
        return;
      }
      const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: cookieMaxAge
      });
      res.json({
        success: true,
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  // Request password reset
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.requestPasswordReset(email);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Reset password
  static async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await AuthService.resetPassword(email, otp, newPassword);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get current user
  static async getCurrentUser(req, res) {
    try {
      const token = req.cookies.token;
      if (!token) return res.status(404).json({
        success: false,
        message: error.message
      });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = (decoded) ? await AuthService.getUserById(decoded.userId) : await AuthService.getUserById(req.user?._id);
      res.json({
        success: true,
        user
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Logout
  static async logout(req, res) {
    res.clearCookie('token');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  // Switch Account
  static async switchAccount(req, res) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, message: 'Token required to switch account' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'Account no longer found' });
      }

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        message: 'Switched account successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          type: user.type
        },
        token
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.'
      });
    }
  }
}

export default AuthController;
