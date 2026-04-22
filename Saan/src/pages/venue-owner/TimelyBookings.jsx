import React, { useState, useEffect } from "react";
import { venueRegistrationAPI, bookingAPI } from "../../services/api";
import { FaHistory, FaCalendar, FaUsers, FaClock, FaExclamationTriangle } from "react-icons/fa";
import ChatBox from "../../components/ChatBox";

function TimelyBookings() {
  const token = localStorage.getItem("token");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [venueId, setVenueId] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [now, setNow] = useState(new Date());

  // Update current time every second for the countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      if (!token) { setError("Please login"); setLoading(false); return; }

      const regResponse = await venueRegistrationAPI.getMyRegistration(token);
      if (regResponse.success && regResponse.registration) {
        let vId = regResponse.registration.venue?._id || regResponse.registration.venue || regResponse.registration._id;
        setVenueId(vId);
        const bookingsResponse = await bookingAPI.getVenueBookings(token, vId);
        if (bookingsResponse.success) {
          // Filter for timely_booking
          const fetchedBookings = (bookingsResponse.bookings || []).filter(b => b.status === 'timely_booking');
          setBookings(fetchedBookings);
        } else {
          setError(bookingsResponse.message || "Failed to load bookings");
        }
      } else {
        setError("Please complete venue registration first");
      }
    } catch (err) {
      setError("Error loading bookings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Timely Bookings</h1>
          <p className="text-gray-500 font-medium mt-1">Temporary holds pending payment (5-hour window)</p>
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
          <FaClock className="text-2xl" />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-bold">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div></div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaHistory className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No active holds</h2>
          <p className="text-gray-500">There are currently no temporary bookings waiting for payment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map(booking => (
            <div key={booking._id} className="group bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
              
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">
                      {booking.user?.name?.charAt(0) || "G"}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900">{booking.user?.name || "Guest"}</h3>
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{booking.eventType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-purple-800"><FaCalendar /></div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase">Event Date</p>
                        <p className="font-bold text-gray-800">{new Date(booking.eventDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-purple-800"><FaUsers /></div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase">Guests</p>
                        <p className="font-bold text-gray-800">{booking.numberOfGuests} pax</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:w-64 space-y-4">
                  <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl text-center">
                    <p className="text-[10px] text-blue-400 font-black uppercase mb-1">Payment Window Ends In</p>
                    <p className="text-2xl font-black text-blue-700 tabular-nums">{getRemainingTime(booking.expiresAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChatUser({ id: booking.user._id, name: booking.user.name })}
                      className="flex-1 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition"
                    >
                      CHAT
                    </button>
                  </div>
                </div>
              </div>

              {booking.specialRequests && (
                <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3">
                   <FaExclamationTriangle className="text-amber-500 mt-1" />
                   <p className="text-sm text-gray-600 font-medium italic">"{booking.specialRequests}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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

export default TimelyBookings;
