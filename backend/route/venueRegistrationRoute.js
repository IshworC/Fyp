import express from 'express';
import {
  // Venue Owner endpoints
  getMyRegistration,
  createOrUpdateRegistration,
  uploadSingleDocument,
  addVenueImages,
  removeVenueImage,
  // Admin endpoints
  getAllRegistrations,
  getRegistrationById,
  reviewDocument,
  approveRegistration,
  rejectRegistration,
  getAdminStats
} from '../controller/venueRegistrationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadRegistrationFiles, uploadSingleFile, uploadMultipleFiles, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// =====================================================
// VENUE OWNER ROUTES
// =====================================================

// Get my registration status
router.get(
  '/my-registration',
  authenticate,
  authorize(['venue-owner']),
  getMyRegistration
);

// Create or update registration (with all files)
router.post(
  '/',
  authenticate,
  authorize(['venue-owner']),
  uploadRegistrationFiles,
  handleUploadError,
  createOrUpdateRegistration
);

// Upload single document
router.post(
  '/upload/:fieldName',
  authenticate,
  authorize(['venue-owner']),
  (req, res, next) => {
    const { fieldName } = req.params;
    uploadSingleFile(fieldName)(req, res, (err) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  uploadSingleDocument
);

// Add venue images (multiple)
router.post(
  '/venue-images',
  authenticate,
  authorize(['venue-owner']),
  uploadMultipleFiles('venueImages', 6),
  handleUploadError,
  addVenueImages
);

// Remove a venue image
router.delete(
  '/venue-images/:imageId',
  authenticate,
  authorize(['venue-owner']),
  removeVenueImage
);

// =====================================================
// ADMIN ROUTES
// =====================================================

// Get admin dashboard stats
router.get(
  '/admin/stats',
  authenticate,
  authorize(['admin']),
  getAdminStats
);

// Get all registrations (with pagination and filters)
router.get(
  '/admin/all',
  authenticate,
  authorize(['admin']),
  getAllRegistrations
);

// Get single registration details
router.get(
  '/admin/:id',
  authenticate,
  authorize(['admin']),
  getRegistrationById
);

// Review a specific document
router.put(
  '/admin/:id/review-document',
  authenticate,
  authorize(['admin']),
  reviewDocument
);

// Approve entire registration
router.put(
  '/admin/:id/approve',
  authenticate,
  authorize(['admin']),
  approveRegistration
);

// Reject entire registration
router.put(
  '/admin/:id/reject',
  authenticate,
  authorize(['admin']),
  rejectRegistration
);

export default router;
