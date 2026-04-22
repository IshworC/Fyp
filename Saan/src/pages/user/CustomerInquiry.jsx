import React, { useState } from 'react';
import Navigation from '../../components/Navigation';
import { contactAPI } from '../../services/api';

function CustomerInquiry() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'inquiry',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Send form data to backend
      const response = await contactAPI.submitInquiry(formData);

      if (response.success) {
        setSuccessMessage(response.message || 'Your message has been sent successfully!');
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          type: 'inquiry',
          message: '',
        });

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(response.message || 'Failed to send your message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrorMessage('An error occurred while sending your message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />

      <div className="pt-24 px-4 min-h-screen bg-gray-100">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
          <h1 className="text-3xl font-bold text-center mb-6 text-purple-800">
            Customer Inquiry / Complaint
          </h1>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg">
              ✓ {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg">
              ✗ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block font-medium mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block font-medium mb-1">Message Type</label>
              <select
                name="type"


                value={formData.type}
                onChange={handleChange}
                disabled={loading}
                className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="inquiry">Inquiry</option>
                <option value="complaint">Complaint</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block font-medium mb-1">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                disabled={loading}
                rows="5"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
              ></textarea>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-800 text-white py-3 rounded-lg font-medium hover:bg-[#7a1a1a] transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default CustomerInquiry;
