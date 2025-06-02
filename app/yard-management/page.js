"use client";

import { useRouter } from 'next/navigation';

export default function YardManagement() {
  const router = useRouter();

  const options = [
    {
      title: "Storage Blocks",
      description: "View and manage storage blocks, their capacity, and container assignments",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      path: "/yard-management/storage-blocks",
      color: "indigo"
    },
    {
      title: "Verification Area",
      description: "Manage containers in the verification process",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      path: "/yard-management/verification-area",
      color: "yellow"
    },
    {
      title: "Stripping Area",
      description: "Track and manage containers in the stripping process",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
      path: "/yard-management/stripping-area",
      color: "red"
    }
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Yard Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((option) => (
            <div
              key={option.title}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
              onClick={() => router.push(option.path)}
            >
              <div className={`bg-${option.color}-50 p-6`}>
                <div className={`text-${option.color}-600 mb-4`}>
                  {option.icon}
                </div>
                <h2 className={`text-xl font-semibold text-${option.color}-900 mb-2`}>
                  {option.title}
                </h2>
                <p className="text-gray-600">
                  {option.description}
                </p>
              </div>
              <div className={`px-6 py-4 bg-${option.color}-50 border-t border-${option.color}-100`}>
                <div className="flex items-center text-sm text-gray-600">
                  <span className={`text-${option.color}-600 font-medium`}>Click to view</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-2 text-${option.color}-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
