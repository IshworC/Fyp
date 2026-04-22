import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { venueAPI, menuAPI, packageAPI, bookingAPI, esewaAPI, BASE_URL, getImageUrl } from '../../services/api';


import ChatBox from '../../components/ChatBox';
import { FaArrowLeft, FaPhone, FaEnvelope, FaMapMarkerAlt, FaShoppingCart, FaPlus, FaMinus, FaChevronLeft, FaChevronRight, FaTimes, FaStar, FaStarHalfAlt, FaUsers, FaCheckCircle } from 'react-icons/fa';

function UserVenueDetail() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const decoded = JSON.parse(atob(parts[1]));
      return decoded.id || decoded._id || null;
    } catch (e) {
      return null;
    }
  };

  const [venue, setVenue] = useState(null);
  const [menus, setMenus] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoOpenChat, setAutoOpenChat] = useState(false);

  const [selectedTab, setSelectedTab] = useState('overview');
  const [numberOfGuests, setNumberOfGuests] = useState(50);
  const [selectedItems, setSelectedItems] = useState({});
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [bookingData, setBookingData] = useState({
    eventDate: '',
    eventType: '',
    selectedPackage: null,
    specialRequirements: ''
  });
  const [paymentType, setPaymentType] = useState('full');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');

  // Rating state
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [hasUserRated, setHasUserRated] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchData();
    if (token) {
      try {
        const parts = token.split('.');
        const decoded = JSON.parse(atob(parts[1]));
        setCustomerName(decoded.name || '');
        setCustomerEmail(decoded.email || '');
      } catch (e) {}
    }
  }, [venueId]);

  const fetchBookedDates = async () => {
    const response = await bookingAPI.getPublicBookedDates(venueId);
    if (response.success) {
      setBookedDates(response.bookedDates || []);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [venueResponse, menusResponse, packagesResponse] = await Promise.all([
        venueAPI.getSingleVenue(venueId),
        menuAPI.getVenueMenus(venueId),
        packageAPI.getVenuePackages(venueId)
      ]);

      await fetchBookedDates();

      if (venueResponse.success) {
        setVenue(venueResponse.venue);
        const currentUserId = getUserIdFromToken();
        if (currentUserId && venueResponse.venue?.reviews) {
          const existingReview = venueResponse.venue.reviews.find(r => (r.user?._id || r.user) === currentUserId);
          if (existingReview) {
            setHasUserRated(true);
            setUserRating(existingReview.rating);
            setUserReview(existingReview.comment || '');
          }
        }
      }
      if (menusResponse.success) setMenus(menusResponse.menus || []);
      if (packagesResponse.success) setPackages(packagesResponse.packages || []);
    } catch (err) {
      setError('Failed to load venue details');
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to rate this venue');
      setShowErrorPopup(true);
      return;
    }
    if (userRating === 0) {
      setError('Please select a rating');
      setShowErrorPopup(true);
      return;
    }
    
    setReviewLoading(true);
    try {
      const response = await venueAPI.submitVenueReview(token, venueId, {
        rating: userRating,
        comment: userReview
      });
      
      if (response.success) {
        setHasUserRated(true);
        // Refresh venue data
        const updatedVenue = await venueAPI.getSingleVenue(venueId);
        if (updatedVenue.success) setVenue(updatedVenue.venue);
      } else {
        setError(response.message || 'Failed to submit review');
        setShowErrorPopup(true);
      }
    } catch (err) {
      setError('Error submitting review');
      setShowErrorPopup(true);
    } finally {
      setReviewLoading(false);
    }
  };
  const calculateMenuTotal = () => {
    let total = 0;
    Object.keys(selectedItems).forEach(key => {
      const [menuId, itemId] = key.split('-');
      const menu = menus.find(m => m._id === menuId);
      if (menu) {
        const item = menu.items?.find(i => i._id === itemId);
        if (item) total += item.pricePerPlate * selectedItems[key] * numberOfGuests;
      }
    });
    return total;
  };

  const menuTotal = calculateMenuTotal();
  const selectedPackageData = packages.find(p => p._id === bookingData.selectedPackage);
  const packagePrice = selectedPackageData ? selectedPackageData.basePrice * numberOfGuests : 0;
  
  let addOnsTotal = 0;
  if (selectedPackageData?.addOns) {
    if (selectedPackageData.addOns.decoration?.enabled) addOnsTotal += selectedPackageData.addOns.decoration.price;
    if (selectedPackageData.addOns.soundSystem?.enabled) addOnsTotal += selectedPackageData.addOns.soundSystem.price;
    if (selectedPackageData.addOns.bartender?.enabled) addOnsTotal += selectedPackageData.addOns.bartender.price;
  }

  const totalPrice = menuTotal + packagePrice + addOnsTotal;

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-16 h-16 border-4 border-purple-100 border-t-purple-800 rounded-full animate-spin"></div></div>;
  if (!venue) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-10 text-center"><div><h2 className="text-2xl font-black text-gray-900 mb-4">Venue not found</h2><button onClick={() => navigate('/browse')} className="px-8 py-3 bg-purple-800 text-white rounded-2xl font-bold">Back to Browse</button></div></div>;

  const getBookingPayload = (totalPrice, paymentMethod = 'esewa') => {
    const selectedMenuItemsArray = [];
    Object.keys(selectedItems).forEach(key => {
      const [menuId, itemId] = key.split('-');
      const menu = menus.find(m => m._id === menuId);
      if (menu) {
        const item = menu.items.find(i => i._id === itemId);
        if (item) {
          selectedMenuItemsArray.push({
            menuId: menu._id,
            menuName: menu.name,
            itemId: item._id,
            itemName: item.name,
            price: item.pricePerPlate,
            quantity: selectedItems[key]
          });
        }
      }
    });

    const selectedPackageData = bookingData.selectedPackage
      ? packages.find(p => p._id === bookingData.selectedPackage)
      : null;

    let selectedAddOnsData = { decoration: { enabled: false, price: 0 }, soundSystem: { enabled: false, price: 0 }, bartender: { enabled: false, price: 0 } };
    if (selectedPackageData?.addOns) {
      if (selectedPackageData.addOns.decoration?.enabled) selectedAddOnsData.decoration = selectedPackageData.addOns.decoration;
      if (selectedPackageData.addOns.soundSystem?.enabled) selectedAddOnsData.soundSystem = selectedPackageData.addOns.soundSystem;
      if (selectedPackageData.addOns.bartender?.enabled) selectedAddOnsData.bartender = selectedPackageData.addOns.bartender;
    }

    return {
      venueId: venue._id,
      eventDate: new Date(bookingData.eventDate),
      eventType: bookingData.eventType,
      numberOfGuests: numberOfGuests,
      selectedMenuItems: selectedMenuItemsArray,
      selectedPackage: selectedPackageData ? {
        packageId: selectedPackageData._id,
        packageName: selectedPackageData.name,
        packageType: selectedPackageData.type,
        basePrice: selectedPackageData.basePrice
      } : {},
      selectedAddOns: selectedAddOnsData,
      specialRequests: bookingData.specialRequirements,
      totalPrice: totalPrice,
      paymentMethod: paymentMethod,
      customerEmail,
      customerName
    };
  };

  const handleBooking = async () => {
    if (!token) { setError('Please login to book'); return; }
    if (!bookingData.eventDate || !bookingData.eventType || !customerEmail || !customerName) { 
      setError('Please fill all required fields including contact info'); 
      return; 
    }

    const selectedDate = new Date(bookingData.eventDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (selectedDate < tomorrow) {
      setError('You can only book for dates starting from tomorrow.');
      setShowErrorPopup(true);
      return;
    }

    try {
      setPaymentLoading(true);
      setError('');
      
      const amountToPay = paymentType === 'full' ? totalPrice : Math.ceil(totalPrice * 0.5);

      const payload = getBookingPayload(totalPrice, 'esewa');
      const bookingResponse = await bookingAPI.createBooking(token, payload);
      
      if (!bookingResponse.success) {
        setError(bookingResponse.message || 'Booking failed');
        setShowErrorPopup(true);
        setPaymentLoading(false);
        return;
      }

      const bookingId = bookingResponse.booking?._id || bookingResponse.data?._id;
      const esewaData = await esewaAPI.initiatePayment(token, bookingId, amountToPay, { paymentType });

      if (esewaData.success) {
        await fetchBookedDates(); // Immediate update
        const { paymentData, paymentUrl } = esewaData;
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
      }
    } catch (err) {
      setError(err.message || 'Payment initiation failed');
      setPaymentLoading(false);
    }
  };

  const handlePayLater = async () => {
    if (!token) { setError('Please login to book'); return; }
    if (!bookingData.eventDate || !bookingData.eventType || !customerEmail || !customerName) { 
      setError('Please fill all required fields including contact info'); 
      return; 
    }

    const selectedDate = new Date(bookingData.eventDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (selectedDate < tomorrow) {
      setError('You can only book for dates starting from tomorrow.');
      setShowErrorPopup(true);
      return;
    }

    try {
      setPaymentLoading(true);
      setError('');

      const payload = getBookingPayload(totalPrice, 'pay_later');
      const response = await bookingAPI.createBooking(token, payload);
      
      if (response.success) {
        setBookingSuccess('Booking held for 5 hours. Please pay within this window.');
        await fetchBookedDates(); // Immediate update
        setTimeout(() => navigate('/user/my-bookings'), 3000);
      } else {
        setError(response.message || 'Failed to reserve booking');
        setShowErrorPopup(true);
      }
    } catch (err) {
      setError(err.message || 'Error processing request');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSelectItem = (menuId, itemId) => {
    const key = `${menuId}-${itemId}`;
    setSelectedItems(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const handleDeselectItem = (menuId, itemId) => {
    const key = `${menuId}-${itemId}`;
    setSelectedItems(prev => {
      const updated = { ...prev };
      if (updated[key] > 1) updated[key]--;
      else delete updated[key];
      return updated;
    });
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Premium Hero Section */}
      <div className="relative h-[70vh] sm:h-[85vh] w-full overflow-hidden">
        {venue.images?.length > 0 ? (
          <>
            <img 
              src={getImageUrl(venue.images[galleryImageIndex])} 
              alt={venue.name} 
              className="w-full h-full object-cover transition-transform duration-1000 scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
               <button onClick={() => navigate(-1)} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition border border-white/20"><FaArrowLeft /></button>
            </div>
            <div className="absolute bottom-12 left-6 right-6 sm:left-12 sm:right-12 text-white z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-4 py-1.5 bg-purple-600 rounded-full text-xs font-black uppercase tracking-widest">{venue.type || 'Premium Venue'}</span>
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                  <FaStar className="text-yellow-400" />
                  <span className="text-sm font-bold">{venue.rating || '4.8'}</span>
                </div>
              </div>
              <h1 className="text-4xl sm:text-7xl font-black mb-4 tracking-tighter drop-shadow-2xl">{venue.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-white/80">
                <div className="flex items-center gap-2 text-lg"><FaMapMarkerAlt className="text-purple-500" /> <span>{venue.city}</span></div>
                <div className="flex items-center gap-2 text-lg"><FaUsers className="text-purple-500" /> <span>Up to {venue.capacity} Guests</span></div>
              </div>
            </div>
            {venue.images.length > 1 && (
              <div className="absolute bottom-12 right-6 sm:right-12 flex gap-3 z-20">
                <button onClick={() => setGalleryImageIndex(prev => (prev - 1 + venue.images.length) % venue.images.length)} className="p-4 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-full text-white transition border border-white/20"><FaChevronLeft /></button>
                <button onClick={() => setGalleryImageIndex(prev => (prev + 1) % venue.images.length)} className="p-4 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-full text-white transition border border-white/20"><FaChevronRight /></button>
              </div>
            )}
          </>
        ) : <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white font-black text-4xl">NO IMAGES</div>}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Scrollable */}
          <div className={`${(bookingData.selectedPackage || Object.keys(selectedItems).length > 0) ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-8`}>
            {bookingSuccess && <div className="p-5 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-2xl animate-fade-in font-bold flex items-center gap-3"><FaCheckCircle className="text-xl" />{bookingSuccess}</div>}

            {/* Overview Card */}
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-6">About the Venue</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-10">{venue.description}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Capacity', val: `${venue.capacity} Pax`, icon: <FaUsers /> },
                  { label: 'Starting Price', val: `₹${venue.pricePerDay || venue.pricePerPlate || 0}/Day`, icon: <FaShoppingCart /> },
                  { label: 'Rating', val: venue.rating || '4.8', icon: <FaStar /> },
                  { label: 'Location', val: venue.city || 'Kathmandu', icon: <FaMapMarkerAlt /> }
                ].map((stat, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 group hover:bg-purple-50 transition duration-300">
                    <div className="text-purple-600 mb-3 text-xl">{stat.icon}</div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-sm font-black text-gray-900">{stat.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities Section */}
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-8">Premium Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {venue.amenities?.map((am, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-sm font-bold text-gray-700">{am}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Calendar Section */}
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-2xl font-black text-gray-900">Venue Availability</h2>
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1))} className="p-2 hover:bg-white rounded-xl transition text-gray-600"><FaChevronLeft size={12}/></button>
                  <span className="font-black text-gray-900 text-xs uppercase tracking-widest min-w-[120px] text-center">
                    {currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1))} className="p-2 hover:bg-white rounded-xl transition text-gray-600"><FaChevronRight size={12}/></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-6">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
                ))}
                {Array.from({ length: new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10"></div>
                ))}
                {Array.from({ length: new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
                  const dateStr = dateObj.toISOString().split('T')[0];
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isPast = dateObj < new Date().setHours(0,0,0,0);
                  const isToday = dateStr === todayStr;
                  
                  const booking = !isPast ? bookedDates.find(b => {
                    const bDate = new Date(b.eventDate);
                    return bDate.getFullYear() === dateObj.getFullYear() && 
                           bDate.getMonth() === dateObj.getMonth() && 
                           bDate.getDate() === dateObj.getDate();
                  }) : null;
                  
                  let bgColor = 'bg-gray-50 text-gray-400';
                  let border = 'border-transparent';
                  let shadow = '';
                  
                  if (isToday) {
                    bgColor = 'bg-white text-purple-800';
                    border = 'border-purple-800';
                    shadow = 'shadow-md';
                  }

                  if (booking) {
                    if (booking.isManual) { bgColor = 'bg-purple-100 text-purple-700'; border = 'border-purple-500'; }
                    else if (booking.status === 'timely_booking') { bgColor = 'bg-blue-100 text-blue-700'; border = 'border-blue-500'; }
                    else if (booking.status === 'booked' || booking.status === 'confirmed') { bgColor = 'bg-green-100 text-green-700'; border = 'border-green-500'; }
                    else { bgColor = 'bg-amber-100 text-amber-700'; border = 'border-amber-500'; }
                  }

                  return (
                    <div 
                      key={day} 
                      className={`h-14 flex flex-col items-center justify-center rounded-2xl font-black text-xs border-b-4 transition duration-300 ${bgColor} ${border} ${shadow} ${isPast ? 'opacity-40 grayscale-[0.5]' : 'hover:scale-105 hover:shadow-lg'}`}
                    >
                      <span>{day}</span>
                      {isToday && <span className="text-[8px] mt-1 text-purple-600 uppercase">Today</span>}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-6 justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-100 border-b-2 border-purple-500 rounded-sm"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Manual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-100 border-b-2 border-blue-500 rounded-sm"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">On Hold</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border-b-2 border-green-500 rounded-sm"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-100 border-b-2 border-amber-500 rounded-sm"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Requested</span>
                </div>
              </div>
            </div>

            {/* Minimal Reviews Section */}
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-gray-900">Guest Experiences</h2>
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  <span className="font-black text-xl">{venue.rating || '4.8'}</span>
                  <span className="text-gray-400 font-bold">({venue.reviews?.length || 0} reviews)</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {venue.reviews?.slice(0, 3).map((r, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-800 rounded-full flex items-center justify-center text-white font-black text-xs">{(r.user?.name || 'C').charAt(0)}</div>
                        <div>
                          <p className="font-black text-gray-900 text-sm">{r.user?.name || 'Customer'}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex text-yellow-400 text-xs">{[...Array(r.rating)].map((_, i) => <FaStar key={i} />)}</div>
                    </div>
                    <p className="text-gray-600 text-sm italic leading-relaxed">"{r.comment}"</p>
                  </div>
                ))}
                {venue.reviews?.length > 3 && <button className="w-full py-4 text-purple-800 font-black text-sm uppercase tracking-widest hover:bg-purple-50 rounded-2xl transition">View All {venue.reviews.length} Reviews</button>}
                {venue.reviews?.length === 0 && <p className="text-center text-gray-400 py-10 font-bold italic">No reviews yet. Be the first to share your experience!</p>}
              </div>
            </div>

            {/* Rating & Review Section */}
            {!hasUserRated && localStorage.getItem('token') && localStorage.getItem('userRole') === 'user' && (
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-gray-100 mt-8">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Share Your Experience</h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-8">How was your event at {venue.name}?</p>
                
                <form onSubmit={handleRatingSubmit} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Your Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          onMouseEnter={() => setUserRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          {star <= userRating ? (
                            <FaStar className="w-10 h-10 text-yellow-400 drop-shadow-sm" />
                          ) : (
                            <FaStar className="w-10 h-10 text-gray-100" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Your Review</label>
                    <textarea
                      value={userReview}
                      onChange={(e) => setUserReview(e.target.value)}
                      placeholder="Write about the service, food, and ambiance..."
                      className="w-full p-6 bg-gray-50 border border-transparent rounded-[2rem] focus:border-purple-800 outline-none font-bold text-sm min-h-[150px] transition"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="w-full py-5 bg-purple-800 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-purple-900 transition transform hover:-translate-y-1 disabled:bg-gray-200"
                  >
                    {reviewLoading ? 'SUBMITTING...' : 'Post My Review'}
                  </button>
                </form>
              </div>
            )}

            {hasUserRated && (
              <div className="bg-green-50 border border-green-100 rounded-[2.5rem] p-8 text-center mt-8">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle size={24} />
                </div>
                <h3 className="text-xl font-black text-gray-900">Thanks for your feedback!</h3>
                <p className="text-gray-500 font-bold mt-1 text-sm">Your review has been shared with the venue community.</p>
              </div>
            )}
          </div>

          {/* Booking Sidebar - Shown only if selections made */}
          {(bookingData.selectedPackage || Object.keys(selectedItems).length > 0) && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 sticky top-28">
                <h3 className="text-2xl font-black text-gray-900 mb-8">Reserve Venue</h3>
                
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Customer Info</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-purple-800 outline-none font-bold text-sm" placeholder="Your Name" />
                    <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-purple-800 outline-none font-bold text-sm mt-2" placeholder="Confirmation Email" />
                  </div>

                  {/* Date & Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Event Date</label>
                      <input type="date" value={bookingData.eventDate} onChange={e => setBookingData(p => ({ ...p, eventDate: e.target.value }))} className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-purple-800 outline-none font-bold text-sm" min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Event Type</label>
                      <select value={bookingData.eventType} onChange={e => setBookingData(p => ({ ...p, eventType: e.target.value }))} className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-purple-800 outline-none font-bold text-sm">
                        <option value="">Select</option>
                        <option value="Wedding">Wedding</option>
                        <option value="Birthday">Birthday</option>
                        <option value="Corporate">Corporate</option>
                        <option value="Engagement">Engagement</option>
                        <option value="Party">Party</option>
                      </select>
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Number of Guests (Min: 50, Max: {venue.capacity})</label>
                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl">
                      <button onClick={() => setNumberOfGuests(Math.max(50, numberOfGuests - 10))} className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-purple-800 hover:scale-110 transition"><FaMinus /></button>
                      <input 
                        type="number" 
                        value={numberOfGuests} 
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setNumberOfGuests(val);
                        }}
                        onBlur={e => {
                          let val = parseInt(e.target.value) || 50;
                          if (val < 50) val = 50;
                          if (val > venue.capacity) val = venue.capacity;
                          setNumberOfGuests(val);
                        }}
                        className="flex-1 text-center font-black text-gray-900 bg-transparent border-none outline-none"
                      />
                      <button onClick={() => setNumberOfGuests(Math.min(venue.capacity, numberOfGuests + 10))} className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-purple-800 hover:scale-110 transition"><FaPlus /></button>
                    </div>
                  </div>

                  {/* Payment Type */}
                  <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
                     <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4">Payment Method</p>
                     <div className="grid grid-cols-1 gap-2">
                       <button onClick={() => setPaymentType('full')} className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-widest transition border-2 ${paymentType === 'full' ? 'bg-purple-800 text-white border-purple-800' : 'bg-white text-purple-800 border-purple-200'}`}>FULL PAYMENT</button>
                       <button onClick={() => setPaymentType('advance')} className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-widest transition border-2 ${paymentType === 'advance' ? 'bg-purple-800 text-white border-purple-800' : 'bg-white text-purple-800 border-purple-200'}`}>ADVANCE (50%)</button>
                     </div>
                  </div>

                  {/* Pricing */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Price</p>
                        <p className="text-3xl font-black text-gray-900">₹{totalPrice}</p>
                      </div>
                      {paymentType === 'advance' && (
                        <div className="text-right">
                          <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">Due Now</p>
                          <p className="text-xl font-black text-amber-600">₹{Math.ceil(totalPrice * 0.5)}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {(!bookingData.eventDate || !bookingData.eventType || !customerEmail || !customerName) && (
                        <p className="text-[10px] text-red-500 font-black uppercase text-center mb-2 animate-pulse">Please fill all details above to enable booking</p>
                      )}
                      <button 
                        onClick={handleBooking} 
                        disabled={paymentLoading || !bookingData.eventDate || !bookingData.eventType || !customerEmail || !customerName} 
                        className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-lg hover:bg-purple-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:transform-none transition transform hover:-translate-y-1 shadow-xl shadow-gray-200"
                      >
                        {paymentLoading ? 'PROCESSING...' : 'PAY & BOOK'}
                      </button>
                      <button 
                        onClick={handlePayLater} 
                        disabled={paymentLoading || !bookingData.eventDate || !bookingData.eventType || !customerEmail || !customerName} 
                        className="w-full py-5 bg-white border-2 border-gray-200 text-gray-900 rounded-3xl font-black text-lg hover:bg-gray-50 disabled:border-gray-100 disabled:text-gray-300 disabled:transform-none transition transform hover:-translate-y-1"
                      >
                        HOLD (5H)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Button */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-[100] pointer-events-none">
        <button 
          onClick={() => setShowMenuModal(true)}
          className="pointer-events-auto flex items-center gap-3 px-8 py-5 bg-purple-800 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-purple-900 transition-all transform hover:scale-105 active:scale-95"
        >
          <FaShoppingCart />
          View Menu & Packages
        </button>
      </div>

      {/* Menu & Packages Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-5xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden flex flex-col animate-slide-up">
            <div className="p-8 sm:p-12 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900">Customise Your Event</h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Select Menu & Package options</p>
              </div>
              <button onClick={() => setShowMenuModal(false)} className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition"><FaTimes size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-12 no-scrollbar">
              {/* Packages Selection */}
              <section>
                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3"><div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 text-sm">P</div> Venue Packages</h3>
                {packages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {packages.map(pkg => (
                      <div 
                        key={pkg._id} 
                        onClick={() => setBookingData(p => ({ ...p, selectedPackage: pkg._id }))}
                        className={`p-8 rounded-[2.5rem] border-4 transition-all cursor-pointer group relative overflow-hidden ${bookingData.selectedPackage === pkg._id ? 'border-purple-800 bg-purple-50/50' : 'border-gray-100 bg-white hover:border-purple-200'}`}
                      >
                        {bookingData.selectedPackage === pkg._id && <div className="absolute top-0 right-0 bg-purple-800 text-white px-6 py-2 rounded-bl-3xl font-black text-[10px] tracking-widest">SELECTED</div>}
                        <h4 className="text-2xl font-black text-gray-900 mb-2">{pkg.name}</h4>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">{pkg.type}</p>
                        <div className="mb-8">
                          <p className="text-4xl font-black text-purple-800">₹{pkg.basePrice}<span className="text-sm text-gray-400 font-bold">/Guest</span></p>
                        </div>
                        <ul className="space-y-3">
                          {pkg.features?.map((f, i) => <li key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium"><div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>{f}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : <div className="p-12 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center"><p className="text-gray-400 font-bold italic">Package system is not available for this venue</p></div>}
              </section>

              {/* Menus Selection */}
              <section>
                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3"><div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 text-sm">M</div> Catering Menus</h3>
                {menus.length > 0 ? (
                  <div className="space-y-8">
                    {menus.map(menu => (
                      <div key={menu._id} className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100">
                        <h4 className="text-xl font-black text-gray-900 mb-6">{menu.name}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {menu.items?.map(item => (
                            <div key={item._id} className="p-6 bg-white rounded-3xl flex justify-between items-center shadow-sm border border-transparent hover:border-purple-200 transition">
                              <div>
                                <p className="font-bold text-gray-900">{item.name}</p>
                                <p className="text-xs text-purple-700 font-black">₹{item.pricePerPlate}/Plate</p>
                              </div>
                              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl">
                                <button onClick={() => handleDeselectItem(menu._id, item._id)} className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-red-500 hover:scale-110 transition"><FaMinus size={10} /></button>
                                <span className="font-black w-5 text-center text-sm">{selectedItems[`${menu._id}-${item._id}`] || 0}</span>
                                <button onClick={() => handleSelectItem(menu._id, item._id)} className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-green-500 hover:scale-110 transition"><FaPlus size={10} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="p-12 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center"><p className="text-gray-400 font-bold italic">Menu system is not available for this venue</p></div>}
              </section>
            </div>

            <div className="p-8 sm:p-12 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-6">
               <div className="text-center sm:text-left">
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Added Selection Total</p>
                 <p className="text-3xl font-black text-purple-800">₹{menuTotal + packagePrice}</p>
               </div>
               <button onClick={() => setShowMenuModal(false)} className="w-full sm:w-auto px-12 py-5 bg-purple-800 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-purple-900 transition transform hover:-translate-y-1">Confirm Selection</button>
            </div>
          </div>
        </div>
      )}

      <ChatBox venueId={venue._id} otherUserId={(venue.owner?._id || venue.owner)} title="Chat with Owner" autoOpen={autoOpenChat} />

      {/* Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 text-center shadow-2xl animate-scale-up border border-gray-100">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">!</div>
            <h3 className="text-2xl font-black text-gray-900 mb-4">Action Failed</h3>
            <p className="text-gray-500 font-bold leading-relaxed mb-8">{error}</p>
            <button 
              onClick={() => { setShowErrorPopup(false); setError(''); }}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-600 transition shadow-lg shadow-gray-200"
            >
              Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserVenueDetail;