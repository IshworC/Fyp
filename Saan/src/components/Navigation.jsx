import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaHome, FaBuilding, FaInfoCircle, FaHeadset } from 'react-icons/fa';
import NotificationBell from './NotificationBell';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({ role: '', name: '', isLoggedIn: false });

  // Get user info from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') || '';
    const name = localStorage.getItem('userName') || 'Guest';
    setUser({
      role,
      name,
      isLoggedIn: !!token
    });
  }, [location]);

  const handleLogout = () => {
    localStorage.clear();
    setUser({ role: '', name: 'Guest', isLoggedIn: false });
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'bg-white/20' : '';

  const getHomeRoute = () => {
    if (!user.isLoggedIn) return '/login';
    switch(user.role) {
      case 'admin': return '/admin/dashboard';
      case 'venue-owner': return '/venue-owner/dashboard';
      case 'user': default: return '/';
    }
  };

  const navLinks = [
    { path: '/browse-venue', icon: FaBuilding, label: 'Browse Venues' },
    { path: '/customer-inquiry', icon: FaHeadset, label: 'Support' },
    { path: '/about-us', icon: FaInfoCircle, label: 'About Us' }
  ];

  const homeRoute = getHomeRoute();

  // If not logged in, don't show navbar at all
  if (!user.isLoggedIn) {
    return null;
  }

  return (
    <nav className="fixed top-0 w-full bg-purple-800 text-white shadow-lg z-50">
      <div className="container mx-auto px-4 xl:px-8 2xl:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/src/assets/logo.png" 
              alt="SAAN Logo" 
              className="w-10 h-10 object-contain"
            />
            <Link to={homeRoute} className="text-xl font-bold">SAAN</Link>
          </div>

          {/* Desktop Navigation Links - Centered */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center space-x-1 lg:space-x-2">
              <Link 
                to={homeRoute} 
                className={`flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg hover:bg-white/10 transition-colors ${isActive('/') || isActive(homeRoute)}`}
              >
                <FaHome className="w-4 h-4" />
                <span className="text-sm lg:text-base">Home</span>
              </Link>
              
              {navLinks.map(({ path, icon: Icon, label }) => (
                <Link 
                  key={path} 
                  to={path} 
                  className={`flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg hover:bg-white/10 transition-colors ${isActive(path)}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm lg:text-base">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* User Info & Logout - Right side */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell - Only for logged in users */}
            {user.isLoggedIn && <NotificationBell />}

            <div className="hidden md:flex items-center space-x-3 bg-white/10 px-3 lg:px-4 py-2 rounded-full">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FaUser className="w-4 h-4" />
              </div>
              <div className="hidden lg:block text-sm">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs opacity-75 capitalize">{user.role || 'User'}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white flex items-center justify-center"
              title="Logout"
              aria-label="Logout"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;