import { BrevoClient } from '@getbrevo/brevo';
import { APP_NAME } from '../config/branding.js';
import env from '../config/env.js';

let brevoClient = null;

function getBrevoClient() {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    throw new Error("Email service is not configured (missing BREVO_API_KEY or BREVO_SENDER_EMAIL).");
  }

  if (!brevoClient) {
    brevoClient = new BrevoClient({
      apiKey: env.BREVO_API_KEY,
    });
  }

  return brevoClient;
}

class EmailService {
  static async sendVerificationOTP(email, otp, fullName) {
    const client = getBrevoClient();

    const emailPayload = {
      sender: {
        name: APP_NAME,
        email: env.BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email,
          name: fullName || email,
        },
      ],
      subject: `${APP_NAME} – Email Verification`,
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">
            <h2 style="color: #111827;">Welcome, ${fullName}</h2>
            <p style="color: #374151;">We’re thrilled to have you on board!</p>
            <p style="color: #374151;">Your verification code is:</p>
            <h3 style="color: #2563eb; font-size: 24px;">${otp}</h3>
            <p style="color: #6b7280;">This code expires in 10 minutes.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af;">If you didn’t request this, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    };

    await client.transactionalEmails.sendTransacEmail(emailPayload);
    console.log(`Verification email sent to ${email}`);
  }

  static async sendPasswordResetOTP(email, otp, fullName) {
    const client = getBrevoClient();

    const emailPayload = {
      sender: {
        name: APP_NAME,
        email: env.BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email,
          name: fullName || email,
        },
      ],
      subject: `${APP_NAME} – Password Reset Request`,
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">
            <h2 style="color: #111827;">Hello, ${fullName}</h2>
            <p style="color: #374151;">We received a request to reset your ${APP_NAME} password.</p>
            <p>Your password reset OTP is:</p>
            <h3 style="color: #dc2626; font-size: 24px;">${otp}</h3>
            <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af;">If you didn’t request this, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    await client.transactionalEmails.sendTransacEmail(emailPayload);
    console.log(`Password reset email sent to ${email}`);
  }
}

export default EmailService;
