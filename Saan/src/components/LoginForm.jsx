import React from "react";

function LoginForm({ onLogin, onSignupClick, isLoading = false, error = "" }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    }
  };

  return (
    <form onSubmit={handleLogin} className="bg-gray-300 p-10 rounded-lg shadow-xl w-[380px]">
      <h1 className="text-3xl font-bold text-center text-[#5d0f0f] mb-6">Welcome to SAN</h1>

      {error && (
        <div className="bg-red-200 text-red-800 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <label className="block font-semibold text-[#5d0f0f] mt-4">Email / Number</label>
      <input
        type="text"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-3 py-2 rounded border"
        disabled={isLoading}
        required
      />

      <label className="block font-semibold text-[#5d0f0f] mt-4">Password</label>
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-3 py-2 rounded border"
        disabled={isLoading}
        required
      />

      <div className="flex justify-between text-sm mt-1">
        <label className="flex items-center space-x-1">
          <input type="checkbox" disabled={isLoading} /> <span>Remember password</span>
        </label>
        <button type="button" className="text-[#5d0f0f] hover:underline" disabled={isLoading}>Forgot password?</button>
      </div>

      <button 
        type="submit" 
        className="w-full bg-[#5d0f0f] text-white py-2 mt-5 rounded hover:bg-[#4a0c0c] disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>

      <div className="text-center text-sm mt-3">Don't have an account?</div>
      <button 
        type="button" 
        onClick={onSignupClick} 
        className="w-full bg-white text-[#5d0f0f] py-2 mt-2 rounded border hover:bg-gray-100 disabled:opacity-50"
        disabled={isLoading}
      >
        Signup
      </button>
    </form>
  );
}

export default LoginForm;
