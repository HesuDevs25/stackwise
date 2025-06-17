"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/config/supabase';

export default function CreateCustomsVerificationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [formData, setFormData] = useState({
    container_id: '',
    bl_number: '',
    type: '',
    booking_date: new Date().toISOString().split('T')[0],
    forwarder: '',
    description_of_goods: '',
    customs_release: '',
    load: '',
    remarks: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('containers')
        .select('id, container_number, bl_number, type, freight_indicator')
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

  const handleContainerSelect = (container) => {
    setFormData(prev => ({
      ...prev,
      container_id: container.id,
      bl_number: container.bl_number,
      type: container.type,
      load: container.freight_indicator
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

      if (!formData.container_id) {
        throw new Error('Please select a container');
      }

      const verificationData = {
        container_id: formData.container_id,
        forwarder: formData.forwarder,
        description_of_goods: formData.description_of_goods,
        customs_release: formData.customs_release,
        remarks: formData.remarks,
        is_verified: false,
        in_verification_area: false,
        verification_status: 'pending',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('customs_verifications')
        .insert([verificationData]);

      if (error) throw error;

      router.push('/booking-manager/customs-verifications');
    } catch (error) {
      console.error("Error creating verification:", error);
      setError(error.message || "Failed to create verification");
    } finally {
      setIsSubmitting(false);
    }
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
            <h1 className="text-2xl font-bold text-purple-800">Create Customs Verification</h1>
            <button
              onClick={() => router.push('/booking-manager/customs-verifications')}
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
            {/* Two Column Grid for Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Container Number */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Container Number</label>
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

              {/* BL Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">BL Number</label>
                <input
                  type="text"
                  name="bl_number"
                  value={formData.bl_number}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                />
              </div>

              {/* Booking Date */}
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

              {/* Forwarder */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Forwarder</label>
                <input
                  type="text"
                  name="forwarder"
                  value={formData.forwarder}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Customs Release */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Customs Release</label>
                <input
                  type="text"
                  name="customs_release"
                  value={formData.customs_release}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Load */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Load</label>
                <input
                  type="text"
                  name="load"
                  value={formData.load}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                />
              </div>
            </div>

            {/* Text Areas at the bottom */}
            <div className="space-y-6">
              {/* Description of Goods */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description of Goods</label>
                <textarea
                  name="description_of_goods"
                  value={formData.description_of_goods}
                  onChange={handleInputChange}
                  rows="3"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/booking-manager/customs-verifications')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Verification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 