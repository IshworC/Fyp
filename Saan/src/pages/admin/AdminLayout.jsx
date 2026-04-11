import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { notificationAPI } from "../../services/api";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Admin");
    setUserEmail(localStorage.getItem("userEmail") || "admin@saan.com");

    // Fetch notifications on mount
    fetchUnreadCount();
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await notificationAPI.getUnreadCount(token);
      if (response.success) {
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await notificationAPI.getNotifications(token, { limit: 10 });
      if (response.success) {
        setNotifications(response.notifications);
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await notificationAPI.markAsRead(token, id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
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
      console.error("Failed to mark all as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    // Navigate to the link if available
    if (notification.data?.link) {
      setNotificationOpen(false);
      navigate(notification.data.link);
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_REGISTRATION':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'REGISTRATION_RESUBMITTED':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      case 'DOCUMENT_UPDATED':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  // Close dropdown when clicking outside
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
    if (path.includes("/dashboard") && !path.includes("/registrations"))
      return { title: "Dashboard", subtitle: "Overview of platform performance" };
    if (path.includes("/registrations/all"))
      return { title: "All Registrations", subtitle: "View all venue registration requests" };
    if (path.includes("/registrations/pending"))
      return { title: "Pending Registrations", subtitle: "New registration requests awaiting review" };
    if (path.includes("/registrations/under-review"))
      return { title: "Under Review", subtitle: "Registrations currently being processed" };
    if (path.includes("/registrations/approved"))
      return { title: "Approved Registrations", subtitle: "Successfully verified venues" };
    if (path.includes("/registrations/rejected"))
      return { title: "Rejected Registrations", subtitle: "Registrations that were declined" };
    if (path.includes("/users"))
      return { title: "User Management", subtitle: "Manage platform users" };
    if (path.includes("/venues"))
      return { title: "Venue Management", subtitle: "Manage registered venues" };
    if (path.includes("/bookings"))
      return { title: "Booking Management", subtitle: "Monitor all platform bookings" };
    if (path.includes("/reports"))
      return { title: "Reports & Analytics", subtitle: "Platform statistics and insights" };
    if (path.includes("/settings"))
      return { title: "Settings", subtitle: "Platform configuration" };
    return { title: "Dashboard", subtitle: "Overview of platform performance" };
  };

  const pageInfo = getPageInfo();

  // Navigation items
  const navItems = [
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: "/admin/registrations",
      label: "Registrations",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      subItems: [
        { path: "/admin/registrations/all", label: "All Requests" },
        { path: "/admin/registrations/pending", label: "Pending" },
        { path: "/admin/registrations/under-review", label: "Under Review" },
        { path: "/admin/registrations/approved", label: "Approved" },
        { path: "/admin/registrations/rejected", label: "Rejected" },
      ],
    },
    {
      path: "/admin/users",
      label: "Users",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      path: "/admin/venues",
      label: "Venues",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      path: "/admin/bookings",
      label: "Bookings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      path: "/admin/reports",
      label: "Reports",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      path: "/admin/settings",
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
    // Auto-expand registrations if on registrations page
    if (location.pathname.includes("/registrations")) {
      setExpandedItem("Registrations");
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* ========== SIDEBAR ========== */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#1a1a2e] flex flex-col z-50">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#5d0f0f] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">SAAN</h1>
              <p className="text-gray-400 text-[10px] leading-none">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Main Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.subItems ? (
                  // Item with sub-menu
                  <div>
                    <button
                      onClick={() => setExpandedItem(expandedItem === item.label ? null : item.label)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname.includes("/registrations")
                          ? "text-white bg-white/10"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={location.pathname.includes("/registrations") ? "text-[#5d0f0f]" : ""}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedItem === item.label ? "rotate-180" : ""}`}
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
                                    ? "text-white bg-[#5d0f0f] font-medium"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
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
                  // Regular item
                  <NavLink
                    to={item.path}
                    end={item.path === "/admin/dashboard"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "text-white bg-white/10"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={isActive ? "text-[#5d0f0f]" : ""}>{item.icon}</span>
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Admin Profile in Sidebar */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 bg-[#5d0f0f] rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <div className="ml-64">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="h-full px-8 flex items-center justify-between">
            {/* Page Title */}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{pageInfo.title}</h1>
              <p className="text-sm text-gray-500">{pageInfo.subtitle}</p>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => {
                    setNotificationOpen(!notificationOpen);
                    if (!notificationOpen) fetchNotifications();
                  }}
                  className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-[#5d0f0f] hover:text-[#4a0c0c] font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#5d0f0f]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <span className="w-2 h-2 bg-[#5d0f0f] rounded-full flex-shrink-0 mt-1.5"></span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                        <button
                          onClick={() => {
                            setNotificationOpen(false);
                            navigate('/admin/notifications');
                          }}
                          className="w-full text-center text-sm text-[#5d0f0f] hover:text-[#4a0c0c] font-medium py-1"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <button className="px-4 py-2 bg-[#5d0f0f] text-white text-sm font-medium rounded-lg hover:bg-[#4a0c0c] transition-colors">
                Quick Actions
              </button>
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

export default AdminLayout;
