import React, { useState, useEffect, useRef } from "react";
import { venueAPI, getImageUrl } from "../../services/api";

import { FaTrash, FaCloud, FaImage } from "react-icons/fa";

function VenueEventsAndGallery() {
  const [venueId, setVenueId] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch venue gallery on mount
  useEffect(() => {
    fetchVenueGallery();
  }, []);

  const fetchVenueGallery = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const registrationResponse = await venueAPI.getMyVenues(token);
      if (registrationResponse.success && Array.isArray(registrationResponse.venues) && registrationResponse.venues.length > 0) {
        const venue = registrationResponse.venues[0];
        setVenueId(venue._id);
        setImages(venue.images || []);
      }
    } catch (err) {
      console.error("Error fetching gallery:", err);
      setError("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file count
    if (images.length + files.length > 12) {
      setError("Maximum 12 images allowed. You can upload " + (12 - images.length) + " more.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");

      const formData = new FormData();
      files.forEach(file => {
        formData.append("images", file);
      });

      const response = await venueAPI.updateVenueImages(token, venueId, formData);
      
      if (response.success) {
        setImages(response.venue?.images || []);
        setSuccess(`✅ Successfully uploaded ${files.length} image(s)!`);
        setTimeout(() => setSuccess(""), 3000);
        fileInputRef.current.value = "";
      } else {
        setError(response.message || "Failed to upload images");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Error uploading images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (index) => {
    try {
      setError("");
      const token = localStorage.getItem("token");
      const newImages = images.filter((_, i) => i !== index);
      const response = await venueAPI.updateVenueGallery(token, venueId, { images: newImages });

      if (response.success) {
        setImages(newImages);
        if (selectedImageIndex >= newImages.length && selectedImageIndex > 0) {
          setSelectedImageIndex(selectedImageIndex - 1);
        }
        setSuccess("✅ Image deleted successfully!");
        setTimeout(() => setSuccess(""), 2000);
        setShowDeleteConfirm(null);
      } else {
        setError("Failed to delete image");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Error deleting image");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block relative w-12 h-12 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-purple-800"></div>
          </div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📸 Venue Gallery</h1>
          <p className="text-gray-600 mt-1">Upload and manage photos of your venue to attract customers</p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg text-green-700 flex items-center gap-3">
          <span className="text-xl">✓</span>
          {success}
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {images.length === 0 ? (
          // Empty State
          <div className="p-12">
            <label htmlFor="image-upload" className="cursor-pointer block">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full">
                    <FaCloud className="text-5xl text-blue-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Upload Venue Photos</h3>
                  <p className="text-gray-600 mt-2">Click to select images or drag and drop</p>
                  <p className="text-sm text-gray-500 mt-1">JPG, PNG up to 5MB each • Maximum 12 images</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-4 inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition disabled:opacity-60 font-semibold"
                >
                  {uploading ? "Uploading..." : "Select Images"}
                </button>
              </div>
            </label>
          </div>
        ) : (
          // Gallery View
          <div className="space-y-6 p-6">
            {/* Main Image Display */}
            <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden group">
              <img
                src={getImageUrl(images[selectedImageIndex])}
                alt={`Venue ${selectedImageIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800x400?text=Image+Error";
                }}
              />

              {/* Image Counter & Delete Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                {showDeleteConfirm === selectedImageIndex ? (
                  <div className="bg-white rounded-lg p-4 shadow-2xl text-center space-y-3">
                    <p className="font-semibold text-gray-900">Delete this image?</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteImage(selectedImageIndex)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {selectedImageIndex + 1} / {images.length}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteConfirm(selectedImageIndex)}
                className="absolute top-4 right-4 p-3 bg-red-500/90 hover:bg-red-600 text-white rounded-full transition shadow-lg transform hover:scale-110"
                title="Delete image"
              >
                <FaTrash />
              </button>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-gray-900 rounded-full transition shadow-lg transform hover:scale-110"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-gray-900 rounded-full transition shadow-lg transform hover:scale-110"
                  >
                    ▶
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Grid */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">All Images ({images.length}/12)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-3 transition transform hover:scale-105 ${
                      idx === selectedImageIndex
                        ? "border-purple-800 ring-2 ring-purple-800"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/150?text=Image";
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Upload More Button */}
            {images.length < 12 && (
              <div>
                <label htmlFor="image-upload" className="cursor-pointer block">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 font-semibold disabled:opacity-60"
                  >
                    <FaImage /> {uploading ? "Uploading..." : `Upload More (${12 - images.length} slots available)`}
                  </button>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          id="image-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading || images.length >= 12}
          className="hidden"
        />
      </div>

      {/* Tips Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-r-lg p-6">
        <h3 className="font-bold text-gray-900 mb-3">💡 Pro Tips for Better Photos</h3>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li>✓ Upload high-resolution images (at least 1920x1080)</li>
          <li>✓ Show different angles and setups of your venue</li>
          <li>✓ Include close-ups of decorations, lighting, and seating</li>
          <li>✓ Upload images during daytime for better quality</li>
          <li>✓ Keep photos consistent and professionally lit</li>
        </ul>
      </div>
    </div>
  );
}

export default VenueEventsAndGallery;
