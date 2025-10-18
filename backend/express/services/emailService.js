import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class EmailService {
  static async sendVerificationOTP(email, otp, fullName) {
    const mailOptions = {
      from: `"Athena" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Athena – Email Verification',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; margin: 0; font-size: 28px; font-weight: 700;">Athena</h1>
              <p style="color: #6B7280; margin: 4px 0; font-size: 15px;">Smart Study Tracking with Pattern Intelligence</p>
            </div>

            <h2 style="color: #111827; font-size: 22px; margin-bottom: 16px;">Welcome, ${fullName}</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 15px; margin-bottom: 24px;">
              Thank you for joining Athena! Please verify your email address to activate your account and start exploring your study insights.
            </p>

            <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 24px; border-radius: 10px; text-align: center;">
              <h3 style="color: #FFFFFF; font-size: 16px; margin: 0 0 10px;">Your Verification Code</h3>
              <div style="font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: 6px; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.1); padding: 14px 24px; border-radius: 6px; display: inline-block;">${otp}</div>
              <p style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 10px;">Expires in 10 minutes</p>
            </div>

            <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 18px; margin-top: 24px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #92400E; font-size: 13px;">
                <strong>Security Note:</strong> If you didn’t create an Athena account, please ignore this email.
              </p>
            </div>

            <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 13px; margin: 0;">
                © ${new Date().getFullYear()} Athena. All rights reserved.<br>
                Empowering smarter study decisions.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  }

  static async sendPasswordResetOTP(email, otp, fullName) {
    const mailOptions = {
      from: `"Athena" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Athena – Password Reset Request',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; margin: 0; font-size: 28px; font-weight: 700;">Athena</h1>
              <p style="color: #6B7280; margin: 4px 0; font-size: 15px;">Smart Study Tracking with Pattern Intelligence</p>
            </div>

            <h2 style="color: #111827; font-size: 22px; margin-bottom: 16px;">Password Reset Request</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 15px; margin-bottom: 8px;">
              Hi ${fullName},
            </p>
            <p style="color: #374151; line-height: 1.6; font-size: 15px; margin-bottom: 24px;">
              We received a request to reset your Athena account password. Use the code below to continue the process.
            </p>

            <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 24px; border-radius: 10px; text-align: center;">
              <h3 style="color: #FFFFFF; font-size: 16px; margin: 0 0 10px;">Password Reset Code</h3>
              <div style="font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: 6px; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.1); padding: 14px 24px; border-radius: 6px; display: inline-block;">${otp}</div>
              <p style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 10px;">Expires in 10 minutes</p>
            </div>

            <div style="background: #FEE2E2; border-left: 4px solid #DC2626; padding: 14px 18px; margin-top: 24px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #B91C1C; font-size: 13px;">
                <strong>Security Alert:</strong> If you didn’t request this password reset, please ignore this email or contact our support team.
              </p>
            </div>

            <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 13px; margin: 0;">
                © ${new Date().getFullYear()} Athena. All rights reserved.<br>
                Stay secure with Athena.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  }
}

export default EmailService;
