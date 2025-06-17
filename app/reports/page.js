"use client";

import { useState, useEffect } from 'react';
import supabase from '@/lib/config/supabase';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportsPage() {
  const [reportType, setReportType] = useState('lifting');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const reportTypes = [
    { id: 'lifting', label: 'Lifting Reports' },
    { id: 'waiting', label: 'Waiting Time' },
    { id: 'serving', label: 'Serving Time' },
    { id: 'verifications', label: 'Verifications Report' },
    { id: 'container-history', label: 'Container History' }
  ];

  const handleExport = async (format) => {
    try {
      // TODO: Implement export functionality
      console.log(`🔥 Exporting to ${format}...`);
      setShowExportMenu(false);
    } catch (error) {
      console.error("🔥 Error exporting report:", error);
      setError(error.message);
    }
  };

  const fetchReportData = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Implement actual data fetching based on report type
      // This is just mock data for now
      const mockData = {
        lifting: {
          tableData: [
            { containerNumber: 'CONT001', machine: 'RTG-1', timestamp: '2024-03-20 10:00:00', location: 'A1' },
            { containerNumber: 'CONT002', machine: 'RTG-2', timestamp: '2024-03-20 10:15:00', location: 'B2' },
          ],
          chartData: {
            labels: ['RTG-1', 'RTG-2', 'RTG-3'],
            datasets: [{
              label: 'Containers Lifted',
              data: [15, 12, 8],
              backgroundColor: 'rgba(147, 51, 234, 0.5)',
            }]
          }
        },
        waiting: {
          tableData: [
            { truckId: 'TRK001', arrivalTime: '2024-03-20 09:00:00', serviceTime: '2024-03-20 09:45:00', waitTime: '45 min' },
            { truckId: 'TRK002', arrivalTime: '2024-03-20 09:30:00', serviceTime: '2024-03-20 10:15:00', waitTime: '45 min' },
          ],
          chartData: {
            labels: ['0-15 min', '15-30 min', '30-45 min', '45+ min'],
            datasets: [{
              label: 'Number of Trucks',
              data: [5, 8, 12, 3],
              backgroundColor: 'rgba(147, 51, 234, 0.5)',
            }]
          }
        },
        // Add mock data for other report types...
      };

      setReportData(mockData[reportType]);
    } catch (error) {
      console.error("🔥 Error fetching report data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Data Visualization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Visualization</h3>
          <div className="h-80">
            {reportType === 'lifting' && (
              <Bar
                data={reportData.chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Containers Lifted by Machine',
                    },
                  },
                }}
              />
            )}
            {reportType === 'waiting' && (
              <Bar
                data={reportData.chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Truck Waiting Time Distribution',
                    },
                  },
                }}
              />
            )}
            {/* Add other chart types for different reports */}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Report Data</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(reportData.tableData[0]).map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200"
                    >
                      {header.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-gray-200">
                {reportData.tableData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Comprehensive yard operations insights</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Report Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Report Type Selection */}
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">
                Report Type
              </label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md text-gray-700 font-medium"
              >
                {reportTypes.map((type) => (
                  <option key={type.id} value={type.id} className="text-gray-700">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Selection */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border-2 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-700 font-medium"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border-2 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-700 font-medium"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-end space-x-3">
              <button
                onClick={fetchReportData}
                className="inline-flex items-center px-6 py-2.5 border-2 border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Generate
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="inline-flex items-center px-6 py-2.5 border-2 border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Export
                  <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <button
                        onClick={() => handleExport('pdf')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        role="menuitem"
                      >
                        Export as PDF
                      </button>
                      <button
                        onClick={() => handleExport('excel')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        role="menuitem"
                      >
                        Export as Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading report data...</p>
            </div>
          </div>
        ) : (
          reportData && renderReportContent()
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-center text-gray-500">
            &copy; {new Date().getFullYear()} StackWise Container Yard Management System
          </p>
        </div>
      </footer>
    </div>
  );
}

