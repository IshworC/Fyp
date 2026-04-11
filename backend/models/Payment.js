import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  bookingIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  }],
  transactionUuid: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  esewaRequest: {
    total_amount: String,
    transaction_uuid: String,
    product_code: String,
    success_url: String,
    failure_url: String,
    booking_ids: [String], // array of booking _ids
    purchase_order_id: String
  },
  esewaResponse: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;