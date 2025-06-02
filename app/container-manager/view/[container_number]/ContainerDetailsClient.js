"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchContainerByNumber } from '@/lib/utils/supabase/queries';
import { upsertContainer } from '@/lib/utils/supabase/mutations';

// Helper function to format dates
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
};

export default function ContainerDetailsClient({ containerNumber }) {
    const router = useRouter();
    const [container, setContainer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadContainer();
    }, [containerNumber]);

    const loadContainer = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchContainerByNumber(containerNumber);
            if (!data) {
                throw new Error('Container not found');
            }
            setContainer(data);
            setFormData(data);
        } catch (err) {
            console.error('Error loading container:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        // Convert numeric values appropriately
        const processedValue = type === 'number' ? 
            (value === '' ? null : Number(value)) : 
            value;
        
        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await upsertContainer(formData);
            setContainer(formData);
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating container:', err);
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const renderField = (label, name, type = 'text', options = null) => {
        if (isEditing) {
            if (options) {
                return (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{label}</label>
                        <select
                            name={name}
                            value={formData[name] || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="">Select {label}</option>
                            {options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                );
            }
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <input
                        type={type}
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    />
                </div>
            );
        }
        return (
            <div>
                <label className="block text-sm font-medium text-gray-500">{label}</label>
                <p className="mt-1 text-sm text-gray-900">
                    {name === 'status' ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            container[name] === 'in-yard' ? 'bg-green-100 text-green-800' :
                            container[name] === 'awaiting-arrival' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {container[name] ? container[name].charAt(0).toUpperCase() + container[name].slice(1).replace('-', ' ') : '-'}
                        </span>
                    ) : name.includes('_at') ? (
                        formatDate(container[name])
                    ) : (
                        container[name] || '-'
                    )}
                </p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-amber-800">Container Details</h1>
                        <p className="text-sm text-gray-500">View and manage container information</p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Back
                        </button>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Modify
                            </button>
                        )}
                    </div>
                </div>

                {/* Container Details */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {renderField('Container Number', 'container_number')}
                                {renderField('B/L Number', 'bl_number')}
                                {renderField('Type', 'type', 'text', ['DRY', 'REEFER', 'OPEN_TOP', 'FLAT_RACK', 'TANK'])}
                                {renderField('Size', 'size', 'text', ['20', '40', '45'])}
                                {renderField('Seal One', 'seal_one')}
                                {renderField('Seal Two', 'seal_two')}
                                {renderField('Seal Three', 'seal_three')}
                                {renderField('Freight Indicator', 'freight_indicator', 'text', ['FCL', 'LCL'])}
                                {renderField('Number of Packages', 'number_of_packages', 'number')}
                                {renderField('Package Unit', 'package_unit')}
                                {renderField('Weight', 'weight', 'number')}
                                {renderField('Weight Unit', 'weight_unit', 'text', ['KG', 'TON'])}
                                {renderField('Refere Plug', 'refere_plug')}
                                {renderField('Minimum Temperature', 'minimum_temperature', 'number')}
                                {renderField('Maximum Temperature', 'maximum_temperature', 'number')}
                                {renderField('Status', 'status', 'text', ['awaiting-arrival', 'in-yard', 'exited'])}
                                {renderField('Location', 'location')}
                                {renderField('Consignee Name', 'consignee_name')}
                            </div>

                            <div className="flex justify-end space-x-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
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
                                            Saving...
                                        </>
                                    ) : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {renderField('Container Number', 'container_number')}
                            {renderField('B/L Number', 'bl_number')}
                            {renderField('Type', 'type')}
                            {renderField('Size', 'size')}
                            {renderField('Seal One', 'seal_one')}
                            {renderField('Seal Two', 'seal_two')}
                            {renderField('Seal Three', 'seal_three')}
                            {renderField('Freight Indicator', 'freight_indicator')}
                            {renderField('Number of Packages', 'number_of_packages')}
                            {renderField('Package Unit', 'package_unit')}
                            {renderField('Weight', 'weight')}
                            {renderField('Weight Unit', 'weight_unit')}
                            {renderField('Refere Plug', 'refere_plug')}
                            {renderField('Minimum Temperature', 'minimum_temperature')}
                            {renderField('Maximum Temperature', 'maximum_temperature')}
                            {renderField('Status', 'status')}
                            {renderField('Location', 'location')}
                            {renderField('Consignee Name', 'consignee_name')}
                            {renderField('Created At', 'created_at')}
                            {renderField('Updated At', 'updated_at')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 