import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import config from '../config/config.js';
import { sendOtpEmail } from '../config/mailer.js';

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
    // Check if user is admin
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can view all users'
      });
    }

    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      users
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
