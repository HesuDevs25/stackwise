"use client";

import { useState, useEffect } from 'react';
import { fetchContainers } from '@/lib/utils/supabase/queries';
import { upsertContainer } from '@/lib/utils/supabase/mutations';
import { useRouter } from 'next/navigation';
import { processManifestUpload } from '@/lib/utils/excel/manifest';

export default function ContainersPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [containers, setContainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingContainer, setEditingContainer] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedContainers, setSelectedContainers] = useState(new Set());
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [formData, setFormData] = useState({
        container_number: '',
        bl_number: '',
        type: '40HC',
        size: '40',
        seal_one: '',
        seal_two: '',
        seal_three: '',
        freight_indicator: 'FCL',
        number_of_packages: '',
        package_unit: 'BOXES',
        weight: '',
        weight_unit: 'KG',
        refere_plug: '',
        minimum_temperature: '',
        maximum_temperature: '',
        status: 'booked',
        location: '',
        consignee_name: '',
        arrival_date: '',
        departure_date: ''
    });
    const [uploadStatus, setUploadStatus] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    // Load containers on component mount and when activeTab or searchTerm changes
    useEffect(() => {
        loadContainers();
    }, [activeTab, searchTerm]);

    const loadContainers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const filters = {
                status: activeTab !== 'all' ? activeTab : undefined,
                search: searchTerm || undefined
            };
            
            const data = await fetchContainers(filters);
            setContainers(data);
        } catch (err) {
            console.error('Error loading containers:', err);
            setError('Failed to load containers. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Stats calculation from real data
    const stats = [
        { name: 'Total Containers', value: containers.length },
        { name: 'Awaiting Arrival', value: containers.filter(c => c.status === 'awaiting-arrival').length },
        { name: 'In Yard', value: containers.filter(c => c.status === 'in-yard').length },
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            
            const containerData = {
                ...formData,
                id: editingContainer?.id
            };

            const updatedContainer = await upsertContainer(containerData);
            
            setContainers(prev => {
                const newContainers = [...prev];
                const index = newContainers.findIndex(c => c.id === updatedContainer.id);
                if (index !== -1) {
                    newContainers[index] = updatedContainer;
                } else {
                    newContainers.unshift(updatedContainer);
                }
                return newContainers;
            });

            setShowAddModal(false);
            setEditingContainer(null);
            setFormData({
                container_number: '',
                bl_number: '',
                type: '40HC',
                size: '40',
                seal_one: '',
                seal_two: '',
                seal_three: '',
                freight_indicator: 'FCL',
                number_of_packages: '',
                package_unit: 'BOXES',
                weight: '',
                weight_unit: 'KG',
                refere_plug: '',
                minimum_temperature: '',
                maximum_temperature: '',
                status: 'booked',
                location: '',
                consignee_name: '',
                arrival_date: '',
                departure_date: ''
            });
        } catch (err) {
            console.error('Error saving container:', err);
            alert(err.message || 'Failed to save container. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditContainer = (container) => {
        setEditingContainer(container);
        setFormData({
            container_number: container.container_number,
            bl_number: container.bl_number,
            type: container.type,
            size: container.size,
            seal_one: container.seal_one,
            seal_two: container.seal_two,
            seal_three: container.seal_three,
            freight_indicator: container.freight_indicator,
            number_of_packages: container.number_of_packages,
            package_unit: container.package_unit,
            weight: container.weight,
            weight_unit: container.weight_unit,
            refere_plug: container.refere_plug,
            minimum_temperature: container.minimum_temperature,
            maximum_temperature: container.maximum_temperature,
            status: container.status,
            location: container.location,
            consignee_name: container.consignee_name,
            arrival_date: container.arrival_date,
            departure_date: container.departure_date
        });
        setShowAddModal(true);
    };

    // Status badge component
    const StatusBadge = ({ status }) => {
        if (!status) return null; // Return nothing if status is null

        const getStatusStyles = () => {
            switch(status) {
                case 'in-yard':
                    return 'bg-green-100 text-green-800';
                case 'awaiting-arrival':
                    return 'bg-yellow-100 text-yellow-800';
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

    // Handle file upload
    const handleFileUpload = async (event) => {
        try {
            const file = event.target.files[0];
            if (!file) return;

            // Validate file type
            const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
            if (!validTypes.includes(file.type)) {
                throw new Error('Please upload a valid Excel file (.xlsx or .xls)');
            }

            setIsUploading(true);
            setUploadStatus(null);

            const results = await processManifestUpload(file);
            
            setUploadStatus({
                type: 'success',
                message: `Successfully uploaded ${results.success} containers. Failed: ${results.failed}`,
                details: results.errors
            });

            // Refresh the containers list
            loadContainers();
        } catch (error) {
            console.error("Error uploading manifest:", error);
            setUploadStatus({
                type: 'error',
                message: error.message || 'Failed to upload manifest',
                details: []
            });
        } finally {
            setIsUploading(false);
            // Reset the file input
            event.target.value = '';
        }
    };

    // Add new function to handle checkbox selection
    const handleContainerSelect = (containerId) => {
        setSelectedContainers(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(containerId)) {
                newSelected.delete(containerId);
            } else {
                newSelected.add(containerId);
            }
            return newSelected;
        });
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedContainers(new Set(containers.map(container => container.id)));
        } else {
            setSelectedContainers(new Set());
        }
    };

    // Add new function to handle dropdown toggle
    const handleDropdownToggle = (containerId, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === containerId ? null : containerId);
    };

    // Add click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdownId) {
                setOpenDropdownId(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [openDropdownId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-amber-800">Container Manager</h1>
                            <p className="text-sm text-gray-500">Track and manage container inventory</p>
                        </div>
                        <div className="flex space-x-4">
                            {/* Upload Manifest Button */}
                            <div className="relative">
                                <input
                                    type="file"
                                    id="manifest-upload"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                <label
                                    htmlFor="manifest-upload"
                                    className={`cursor-pointer inline-flex items-center px-4 py-2 border border-amber-300 text-sm font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isUploading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            Upload Manifest
                                        </>
                                    )}
                                </label>
                            </div>
                            
                            {/* Add Container Button */}
                            <button
                                onClick={() => router.push('/container-manager/add')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Container
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Upload Status Message */}
            {uploadStatus && (
                <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 ${uploadStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} rounded-md p-4`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {uploadStatus.type === 'error' ? (
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{uploadStatus.message}</p>
                            {uploadStatus.details.length > 0 && (
                                <div className="mt-2">
                                    <div className="text-sm">
                                        <p className="font-medium">Failed containers:</p>
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            {uploadStatus.details.map((error, index) => (
                                                <li key={index}>
                                                    {error.container_number}: {error.error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                            <p className="text-2xl font-bold text-amber-700 mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Tabs and Search */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'all' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                                All Containers
                            </button>
                            <button 
                                onClick={() => setActiveTab('in-yard')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'in-yard' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                                In Yard
                            </button>
                            <button 
                                onClick={() => setActiveTab('awaiting-arrival')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'awaiting-arrival' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                                Awaiting Arrival
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search containers..."
                                className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                    </div>
                ) : (
                    /* Containers Table */
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            #
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                                                checked={containers.length > 0 && selectedContainers.size === containers.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Container ID
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            B/L Number
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Size
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Freight Indicator
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {containers.map((container, index) => (
                                        <tr key={container.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                                                    checked={selectedContainers.has(container.id)}
                                                    onChange={() => handleContainerSelect(container.id)}
                                                />
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {container.container_number}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                {container.bl_number}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                {container.type}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                {container.size}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <StatusBadge status={container.status} />
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                {container.freight_indicator}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center space-x-2">
                                                    <button 
                                                        onClick={() => router.push(`/container-manager/view/${container.container_number}`)}
                                                        className="text-amber-600 hover:text-amber-900 p-1 rounded-full hover:bg-amber-50"
                                                        title="View Details"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button 
                                                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                                        title="Delete Container"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                    <div className="relative">
                                                        <button 
                                                            className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-50"
                                                            title="More Options"
                                                            onClick={(e) => handleDropdownToggle(container.id, e)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                            </svg>
                                                        </button>
                                                        {openDropdownId === container.id && (
                                                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                                                <div className="py-1" role="menu" aria-orientation="vertical">
                                                                    <button
                                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                        role="menuitem"
                                                                    >
                                                                        Visit Location
                                                                    </button>
                                                                    <button
                                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                        role="menuitem"
                                                                    >
                                                                        Container History
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {containers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No containers found matching your criteria.</p>
                    </div>
                )}
            </main>

            {/* Add/Edit Container Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingContainer ? 'Edit Container' : 'Add New Container'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingContainer(null);
                                    setFormData({
                                        container_number: '',
                                        bl_number: '',
                                        type: '40HC',
                                        size: '40',
                                        seal_one: '',
                                        seal_two: '',
                                        seal_three: '',
                                        freight_indicator: 'FCL',
                                        number_of_packages: '',
                                        package_unit: 'BOXES',
                                        weight: '',
                                        weight_unit: 'KG',
                                        refere_plug: '',
                                        minimum_temperature: '',
                                        maximum_temperature: '',
                                        status: 'booked',
                                        location: '',
                                        consignee_name: '',
                                        arrival_date: '',
                                        departure_date: ''
                                    });
                                }}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Container Number</label>
                                    <input
                                        type="text"
                                        name="container_number"
                                        value={formData.container_number}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="e.g., MSCU-1234567"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bill of Lading Number</label>
                                    <input
                                        type="text"
                                        name="bl_number"
                                        value={formData.bl_number}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="e.g., MBLHKG123456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select 
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="20GP">20GP</option>
                                        <option value="40GP">40GP</option>
                                        <option value="40HC">40HC</option>
                                        <option value="20RF">20RF</option>
                                        <option value="40RF">40RF</option>
                                        <option value="20OT">20OT</option>
                                        <option value="40OT">40OT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Size</label>
                                    <select 
                                        name="size"
                                        value={formData.size}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="20">20</option>
                                        <option value="40">40</option>
                                        <option value="45">45</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Seal #1</label>
                                    <input
                                        type="text"
                                        name="seal_one"
                                        value={formData.seal_one}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="Primary seal number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Seal #2</label>
                                    <input
                                        type="text"
                                        name="seal_two"
                                        value={formData.seal_two}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="Secondary seal number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Seal #3</label>
                                    <input
                                        type="text"
                                        name="seal_three"
                                        value={formData.seal_three}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="Additional seal number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Freight Indicator</label>
                                    <select 
                                        name="freight_indicator"
                                        value={formData.freight_indicator}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="FCL">FCL</option>
                                        <option value="LCL">LCL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Number of Packages</label>
                                    <input
                                        type="number"
                                        name="number_of_packages"
                                        value={formData.number_of_packages}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="e.g., 100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Package Unit</label>
                                    <select 
                                        name="package_unit"
                                        value={formData.package_unit}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="BOXES">BOXES</option>
                                        <option value="PALLETS">PALLETS</option>
                                        <option value="BAGS">BAGS</option>
                                        <option value="DRUMS">DRUMS</option>
                                        <option value="UNITS">UNITS</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Weight</label>
                                    <input
                                        type="number"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="e.g., 12500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Weight Unit</label>
                                    <select 
                                        name="weight_unit"
                                        value={formData.weight_unit}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="KG">KG</option>
                                        <option value="LB">LB</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Reefer Plug</label>
                                    <input
                                        type="text"
                                        name="refere_plug"
                                        value={formData.refere_plug}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="Reefer plug details"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Minimum Temperature (°C)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="minimum_temperature"
                                        value={formData.minimum_temperature}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="e.g., -18.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Maximum Temperature (°C)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="maximum_temperature"
                                        value={formData.maximum_temperature}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="e.g., -16.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select 
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="booked">Booked</option>
                                        <option value="in-transit">In Transit</option>
                                        <option value="in-yard">In Yard</option>
                                        <option value="delivered">Delivered</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="e.g., Block A-12-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Consignee Name</label>
                                    <input
                                        type="text"
                                        name="consignee_name"
                                        value={formData.consignee_name}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="Consignee name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Arrival Date</label>
                                    <input
                                        type="date"
                                        name="arrival_date"
                                        value={formData.arrival_date}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Departure Date</label>
                                    <input
                                        type="date"
                                        name="departure_date"
                                        value={formData.departure_date}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingContainer(null);
                                    }}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {editingContainer ? 'Updating...' : 'Adding...'}
                                        </>
                                    ) : (
                                        editingContainer ? 'Update Container' : 'Add Container'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
