"use client";

import { useState } from 'react';

export default function BookingsPage() {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Dummy data for bookings
    const bookings = [
        { id: 'BK-2023-0042', customer: 'Global Shipping Inc.', containerCount: 3, status: 'confirmed', arrivalDate: '2023-09-15', departureDate: '2023-09-20', containerIds: ['MSCU-7654321', 'MSCU-7654322', 'MSCU-7654323'], notes: 'Priority customer' },
        { id: 'BK-2023-0043', customer: 'FastFreight Ltd.', containerCount: 1, status: 'pending', arrivalDate: '2023-09-16', departureDate: '2023-09-22', containerIds: ['MAEU-1234567'], notes: 'Awaiting payment confirmation' },
        { id: 'BK-2023-0044', customer: 'Ocean Transport Co.', containerCount: 2, status: 'confirmed', arrivalDate: '2023-09-17', departureDate: '2023-09-25', containerIds: ['CMAU-9876543', 'CMAU-9876544'], notes: 'Refrigerated containers' },
        { id: 'BK-2023-0045', customer: 'Logistics Pro', containerCount: 4, status: 'completed', arrivalDate: '2023-09-10', departureDate: '2023-09-14', containerIds: ['HLXU-5432109', 'HLXU-5432110', 'HLXU-5432111', 'HLXU-5432112'], notes: 'Customer satisfied with service' },
        { id: 'BK-2023-0046', customer: 'Cargo Masters', containerCount: 2, status: 'cancelled', arrivalDate: '2023-09-18', departureDate: '2023-09-23', containerIds: ['TEMU-8765432', 'TEMU-8765433'], notes: 'Cancelled due to route change' },
        { id: 'BK-2023-0047', customer: 'ShipFast Inc.', containerCount: 1, status: 'confirmed', arrivalDate: '2023-09-19', departureDate: '2023-09-26', containerIds: ['CMAU-2345678'], notes: 'Special handling required' },
        { id: 'BK-2023-0048', customer: 'Container World', containerCount: 3, status: 'pending', arrivalDate: '2023-09-20', departureDate: '2023-09-27', containerIds: ['MSCU-3456789', 'MSCU-3456790', 'MSCU-3456791'], notes: 'New customer - verify details' },
        { id: 'BK-2023-0049', customer: 'Global Trade Ltd.', containerCount: 2, status: 'confirmed', arrivalDate: '2023-09-21', departureDate: '2023-09-28', containerIds: ['HLXU-4567890', 'HLXU-4567891'], notes: 'Long-term contract' }
    ];

    // Filter bookings based on tab and search term
    const filteredBookings = bookings.filter(booking => {
        let tabMatch = false;
        
        if (activeTab === 'upcoming') {
            tabMatch = booking.status === 'confirmed' || booking.status === 'pending';
        } else if (activeTab === 'completed') {
            tabMatch = booking.status === 'completed';
        } else if (activeTab === 'cancelled') {
            tabMatch = booking.status === 'cancelled';
        } else {
            tabMatch = true; // 'all' tab
        }
        
        const searchMatch = booking.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           booking.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.containerIds.some(id => id.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return tabMatch && searchMatch;
    });

    // Stats for the dashboard
    const stats = [
        { name: 'Upcoming Bookings', value: bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length },
        { name: 'Completed', value: bookings.filter(b => b.status === 'completed').length },
        { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length },
        { name: 'Total Containers', value: bookings.reduce((total, booking) => total + booking.containerCount, 0) }
    ];

    // Status badge component
    const StatusBadge = ({ status }) => {
        const getStatusStyles = () => {
            switch(status) {
                case 'confirmed':
                    return 'bg-green-100 text-green-800';
                case 'pending':
                    return 'bg-yellow-100 text-yellow-800';
                case 'completed':
                    return 'bg-blue-100 text-blue-800';
                case 'cancelled':
                    return 'bg-red-100 text-red-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-emerald-800">Booking Manager</h1>
                    <p className="text-sm text-gray-500">Handle container bookings and schedules</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                            <p className="text-2xl font-bold text-emerald-700 mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs and Search */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'all' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                                All Bookings
                            </button>
                            <button 
                                onClick={() => setActiveTab('upcoming')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'upcoming' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                                Upcoming
                            </button>
                            <button 
                                onClick={() => setActiveTab('completed')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                                Completed
                            </button>
                            <button 
                                onClick={() => setActiveTab('cancelled')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'cancelled' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                                Cancelled
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search bookings..."
                                className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Booking ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Arrival Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Departure Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Containers
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Notes
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {booking.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {booking.customer}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {booking.arrivalDate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {booking.departureDate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {booking.containerCount} containers
                                            <div className="text-xs text-gray-400 mt-1">
                                                {booking.containerIds[0]}{booking.containerCount > 1 ? ` +${booking.containerCount - 1} more` : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {booking.notes}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button className="text-emerald-600 hover:text-emerald-900 mr-3">View</button>
                                            <button className="text-emerald-600 hover:text-emerald-900">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredBookings.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-gray-500">No bookings match your criteria</p>
                        </div>
                    )}
                </div>

                {/* Calendar Preview Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Upcoming Schedule</h3>
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-emerald-50 px-4 py-2 border-b flex justify-between items-center">
                            <button className="text-emerald-600 hover:text-emerald-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h4 className="font-medium text-emerald-800">September 2023</h4>
                            <button className="text-emerald-600 hover:text-emerald-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-px bg-gray-200">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">
                                    {day}
                                </div>
                            ))}
                            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                                const hasBooking = bookings.some(booking => 
                                    booking.arrivalDate === `2023-09-${day.toString().padStart(2, '0')}` || 
                                    booking.departureDate === `2023-09-${day.toString().padStart(2, '0')}`
                                );
                                return (
                                    <div 
                                        key={day} 
                                        className={`bg-white p-2 h-16 ${hasBooking ? 'bg-emerald-50 border border-emerald-200' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`text-sm ${hasBooking ? 'font-medium text-emerald-800' : 'text-gray-700'}`}>{day}</span>
                                            {hasBooking && (
                                                <span className="bg-emerald-500 rounded-full h-2 w-2"></span>
                                            )}
                                        </div>
                                        {hasBooking && (
                                            <div className="mt-1 text-xs text-emerald-600 truncate">
                                                {bookings.filter(booking => 
                                                    booking.arrivalDate === `2023-09-${day.toString().padStart(2, '0')}` || 
                                                    booking.departureDate === `2023-09-${day.toString().padStart(2, '0')}`
                                                ).length} bookings
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
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
