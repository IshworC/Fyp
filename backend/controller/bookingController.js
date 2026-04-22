import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { sendEmail, sendPayLaterEmail, sendBookingConfirmationEmail } from '../config/mailer.js';

// Create booking (user only)
export const createBooking = async (req, res) => {
  try {
    if (req.userRole !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only users can create bookings'
      });
    }

    const { 
      venueId, 
      eventDate, 
      numberOfGuests, 
      eventType, 
      specialRequests,
      selectedMenuItems,
      selectedPackage,
      selectedAddOns,
      totalPrice,
      customerEmail,
      customerName
    } = req.body;

    // Validate required fields
    if (!venueId || !eventDate || !numberOfGuests || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields: venueId, eventDate, numberOfGuests, eventType'
      });
    }

    // Validate event date is in the future (tomorrow or later, not today)
    const selectedDate = new Date(eventDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (selectedDate < tomorrow) {
      return res.status(400).json({
        success: false,
        message: 'Event date must be tomorrow or later. Today and past dates are not allowed.'
      });
    }

    // Check if venue exists
    const venue = await Venue.findById(venueId).populate('owner');
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    // ✅ FIX DOUBLE BOOKING - prevent same venue + same date bookings
    // Updated to check for both 'booked' and 'timely_booking'
    const existingBooking = await Booking.findOne({
      venue: venueId,
      eventDate: {
        $gte: new Date(selectedDate),
        $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $in: ['pending', 'confirmed', 'booked', 'timely_booking'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This venue is already booked for the selected date. Please choose another date.'
      });
    }

    // ✅ FIX CAPACITY VALIDATION - ensure guests don't exceed capacity
    if (venue.capacity && numberOfGuests > venue.capacity) {
      return res.status(400).json({
        success: false,
        message: `Guest count (${numberOfGuests}) exceeds venue capacity (${venue.capacity} guests).`
      });
    }

    // Determine initial status and expiry
    const { paymentMethod } = req.body;
    let initialStatus = 'pending';
    let expiresAt = null;

    if (paymentMethod === 'pay_later') {
      initialStatus = 'timely_booking';
      expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now
    }

    // Get current user details
    const user = await User.findById(req.userId);

    const booking = await Booking.create({
      user: req.userId,
      venue: venueId,
      eventDate,
      numberOfGuests,
      eventType,
      selectedMenuItems: selectedMenuItems || [],
      selectedPackage: selectedPackage || {},
      selectedAddOns: selectedAddOns || {},
      specialRequests,
      totalPrice: totalPrice || (venue.pricePerPlate || 0),
      customerEmail: customerEmail || user.email,
      customerName: customerName || user.name,
      paymentStatus: 'pending',
      status: initialStatus,
      expiresAt: expiresAt
    });

    // If Pay Later, send emails immediately
    if (paymentMethod === 'pay_later') {
      try {
        if (user) {
          await sendPayLaterEmail({
            userEmail: user.email,
            userName: user.name,
            ownerEmail: venue.owner.email,
            ownerName: venue.owner.name,
            venueName: venue.name,
            date: eventDate,
            expiryTime: expiresAt
          });
        }
      } catch (emailError) {
        console.error('Error sending Pay Later email:', emailError);
      }
    }

    // Send detailed confirmation email if not pay_later (those are handled above)
    if (paymentMethod !== 'pay_later') {
      try {
        const emailPayload = {
          venueName: venue.name,
          userName: booking.customerName,
          date: booking.eventDate,
          eventType: booking.eventType,
          guests: booking.numberOfGuests,
          selectedPackage: booking.selectedPackage,
          selectedMenuItems: booking.selectedMenuItems,
          totalPrice: booking.totalPrice,
          paidAmount: 0, // Initially 0 for user-facing until payment succeeds
          paymentStatus: 'pending'
        };

        // Send to customer
        await sendBookingConfirmationEmail({
          ...emailPayload,
          to: booking.customerEmail
        });

        // Send to owner
        await sendBookingConfirmationEmail({
          ...emailPayload,
          to: venue.owner.email,
          isOwner: true
        });
      } catch (err) {
        console.error('Confirmation email error:', err);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Awaiting venue owner confirmation.',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// Get my bookings (user only)
export const getMyBookings = async (req, res) => {
  try {
    if (req.userRole !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only users can view their bookings'
      });
    }

    const bookings = await Booking.find({ user: req.userId })
      .populate('venue', 'name city type')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Get bookings for my venue (venue owner only)
export const getVenueBookings = async (req, res) => {
  try {
    if (req.userRole !== 'venue-owner') {
      return res.status(403).json({
        success: false,
        message: 'Only venue owners can view bookings for their venues'
      });
    }

    const venueId = req.params.venueId;

    // Check if venue belongs to this owner
    const venue = await Venue.findOne({ _id: venueId, owner: req.userId });
    if (!venue) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bookings for this venue'
      });
    }

    const bookings = await Booking.find({ venue: venueId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get venue bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Update booking status (venue owner only)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    // Validate status
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking status'
      });
    }

    const booking = await Booking.findById(bookingId).populate('venue');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the venue
    if (booking.venue.owner.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    const oldStatus = booking.status;
    booking.status = status;
    booking.updatedAt = Date.now();
    await booking.save();

    // Create chat message about status update
    try {
      let statusUpdateMessage = '';
      switch (status) {
        case 'confirmed':
          statusUpdateMessage = `Great news! Your booking for ${booking.venue.name} has been CONFIRMED. We're looking forward to hosting your event on ${new Date(booking.eventDate).toLocaleDateString()}.`;
          break;
        case 'cancelled':
          statusUpdateMessage = `We're sorry to inform you that your booking for ${booking.venue.name} has been CANCELLED. Please contact us if you need assistance with alternative arrangements.`;
          break;
        case 'completed':
          statusUpdateMessage = `Thank you for choosing ${booking.venue.name}! Your event has been marked as COMPLETED. We hope you had a wonderful experience.`;
          break;
        default:
          statusUpdateMessage = `Your booking status for ${booking.venue.name} has been updated to: ${status.toUpperCase()}.`;
      }

      await Message.create({
        venue: booking.venue._id,
        sender: req.userId, // venue owner
        recipient: booking.user._id,
        text: statusUpdateMessage
      });

      console.log('Status update chat message sent');
    } catch (chatError) {
      console.error('Error creating status update chat message:', chatError);
    }

    // Populate user info for email
    await booking.populate('user', 'email name');
    await booking.populate('venue', 'name');

    // Send email notification to user about status change
    try {
      let statusMessage = '';
      let statusColor = '';
      
      switch (status) {
        case 'confirmed':
          statusMessage = '✅ Your booking has been CONFIRMED!';
          statusColor = '#22c55e';
          break;
        case 'cancelled':
          statusMessage = '❌ Your booking has been CANCELLED.';
          statusColor = '#ef4444';
          break;
        case 'completed':
          statusMessage = '✔️ Your event has been COMPLETED!';
          statusColor = '#3b82f6';
          break;
        default:
          statusMessage = `Status updated to: ${status}`;
          statusColor = '#6b7280';
      }

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #5d0f0f; color: white; padding: 20px; text-align: center;">
            <h2>Booking Status Update</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hi ${booking.user.name || 'there'},</p>
            
            <div style="background-color: ${statusColor}; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0;">${statusMessage}</h3>
            </div>
            
            <h3 style="color: #5d0f0f; margin-top: 20px;">Booking Details:</h3>
            <p><strong>Venue:</strong> ${booking.venue.name}</p>
            <p><strong>Event Date:</strong> ${new Date(booking.eventDate).toLocaleDateString()}</p>
            <p><strong>Number of Guests:</strong> ${booking.numberOfGuests}</p>
            <p><strong>Event Type:</strong> ${booking.eventType}</p>
            <p><strong>Total Price:</strong> ₹${booking.totalPrice}</p>
            <p><strong>Current Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status.toUpperCase()}</span></p>
            
            ${booking.specialRequests ? `<p><strong>Your Special Requests:</strong> ${booking.specialRequests}</p>` : ''}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
              ${status === 'confirmed' ? `
                <p><strong>Next Steps:</strong></p>
                <ul>
                  <li>Confirm final guest count 2 days before event</li>
                  <li>Discuss any last-minute changes with venue in chat</li>
                  <li>Arrive 30 minutes before event time</li>
                </ul>
              ` : ''}
              ${status === 'cancelled' ? `
                <p>If you have any questions about this cancellation, please contact the venue directly through chat.</p>
              ` : ''}
              <p><strong>💬 Chat:</strong> You can stay connected with the venue owner through the chat feature to discuss any details about your event.</p>
              <p>Thank you for using SAAN!</p>
            </div>
          </div>
          
          <div style="background-color: #5d0f0f; color: white; padding: 15px; text-align: center;">
            <p style="margin: 0;">© SAAN - Venue Management System</p>
          </div>
        </div>
      `;

      await sendEmail(
        booking.user.email,
        `Booking Status Update - ${booking.venue.name}`,
        emailContent
      );
    } catch (emailError) {
      console.error('Error sending email to user:', emailError);
      // Don't fail the status update if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
};

// Admin: Get all bookings
export const getAllBookings = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can view all bookings'
      });
    }

    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('venue', 'name city')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Cancel booking (user only)
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('venue', '_id');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    booking.status = 'cancelled';
    booking.updatedAt = Date.now();
    await booking.save();

    // Send cancellation message to venue owner through chat
    try {
      await Message.create({
        venue: booking.venue._id,
        sender: booking.user,
        recipient: booking.venue.owner || booking.venue,
        text: `I have cancelled my booking for ${booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : 'this event'}. Thank you for your understanding.`
      });
    } catch (chatError) {
      console.error('Error sending cancellation message:', chatError);
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

// Create manual booking (venue owner only)
export const createManualBooking = async (req, res) => {
  try {
    if (req.userRole !== 'venue-owner' && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only venue owners can create manual bookings'
      });
    }

    const { 
      venueId, 
      userEmail, // Owner provides customer email or name
      userName,
      eventDate, 
      numberOfGuests, 
      eventType, 
      specialRequests,
      selectedMenuItems,
      selectedPackage,
      selectedAddOns,
      totalPrice,
      paymentMethod // 'pay_later' or 'paid'
    } = req.body;

    // Basic validation
    if (!venueId || !eventDate || !numberOfGuests || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if venue belongs to this owner
    const venue = await Venue.findOne({ _id: venueId, owner: req.userId });
    if (!venue && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create booking for this venue'
      });
    }

    // Check double booking
    const selectedDate = new Date(eventDate);
    selectedDate.setHours(0,0,0,0);

    const existingBooking = await Booking.findOne({
      venue: venueId,
      eventDate: {
        $gte: new Date(selectedDate),
        $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $in: ['booked', 'timely_booking', 'confirmed'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Venue is already booked for this date'
      });
    }

    // Create a shadow user or find existing if owner provides email
    let targetUserId = req.userId; // Default to owner if no user provided
    if (userEmail) {
      const existingUser = await User.findOne({ email: userEmail });
      if (existingUser) targetUserId = existingUser._id;
    }

    let initialStatus = 'booked';
    let paymentStatus = 'paid';
    let expiresAt = null;

    if (paymentMethod === 'pay_later') {
      initialStatus = 'timely_booking';
      paymentStatus = 'pending';
      expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000);
    }

    const booking = await Booking.create({
      user: targetUserId,
      venue: venueId,
      eventDate,
      numberOfGuests,
      eventType,
      selectedMenuItems: selectedMenuItems || [],
      selectedPackage: selectedPackage || {},
      selectedAddOns: selectedAddOns || {},
      specialRequests,
      totalPrice: totalPrice,
      customerEmail: userEmail,
      customerName: userName,
      paymentStatus: paymentStatus,
      status: initialStatus,
      expiresAt: expiresAt,
      paymentType: paymentStatus === 'paid' ? 'full' : 'none',
      paidAmount: paymentStatus === 'paid' ? totalPrice : 0,
      isManual: true
    });

    // Send confirmation emails
    try {
      const emailPayload = {
        venueName: venue.name,
        userName: booking.customerName || 'Valued Customer',
        date: booking.eventDate,
        eventType: booking.eventType,
        guests: booking.numberOfGuests,
        selectedPackage: booking.selectedPackage,
        selectedMenuItems: booking.selectedMenuItems,
        totalPrice: booking.totalPrice,
        paidAmount: booking.paidAmount,
        paymentStatus: booking.paymentStatus
      };

      // To Customer
      if (userEmail) {
        await sendBookingConfirmationEmail({
          ...emailPayload,
          to: userEmail
        });
      }

      // To Owner
      await sendBookingConfirmationEmail({
        ...emailPayload,
        to: venue.owner.email,
        isOwner: true
      });
    } catch (err) {
      console.error('Manual booking email error:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Manual booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Manual booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating manual booking',
      error: error.message
    });
  }
};

// Get public booked dates for a venue (no auth required)
export const getPublicBookedDates = async (req, res) => {
  try {
    const venueId = req.params.venueId;

    // Return the eventDates and status of bookings that are pending, confirmed, booked, or timely_booking
    const bookings = await Booking.find({ 
      venue: venueId,
      status: { $in: ['pending', 'confirmed', 'booked', 'timely_booking'] }
    }).select('eventDate status isManual -_id');

    res.status(200).json({
      success: true,
      bookedDates: bookings // This will now be an array of { eventDate, status }
    });
  } catch (error) {
    console.error('Get public booked dates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booked dates',
      error: error.message
    });
  }
};
