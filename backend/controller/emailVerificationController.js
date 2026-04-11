import crypto from "crypto";
import EmailVerification from "../models/EmailVerification.js";
import { sendEmail } from "../config/mailer.js";


// SEND VERIFICATION EMAIL
export const sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const token = crypto.randomBytes(32).toString("hex");

    await EmailVerification.create({
      email,
      token,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    const verificationLink = `http://localhost:5173/verify-email/${token}`;

    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Verification email sent",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const record = await EmailVerification.findOne({
      token,
      expiresAt: { $gt: Date.now() },
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    record.isVerified = true;
    await record.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
