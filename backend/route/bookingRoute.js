import express from 'express';
import {
  createBooking,
  getMyBookings,
  getVenueBookings,
  updateBookingStatus,
  getAllBookings,
  cancelBooking,
  getPublicBookedDates,
  createManualBooking,
  updateBooking
} from '../controller/bookingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/venue/:venueId/booked-dates', getPublicBookedDates);

// User routes
router.post('/', authenticate, authorize(['user']), createBooking);
router.get('/my-bookings', authenticate, authorize(['user']), getMyBookings);
router.patch('/:id', authenticate, authorize(['user']), updateBooking);
router.put('/:id/cancel', authenticate, authorize(['user', 'admin']), cancelBooking);

// Venue owner routes
router.get('/venue/:venueId', authenticate, authorize(['venue-owner']), getVenueBookings);
router.put('/:id/status', authenticate, authorize(['venue-owner', 'admin']), updateBookingStatus);
router.post('/manual', authenticate, authorize(['venue-owner', 'admin']), createManualBooking);

// Admin routes
router.get('/', authenticate, authorize(['admin']), getAllBookings);

export default router;
