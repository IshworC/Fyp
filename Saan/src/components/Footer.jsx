import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-night-blue-shadow text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
          {/* Branding */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img src="/src/assets/logo.png" alt="SAAN Logo" className="w-11 h-11 object-contain" />
              <span className="text-xl font-black text-white">SAAN</span>
            </div>
            <p className="text-white/75 text-sm leading-relaxed mb-5">
              Your trusted partner in finding the perfect venue for every occasion.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-sand-tan hover:text-night-blue-shadow transition-all duration-200 text-white">
                <FaFacebookF className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-sand-tan hover:text-night-blue-shadow transition-all duration-200 text-white">
                <FaInstagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-sand-tan hover:text-night-blue-shadow transition-all duration-200 text-white">
                <FaTiktok className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white text-base mb-5 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/browse-venue" className="text-white hover:text-sand-tan transition-colors text-sm">Browse Venues</Link></li>
              <li><a href="#" className="text-white hover:text-sand-tan transition-colors text-sm">How It Works</a></li>
              <li><a href="#" className="text-white hover:text-sand-tan transition-colors text-sm">Pricing</a></li>
              <li><a href="#" className="text-white hover:text-sand-tan transition-colors text-sm">Testimonials</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-white text-base mb-5 uppercase tracking-wider text-sm">Support</h4>
            <ul className="space-y-3">
              <li><Link to="/customer-inquiry" className="text-white hover:text-sand-tan transition-colors text-sm">Help Center</Link></li>
              <li><Link to="/customer-inquiry" className="text-white hover:text-sand-tan transition-colors text-sm">Contact Us</Link></li>
              <li><a href="#" className="text-white hover:text-sand-tan transition-colors text-sm">FAQs</a></li>
              <li><a href="#" className="text-white hover:text-sand-tan transition-colors text-sm">Booking Guide</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/60">
          <p>© {new Date().getFullYear()} SAAN Venues. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-white/60 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/60 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-white/60 hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
