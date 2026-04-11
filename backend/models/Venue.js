import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide venue name'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['banquet', 'wedding', 'conference', 'garden', 'restaurant', 'hotel', 'other'],
    required: true
  },
  city: {
    type: String,
    required: [true, 'Please provide city'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    default: null
  },
  capacity: {
    type: Number
  },
  numberOfHalls: {
    type: Number,
    default: 1
  },
  pricePerDay: {
    type: Number
  },
  images: [String],
  description: {
    type: String
  },
  amenities: [String],
  isApproved: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        trim: true,
        default: ''
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Venue = mongoose.model('Venue', venueSchema);

export default Venue;
