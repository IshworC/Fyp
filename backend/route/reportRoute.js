import express from 'express';
import { getDashboardStats, getVenuePerformance } from '../controller/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Admin only routes
router.get('/dashboard', authenticate, authorize(['admin']), getDashboardStats);
router.get('/venue-performance', authenticate, authorize(['admin']), getVenuePerformance);

export default router;
