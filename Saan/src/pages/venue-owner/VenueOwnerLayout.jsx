import React, { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { notificationAPI, venueRegistrationAPI, venueAPI } from "../../services/api";
import { 
  FaBell, 
  FaUserCircle, 
  FaChevronDown, 
  FaSignOutAlt, 
  FaSearch, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaHistory 
} from "react-icons/fa";

function VenueOwnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [venueId, setVenueId] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Venue Owner");
    setUserEmail(localStorage.getItem("userEmail") || "owner@venue.com");
    
    // Fetch registration data to get venueId
    const fetchVenueId = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const response = await venueRegistrationAPI.getMyRegistration(token);
        if (response.success && response.registration) {
          const venueIdValue = response.registration.venue ? (response.registration.venue._id || response.registration.venue) : null;

          if (venueIdValue) {
            setVenueId(venueIdValue);
            console.log("Venue ID set from registration:", venueIdValue);
          } else {
            console.warn("No venue ID found in registration, trying owner venues...");

            const venuesResponse = await venueAPI.getMyVenues(token);
            if (venuesResponse.success && Array.isArray(venuesResponse.venues) && venuesResponse.venues.length > 0) {
              setVenueId(venuesResponse.venues[0]._id);
              console.log("Venue ID set from owner venues:", venuesResponse.venues[0]._id);
            } else {
              console.warn("No venues found for owner");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching venue ID:", error);
      }
    };
    
    fetchVenueId();
  }, []);

  // Fetch unread count on mount and periodically
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await notificationAPI.getUnreadCount(token);
      if (response.success) {
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setNotificationLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await notificationAPI.getNotifications(token, { limit: 10 });
      if (response.success) {
        setNotifications(response.notifications);
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (notificationOpen) {
      fetchNotifications();
    }
  }, [notificationOpen, fetchNotifications]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await notificationAPI.markAsRead(token, notificationId);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await notificationAPI.markAllAsRead(token);
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    if (notification.data?.link) {
      navigate(notification.data.link);
      setNotificationOpen(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Get page title based on current route
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return { title: "Dashboard", subtitle: "Overview of your venue performance" };
    if (path.includes("/registration")) return { title: "Venue Registration", subtitle: "Register and manage your venue details" };
    if (path.includes("/timely-booked")) return { title: "Timely Booked", subtitle: "Holdings pending payment (5-hour window)" };
    if (path.includes("/booked")) return { title: "Booked", subtitle: "Confirmed bookings with successful payments" };
    if (path.includes("/calendar")) return { title: "Venue Calendar", subtitle: "Visual overview of all bookings" };
    if (path.includes("/events-gallery")) return { title: "Events & Gallery", subtitle: "Showcase your past events and venue photos" };
    if (path.includes("/menu")) return { title: "Menu & Package Management", subtitle: "Create menus, packages, and add-ons" };
    if (path.includes("/profile")) return { title: "Settings", subtitle: "Manage your account settings" };
    return { title: "Dashboard", subtitle: "Overview of your venue performance" };
  };

  const pageInfo = getPageInfo();

  // Navigation items
  const navItems = [
    {
      path: "/venue-owner/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: "/venue-owner/registration",
      label: "Venue Registration",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: "timely-booked",
      label: "Timely Booked",
      path: "/venue-owner/timely-booked",
      icon: <FaHistory className="w-5 h-5" />,
      color: "blue"
    },
    {
      id: "booked",
      label: "Booked",
      path: "/venue-owner/booked",
      icon: <FaCheckCircle className="w-5 h-5" />,
      color: "green"
    },
    {
      id: "calendar",
      label: "Calendar",
      path: "/venue-owner/calendar",
      icon: <FaCalendarAlt className="w-5 h-5" />,
      color: "purple"
    },
    {
      path: "/venue-owner/events-gallery",
      label: "Events & Gallery",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      path: "/venue-owner/menu",
      label: "Menu Management",
      isDynamic: true, // Mark as dynamic
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
        </svg>
      ),
    },
    {
      path: "/venue-owner/profile",
      label: "Settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    // Auto-expand bookings if on bookings page
    if (location.pathname.includes("/bookings")) {
      setExpandedItem("Bookings");
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-sand-tan">
      {/* ========== SIDEBAR ========== */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-night-blue-shadow border-r border-white/10 flex flex-col z-50">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sand-tan rounded-lg flex items-center justify-center">
              <span className="text-night-blue font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-base">SAAN</h1>
              <p className="text-sand-tan text-[10px] leading-none">Venue Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.subItems ? (
                  // Item with sub-menu
                  <div>
                    <button
                      onClick={() => setExpandedItem(expandedItem === item.label ? null : item.label)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname.includes("/bookings")
                          ? "text-night-blue bg-sand-tan"
                          : "text-white hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${expandedItem === item.label ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedItem === item.label && (
                      <ul className="mt-1 ml-8 space-y-1">
                        {item.subItems.map((sub) => (
                          <li key={sub.path}>
                            <NavLink
                              to={sub.path}
                              className={({ isActive }) =>
                                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                                  isActive
                                    ? "text-night-blue bg-sand-tan font-medium"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                                }`
                              }
                            >
                              {sub.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  // Regular item or dynamic item
                  item.isDynamic ? (
                    <button
                      onClick={() => {
                        if (venueId) {
                          navigate(`/venue-owner/menu/${venueId}`);
                        } else {
                          alert("Venue ID not found. Please complete your registration first.");
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname.includes("/menu")
                          ? "text-night-blue bg-sand-tan font-medium"
                          : "text-white hover:bg-white/10"
                      }`}
                    >
                      <span className="text-white">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <NavLink
                      to={item.path}
                      end={item.path === "/venue-owner/dashboard"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "text-night-blue bg-sand-tan font-medium"
                            : "text-white hover:bg-white/10"
                        }`
                      }
                    >
                      <span className="text-white">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  )
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white hover:text-red-400 hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <div className="ml-60">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="h-full px-8 flex items-center justify-between">
            {/* Page Title */}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{pageInfo.title}</h1>
              <p className="text-sm text-gray-500">{pageInfo.subtitle}</p>
            </div>

            {/* Right Side - Notifications & Profile */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-purple-800 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notificationLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-purple-800 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-gray-500 text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification._id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                            !notification.read ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              !notification.read ? "bg-purple-800" : "bg-transparent"
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notification.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={() => { setNotificationOpen(false); navigate("/venue-owner/notifications"); }}
                        className="w-full text-center text-sm text-purple-800 hover:underline"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown - SINGLE LOCATION */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 bg-night-blue rounded-full flex items-center justify-center">
                  <span className="text-sand-tan font-medium text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-night-blue">{userName}</p>
                  <p className="text-xs text-night-blue-shadow opacity-75">Venue Owner</p>
                </div>
                <svg
                  className={`w-4 h-4 text-heavy-purple transition-transform ${profileOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { navigate("/venue-owner/profile"); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </button>
                    <button
                      onClick={() => { navigate("/venue-owner/profile"); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Account Settings
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default VenueOwnerLayout;
