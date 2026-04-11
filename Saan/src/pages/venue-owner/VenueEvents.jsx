import React from "react";

function VenueEvents() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Events & Gallery</h1>
          <p className="text-gray-500 mt-1">Showcase your past events with photos</p>
        </div>
        <button className="px-4 py-2 bg-[#5d0f0f] text-white rounded-lg hover:bg-[#4a0c0c] transition text-sm font-medium">
          Add New Event
        </button>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Event Gallery</h2>
          <p className="text-gray-500 mb-6">Add events with name, date, and photos to showcase your venue.</p>
          <p className="text-sm text-gray-400">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default VenueEvents;
