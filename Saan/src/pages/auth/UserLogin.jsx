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
    <div className="relative min-h-screen">
      <Navigation />

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('src/assets/loginpage.png')" }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Centered Form */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="w-full max-w-md bg-red/95 backdrop-blur-md rounded-xl shadow-2xl p-8">
          {showSignup ? (
            <SignupForm
              onSignup={handleSignup}
              onBackClick={() => {
                setShowSignup(false);
                setError("");
              }}
              isLoading={isLoading}
              error={error}
            />
          ) : (
            <LoginForm
              onLogin={handleLogin}
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
