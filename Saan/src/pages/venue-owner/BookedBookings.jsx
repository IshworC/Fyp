import React, { useState, useEffect } from "react";
import { venueRegistrationAPI, bookingAPI, menuAPI } from "../../services/api";
import { FaCheckCircle, FaCalendar, FaUsers, FaMoneyBillWave, FaEnvelope, FaTimes } from "react-icons/fa";
import ChatBox from "../../components/ChatBox";

function BookedBookings() {
  const token = localStorage.getItem("token");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [venueId, setVenueId] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [menus, setMenus] = useState([]);

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

        try {
          const menusResponse = await menuAPI.getVenueMenus(vId);
          if (menusResponse.success) setMenus(menusResponse.menus || []);
        } catch (e) {
          console.error("Error fetching menus", e);
        }

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

                <div className="md:w-48 flex flex-col justify-center gap-3">
                   <button
                      onClick={() => setSelectedBookingDetails(booking)}
                      className="w-full py-4 bg-purple-800 text-white rounded-2xl font-bold hover:bg-purple-900 transition shadow-lg shadow-purple-200"
                    >
                      VIEW DETAILS
                    </button>
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

      {/* Booking Details Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Booking Details</h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Ref #{selectedBookingDetails._id.slice(-6)}</p>
              </div>
              <button onClick={() => setSelectedBookingDetails(null)} className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition"><FaTimes /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              {/* Event Info */}
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Event Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Date</p>
                    <p className="font-black text-gray-900">{new Date(selectedBookingDetails.eventDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Type</p>
                    <p className="font-black text-gray-900">{selectedBookingDetails.eventType}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Guests</p>
                    <p className="font-black text-gray-900">{selectedBookingDetails.numberOfGuests} pax</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Customer</p>
                    <p className="font-black text-gray-900 truncate" title={selectedBookingDetails.user?.name}>{selectedBookingDetails.user?.name}</p>
                  </div>
                </div>
                {selectedBookingDetails.specialRequests && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                    <p className="text-[10px] text-amber-600 font-black uppercase mb-1">Special Requests</p>
                    <p className="text-amber-900 font-medium text-sm">{selectedBookingDetails.specialRequests}</p>
                  </div>
                )}
              </div>

              {/* Package & Menus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Menus */}
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Selected Menu Items</h3>
                  {selectedBookingDetails.selectedMenuItems?.length > 0 ? (
                    <div className="space-y-4">
                      {['main', 'appetizer', 'starter', 'dessert', 'beverage', 'other', 'uncategorized'].map(catKey => {
                        let items = [];

                        const enrichedItems = selectedBookingDetails.selectedMenuItems.map(i => {
                          if (i.category) return i;
                          const menu = menus.find(m => m._id === i.menuId);
                          if (menu) {
                            const menuItem = menu.items?.find(mi => mi._id === i.itemId);
                            if (menuItem?.category) return { ...i, category: menuItem.category };
                          }
                          return i;
                        });

                        if (catKey === 'uncategorized') {
                          items = enrichedItems.filter(i => !i.category);
                        } else {
                          items = enrichedItems.filter(i => i.category === catKey);
                        }

                        if (items.length === 0) return null;

                        const catName = catKey === 'main' ? 'Main Course' : 
                                        (catKey === 'appetizer' || catKey === 'starter') ? 'Starter' : 
                                        catKey === 'dessert' ? 'Dessert' : 
                                        catKey === 'beverage' ? 'Beverages' : 
                                        catKey === 'uncategorized' ? 'Other Items' : 'Other';

                        return (
                          <div key={catKey} className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{catName}</h4>
                            <div className="space-y-2">
                              {items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-transparent">
                                  <div>
                                    <p className="font-bold text-gray-900 text-sm">{item.itemName}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">{item.menuName}</p>
                                  </div>
                                  <span className="text-xs font-black text-purple-800 bg-purple-50 px-2 py-1 rounded-md">₹{item.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center text-gray-400 font-bold text-sm">No specific menu items selected</div>
                  )}
                </div>

                {/* Package & Add-ons */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Selected Package</h3>
                    {selectedBookingDetails.selectedPackage?.packageName ? (
                      <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100">
                        <p className="font-black text-purple-900 text-lg mb-1">{selectedBookingDetails.selectedPackage.packageName}</p>
                        <p className="text-xs text-purple-700 font-bold uppercase tracking-widest">{selectedBookingDetails.selectedPackage.packageType}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center text-gray-400 font-bold text-sm">No package selected</div>
                    )}
                  </div>

                  {/* Add-ons */}
                  {selectedBookingDetails.selectedAddOns && Object.values(selectedBookingDetails.selectedAddOns).some(addon => addon.enabled) && (
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Add-ons</h3>
                      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-2">
                        {selectedBookingDetails.selectedAddOns.decoration?.enabled && <div className="flex justify-between text-sm font-bold"><span className="text-gray-700">Decoration</span><span className="text-gray-900">₹{selectedBookingDetails.selectedAddOns.decoration.price}</span></div>}
                        {selectedBookingDetails.selectedAddOns.soundSystem?.enabled && <div className="flex justify-between text-sm font-bold"><span className="text-gray-700">Sound System</span><span className="text-gray-900">₹{selectedBookingDetails.selectedAddOns.soundSystem.price}</span></div>}
                        {selectedBookingDetails.selectedAddOns.bartender?.enabled && <div className="flex justify-between text-sm font-bold"><span className="text-gray-700">Bartender</span><span className="text-gray-900">₹{selectedBookingDetails.selectedAddOns.bartender.price}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financials Sticky Footer */}
            <div className="p-8 border-t border-gray-100 bg-white">
               <div className="grid grid-cols-3 gap-4">
                 <div className="bg-gray-50 p-4 rounded-2xl">
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Bill</p>
                   <p className="text-xl font-black text-gray-900">₹{selectedBookingDetails.totalPrice}</p>
                 </div>
                 <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                   <p className="text-[10px] text-green-600 font-black uppercase tracking-widest">Amount Paid</p>
                   <p className="text-xl font-black text-green-700">₹{selectedBookingDetails.paidAmount || 0}</p>
                 </div>
                 <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                   <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">Remaining Balance</p>
                   <p className="text-xl font-black text-amber-700">₹{Math.max(0, selectedBookingDetails.totalPrice - (selectedBookingDetails.paidAmount || 0))}</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookedBookings;
