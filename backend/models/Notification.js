import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED', 'SECTION_APPROVED', 'SECTION_REJECTED', 'SECTION_REVOKED',
      'BOOKING_REQUEST', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'GENERAL',
      // Admin notification types
      'NEW_REGISTRATION', 'REGISTRATION_RESUBMITTED', 'DOCUMENT_UPDATED'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Additional data for the notification (e.g., registration ID, section name)
  data: {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'VenueRegistration' },
    sectionName: String,
    rejectionReason: String,
    link: String
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

// Static method to create a notification
notificationSchema.statics.createNotification = async function(recipientId, type, title, message, data = {}) {
  return this.create({
    recipient: recipientId,
    type,
    title,
    message,
    data
  });
};

// Static method to notify all admins
notificationSchema.statics.notifyAllAdmins = async function(type, title, message, data = {}) {
  // Import User model here to avoid circular dependency
  const User = mongoose.model('User');

  // Find all admin users
  const admins = await User.find({ role: 'admin' }).select('_id');

  if (admins.length === 0) {
    console.log('No admin users found to notify');
    return [];
  }

  // Create notifications for all admins
  const notifications = await Promise.all(
    admins.map(admin =>
      this.create({
        recipient: admin._id,
        type,
        title,
        message,
        data
      })
    )
  );

  console.log(`Notified ${notifications.length} admin(s): ${title}`);
  return notifications;
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
