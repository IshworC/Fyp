import React from "react";

function VenueGallery() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Venue Images</h1>
          <p className="text-gray-500 mt-1">Upload images of your venue for customers to see</p>
        </div>
        <button className="px-4 py-2 bg-[#5d0f0f] text-white rounded-lg hover:bg-[#4a0c0c] transition text-sm font-medium">
          Upload Images
        </button>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Venue Photo Gallery</h2>
          <p className="text-gray-500 mb-6">Upload high-quality images of your venue to attract customers.</p>
          <p className="text-sm text-gray-400">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default VenueGallery;
