"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import supabase from '@/lib/config/supabase';

export default function YardManagement() {
  const router = useRouter();
  const [counts, setCounts] = useState({
    blocks: 0,
    verification: 0,
    stripping: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCounts();

    // Subscribe to real-time changes
    const blocksSubscription = supabase
      .channel('blocks_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blocks' },
        () => fetchCounts()
      )
      .subscribe();

    const containersSubscription = supabase
      .channel('containers_channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'containers' },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      blocksSubscription.unsubscribe();
      containersSubscription.unsubscribe();
    };
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch blocks count
      const { count: blocksCount, error: blocksError } = await supabase
        .from('blocks')
        .select('*', { count: 'exact', head: true });

      if (blocksError) throw blocksError;

      // Fetch containers in verification
      const { count: verificationCount, error: verificationError } = await supabase
        .from('containers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'verification');

      if (verificationError) throw verificationError;

      // Fetch containers in stripping
      const { count: strippingCount, error: strippingError } = await supabase
        .from('containers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'stripping');

      if (strippingError) throw strippingError;

      setCounts({
        blocks: blocksCount || 0,
        verification: verificationCount || 0,
        stripping: strippingCount || 0
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
      setError('Failed to load counts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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
      color: "indigo",
      count: counts.blocks,
      countLabel: "Blocks"
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
      color: "yellow",
      count: counts.verification,
      countLabel: "Containers"
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
      color: "red",
      count: counts.stripping,
      countLabel: "Containers"
    }
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Yard Management</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((option) => (
            <div
              key={option.title}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
              onClick={() => router.push(option.path)}
            >
              <div className={`bg-${option.color}-50 p-6 relative`}>
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${option.color}-100 text-${option.color}-800`}>
                    {loading ? (
                      <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      option.count
                    )}
                    <span className="ml-1">{option.countLabel}</span>
                  </span>
                </div>
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
