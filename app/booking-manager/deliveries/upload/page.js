"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/config/supabase';

export default function UploadDeliveriesPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      setSuccess(false);

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target.result;
          const rows = data.split('\n').map(row => row.split(','));
          const headers = rows[0];

          // Validate headers
          const requiredHeaders = ['container_number', 'booking_date', 'truck_number', 'trailer_number', 'driver_name', 'driver_phone', 'driver_id'];
          const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
          
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
          }

          // Get container IDs for the container numbers
          const containerNumbers = rows.slice(1).map(row => row[headers.indexOf('container_number')]);
          const { data: containers, error: containersError } = await supabase
            .from('containers')
            .select('id, container_number')
            .in('container_number', containerNumbers);

          if (containersError) throw containersError;

          // Create a map of container numbers to IDs
          const containerMap = containers.reduce((acc, container) => {
            acc[container.container_number] = container.id;
            return acc;
          }, {});

          // Prepare the deliveries data
          const deliveries = rows.slice(1).map(row => {
            const containerNumber = row[headers.indexOf('container_number')];
            const containerId = containerMap[containerNumber];

            if (!containerId) {
              throw new Error(`Container not found: ${containerNumber}`);
            }

            return {
              container_id: containerId,
              booking_date: row[headers.indexOf('booking_date')],
              collection_details: {
                truck_number: row[headers.indexOf('truck_number')],
                trailer_number: row[headers.indexOf('trailer_number')],
                driver_name: row[headers.indexOf('driver_name')],
                driver_phone: row[headers.indexOf('driver_phone')],
                driver_id: row[headers.indexOf('driver_id')]
              },
              booking_type: 'collection',
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          });

          // Insert the deliveries
          const { error: insertError } = await supabase
            .from('bookings')
            .insert(deliveries);

          if (insertError) throw insertError;

          setSuccess(true);
          setTimeout(() => {
            router.push('/booking-manager/deliveries');
          }, 2000);
        } catch (error) {
          console.error("Error processing file:", error);
          setError(error.message || "Failed to process file");
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read file");
        setIsUploading(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error.message || "Failed to upload file");
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-purple-800">Bulk Upload Deliveries</h1>
            <p className="text-sm text-gray-500">Upload multiple deliveries using a CSV file</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
              <p className="font-medium">Success</p>
              <p>Deliveries uploaded successfully! Redirecting...</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading ? 'Uploading...' : 'Select CSV File'}
              </label>
              <p className="mt-2 text-sm text-gray-500">
                The CSV file should include the following columns:
                container_number, booking_date, truck_number, trailer_number, driver_name, driver_phone, driver_id
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => router.push('/booking-manager/deliveries')}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 