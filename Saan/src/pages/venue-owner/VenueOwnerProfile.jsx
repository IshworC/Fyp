import React, { useState, useEffect } from "react";

function VenueOwnerProfile() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Venue Owner");
    setUserEmail(localStorage.getItem("userEmail") || "owner@venue.com");
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#5d0f0f] to-[#8b1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{userName}</h2>
            <p className="text-gray-500 text-sm">{userEmail}</p>
            <span className="inline-block mt-3 px-3 py-1 bg-[#5d0f0f]/10 text-[#5d0f0f] rounded-full text-sm font-medium">
              Venue Owner
            </span>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={userName}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f]"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={userEmail}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f]"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f]"
              />
            </div>

            <div className="pt-4">
              <button className="px-6 py-2 bg-[#5d0f0f] text-white rounded-lg hover:bg-[#4a0c0c] transition text-sm font-medium">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Security</h3>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-800">Change Password</p>
            <p className="text-sm text-gray-500">Update your password regularly to keep your account secure</p>
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm font-medium">
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default VenueOwnerProfile;
