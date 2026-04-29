import React, { useState, useEffect } from "react";
import { adminAPI, getImageUrl, venueAPI } from "../../services/api";
import { FaPlus, FaTrash, FaMapMarkerAlt, FaUsers, FaBuilding, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaImage, FaListUl, FaFileAlt, FaPhoneAlt, FaUserCircle } from "react-icons/fa";

const AMENITY_OPTIONS = [
  "Parking", "WiFi", "Air Conditioning", "Catering", "Sound System", "Decor", "Dressing Room", "Security", "Power Backup", "Bar"
];

function AdminVenues() {
  const [venues, setVenues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVenue, setNewVenue] = useState({
    name: "",
    type: "banquet",
    city: "",
    address: "",
    capacity: "",
    pricePerDay: "",
    pricePerPlate: "",
    description: "",
    amenities: [],
    ownerId: "",
    phone: "",
    location: {
      province: "",
      district: "",
      municipality: "",
      wardNo: "",
      street: ""
    }
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [docFiles, setDocFiles] = useState({
    citizenshipFront: null,
    citizenshipBack: null,
    businessRegistration: null,
    panCard: null,
    profileImage: null
  });
  const [previews, setPreviews] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchVenues();
    fetchUsers();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllVenues(token);
      if (response.success) {
        setVenues(response.venues || []);
      } else {
        setError(response.message || "Failed to fetch venues");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers(token);
      if (response.success) {
        setUsers(response.users.filter(u => u.role === 'venue-owner' || u.role === 'admin'));
      }
    } catch (err) { console.error(err); }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleDocChange = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      setDocFiles(prev => ({ ...prev, [field]: file }));
    }
  };

  const toggleAmenity = (amenity) => {
    setNewVenue(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this venue? This action cannot be undone.")) return;
    try {
      const response = await adminAPI.deleteVenue(token, id);
      if (response.success) {
        fetchVenues();
      } else {
        alert(response.message || "Failed to delete venue");
      }
    } catch (err) {
      alert("Error deleting venue");
    }
  };

  const handleAddVenue = async (e) => {
    e.preventDefault();
    if (!newVenue.ownerId) return alert("Please select an owner");

    try {
      const formData = new FormData();
      
      // Append basic fields
      Object.keys(newVenue).forEach(key => {
        if (key === 'amenities') {
          formData.append(key, JSON.stringify(newVenue[key]));
        } else if (key === 'location') {
          formData.append(key, JSON.stringify(newVenue[key]));
        } else {
          formData.append(key, newVenue[key]);
        }
      });
      
      // Append gallery images
      imageFiles.forEach(file => formData.append('images', file));
      
      // Append government documents and profile pic
      if (docFiles.citizenshipFront) formData.append('citizenshipFront', docFiles.citizenshipFront);
      if (docFiles.citizenshipBack) formData.append('citizenshipBack', docFiles.citizenshipBack);
      if (docFiles.businessRegistration) formData.append('businessRegistration', docFiles.businessRegistration);
      if (docFiles.panCard) formData.append('panCard', docFiles.panCard);
      if (docFiles.profileImage) formData.append('profileImage', docFiles.profileImage);

      const response = await adminAPI.createVenueManually(token, formData);

      if (response.success) {
        setShowAddModal(false);
        // Reset state...
        fetchVenues();
      } else {
        alert(response.message || "Failed to add venue");
      }
    } catch (err) {
      alert("Error adding venue");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-night-blue/20 border-t-night-blue rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-night-blue-shadow tracking-tighter">Venues Section</h1>
          <p className="text-gray-500 font-medium mt-1">Full management of platform venues and registrations.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-8 py-4 bg-night-blue text-white rounded-2xl font-black uppercase tracking-widest hover:bg-night-blue-shadow transition shadow-lg flex items-center gap-3"
        >
          <FaPlus /> Manual Full Registration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {venues.map((venue) => (
          <div key={venue._id} className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
            <div className="relative h-56 overflow-hidden">
              <img src={venue.images?.[0] ? getImageUrl(venue.images[0]) : "https://via.placeholder.com/400x300?text=No+Image"} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
              <div className="absolute top-4 right-4 flex gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${venue.isApproved ? 'bg-emerald-500/80 text-white border-emerald-400' : 'bg-amber-500/80 text-white border-amber-400'}`}>{venue.isApproved ? 'Approved' : 'Pending'}</span>
              </div>
              <button onClick={() => handleDelete(venue._id)} className="absolute bottom-4 right-4 p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-lg translate-y-12 group-hover:translate-y-0 duration-300"><FaTrash /></button>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-black text-night-blue-shadow line-clamp-1">{venue.name}</h3>
              <div className="flex items-center gap-2 text-gray-400 mt-2 text-sm">
                <FaMapMarkerAlt className="text-sand-tan" />
                <span className="font-bold">{venue.city}, {venue.address}</span>
              </div>
              <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price / Day</p>
                  <p className="text-lg font-black text-night-blue">Rs. {venue.pricePerDay}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Owner</p>
                  <p className="text-xs font-bold text-night-blue truncate max-w-[120px]">{venue.owner?.name || 'Admin'}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-night-blue text-white">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">Full Manual Registration</h2>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Provide data, location, documents and images</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition"><FaTimesCircle className="text-2xl" /></button>
            </div>
            
            <form onSubmit={handleAddVenue} className="p-8 overflow-y-auto space-y-10 bg-gray-50">
              {/* Basic & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-night-blue-shadow uppercase tracking-widest flex items-center gap-2">
                    <FaBuilding /> Basic Info
                  </h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Venue Name" required className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-night-blue outline-none font-bold" value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})} />
                    <select required className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-night-blue outline-none font-bold" value={newVenue.ownerId} onChange={e => setNewVenue({...newVenue, ownerId: e.target.value})}>
                      <option value="">Select Venue Owner</option>
                      {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                    </select>
                    <input type="text" placeholder="Nepal Phone (98...)" required className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-night-blue outline-none font-bold" value={newVenue.phone} onChange={e => setNewVenue({...newVenue, phone: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-night-blue-shadow uppercase tracking-widest flex items-center gap-2">
                    <FaMapMarkerAlt /> Detailed Location
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Province" required className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold" value={newVenue.location.province} onChange={e => setNewVenue({...newVenue, location: {...newVenue.location, province: e.target.value}})} />
                    <input type="text" placeholder="District" required className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold" value={newVenue.location.district} onChange={e => setNewVenue({...newVenue, location: {...newVenue.location, district: e.target.value}})} />
                    <input type="text" placeholder="Municipality" required className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold" value={newVenue.location.municipality} onChange={e => setNewVenue({...newVenue, location: {...newVenue.location, municipality: e.target.value}})} />
                    <input type="text" placeholder="Ward No" required className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold" value={newVenue.location.wardNo} onChange={e => setNewVenue({...newVenue, location: {...newVenue.location, wardNo: e.target.value}})} />
                    <input type="text" placeholder="Street/Tole" required className="col-span-2 px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold" value={newVenue.location.street} onChange={e => setNewVenue({...newVenue, location: {...newVenue.location, street: e.target.value}})} />
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-night-blue-shadow uppercase tracking-widest flex items-center gap-2">
                  <FaFileAlt /> Government Documents
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: "Citizenship Front", field: "citizenshipFront" },
                    { label: "Citizenship Back", field: "citizenshipBack" },
                    { label: "Business Reg.", field: "businessRegistration" },
                    { label: "PAN Card", field: "panCard" },
                    { label: "Profile Pic", field: "profileImage" }
                  ].map(doc => (
                    <div key={doc.field} className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{doc.label}</p>
                      <label className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${docFiles[doc.field] ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-200 bg-white text-gray-300 hover:border-night-blue'}`}>
                        {docFiles[doc.field] ? <FaCheckCircle className="text-2xl" /> : <FaPlus />}
                        <input type="file" className="hidden" onChange={e => handleDocChange(doc.field, e)} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features & Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                   <h3 className="text-sm font-black text-night-blue-shadow uppercase tracking-widest flex items-center gap-2"><FaListUl /> Features & Pricing</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <input type="number" placeholder="Capacity" required className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold" value={newVenue.capacity} onChange={e => setNewVenue({...newVenue, capacity: e.target.value})} />
                     <input type="number" placeholder="Price/Day" required className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold" value={newVenue.pricePerDay} onChange={e => setNewVenue({...newVenue, pricePerDay: e.target.value})} />
                     <input type="number" placeholder="Price/Plate" required className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold" value={newVenue.pricePerPlate} onChange={e => setNewVenue({...newVenue, pricePerPlate: e.target.value})} />
                     <select className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold" value={newVenue.type} onChange={e => setNewVenue({...newVenue, type: e.target.value})}>
                       <option value="banquet">Banquet</option>
                       <option value="hotel">Hotel</option>
                       <option value="resort">Resort</option>
                     </select>
                   </div>
                 </div>
                 <div className="space-y-6">
                   <h3 className="text-sm font-black text-night-blue-shadow uppercase tracking-widest flex items-center gap-2"><FaImage /> Venue Gallery</h3>
                   <div className="flex flex-wrap gap-3">
                     {previews.map((url, i) => <img key={i} src={url} className="w-16 h-16 rounded-xl object-cover border-2 border-night-blue" />)}
                     <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-night-blue transition">
                       <FaPlus className="text-gray-300" />
                       <input type="file" multiple className="hidden" onChange={handleImageChange} />
                     </label>
                   </div>
                 </div>
              </div>

              <button type="submit" className="w-full py-5 bg-night-blue text-white rounded-2xl font-black uppercase tracking-widest hover:bg-night-blue-shadow transition shadow-2xl">
                Finish & Register Venue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVenues;
