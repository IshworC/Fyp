import Navigation from "../../components/Navigation";
import SignupForm from "../../components/SignupForm";


function SignupPage({ onBackClick }) {
  const handleSignup = (formData) => {
    console.log("Signup data:", formData);
    // This will be connected to backend API later
    alert("Signup successful! Please login with your credentials.");
    onBackClick();
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
      <Navigation />

      {/* Page Layout */}
      <div className="flex flex-1 items-center justify-center px-10 py-10 space-x-16">
        {/* Left Image */}
        <div className="w-[420px] h-auto shadow-xl rounded-lg overflow-hidden">
          <img
            src="src/assets/loginpage.png"
            alt="Decor"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Signup Form Component */}
        <SignupForm onSignup={handleSignup} onBackClick={onBackClick} />
      </div>
    </div>
  );
}

export default SignupPage;