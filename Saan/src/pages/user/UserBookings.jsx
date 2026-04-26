import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI, esewaAPI, getImageUrl } from '../../services/api';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCreditCard, FaInfoCircle } from 'react-icons/fa';

function UserBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(null); // stores bookingId being processed
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [token]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getMyBookings(token);
      if (response.success) {
        setBookings(response.bookings || []);
      } else {
        setError(response.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (bookingId, amount, paymentType) => {
    try {
      setPaymentLoading(bookingId);
      const response = await esewaAPI.initiatePayment(token, bookingId, amount, { paymentType });
      
      if (response.success) {
        const { paymentData, paymentUrl } = response;
        
        // Create form and submit to eSewa
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentUrl;
        
        Object.entries(paymentData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else {
        alert(response.message || 'Failed to initiate payment');
      }
    } catch (err) {
      alert('Payment error: ' + (err.message || 'Something went wrong'));
    } finally {
      setPaymentLoading(null);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
      case 'booked':
        return { 
          icon: <FaCheckCircle className="text-green-500" />, 
          bg: 'bg-green-50', 
          text: 'text-green-700', 
          label: 'Confirmed' 
        };
      case 'pending':
        return { 
          icon: <FaClock className="text-amber-500" />, 
          bg: 'bg-amber-50', 
          text: 'text-amber-700', 
          label: 'Awaiting Confirmation' 
        };
      case 'timely_booking':
        return { 
          icon: <FaClock className="text-blue-500" />, 
          bg: 'bg-blue-50', 
          text: 'text-blue-700', 
          label: 'On Hold (5H)' 
        };
      case 'cancelled':
        return { 
          icon: <FaTimesCircle className="text-red-500" />, 
          bg: 'bg-red-50', 
          text: 'text-red-700', 
          label: 'Cancelled' 
        };
      case 'expired':
        return { 
          icon: <FaExclamationTriangle className="text-gray-500" />, 
          bg: 'bg-gray-50', 
          text: 'text-gray-700', 
          label: 'Expired' 
        };
      default:
        return { 
          icon: <FaInfoCircle className="text-gray-500" />, 
          bg: 'bg-gray-50', 
          text: 'text-gray-700', 
          label: status 
        };
    }
  };

  const TimeRemaining = ({ expiresAt }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry - now;

        if (diff <= 0) {
          setTimeLeft('Expired');
          clearInterval(timer);
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(timer);
    }, [expiresAt]);

    return (
      <span className="font-bold text-night-blue">
        {timeLeft}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-night-blue/20 border-t-night-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-night-blue-shadow mb-2">My Bookings</h1>
            <p className="text-gray-500 font-medium">Manage your venue reservations and payments.</p>
          </div>
          <button 
            onClick={() => navigate('/browse-venue')}
            className="px-6 py-3 bg-night-blue text-white rounded-2xl font-bold hover:bg-night-blue-shadow transition transform hover:-translate-y-1 shadow-lg shadow-night-blue/20"
          >
            Find New Venue
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl font-bold">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-xl border border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCalendarAlt className="text-gray-300 text-4xl" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">No bookings yet</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">Ready to host your next big event? Browse our curated list of premium venues.</p>
            <button 
              onClick={() => navigate('/browse-venue')}
              className="px-8 py-4 bg-night-blue text-white rounded-2xl font-black uppercase tracking-widest hover:bg-night-blue-shadow transition"
            >
              Start Browsing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {bookings.map((booking) => {
              const statusInfo = getStatusInfo(booking.status);
              const isHold = booking.status === 'timely_booking';
              
              return (
                <div key={booking._id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 hover:shadow-2xl transition duration-500 group">
                  <div className="flex flex-col sm:flex-row h-full">
                    {/* Image Section */}
                    <div className="sm:w-2/5 h-48 sm:h-auto relative overflow-hidden">
                      {booking.venue?.images?.[0] ? (
                        <img 
                          src={getImageUrl(booking.venue.images[0])} 
                          alt={booking.venue.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" 
                        />
                      ) : (
                        <div className="w-full h-full bg-night-blue flex items-center justify-center text-white/20 text-4xl font-black">SAAN</div>
                      )}
                      <div className={`absolute top-4 left-4 px-3 py-1.5 ${statusInfo.bg} ${statusInfo.text} rounded-full text-[10px] font-black uppercase tracking-widest border border-current flex items-center gap-2`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="sm:w-3/5 p-6 sm:p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-black text-night-blue-shadow group-hover:text-night-blue transition">{booking.venue?.name || 'Unknown Venue'}</h3>
                          <p className="text-xs font-black text-gray-400 uppercase">#{booking._id.slice(-6)}</p>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                            <FaCalendarAlt className="text-night-blue" />
                            <span>{new Date(booking.eventDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                            <FaMapMarkerAlt className="text-night-blue" />
                            <span>{booking.venue?.city || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                            <FaUsers className="text-night-blue" />
                            <span>{booking.numberOfGuests} Guests • {booking.eventType}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-50">
                        <div className="flex justify-between items-end mb-4">
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Price</p>
                            <p className="text-2xl font-black text-night-blue-shadow">₹{booking.totalPrice}</p>
                          </div>
                          {booking.paidAmount > 0 && (
                            <div className="text-right">
                              <p className="text-[10px] text-green-600 font-black uppercase tracking-widest">Paid</p>
                              <p className="text-lg font-black text-green-600">₹{booking.paidAmount}</p>
                            </div>
                          )}
                        </div>

                        {isHold && (
                          <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="flex items-center justify-between text-xs mb-3">
                              <span className="text-blue-600 font-black uppercase tracking-widest">Hold Expires In:</span>
                              <TimeRemaining expiresAt={booking.expiresAt} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => handlePayment(booking._id, Math.ceil(booking.totalPrice * 0.5), 'advance')}
                                disabled={paymentLoading === booking._id}
                                className="py-3 bg-white border-2 border-night-blue text-night-blue rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-night-blue hover:text-white transition disabled:opacity-50"
                              >
                                {paymentLoading === booking._id ? '...' : 'Pay Half (50%)'}
                              </button>
                              <button 
                                onClick={() => handlePayment(booking._id, booking.totalPrice, 'full')}
                                disabled={paymentLoading === booking._id}
                                className="py-3 bg-night-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-night-blue-shadow transition shadow-lg shadow-night-blue/20 disabled:opacity-50"
                              >
                                {paymentLoading === booking._id ? '...' : 'Pay Full'}
                              </button>
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={() => navigate(`/venue/${booking.venue?._id || booking.venue}`)}
                          className="w-full py-3 bg-gray-50 text-gray-900 rounded-xl font-bold text-xs hover:bg-gray-100 transition flex items-center justify-center gap-2"
                        >
                          View Venue Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserBookings;
