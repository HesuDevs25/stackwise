"use client";

import { useRouter } from 'next/navigation';

export default function VehicleManagerPage() {
  const router = useRouter();

  const options = [
    {
      title: 'Machinery',
      description: 'Manage construction and handling machinery',
      path: '/vehicle-manager/machinery',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      title: 'Trucks',
      description: 'Manage truck fleet and operations',
      path: '/vehicle-manager/trucks',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    {
      title: 'Trailers',
      description: 'Manage trailer inventory and assignments',
      path: '/vehicle-manager/trailers',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="mt-2 text-gray-600">Manage your fleet of vehicles and machinery</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((option) => (
            <button
              key={option.path}
              onClick={() => router.push(option.path)}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="text-purple-600">
                  {option.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{option.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
