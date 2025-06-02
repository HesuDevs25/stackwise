"use client";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Comprehensive yard operations insights</p>
        </div>
      </header>

      {/* Coming Soon Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600 mb-6">
              We&apos;re working hard to bring you comprehensive reporting and analytics features. Stay tuned for updates!
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm">
              <span className="mr-2">🚀</span>
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
