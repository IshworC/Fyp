import express from 'express';
import {
  createPackage,
  getVenuePackages,
  getPackage,
  updatePackage,
  deletePackage
} from '../controller/packageController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes - users can view packages
router.get('/venue/:venueId', getVenuePackages);
router.get('/:packageId', getPackage);

// Protected routes - venue owners only
router.post('/venue/:venueId', authenticate, authorize(['venue-owner']), createPackage);
router.put('/:packageId', authenticate, authorize(['venue-owner']), updatePackage);
router.delete('/:packageId', authenticate, authorize(['venue-owner']), deletePackage);

export default router;
