import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  logout,
  getAllUsers,
  forgotPassword,
  resetPassword,
  googleLogin
} from '../controller/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

// Admin routes
router.get('/users', authenticate, authorize(['admin']), getAllUsers);

export default router;
