"use client";

import { useRouter } from 'next/navigation';

export default function BookingManagerPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-purple-800">Booking Manager</h1>
              <p className="text-sm text-gray-500">Manage your bookings</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Customs Verifications Card */}
          <div 
            onClick={() => router.push('/booking-manager/customs-verifications')}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-purple-800">Customs Verifications</h2>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Deliveries Card */}
          <div 
            onClick={() => router.push('/booking-manager/deliveries')}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-purple-800">Deliveries</h2>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Stripping Card */}
          <div className="bg-white rounded-lg shadow-md p-6 opacity-50 cursor-not-allowed">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-400">Stripping</h2>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Transfer Card */}
          <div className="bg-white rounded-lg shadow-md p-6 opacity-50 cursor-not-allowed">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-400">Transfer</h2>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
