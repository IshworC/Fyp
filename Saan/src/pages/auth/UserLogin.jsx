import React from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import LoginForm from "../../components/LoginForm";
import SignupForm from "../../components/SignupForm";
import OtpVerificationModal from "../../components/OtpVerificationModal";
import SuccessModal from "../../components/SuccessModal";
import { authAPI, otpAPI } from "../../services/api";

function LoginPage() {
  const navigate = useNavigate();
  const [showSignup, setShowSignup] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showOtpModal, setShowOtpModal] = React.useState(false);
  const [pendingUser, setPendingUser] = React.useState(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  /* ========================= LOGIC ========================= */
  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await authAPI.login(email, password);

      if (response.success) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("userRole", response.user.role);
        localStorage.setItem("userId", response.user.id);
        localStorage.setItem("userName", response.user.name);
        localStorage.setItem("userEmail", response.user.email);

        const role = response.user.role;
        if (role === "admin") navigate("/admin/dashboard");
        else if (role === "venue-owner") navigate("/venue-owner/dashboard");
        else navigate("/");
      } else if (response.requiresVerification) {
        setPendingUser({
          email: response.user.email,
          name: response.user.name,
        });
        await otpAPI.resendOtp(response.user.email, response.user.name);
        setShowOtpModal(true);
      } else {
        setError(response.message || "Login failed.");
      }
    } catch (err) {
      setError(err.message || "Connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credential) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await authAPI.googleLogin(credential);

      if (response.success) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("userRole", response.user.role);
        localStorage.setItem("userId", response.user.id);
        localStorage.setItem("userName", response.user.name);
        localStorage.setItem("userEmail", response.user.email);

        const role = response.user.role;
        if (role === "admin") navigate("/admin/dashboard");
        else if (role === "venue-owner") navigate("/venue-owner/dashboard");
        else navigate("/");
      } else {
        setError(response.message || "Google Login failed.");
      }
    } catch (err) {
      setError(err.message || "Connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (formData) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await authAPI.register(formData);
      if (response.success) {
        setPendingUser({
          email: formData.email,
          name: formData.name,
        });
        setShowOtpModal(true);
        setShowSignup(false);
      } else {
        setError(response.message || "Signup failed.");
      }
    } catch (err) {
      setError("Connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerified = () => {
    setShowOtpModal(false);
    setPendingUser(null);
    setShowSuccessModal(true);
  };

  const handleOtpModalClose = () => {
    setShowOtpModal(false);
    setError("Please verify your email to continue.");
  };

  /* ========================= UI ========================= */

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-night-blue-shadow relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-sand-tan blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-night-blue blur-3xl"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-sand-tan rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-night-blue-shadow font-black text-3xl">S</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Find Your Perfect<br />
            <span className="text-sand-tan">Event Venue</span>
          </h2>
          <p className="text-white/70 text-lg max-w-sm mx-auto leading-relaxed">
            Discover and book stunning venues for weddings, corporate events, and celebrations across Nepal.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[["500+", "Venues"], ["10k+", "Events"], ["4.9★", "Rating"]].map(([val, label]) => (
              <div key={label} className="bg-white/10 rounded-2xl p-4">
                <p className="text-sand-tan font-black text-2xl">{val}</p>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen">
        <Navigation />
        <div className="w-full max-w-md mt-16 lg:mt-0">
          {showSignup ? (
            <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
              <SignupForm
                onSignup={handleSignup}
                onGoogleLogin={handleGoogleLogin}
                onBackClick={() => {
                  setShowSignup(false);
                  setError("");
                }}
                isLoading={isLoading}
                error={error}
              />
            </div>
          ) : (
            <LoginForm
              onLogin={handleLogin}
              onGoogleLogin={handleGoogleLogin}
              onSignupClick={() => {
                setShowSignup(true);
                setError("");
              }}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && pendingUser && (
        <OtpVerificationModal
          email={pendingUser.email}
          name={pendingUser.name}
          onVerified={handleOtpVerified}
          onClose={handleOtpModalClose}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          title="Email Verified!"
          message="Your email has been verified successfully. You can now login."
          onClose={() => setShowSuccessModal(false)}
          autoClose={4000}
        />
      )}
    </div>
  );
}

export default LoginPage;
