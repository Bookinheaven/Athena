import express from 'express';
import AuthController from '../controllers/authController.js';
import { registerValidation, loginValidation, passwordResetValidation } from '../middlewares/validation.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/resend-code', AuthController.otpResend);
router.post('/login', loginValidation, AuthController.login);
router.post('/request-password-reset', AuthController.requestPasswordReset);
router.post('/reset-password', passwordResetValidation, AuthController.resetPassword);

// Protected routes
router.get('/me', auth, AuthController.getCurrentUser);
router.post('/logout', auth, AuthController.logout);

// Route to check if user is authenticated
router.get('/check-auth', auth, (req, res) => {
  res.json({
    success: true,
    message: 'User is authenticated',
    userId: req.user.userId
  });
});

export default router;
