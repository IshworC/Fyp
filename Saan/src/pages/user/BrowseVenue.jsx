import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import { 
  FaSearch, 
  FaFilter, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaBuilding,
  FaDollarSign,
  FaCalendarAlt,
  FaStar,
  FaStarHalfAlt,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { venueAPI } from "../../services/api"; // Your API service

function BrowseVenue() {
  const navigate = useNavigate();
  
  // Replace the mock venues array with state
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    minCapacity: "",
    maxCapacity: "",
    venueType: "",
    amenities: []
  });
  const venuesPerPage = 5;

  // Fetch real venues from API
  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        console.log("Starting to fetch venues...");
        
        // Use your venueAPI service
        const response = await venueAPI.getApprovedVenues();
        console.log("API Response:", response); // Debug log
        
        if (response.success && response.venues && response.venues.length > 0) {
          console.log(`Found ${response.venues.length} venues from API`);
          
          // Transform API data to match your existing structure
          const apiVenues = response.venues.map(venue => ({
            id: venue._id,
            name: venue.name || 'Unnamed Venue',
            location: `${venue.city || 'Location'}${venue.address ? ', ' + venue.address : ''}`,
            image: venue.images && venue.images.length > 0 
              ? venue.images[0] 
              : "https://i.pinimg.com/736x/08/c7/22/08c72296f934193df6155cffb0b10580.jpg",
            rating: Number.isFinite(Number(venue.rating)) ? Math.max(0, Math.min(5, Number(venue.rating))) : 0,
            totalCapacity: venue.capacity || 500,
            numberOfHalls: 1,
            description: venue.description || `Beautiful venue located in ${venue.city || 'our city'}`,
            type: venue.type || 'Banquet Hall',
            amenities: venue.amenities || ['AC', 'Parking', 'Catering']
          }));

          console.log("Processed venues:", apiVenues); // Debug log
          setVenues(apiVenues);
        } else {
          console.log("No approved venues found");
          setVenues([]);
        }
      } catch (error) {
        console.error('Error fetching venues:', error);
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  // Filter venues based on search and filters (using the state venues)
  const filteredVenues = venues.filter(venue => {
    // Search filter
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Capacity filter
    const matchesMinCapacity = !filters.minCapacity || venue.totalCapacity >= parseInt(filters.minCapacity);
    const matchesMaxCapacity = !filters.maxCapacity || venue.totalCapacity <= parseInt(filters.maxCapacity);
    
    // Type filter
    const matchesType = !filters.venueType || venue.type === filters.venueType;
    
    return matchesSearch && matchesMinCapacity && matchesMaxCapacity && matchesType;
  });

  // Pagination logic
  const indexOfLastVenue = currentPage * venuesPerPage;
  const indexOfFirstVenue = indexOfLastVenue - venuesPerPage;
  const currentVenues = filteredVenues.slice(indexOfFirstVenue, indexOfLastVenue);
  const totalPages = Math.ceil(filteredVenues.length / venuesPerPage);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      days.push({ day, date, isToday, isSelected });
    }
    
    return days;
  };

  // Navigate to previous/next month
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // Handle date selection
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  // Handle venue details view - Now uses real venue IDs
  const handleViewDetails = (venueId) => {
    console.log("Viewing venue details for ID:", venueId); // Debug log
    navigate(`/venue/${venueId}`);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      minCapacity: "",
      maxCapacity: "",
      venueType: "",
      amenities: []
    });
  };

  // Render rating stars with support for decimal values
  const renderStars = (rating) => {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    const fullStars = Math.floor(value);
    const remainder = value - fullStars;
    const hasHalf = remainder >= 0.25 && remainder < 0.75;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
      <div className="flex items-center">
        {Array.from({ length: fullStars }, (_, i) => (
          <FaStar key={`full-${i}`} className="w-4 h-4 text-yellow-400" />
        ))}
        {hasHalf && <FaStarHalfAlt className="w-4 h-4 text-yellow-400" />}
        {Array.from({ length: emptyStars }, (_, i) => (
          <FaStar key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
    );
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calendar days
  const calendarDays = generateCalendarDays();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Available venue types
  const venueTypes = ["Banquet Hall", "Conference Hall", "Resort", "Restaurant", "Garden", "Terrace"];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      {/* Main Content - Remove pt-4 and add mt-16 to account for fixed navbar */}
      <div className="flex flex-col lg:flex-row flex-1 mt-16">
        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5d0f0f] mb-4"></div>
              <p className="text-gray-600">Loading venues...</p>
            </div>
          </div>
        )}
        
        {/* Content when not loading */}
        {!loading && (
          <>
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="lg:hidden mx-4 my-4 flex items-center justify-center gap-2 bg-[#5d0f0f] text-white px-4 py-2 rounded-lg font-medium"
            >
              <FaFilter />
              {isFilterOpen ? "Hide Filters" : "Show Filters"}
            </button>

            {/* Left Sidebar - Calendar & Filters */}
            <div className={`
              ${isFilterOpen ? 'block' : 'hidden'}
              lg:block lg:w-1/4 bg-white border-r border-gray-200 p-6 space-y-8 lg:mt-0
            `}>
              {/* Calendar Section */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaCalendarAlt className="text-[#5d0f0f]" />
                    Calendar
                  </h2>
                  <span className="text-sm text-gray-500">Pick a date</span>
                </div>
                
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={prevMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                  >
                    <FaChevronLeft />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                  >
                    <FaChevronRight />
                  </button>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((dayInfo, index) => (
                    <div key={index} className="min-h-10 flex items-center justify-center">
                      {dayInfo ? (
                        <button
                          onClick={() => handleDateClick(dayInfo.date)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                            ${dayInfo.isToday ? 'bg-blue-100 text-blue-600 border-2 border-blue-200' : ''}
                            ${dayInfo.isSelected ? 'bg-[#5d0f0f] text-white' : 'hover:bg-gray-100'}
                            ${!dayInfo.isSelected && !dayInfo.isToday ? 'text-gray-700' : ''}`}
                        >
                          {dayInfo.day}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                
                {/* Selected Date Info */}
                <div className="mt-6 p-3 bg-[#f8f0f0] rounded-lg border border-[#e8d0d0]">
                  <p className="text-sm text-gray-600 mb-1">Date:</p>
                  <p className="font-semibold text-gray-800">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Filters Section */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaFilter className="text-[#5d0f0f]" />
                    Filters
                  </h2>
                  <button
                    onClick={resetFilters}
                    className="text-sm text-[#5d0f0f] hover:text-[#4a0c0c] font-medium"
                  >
                    Reset All
                  </button>
                </div>



                {/* Capacity Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity Range</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minCapacity}
                      onChange={(e) => handleFilterChange('minCapacity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxCapacity}
                      onChange={(e) => handleFilterChange('maxCapacity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]"
                    />
                  </div>
                </div>

                {/* Venue Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue Type</label>
                  <select
                    value={filters.venueType}
                    onChange={(e) => handleFilterChange('venueType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]"
                  >
                    <option value="">All Types</option>
                    {venueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Stats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Search Results</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Found Venues:</span>
                      <span className="font-semibold text-[#5d0f0f]">{filteredVenues.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Venues:</span>
                      <span className="font-semibold">{venues.length}</span>
                    </div>

                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 p-4 lg:p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                      Browse <span className="text-[#5d0f0f]">Venues</span>
                    </h1>
                    <p className="text-gray-600">
                      {venues.length > 0 
                        ? `Found ${venues.length} approved venues for your special event`
                        : 'Loading venues...'}
                    </p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FaSearch />
                    </div>
                    <input
                      type="text"
                      placeholder="Search venues, locations, or types..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-80 px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5d0f0f] focus:border-transparent bg-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Venues List - Optimized for larger images */}
              <div className="space-y-6">
                {filteredVenues.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No venues found matching your criteria</p>
                    <button 
                      onClick={resetFilters}
                      className="mt-4 text-[#5d0f0f] hover:text-[#4a0c0c] font-medium"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <>
                    {currentVenues.map(venue => (
                      <div
                        key={venue.id}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Venue Image - LARGER */}
                          <div className="md:w-64 h-72 md:h-auto relative">
                            <img
                              src={venue.image}
                              alt={venue.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "https://i.pinimg.com/736x/08/c7/22/08c72296f934193df6155cffb0b10580.jpg";
                              }}
                            />
                            {/* Rating badge on image */}
                            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full flex items-center gap-1">
                              {renderStars(venue.rating)}
                              <span className="text-sm font-bold">{Number(venue.rating).toFixed(1)}</span>
                            </div>
                            {/* Type badge */}
                            <div className="absolute top-4 left-4">
                              <span className="bg-[#5d0f0f]/90 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                {venue.type}
                              </span>
                            </div>
                          </div>
                          
                          {/* Venue Details - MORE COMPACT */}
                          <div className="flex-1 p-5">
                            <div className="flex flex-col h-full">
                              {/* Header with title and button */}
                              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-800 mb-1">{venue.name}</h3>
                                  <div className="flex items-center text-gray-600 text-sm mb-2">
                                    <FaMapMarkerAlt className="mr-2 w-3 h-3" />
                                    {venue.location}
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleViewDetails(venue.id)}
                                  className="bg-[#5d0f0f] text-white px-5 py-2 rounded-lg hover:bg-[#4a0c0c] transition-colors font-semibold text-sm whitespace-nowrap"
                                >
                                  View Details
                                </button>
                              </div>
                              
                              {/* Compact description */}
                              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {venue.description}
                              </p>
                              
                              {/* Stats in compact grid */}
                              <div className="grid grid-cols-3 gap-3 mt-auto">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center justify-center text-[#5d0f0f] mb-1">
                                    <FaUsers className="w-4 h-4" />
                                  </div>
                                  <div className="text-lg font-bold text-gray-900">{venue.totalCapacity}</div>
                                  <div className="text-xs text-gray-500">Capacity</div>
                                </div>
                                
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center justify-center text-[#5d0f0f] mb-1">
                                    <FaBuilding className="w-4 h-4" />
                                  </div>
                                  <div className="text-lg font-bold text-gray-900">{venue.numberOfHalls}</div>
                                  <div className="text-xs text-gray-500">Halls</div>
                                </div>
                              </div>
                              
                              {/* Amenities */}
                              <div className="mt-4">
                                <div className="flex flex-wrap gap-2">
                                  {venue.amenities.slice(0, 4).map((amenity, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                                    >
                                      {amenity}
                                    </span>
                                  ))}
                                  {venue.amenities.length > 4 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                      +{venue.amenities.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 w-full sm:w-auto"
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          currentPage === page
                            ? 'bg-[#5d0f0f] text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 w-full sm:w-auto"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Footer */}
      <footer className="bg-[#3a0a0a] text-white mt-8">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img
                src="src/assets/logo.png"
                alt="SAN Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-lg font-bold">SAAN Venues</span>
            </div>
            
            <div className="text-center mb-4 md:mb-0">
              <p className="text-gray-300 text-sm">
                &copy; {new Date().getFullYear()} SAAN Venues. All rights reserved.
              </p>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                Terms
              </a>
              <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                Privacy
              </a>
              <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default BrowseVenue;