import React, { useState, useRef, useEffect } from "react";
import { otpAPI } from "../services/api";

function OtpVerificationModal({ email, name, onVerified, onClose }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus last filled input or next empty
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await otpAPI.verifyOtp(email, otpString);
      if (response.success) {
        onVerified();
      } else {
        setError(response.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await otpAPI.resendOtp(email, name);
      if (response.success) {
        setOtp(["", "", "", "", "", ""]);
        setCountdown(60);
        setResendDisabled(true);
        inputRefs.current[0]?.focus();
      } else {
        setError(response.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-[#5d0f0f] px-6 py-4">
          <h2 className="text-xl font-bold text-white text-center">
            Verify Your Email
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-center mb-2">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-[#5d0f0f] font-semibold text-center mb-6">
            {email}
          </p>

          {/* OTP Input */}
          <div className="flex justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-[#5d0f0f] focus:outline-none disabled:bg-gray-100"
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm text-center">
              {error}
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full bg-[#5d0f0f] text-white py-3 rounded-lg font-semibold hover:bg-[#4a0c0c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>

          {/* Resend Section */}
          <div className="mt-4 text-center">
            <p className="text-gray-500 text-sm mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={resendDisabled || isLoading}
              className="text-[#5d0f0f] font-semibold hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
            >
              {resendDisabled
                ? `Resend in ${countdown}s`
                : "Resend OTP"}
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default OtpVerificationModal;
