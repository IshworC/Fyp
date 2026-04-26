import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "../../components/Navigation";
import { 
  FaSearch, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaStar,
  FaChevronLeft,
  FaChevronRight,
  FaFilter
} from "react-icons/fa";
import { venueAPI, BASE_URL, getImageUrl } from "../../services/api";


function BrowseVenue() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialFilters = location.state?.filters || {};
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    location: initialFilters.location || "",
    type: initialFilters.eventType || "",
    date: initialFilters.date || ""
  });

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await venueAPI.getApprovedVenues();
      if (response.success) {
        setVenues(response.venues);
        setFilteredVenues(response.venues);
        
        // Extract unique locations (city or address)
        const uniqueLocations = [...new Set(response.venues.map(v => v.city || v.location).filter(Boolean))];
        setLocations(uniqueLocations);
      }
    } catch (err) {
      setError('Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = venues;

    if (filters.search) {
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        v.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.location) {
      filtered = filtered.filter(v => (v.city || v.location) === filters.location);
    }

    if (filters.type) {
      filtered = filtered.filter(v =>
        (v.type || '').toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.date) {
      const dateStr = new Date(filters.date).toISOString().split('T')[0];
      filtered = filtered.filter(v => {
        return !(v.bookedDates || []).includes(dateStr);
      });
    }

    setFilteredVenues(filtered);
  }, [filters, venues]);

  return (
    <div className="min-h-screen bg-sand-tan pb-20">
      <Navigation />
      
      {/* Top Filter Section */}
      <div className="bg-white border-b sticky top-[64px] z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search venues..." 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-800 outline-none font-bold text-sm"
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
              />
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <select 
                value={filters.location} 
                onChange={e => setFilters({...filters, location: e.target.value})}
                className="flex-1 md:w-48 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-800 outline-none font-black text-[10px] uppercase tracking-widest cursor-pointer"
              >
                <option value="">All Locations</option>
                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>

              <select 
                value={filters.type} 
                onChange={e => setFilters({...filters, type: e.target.value})}
                className="flex-1 md:w-48 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-800 outline-none font-black text-[10px] uppercase tracking-widest cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="Hotel">Hotel</option>
                <option value="Banquet">Banquet</option>
                <option value="Garden">Garden</option>
                <option value="Resort">Resort</option>
              </select>

              <button 
                onClick={() => setFilters({ search: '', location: '', type: '', date: '' })}
                className="p-4 bg-night-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition shadow-lg"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 overflow-x-auto no-scrollbar pb-2">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
               <span className="text-[10px] font-black text-gray-400 uppercase">Date:</span>
               <input 
                 type="date" 
                 className="w-auto bg-transparent border-none outline-none font-bold text-sm text-black"
                 value={filters.date}
                 min={new Date().toISOString().split('T')[0]}
                 onChange={e => setFilters({...filters, date: e.target.value})}
               />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Discover Venues</h1>
          <p className="text-night-blue font-bold mt-2 uppercase text-[10px] tracking-widest">Found {filteredVenues.length} premium spaces for you</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
             <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-800 rounded-full animate-spin mb-4"></div>
             <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Curating your selection...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVenues.map(venue => (
              <div 
                key={venue._id} 
                onClick={() => navigate(`/venue/${venue._id}`)}
                className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 transform hover:-translate-y-2"
              >
                <div className="relative h-80 overflow-hidden">
                  {venue.images?.length > 0 ? (
                    <img 
                      src={getImageUrl(venue.images[0])} 
                      alt={venue.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white font-black">NO IMAGE</div>
                  )}
                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm">{venue.type}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                     {venue.rating > 0 ? (
                       <div className="flex items-center gap-1 text-[#FFD700] text-sm">
                         <FaStar /> <span className="font-black text-white">{venue.rating}</span>
                       </div>
                     ) : (
                       <div className="flex items-center gap-1 text-white/90 text-[10px] uppercase tracking-widest font-black">
                         <span>New Venue</span>
                       </div>
                     )}
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-night-blue transition">{venue.name}</h3>
                  <div className="flex items-center gap-2 text-gray-400 mb-6 text-sm font-bold">
                    <FaMapMarkerAlt className="text-purple-600" />
                    <span>{venue.city || venue.location}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                    <div>
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Capacity</p>
                       <div className="flex items-center gap-2 text-gray-900 font-black">
                         <FaUsers className="text-purple-600" />
                         <span>Up to {venue.capacity} Pax</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredVenues.length === 0 && (
          <div className="text-center py-40">
             <div className="text-6xl mb-6">🔍</div>
             <h2 className="text-2xl font-black text-gray-900 mb-2">No matches found</h2>
             <p className="text-gray-400 font-medium">Try adjusting your filters to find more options.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseVenue;