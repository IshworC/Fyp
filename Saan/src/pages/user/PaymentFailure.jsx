import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaTimesCircle, FaArrowLeft } from 'react-icons/fa';
import Navigation from '../../components/Navigation';

function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get error details from URL parameters if available
  const errorMessage = searchParams.get('message') || 'Your payment was cancelled or failed.';
  const bookingId = searchParams.get('bookingId');

  // Log all URL parameters for debugging
  console.log('Payment failure URL parameters:', Object.fromEntries(searchParams.entries()));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />

      <div className="flex-1 flex items-center justify-center p-6 mt-16">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <FaTimesCircle className="mx-auto text-4xl text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>

          {bookingId && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">
                <strong>Booking ID:</strong> {bookingId}
              </p>
              <p className="text-sm text-red-600 mt-1">
                Your booking has been saved but payment was not completed. You can try payment again.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-[#5d0f0f] text-white py-3 px-6 rounded-lg hover:bg-[#4a0c0c] transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <FaArrowLeft /> Try Payment Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailure;