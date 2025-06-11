"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/config/supabase';

export default function AddBookingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [formData, setFormData] = useState({
    container_id: '',
    booking_type: 'verification',
    booking_date: '',
    status: 'pending',
    notes: '',
    transporter: '',
    truck_id: '',
    trailer_id: '',
    truck_number: '',
    trailer_number: '',
    driver_name: '',
    driver_contact: '',
    driver_license: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [truckSearch, setTruckSearch] = useState('');
  const [trailerSearch, setTrailerSearch] = useState('');
  const [showTruckDropdown, setShowTruckDropdown] = useState(false);
  const [showTrailerDropdown, setShowTrailerDropdown] = useState(false);

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    if (formData.booking_type === 'collection' && formData.transporter === 'Hesu') {
      const fetchTrucksAndTrailers = async () => {
        try {
          const { data: truckData } = await supabase.from('trucks').select('id, truck_number');
          const { data: trailerData } = await supabase.from('trailers').select('id, trailer_number');
          setTrucks(truckData || []);
          setTrailers(trailerData || []);
        } catch (e) {}
      };
      fetchTrucksAndTrailers();
    }
  }, [formData.booking_type, formData.transporter]);

  // Fetch trucks on search
  useEffect(() => {
    if (formData.booking_type === 'collection' && formData.transporter === 'Hesu' && truckSearch.length > 1) {
      const fetchTrucks = async () => {
        const { data } = await supabase
          .from('trucks')
          .select('id, truck_number')
          .ilike('truck_number', `%${truckSearch}%`)
          .limit(10);
        setTrucks(data || []);
      };
      fetchTrucks();
    }
  }, [truckSearch, formData.booking_type, formData.transporter]);

  // Fetch trailers on search
  useEffect(() => {
    if (formData.booking_type === 'collection' && formData.transporter === 'Hesu' && trailerSearch.length > 1) {
      const fetchTrailers = async () => {
        const { data } = await supabase
          .from('trailers')
          .select('id, trailer_number')
          .ilike('trailer_number', `%${trailerSearch}%`)
          .limit(10);
        setTrailers(data || []);
      };
      fetchTrailers();
    }
  }, [trailerSearch, formData.booking_type, formData.transporter]);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('containers')
        .select('*')
        .order('container_number', { ascending: true });

      if (error) throw error;
      setContainers(data || []);
    } catch (error) {
      console.error("Error fetching containers:", error);
      setError(error.message || "Failed to load containers");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContainerSearch = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleContainerSelect = (container) => {
    setFormData(prev => ({
      ...prev,
      container_id: container.id
    }));
    setSearchTerm(container.container_number);
    setShowDropdown(false);
  };

  const filteredContainers = containers.filter(container =>
    container.container_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      const bookingData = {
        ...formData,
        status: 'pending', // Ensure status is always pending
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;

      router.push('/booking-manager');
    } catch (error) {
      console.error("Error saving booking:", error);
      setError(error.message || "Failed to save booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic fields
  const renderDynamicFields = () => {
    if (formData.booking_type === 'verification') {
      return (
        <div>
          
         
        </div>
      );
    }
    if (formData.booking_type === 'collection') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">Transporter</label>
            <select
              name="transporter"
              value={formData.transporter || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              required
            >
              <option value="">Select Transporter</option>
              <option value="Hesu">Hesu</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {formData.transporter === 'Hesu' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Truck Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Truck</label>
                <input
                  type="text"
                  value={truckSearch}
                  onChange={e => {
                    setTruckSearch(e.target.value);
                    setShowTruckDropdown(true);
                    setFormData(prev => ({ ...prev, truck_id: '' }));
                  }}
                  onFocus={() => setShowTruckDropdown(true)}
                  placeholder="Search truck number..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <input type="hidden" name="truck_id" value={formData.truck_id || ''} required />
                {showTruckDropdown && truckSearch && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                    {trucks.length > 0 ? (
                      trucks
                        .filter(truck => truck.truck_number.toLowerCase().includes(truckSearch.toLowerCase()))
                        .map(truck => (
                          <div
                            key={truck.id}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, truck_id: truck.id }));
                              setTruckSearch(truck.truck_number);
                              setShowTruckDropdown(false);
                            }}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50"
                          >
                            <span className="block truncate">{truck.truck_number}</span>
                          </div>
                        ))
                    ) : (
                      <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500">
                        No trucks found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Trailer Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Trailer</label>
                <input
                  type="text"
                  value={trailerSearch}
                  onChange={e => {
                    setTrailerSearch(e.target.value);
                    setShowTrailerDropdown(true);
                    setFormData(prev => ({ ...prev, trailer_id: '' }));
                  }}
                  onFocus={() => setShowTrailerDropdown(true)}
                  placeholder="Search trailer number..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <input type="hidden" name="trailer_id" value={formData.trailer_id || ''} required />
                {showTrailerDropdown && trailerSearch && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                    {trailers.length > 0 ? (
                      trailers
                        .filter(trailer => trailer.trailer_number.toLowerCase().includes(trailerSearch.toLowerCase()))
                        .map(trailer => (
                          <div
                            key={trailer.id}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, trailer_id: trailer.id }));
                              setTrailerSearch(trailer.trailer_number);
                              setShowTrailerDropdown(false);
                            }}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50"
                          >
                            <span className="block truncate">{trailer.trailer_number}</span>
                          </div>
                        ))
                    ) : (
                      <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500">
                        No trailers found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : formData.transporter === 'Other' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Truck Number</label>
                <input
                  type="text"
                  name="truck_number"
                  value={formData.truck_number || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trailer Number</label>
                <input
                  type="text"
                  name="trailer_number"
                  value={formData.trailer_number || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver Name</label>
              <input
                type="text"
                name="driver_name"
                value={formData.driver_name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver Contact</label>
              <input
                type="text"
                name="driver_contact"
                value={formData.driver_contact || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Driver License Number</label>
              <input
                type="text"
                name="driver_license"
                value={formData.driver_license || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
          </div>
        </>
      );
    }
    if (formData.booking_type === 'striping') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700">Striping Details</label>
          <input
            type="text"
            name="striping_details"
            value={formData.striping_details}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            required
          />
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading containers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-800">Add New Booking</h1>
            <button
              onClick={() => router.push('/booking-manager')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Container</label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleContainerSearch}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search container number..."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
              <input
                type="hidden"
                name="container_id"
                value={formData.container_id}
                required
              />
              {showDropdown && searchTerm && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                  {filteredContainers.length > 0 ? (
                    filteredContainers.map((container) => (
                      <div
                        key={container.id}
                        onClick={() => handleContainerSelect(container)}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50"
                      >
                        <span className="block truncate">{container.container_number}</span>
                      </div>
                    ))
                  ) : (
                    <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500">
                      No containers found
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Booking Type</label>
              <select
                name="booking_type"
                value={formData.booking_type}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="verification">Verification</option>
                <option value="stripping">Striping</option>
                <option value="collection">Transportation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Booking Date</label>
              <input
                type="date"
                name="booking_date"
                value={formData.booking_date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            {renderDynamicFields()}
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => router.push('/booking-manager')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 