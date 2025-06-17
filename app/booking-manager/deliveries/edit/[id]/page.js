"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/config/supabase';

export default function EditDeliveryPage({ params }) {
  const deliveryId = use(params).id;
  const [formData, setFormData] = useState({
    permit_number: '',
    permit_date: '',
    container_id: '',
    is_hesu: false,
    truck_id: '',
    trailer_id: '',
    truck_number: '',
    trailer_number: '',
    driver: '',
    forwarder: '',
    transporter: '',
    exited: false
  });
  const [containers, setContainers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!deliveryId) return;
    
    fetchContainers();
    fetchDelivery();
    if (formData.is_hesu) {
      fetchTrucks();
      fetchTrailers();
    }
  }, [deliveryId, formData.is_hesu]);

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

  const fetchDelivery = async () => {
    if (!deliveryId) return;
    
    try {
      setError(null);
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('customs_deliveries')
        .select(`
          *,
          containers (
            container_number
          )
        `)
        .eq('id', deliveryId)
        .single();

      if (deliveryError) throw deliveryError;

      if (deliveryData) {
        setFormData({
          permit_number: deliveryData.permit_number,
          permit_date: deliveryData.permit_date,
          container_id: deliveryData.container_id,
          is_hesu: deliveryData.transporter === 'Hesu',
          truck_number: deliveryData.truck_number,
          trailer_number: deliveryData.trailer_number,
          driver: deliveryData.driver,
          forwarder: deliveryData.forwarder,
          transporter: deliveryData.transporter,
          exited: deliveryData.exited
        });
        setSearchTerm(deliveryData.containers?.container_number || '');
      }
    } catch (error) {
      console.error("Error fetching delivery:", error);
      setError(error.message || "Failed to load delivery");
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
      container_id: container.id
    }));
    setSearchTerm(container.container_number);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);

      if (!formData.container_id) {
        throw new Error("Please select a container");
      }

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
        exited: formData.exited,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('customs_deliveries')
        .update(deliveryData)
        .eq('id', deliveryId);

      if (updateError) throw updateError;

      router.push('/booking-manager/deliveries');
    } catch (error) {
      console.error("Error updating delivery:", error);
      setError(error.message || "Failed to update delivery");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this delivery?')) {
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const { error: deleteError } = await supabase
        .from('customs_deliveries')
        .delete()
        .eq('id', deliveryId);

      if (deleteError) throw deleteError;

      router.push('/booking-manager/deliveries');
    } catch (error) {
      console.error("Error deleting delivery:", error);
      setError(error.message || "Failed to delete delivery");
    } finally {
      setLoading(false);
    }
  };

  const filteredContainers = containers.filter(container =>
    container.container_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-purple-800">Edit Delivery</h1>
              <p className="text-sm text-gray-500">Update the delivery details</p>
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Delivery
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
                  type="datetime-local"
                  name="permit_date"
                  value={formData.permit_date}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                />
              </div>

              {/* Container Selection */}
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

              {/* Exit Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="exited"
                      checked={formData.exited}
                      onChange={handleInputChange}
                      className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-gray-700">Mark as Exited</span>
                  </label>
                </div>
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
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 