"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/config/supabase';

export default function BookingManagerPage() {
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);
  const [containers, setContainers] = useState([]);
  const [searchContainer, setSearchContainer] = useState('');
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [formData, setFormData] = useState({
    booking_type: 'verification',
    container_id: '',
    booking_date: new Date().toISOString().split('T')[0],
    notes: '',
    seal: '',
    truck_number: '',
    trailer_number: '',
    driver_name: '',
    driver_contact: '',
    driver_license: '',
    striping_details: ''
  });

  useEffect(() => {
    fetchBookings();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('bookings_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Bookings update:', payload);
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (showAddModal && searchContainer.length > 2) {
      const fetchContainers = async () => {
        try {
          const { data, error } = await supabase
            .from('containers')
            .select('id, container_number')
            .ilike('container_number', `%${searchContainer}%`)
            .limit(10);
          if (error) throw error;
          setContainers(data || []);
        } catch (error) {
          // ignore
        }
      };
      fetchContainers();
    } else {
      setContainers([]);
    }
  }, [searchContainer, showAddModal]);

  const fetchBookings = async () => {
    try {
      setError(null);
      setLoading(true);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          containers (
            container_number
          )
        `)
        .order('booking_date', { ascending: true });

      if (bookingsError) throw bookingsError;
      
      setBookings(bookingsData || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError(error.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating booking status:", error);
      setError(error.message || "Failed to update booking status");
    }
  };

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContainerSelect = (container) => {
    setSelectedContainer(container);
    setFormData(prev => ({ ...prev, container_id: container.id }));
    setSearchContainer(container.container_number);
    setContainers([]);
  };

  const handleBookingTypeChange = (e) => {
    setFormData(prev => ({ ...prev, booking_type: e.target.value }));
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      if (!formData.container_id) throw new Error('Please select a container');
      const bookingData = {
        booking_type: formData.booking_type,
        container_id: formData.container_id,
        booking_date: formData.booking_date,
        notes: formData.notes,
        status: 'pending'
      };
      if (formData.booking_type === 'verification') {
        bookingData.verification_details = { seal: formData.seal };
      } else if (formData.booking_type === 'Transportation') {
        bookingData.collection_details = {
          truck_number: formData.truck_number,
          trailer_number: formData.trailer_number,
          driver_name: formData.driver_name,
          driver_contact: formData.driver_contact,
          driver_license: formData.driver_license
        };
      } else if (formData.booking_type === 'striping') {
        bookingData.striping_details = formData.striping_details;
      }
      const { error } = await supabase.from('bookings').insert(bookingData);
      if (error) throw error;
      setAddSuccess('Booking created successfully!');
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess(null);
        fetchBookings();
      }, 1200);
    } catch (error) {
      setAddError(error.message || 'Failed to create booking');
    } finally {
      setAddLoading(false);
    }
  };

  const renderAddFormFields = () => {
    if (formData.booking_type === 'verification') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seal Number</label>
          <input type="text" name="seal" value={formData.seal} onChange={handleAddInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" required />
        </div>
      );
    }
    if (formData.booking_type === 'collection') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Truck Number</label>
            <input type="text" name="truck_number" value={formData.truck_number} onChange={handleAddInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trailer Number</label>
            <input type="text" name="trailer_number" value={formData.trailer_number} onChange={handleAddInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
            <input type="text" name="driver_name" value={formData.driver_name} onChange={handleAddInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver Contact</label>
            <input type="text" name="driver_contact" value={formData.driver_contact} onChange={handleAddInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver License Number</label>
            <input type="text" name="driver_license" value={formData.driver_license} onChange={handleAddInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" required />
          </div>
        </div>
      );
    }
    if (formData.booking_type === 'striping') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Striping Details</label>
          <input type="text" name="striping_details" value={formData.striping_details} onChange={handleAddInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" required />
        </div>
      );
    }
    return null;
  };

  // Filter bookings based on search query
  const filteredBookings = bookings.filter(booking => {
    const query = searchQuery.toLowerCase();
    return (
      booking.containers?.container_number.toLowerCase().includes(query) ||
      booking.booking_type.toLowerCase().includes(query) ||
      booking.status.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading bookings...</p>
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
              <h1 className="text-2xl font-bold text-purple-800">Booking Manager</h1>
              <p className="text-sm text-gray-500">Manage container bookings</p>
            </div>
            <button
              onClick={() => router.push('/booking-manager/add')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Booking
            </button>
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
              placeholder="Search bookings by container number, type, or status..."
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
        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CONTAINER</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">TYPE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">BOOKING DATE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{booking.containers?.container_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{booking.booking_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(booking.booking_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                      ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                    <button onClick={() => router.push(`/booking-manager/edit/${booking.id}`)} title="Edit">
                      <svg className="h-5 w-5 text-purple-500 hover:text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {booking.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatusUpdate(booking.id, 'confirmed')} title="Confirm">
                          <svg className="h-5 w-5 text-green-500 hover:text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button onClick={() => handleStatusUpdate(booking.id, 'cancelled')} title="Cancel">
                          <svg className="h-5 w-5 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No bookings found
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
