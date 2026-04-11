import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import Navigation from '../../components/Navigation';

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get the data parameter from URL (base64 encoded response from eSewa)
        const data = searchParams.get('data');

        if (!data) {
          setVerificationResult({
            success: false,
            message: 'No payment data received from eSewa'
          });
          setVerifying(false);
          return;
        }

        // Verify payment with backend
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
        const response = await fetch(`${API_URL}/esewa/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data }),
        });

        const result = await response.json();
        setVerificationResult(result);
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationResult({
          success: false,
          message: 'Failed to verify payment. Please contact support with your transaction details.'
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />

      <div className="flex-1 flex items-center justify-center p-6 mt-16">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          {verifying ? (
            <>
              <FaSpinner className="mx-auto text-4xl text-blue-500 mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
              <p className="text-gray-600">Please wait while we verify your payment...</p>
            </>
          ) : verificationResult?.success ? (
            <>
              <FaCheckCircle className="mx-auto text-4xl text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your booking has been confirmed. You will receive a confirmation email shortly.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-[#5d0f0f] text-white py-3 px-6 rounded-lg hover:bg-[#4a0c0c] transition-colors font-semibold"
                >
                  Go to Home
                </button>
                <button
                  onClick={() => navigate('/browse-venue')}
                  className="w-full border-2 border-[#5d0f0f] text-[#5d0f0f] py-3 px-6 rounded-lg hover:bg-[#5d0f0f] hover:text-white transition-colors font-semibold"
                >
                  Browse More Venues
                </button>
              </div>
            </>
          ) : (
            <>
              <FaTimesCircle className="mx-auto text-4xl text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-6">
                {verificationResult?.message || 'Your payment could not be processed. Please try again.'}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(-1)}
                  className="w-full bg-[#5d0f0f] text-white py-3 px-6 rounded-lg hover:bg-[#4a0c0c] transition-colors font-semibold"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Go to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;