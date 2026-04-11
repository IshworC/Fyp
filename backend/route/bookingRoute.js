import express from 'express';
import {
  createBooking,
  getMyBookings,
  getVenueBookings,
  updateBookingStatus,
  getAllBookings,
  cancelBooking
} from '../controller/bookingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/', authenticate, authorize(['user']), createBooking);
router.get('/my-bookings', authenticate, authorize(['user']), getMyBookings);
router.put('/:id/cancel', authenticate, authorize(['user', 'admin']), cancelBooking);

// Venue owner routes
router.get('/venue/:venueId', authenticate, authorize(['venue-owner']), getVenueBookings);
router.put('/:id/status', authenticate, authorize(['venue-owner', 'admin']), updateBookingStatus);

// Admin routes
router.get('/', authenticate, authorize(['admin']), getAllBookings);

export default router;
