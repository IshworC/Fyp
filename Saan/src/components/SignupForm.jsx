import React from "react";

function SignupForm({ onSignup, onBackClick, isLoading = false, error: parentError = "" }) {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    venueName: "",
    venueType: "",
    venueCity: ""
  });
  const [error, setError] = React.useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (formData.name && formData.email && formData.password) {
      // Validate venue fields if role is venue-owner
      if (formData.role === "venue-owner" && (!formData.venueName || !formData.venueType || !formData.venueCity)) {
        setError("Please fill in all venue details!");
        return;
      }
      onSignup(formData);
    }
  };

  return (
    <form onSubmit={handleSignup} className="bg-gray-300 p-10 rounded-lg shadow-xl w-[380px] max-h-[90vh] overflow-y-auto">
      <h1 className="text-3xl font-bold text-center text-[#5d0f0f] mb-6">Create Account</h1>

      {(error || parentError) && (
        <div className="bg-red-200 text-red-800 p-3 rounded mb-4 text-sm">
          {error || parentError}
        </div>
      )}

      <label className="block font-semibold text-[#5d0f0f] mt-4 mb-2">Account Type</label>
      <select
        name="role"
        value={formData.role}
        onChange={handleChange}
        className="w-full px-3 py-2 rounded border border-gray-400 bg-white text-black"
        disabled={isLoading}
      >
        <option value="user">User</option>
        <option value="venue-owner">Venue Owner</option>
      </select>

      <label className="block font-semibold text-[#5d0f0f] mt-4">User Name</label>
      <input
        type="text"
        name="name"
        placeholder="Enter your full name"
        value={formData.name}
        onChange={handleChange}
        className="w-full px-3 py-2 rounded border"
        disabled={isLoading}
        required
      />

      <label className="block font-semibold text-[#5d0f0f] mt-4">Email</label>
      <input
        type="email"
        name="email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={handleChange}
        className="w-full px-3 py-2 rounded border"
        disabled={isLoading}
        required
      />

      {/* Venue Owner Specific Fields */}
      {formData.role === "venue-owner" && (
        <>
          <label className="block font-semibold text-[#5d0f0f] mt-4">Venue Name</label>
          <input
            type="text"
            name="venueName"
            placeholder="Enter your venue name"
            value={formData.venueName}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded border"
            disabled={isLoading}
            required={formData.role === "venue-owner"}
          />

          <label className="block font-semibold text-[#5d0f0f] mt-4">Venue Type</label>
          <select
            name="venueType"
            value={formData.venueType}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded border border-gray-400 bg-white text-black"
            disabled={isLoading}
            required={formData.role === "venue-owner"}
          >
            <option value="">Select Venue Type</option>
            <option value="banquet">Banquet Hall</option>
            <option value="wedding">Wedding Venue</option>
            <option value="conference">Conference Hall</option>
            <option value="garden">Garden/Lawn</option>
            <option value="restaurant">Restaurant</option>
            <option value="hotel">Hotel</option>
            <option value="other">Other</option>
          </select>

          <label className="block font-semibold text-[#5d0f0f] mt-4">City</label>
          <input
            type="text"
            name="venueCity"
            placeholder="Enter your city"
            value={formData.venueCity}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded border"
            disabled={isLoading}
            required={formData.role === "venue-owner"}
          />
        </>
      )}

      <label className="block font-semibold text-[#5d0f0f] mt-4">Password</label>
      <input
        type="password"
        name="password"
        placeholder="Enter password"
        value={formData.password}
        onChange={handleChange}
        className="w-full px-3 py-2 rounded border"
        disabled={isLoading}
        required
      />

      <label className="block font-semibold text-[#5d0f0f] mt-4">Confirm Password</label>
      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirm password"
        value={formData.confirmPassword}
        onChange={handleChange}
        className="w-full px-3 py-2 rounded border"
        disabled={isLoading}
        required
      />

      <button 
        type="submit" 
        className="w-full bg-[#5d0f0f] text-white py-2 mt-5 rounded hover:bg-[#4a0c0c] disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </button>

      <div className="text-center text-sm mt-3">Already have an account?</div>
      <button 
        type="button" 
        onClick={onBackClick} 
        className="w-full bg-white text-[#5d0f0f] py-2 mt-2 rounded border hover:bg-gray-100 disabled:opacity-50"
        disabled={isLoading}
      >
        Back to Login
      </button>
    </form>
  );
}

export default SignupForm;
