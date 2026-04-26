import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { venueRegistrationAPI, venueAPI, bookingAPI, menuAPI, packageAPI, chatAPI } from "../../services/api";
import ChatBox from "../../components/ChatBox";

function VenueDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [registrationData, setRegistrationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [venueId, setVenueId] = useState(null);
  const [venueBookings, setVenueBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    pendingRequests: 0,
    confirmedEvents: 0,
    totalMenus: 0,
    totalPackages: 0
  });
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  // Fetch registration status on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Fetch registration
        const regResponse = await venueRegistrationAPI.getMyRegistration(token);
        if (regResponse.success && regResponse.exists && regResponse.registration) {
          setRegistrationData(regResponse.registration);
          
          let vId = regResponse.registration.venue?._id || regResponse.registration.venue || null;

          if (!vId) {
            const venuesResponse = await venueAPI.getMyVenues(token);
            if (venuesResponse.success && Array.isArray(venuesResponse.venues) && venuesResponse.venues.length > 0) {
              vId = venuesResponse.venues[0]._id;
            }
          }

          if (!vId) {
            vId = regResponse.registration._id;
          }

          setVenueId(vId);
          
          if (vId) {
            // Fetch bookings
            const bookingsResponse = await bookingAPI.getVenueBookings(token, vId);
            const bookings = bookingsResponse.bookings || [];
            const pendingBookings = bookings.filter(b => b.status === 'pending').length;
            const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;

            // Fetch menus
            const menusResponse = await menuAPI.getVenueMenus(vId);
            const menus = menusResponse.menus || [];

            // Fetch packages
            const packagesResponse = await packageAPI.getVenuePackages(vId);
            const packages = packagesResponse.packages || [];

            setVenueBookings(bookings);
            const recentSortedBookings = bookings
              .slice()
              .sort((a, b) => new Date(b.eventDate || b.createdAt) - new Date(a.eventDate || a.createdAt))
              .slice(0, 5);
            setRecentBookings(recentSortedBookings);

            setMetrics({
              totalBookings: bookings.length,
              pendingRequests: pendingBookings,
              confirmedEvents: confirmedBookings,
              totalMenus: menus.length,
              totalPackages: packages.length
            });

            // Fetch conversations
            try {
              const conversationsResponse = await chatAPI.getVenueConversations(token, vId);
              if (conversationsResponse.success) {
                setConversations(conversationsResponse.conversations || []);
              } else {
                console.error('Failed to fetch conversations:', conversationsResponse.message);
                setConversations([]);
              }
            } catch (error) {
              console.error('Error fetching conversations:', error);
              setConversations([]);
            }
          }
        } else {
          setRegistrationData(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setRegistrationData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Helper function to check if any section is rejected
  const hasRejectedSections = () => {
    if (!registrationData) return false;

    const statusFields = [
      registrationData.venueNameStatus?.status,
      registrationData.phoneStatus?.status,
      registrationData.locationStatus?.status,
      registrationData.profileImageStatus?.status,
      registrationData.venueImagesStatus?.status,
      registrationData.documents?.citizenshipFrontStatus?.status,
      registrationData.documents?.citizenshipBackStatus?.status,
      registrationData.documents?.businessRegistrationStatus?.status,
      registrationData.documents?.panCardStatus?.status,
    ];

    return statusFields.some(status => status === "REJECTED");
  };

  // Determine if action banner should be shown
  const shouldShowActionBanner = () => {
    if (isLoading) return false;

    // No registration exists - show banner to start registration
    if (!registrationData) return true;

    const status = registrationData.registrationStatus;

    // Show banner if:
    // 1. Draft (not submitted yet)
    // 2. Has rejected sections that need correction
    // 3. Overall status is REJECTED
    if (status === "DRAFT" || status === "NOT_SUBMITTED") return true;
    if (hasRejectedSections()) return true;
    if (status === "REJECTED") return true;

    return false;
  };

  // Get action banner message based on status
  const getActionBannerInfo = () => {
    if (!registrationData) {
      return {
        title: "Complete Your Venue Registration",
        message: "Add your venue details, upload images, and submit for verification to start accepting bookings.",
        buttonText: "Start Registration",
        urgent: false
      };
    }

    const status = registrationData.registrationStatus;

    if (hasRejectedSections()) {
      return {
        title: "Action Required: Update Rejected Sections",
        message: "Some sections of your registration have been rejected. Please update them and resubmit.",
        buttonText: "Fix & Resubmit",
        urgent: true
      };
    }

    if (status === "REJECTED") {
      return {
        title: "Registration Rejected",
        message: "Your registration has been rejected. Please review the feedback and resubmit.",
        buttonText: "Review & Resubmit",
        urgent: true
      };
    }

    if (status === "DRAFT" || status === "NOT_SUBMITTED") {
      return {
        title: "Complete Your Venue Registration",
        message: "Your registration is incomplete. Add your venue details and submit for verification.",
        buttonText: "Continue Registration",
        urgent: false
      };
    }

    return {
      title: "Complete Your Venue Registration",
      message: "Add your venue details, upload images, and submit for verification to start accepting bookings.",
      buttonText: "Continue Registration",
      urgent: false
    };
  };

  // ==================== SECTION A: ACTION BANNER ====================
  const ActionBanner = () => {
    // Show loading skeleton while fetching
    if (isLoading) {
      return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-40"></div>
        </div>
      );
    }

    if (!shouldShowActionBanner()) return null;

    const bannerInfo = getActionBannerInfo();

    // Determine progress steps based on registration data
    const getProgressSteps = () => {
      if (!registrationData) {
        return [
          { label: "Account Created", done: true },
          { label: "Venue Details", done: false },
          { label: "Upload Images", done: false },
          { label: "Verification", done: false },
          { label: "Go Live", done: false },
        ];
      }

      const status = registrationData.registrationStatus;
      const hasVenueDetails = registrationData.venueName && registrationData.phone;
      const hasImages = registrationData.venueImages?.length > 0;
      const hasDocs = registrationData.documents?.citizenshipFront?.url;

      return [
        { label: "Account Created", done: true },
        { label: "Venue Details", done: hasVenueDetails },
        { label: "Upload Images", done: hasImages && hasDocs },
        { label: "Verification", done: status === "APPROVED" },
        { label: "Go Live", done: status === "APPROVED" },
      ];
    };

    const steps = getProgressSteps();
    const currentStep = steps.findIndex(s => !s.done) + 1 || steps.length;

    return (
      <div className={`rounded-2xl p-6 border shadow-sm ${bannerInfo.urgent ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}>
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${bannerInfo.urgent ? "bg-red-500" : "bg-amber-400"}`}></span>
              <span className={`text-xs font-medium uppercase tracking-wide ${bannerInfo.urgent ? "text-red-600" : "text-amber-600"}`}>
                {bannerInfo.urgent ? "Urgent Action Required" : "Action Required"}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{bannerInfo.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{bannerInfo.message}</p>
            <button
              onClick={() => navigate("/venue-owner/registration")}
              className={`mt-4 px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-colors ${
                bannerInfo.urgent ? "bg-red-600 hover:bg-red-700" : "bg-night-blue hover:bg-night-blue-shadow"
              }`}
            >
              {bannerInfo.buttonText}
            </button>
          </div>

          {/* Progress Steps */}
          <div className="hidden xl:flex items-center gap-1 flex-shrink-0">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      step.done
                        ? "bg-emerald-500 text-white"
                        : i === currentStep - 1
                        ? "bg-night-blue text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step.done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-[10px] mt-1.5 w-16 text-center ${step.done || i === currentStep - 1 ? "text-gray-700" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mb-5 ${step.done ? "bg-emerald-500" : "bg-gray-200"}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ==================== SECTION B: KEY METRICS ====================
  const MetricCard = ({ title, value, subtitle, icon, trend, trendUp }) => (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
              <svg className={`w-3 h-3 ${trendUp ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {trend}
            </p>
          )}
          {subtitle && !trend && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );

  const KeyMetrics = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <MetricCard
        title="Total Bookings"
        value={metrics.totalBookings}
        subtitle="From all customers"
        icon={
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />
      <MetricCard
        title="Pending Requests"
        value={metrics.pendingRequests}
        subtitle="Awaiting your response"
        icon={
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <MetricCard
        title="Confirmed Events"
        value={metrics.confirmedEvents}
        subtitle="Bookings confirmed"
        icon={
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <MetricCard
        title="Total Menus"
        value={metrics.totalMenus}
        subtitle={`${metrics.totalPackages} packages`}
        icon={
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h6m0 0h6" />
          </svg>
        }
      />
    </div>
  );

  // ==================== SECTION C: INSIGHTS ====================
  const BarChart = () => {
    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const bookingsByMonth = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      bookingsByMonth[key] = { month: monthNames[d.getMonth()], value: 0 };
    }

    venueBookings.forEach((booking) => {
      const date = new Date(booking.eventDate || booking.createdAt);
      if (!date || Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (bookingsByMonth[key]) {
        bookingsByMonth[key].value += 1;
      }
    });

    const data = Object.values(bookingsByMonth);
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-900">Monthly Bookings</h3>
          <span className="text-xs text-gray-400">Last 6 months</span>
        </div>
        <div className="flex items-end justify-between gap-3 h-52">
          {data.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <span className="text-xs font-medium text-gray-600 mb-2">{item.value}</span>
              <div className="w-full bg-gray-50 rounded-lg relative" style={{ height: "160px" }}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-night-blue to-night-blue-shadow rounded-lg transition-all duration-500"
                  style={{ height: `${(item.value / max) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-500 mt-2 font-medium">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DonutChart = () => {
    const pending = venueBookings.filter((b) => b.status === "pending").length;
    const confirmed = venueBookings.filter((b) => b.status === "confirmed").length;
    const completed = venueBookings.filter((b) => b.status === "completed").length;
    const total = pending + confirmed + completed || 1;

    const data = [
      { label: "Pending", value: pending, color: "#f59e0b" },
      { label: "Confirmed", value: confirmed, color: "#10b981" },
      { label: "Completed", value: completed, color: "#1e3a8a" },
    ];
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
        <h3 className="text-sm font-semibold text-gray-900 mb-6">Booking Status</h3>
        <div className="flex items-center justify-center gap-12">
          <div className="relative">
            <svg width="120" height="120" viewBox="0 0 100 100">
              {data.map((item, i) => {
                const pct = item.value / total;
                const dash = pct * circumference;
                const currentOffset = offset;
                offset += dash;
                return (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${circumference}`}
                    strokeDashoffset={-currentOffset}
                    transform="rotate(-90 50 50)"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{venueBookings.length}</span>
              <span className="text-xs text-gray-500">Total</span>
            </div>
          </div>
          <div className="space-y-4">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ==================== SECTION D: ACTIVITY & ACTIONS ====================
  const RecentActivity = () => {
    const bookings = recentBookings && recentBookings.length ? recentBookings : [];

    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-gray-900">Recent Booking Requests</h3>
          <button
            onClick={() => navigate("/venue-owner/bookings/requests")}
            className="text-xs font-medium text-night-blue hover:underline"
          >
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Event</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-sm text-gray-500">
                    No recent booking requests.
                  </td>
                </tr>
              ) : (
                bookings.map((b, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer">
                    <td className="py-3">
                      <p className="text-sm font-medium text-gray-900">{b.selectedPackage?.packageName || b.eventType || 'Booking'}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-sm text-gray-600">{b.user?.name || b.user?.email || 'Unknown'}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-sm text-gray-500">{new Date(b.eventDate || b.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-sm font-medium text-gray-900">₹{b.totalPrice || 0}</p>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        b.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : b.status === "completed" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const QuickActions = () => {
    console.log('VenueDashboard - Registration Data:', registrationData);
    console.log('VenueDashboard - Extracted venueId:', venueId);
    console.log('VenueDashboard - Button disabled?', !venueId);

    const actions = [
      {
        label: "Manage Menu & Packages",
        desc: "Add menus, items & packages",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ),
        color: "text-orange-600 bg-orange-50",
        path: venueId ? `/venue-owner/menu/${venueId}` : null,
        disabled: !venueId,
      },
      {
        label: "Edit Details",
        desc: "Update venue info",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        color: "text-blue-600 bg-blue-50",
        path: venueId ? `/venue-owner/edit-venue/${venueId}` : null,
        disabled: !venueId,
      },
      {
        label: "View Bookings",
        desc: "Check requests",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        color: "text-amber-600 bg-amber-50",
        path: "/venue-owner/bookings/requests",
      },
    ];

    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => {
                if (a.path && !a.disabled) {
                  navigate(a.path);
                } else if (a.disabled) {
                  alert('Pending registration approval. Please complete your registration first.');
                }
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-center ${
                a.disabled
                  ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                  : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
              }`}
              title={a.disabled ? 'Pending registration approval' : a.label}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                {a.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{a.label}</p>
                <p className="text-[10px] text-gray-500">{a.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const ChatSection = () => {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">Customer Messages</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Messages from customers will appear here</p>
            </div>
          ) : (
            conversations.map((conv, i) => (
              <div
                key={conv.userId || i}
                onClick={() => conv.userId && conv.userName && setSelectedChat({ userId: conv.userId, userName: conv.userName })}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-night-blue flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {conv.userName ? conv.userName.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{conv.userName || 'Unknown User'}</p>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.text || 'No message'}</p>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleDateString() : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Section A: Action Banner */}
      <ActionBanner />

      {/* Section B: Key Metrics */}
      <KeyMetrics />

      {/* Section C: Insights - Full width split */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <BarChart />
        </div>
        <div className="xl:col-span-2">
          <DonutChart />
        </div>
      </div>

      {/* Section D: Activity & Actions - Full width split */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <RecentActivity />
        </div>
        <div className="xl:col-span-1">
          <QuickActions />
        </div>
      </div>

      {/* Section E: Chat */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <ChatSection />
        </div>
        <div className="xl:col-span-2">
          {selectedChat && venueId && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <ChatBox
                venueId={venueId}
                otherUserId={selectedChat.userId}
                title={`Chat with ${selectedChat.userName}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VenueDashboard;
