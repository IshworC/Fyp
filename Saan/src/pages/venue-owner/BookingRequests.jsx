import React, { useState, useEffect } from "react";
import { venueRegistrationAPI, bookingAPI } from "../../services/api";
import { FaCheckCircle, FaTimesCircle, FaClock, FaPhone, FaEnvelope, FaCalendar, FaUsers } from "react-icons/fa";
import ChatBox from "../../components/ChatBox";

function BookingRequests() {
  const token = localStorage.getItem("token");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [venueId, setVenueId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [chatUser, setChatUser] = useState(null);

  // Fetch venue bookings with PENDING status only
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          setError("Please login to view bookings");
          setLoading(false);
          return;
        }

        // First get the registration to get venueId
        const regResponse = await venueRegistrationAPI.getMyRegistration(token);

        if (regResponse.success && regResponse.registration && regResponse.exists) {
          // Extract venueId
          let vId = null;
          if (regResponse.registration.venue) {
            vId = typeof regResponse.registration.venue === 'object' 
              ? regResponse.registration.venue._id 
              : regResponse.registration.venue;
          }
          if (!vId) vId = regResponse.registration._id;
          if (!vId) vId = regResponse.registration.venueId;
          
          // Check registration status
          const regStatus = regResponse.registration.registrationStatus;
          if (regStatus !== "APPROVED") {
            setError(`Your venue registration is ${regStatus}. Bookings are not available yet.`);
            setLoading(false);
            return;
          }
          
          if (!vId) {
            setError("Your venue is not yet registered or approved.");
            setLoading(false);
            return;
          }

          setVenueId(vId);

          // Fetch bookings for this venue
          const bookingsResponse = await bookingAPI.getVenueBookings(token, vId);

          if (bookingsResponse.success) {
            const fetchedBookings = (bookingsResponse.bookings || []).filter(b => b.status === 'pending');
            setBookings(fetchedBookings);
          } else {
            setError(bookingsResponse.message || "Failed to load bookings");
          }
        } else {
          setError(regResponse.message || "Please complete your venue registration first");
        }
      } catch (err) {
        setError("Error loading bookings: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchBookings();
    }
  }, [token]);

  // Handle status update
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setUpdateLoading(true);
      const response = await bookingAPI.updateBookingStatus(token, bookingId, newStatus);
      
      if (response.success) {
        // Remove from pending list
        setBookings(bookings.filter(b => b._id !== bookingId));
        setSelectedBooking(null);
        setError("");
      } else {
        setError(response.message || "Failed to update booking status");
      }
    } catch (err) {
      setError("Error updating booking: " + err.message);
    } finally {
      setUpdateLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pending Booking Requests</h1>
        <p className="text-gray-500 mt-1">Review and manage incoming booking requests</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5d0f0f]"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaClock className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Pending Requests</h2>
            <p className="text-gray-500">You don't have any pending booking requests at the moment.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking._id} className="bg-yellow-50 border-l-4 border-yellow-200 rounded-lg p-6 shadow-sm">
              {/* Header with Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FaClock className="text-yellow-600 text-xl" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{booking.user?.name || "Guest"}</h3>
                    <p className="text-sm text-yellow-700 font-medium uppercase">Pending</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <FaCalendar className="text-[#5d0f0f]" />
                  <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaUsers className="text-[#5d0f0f]" />
                  <span>{booking.numberOfGuests} Guests</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaPhone className="text-[#5d0f0f]" />
                  <span>{booking.user?.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-semibold">Event Type:</span>
                  <span className="capitalize">{booking.eventType}</span>
                </div>
              </div>

              {/* Package & Menu Info */}
              {booking.selectedPackage && (
                <div className="bg-white/50 rounded p-3 mb-4 text-sm text-gray-700">
                  <p className="font-semibold mb-1">📦 Package: {booking.selectedPackage?.packageName}</p>
                  <p>Price: ₹{booking.totalPrice}</p>
                </div>
              )}

              {/* Special Requests */}
              {booking.specialRequests && (
                <div className="bg-white/50 rounded p-3 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Special Requests:</p>
                  <p className="text-sm text-gray-600">{booking.specialRequests}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-current/20">
                <button
                  onClick={() => handleStatusUpdate(booking._id, "confirmed")}
                  disabled={updateLoading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <FaCheckCircle /> Confirm
                </button>
                <button
                  onClick={() => handleStatusUpdate(booking._id, "cancelled")}
                  disabled={updateLoading}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <FaTimesCircle /> Decline
                </button>
                <button
                  onClick={() => setChatUser({ id: booking.user._id, name: booking.user.name })}
                  className="bg-[#5d0f0f] text-white px-4 py-2 rounded-lg hover:bg-[#4a0c0c] font-medium"
                >
                  💬 Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Box */}
      {chatUser && venueId && (
        <ChatBox
          venueId={venueId}
          otherUserId={chatUser.id}
          title={`Chat with ${chatUser.name}`}
        />
      )}
    </div>
  );
}

export default BookingRequests;
