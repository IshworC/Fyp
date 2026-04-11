import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { venueRegistrationAPI, venueAPI } from '../../services/api';
import { FaArrowLeft, FaSave, FaEdit, FaTrash, FaCamera } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

function EditVenueDetails() {
  const navigate = useNavigate();
  const { venueId: routeVenueId } = useParams();
  const token = localStorage.getItem('token');

  const [registration, setRegistration] = useState(null);
  const [venue, setVenue] = useState(null);
  const [editVenueId, setEditVenueId] = useState(routeVenueId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [images, setImages] = useState([]);

  // Fetch registration and venue data on load
  useEffect(() => {
    fetchRegistrationData();
  }, []);

  const fetchRegistrationData = async () => {
    try {
      setLoading(true);
      const response = await venueRegistrationAPI.getMyRegistration(token);
      
      if (response.success && response.registration) {
        setRegistration(response.registration);
        setImages(response.registration.venueImages || []);

        const venueIdFromRegistration = response.registration.venue?._id || response.registration.venue || null;
        const selectedVenueId = routeVenueId || venueIdFromRegistration;

        if (selectedVenueId) {
          setEditVenueId(selectedVenueId);

          const venueResponse = await venueAPI.getSingleVenue(selectedVenueId);
          if (venueResponse.success || venueResponse.data) {
            setVenue(venueResponse.data || venueResponse.venue);
          }
        }

        setMessage('');
      } else {
        setMessage('Registration not found');
      }
    } catch (err) {
      console.error('Error:', err);
      setMessage('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const saveField = async (field) => {
    // For numeric fields, allow 0 or any number. For text fields, require non-empty
    if (field !== 'capacity' && field !== 'numberOfHalls') {
      if (!editValue.trim()) {
        setMessage('Value cannot be empty');
        return;
      }
    } else {
      // For numeric fields, just ensure it's not negative
      if (editValue < 0) {
        setMessage('Value cannot be negative');
        return;
      }
    }

    try {
      setSaving(true);
      
      // Always send complete data to avoid validation errors
      let updateData = {
        phone: registration.phone || '',
        venueName: registration.venueName || '',
        province: registration.location?.province || '',
        district: registration.location?.district || '',
        municipality: registration.location?.municipality || '',
        wardNo: registration.location?.wardNo || '',
        street: registration.location?.street || '',
        capacity: registration.capacity || editValue || '',
        numberOfHalls: registration.numberOfHalls || editValue || ''
      };

      // Update the specific field being edited
      if (field === 'venueName') {
        updateData.venueName = editValue;
      } else if (field === 'phone') {
        updateData.phone = editValue;
      } else if (field === 'province') {
        updateData.province = editValue;
      } else if (field === 'district') {
        updateData.district = editValue;
      } else if (field === 'municipality') {
        updateData.municipality = editValue;
      } else if (field === 'wardNo') {
        updateData.wardNo = editValue;
      } else if (field === 'street') {
        updateData.street = editValue;
      } else if (field === 'capacity') {
        updateData.capacity = editValue;
      } else if (field === 'numberOfHalls') {
        updateData.numberOfHalls = editValue;
      }

      // Validate location fields - they are required
      if (!updateData.province || !updateData.district || !updateData.municipality || !updateData.wardNo || !updateData.street) {
        setMessage('All location fields are required');
        setSaving(false);
        return;
      }

      console.log('Sending update:', updateData);

      // Update registration
      const response = await fetch(`${API_URL}/venue-registration`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      console.log('Registration update response:', result);
      
      if (result.success && result.registration) {
        setRegistration(result.registration);
        
        // Also update the Venue model if it exists
        const venueIdToUpdate = editVenueId || venue?._id;

        if (venueIdToUpdate) {
          const venueUpdateData = {
            name: result.registration.venueName || venue?.name,
            capacity: result.registration.capacity || venue?.capacity,
            numberOfHalls: result.registration.numberOfHalls || venue?.numberOfHalls,
            phone: result.registration.phone || venue?.phone,
            address: `${result.registration.location?.street || venue?.address || ''}, Ward ${result.registration.location?.wardNo || ''}, ${result.registration.location?.municipality || ''}`
          };

          console.log('Updating venue with:', venueUpdateData);
          try {
            const venueUpdateResponse = await venueAPI.updateVenue(token, venueIdToUpdate, venueUpdateData);
            console.log('Venue update response:', venueUpdateResponse);

            if (venueUpdateResponse.success || venueUpdateResponse.venue) {
              setVenue(venueUpdateResponse.venue || venueUpdateResponse.data);
              console.log('Venue updated successfully');
            }
          } catch (venueErr) {
            console.error('Venue update error:', venueErr);
          }
        }
        
        setMessage(`✓ ${field} updated successfully`);
        setEditingField(null);
        
        // Wait a moment then refresh both
        setTimeout(() => {
          fetchRegistrationData();
        }, 800);
      } else {
        const errMsg = result.message || JSON.stringify(result);
        setMessage('Failed: ' + errMsg);
        console.error('Backend response:', result);
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setSaving(true);
      const formData = new FormData();
      files.forEach(file => formData.append('venueImages', file));
      
      // Call the addVenueImages endpoint directly
      const response = await venueRegistrationAPI.addVenueImages(token, formData);
      
      if (response.success) {
        setImages(response.images || response.registration?.venueImages || response.venueImages || []);
        setMessage('✓ Images added successfully');
        setTimeout(() => setMessage(''), 2000);
        await fetchRegistrationData();
      } else {
        setMessage(response.message || 'Failed to upload images');
      }
    } catch (err) {
      setMessage('Error uploading images: ' + err.message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async (imageId, index) => {
    try {
      setSaving(true);
      const response = await venueRegistrationAPI.removeVenueImage(token, imageId);
      
      if (response.success) {
        setImages(response.images || response.registration?.venueImages || response.venueImages || images.filter((_, i) => i !== index));
        setMessage('✓ Image removed');
        setTimeout(() => setMessage(''), 2000);
        await fetchRegistrationData();
      }
    } catch (err) {
      setMessage('Error removing image');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label, field, value, type = 'text') => (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          {editingField === field ? (
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]"
              placeholder={type === 'number' ? '0' : 'Enter value'}
              disabled={saving}
            />
          ) : (
            <p className="text-lg font-semibold text-gray-900">{value || value === 0 ? value : 'Not set'}</p>
          )}
        </div>
        <div className="ml-4">
          {editingField === field ? (
            <div className="flex gap-2">
              <button
                onClick={() => saveField(field)}
                disabled={saving}
                className="bg-[#5d0f0f] text-white px-3 py-2 rounded-lg hover:bg-[#4a0c0c] disabled:bg-gray-400 flex items-center gap-1 text-sm"
              >
                <FaSave size={14} /> Save
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => startEdit(field, value)}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-1 text-sm"
            >
              <FaEdit size={14} /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5d0f0f] mx-auto mb-3"></div>
          <p>Loading details...</p>
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">No registration found</p>
          <button
            onClick={() => navigate('/venue-owner/dashboard')}
            className="bg-[#5d0f0f] text-white px-6 py-2 rounded-lg hover:bg-[#4a0c0c]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/venue-owner/dashboard')}
            className="text-[#5d0f0f] hover:text-[#4a0c0c] text-xl"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-bold">Edit Venue Details</h1>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 text-white ${message.includes('✓') ? 'bg-green-500' : 'bg-red-500'}`}>
            {message}
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6">Basic Information</h2>
          
          {renderField('Venue Name', 'venueName', registration.venueName)}
          {renderField('Phone', 'phone', registration.phone, 'tel')}
          
          <h2 className="text-2xl font-bold mt-8 mb-6">Location Details</h2>
          
          {renderField('Province', 'province', registration.location?.province)}
          {renderField('District', 'district', registration.location?.district)}
          {renderField('Municipality', 'municipality', registration.location?.municipality)}
          {renderField('Ward Number', 'wardNo', registration.location?.wardNo)}
          {renderField('Street/Tole', 'street', registration.location?.street)}
          
          <h2 className="text-2xl font-bold mt-8 mb-6">Venue Capacity</h2>
          
          {renderField('Total Capacity', 'capacity', registration.capacity, 'number')}
          {renderField('Number of Halls', 'numberOfHalls', registration.numberOfHalls, 'number')}
        </div>

        {/* Gallery Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Gallery</h2>
          
          {/* Upload Images */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border-2 border-dashed border-gray-300">
            <label className="block text-center cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <FaCamera className="text-4xl text-gray-400" />
                <span className="text-sm text-gray-600">Click to add images</span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={addImages}
                disabled={saving}
                className="hidden"
              />
            </label>
          </div>

          {/* Display Images */}
          {images && images.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-3">Current Images ({images.length})</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url || image}
                      alt="Venue"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(image._id || image.publicId, index)}
                      disabled={saving}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition disabled:cursor-not-allowed"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditVenueDetails;
