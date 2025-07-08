export const addMedicine = async (medicineData) => {
    const payload = {
        name: medicineData.name,
        dosage: medicineData.dosage,
        frequency: medicineData.frequency,
        duration: medicineData.duration,
        side_effects: medicineData.side_effects,
        guide_text: medicineData.guide_text, // Required field
        guide_source: medicineData.guide_source, // Required field
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
