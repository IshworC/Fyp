import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    trim: true
  },
  selectedMenuItems: [{
    menuId: String,
    menuName: String,
    itemId: String,
    itemName: String,
    price: Number,
    quantity: Number,
    category: String
  }],
  selectedPackage: {
    packageId: String,
    packageName: String,
    packageType: String,
    basePrice: Number
  },
  selectedAddOns: {
    decoration: {
      enabled: Boolean,
      price: Number
    },
    soundSystem: {
      enabled: Boolean,
      price: Number
    },
    bartender: {
      enabled: Boolean,
      price: Number
    }
  },
  customerEmail: {
    type: String,
    trim: true
  },
  customerName: {
    type: String,
    trim: true
  },
  specialRequests: {
    type: String,
    trim: true
  },
  totalPrice: {
    type: Number
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paymentType: {
    type: String,
    enum: ['full', 'advance', 'none'],
    default: 'none'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionUuid: {
    type: String
  },
  transactionCode: {
    type: String
  },
  paidAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'timely_booking', 'booked', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isManual: {
    type: Boolean,
    default: false
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
