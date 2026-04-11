import mongoose from 'mongoose';

// Document verification status schema
const documentStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'NOT_SUBMITTED'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { _id: false });

// Location schema for Nepal addresses
const locationSchema = new mongoose.Schema({
  province: {
    type: String,
    required: [true, 'Province is required']
  },
  district: {
    type: String,
    required: [true, 'District is required']
  },
  municipality: {
    type: String,
    required: [true, 'Municipality is required']
  },
  wardNo: {
    type: String,
    required: [true, 'Ward number is required']
  },
  street: {
    type: String,
    required: [true, 'Street/Tole is required']
  }
}, { _id: false });

const venueRegistrationSchema = new mongoose.Schema({
  // Owner reference (from User model)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One registration per venue owner
  },

  // Contact Details
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^(98|97|96|01)[0-9]{8}$/, 'Please provide a valid Nepal phone number']
  },
  phoneStatus: documentStatusSchema,

  // Profile Picture
  profileImage: {
    url: { type: String, default: null },
    publicId: { type: String, default: null } // For cloud storage reference
  },
  profileImageStatus: documentStatusSchema,

  // Venue Details
  venueName: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true
  },
  venueNameStatus: documentStatusSchema,

  // Venue Images (3-6 images)
  venueImages: [{
    url: { type: String },
    publicId: { type: String }
  }],
  venueImagesStatus: documentStatusSchema,

  // Government Documents
  documents: {
    citizenshipFront: {
      url: { type: String, default: null },
      publicId: { type: String, default: null }
    },
    citizenshipFrontStatus: documentStatusSchema,

    citizenshipBack: {
      url: { type: String, default: null },
      publicId: { type: String, default: null }
    },
    citizenshipBackStatus: documentStatusSchema,

    businessRegistration: {
      url: { type: String, default: null },
      publicId: { type: String, default: null }
    },
    businessRegistrationStatus: documentStatusSchema,

    panCard: {
      url: { type: String, default: null },
      publicId: { type: String, default: null }
    },
    panCardStatus: documentStatusSchema
  },

  // Location
  location: locationSchema,
  locationStatus: documentStatusSchema,

  // Venue Capacity Details
  capacity: {
    type: Number,
    default: null
  },

  numberOfHalls: {
    type: Number,
    default: null
  },

  // Overall Registration Status
  registrationStatus: {
    type: String,
    enum: ['DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMITTED'],
    default: 'DRAFT'
  },

  // Admin notes/feedback
  adminNotes: {
    type: String,
    default: null
  },

  // Timestamps for tracking
  submittedAt: {
    type: Date,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },

  // Reference to the created Venue (set after approval)
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    default: null
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Virtual to get formatted full address
venueRegistrationSchema.virtual('fullAddress').get(function() {
  if (!this.location) return '';
  const { street, wardNo, municipality, district, province } = this.location;
  return `${street}, Ward ${wardNo}, ${municipality}, ${district}, Province ${province}, Nepal`;
});

// Method to check if all sections are approved
venueRegistrationSchema.methods.areAllDocumentsApproved = function() {
  const { documents, profileImageStatus, venueImagesStatus, venueNameStatus, phoneStatus, locationStatus } = this;

  return (
    venueNameStatus?.status === 'APPROVED' &&
    phoneStatus?.status === 'APPROVED' &&
    locationStatus?.status === 'APPROVED' &&
    profileImageStatus?.status === 'APPROVED' &&
    venueImagesStatus?.status === 'APPROVED' &&
    documents?.citizenshipFrontStatus?.status === 'APPROVED' &&
    documents?.citizenshipBackStatus?.status === 'APPROVED' &&
    documents?.businessRegistrationStatus?.status === 'APPROVED' &&
    documents?.panCardStatus?.status === 'APPROVED'
  );
};

// Method to check if any section is rejected
venueRegistrationSchema.methods.hasRejectedDocuments = function() {
  const { documents, profileImageStatus, venueImagesStatus, venueNameStatus, phoneStatus, locationStatus } = this;

  return (
    venueNameStatus?.status === 'REJECTED' ||
    phoneStatus?.status === 'REJECTED' ||
    locationStatus?.status === 'REJECTED' ||
    profileImageStatus?.status === 'REJECTED' ||
    venueImagesStatus?.status === 'REJECTED' ||
    documents?.citizenshipFrontStatus?.status === 'REJECTED' ||
    documents?.citizenshipBackStatus?.status === 'REJECTED' ||
    documents?.businessRegistrationStatus?.status === 'REJECTED' ||
    documents?.panCardStatus?.status === 'REJECTED'
  );
};

// Static method to get pending registrations count
venueRegistrationSchema.statics.getPendingCount = async function() {
  return this.countDocuments({ registrationStatus: 'PENDING' });
};

// Pre-save hook to update registration status based on sections
venueRegistrationSchema.pre('save', async function() {
  // Check if all sections are approved
  const allApproved = (
    this.venueNameStatus?.status === 'APPROVED' &&
    this.phoneStatus?.status === 'APPROVED' &&
    this.locationStatus?.status === 'APPROVED' &&
    this.profileImageStatus?.status === 'APPROVED' &&
    this.venueImagesStatus?.status === 'APPROVED' &&
    this.documents?.citizenshipFrontStatus?.status === 'APPROVED' &&
    this.documents?.citizenshipBackStatus?.status === 'APPROVED' &&
    this.documents?.businessRegistrationStatus?.status === 'APPROVED' &&
    this.documents?.panCardStatus?.status === 'APPROVED'
  );

  // Check if any section is rejected
  const hasRejected = (
    this.venueNameStatus?.status === 'REJECTED' ||
    this.phoneStatus?.status === 'REJECTED' ||
    this.locationStatus?.status === 'REJECTED' ||
    this.profileImageStatus?.status === 'REJECTED' ||
    this.venueImagesStatus?.status === 'REJECTED' ||
    this.documents?.citizenshipFrontStatus?.status === 'REJECTED' ||
    this.documents?.citizenshipBackStatus?.status === 'REJECTED' ||
    this.documents?.businessRegistrationStatus?.status === 'REJECTED' ||
    this.documents?.panCardStatus?.status === 'REJECTED'
  );

  // If any section is rejected, set status to REJECTED
  if (hasRejected && this.registrationStatus === 'APPROVED') {
    this.registrationStatus = 'REJECTED';
    this.rejectedAt = new Date();
  }
  // If all sections are approved, auto-approve registration
  else if (allApproved && this.registrationStatus !== 'APPROVED') {
    this.registrationStatus = 'APPROVED';
    this.approvedAt = new Date();
  }
});

// Index for faster queries (owner index not needed as it's already unique)
venueRegistrationSchema.index({ registrationStatus: 1 });
venueRegistrationSchema.index({ createdAt: -1 });

const VenueRegistration = mongoose.model('VenueRegistration', venueRegistrationSchema);

export default VenueRegistration;
