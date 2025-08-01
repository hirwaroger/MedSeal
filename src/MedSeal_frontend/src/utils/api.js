import { MedSeal_backend } from 'declarations/MedSeal_backend';

export const addMedicine = async (medicineData) => {
    const payload = {
        name: medicineData.name,
        dosage: medicineData.dosage,
        frequency: medicineData.frequency,
        duration: medicineData.duration,
        side_effects: medicineData.side_effects,
        guide_text: medicineData.guide_text || "No guide available", // Required field with fallback
        guide_source: medicineData.guide_source || "Manual entry", // Required field with fallback
    };

    try {
        const result = await MedSeal_backend.add_medicine(payload);
        if ('Ok' in result) {
            return result.Ok;
        } else {
            throw new Error(result.Err);
        }
    } catch (error) {
        console.error('Error adding medicine:', error);
        throw error;
    }
};

// Additional API utilities for Material UI integration
export const handleApiError = (error) => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.message) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    return errorMessage;
};

export const formatApiResponse = (result) => {
    if (result && typeof result === 'object' && 'Ok' in result) {
        return { success: true, data: result.Ok };
    } else if (result && typeof result === 'object' && 'Err' in result) {
        return { success: false, error: result.Err };
    } else {
        return { success: false, error: 'Invalid response format' };
    }
};
