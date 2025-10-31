import nodemailer from 'nodemailer';

async function createTransporter() {
  while (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Waiting for EMAIL_USER and EMAIL_PASS to load...");
    await new Promise((res) => setTimeout(res, 100)); 
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("Email transporter verified and ready to send emails");
  } catch (err) {
    console.error("Email transporter verification failed:", err.message);
  }

  return transporter;
}

class EmailService {
  static async sendVerificationOTP(email, otp, fullName) {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Athena" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Athena – Email Verification",
      html: `
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

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  }

  static async sendPasswordResetOTP(email, otp, fullName) {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Athena" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Athena – Password Reset Request",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">
            <h2 style="color: #111827;">Hello, ${fullName}</h2>
            <p style="color: #374151;">We received a request to reset your Athena password.</p>
            <p>Your password reset OTP is:</p>
            <h3 style="color: #dc2626; font-size: 24px;">${otp}</h3>
            <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af;">If you didn’t request this, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  }
}

export default EmailService;
