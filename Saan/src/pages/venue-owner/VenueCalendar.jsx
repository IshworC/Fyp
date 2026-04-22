import React, { useState, useEffect } from "react";
import { venueRegistrationAPI, bookingAPI, menuAPI, packageAPI } from "../../services/api";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPlus, FaTimes, FaHistory, FaCheckCircle, FaUsers, FaTag } from "react-icons/fa";

function VenueCalendar() {
  const token = localStorage.getItem("token");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [venueId, setVenueId] = useState(null);
  const [menus, setMenus] = useState([]);
  const [packages, setPackages] = useState([]);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [selectedDateForBooking, setSelectedDateForBooking] = useState(null);

  // Manual Booking Form State
  const [formData, setFormData] = useState({
    userName: "",
    userEmail: "",
    eventType: "Wedding",
    numberOfGuests: 50,
    totalPrice: 0,
    paymentMethod: "paid",
    selectedPackage: "",
    selectedMenuItems: []
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const regResponse = await venueRegistrationAPI.getMyRegistration(token);
      if (regResponse.success && regResponse.registration) {
        let vId = regResponse.registration.venue?._id || regResponse.registration.venue || regResponse.registration._id;
        setVenueId(vId);
        
        const [bookingsResponse, menusResponse, packagesResponse] = await Promise.all([
          bookingAPI.getVenueBookings(token, vId),
          menuAPI.getVenueMenus(vId),
          packageAPI.getVenuePackages(vId)
        ]);

        if (bookingsResponse.success) setBookings(bookingsResponse.bookings || []);
        if (menusResponse.success) setMenus(menusResponse.menus || []);
        if (packagesResponse.success) setPackages(packagesResponse.packages || []);
      }
    } catch (err) {
      setError("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = (guests, packageId, selectedMenuArray) => {
    let total = 0;
    const pkg = packages.find(p => p._id === packageId);
    if (pkg) total += pkg.basePrice * guests;
    
    selectedMenuArray.forEach(item => {
       total += item.price * item.quantity * guests;
    });
    return total;
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const getDayBookings = (year, month, day) => {
    const checkDate = new Date(year, month, day);
    checkDate.setHours(0, 0, 0, 0);
    
    return bookings.filter(b => {
      const d = new Date(b.eventDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === checkDate.getTime() && ['booked', 'confirmed', 'timely_booking'].includes(b.status);
    });
  };

  const handleManualBooking = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const selectedPkg = packages.find(p => p._id === formData.selectedPackage);
      const payload = {
        ...formData,
        venueId,
        eventDate: selectedDateForBooking,
        selectedPackage: selectedPkg ? {
          packageId: selectedPkg._id,
          packageName: selectedPkg.name,
          packageType: selectedPkg.type,
          basePrice: selectedPkg.basePrice
        } : {},
        paymentStatus: formData.paymentMethod === 'paid' ? 'paid' : 'pending',
        status: formData.paymentMethod === 'paid' ? 'booked' : 'timely_booking'
      };
      
      const response = await bookingAPI.createManualBooking(token, payload);
      if (response.success) {
        setShowManualBooking(false);
        fetchData();
        setFormData({ userName: "", userEmail: "", eventType: "Wedding", numberOfGuests: 50, totalPrice: 0, paymentMethod: "paid", selectedPackage: "", selectedMenuItems: [] });
      } else {
        alert(response.message || "Failed to create booking");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMenuItem = (menu, item) => {
    setFormData(prev => {
      const existing = prev.selectedMenuItems.find(i => i.itemId === item._id);
      let updated;
      if (existing) {
        updated = prev.selectedMenuItems.filter(i => i.itemId !== item._id);
      } else {
        updated = [...prev.selectedMenuItems, {
          menuId: menu._id,
          menuName: menu.name,
          itemId: item._id,
          itemName: item.name,
          price: item.pricePerPlate,
          quantity: 1
        }];
      }
      const newTotal = calculateTotalPrice(prev.numberOfGuests, prev.selectedPackage, updated);
      return { ...prev, selectedMenuItems: updated, totalPrice: newTotal };
    });
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Empty cells for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border-b border-r border-gray-100 bg-gray-50/30"></div>);
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const dayBookings = getDayBookings(year, month, d);
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      days.push(
        <div 
          key={d} 
          className={`h-32 border-b border-r border-gray-100 p-2 transition group hover:bg-gray-50 relative ${isToday ? 'bg-purple-50/30' : ''}`}
          onClick={() => {
            const selDate = new Date(year, month, d);
            if (selDate >= new Date().setHours(0,0,0,0)) {
              setSelectedDateForBooking(selDate);
              setShowManualBooking(true);
            }
          }}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-black ${isToday ? 'bg-purple-800 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-gray-400'}`}>
              {d}
            </span>
            <button className="opacity-0 group-hover:opacity-100 p-1 text-purple-800 hover:scale-110 transition">
              <FaPlus size={12} />
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
            {dayBookings.map(b => (
              <div 
                key={b._id} 
                className={`text-[10px] p-1.5 rounded-lg font-black truncate border-l-4 ${
                  b.isManual
                    ? 'bg-purple-50 text-purple-700 border-purple-500'
                    : b.status === 'timely_booking' 
                      ? 'bg-blue-50 text-blue-700 border-blue-500' 
                      : 'bg-green-50 text-green-700 border-green-500'
                }`}
                title={`${b.user?.name || 'Manual'} - ${b.eventType}`}
              >
                {b.user?.name || 'Manual'} ({b.status === 'timely_booking' ? 'TIMELY' : 'BOOKED'})
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Venue Calendar</h1>
          <p className="text-gray-500 font-medium mt-1">Manage availability and manual bookings</p>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-3 hover:bg-white rounded-xl transition text-gray-600"><FaChevronLeft /></button>
          <span className="font-black text-gray-900 min-w-[150px] text-center uppercase tracking-widest">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-3 hover:bg-white rounded-xl transition text-gray-600"><FaChevronRight /></button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-900 py-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-t border-gray-100">
          {renderDays()}
        </div>
      </div>

      <div className="flex gap-6 justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-fit mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border-l-4 border-purple-500 rounded"></div>
          <span className="text-xs font-black text-gray-400 uppercase tracking-tight">Manual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-500 rounded"></div>
          <span className="text-xs font-black text-gray-400 uppercase tracking-tight">Timely Hold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-l-4 border-green-500 rounded"></div>
          <span className="text-xs font-black text-gray-400 uppercase tracking-tight">Booked</span>
        </div>
      </div>

      {/* Manual Booking Modal */}
      {showManualBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Manual Booking</h2>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-tighter">Date: {selectedDateForBooking?.toLocaleDateString()}</p>
              </div>
              <button onClick={() => setShowManualBooking(false)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-red-500 transition"><FaTimes /></button>
            </div>

            <form onSubmit={handleManualBooking} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Customer Info</label>
                <input required type="text" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-purple-800 outline-none font-bold transition text-sm" placeholder="Full Name" />
                <input type="email" value={formData.userEmail} onChange={e => setFormData({...formData, userEmail: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-purple-800 outline-none font-bold transition text-sm mt-2" placeholder="Email Address (Optional)" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Event Type</label>
                  <select value={formData.eventType} onChange={e => setFormData({...formData, eventType: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-purple-800 outline-none font-bold transition text-sm">
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Guests</label>
                  <input type="number" value={formData.numberOfGuests} onChange={e => {
                    const guests = parseInt(e.target.value) || 0;
                    const newTotal = calculateTotalPrice(guests, formData.selectedPackage, formData.selectedMenuItems);
                    setFormData({...formData, numberOfGuests: guests, totalPrice: newTotal});
                  }} className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-purple-800 outline-none font-bold transition text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Package</label>
                <select value={formData.selectedPackage} onChange={e => {
                  const pkgId = e.target.value;
                  const newTotal = calculateTotalPrice(formData.numberOfGuests, pkgId, formData.selectedMenuItems);
                  setFormData({...formData, selectedPackage: pkgId, totalPrice: newTotal});
                }} className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-purple-800 outline-none font-bold transition text-sm">
                  <option value="">No Package</option>
                  {packages.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.basePrice}/pax)</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Menu Items</label>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-2xl">
                  {menus.map(m => m.items.map(item => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => toggleMenuItem(m, item)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition ${formData.selectedMenuItems.find(i => i.itemId === item._id) ? 'bg-purple-800 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}
                    >
                      {item.name}
                    </button>
                  )))}
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Booking Option</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'paid'})} className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition ${formData.paymentMethod === 'paid' ? 'bg-amber-600 text-white' : 'bg-white text-amber-600'}`}>PAID</button>
                  <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'pay_later'})} className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition ${formData.paymentMethod === 'pay_later' ? 'bg-amber-600 text-white' : 'bg-white text-amber-600'}`}>5H HOLD</button>
                </div>
              </div>

              <div className="p-6 bg-gray-900 rounded-3xl text-white">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Total</p>
                <p className="text-3xl font-black">₹{formData.totalPrice}</p>
                <p className="text-[10px] text-gray-500 font-bold mt-1">Manual override allowed below</p>
                <input type="number" value={formData.totalPrice} onChange={e => setFormData({...formData, totalPrice: parseInt(e.target.value) || 0})} className="w-full mt-3 p-3 bg-white/10 border border-white/10 rounded-xl outline-none font-bold text-sm" placeholder="₹ Custom Total" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-purple-800 text-white rounded-3xl font-black text-lg hover:bg-purple-900 transition transform hover:-translate-y-1 shadow-2xl shadow-purple-200">
                {loading ? 'CREATING...' : 'CREATE BOOKING'}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

export default VenueCalendar;
