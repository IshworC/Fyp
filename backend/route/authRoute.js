import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  logout,
  getAllUsers
} from '../controller/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

// Admin routes
router.get('/users', authenticate, authorize(['admin']), getAllUsers);

export default router;
