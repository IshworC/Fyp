import express from 'express';
import {
  createVenue,
  getApprovedVenues,
  getMyVenues,
  getVenue,
  addVenueReview,
  updateVenue,
  getAllVenues,
  approveVenue,
  deleteVenue,
  uploadVenueImages,
  updateVenueGallery
} from '../controller/venueController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMultipleFiles, handleUploadError, uploadAdminManualRegistration } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/approved', getApprovedVenues);

// Protected routes for venue owners (must come before :id route)
router.post('/', authenticate, authorize(['venue-owner', 'admin']), uploadAdminManualRegistration, createVenue, handleUploadError);
router.get('/owner/my-venues', authenticate, authorize(['venue-owner']), getMyVenues);

// Parameterized routes for specific venues
router.get('/:id', getVenue);
router.post('/:id/reviews', authenticate, addVenueReview);
router.put('/:id', authenticate, authorize(['venue-owner', 'admin']), updateVenue);
router.post('/:id/images', authenticate, authorize(['venue-owner', 'admin']), uploadMultipleFiles('images', 10), uploadVenueImages, handleUploadError);
router.put('/:id/gallery', authenticate, authorize(['venue-owner', 'admin']), updateVenueGallery);

// Admin routes
router.get('/', authenticate, authorize(['admin']), getAllVenues);
router.put('/:id/approve', authenticate, authorize(['admin']), approveVenue);
router.delete('/:id', authenticate, authorize(['admin']), deleteVenue);

export default router;
