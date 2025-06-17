"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/config/supabase';

export default function CreateDeliveryPage() {
  const [formData, setFormData] = useState({
    permit_number: '',
    permit_date: '',
    container_id: '',
    bl_number: '',
    is_hesu: false,
    truck_id: '',
    trailer_id: '',
    truck_number: '',
    trailer_number: '',
    driver: '',
    size_code: '',
    forwarder: '',
    transporter: '',
    exited: false
  });
  const [containers, setContainers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchContainers();
    if (formData.is_hesu) {
      fetchTrucks();
      fetchTrailers();
    }
  }, [formData.is_hesu]);

  const fetchContainers = async () => {
    try {
      setError(null);
      const { data: containersData, error: containersError } = await supabase
        .from('containers')
        .select('*')
        .order('container_number', { ascending: true });

      if (containersError) throw containersError;
      setContainers(containersData || []);
    } catch (error) {
      console.error("Error fetching containers:", error);
      setError(error.message || "Failed to load containers");
    }
  };

  const fetchTrucks = async () => {
    try {
      const { data: trucksData, error: trucksError } = await supabase
        .from('trucks')
        .select('*')
        .order('truck_number', { ascending: true });

      if (trucksError) throw trucksError;
      setTrucks(trucksData || []);
    } catch (error) {
      console.error("Error fetching trucks:", error);
      setError(error.message || "Failed to load trucks");
    }
  };

  const fetchTrailers = async () => {
    try {
      const { data: trailersData, error: trailersError } = await supabase
        .from('trailers')
        .select('*')
        .order('trailer_number', { ascending: true });

      if (trailersError) throw trailersError;
      setTrailers(trailersData || []);
    } catch (error) {
      console.error("Error fetching trailers:", error);
      setError(error.message || "Failed to load trailers");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleContainerSearch = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleContainerSelect = async (container) => {
    try {
      // Fetch complete container details
      const { data: containerDetails, error } = await supabase
        .from('containers')
        .select('*')
        .eq('id', container.id)
        .single();

      if (error) throw error;

      // Update form with container details
      setFormData(prev => ({
        ...prev,
        container_id: container.id,
        bl_number: containerDetails.bl_number || '',
        size_code: containerDetails.size || '',
        // Add any other container fields you want to auto-populate
      }));
      
      setSearchTerm(container.container_number);
      setShowDropdown(false);
    } catch (error) {
      console.error("Error fetching container details:", error);
      setError("Failed to fetch container details");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);

      if (!formData.container_id) {
        throw new Error("Please select a container");
      }

      // Prepare data for customs_deliveries table
      const deliveryData = {
        permit_number: formData.permit_number,
        permit_date: formData.permit_date,
        container_id: formData.container_id,
        transporter: formData.is_hesu ? 'Hesu' : formData.transporter,
        truck_number: formData.is_hesu 
          ? trucks.find(t => t.id === formData.truck_id)?.truck_number 
          : formData.truck_number,
        trailer_number: formData.is_hesu 
          ? trailers.find(t => t.id === formData.trailer_id)?.trailer_number 
          : formData.trailer_number,
        driver: formData.driver,
        forwarder: formData.forwarder,
        exited: false,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('customs_deliveries')
        .insert([deliveryData]);

      if (insertError) throw insertError;

      router.push('/booking-manager/deliveries');
    } catch (error) {
      console.error("Error creating delivery:", error);
      setError(error.message || "Failed to create delivery");
    } finally {
      setLoading(false);
    }
  };

  const filteredContainers = containers.filter(container =>
    container.container_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-purple-800">Create New Delivery</h1>
              <p className="text-sm text-gray-500">Fill in the details to create a new delivery booking</p>
            </div>
            <button
              onClick={() => router.push('/booking-manager/deliveries')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Back to Deliveries
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Permit Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permit Number
                </label>
                <input
                  type="text"
                  name="permit_number"
                  value={formData.permit_number}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                />
              </div>

              {/* Permit Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permit Date
                </label>
                <input
                  type="date"
                  name="permit_date"
                  value={formData.permit_date}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                />
              </div>

              {/* Container Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Container Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleContainerSearch}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search for a container..."
                    className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                  />
                  {showDropdown && filteredContainers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredContainers.map(container => (
                        <div
                          key={container.id}
                          onClick={() => handleContainerSelect(container)}
                          className="p-3 hover:bg-purple-50 cursor-pointer"
                        >
                          {container.container_number}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* BL Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BL Number
                </label>
                <input
                  type="text"
                  name="bl_number"
                  value={formData.bl_number}
                  readOnly
                  className="w-full p-3 border border-purple-100 rounded-lg bg-gray-50"
                />
              </div>

              {/* Transporter Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transporter
                </label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="is_hesu"
                      checked={formData.is_hesu}
                      onChange={handleInputChange}
                      className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-gray-700">Hesu</span>
                  </label>
                </div>
                {!formData.is_hesu && (
                  <div className="mt-2">
                    <input
                      type="text"
                      name="transporter"
                      value={formData.transporter}
                      onChange={handleInputChange}
                      placeholder="Enter transporter name"
                      required
                      className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Truck Selection/Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Truck {formData.is_hesu ? 'Selection' : 'Number'}
                </label>
                {formData.is_hesu ? (
                  <select
                    name="truck_id"
                    value={formData.truck_id}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                  >
                    <option value="">Select a truck</option>
                    {trucks.map(truck => (
                      <option key={truck.id} value={truck.id}>
                        {truck.truck_number}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="truck_number"
                    value={formData.truck_number}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                  />
                )}
              </div>

              {/* Trailer Selection/Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trailer {formData.is_hesu ? 'Selection' : 'Number'}
                </label>
                {formData.is_hesu ? (
                  <select
                    name="trailer_id"
                    value={formData.trailer_id}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                  >
                    <option value="">Select a trailer</option>
                    {trailers.map(trailer => (
                      <option key={trailer.id} value={trailer.id}>
                        {trailer.trailer_number}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="trailer_number"
                    value={formData.trailer_number}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                  />
                )}
              </div>

              {/* Driver Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Name
                </label>
                <input
                  type="text"
                  name="driver"
                  value={formData.driver}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                />
              </div>

              {/* Size Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size Code
                </label>
                <input
                  type="text"
                  name="size_code"
                  value={formData.size_code}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                />
              </div>

              {/* Forwarder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forwarder
                </label>
                <input
                  type="text"
                  name="forwarder"
                  value={formData.forwarder}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/booking-manager/deliveries')}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Delivery'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 