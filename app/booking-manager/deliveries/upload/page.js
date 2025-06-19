"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import supabase from '@/lib/config/supabase';

export default function UploadDeliveriesPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fileType, setFileType] = useState(null);
  const router = useRouter();

  const parseExcelFile = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }

      const headers = jsonData[0];
      const rows = jsonData.slice(1);

      // Map Excel columns to our expected format with flexible matching
      const columnMapping = {
        'permit': 'permit_date',
        'permit date': 'permit_date',
        'permit_date': 'permit_date',
        'permit no': 'permit_number',
        'permit number': 'permit_number',
        'permit_number': 'permit_number',
        'container': 'container_number',
        'container no': 'container_number',
        'container number': 'container_number',
        'container_number': 'container_number',
        'bl number': 'bl_number',
        'bl_number': 'bl_number',
        'transporter': 'transporter',
        'truck': 'truck_trailer',
        'truck/trailer': 'truck_trailer',
        'truck_trailer': 'truck_trailer',
        'driver': 'driver',
        'driver name': 'driver',
        'driver_name': 'driver',
        'size code': 'size_code',
        'size_code': 'size_code',
        'forwarder': 'forwarder'
      };

      // Find column indices with flexible matching
      const columnIndices = {};
      const foundColumns = [];
      const missingColumns = [];
      
      headers.forEach((header, index) => {
        if (header) {
          const normalizedHeader = header.toString().toLowerCase().trim();
          if (columnMapping[normalizedHeader]) {
            columnIndices[columnMapping[normalizedHeader]] = index;
            foundColumns.push(header);
          }
        }
      });

      // Check for required columns
      const requiredColumns = ['permit_date', 'permit_number', 'container_number', 'transporter', 'truck_trailer', 'driver', 'size_code', 'forwarder'];
      const missingRequiredColumns = requiredColumns.filter(col => columnIndices[col] === undefined);
      
      if (missingRequiredColumns.length > 0) {
        // Create user-friendly error message with actual Excel column names
        const expectedColumnNames = {
          'permit_date': 'Permit or Permit Date',
          'permit_number': 'Permit No or Permit Number',
          'container_number': 'Container No or Container Number',
          'transporter': 'Transporter',
          'truck_trailer': 'Truck (in format truck_number/trailer_number)',
          'driver': 'Driver or Driver Name',
          'size_code': 'Size code or Size Code',
          'forwarder': 'Forwarder'
        };
        
        const missingColumnNames = missingRequiredColumns.map(col => expectedColumnNames[col]);
        throw new Error(`Missing required columns: ${missingColumnNames.join(', ')}. Found columns: ${foundColumns.join(', ')}`);
      }

      // Parse rows
      const parsedRows = rows.map((row, index) => {
        const rowNumber = index + 2; // +2 because we start from row 2 (after header)
        
        // Extract truck and trailer from combined field
        const truckTrailerValue = row[columnIndices.truck_trailer];
        if (!truckTrailerValue || !truckTrailerValue.toString().includes('/')) {
          throw new Error(`Row ${rowNumber}: Truck/Trailer field must contain a "/" separator. Found: "${truckTrailerValue}"`);
        }

        const [truckNumber, trailerNumber] = truckTrailerValue.toString().split('/').map(s => s.trim());
        if (!truckNumber || !trailerNumber) {
          throw new Error(`Row ${rowNumber}: Invalid truck/trailer format. Expected "truck_number/trailer_number". Found: "${truckTrailerValue}"`);
        }

        return {
          rowNumber,
          permit_date: row[columnIndices.permit_date],
          permit_number: row[columnIndices.permit_number],
          container_number: row[columnIndices.container_number],
          bl_number: row[columnIndices.bl_number] || '',
          transporter: row[columnIndices.transporter],
          truck_number: truckNumber,
          trailer_number: trailerNumber,
          driver: row[columnIndices.driver],
          size_code: row[columnIndices.size_code],
          forwarder: row[columnIndices.forwarder]
        };
      });

      return parsedRows;
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      throw new Error(`Excel parsing error: ${error.message}`);
    }
  };

  const parseCSVFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target.result;
          const rows = data.split('\n').map(row => row.split(','));
          const headers = rows[0];

          // Validate headers for CSV format
          const requiredHeaders = ['container_number', 'booking_date', 'truck_number', 'trailer_number', 'driver_name', 'driver_phone', 'driver_id'];
          const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
          
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
          }

          // Parse CSV rows
          const parsedRows = rows.slice(1).map((row, index) => {
            const rowNumber = index + 2;
            return {
              rowNumber,
              container_number: row[headers.indexOf('container_number')],
              booking_date: row[headers.indexOf('booking_date')],
              truck_number: row[headers.indexOf('truck_number')],
              trailer_number: row[headers.indexOf('trailer_number')],
              driver_name: row[headers.indexOf('driver_name')],
              driver_phone: row[headers.indexOf('driver_phone')],
              driver_id: row[headers.indexOf('driver_id')]
            };
          });

          resolve(parsedRows);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read CSV file"));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      setSuccess(false);
      setParsedData(null);
      setShowPreview(false);

      let parsedRows;
      let fileType;

      // Determine file type and parse accordingly
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        fileType = 'excel';
        parsedRows = await parseExcelFile(file);
      } else if (file.name.endsWith('.csv')) {
        fileType = 'csv';
        parsedRows = await parseCSVFile(file);
      } else {
        throw new Error('Unsupported file format. Please upload .xlsx, .xls, or .csv files');
      }

      setFileType(fileType);
      setParsedData(parsedRows);
      setShowPreview(true);
    } catch (error) {
      console.error("Error processing file:", error);
      setError(error.message || "Failed to process file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    try {
      setIsUploading(true);
      setError(null);

      if (fileType === 'excel') {
        // Handle Excel format - insert into customs_deliveries table
        const containerNumbers = parsedData.map(row => row.container_number);
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

        // Prepare the deliveries data for customs_deliveries table
        const deliveries = parsedData.map(row => {
          const containerId = containerMap[row.container_number];
          if (!containerId) {
            throw new Error(`Container not found: ${row.container_number}`);
          }

          return {
            permit_number: row.permit_number,
            permit_date: row.permit_date,
            container_id: containerId,
            transporter: row.transporter,
            truck_number: row.truck_number,
            trailer_number: row.trailer_number,
            driver: row.driver,
            forwarder: row.forwarder,
            exited: false,
            created_at: new Date().toISOString()
          };
        });

        const { error: insertError } = await supabase
          .from('customs_deliveries')
          .insert(deliveries);

        if (insertError) throw insertError;

      } else if (fileType === 'csv') {
        // Handle CSV format - insert into bookings table (existing logic)
        const containerNumbers = parsedData.map(row => row.container_number);
        const { data: containers, error: containersError } = await supabase
          .from('containers')
          .select('id, container_number')
          .in('container_number', containerNumbers);

        if (containersError) throw containersError;

        const containerMap = containers.reduce((acc, container) => {
          acc[container.container_number] = container.id;
          return acc;
        }, {});

        const deliveries = parsedData.map(row => {
          const containerId = containerMap[row.container_number];
          if (!containerId) {
            throw new Error(`Container not found: ${row.container_number}`);
          }

          return {
            container_id: containerId,
            booking_date: row.booking_date,
            collection_details: {
              truck_number: row.truck_number,
              trailer_number: row.trailer_number,
              driver_name: row.driver_name,
              driver_phone: row.driver_phone,
              driver_id: row.driver_id
            },
            booking_type: 'collection',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        });

        const { error: insertError } = await supabase
          .from('bookings')
          .insert(deliveries);

        if (insertError) throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/booking-manager/deliveries');
      }, 2000);
    } catch (error) {
      console.error("Error uploading deliveries:", error);
      setError(error.message || "Failed to upload deliveries");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelPreview = () => {
    setParsedData(null);
    setShowPreview(false);
    setFileType(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-purple-800">Bulk Upload Deliveries</h1>
            <p className="text-sm text-gray-500">
              Upload multiple deliveries using Excel (.xlsx, .xls) or CSV files
            </p>
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

          {!showPreview && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? 'Processing...' : 'Select File'}
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  Supported formats: .xlsx, .xls, .csv
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Excel Template Format</h3>
                  <p className="text-sm text-blue-700">
                    Columns: Permit, Permit No, Container No, BL Number, Transporter, Truck (truck_number/trailer_number), Driver, Size code, Forwarder
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">CSV Format</h3>
                  <p className="text-sm text-green-700">
                    Columns: container_number, booking_date, truck_number, trailer_number, driver_name, driver_phone, driver_id
                  </p>
                </div>
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
          )}

          {showPreview && parsedData && (
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Preview - {parsedData.length} records found</h3>
                <p className="text-sm text-yellow-700">
                  Please review the data below before confirming the upload.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Row</th>
                      {fileType === 'excel' ? (
                        <>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Permit Date</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Permit No</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Container</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Transporter</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Truck/Trailer</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Driver</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Forwarder</th>
                        </>
                      ) : (
                        <>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Container</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Booking Date</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Truck</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Trailer</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Driver</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {parsedData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-500">{row.rowNumber}</td>
                        {fileType === 'excel' ? (
                          <>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.permit_date}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.permit_number}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.container_number}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.transporter}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.truck_number} / {row.trailer_number}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.driver}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.forwarder}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.container_number}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.booking_date}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.truck_number}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.trailer_number}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.driver_name}</td>
                          </>
                        )}
                      </tr>
                    ))}
                    {parsedData.length > 10 && (
                      <tr>
                        <td colSpan={fileType === 'excel' ? 8 : 6} className="px-3 py-2 text-sm text-gray-500 text-center">
                          ... and {parsedData.length - 10} more records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancelPreview}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : `Upload ${parsedData.length} Deliveries`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 