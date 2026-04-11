import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminVenueRegistrationAPI, bookingAPI, menuAPI, packageAPI } from "../../services/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVenues: 0,
    totalBookings: 0,
    pendingRegistrations: 0,
    revenue: 0,
    activeVenues: 0,
  });
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        
        // Fetch all registrations
        const registrationResponse = await adminVenueRegistrationAPI.getAllRegistrations(token);
        const allRegistrations = registrationResponse.registrations || [];
        
        const pendingCount = allRegistrations.filter(r => r.registrationStatus === 'PENDING').length;
        const approvedVenues = allRegistrations.filter(r => r.registrationStatus === 'APPROVED').length;

        // Get total bookings (sum from all venues)
        let totalBookings = 0;
        for (const reg of allRegistrations) {
          if (reg.venue) {
            try {
              const bookingsResponse = await bookingAPI.getVenueBookings(reg.venue, token);
              totalBookings += (bookingsResponse.bookings || []).length;
            } catch (error) {
              // Skip if error fetching for this venue
            }
          }
        }

        setStats({
          totalUsers: 0, // Would need user API
          totalVenues: allRegistrations.length,
          totalBookings: totalBookings,
          pendingRegistrations: pendingCount,
          revenue: 0, // Would need payment API
          activeVenues: approvedVenues,
        });

        // Set recent registrations (last 5)
        const recent = allRegistrations
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(reg => ({
            id: reg._id,
            venueName: reg.venueName || 'N/A',
            owner: reg.owner?.name || 'Unknown',
            status: reg.registrationStatus || 'PENDING',
            date: new Date(reg.createdAt).toLocaleDateString()
          }));

        setRecentRegistrations(recent);
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: "bg-amber-100 text-amber-700",
      UNDER_REVIEW: "bg-blue-100 text-blue-700",
      APPROVED: "bg-emerald-100 text-emerald-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5d0f0f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, Admin!</h2>
            <p className="text-gray-300 mt-1">Here's what's happening with your platform today.</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/registrations/pending")}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              Review Registrations
            </button>
            <button className="px-4 py-2 bg-[#5d0f0f] hover:bg-[#4a0c0c] rounded-lg text-sm font-medium transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +12% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Venues */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Venues</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeVenues}</p>
              <p className="text-xs text-gray-500 mt-2">
                {stats.totalVenues} total registered
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +8% this week
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Registrations */}
        <div
          onClick={() => navigate("/admin/registrations/pending")}
          className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Reviews</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingRegistrations}</p>
              <p className="text-xs text-amber-600 mt-2">Requires your attention</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Recent Registrations</h3>
              <p className="text-sm text-gray-500">Latest venue registration requests</p>
            </div>
            <button
              onClick={() => navigate("/admin/registrations/all")}
              className="text-sm text-[#5d0f0f] hover:text-[#4a0c0c] font-medium"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentRegistrations.map((reg) => (
              <div
                key={reg.id}
                onClick={() => navigate(`/admin/registrations/${reg.status.toLowerCase()}`)}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{reg.venueName}</p>
                    <p className="text-sm text-gray-500">{reg.owner}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{reg.date}</span>
                  {getStatusBadge(reg.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats / Activity */}
        <div className="space-y-6">
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-[#5d0f0f] to-[#8b1a1a] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-white/80 font-medium">Platform Revenue</p>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">This Month</span>
            </div>
            <p className="text-3xl font-bold">Rs. {stats.revenue.toLocaleString()}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/80">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>+15.3% from last month</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/admin/registrations/pending")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 hover:bg-amber-100 rounded-lg text-left transition-colors"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Review Registrations</p>
                  <p className="text-xs text-gray-500">{stats.pendingRegistrations} pending</p>
                </div>
              </button>

              <button
                onClick={() => navigate("/admin/users")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Manage Users</p>
                  <p className="text-xs text-gray-500">{stats.totalUsers} total users</p>
                </div>
              </button>

              <button
                onClick={() => navigate("/admin/reports")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">View Reports</p>
                  <p className="text-xs text-gray-500">Analytics & insights</p>
                </div>
              </button>
            </div>
          </div>

          {/* Platform Status */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Platform Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">API Server</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Database</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">File Storage</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
