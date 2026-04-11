import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide item name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  pricePerPlate: {
    type: Number,
    required: [true, 'Please provide price per plate'],
    min: 0
  },
  category: {
    type: String,
    enum: ['appetizer', 'main', 'dessert', 'beverage', 'other'],
    default: 'main'
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

const menuSchema = new mongoose.Schema({
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
    required: [true, 'Please provide menu name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  items: [menuItemSchema],
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

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;
