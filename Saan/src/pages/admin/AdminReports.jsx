import React, { useState, useEffect } from "react";
import { reportAPI } from "../../services/api";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { FaChartLine, FaWallet, FaTicketAlt, FaUserPlus, FaArrowUp } from "react-icons/fa";

const COLORS = ['#2d545e', '#e1b382', '#10b981', '#f59e0b', '#ef4444'];

function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getDashboardStats(token);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to fetch report data");
      }
    } catch (err) {
      console.error("Report fetch error:", err);
      setError("Server connection failed. Please check your backend.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-night-blue/20 border-t-night-blue rounded-full animate-spin"></div>
    </div>
  );

  const formatMonth = (m, y) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[m-1]} ${y}`;
  };

  const revenueData = data?.revenueTrends.map(item => ({
    name: formatMonth(item._id.month, item._id.year),
    revenue: item.revenue,
    bookings: item.count
  })) || [];

  const registrationData = data?.registrationStats.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  const roleData = data?.userDistribution.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  const venueGrowthData = data?.venueTrends.map(item => ({
    name: formatMonth(item._id.month, item._id.year),
    count: item.count
  })) || [];

  const userGrowthData = data?.userTrends.map(item => ({
    name: formatMonth(item._id.month, item._id.year),
    count: item.count
  })) || [];

  // Calculate dynamic growth
  const calculateGrowth = () => {
    if (revenueData.length < 2) return 0;
    const currentMonth = revenueData[revenueData.length - 1].revenue;
    const lastMonth = revenueData[revenueData.length - 2].revenue;
    if (lastMonth === 0) return currentMonth > 0 ? 100 : 0;
    return ((currentMonth - lastMonth) / lastMonth) * 100;
  };

  const growth = calculateGrowth();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-night-blue-shadow">Platform Analytics</h1>
          <p className="text-gray-500 font-medium mt-1">Comprehensive insights into growth, revenue, and platform activity.</p>
        </div>
        <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 border ${growth >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <div className={`p-2 rounded-lg text-white ${growth >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
            <FaChartLine />
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {growth >= 0 ? 'Revenue Growth' : 'Revenue Decline'}
            </p>
            <p className={`text-sm font-black ${growth >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% vs last month
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-50 border-l-8 border-red-500 text-red-700 font-bold rounded-2xl shadow-lg">
          <p className="text-xl font-black">⚠️ Connection Error</p>
          <p className="text-sm opacity-70 mt-1">{error}</p>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: `Rs. ${revenueData.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}`, icon: <FaWallet />, color: "bg-night-blue" },
          { label: "Total Bookings", value: revenueData.reduce((acc, curr) => acc + curr.bookings, 0), icon: <FaTicketAlt />, color: "bg-sand-tan" },
          { label: "Active Owners", value: roleData.find(r => r.name === 'venue-owner')?.value || 0, icon: <FaUserPlus />, color: "bg-emerald-500" },
          { label: "Platform Users", value: roleData.reduce((acc, curr) => acc + curr.value, 0), icon: <FaUserPlus />, color: "bg-blue-500" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 flex items-center gap-6 hover:shadow-2xl transition duration-500">
            <div className={`w-14 h-14 ${stat.color} text-white rounded-2xl flex items-center justify-center text-xl shadow-lg`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-night-blue-shadow">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
          <h3 className="font-black text-night-blue-shadow uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
            <div className="w-2 h-2 bg-night-blue rounded-full"></div>
            Financial Performance (Last 6 Months)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d545e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2d545e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="revenue" stroke="#2d545e" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 flex flex-col">
          <h3 className="font-black text-night-blue-shadow uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
            <div className="w-2 h-2 bg-sand-tan rounded-full"></div>
            Venue Pipeline
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={registrationData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {registrationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
          <h3 className="font-black text-night-blue-shadow uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            New Venues Per Month
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={venueGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#e1b382" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
          <h3 className="font-black text-night-blue-shadow uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            New Users Per Month
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#2d545e" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-black text-night-blue-shadow uppercase tracking-widest text-xs">Recent Platform Bookings</h3>
          <span className="px-3 py-1 bg-night-blue text-white text-[10px] font-black rounded-full uppercase tracking-widest">Live Feed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-gray-50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Venue</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Paid</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.recentBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50/30 transition">
                  <td className="px-8 py-6">
                    <p className="font-black text-night-blue-shadow text-sm">{booking.user?.name || "Guest"}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{booking.user?.email}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-night-blue-shadow text-xs">{booking.venue?.name}</p>
                    <p className="text-[10px] text-gray-400">{booking.venue?.city}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-gray-600">{new Date(booking.eventDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-sm font-black text-night-blue">Rs. {booking.paidAmount?.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      ['confirmed', 'completed'].includes(booking.status) ? 'bg-emerald-100 text-emerald-700' : 
                      booking.status === 'booked' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Users Section */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-black text-night-blue-shadow uppercase tracking-widest text-xs">Recently Joined Users</h3>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.recentRegistrations.slice(0, 6).map((reg) => (
              <div key={reg._id} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-night-blue font-black shadow-sm">
                  {reg.owner?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="font-black text-night-blue-shadow text-sm">{reg.owner?.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{reg.venueName || "Owner Candidate"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;
