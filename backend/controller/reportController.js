import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';
import User from '../models/User.js';
import VenueRegistration from '../models/VenueRegistration.js';
import mongoose from 'mongoose';

/**
 * Get platform-wide reporting stats
 * GET /api/reports/dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Revenue Trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $in: ['booked', 'confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          revenue: { $sum: '$paidAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 2. Booking Status Distribution
    const bookingDistribution = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // 3. User Role Distribution
    const userDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // 4. Top Performing Venues (by revenue)
    const topVenues = await Booking.aggregate([
      {
        $match: { status: { $in: ['booked', 'confirmed', 'completed'] } }
      },
      {
        $group: {
          _id: '$venue',
          totalRevenue: { $sum: '$paidAmount' },
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'venues',
          localField: '_id',
          foreignField: '_id',
          as: 'venueDetails'
        }
      },
      { $unwind: '$venueDetails' }
    ]);

    // 5. Registration Progress
    const registrationStats = await VenueRegistration.aggregate([
      {
        $group: {
          _id: '$registrationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // 6. Recent Registrations
    const recentRegistrations = await VenueRegistration.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // 7. Venues per month (last 6 months)
    const venueTrends = await Venue.aggregate([
      {
        $match: { createdAt: { $gte: sixMonthsAgo } }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 8. Recent Bookings (last 10)
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('venue', 'name city')
      .sort({ createdAt: -1 })
      .limit(10);

    // 9. Users per month (last 6 months)
    const userTrends = await User.aggregate([
      {
        $match: { createdAt: { $gte: sixMonthsAgo } }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        revenueTrends,
        bookingDistribution,
        userDistribution,
        topVenues,
        registrationStats,
        recentRegistrations,
        venueTrends,
        recentBookings,
        userTrends
      }
    });
  } catch (error) {
    console.error('Report stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report stats',
      error: error.message
    });
  }
};

/**
 * Get booking stats for all venues
 * GET /api/reports/venue-performance
 */
export const getVenuePerformance = async (req, res) => {
  try {
    const venues = await Venue.find().lean();
    
    const performance = await Promise.all(venues.map(async (venue) => {
      const now = new Date();
      
      const upcomingCount = await Booking.countDocuments({
        venue: venue._id,
        eventDate: { $gte: now },
        status: { $in: ['booked', 'confirmed', 'pending'] }
      });
      
      const completedCount = await Booking.countDocuments({
        venue: venue._id,
        eventDate: { $lt: now },
        status: { $in: ['booked', 'confirmed', 'completed'] }
      });
      
      const totalRevenue = await Booking.aggregate([
        {
          $match: {
            venue: venue._id,
            status: { $in: ['booked', 'confirmed', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$paidAmount' }
          }
        }
      ]);

      return {
        _id: venue._id,
        name: venue.name,
        upcomingEvents: upcomingCount,
        completedEvents: completedCount,
        revenue: totalRevenue[0]?.total || 0,
        city: venue.city,
        owner: venue.owner
      };
    }));

    res.status(200).json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('Venue performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching venue performance',
      error: error.message
    });
  }
};
