"use client";

import { useState } from 'react';
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
    ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('overview');
    
    // Sample data for reports
    const monthlyData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        containerMovements: [65, 59, 80, 81, 56, 55, 40, 75, 90],
        truckVisits: [28, 48, 40, 19, 86, 27, 90, 65, 59],
        bookings: [35, 42, 50, 61, 45, 58, 62, 68, 70],
    };

    // Yard utilization data
    const yardUtilization = {
        labels: ['Occupied', 'Reserved', 'Available', 'Maintenance'],
        data: [45, 25, 20, 10],
        backgroundColor: ['#4B5563', '#60A5FA', '#34D399', '#F59E0B'],
    };

    // Recent activity data
    const recentActivity = [
        { id: 1, type: 'Container Move', details: 'MSCU-7654321 moved to Block A-12-3', timestamp: '15 min ago' },
        { id: 2, type: 'Truck Entry', details: 'Truck TRK-001 entered yard', timestamp: '45 min ago' },
        { id: 3, type: 'Booking', details: 'New booking BK-2023-0042 created', timestamp: '1 hour ago' },
        { id: 4, type: 'Container Exit', details: 'HLXU-4567890 left yard', timestamp: '2 hours ago' },
    ];

    // Chart options and data
    const lineChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Monthly Activity Trends' }
        },
        scales: {
            y: { beginAtZero: true }
        }
    };

    const lineChartData = {
        labels: monthlyData.labels,
        datasets: [
            {
                label: 'Container Movements',
                data: monthlyData.containerMovements,
                borderColor: '#4B5563',
                tension: 0.1
            },
            {
                label: 'Truck Visits',
                data: monthlyData.truckVisits,
                borderColor: '#60A5FA',
                tension: 0.1
            },
            {
                label: 'Bookings',
                data: monthlyData.bookings,
                borderColor: '#34D399',
                tension: 0.1
            }
        ]
    };

    const yardUtilizationData = {
        labels: yardUtilization.labels,
        datasets: [{
            data: yardUtilization.data,
            backgroundColor: yardUtilization.backgroundColor,
        }]
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
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <p className="text-sm font-medium text-gray-500">Total Containers</p>
                        <p className="text-2xl font-bold text-gray-700 mt-1">1,234</p>
                        <p className="mt-2 text-sm text-green-500">↑ 12% from last month</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <p className="text-sm font-medium text-gray-500">Active Bookings</p>
                        <p className="text-2xl font-bold text-gray-700 mt-1">89</p>
                        <p className="mt-2 text-sm text-green-500">↑ 5% from last week</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <p className="text-sm font-medium text-gray-500">Yard Utilization</p>
                        <p className="text-2xl font-bold text-gray-700 mt-1">78%</p>
                        <p className="mt-2 text-sm text-yellow-500">↓ 3% available space</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <p className="text-sm font-medium text-gray-500">Daily Truck Visits</p>
                        <p className="text-2xl font-bold text-gray-700 mt-1">156</p>
                        <p className="mt-2 text-sm text-green-500">↑ 8% from yesterday</p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Activity Trends Chart */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Activity Trends</h3>
                        <div className="h-80">
                            <Line options={lineChartOptions} data={lineChartData} />
                        </div>
                    </div>

                    {/* Yard Utilization Chart */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Yard Space Utilization</h3>
                        <div className="h-80">
                            <Pie data={yardUtilizationData} />
                        </div>
                    </div>

                    {/* Recent Activity - Now spans full width */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                                        <p className="text-sm text-gray-500">{activity.details}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">{activity.timestamp}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Export Options */}
                <div className="flex justify-end space-x-4">
                    <button className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700">
                        Export PDF Report
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">
                        Schedule Reports
                    </button>
                </div>
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
