"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/config/supabase';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchDeliveries();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('deliveries_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Deliveries update:', payload);
          fetchDeliveries();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDeliveries = async () => {
    try {
      setError(null);
      setLoading(true);

      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('customs_deliveries')
        .select(`
          *,
          containers (
            container_number
          )
        `)
        .order('created_at', { ascending: false });

      if (deliveriesError) throw deliveriesError;
      
      setDeliveries(deliveriesData || []);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      setError(error.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('customs_deliveries')
        .update({ 
          exited: newStatus === 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating delivery status:", error);
      setError(error.message || "Failed to update delivery status");
    }
  };

  const handleDelete = async (deliveryId) => {
    if (!window.confirm('Are you sure you want to delete this delivery?')) {
      return;
    }

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('customs_deliveries')
        .delete()
        .eq('id', deliveryId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error("Error deleting delivery:", error);
      setError(error.message || "Failed to delete delivery");
    }
  };

  // Filter deliveries based on search query
  const filteredDeliveries = deliveries.filter(delivery => {
    const query = searchQuery.toLowerCase();
    return (
      delivery.containers?.container_number.toLowerCase().includes(query) ||
      delivery.permit_number?.toLowerCase().includes(query) ||
      delivery.truck?.toLowerCase().includes(query) ||
      delivery.trailer_number?.toLowerCase().includes(query) ||
      delivery.driver?.toLowerCase().includes(query) ||
      delivery.transporter?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-purple-800">Deliveries</h1>
              <p className="text-sm text-gray-500">Manage delivery bookings</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/booking-manager/deliveries/upload')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Bulk Upload
              </button>
              <button
                onClick={() => router.push('/booking-manager/deliveries/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Delivery
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search deliveries by container number, truck, trailer, driver, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pl-12 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition-all shadow-sm"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CONTAINER</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PERMIT NUMBER</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PERMIT DATE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">TRUCK/TRAILER</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">DRIVER</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">TRANSPORTER</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {delivery.containers?.container_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {delivery.permit_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(delivery.permit_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {delivery.truck_number} / {delivery.trailer_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {delivery.driver}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {delivery.transporter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${!delivery.exited ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${delivery.exited ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {delivery.exited ? 'Exited' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                    <button 
                      onClick={() => router.push(`/booking-manager/deliveries/edit/${delivery.id}`)} 
                      title="Edit"
                      className="text-purple-600 hover:text-purple-900"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {!delivery.exited && (
                      <button 
                        onClick={() => handleStatusUpdate(delivery.id, 'confirmed')} 
                        title="Mark as Exited"
                        className="text-green-600 hover:text-green-900"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(delivery.id)} 
                      title="Delete"
                      className="text-red-600 hover:text-red-900"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDeliveries.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No deliveries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
} 