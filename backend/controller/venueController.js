import Venue from '../models/Venue.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import VenueRegistration from '../models/VenueRegistration.js';

// Create venue (venue owner only)
export const createVenue = async (req, res) => {
  try {
    // Check if user is venue owner
    if (req.userRole !== 'venue-owner') {
      return res.status(403).json({
        success: false,
        message: 'Only venue owners can create venues'
      });
    }

    const { name, type, city, address, capacity, pricePerDay, description, amenities } = req.body;

    const venue = await Venue.create({
      name,
      type,
      city,
      address,
      capacity,
      pricePerDay,
      description,
      amenities: amenities || [],
      owner: req.userId,
      isApproved: false
    });

    res.status(201).json({
      success: true,
      message: 'Venue created successfully. Awaiting admin approval.',
      venue
    });
  } catch (error) {
    console.error('Create venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating venue',
      error: error.message
    });
  }
};

// Get all approved venues
export const getApprovedVenues = async (req, res) => {
  try {
    const venues = await Venue.find({ isApproved: true }).populate('owner', 'name email');

    res.status(200).json({
      success: true,
      count: venues.length,
      venues
    });
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching venues',
      error: error.message
    });
  }
};

// Get my venues (venue owner only)
export const getMyVenues = async (req, res) => {
  try {
    if (req.userRole !== 'venue-owner') {
      return res.status(403).json({
        success: false,
        message: 'Only venue owners can view their venues'
      });
    }

    const venues = await Venue.find({ owner: req.userId });

    res.status(200).json({
      success: true,
      count: venues.length,
      venues
    });
  } catch (error) {
    console.error('Get my venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching venues',
      error: error.message
    });
  }
};

// Get single venue
export const getVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('reviews.user', 'name');

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    res.status(200).json({
      success: true,
      venue
    });
  } catch (error) {
    console.error('Get venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching venue',
      error: error.message
    });
  }
};

// Add review/rating to venue (authenticated users)
export const addVenueReview = async (req, res) => {
  try {
    const venueId = req.params.id;
    const userId = req.userId;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5 stars.'
      });
    }

    const venue = await Venue.findById(venueId).populate('owner', 'name email');

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    // Prevent a user from submitting multiple reviews on the same venue
    const existingReview = venue.reviews.find(r => r.user.toString() === userId);
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this venue.'
      });
    }

    venue.reviews.push({
      user: userId,
      rating,
      comment: comment || ''
    });

    // Recalculate average rating
    const totalStars = venue.reviews.reduce((sum, r) => sum + r.rating, 0);
    venue.rating = Number((totalStars / venue.reviews.length).toFixed(1));

    await venue.save();

    // Notify the venue owner about the new review
    if (venue.owner && venue.owner._id) {
      await Notification.createNotification(
        venue.owner._id,
        'GENERAL',
        'New venue rating received',
        `Your venue "${venue.name}" received ${rating} stars${comment ? ` with comment: "${comment}"` : ''}.`,
        { venueId: venue._id }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      venue
    });
  } catch (error) {
    console.error('Add venue review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting review.',
      error: error.message
    });
  }
};

// Update venue (venue owner only)
export const updateVenue = async (req, res) => {
  try {
    let venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    // Check if user is venue owner
    if (venue.owner.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this venue'
      });
    }

    venue = await Venue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Venue updated successfully',
      venue
    });
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating venue',
      error: error.message
    });
  }
};

// Admin: Get all venues (approved and pending)
export const getAllVenues = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can view all venues'
      });
    }

    const venues = await Venue.find().populate('owner', 'name email');

    res.status(200).json({
      success: true,
      count: venues.length,
      venues
    });
  } catch (error) {
    console.error('Get all venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching venues',
      error: error.message
    });
  }
};

// Admin: Approve venue
export const approveVenue = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can approve venues'
      });
    }

    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Venue approved successfully',
      venue
    });
  } catch (error) {
    console.error('Approve venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving venue',
      error: error.message
    });
  }
};

// Admin: Delete venue
export const deleteVenue = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete venues'
      });
    }

    const venue = await Venue.findByIdAndDelete(req.params.id);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting venue',
      error: error.message
    });
  }
};

// Upload venue images
export const uploadVenueImages = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find venue
    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    // Check authorization
    if (req.userRole !== 'admin' && venue.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload images for this venue'
      });
    }

    // Get uploaded file paths
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const imagePaths = req.files.map(file => `/uploads/venues/${file.filename}`);
    
    // Add new images to venue
    venue.images = [...(venue.images || []), ...imagePaths];
    await venue.save();

    // Sync with VenueRegistration
    try {
      const registration = await VenueRegistration.findOne({ owner: venue.owner });
      if (registration) {
        const newVenueImages = imagePaths.map(path => ({
          url: path,
          publicId: path.split('/').pop()
        }));
        registration.venueImages = [...(registration.venueImages || []), ...newVenueImages];
        await registration.save();
      }
    } catch (syncError) {
      console.error('Sync to registration error:', syncError);
      // Don't fail the request if sync fails
    }

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      venue
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

// Update venue gallery (remove or reorder images)
export const updateVenueGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: 'Images must be an array'
      });
    }

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    // Check authorization
    if (req.userRole !== 'admin' && venue.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this venue'
      });
    }

    venue.images = images;
    await venue.save();

    // Sync with VenueRegistration
    try {
      const registration = await VenueRegistration.findOne({ owner: venue.owner });
      if (registration) {
        registration.venueImages = images.map(path => ({
          url: path,
          publicId: typeof path === 'string' && path.includes('/') ? path.split('/').pop() : 'legacy'
        }));
        await registration.save();
      }
    } catch (syncError) {
      console.error('Sync to registration error:', syncError);
    }

    res.status(200).json({
      success: true,
      message: 'Gallery updated successfully',
      venue
    });
  } catch (error) {
    console.error('Update gallery error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating gallery',
      error: error.message
    });
  }
};
