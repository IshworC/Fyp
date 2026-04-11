import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { sendEmail } from '../config/mailer.js';

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
      totalPrice
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
    const existingBooking = await Booking.findOne({
      venue: venueId,
      eventDate: {
        $gte: new Date(selectedDate),
        $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $in: ['pending', 'confirmed'] }
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
      paymentStatus: 'pending',
      status: 'pending'
    });

    // Send email to venue owner
    try {
      if (venue.owner && venue.owner.email) {
        // Create initial chat message for the booking
        const chatMessage = await Message.create({
          venue: venueId,
          sender: req.userId,
          recipient: venue.owner._id,
          text: `Hi! I've submitted a booking request for ${venue.name} on ${new Date(eventDate).toLocaleDateString()}. Please check your email for details and let me know if you need any additional information.`
        });

        console.log('Initial chat message created for booking:', chatMessage._id);
        // Build menu items list for email
        let menuItemsHtml = '';
        if (selectedMenuItems && selectedMenuItems.length > 0) {
          menuItemsHtml = '<h3 style="color: #5d0f0f; margin-top: 15px;">📋 Selected Menu Items:</h3><ul style="margin: 10px 0;">';
          selectedMenuItems.forEach(item => {
            menuItemsHtml += `<li>${item.itemName} (${item.quantity}x) - ₹${item.price * item.quantity}</li>`;
          });
          menuItemsHtml += '</ul>';
        }

        // Build package info for email
        let packageHtml = '';
        if (selectedPackage && selectedPackage.packageName) {
          packageHtml = `<h3 style="color: #5d0f0f; margin-top: 15px;">📦 Package:</h3>
          <p>${selectedPackage.packageName} (${selectedPackage.packageType}) - ₹${selectedPackage.basePrice}</p>`;
        }

        // Build add-ons for email
        let addOnsHtml = '';
        if (selectedAddOns) {
          const addOnsArray = [];
          if (selectedAddOns.decoration && selectedAddOns.decoration.enabled) {
            addOnsArray.push(`🎨 Decoration - ₹${selectedAddOns.decoration.price}`);
          }
          if (selectedAddOns.soundSystem && selectedAddOns.soundSystem.enabled) {
            addOnsArray.push(`🔊 Sound System - ₹${selectedAddOns.soundSystem.price}`);
          }
          if (selectedAddOns.bartender && selectedAddOns.bartender.enabled) {
            addOnsArray.push(`🍸 Bartender - ₹${selectedAddOns.bartender.price}`);
          }
          
          if (addOnsArray.length > 0) {
            addOnsHtml = '<h3 style="color: #5d0f0f; margin-top: 15px;">➕ Additional Services:</h3><ul style="margin: 10px 0;">';
            addOnsArray.forEach(addOn => {
              addOnsHtml += `<li>${addOn}</li>`;
            });
            addOnsHtml += '</ul>';
          }
        }

        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #5d0f0f; color: white; padding: 20px; text-align: center;">
              <h2>🎉 New Booking Request!</h2>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9;">
              <h3 style="color: #5d0f0f;">Booking Details</h3>
              
              <p><strong>Venue:</strong> ${venue.name}</p>
              <p><strong>Customer Name:</strong> ${user.name}</p>
              <p><strong>Customer Email:</strong> ${user.email}</p>
              <p><strong>Customer Phone:</strong> ${user.phone || 'Not provided'}</p>
              
              <h3 style="color: #5d0f0f; margin-top: 15px;">📅 Event Details</h3>
              <p><strong>Event Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
              <p><strong>Event Type:</strong> ${eventType}</p>
              <p><strong>Number of Guests:</strong> ${numberOfGuests}</p>
              
              ${menuItemsHtml}
              ${packageHtml}
              ${addOnsHtml}
              
              ${specialRequests ? `<h3 style="color: #5d0f0f; margin-top: 15px;">📝 Special Requests:</h3><p>${specialRequests}</p>` : ''}
              
              <h3 style="color: #5d0f0f; margin-top: 15px;">💰 Total Price: ₹${totalPrice}</h3>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p><strong>Status:</strong> <span style="color: orange; font-weight: bold;">Pending</span></p>
                <p>Please log in to your dashboard to review and confirm/reject this booking.</p>
                <p><strong>💬 Chat:</strong> A chat conversation has been started with the customer. You can communicate directly through the chat feature.</p>
              </div>
            </div>
            
            <div style="background-color: #5d0f0f; color: white; padding: 15px; text-align: center;">
              <p style="margin: 0;">© SAAN - Venue Management System</p>
            </div>
          </div>
        `;

        await sendEmail(
          venue.owner.email,
          `New Booking Request for ${venue.name}`,
          emailContent
        );
      }
    } catch (emailError) {
      console.error('Error sending email to venue owner:', emailError);
      // Don't fail the booking if email fails
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
