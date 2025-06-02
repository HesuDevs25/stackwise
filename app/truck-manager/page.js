"use client";

export default function TruckManagerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-purple-800">Truck Manager</h1>
          <p className="text-sm text-gray-500">Coordinate truck arrivals and departures</p>
        </div>
      </header>

      {/* Coming Soon Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 18.5h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600 mb-6">
              We&apos;re building a powerful truck management system to streamline your yard operations. Stay tuned!
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm">
              <span className="mr-2">🚛</span>
              Under Development
            </div>
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
