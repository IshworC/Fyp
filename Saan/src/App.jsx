import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import AboutUs from './pages/user/AboutUs';
import BrowseVenue from './pages/user/BrowseVenue';
import UserVenueDetail from './pages/user/UserVenueDetail';
import CustomerInquiry from './pages/user/CustomerInquiry';
import UserHome from './pages/user/UserHome';

// Payment imports
import PaymentSuccess from './pages/user/PaymentSuccess';
import PaymentFailure from './pages/user/PaymentFailure';

// Admin imports
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import RegistrationList from './pages/admin/RegistrationList';
import { UsersPage, VenuesPage, BookingsPage, ReportsPage, SettingsPage } from './pages/admin/PlaceholderPages';

// Venue Owner imports
import VenueOwnerLayout from './pages/venue-owner/VenueOwnerLayout';
import VenueDashboard from './pages/venue-owner/VenueDashboard';
import VenueRegistration from './pages/venue-owner/VenueRegistration';
import BookingRequests from './pages/venue-owner/BookingRequests';
import BookingConfirmed from './pages/venue-owner/BookingConfirmed';
import BookingCompleted from './pages/venue-owner/BookingCompleted';
import CancelledBookings from './pages/venue-owner/CancelledBookings';
import VenueEventsAndGallery from './pages/venue-owner/VenueEventsAndGallery';
import VenueOwnerProfile from './pages/venue-owner/VenueOwnerProfile';
import VenueMenuAndPackageManagement from './pages/venue-owner/VenueMenuAndPackageManagement';
import EditVenueDetails from './pages/venue-owner/EditVenueDetails';
import TimelyBookings from './pages/venue-owner/TimelyBookings';
import BookedBookings from './pages/venue-owner/BookedBookings';
import VenueCalendar from './pages/venue-owner/VenueCalendar';

// Auth imports
import UserLogin from './pages/auth/UserLogin';
import Signup from './pages/auth/Signup';

function App() {
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return token !== null && token !== 'undefined' && token !== '';
  };

  // Modified ProtectedRoute to handle multiple allowed roles
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }

    const userRole = localStorage.getItem('userRole');
    
    // If no roles specified, allow all authenticated users
    if (allowedRoles.length === 0) {
      return children;
    }

    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(userRole)) {
      // Redirect based on user's actual role
      switch(userRole) {
        case 'admin':
          return <Navigate to="/admin/dashboard" replace />;
        case 'venue-owner':
          return <Navigate to="/venue-owner/dashboard" replace />;
        case 'user':
        default:
          return <Navigate to="/" replace />;
      }
    }

    return children;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes (No Authentication Required) */}
          <Route path="/login" element={<UserLogin />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected User Routes - Only accessible to authenticated 'user' role */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <>
                  <Navigation />
                  <UserHome />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/browse-venue"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin', 'venue-owner']}>
                <>
                  <Navigation />
                  <BrowseVenue />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/venue/:venueId"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin', 'venue-owner']}>
                <>
                  <Navigation />
                  <UserVenueDetail />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer-inquiry"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin', 'venue-owner']}>
                <>
                  <Navigation />
                  <CustomerInquiry />
                </>
              </ProtectedRoute>
            }
          />

          {/* About Us - Public or protected based on your preference */}
          <Route
            path="/about-us"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin', 'venue-owner']}>
                <>
                  <Navigation />
                  <AboutUs />
                </>
              </ProtectedRoute>
            }
          />

          {/* Payment Routes */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />

          {/* Admin Routes with Layout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="registrations/all" element={<RegistrationList />} />
            <Route path="registrations/pending" element={<RegistrationList />} />
            <Route path="registrations/under-review" element={<RegistrationList />} />
            <Route path="registrations/approved" element={<RegistrationList />} />
            <Route path="registrations/rejected" element={<RegistrationList />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="venues" element={<VenuesPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Venue Owner Routes with Layout */}
          <Route
            path="/venue-owner"
            element={
              <ProtectedRoute allowedRoles={['venue-owner']}>
                <VenueOwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<VenueDashboard />} />
            <Route path="registration" element={<VenueRegistration />} />
            <Route path="bookings/requests" element={<BookingRequests />} />
            <Route path="bookings/confirmed" element={<BookingConfirmed />} />
            <Route path="bookings/completed" element={<BookingCompleted />} />
            <Route path="bookings/cancelled" element={<CancelledBookings />} />
            <Route path="events-gallery" element={<VenueEventsAndGallery />} />
            <Route path="menu/:venueId" element={<VenueMenuAndPackageManagement />} />
            <Route path="profile" element={<VenueOwnerProfile />} />
            <Route path="edit-venue/:venueId" element={<EditVenueDetails />} />
            <Route path="timely-booked" element={<TimelyBookings />} />
            <Route path="booked" element={<BookedBookings />} />
            <Route path="calendar" element={<VenueCalendar />} />
          </Route>

          {/* Redirect /home to / for backwards compatibility */}
          <Route path="/home" element={<Navigate to="/" replace />} />

          {/* Catch-all route - redirect to login if not authenticated, or home if authenticated */}
          <Route path="*" element={
            isAuthenticated() ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
          } />
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;