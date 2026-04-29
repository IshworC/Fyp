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
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Admin");
    setUserEmail(localStorage.getItem("userEmail") || "admin@saan.com");
    fetchUnreadCount();
    fetchNotifications();
    const interval = setInterval(() => fetchUnreadCount(), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await notificationAPI.getUnreadCount(token);
      if (response.success) setUnreadCount(response.unreadCount);
    } catch (error) { console.error(error); }
  };

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
    } catch (error) { console.error(error); } finally { setLoadingNotifications(false); }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await notificationAPI.markAsRead(token, id);
      if (response.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        setUnreadCount(response.unreadCount);
      }
    } catch (error) { console.error(error); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getPageInfo = () => {
    const path = location.pathname;
    if (path.includes("/reports")) return { title: "Reports & Analytics", subtitle: "Platform statistics and insights" };
    if (path.includes("/users")) return { title: "User Management", subtitle: "Manage platform users" };
    if (path.includes("/venues")) return { title: "Venue Management", subtitle: "Manage registered venues" };
    if (path.includes("/bookings")) return { title: "Booking Management", subtitle: "Monitor all platform bookings" };
    return { title: "Dashboard", subtitle: "Overview of platform performance" };
  };

  const pageInfo = getPageInfo();

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/admin/users", label: "Users", icon: "👥" },
    { path: "/admin/venues", label: "Venues", icon: "🏢" },
    { path: "/admin/bookings", label: "Bookings", icon: "📅" },
    { path: "/admin/reports", label: "Reports", icon: "📈" },
  ];

  return (
    <div className="min-h-screen bg-sand-tan flex">
      {/* Sidebar */}
      <aside className="w-64 bg-night-blue-shadow text-white flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-black text-sand-tan">SAAN</h1>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-sand-tan text-night-blue font-black shadow-lg' : 'hover:bg-white/5'}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition font-bold text-sm">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <h2 className="text-xl font-black text-night-blue-shadow">{pageInfo.title}</h2>
            <p className="text-xs text-gray-400 font-bold">{pageInfo.subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
               <p className="text-sm font-black text-night-blue-shadow">{userName}</p>
               <p className="text-[10px] text-gray-400 font-bold">{userEmail}</p>
             </div>
             <div className="w-10 h-10 bg-sand-tan rounded-full flex items-center justify-center font-black text-night-blue shadow-inner">
               {userName.charAt(0)}
             </div>
          </div>
        </header>
        <main className="p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
