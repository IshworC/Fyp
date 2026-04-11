import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide package name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'custom'],
    default: 'standard'
  },
  basePrice: {
    type: Number,
    required: [true, 'Please provide base price'],
    min: 0
  },
  features: [String], // e.g., ['Decoration', 'Sound System', 'Parking', etc.]
  maxGuestCapacity: {
    type: Number,
    required: true,
    min: 1
  },
  minGuestCapacity: {
    type: Number,
    default: 1,
    min: 1
  },
  includedMenus: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu'
  }],
  addOns: {
    decoration: {
      enabled: { type: Boolean, default: false },
      price: { type: Number, default: 0, min: 0 }
    },
    soundSystem: {
      enabled: { type: Boolean, default: false },
      price: { type: Number, default: 0, min: 0 }
    },
    bartender: {
      enabled: { type: Boolean, default: false },
      price: { type: Number, default: 0, min: 0 }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Package = mongoose.model('Package', packageSchema);

export default Package;
