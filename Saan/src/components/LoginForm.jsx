import React, { useState } from "react";
import { GoogleLogin } from '@react-oauth/google';
import { authAPI } from "../services/api";

// ─── Forgot Password Modal ───────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState("email"); // "email" | "otp" | "success"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      if (res.success) {
        setMessage(res.message);
        setStep("otp");
      } else {
        setError(res.message || "Failed to send OTP.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.resetPassword(email, otp, newPassword);
      if (res.success) {
        setStep("success");
      } else {
        setError(res.message || "Failed to reset password.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>

        {step === "success" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
            <p className="text-gray-500 mb-6">Your password has been updated. You can now log in with your new password.</p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-night-blue text-white rounded-xl font-semibold hover:bg-night-blue-shadow transition-colors"
            >
              Back to Login
            </button>
          </div>
        ) : step === "otp" ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Enter OTP</h2>
              <p className="text-gray-500 text-sm mt-1">
                We sent a 6-digit code to <span className="font-semibold text-night-blue">{email}</span>
              </p>
            </div>
            {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm mb-4">{error}</div>}
            {message && <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 text-sm mb-4">{message}</div>}
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">OTP Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-night-blue/30 focus:border-night-blue text-gray-900 bg-gray-50 text-center text-lg tracking-widest font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-night-blue/30 focus:border-night-blue text-gray-900 bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-night-blue/30 focus:border-night-blue text-gray-900 bg-gray-50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-night-blue text-white rounded-xl font-semibold hover:bg-night-blue-shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting…" : "Reset Password"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setMessage(""); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your email and we'll send you a reset code.</p>
            </div>
            {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm mb-4">{error}</div>}
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-night-blue/30 focus:border-night-blue text-gray-900 bg-gray-50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-night-blue text-white rounded-xl font-semibold hover:bg-night-blue-shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending…" : "Send Reset Code"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Login Form ──────────────────────────────────────────────────────────
function LoginForm({ onLogin, onGoogleLogin, onSignupClick, isLoading = false, error = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) onLogin(email, password);
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-night-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-sand-tan font-black text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your SAAN account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-5 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Google Login */}
        <div className="mb-5 flex justify-center w-full">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (onGoogleLogin) {
                onGoogleLogin(credentialResponse.credential);
              }
            }}
            onError={() => {
              console.log('Login Failed');
            }}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="100%"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">or sign in with email</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-night-blue/30 focus:border-night-blue text-gray-900 bg-gray-50 transition-all"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-night-blue/30 focus:border-night-blue text-gray-900 bg-gray-50 transition-all"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-night-blue focus:ring-night-blue" disabled={isLoading} />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              disabled={isLoading}
              className="text-night-blue font-semibold hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-night-blue text-white rounded-xl font-bold text-base hover:bg-night-blue-shadow transition-all duration-200 shadow-lg shadow-night-blue/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Signing in…
              </span>
            ) : "Sign In"}
          </button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSignupClick}
            disabled={isLoading}
            className="text-night-blue font-bold hover:underline transition-colors"
          >
            Create account
          </button>
        </p>
      </div>
    </>
  );
}

export default LoginForm;
