// routes/esewa.routes.js
import express from 'express';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { sendBookingConfirmationToUser, sendBookingNotificationToOwner } from '../config/mailer.js';

const router = express.Router();

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ESEWA_CONFIG = {
  merchantCode: process.env.ESEWA_PRODUCT_CODE,
  secretKey: process.env.ESEWA_SECRET_KEY,
  paymentUrl: process.env.ESEWA_PAYMENT_URL,
  verifyUrl: process.env.ESEWA_VERIFY_URL,
};

// ─── HELPER: Generate HMAC-SHA256 Signature ───────────────────────────────────
function generateSignature(message, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('base64');
}

// ─── ROUTE 1: Initiate Payment ────────────────────────────────────────────────
// POST /api/esewa/initiate
// Body: { bookingId, totalAmount, taxAmount, serviceCharge, deliveryCharge, productName }
router.post('/initiate', async (req, res) => {
  try {
    console.log('=== ESEWA PAYMENT INITIATION ===');
    console.log('Request body:', req.body);
    console.log('Headers:', req.headers);
    const {
      bookingId,
      totalAmount,
      taxAmount = 0,
      serviceCharge = 0,
      deliveryCharge = 0,
      productName = 'Venue Booking',
    } = req.body;

    if (!bookingId || !totalAmount) {
      console.log('Missing required fields:', { bookingId, totalAmount });
      return res.status(400).json({ success: false, message: 'bookingId and totalAmount are required' });
    }

    console.log('Processing payment for booking:', bookingId, 'amount:', totalAmount);

    // transaction_uuid must be unique per payment attempt
    const transactionUuid = `${bookingId}-${Date.now()}`;
    console.log('Generated transaction UUID:', transactionUuid);

    // The message string MUST follow this exact format (no extra spaces)
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_CONFIG.merchantCode}`;
    console.log('Signature message:', message);
    const signature = generateSignature(message, ESEWA_CONFIG.secretKey);
    console.log('Generated signature:', signature);

    // Save transactionUuid to your Booking record so you can verify later
    const { paymentType = 'full' } = req.body;
    await Booking.findByIdAndUpdate(bookingId, {
      transactionUuid,
      paymentStatus: 'pending',
      paymentType: paymentType
    });

    const responseData = {
      success: true,
      paymentData: {
        amount: totalAmount - taxAmount - serviceCharge - deliveryCharge, // base amount
        tax_amount: taxAmount,
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: ESEWA_CONFIG.merchantCode,
        product_service_charge: serviceCharge,
        product_delivery_charge: deliveryCharge,
        success_url: `${process.env.FRONTEND_URL}/payment/success`,
        failure_url: `${process.env.FRONTEND_URL}/payment/failure`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature,
      },
      paymentUrl: ESEWA_CONFIG.paymentUrl,
    };

    console.log('Sending eSewa response:', responseData);
    return res.json(responseData);
  } catch (err) {
    console.error('eSewa initiate error:', err);
    return res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
});

// ─── ROUTE 2: Verify Payment ──────────────────────────────────────────────────
// POST /api/esewa/verify
// Body: { data } — base64 encoded response from eSewa success redirect
router.post('/verify', async (req, res) => {
  try {
    console.log('=== ESEWA PAYMENT VERIFICATION ===');
    console.log('Request body:', req.body);
    const { data } = req.body;
    if (!data) return res.status(400).json({ success: false, message: 'No data provided' });

    // Decode base64 response from eSewa
    const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    console.log('Decoded eSewa response:', decoded);

    const {
      transaction_uuid,
      total_amount,
      status,
      transaction_code,
      signed_field_names,
      signature: receivedSignature,
    } = decoded;

    // 1. Verify signature
    const fields = signed_field_names.split(',');
    const message = fields.map(f => `${f}=${decoded[f]}`).join(',');
    console.log('Verification message:', message);
    const expectedSignature = generateSignature(message, ESEWA_CONFIG.secretKey);
    console.log('Expected signature:', expectedSignature);
    console.log('Received signature:', receivedSignature);

    if (expectedSignature !== receivedSignature) {
      console.log('SIGNATURE MISMATCH!');
      return res.status(400).json({ success: false, message: 'Signature mismatch — payment tampered' });
    }
    console.log('Signature verification passed');

    // 2. Verify with eSewa's status API
    const bookingId = transaction_uuid.split('-')[0];
    console.log('Verifying with eSewa API...');
    const verifyRes = await fetch(
      `${ESEWA_CONFIG.verifyUrl}?product_code=${ESEWA_CONFIG.merchantCode}&transaction_uuid=${transaction_uuid}&total_amount=${total_amount}`
    );
    const verifyData = await verifyRes.json();
    console.log('eSewa verify response:', verifyData);

    // For test environment, be more lenient
    const isTestEnv = ESEWA_CONFIG.merchantCode === 'EPAYTEST';
    if (isTestEnv) {
      console.log('Test environment detected - checking if transaction exists...');
      // In test environment, if we have decoded data, consider it successful
      if (decoded && decoded.transaction_code) {
        console.log('Test payment - proceeding with success');
      } else {
        return res.status(400).json({ success: false, message: 'Test payment verification failed', details: verifyData });
      }
    } else if (verifyData.status !== 'COMPLETE') {
      return res.status(400).json({ success: false, message: 'Payment not completed', details: verifyData });
    }

    // 3. Check if payment already exists to make this route idempotent
    const existingPayment = await Payment.findOne({ transactionUuid: transaction_uuid });
    if (existingPayment) {
      console.log('Payment already verified for this transaction UUID.');
      return res.json({
        success: true,
        message: 'Payment verified successfully (already existed)',
        transactionCode: transaction_code,
        bookingId,
      });
    }

    // 4. Update booking status in DB
    const bookingToUpdate = await Booking.findById(bookingId);
    let paymentStatus = 'paid';
    
    // If it's advance payment and paid amount is less than total, mark as partially_paid
    if (bookingToUpdate && bookingToUpdate.paymentType === 'advance' && parseFloat(total_amount) < bookingToUpdate.totalPrice) {
      paymentStatus = 'partially_paid';
    }

    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: paymentStatus,
      transactionCode: transaction_code,
      transactionUuid: transaction_uuid,
      paidAt: new Date(),
      paidAmount: parseFloat(total_amount),
      status: 'booked' // Updated status from 'confirmed' to 'booked'
    });

    // Send booking confirmation emails to user and venue owner
    try {
      const booking = await Booking.findById(bookingId)
        .populate('user', 'name email')
        .populate({
          path: 'venue',
          select: 'name owner',
          populate: { path: 'owner', select: 'name email' }
        });

      if (booking) {
        if (booking.user?.email) {
          await sendBookingConfirmationToUser(
            booking.user.email,
            booking.user.name || 'Customer',
            booking.venue.name,
            booking.eventDate,
            booking.totalPrice,
            booking.numberOfGuests,
            true
          );
        }

        if (booking.venue?.owner?.email) {
          await sendBookingNotificationToOwner(
            booking.venue.owner.email,
            booking.venue.owner.name || 'Venue Owner',
            booking.venue.name,
            booking.user.name || 'Customer',
            booking.eventDate,
            booking.numberOfGuests,
            booking.totalPrice
          );
        }
      }
    } catch (emailError) {
      console.error('Error sending booking confirmation emails:', emailError);
      // Do not fail payment verification if email sending fails
    }

    // 5. Create Payment record
    try {
      const payment = await Payment.create({
        bookingIds: [bookingId],
        transactionUuid: transaction_uuid,
        amount: parseFloat(total_amount),
        status: 'success',
        paymentDate: new Date(),
        esewaRequest: {
          total_amount,
          transaction_uuid,
          product_code: ESEWA_CONFIG.merchantCode,
          success_url: `${process.env.FRONTEND_URL}/payment/success`,
          failure_url: `${process.env.FRONTEND_URL}/payment/failure`,
          booking_ids: [bookingId]
        },
        esewaResponse: decoded
      });
      console.log('Payment record created:', payment._id);
    } catch (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't fail the verification if payment record creation fails
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      transactionCode: transaction_code,
      bookingId,
    });
  } catch (err) {
    console.error('eSewa verify error:', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

export default router;