"use client";

import { useState } from 'react';

export default function TruckManagerPage() {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Dummy data for trucks
    const trucks = [
        { id: 'TRK-001', driver: 'John Smith', licensePlate: 'ABC-1234', status: 'in-yard', arrivalTime: '08:30 AM', departureTime: '10:15 AM', cargo: 'MSCU-7654321', destination: 'Port Terminal' },
        { id: 'TRK-002', driver: 'Maria Garcia', licensePlate: 'XYZ-5678', status: 'scheduled', arrivalTime: '09:45 AM', departureTime: '11:30 AM', cargo: 'MAEU-1234567', destination: 'Distribution Center' },
        { id: 'TRK-003', driver: 'Robert Chen', licensePlate: 'DEF-9012', status: 'completed', arrivalTime: '07:15 AM', departureTime: '08:45 AM', cargo: 'CMAU-9876543', destination: 'Rail Terminal' },
        { id: 'TRK-004', driver: 'Sarah Johnson', licensePlate: 'GHI-3456', status: 'delayed', arrivalTime: '10:00 AM', departureTime: '12:30 PM', cargo: 'HLXU-5432109', destination: 'Customer Site' },
        { id: 'TRK-005', driver: 'Michael Brown', licensePlate: 'JKL-7890', status: 'in-yard', arrivalTime: '08:45 AM', departureTime: '10:30 AM', cargo: 'TEMU-8765432', destination: 'Port Terminal' },
        { id: 'TRK-006', driver: 'Emma Wilson', licensePlate: 'MNO-1234', status: 'scheduled', arrivalTime: '11:15 AM', departureTime: '01:00 PM', cargo: 'CMAU-2345678', destination: 'Distribution Center' },
        { id: 'TRK-007', driver: 'David Lee', licensePlate: 'PQR-5678', status: 'completed', arrivalTime: '06:30 AM', departureTime: '08:00 AM', cargo: 'MSCU-3456789', destination: 'Rail Terminal' },
        { id: 'TRK-008', driver: 'Lisa Taylor', licensePlate: 'STU-9012', status: 'in-yard', arrivalTime: '09:15 AM', departureTime: '11:45 AM', cargo: 'HLXU-4567890', destination: 'Customer Site' }
    ];

    // Filter trucks based on status and search term
    const filteredTrucks = trucks.filter(truck => {
        const matchesFilter = filter === 'all' || truck.status === filter;
        const matchesSearch = truck.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             truck.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             truck.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             truck.cargo.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Stats for the dashboard
    const stats = [
        { name: 'In Yard', value: trucks.filter(t => t.status === 'in-yard').length },
        { name: 'Scheduled Today', value: trucks.filter(t => t.status === 'scheduled').length },
        { name: 'Completed Today', value: trucks.filter(t => t.status === 'completed').length },
        { name: 'Delayed', value: trucks.filter(t => t.status === 'delayed').length }
    ];

    // Status badge component
    const StatusBadge = ({ status }) => {
        const getStatusStyles = () => {
            switch(status) {
                case 'in-yard':
                    return 'bg-blue-100 text-blue-800';
                case 'scheduled':
                    return 'bg-yellow-100 text-yellow-800';
                case 'completed':
                    return 'bg-green-100 text-green-800';
                case 'delayed':
                    return 'bg-red-100 text-red-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-purple-800">Truck Manager</h1>
                    <p className="text-sm text-gray-500">Coordinate truck arrivals and departures</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                            <p className="text-2xl font-bold text-purple-700 mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'all' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                                All
                            </button>
                            <button 
                                onClick={() => setFilter('in-yard')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'in-yard' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                                In Yard
                            </button>
                            <button 
                                onClick={() => setFilter('scheduled')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'scheduled' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                                Scheduled
                            </button>
                            <button 
                                onClick={() => setFilter('completed')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'completed' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                                Completed
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search trucks..."
                                className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                {/* Trucks Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Truck ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Driver
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        License Plate
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Arrival
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Departure
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cargo
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Destination
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTrucks.map((truck) => (
                                    <tr key={truck.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {truck.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {truck.driver}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {truck.licensePlate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={truck.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {truck.arrivalTime}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {truck.departureTime}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {truck.cargo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {truck.destination}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button className="text-purple-600 hover:text-purple-900 mr-3">View</button>
                                            <button className="text-purple-600 hover:text-purple-900">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredTrucks.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-gray-500">No trucks match your search criteria</p>
                        </div>
                    )}
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
