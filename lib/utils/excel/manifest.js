import * as XLSX from 'xlsx';
import { upsertContainer } from '@/lib/utils/supabase/mutations';

// Define the mapping between Excel headers and database fields
const HEADER_MAPPING = {
    'M B/L No': 'bl_number',
    'Type': 'type',
    'Container No / Chassis No': 'container_number',
    'Container Size': 'size',
    'Seal No#1': 'seal_one',
    'Seal No#2': 'seal_two',
    'Seal No#3': 'seal_three',
    'Freight Indicator': 'freight_indicator',
    'Number of Packages': 'number_of_packages',
    'Package Unit': 'package_unit',
    'Weight': 'weight',
    'Weight Unit': 'weight_unit',
    'Refer Plug Y/N': 'refere_plug',
    'Minimum Temperature': 'minimum_temperature',
    'Maxmum Temperature': 'maximum_temperature' // Note: Excel header has a typo
};

export async function processManifestUpload(file) {
    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);

        // Check for the specific sheet name "Container (2)"
        const REQUIRED_SHEET_NAME = 'Container (2)';
        const containerSheet = workbook.Sheets[REQUIRED_SHEET_NAME];
        
        if (!containerSheet) {
            const availableSheets = workbook.SheetNames;
            throw new Error(`Manifest must contain a sheet named "${REQUIRED_SHEET_NAME}". Available sheets are: ${availableSheets.join(', ')}`);
        }

        // Convert sheet to JSON with raw headers
        const containers = XLSX.utils.sheet_to_json(containerSheet);
        if (!containers.length) {
            throw new Error('No containers found in the manifest');
        }

        // Process each container
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const rawContainer of containers) {
            try {
                // Map Excel headers to database fields
                const mappedContainer = {};
                
                // Process each field in the raw container data
                Object.entries(rawContainer).forEach(([excelHeader, value]) => {
                    const dbField = HEADER_MAPPING[excelHeader];
                    if (dbField) {
                        // Handle empty values
                        if (value === '' || value === undefined || value === null) {
                            mappedContainer[dbField] = null;
                            return;
                        }

                        // Handle specific field transformations
                        switch (dbField) {
                            case 'number_of_packages':
                            case 'weight':
                            case 'minimum_temperature':
                            case 'maximum_temperature':
                                mappedContainer[dbField] = value === '' ? null : Number(value);
                                break;
                            
                            case 'refere_plug':
                                // Convert Y/N to database format
                                mappedContainer[dbField] = value.toString().toUpperCase() === 'Y' ? 'Y' : 'N';
                                break;
                            
                            case 'freight_indicator':
                                // Ensure consistent format for freight indicator
                                mappedContainer[dbField] = value.toString().toUpperCase();
                                break;
                            
                            case 'package_unit':
                            case 'weight_unit':
                                // Convert units to uppercase
                                mappedContainer[dbField] = value.toString().toUpperCase();
                                break;
                            
                            default:
                                // For all other fields, store as is
                                mappedContainer[dbField] = value;
                        }
                    }
                });

                // Validate required fields
                if (!mappedContainer.container_number) {
                    throw new Error('Container number is required');
                }

                // Insert into database
                await upsertContainer(mappedContainer);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    container_number: rawContainer['Container No / Chassis No'] || 'Unknown',
                    error: error.message
                });
            }
        }

        return results;
    } catch (error) {
        console.error('Error processing manifest:', error);
        throw error;
    }
} 