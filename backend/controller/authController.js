import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import VenueRegistration from '../models/VenueRegistration.js';
import Otp from '../models/Otp.js';
import config from '../config/config.js';
import { sendOtpEmail } from '../config/mailer.js';
import { OAuth2Client } from 'google-auth-library';
import mongoose from 'mongoose';

// Register new user or venue owner
export const register = async (req, res) => {
  try {
    const { name, email, password, role, venueName, venueType, venueCity } = req.body;

    // Validate role
    if (!['user', 'venue-owner'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only user and venue-owner can register'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user (emailVerified defaults to false)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      emailVerified: false
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email: email.toLowerCase() });

    // Save OTP to database
    await Otp.create({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP email
    try {
      await sendOtpEmail(email, otp, name);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't fail registration if email fails, user can request resend
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      requiresVerification: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        emailVerified: false
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        user: {
          email: user.email,
          name: user.name
        }
      });
    }

    // Generate JWT token with actual role
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Google Login
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    const client = new OAuth2Client(config.googleClientId);
    
    // In local development with a TEMP placeholder, verifyIdToken will fail.
    // For temp placeholder, we bypass verification and mock it, or we expect real ID token.
    // But since the user doesn't have the client ID yet, even getting the credential from frontend
    // might fail unless they use a temp. If credential is provided, we decode it manually to bypass 
    // network verification for the TEMP_GOOGLE_CLIENT_ID scenario.
    let payload;
    if (config.googleClientId === 'TEMP_GOOGLE_CLIENT_ID') {
      // Decode JWT without verification just for testing purposes
      payload = jwt.decode(credential);
      if (!payload) {
         throw new Error("Invalid credential format");
      }
    } else {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId
      });
      payload = ticket.getPayload();
    }
    
    const { email, name, sub: googleId } = payload;
    
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create user if they don't exist
      user = await User.create({
        name,
        email,
        googleId,
        emailVerified: true,
        role: 'user' // Default role
      });
    } else {
      // If user exists but doesn't have googleId, update it
      if (!user.googleId) {
        user.googleId = googleId;
        user.emailVerified = true;
        await user.save();
      }
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );
    
    res.status(200).json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google login failed',
      error: error.message
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Logout (frontend handles this by removing token)
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

// Admin: Get all users
export const getAllUsers = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can view all users'
      });
    }

    const users = await User.find().select('-password').lean();
    
    // For each user with role 'venue-owner', fetch their registration data
    const usersWithReg = await Promise.all(users.map(async (user) => {
      if (user.role === 'venue-owner') {
        const registration = await VenueRegistration.findOne({ owner: user._id }).select('registrationStatus documents profileImage venueName');
        return { ...user, registration };
      }
      return user;
    }));

    res.status(200).json({
      success: true,
      count: usersWithReg.length,
      users: usersWithReg
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Forgot Password - sends OTP to email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return success anyway to prevent email enumeration
      return res.status(200).json({ success: true, message: 'If this email exists, a reset OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email: email.toLowerCase() });
    await Otp.create({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #2d545e; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">SAAN - Password Reset</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hello ${user.name},</p>
          <p style="font-size: 16px; color: #333;">We received a request to reset your password. Use the OTP below to proceed:</p>
          <div style="background-color: #2d545e; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #666;">This OTP will expire in <strong>10 minutes</strong>.</p>
          <p style="font-size: 14px; color: #666;">If you did not request a password reset, please ignore this email.</p>
        </div>
      </div>
    `;

    try {
      const { sendEmail } = await import('../config/mailer.js');
      await sendEmail({ to: email, subject: 'Password Reset OTP - SAAN App', html });
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr);
    }

    res.status(200).json({ success: true, message: 'Password reset OTP sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Error processing request', error: error.message });
  }
};

// Reset Password - verifies OTP and sets new password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await Otp.deleteMany({ email: email.toLowerCase() });

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password', error: error.message });
  }
};
