import VenueRegistration from '../models/VenueRegistration.js';
import User from '../models/User.js';
import Venue from '../models/Venue.js';
import Notification from '../models/Notification.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { deleteFile } from '../middleware/upload.js';
import { sendRejectionNotificationEmail, sendApprovalNotificationEmail } from '../config/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to construct file URL
const getFileUrl = (req, filename, folder) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${folder}/${filename}`;
};

// =====================================================
// VENUE OWNER ENDPOINTS
// =====================================================

/**
 * Get my registration status
 * GET /api/venue-registration/my-registration
 */
export const getMyRegistration = async (req, res) => {
  try {
    const registration = await VenueRegistration.findOne({ owner: req.userId })
      .populate('owner', 'name email')
      .populate('venue', '_id name owner'); // Populate venue details

    if (!registration) {
      return res.status(200).json({
        success: true,
        exists: false,
        message: 'No registration found',
        registration: null
      });
    }

    res.status(200).json({
      success: true,
      exists: true,
      registration
    });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registration',
      error: error.message
    });
  }
};

/**
 * Create or update registration (Save as draft or submit)
 * POST /api/venue-registration
 */
export const createOrUpdateRegistration = async (req, res) => {
  try {
    const {
      phone,
      venueName,
      capacity,
      numberOfHalls,
      province,
      district,
      municipality,
      wardNo,
      street,
      submitForReview
    } = req.body;

    // Check if registration already exists
    let registration = await VenueRegistration.findOne({ owner: req.userId });

    // Prepare file data
    const fileData = {};

    if (req.files) {
      // Profile Image
      if (req.files.profileImage && req.files.profileImage[0]) {
        const file = req.files.profileImage[0];
        fileData.profileImage = {
          url: getFileUrl(req, file.filename, 'profiles'),
          publicId: file.filename
        };
        fileData.profileImageStatus = { status: 'PENDING' };
      }

      // Venue Images
      if (req.files.venueImages && req.files.venueImages.length > 0) {
        fileData.venueImages = req.files.venueImages.map(file => ({
          url: getFileUrl(req, file.filename, 'venues'),
          publicId: file.filename
        }));
        fileData.venueImagesStatus = { status: 'PENDING' };
      }

      // Documents
      const docFields = ['citizenshipFront', 'citizenshipBack', 'businessRegistration', 'panCard'];
      docFields.forEach(field => {
        if (req.files[field] && req.files[field][0]) {
          const file = req.files[field][0];
          if (!fileData.documents) fileData.documents = {};
          fileData.documents[field] = {
            url: getFileUrl(req, file.filename, 'documents'),
            publicId: file.filename
          };
          fileData.documents[`${field}Status`] = { status: 'PENDING' };
        }
      });
    }

    // Build update object
    const updateData = {
      phone,
      venueName,
      capacity: capacity ? parseInt(capacity) : undefined,
      numberOfHalls: numberOfHalls ? parseInt(numberOfHalls) : undefined,
      location: {
        province,
        district,
        municipality,
        wardNo,
        street
      },
      ...fileData
    };

    // Set registration status based on submitForReview flag
    if (submitForReview === 'true' || submitForReview === true) {
      updateData.registrationStatus = 'PENDING';
      updateData.submittedAt = new Date();
    }

    if (registration) {
      // Check if this is a resubmission (was previously rejected or under review)
      const isResubmission = submitForReview &&
        (registration.registrationStatus === 'REJECTED' ||
         registration.registrationStatus === 'UNDER_REVIEW' ||
         registration.hasRejectedDocuments?.());

      // Update existing registration
      // Merge documents properly
      if (fileData.documents) {
        updateData.documents = {
          ...registration.documents?.toObject?.() || registration.documents || {},
          ...fileData.documents
        };
      }

      // Append venue images instead of replacing (if there are existing ones)
      if (fileData.venueImages && registration.venueImages?.length > 0) {
        // Replace if resubmitting, append if adding
        if (registration.venueImagesStatus?.status === 'REJECTED') {
          updateData.venueImages = fileData.venueImages;
        } else {
          updateData.venueImages = [...registration.venueImages, ...fileData.venueImages].slice(0, 6);
        }
      }

      registration = await VenueRegistration.findOneAndUpdate(
        { owner: req.userId },
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('owner', 'name email');

      // Notify admins when registration is submitted/resubmitted for review
      if (submitForReview === 'true' || submitForReview === true) {
        try {
          const ownerName = registration.owner?.name || 'A venue owner';
          const venueName = registration.venueName || 'Unnamed Venue';

          if (isResubmission) {
            await Notification.notifyAllAdmins(
              'REGISTRATION_RESUBMITTED',
              'Registration Resubmitted',
              `${ownerName} has resubmitted their venue registration for "${venueName}" after making corrections.`,
              {
                registrationId: registration._id,
                link: `/admin/venue-registrations/${registration._id}`
              }
            );
          } else {
            await Notification.notifyAllAdmins(
              'NEW_REGISTRATION',
              'New Venue Registration',
              `${ownerName} has submitted a new venue registration for "${venueName}" awaiting review.`,
              {
                registrationId: registration._id,
                link: `/admin/venue-registrations/${registration._id}`
              }
            );
          }
        } catch (notifError) {
          console.error('Failed to notify admins:', notifError);
        }
      }

      res.status(200).json({
        success: true,
        message: submitForReview ? 'Registration submitted for review' : 'Registration saved',
        registration
      });
    } else {
      // Create new registration
      registration = await VenueRegistration.create({
        owner: req.userId,
        ...updateData
      });

      // Populate owner for notification
      await registration.populate('owner', 'name email');

      // Notify admins when new registration is submitted for review
      if (submitForReview === 'true' || submitForReview === true) {
        try {
          const ownerName = registration.owner?.name || 'A venue owner';
          const venueName = registration.venueName || 'Unnamed Venue';

          await Notification.notifyAllAdmins(
            'NEW_REGISTRATION',
            'New Venue Registration',
            `${ownerName} has submitted a new venue registration for "${venueName}" awaiting review.`,
            {
              registrationId: registration._id,
              link: `/admin/venue-registrations/${registration._id}`
            }
          );
        } catch (notifError) {
          console.error('Failed to notify admins:', notifError);
        }
      }

      res.status(201).json({
        success: true,
        message: submitForReview ? 'Registration submitted for review' : 'Registration draft saved',
        registration
      });
    }
  } catch (error) {
    console.error('Create/Update registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving registration',
      error: error.message
    });
  }
};

/**
 * Upload single file (for individual file uploads)
 * POST /api/venue-registration/upload/:fieldName
 */
export const uploadSingleDocument = async (req, res) => {
  try {
    const { fieldName } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Determine folder based on field name
    let folder = 'documents';
    if (fieldName === 'profileImage') folder = 'profiles';
    if (fieldName.includes('venue')) folder = 'venues';

    const fileUrl = getFileUrl(req, req.file.filename, folder);

    // Update registration with new file
    let registration = await VenueRegistration.findOne({ owner: req.userId });

    if (!registration) {
      // Create new registration with just this file
      const updateData = { owner: req.userId };

      if (fieldName === 'profileImage') {
        updateData.profileImage = { url: fileUrl, publicId: req.file.filename };
        updateData.profileImageStatus = { status: 'PENDING' };
      } else if (['citizenshipFront', 'citizenshipBack', 'businessRegistration', 'panCard'].includes(fieldName)) {
        updateData.documents = {
          [fieldName]: { url: fileUrl, publicId: req.file.filename },
          [`${fieldName}Status`]: { status: 'PENDING' }
        };
      }

      registration = await VenueRegistration.create(updateData);
    } else {
      // Update existing registration
      const updateData = {};

      if (fieldName === 'profileImage') {
        // Delete old file if exists
        if (registration.profileImage?.publicId) {
          const oldPath = path.join(__dirname, '..', 'uploads', 'profiles', registration.profileImage.publicId);
          await deleteFile(oldPath).catch(() => {});
        }
        updateData.profileImage = { url: fileUrl, publicId: req.file.filename };
        updateData.profileImageStatus = { status: 'PENDING' };
      } else if (['citizenshipFront', 'citizenshipBack', 'businessRegistration', 'panCard'].includes(fieldName)) {
        // Delete old file if exists
        if (registration.documents?.[fieldName]?.publicId) {
          const oldPath = path.join(__dirname, '..', 'uploads', 'documents', registration.documents[fieldName].publicId);
          await deleteFile(oldPath).catch(() => {});
        }
        updateData[`documents.${fieldName}`] = { url: fileUrl, publicId: req.file.filename };
        updateData[`documents.${fieldName}Status`] = { status: 'PENDING' };
      }

      registration = await VenueRegistration.findOneAndUpdate(
        { owner: req.userId },
        { $set: updateData },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        url: fileUrl,
        fieldName
      },
      registration
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

/**
 * Add venue images (append to existing)
 * POST /api/venue-registration/venue-images
 */
export const addVenueImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    let registration = await VenueRegistration.findOne({ owner: req.userId });

    const newImages = req.files.map(file => ({
      url: getFileUrl(req, file.filename, 'venues'),
      publicId: file.filename
    }));

    if (!registration) {
      registration = await VenueRegistration.create({
        owner: req.userId,
        venueImages: newImages,
        venueImagesStatus: { status: 'PENDING' }
      });
    } else {
      // Check if already at max
      const currentCount = registration.venueImages?.length || 0;
      if (currentCount >= 6) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 6 venue images allowed'
        });
      }

      // Add new images (up to 6 total)
      const combinedImages = [...(registration.venueImages || []), ...newImages].slice(0, 6);

      registration = await VenueRegistration.findOneAndUpdate(
        { owner: req.userId },
        {
          $set: {
            venueImages: combinedImages,
            venueImagesStatus: { status: 'PENDING' }
          }
        },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      registration,
      venueImages: registration.venueImages,
      images: registration.venueImages,
      count: registration.venueImages.length
    });
  } catch (error) {
    console.error('Add venue images error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

/**
 * Remove a venue image
 * DELETE /api/venue-registration/venue-images/:imageId
 */
export const removeVenueImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const registration = await VenueRegistration.findOne({ owner: req.userId });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Find and remove the image
    const imageIndex = registration.venueImages.findIndex(
      img => img.publicId === imageId || img._id?.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete file from disk
    const imagePath = path.join(__dirname, '..', 'uploads', 'venues', registration.venueImages[imageIndex].publicId);
    await deleteFile(imagePath).catch(() => {});

    // Remove from array
    registration.venueImages.splice(imageIndex, 1);
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Image removed successfully',
      registration,
      venueImages: registration.venueImages,
      images: registration.venueImages,
      count: registration.venueImages.length
    });
  } catch (error) {
    console.error('Remove venue image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing image',
      error: error.message
    });
  }
};

// =====================================================
// ADMIN ENDPOINTS
// =====================================================

/**
 * Get all registrations (with filters)
 * GET /api/venue-registration/admin/all
 */
export const getAllRegistrations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    const query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.registrationStatus = status;
    }

    // Search by venue name or owner name
    if (search) {
      query.$or = [
        { venueName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [registrations, total] = await Promise.all([
      VenueRegistration.find(query)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      VenueRegistration.countDocuments(query)
    ]);

    // Get counts by status
    const statusCounts = await VenueRegistration.aggregate([
      { $group: { _id: '$registrationStatus', count: { $sum: 1 } } }
    ]);

    const counts = {
      all: total,
      PENDING: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0
    };

    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      registrations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      counts
    });
  } catch (error) {
    console.error('Get all registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
};

/**
 * Get single registration details
 * GET /api/venue-registration/admin/:id
 */
export const getRegistrationById = async (req, res) => {
  try {
    const registration = await VenueRegistration.findById(req.params.id)
      .populate('owner', 'name email createdAt');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.status(200).json({
      success: true,
      registration
    });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registration',
      error: error.message
    });
  }
};

/**
 * Review a document (approve/reject)
 * PUT /api/venue-registration/admin/:id/review-document
 */
export const reviewDocument = async (req, res) => {
  try {
    const { documentField, status, rejectionReason } = req.body;
    const { id } = req.params;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be APPROVED or REJECTED'
      });
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const registration = await VenueRegistration.findById(id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Build update path based on document field
    const updateData = {};
    const statusField = documentField.includes('Status') ? documentField : `${documentField}Status`;

    const reviewData = {
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      reviewedAt: new Date(),
      reviewedBy: req.userId
    };

    // Top-level status fields
    const topLevelStatusFields = ['profileImageStatus', 'venueImagesStatus', 'venueNameStatus', 'phoneStatus', 'locationStatus'];
    // Document status fields
    const documentStatusFields = ['citizenshipFrontStatus', 'citizenshipBackStatus', 'businessRegistrationStatus', 'panCardStatus'];

    if (topLevelStatusFields.includes(statusField)) {
      updateData[statusField] = reviewData;
    } else if (documentStatusFields.includes(statusField)) {
      updateData[`documents.${statusField}`] = reviewData;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid document field'
      });
    }

    // Update registration status to UNDER_REVIEW if currently PENDING
    if (registration.registrationStatus === 'PENDING') {
      updateData.registrationStatus = 'UNDER_REVIEW';
    }

    const updatedRegistration = await VenueRegistration.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('owner', 'name email');

    // Check if all documents are now reviewed
    const allApproved = updatedRegistration.areAllDocumentsApproved();
    const hasRejected = updatedRegistration.hasRejectedDocuments();

    // Auto-update overall status
    if (allApproved) {
      await VenueRegistration.findByIdAndUpdate(id, {
        $set: {
          registrationStatus: 'APPROVED',
          approvedAt: new Date()
        }
      });

      // Send approval notification and email when all documents are approved
      if (updatedRegistration.owner) {
        // Create in-app notification for approval
        try {
          await Notification.createNotification(
            updatedRegistration.owner._id,
            'REGISTRATION_APPROVED',
            'Venue Registration Approved!',
            `Congratulations! Your venue "${updatedRegistration.venueName || 'Your Venue'}" has been verified and is now active on Saan.`,
            {
              registrationId: updatedRegistration._id,
              link: '/venue-owner/dashboard'
            }
          );
          console.log(`In-app approval notification created for ${updatedRegistration.owner.email}`);
        } catch (notifError) {
          console.error('Failed to create in-app approval notification:', notifError);
        }

        // Send approval email notification
        try {
          await sendApprovalNotificationEmail(
            updatedRegistration.owner.email,
            updatedRegistration.owner.name,
            updatedRegistration.venueName || 'Your Venue'
          );
          console.log(`Approval notification email sent to ${updatedRegistration.owner.email}`);
        } catch (emailError) {
          console.error('Failed to send approval notification email:', emailError);
        }
      }
    } else if (hasRejected) {
      await VenueRegistration.findByIdAndUpdate(id, {
        $set: {
          registrationStatus: 'REJECTED',
          rejectedAt: new Date()
        }
      });
    }

    // Send rejection notification email and create in-app notification if status is REJECTED
    if (status === 'REJECTED' && updatedRegistration.owner) {
      // Extract the section name from the documentField (remove 'Status' suffix if present)
      const sectionName = documentField.replace('Status', '');

      // Section labels for user-friendly display
      const sectionLabels = {
        venueName: 'Venue Name',
        phone: 'Phone Number',
        location: 'Location',
        profileImage: 'Profile Image',
        venueImages: 'Venue Images',
        citizenshipFront: 'Citizenship (Front)',
        citizenshipBack: 'Citizenship (Back)',
        businessRegistration: 'Business Registration',
        panCard: 'PAN Card',
      };
      const sectionLabel = sectionLabels[sectionName] || sectionName;

      // Create in-app notification
      try {
        await Notification.createNotification(
          updatedRegistration.owner._id,
          'SECTION_REJECTED',
          `${sectionLabel} Rejected`,
          `Your ${sectionLabel} in venue registration has been rejected. Reason: ${rejectionReason}`,
          {
            registrationId: updatedRegistration._id,
            sectionName: sectionName,
            rejectionReason: rejectionReason,
            link: '/venue-owner/registration'
          }
        );
        console.log(`In-app notification created for ${updatedRegistration.owner.email}`);
      } catch (notifError) {
        console.error('Failed to create in-app notification:', notifError);
      }

      // Send email notification
      try {
        await sendRejectionNotificationEmail(
          updatedRegistration.owner.email,
          updatedRegistration.owner.name,
          updatedRegistration.venueName || 'Your Venue',
          sectionName,
          rejectionReason
        );
        console.log(`Rejection notification email sent to ${updatedRegistration.owner.email}`);
      } catch (emailError) {
        console.error('Failed to send rejection notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: `Document ${status.toLowerCase()}`,
      registration: await VenueRegistration.findById(id).populate('owner', 'name email')
    });
  } catch (error) {
    console.error('Review document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing document',
      error: error.message
    });
  }
};

/**
 * Approve entire registration
 * PUT /api/venue-registration/admin/:id/approve
 */
// In venueRegistrationController.js - Update the approveRegistration function
export const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const reviewedAt = new Date();
    
    // First, get the registration
    const registration = await VenueRegistration.findById(id)
      .populate('owner', 'name email');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Update registration status
    const updatedRegistration = await VenueRegistration.findByIdAndUpdate(
      id,
      {
        $set: {
          registrationStatus: 'APPROVED',
          approvedAt: new Date(),
          adminNotes: adminNotes || null,
          // Approve all fields
          'venueNameStatus.status': 'APPROVED',
          'venueNameStatus.reviewedAt': reviewedAt,
          'venueNameStatus.reviewedBy': req.userId,
          'phoneStatus.status': 'APPROVED',
          'phoneStatus.reviewedAt': reviewedAt,
          'phoneStatus.reviewedBy': req.userId,
          'locationStatus.status': 'APPROVED',
          'locationStatus.reviewedAt': reviewedAt,
          'locationStatus.reviewedBy': req.userId,
          'profileImageStatus.status': 'APPROVED',
          'profileImageStatus.reviewedAt': reviewedAt,
          'profileImageStatus.reviewedBy': req.userId,
          'venueImagesStatus.status': 'APPROVED',
          'venueImagesStatus.reviewedAt': reviewedAt,
          'venueImagesStatus.reviewedBy': req.userId,
          'documents.citizenshipFrontStatus.status': 'APPROVED',
          'documents.citizenshipFrontStatus.reviewedAt': reviewedAt,
          'documents.citizenshipFrontStatus.reviewedBy': req.userId,
          'documents.citizenshipBackStatus.status': 'APPROVED',
          'documents.citizenshipBackStatus.reviewedAt': reviewedAt,
          'documents.citizenshipBackStatus.reviewedBy': req.userId,
          'documents.businessRegistrationStatus.status': 'APPROVED',
          'documents.businessRegistrationStatus.reviewedAt': reviewedAt,
          'documents.businessRegistrationStatus.reviewedBy': req.userId,
          'documents.panCardStatus.status': 'APPROVED',
          'documents.panCardStatus.reviewedAt': reviewedAt,
          'documents.panCardStatus.reviewedBy': req.userId
        }
      },
      { new: true }
    ).populate('owner', 'name email');

    // ✅ CRITICAL: CREATE VENUE FROM APPROVED REGISTRATION
    try {
      // Check if venue already exists for this registration
      const existingVenue = await Venue.findOne({ registration: id });
      
      if (!existingVenue) {
        console.log('Creating venue from approved registration...');
        
        // Extract images from venueImages array
        const venueImages = registration.venueImages?.map(img => img.url) || [];
        
        // Create venue from registration data
        const venueData = {
          name: registration.venueName || 'New Venue',
          type: 'banquet',
          city: registration.location?.district || 'Kathmandu',
          address: `${registration.location?.street || ''}, Ward ${registration.location?.wardNo || ''}, ${registration.location?.municipality || ''}`,
          capacity: registration.capacity || 500, // Use capacity from registration
          numberOfHalls: registration.numberOfHalls || 1, // Use numberOfHalls from registration
          pricePerDay: 1500, // Default - venue owner can update later
          description: `Beautiful ${registration.venueName} located in ${registration.location?.municipality || ''}. Perfect for weddings, corporate events, and celebrations.`,
          amenities: ['AC', 'Parking', 'Catering', 'WiFi', 'Sound System'], // Default amenities
          owner: registration.owner._id,
          registration: id, // Link to registration document
          images: venueImages,
          phone: registration.phone,
          isApproved: true // Auto-approve since registration was approved
        };

        const newVenue = await Venue.create(venueData);
        console.log(`✅ Venue created successfully: ${newVenue.name} (ID: ${newVenue._id})`);
        
        // Also update the registration with venue reference
        await VenueRegistration.findByIdAndUpdate(id, {
          $set: { venue: newVenue._id }
        });
      } else {
        console.log(`ℹ️ Venue already exists: ${existingVenue.name}`);
      }
    } catch (venueError) {
      console.error('❌ Error creating venue from registration:', venueError);
      // Don't fail the approval, but log the error
    }

    // Create in-app notification for approval
    if (registration.owner) {
      try {
        await Notification.createNotification(
          registration.owner._id,
          'REGISTRATION_APPROVED',
          'Venue Registration Approved!',
          `Congratulations! Your venue "${registration.venueName || 'Your Venue'}" has been verified and is now active on Saan.`,
          {
            registrationId: registration._id,
            link: '/venue-owner/dashboard'
          }
        );
        console.log(`✅ In-app approval notification created for ${registration.owner.email}`);
      } catch (notifError) {
        console.error('Failed to create in-app approval notification:', notifError);
      }

      // Send approval email notification
      try {
        await sendApprovalNotificationEmail(
          registration.owner.email,
          registration.owner.name,
          registration.venueName || 'Your Venue'
        );
        console.log(`✅ Approval notification email sent to ${registration.owner.email}`);
      } catch (emailError) {
        console.error('Failed to send approval notification email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Registration approved and venue created successfully',
      registration: updatedRegistration
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving registration',
      error: error.message
    });
  }
};
/**
 * Reject entire registration
 * PUT /api/venue-registration/admin/:id/reject
 */
export const rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    if (!adminNotes) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason/notes required'
      });
    }

    const registration = await VenueRegistration.findByIdAndUpdate(
      id,
      {
        $set: {
          registrationStatus: 'REJECTED',
          rejectedAt: new Date(),
          adminNotes
        }
      },
      { new: true }
    ).populate('owner', 'name email');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Registration rejected',
      registration
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting registration',
      error: error.message
    });
  }
};

/**
 * Get dashboard stats for admin
 * GET /api/venue-registration/admin/stats
 */
export const getAdminStats = async (req, res) => {
  try {
    const stats = await VenueRegistration.aggregate([
      {
        $group: {
          _id: '$registrationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentRegistrations = await VenueRegistration.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const result = {
      total: 0,
      pending: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      recentRegistrations
    };

    stats.forEach(item => {
      result.total += item.count;
      switch (item._id) {
        case 'PENDING':
          result.pending = item.count;
          break;
        case 'UNDER_REVIEW':
          result.underReview = item.count;
          break;
        case 'APPROVED':
          result.approved = item.count;
          break;
        case 'REJECTED':
          result.rejected = item.count;
          break;
      }
    });

    res.status(200).json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
};
