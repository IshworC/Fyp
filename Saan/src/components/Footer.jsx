import React from "react";

function Footer() {
  return (
    <footer className="bg-[#5d0f0f] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-3 items-center mb-8">
          {/* Left - Logo */}
          <div className="flex items-center space-x-3">
            <img
              src="src/assets/logo.png"
              alt="SAN Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="text-xl font-bold">SAAN</span>
          </div>

          {/* Center - Copyright */}
          <div className="text-center">
            <p className="text-gray-300 text-sm">
              &copy; 2025 SAAN Venues. All rights reserved.
            </p>
          </div>

          {/* Right - Social Media Links */}
          <div className="flex justify-end space-x-6">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors text-2xl"
              title="Facebook"
            >
              f
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors text-2xl"
              title="Instagram"
            >
              📷
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors text-2xl"
              title="TikTok"
            >
              🎵
            </a>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-700 pt-8">
          <div className="text-center text-sm text-gray-300">
            <p>&copy; 2025 SAAN Venues. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
