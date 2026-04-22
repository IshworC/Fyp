import cron from 'node-cron';
import Booking from '../models/Booking.js';
import { sendBookingExpiryEmail } from '../config/mailer.js';

const initCronJobs = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running cron job to check for expired timely bookings...');
    try {
      const now = new Date();
      
      // Find bookings that are in 'timely_booking' status and have expired
      const expiredBookings = await Booking.find({
        status: 'timely_booking',
        expiresAt: { $lt: now }
      }).populate('user', 'name email').populate('venue', 'name');

      console.log(`Found ${expiredBookings.length} expired bookings.`);

      for (const booking of expiredBookings) {
        booking.status = 'expired';
        booking.updatedAt = now;
        await booking.save();

        // Send email to user
        if (booking.user && booking.user.email) {
          try {
            await sendBookingExpiryEmail(
              booking.user.email,
              booking.user.name,
              booking.venue?.name || 'Your Venue',
              booking.eventDate
            );
          } catch (emailError) {
            console.error(`Error sending expiry email for booking ${booking._id}:`, emailError);
          }
        }
        
        console.log(`Booking ${booking._id} marked as expired.`);
      }
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });
};

export default initCronJobs;
