import React, { useState, useEffect } from "react";
import { reportAPI, getImageUrl, bookingAPI } from "../../services/api";
import { FaCalendarAlt, FaHistory, FaClock, FaCheckCircle, FaMapMarkerAlt, FaUsers, FaArrowRight } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./AdminBookings.css";

function AdminBookings() {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venueBookings, setVenueBookings] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getVenuePerformance(token);
      if (response.success) {
        setPerformance(response.performance || []);
      } else {
        setError(response.message || "Failed to fetch performance stats");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVenueClick = async (venue) => {
    try {
      setSelectedVenue(venue);
      const response = await bookingAPI.getVenueBookings(token, venue._id);
      if (response.success) {
        setVenueBookings(response.bookings || []);
      }
    } catch (err) {
      console.error("Error fetching venue bookings:", err);
    }
  };

  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      const hasBooking = venueBookings.some(b => {
        const bDate = new Date(b.eventDate).toISOString().split('T')[0];
        return bDate === dateString && (b.status === 'booked' || b.status === 'confirmed');
      });
      return hasBooking ? 'booked-date' : null;
    }
    return null;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-night-blue/20 border-t-night-blue rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-black text-night-blue-shadow">Booking Analytics</h1>
        <p className="text-gray-500 font-medium mt-1">Track event volume and hosting history across all venues.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Venue Performance List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-black text-night-blue-shadow uppercase tracking-widest text-xs">Venue Activity Monitor</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {performance.map((item) => (
                <div 
                  key={item._id} 
                  onClick={() => handleVenueClick(item)}
                  className={`p-8 hover:bg-gray-50/50 transition cursor-pointer flex items-center gap-6 group ${selectedVenue?._id === item._id ? 'bg-night-blue/5' : ''}`}
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border-2 border-gray-100 shadow-sm group-hover:border-night-blue transition duration-500">
                    <FaCalendarAlt className="text-2xl text-night-blue" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-night-blue-shadow group-hover:text-night-blue transition">{item.name}</h4>
                    <div className="flex items-center gap-3 text-gray-400 text-xs font-bold mt-1">
                      <FaMapMarkerAlt className="text-sand-tan" />
                      {item.city}
                    </div>
                  </div>
                  <div className="flex gap-8 text-center">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upcoming</p>
                      <p className="text-xl font-black text-emerald-500">{item.upcomingEvents}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completed</p>
                      <p className="text-xl font-black text-night-blue">{item.completedEvents}</p>
                    </div>
                  </div>
                  <FaArrowRight className={`text-night-blue/30 group-hover:translate-x-2 transition-transform duration-500 ${selectedVenue?._id === item._id ? 'text-night-blue translate-x-2' : ''}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar & Details */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
            <h3 className="font-black text-night-blue-shadow uppercase tracking-widest text-xs mb-6">Booking Calendar</h3>
            {selectedVenue ? (
              <div className="admin-calendar-wrapper">
                <Calendar 
                  onChange={setCalendarDate} 
                  value={calendarDate}
                  tileClassName={getTileClassName}
                  className="w-full border-none"
                />
                <div className="mt-6 flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl">
                  <div className="w-4 h-4 bg-night-blue rounded-full shadow-lg shadow-night-blue/40"></div>
                  <span className="text-xs font-black text-night-blue-shadow uppercase tracking-widest">Booked Dates</span>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto">
                  <FaCalendarAlt className="text-2xl" />
                </div>
                <p className="text-sm font-bold text-gray-400 max-w-[200px] mx-auto">Select a venue to view its booking calendar</p>
              </div>
            )}
          </div>

          {selectedVenue && (
            <div className="bg-night-blue rounded-[2.5rem] shadow-xl p-8 text-white">
              <h3 className="font-black uppercase tracking-widest text-xs mb-6 opacity-60">Venue Performance</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <p className="text-sm font-bold opacity-70">Total Revenue</p>
                  <p className="text-3xl font-black">Rs. {selectedVenue.revenue.toLocaleString()}</p>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sand-tan rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min((selectedVenue.completedEvents / 10) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Event efficiency: {Math.round(Math.min((selectedVenue.completedEvents / 10) * 100, 100))}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminBookings;
