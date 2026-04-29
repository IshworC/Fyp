import React, { useState, useEffect } from "react";
import { venueRegistrationAPI, bookingAPI } from "../../services/api";
import { FaCheckCircle, FaCalendar, FaUsers, FaMoneyBillWave, FaEnvelope } from "react-icons/fa";
import ChatBox from "../../components/ChatBox";

function BookedBookings() {
  const token = localStorage.getItem("token");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [venueId, setVenueId] = useState(null);
  const [chatUser, setChatUser] = useState(null);

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
          // Filter for booked status
          const fetchedBookings = (bookingsResponse.bookings || []).filter(b => b.status === 'booked' || b.status === 'confirmed');
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Confirmed Bookings</h1>
          <p className="text-gray-500 font-medium mt-1">Bookings with verified payments</p>
        </div>
        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
          <FaCheckCircle className="text-2xl" />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-bold">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600"></div></div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No confirmed bookings</h2>
          <p className="text-gray-500">You haven't received any paid bookings yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map(booking => (
            <div key={booking._id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
              
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 font-black text-xl">
                      {booking.user?.name?.charAt(0) || "G"}
                    </div>
                    <div>
                      <div className="flex justify-between items-start w-full">
                        <h3 className="text-xl font-black text-gray-900">{booking.user?.name || "Guest"}</h3>
                        <span className="text-xs font-black text-gray-400 uppercase">#{booking._id.slice(-6)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                        <FaEnvelope className="text-[10px]" /> {booking.user?.email}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-green-600"><FaMoneyBillWave /></div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase">Payment</p>
                        <p className="font-bold text-gray-800">₹{booking.paidAmount || booking.totalPrice}</p>
                        <p className={`text-[9px] font-black uppercase ${booking.paymentStatus === 'paid' ? 'text-green-500' : 'text-amber-500'}`}>
                          {booking.paymentStatus === 'paid' ? 'FULL' : 'PARTIAL'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:w-48 flex flex-col justify-center">
                   <button
                      onClick={() => setChatUser({ id: booking.user._id, name: booking.user.name })}
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-200"
                    >
                      SEND MESSAGE
                    </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-full border border-gray-100 uppercase tracking-tighter">Event: {booking.eventType}</span>
                {booking.selectedPackage?.packageName && (
                  <span className="px-4 py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100 uppercase tracking-tighter">Pkg: {booking.selectedPackage.packageName}</span>
                )}
              </div>
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

export default BookedBookings;
