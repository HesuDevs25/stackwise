"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchDashboardStats } from '@/lib/utils/supabase/queries';
import supabase from '@/lib/config/supabase';

// Icons for each module
const ModuleIcon = ({ type }) => {
  switch (type) {
    case 'yard':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'booking':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'container':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'truck':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case 'admin':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState('Admin User');
  const [stats, setStats] = useState({
    totalContainers: 0,
    availableSlots: 0,
    pendingBookings: 0,
    trucksToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Module definitions
  const modules = [
    {
      id: 'yard',
      name: 'Yard Manager',
      description: 'Manage container yard blocks and positions',
      color: 'indigo',
      path: '/yard-manager',
      icon: 'yard'
    },
    {
      id: 'booking',
      name: 'Booking Manager',
      description: 'Handle container bookings and schedules',
      color: 'emerald',
      path: '/booking-manager',
      icon: 'booking'
    },
    {
      id: 'container',
      name: 'Container Manager',
      description: 'Track and manage container inventory',
      color: 'amber',
      path: '/container-manager',
      icon: 'container'
    },
    {
      id: 'truck',
      name: 'Truck Manager',
      description: 'Coordinate truck arrivals and departures',
      color: 'purple',
      path: '/truck-manager',
      icon: 'truck'
    },
    {
      id: 'admin',
      name: 'Admin',
      description: 'System settings and user management',
      color: 'gray',
      path: '/admin',
      icon: 'admin'
    }
  ];

  const navigateTo = (path) => {
    router.push(path);
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user profile
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUserName(profile.name);
          }
        }

        // Get dashboard stats
        const dashboardStats = await fetchDashboardStats();
        setStats(dashboardStats);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-800">StackWise</h1>
            <p className="text-sm text-gray-500">Container Yard Management System</p>
          </div>
          <div className="flex items-center">
            <div className="mr-4 text-right">
              <p className="text-sm font-medium text-gray-700">Welcome back,</p>
              <p className="text-sm font-bold text-gray-900">{userName}</p>
            </div>
            <button 
              onClick={() => router.push('/auth')}
              className="bg-indigo-50 p-2 rounded-full text-indigo-600 hover:bg-indigo-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          <p className="text-gray-600">Welcome to your container yard management system</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500">Total Containers</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">{loading ? '...' : stats.totalContainers}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500">Available Slots</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">{loading ? '...' : stats.availableSlots}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500">Pending Bookings</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">{loading ? '...' : stats.pendingBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500">Trucks Today</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">{loading ? '...' : stats.trucksToday}</p>
          </div>
        </div>

        {/* Modules Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">System Modules</h3>
          
          <div className="space-y-4">
            {modules.map((module) => (
              <div
                key={module.id}
                onClick={() => navigateTo(module.path)}
                className={`flex items-center p-4 border border-gray-100 rounded-lg hover:bg-${module.color}-50 cursor-pointer transition-colors`}
              >
                <div className={`p-3 rounded-full bg-${module.color}-100 text-${module.color}-600 mr-4`}>
                  <ModuleIcon type={module.icon} />
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium text-gray-900">{module.name}</h4>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </div>
                <div className={`text-${module.color}-600`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-center text-gray-500">
            &copy; {new Date().getFullYear()} StackWise Container Yard Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
