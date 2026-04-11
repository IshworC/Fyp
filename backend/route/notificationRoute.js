import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from '../controller/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark single notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', markAllAsRead);

// Delete single notification
router.delete('/:id', deleteNotification);

// Delete all notifications
router.delete('/', deleteAllNotifications);

export default router;
