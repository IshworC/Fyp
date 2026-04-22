// Try to dynamically import `socket.io-client`; fall back to CDN ESM if not installed.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
export const BASE_URL = API_URL.replace(/\/api\/?$/, '');
const SOCKET_BASE = BASE_URL;

/**
 * Get full URL for an image path
 * @param {string} path - The image path (relative or absolute)
 * @returns {string} The full URL
 */
export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
};


let IOlib;
try {
  const mod = await import('socket.io-client');
  IOlib = mod.io || mod.default || mod;
} catch (err) {
  // Fallback to CDN ESM build
  const mod = await import('https://cdn.socket.io/4.8.0/socket.io.esm.min.js');
  IOlib = mod.io || mod.default || mod;
}

export const socket = IOlib(SOCKET_BASE, { autoConnect: false });

// Auth API calls
export const authAPI = {
  register: async (formData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  getCurrentUser: async (token) => {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  logout: async (token) => {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },
};

// OTP API calls
export const otpAPI = {
  sendOtp: async (email, name) => {
    const response = await fetch(`${API_URL}/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });
    return response.json();
  },

  verifyOtp: async (email, otp) => {
    const response = await fetch(`${API_URL}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });
    return response.json();
  },

  resendOtp: async (email, name) => {
    const response = await fetch(`${API_URL}/otp/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });
    return response.json();
  },
};

// Venue API calls
export const venueAPI = {
  getApprovedVenues: async () => {
    const response = await fetch(`${API_URL}/venues/approved`);
    return response.json();
  },

  getSingleVenue: async (id) => {
    const response = await fetch(`${API_URL}/venues/${id}`);
    return response.json();
  },

  createVenue: async (token, venueData) => {
    const response = await fetch(`${API_URL}/venues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(venueData),
    });
    return response.json();
  },

  getMyVenues: async (token) => {
    const response = await fetch(`${API_URL}/venues/owner/my-venues`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  updateVenue: async (token, id, venueData) => {
    const response = await fetch(`${API_URL}/venues/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(venueData),
    });
    return response.json();
  },

  updateVenueImages: async (token, venueId, formData) => {
    const response = await fetch(`${API_URL}/venues/${venueId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json();
  },

  submitVenueReview: async (token, venueId, reviewData) => {
    try {
      const response = await fetch(`${API_URL}/venues/${venueId}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to submit review' };
      }
      return data;
    } catch (err) {
      console.error('Submit review error:', err);
      return { success: false, message: err.message || 'Network error' };
    }
  },

  updateVenueGallery: async (token, venueId, data) => {
    const response = await fetch(`${API_URL}/venues/${venueId}/gallery`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// Booking API calls
export const bookingAPI = {
  getPublicBookedDates: async (venueId) => {
    try {
      const response = await fetch(`${API_URL}/bookings/venue/${venueId}/booked-dates`);
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to fetch booked dates' };
      }
      return response.json();
    } catch (err) {
      console.error('Get booked dates error:', err);
      return { success: false, message: err.message };
    }
  },

  createBooking: async (token, bookingData) => {
    try {
      console.log('Creating booking with token:', token?.substring(0, 20) + '...');
      console.log('Booking data:', bookingData);
      
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      console.log('Booking API response status:', response.status);
      
      if (!response.ok) {
        let error = {};
        try {
          error = await response.json();
        } catch (e) {
          error = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('Booking API error response:', error);
        
        // Handle specific error cases
        if (response.status === 401) {
          return { success: false, message: 'Invalid or expired token. Please login again.' };
        }
        if (response.status === 403) {
          return { success: false, message: 'You do not have permission to create bookings. Only users can book venues.' };
        }
        
        return { success: false, message: error.message || 'Failed to create booking' };
      }
      
      const result = await response.json();
      console.log('Booking created successfully:', result);
      return result;
    } catch (err) {
      console.error('Create booking error:', err);
      return { success: false, message: err.message || 'Network error. Please check your connection.' };
    }
  },

  getMyBookings: async (token) => {
    try {
      const response = await fetch(`${API_URL}/bookings/my-bookings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to fetch bookings' };
      }
      
      return response.json();
    } catch (err) {
      console.error('Get bookings error:', err);
      return { success: false, message: err.message };
    }
  },

  cancelBooking: async (token, id) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to cancel booking' };
      }
      
      return response.json();
    } catch (err) {
      console.error('Cancel booking error:', err);
      return { success: false, message: err.message };
    }
  },

  getVenueBookings: async (token, venueId) => {
    try {
      console.log("getVenueBookings called with venueId:", venueId);
      const response = await fetch(`${API_URL}/bookings/venue/${venueId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log("getVenueBookings response status:", response.status);
      
      if (!response.ok) {
        let error = {};
        try {
          error = await response.json();
        } catch (e) {
          error = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error("getVenueBookings error:", error);
        return { success: false, message: error.message || 'Failed to fetch venue bookings', status: response.status };
      }
      
      const data = await response.json();
      console.log("getVenueBookings success, bookings count:", data.bookings?.length || 0);
      return data;
    } catch (err) {
      console.error('Get venue bookings error:', err);
      return { success: false, message: 'Network error: ' + err.message };
    }
  },

  updateBookingStatus: async (token, id, status) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to update booking status' };
      }
      
      return response.json();
    } catch (err) {
      console.error('Update booking status error:', err);
      return { success: false, message: err.message };
    }
  },

  createManualBooking: async (token, bookingData) => {
    try {
      const response = await fetch(`${API_URL}/bookings/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to create manual booking' };
      }
      
      return response.json();
    } catch (err) {
      console.error('Create manual booking error:', err);
      return { success: false, message: err.message };
    }
  },
};

// Venue Registration API calls
export const venueRegistrationAPI = {
  // Get my registration status
  getMyRegistration: async (token) => {
    if (!token) {
      return {
        success: false,
        message: 'Authentication token is missing. Please log in again.'
      };
    }

    try {
      const response = await fetch(`${API_URL}/venue-registration/my-registration`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      console.log("getMyRegistration response status:", response.status);
      console.log("getMyRegistration response data:", data);
      
      if (!response.ok) {
        console.error("getMyRegistration error - status:", response.status, "data:", data);
        return {
          success: false,
          message: data.message || `Error: ${response.status} ${response.statusText}`,
          status: response.status
        };
      }
      
      return data;
    } catch (error) {
      console.error("getMyRegistration fetch error:", error);
      return {
        success: false,
        message: 'Network error: Unable to connect to server',
        error: error.message
      };
    }
  },

  // Submit registration with all files
  submitRegistration: async (token, formData) => {
    if (!token) {
      return {
        success: false,
        message: 'Authentication token is missing. Please log in again.'
      };
    }

    try {
      const response = await fetch(`${API_URL}/venue-registration`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData,
      });
      const data = await response.json();
      
      if (!response.ok && data.message === 'Invalid token') {
        return {
          success: false,
          message: 'Your session has expired. Please log in again.',
          status: response.status
        };
      }
      
      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Network error: Unable to connect to server',
        error: error.message
      };
    }
  },

  // Upload single document
  uploadDocument: async (token, fieldName, file) => {
    if (!token) {
      return {
        success: false,
        message: 'Authentication token is missing. Please log in again.'
      };
    }

    const formData = new FormData();
    formData.append(fieldName, file);

    try {
      const response = await fetch(`${API_URL}/venue-registration/upload/${fieldName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      return response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Network error: Unable to connect to server',
        error: error.message
      };
    }
  },

  // Add venue images
  addVenueImages: async (token, formData) => {
    if (!token) {
      return {
        success: false,
        message: 'Authentication token is missing. Please log in again.'
      };
    }

    try {
      const response = await fetch(`${API_URL}/venue-registration/venue-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      return response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Network error: Unable to connect to server',
        error: error.message
      };
    }
  },

  // Remove venue image
  removeVenueImage: async (token, imageId) => {
    if (!token) {
      return {
        success: false,
        message: 'Authentication token is missing. Please log in again.'
      };
    }

    try {
      const response = await fetch(`${API_URL}/venue-registration/venue-images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Network error: Unable to connect to server',
        error: error.message
      };
    }
  },
};

// Admin Venue Registration API calls
export const adminVenueRegistrationAPI = {
  // Get dashboard stats
  getStats: async (token) => {
    const response = await fetch(`${API_URL}/venue-registration/admin/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Get all registrations
  getAllRegistrations: async (token, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/venue-registration/admin/all?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Get single registration
  getRegistration: async (token, id) => {
    const response = await fetch(`${API_URL}/venue-registration/admin/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Review a specific field/document (approve or reject with reason)
  reviewField: async (token, id, fieldName, status, rejectionReason = null) => {
    const response = await fetch(`${API_URL}/venue-registration/admin/${id}/review-document`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentField: fieldName, status, rejectionReason }),
    });
    return response.json();
  },

  // Approve registration
  approveRegistration: async (token, id, adminNotes = null) => {
    const response = await fetch(`${API_URL}/venue-registration/admin/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminNotes }),
    });
    return response.json();
  },

  // Reject registration
  rejectRegistration: async (token, id, adminNotes) => {
    const response = await fetch(`${API_URL}/venue-registration/admin/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminNotes }),
    });
    return response.json();
  },
};

// Notification API calls
export const notificationAPI = {
  // Get notifications
  getNotifications: async (token, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/notifications?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Get unread count
  getUnreadCount: async (token) => {
    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Mark notification as read
  markAsRead: async (token, id) => {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Mark all as read
  markAllAsRead: async (token) => {
    const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Delete notification
  deleteNotification: async (token, id) => {
    const response = await fetch(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Delete all notifications
  deleteAllNotifications: async (token) => {
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
};

// Chat API + socket helpers
export const chatAPI = {
  sendMessage: async (token, payload) => {
    const response = await fetch(`${API_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return response.json();
  },

  getConversation: async (token, venueId, otherUserId) => {
    const qs = new URLSearchParams({ venueId, otherUserId }).toString();
    const response = await fetch(`${API_URL}/chat/messages?${qs}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  getVenueConversations: async (token, venueId) => {
    const qs = new URLSearchParams({ venueId }).toString();
    const response = await fetch(`${API_URL}/chat/venue-conversations?${qs}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
};

// Contact/Support API calls
export const contactAPI = {
  submitInquiry: async (contactData) => {
    const response = await fetch(`${API_URL}/contact/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });
    return response.json();
  },
};

// Menu API calls
export const menuAPI = {
  getVenueMenus: async (venueId) => {
    try {
      const response = await fetch(`${API_URL}/menus/venue/${venueId}`);
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to fetch menus' };
      }
      return response.json();
    } catch (err) {
      console.error('Get venue menus error:', err);
      return { success: false, message: err.message };
    }
  },

  getMenu: async (menuId) => {
    try {
      const response = await fetch(`${API_URL}/menus/${menuId}`);
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to fetch menu' };
      }
      return response.json();
    } catch (err) {
      console.error('Get menu error:', err);
      return { success: false, message: err.message };
    }
  },

  createMenu: async (token, venueId, menuData) => {
    try {
      const response = await fetch(`${API_URL}/menus/venue/${venueId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menuData),
      });
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to create menu' };
      }
      return response.json();
    } catch (err) {
      console.error('Create menu error:', err);
      return { success: false, message: err.message };
    }
  },

  updateMenu: async (token, menuId, menuData) => {
    try {
      const response = await fetch(`${API_URL}/menus/${menuId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menuData),
      });
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to update menu' };
      }
      return response.json();
    } catch (err) {
      console.error('Update menu error:', err);
      return { success: false, message: err.message };
    }
  },

  deleteMenu: async (token, menuId) => {
    try {
      const response = await fetch(`${API_URL}/menus/${menuId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to delete menu' };
      }
      return response.json();
    } catch (err) {
      console.error('Delete menu error:', err);
      return { success: false, message: err.message };
    }
  },

  addMenuItem: async (token, menuId, itemData) => {
    try {
      const response = await fetch(`${API_URL}/menus/${menuId}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to add menu item' };
      }
      return response.json();
    } catch (err) {
      console.error('Add menu item error:', err);
      return { success: false, message: err.message };
    }
  },

  updateMenuItem: async (token, menuId, itemId, itemData) => {
    try {
      const response = await fetch(`${API_URL}/menus/${menuId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to update menu item' };
      }
      return response.json();
    } catch (err) {
      console.error('Update menu item error:', err);
      return { success: false, message: err.message };
    }
  },

  deleteMenuItem: async (token, menuId, itemId) => {
    try {
      const response = await fetch(`${API_URL}/menus/${menuId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to delete menu item' };
      }
      return response.json();
    } catch (err) {
      console.error('Delete menu item error:', err);
      return { success: false, message: err.message };
    }
  },
};

// Package API calls
export const packageAPI = {
  getVenuePackages: async (venueId) => {
    try {
      const response = await fetch(`${API_URL}/packages/venue/${venueId}`);
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to fetch packages' };
      }
      return response.json();
    } catch (err) {
      console.error('Get venue packages error:', err);
      return { success: false, message: err.message };
    }
  },

  getPackage: async (packageId) => {
    try {
      const response = await fetch(`${API_URL}/packages/${packageId}`);
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to fetch package' };
      }
      return response.json();
    } catch (err) {
      console.error('Get package error:', err);
      return { success: false, message: err.message };
    }
  },

  createPackage: async (token, venueId, packageData) => {
    try {
      const response = await fetch(`${API_URL}/packages/venue/${venueId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error response:', error);
        return { success: false, message: error.message || 'Failed to create package' };
      }
      
      return response.json();
    } catch (err) {
      console.error('Create package error:', err);
      return { success: false, message: err.message };
    }
  },

  updatePackage: async (token, packageId, packageData) => {
    try {
      const response = await fetch(`${API_URL}/packages/${packageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to update package' };
      }
      
      return response.json();
    } catch (err) {
      console.error('Update package error:', err);
      return { success: false, message: err.message };
    }
  },

  deletePackage: async (token, packageId) => {
    try {
      const response = await fetch(`${API_URL}/packages/${packageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Failed to delete package' };
      }
      
      return response.json();
    } catch (err) {
      console.error('Delete package error:', err);
      return { success: false, message: err.message };
    }
  },
};

// eSewa Payment API calls
export const esewaAPI = {
  initiatePayment: async (token, bookingId, totalAmount, extraData = {}) => {
    try {
      const response = await fetch(`${API_URL}/esewa/initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId, totalAmount, ...extraData }),
      });
      return response.json();
    } catch (err) {
      console.error('eSewa initiate error:', err);
      return { success: false, message: err.message };
    }
  },

  verifyPayment: async (data) => {
    try {
      const response = await fetch(`${API_URL}/esewa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });
      return response.json();
    } catch (err) {
      console.error('eSewa verify error:', err);
      return { success: false, message: err.message };
    }
  },
};

export const venues = [
  { id: '1', name: 'Grand Hall', image: 'https://via.placeholder.com/640x360?text=Grand+Hall' },
  { id: '2', name: 'Garden Plaza', image: 'https://via.placeholder.com/640x360?text=Garden+Plaza' },
  { id: '3', name: 'Skyline Roof', image: 'https://via.placeholder.com/640x360?text=Skyline+Roof' }
];

export function getVenues() {
  return venues;
}

export function getVenueById(id) {
  return venues.find(v => v.id === id);
}