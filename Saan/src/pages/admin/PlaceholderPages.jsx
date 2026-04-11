import React from "react";

// Placeholder component for pages under development
const PlaceholderPage = ({ title, description, icon }) => (
  <div className="flex flex-col items-center justify-center min-h-[500px] bg-white rounded-2xl border border-gray-100">
    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
      {icon}
    </div>
    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    <p className="text-gray-500 mt-2 text-center max-w-md">{description}</p>
    <div className="mt-6 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
      Coming Soon
    </div>
  </div>
);

// Users Management Page
export function UsersPage() {
  return (
    <PlaceholderPage
      title="User Management"
      description="View and manage all platform users, their roles, and permissions. Block or deactivate accounts as needed."
      icon={
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      }
    />
  );
}

// Venues Management Page
export function VenuesPage() {
  return (
    <PlaceholderPage
      title="Venue Management"
      description="Monitor all registered venues, their booking statistics, and manage venue listings across the platform."
      icon={
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      }
    />
  );
}

// Bookings Management Page
export function BookingsPage() {
  return (
    <PlaceholderPage
      title="Booking Management"
      description="View all platform bookings, monitor transaction details, and resolve any booking disputes."
      icon={
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      }
    />
  );
}

// Reports & Analytics Page
export function ReportsPage() {
  return (
    <PlaceholderPage
      title="Reports & Analytics"
      description="Access detailed platform statistics, revenue reports, and user engagement metrics."
      icon={
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
    />
  );
}

// Settings Page
export function SettingsPage() {
  return (
    <PlaceholderPage
      title="Platform Settings"
      description="Configure platform settings, payment gateways, notification preferences, and system configurations."
      icon={
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      }
    />
  );
}
