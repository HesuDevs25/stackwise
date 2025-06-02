"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upsertContainer } from '@/lib/utils/supabase/mutations';

export default function AddContainerPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        container_number: '',
        bl_number: '',
        type: '',
        size: '',
        seal_one: '',
        seal_two: '',
        seal_three: '',
        freight_indicator: '',
        number_of_packages: '',
        package_unit: '',
        weight: '',
        weight_unit: '',
        refere_plug: '',
        minimum_temperature: '',
        maximum_temperature: '',
        status: '',
        location: '',
        consignee_name: ''
    });

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
            
            if (!formData.container_number) {
                throw new Error('Container number is required');
            }

            // Convert empty strings to null for submission
            const containerData = Object.keys(formData).reduce((acc, key) => {
                acc[key] = formData[key] === '' ? null : formData[key];
                // Convert string numbers to actual numbers
                if (['number_of_packages', 'weight', 'minimum_temperature', 'maximum_temperature'].includes(key) && acc[key] !== null) {
                    acc[key] = Number(acc[key]);
                }
                return acc;
            }, {});

            await upsertContainer(containerData);
            router.push('/container-manager');
            
        } catch (err) {
            console.error('Error saving container:', err);
            alert(err.message || 'Failed to save container. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-amber-800">Add New Container</h1>
                        <p className="text-sm text-gray-500">Enter container details below</p>
                    </div>
                    <button
                        onClick={() => router.push('/container-manager')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    value={formData.bl_number || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="e.g., MBLHKG123456"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <input 
                                    type="text"
                                    name="type"
                                    value={formData.type || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="Container type"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Size</label>
                                <input 
                                    type="text"
                                    name="size"
                                    value={formData.size || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="e.g., 20ft, 40ft"
                                />
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
                                    value={formData.number_of_packages || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="e.g., 100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Package Unit</label>
                                <input 
                                    type="text"
                                    name="package_unit"
                                    value={formData.package_unit}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="e.g., BOXES, PALLETS"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Weight</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={formData.weight || ''}
                                    onChange={handleInputChange}
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
                                    <option value="TONNES">TONNES</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reefer Plug</label>
                                <select 
                                    name="refere_plug"
                                    value={formData.refere_plug}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="Y">Yes</option>
                                    <option value="N">No</option>
                                </select>
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
                                    <option value="awaiting-arrival">Awaiting Arrival</option>
                                    <option value="in-yard">In Yard</option>
                                    <option value="exited">Exited</option>
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
                                    value={formData.consignee_name || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="Consignee name"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-6">
                            <button
                                type="button"
                                onClick={() => router.push('/container-manager')}
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
                                        Adding...
                                    </>
                                ) : 'Add Container'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 