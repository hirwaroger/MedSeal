import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';

// Helper function to safely convert BigInt to Number for timestamps
const convertBigIntTimestamp = (timestamp) => {
  // Handle array of BigInt (IC sometimes returns arrays for optional values)
  if (Array.isArray(timestamp) && timestamp.length > 0) {
    const firstValue = timestamp[0];
    if (typeof firstValue === 'bigint') {
      const numericTimestamp = Number(firstValue);
      return Math.floor(numericTimestamp / 1000000);
    }
    return firstValue;
  }
  
  if (typeof timestamp === 'bigint') {
    // Convert BigInt to Number and handle nanoseconds to milliseconds conversion
    const numericTimestamp = Number(timestamp);
    // IC timestamps are in nanoseconds, convert to milliseconds
    return Math.floor(numericTimestamp / 1000000);
  }
  if (typeof timestamp === 'string') {
    const parsed = parseInt(timestamp, 10);
    return Math.floor(parsed / 1000000);
  }
  if (typeof timestamp === 'number') {
    // If it's already a number, check if it needs nanosecond conversion
    return timestamp > 1e15 ? Math.floor(timestamp / 1000000) : timestamp;
  }
  return timestamp;
};

// Helper function to safely serialize objects with BigInt values
const safeBigIntStringify = (obj) => {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return convertBigIntTimestamp(value);
    }
    return value;
  });
};

// Helper function to normalize prescription data for safe serialization
const normalizePrescriptionData = (prescription) => {
  console.log('LOG: Normalizing prescription data:', prescription);
  console.log('LOG: Original created_at:', prescription.created_at, 'type:', typeof prescription.created_at);
  console.log('LOG: Original accessed_at:', prescription.accessed_at, 'type:', typeof prescription.accessed_at);
  
  const normalized = {
    ...prescription,
    created_at: convertBigIntTimestamp(prescription.created_at),
    accessed_at: prescription.accessed_at ? convertBigIntTimestamp(prescription.accessed_at) : null
  };
  
  console.log('LOG: Normalized created_at:', normalized.created_at);
  console.log('LOG: Normalized accessed_at:', normalized.accessed_at);
  
  return normalized;
};

// Helper function to normalize medicine data
const normalizeMedicineData = (medicine) => {
  return {
    ...medicine,
    created_at: convertBigIntTimestamp(medicine.created_at)
  };
};

export const usePrescription = (showAlert) => {
  const [prescription, setPrescription] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { authenticatedActor, user, user_principal } = useAuth(); // include user & principal

  // Derive per-user history key
  const historyKey = user ? `prescriptionHistory_${user.id}` : null;

  // Load prescription history scoped per user
  useEffect(() => {
    if (!historyKey) {
      setPrescriptionHistory([]);
      return;
    }
    try {
      const saved = localStorage.getItem(historyKey);
      if (saved) {
        setPrescriptionHistory(JSON.parse(saved));
      } else {
        setPrescriptionHistory([]);
      }
    } catch (e) {
      console.error('Error parsing prescription history for user', user?.id, e);
      setPrescriptionHistory([]);
    }
  }, [historyKey, user?.id]);

  // Helper unwrap opt nat64 ([], [val], val)
  const unwrapOptNat64 = (val) => {
    if (Array.isArray(val)) return val.length ? val[0] : null;
    return val;
  };

  // Load prescription history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('prescriptionHistory');
    if (savedHistory) {
      try {
        setPrescriptionHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading prescription history:', error);
      }
    }
  }, []);

  const savePrescriptionToHistory = (prescriptionData, medicinesData) => {
    if (!historyKey) return;
    try {
      // Only store if prescription is actually claimed by this patient (avoid leaking)
      const claimedPrincipal = prescriptionData.patient_principal
        ? (Array.isArray(prescriptionData.patient_principal)
            ? prescriptionData.patient_principal[0]
            : prescriptionData.patient_principal)
        : null;
      if (claimedPrincipal && user_principal && claimedPrincipal.toLowerCase() !== user_principal.trim().toLowerCase()) {
        console.log('LOG: Not saving prescription to history - claimed by different principal');
        return;
      }
      if (!claimedPrincipal) {
        console.log('LOG: Not saving unclaimed prescription to history');
        return;
      }

      const normalizedPrescription = normalizePrescriptionData(prescriptionData);
      const normalizedMedicines = medicinesData.map(med => ({
        ...med,
        medicine: med.medicine ? normalizeMedicineData(med.medicine) : null
      }));

      const historyEntry = {
        id: normalizedPrescription.id,
        patient_name: normalizedPrescription.patient_name,
        created_at: normalizedPrescription.created_at,
        accessed_at: Date.now(),
        medicines_count: normalizedMedicines.length,
        doctor_notes: normalizedPrescription.additional_notes,
        prescription_data: normalizedPrescription,
        medicines_data: normalizedMedicines
      };

      const updatedHistory = [
        historyEntry,
        ...prescriptionHistory.filter(h => h.id !== normalizedPrescription.id)
      ].slice(0, 10);

      setPrescriptionHistory(updatedHistory);
      const historyJson = safeBigIntStringify(updatedHistory);
      localStorage.setItem(historyKey, historyJson);
    } catch (error) {
      console.error('LOG: Error saving prescription to history:', error);
      showAlert('warning', 'Prescription loaded but could not save to history');
    }
  };

  const fetchPrescription = async (prescriptionId, code) => {
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('LOG: Fetching prescription with ID:', prescriptionId, 'Code:', code);
      
      const result = await authenticatedActor.get_prescription(prescriptionId, code);
      console.log('LOG: Fetch prescription result:', result);
      
      if ('Ok' in result) {
        const prescriptionData = result.Ok;
        // Unwrap optional accessed_at if array
        prescriptionData.accessed_at = unwrapOptNat64(prescriptionData.accessed_at);
        console.log('LOG: Prescription fetched successfully:', prescriptionData);
        
        // Normalize prescription data immediately to handle BigInt timestamps
        const normalizedPrescription = normalizePrescriptionData(prescriptionData);
        console.log('LOG: Normalized prescription data:', normalizedPrescription);
        
        // Get medicine details for each medicine in the prescription
        const medicinesWithDetails = await Promise.all(
          prescriptionData.medicines.map(async (prescriptionMedicine) => {
            try {
              const medicineResult = await authenticatedActor.get_medicine(prescriptionMedicine.medicine_id);
              console.log('LOG: Fetched medicine:', medicineResult, 'for ID:', prescriptionMedicine.medicine_id);
              
              // Handle case where backend returns an array or single object
              let medicine = null;
              if (Array.isArray(medicineResult) && medicineResult.length > 0) {
                medicine = medicineResult[0];
              } else if (medicineResult && !Array.isArray(medicineResult)) {
                medicine = medicineResult;
              }
              
              if (medicine) {
                // Normalize medicine data
                const normalizedMedicine = normalizeMedicineData(medicine);
                
                return {
                  medicine_id: prescriptionMedicine.medicine_id,
                  custom_dosage: prescriptionMedicine.custom_dosage || null,
                  custom_instructions: prescriptionMedicine.custom_instructions || '',
                  medicine: {
                    id: normalizedMedicine.id,
                    name: normalizedMedicine.name,
                    dosage: normalizedMedicine.dosage,
                    frequency: normalizedMedicine.frequency,
                    duration: normalizedMedicine.duration,
                    side_effects: normalizedMedicine.side_effects,
                    guide_text: normalizedMedicine.guide_text,
                    is_active: normalizedMedicine.is_active,
                    created_at: normalizedMedicine.created_at
                  }
                };
              } else {
                console.warn('LOG: Medicine not found for ID:', prescriptionMedicine.medicine_id);
                return {
                  medicine_id: prescriptionMedicine.medicine_id,
                  custom_dosage: prescriptionMedicine.custom_dosage || null,
                  custom_instructions: prescriptionMedicine.custom_instructions || '',
                  medicine: null
                };
              }
            } catch (error) {
              console.error('LOG: Error fetching medicine for ID:', prescriptionMedicine.medicine_id, error);
              return {
                medicine_id: prescriptionMedicine.medicine_id,
                custom_dosage: prescriptionMedicine.custom_dosage || null,
                custom_instructions: prescriptionMedicine.custom_instructions || '',
                medicine: null
              };
            }
          })
        );
        
        console.log('LOG: All medicine details processed:', medicinesWithDetails);
        console.log('LOG: Medicine details count:', medicinesWithDetails.length);
        
        // Set normalized data in state
        setPrescription(normalizedPrescription);
        setMedicines(medicinesWithDetails);
        
        console.log('LOG: State updated - prescription set');
        console.log('LOG: State updated - medicines set to count:', medicinesWithDetails.length);
        
        // Save to history with normalized data
        savePrescriptionToHistory(normalizedPrescription, medicinesWithDetails);
        
        showAlert('success', 'Prescription loaded successfully!');
        return true;
      } else {
        console.error('LOG: Failed to fetch prescription:', result.Err);
        const errorMessage = result.Err;
        setError(errorMessage);
        showAlert('error', 'Error: ' + errorMessage);
        return false;
      }
    } catch (error) {
      console.error('LOG: Error fetching prescription:', error);
      const errorMessage = error.message || 'Failed to fetch prescription';
      setError(errorMessage);
      showAlert('error', 'Error fetching prescription: ' + errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadPrescriptionFromHistory = (historyEntry) => {
    try {
      setPrescription(historyEntry.prescription_data);
      setMedicines(historyEntry.medicines_data);
      showAlert('info', 'Prescription loaded from history');
      return true;
    } catch (error) {
      console.error('Error loading from history:', error);
      showAlert('error', 'Error loading prescription from history');
      return false;
    }
  };

  const getMedicine = async (medicineId) => {
    if (!authenticatedActor) {
      console.error('LOG: No authenticated actor available');
      return null;
    }

    try {
      console.log('LOG: Fetching medicine with ID:', medicineId);
      
      const medicine = await authenticatedActor.get_medicine(medicineId);
      console.log('LOG: Fetched medicine:', medicine);
      
      return medicine || null;
    } catch (error) {
      console.error('LOG: Error fetching medicine:', error);
      return null;
    }
  };

  const clearPrescription = () => {
    setPrescription(null);
    setMedicines([]);
    setError(null);
  };

  return {
    prescription,
    medicines,
    prescriptionHistory,
    loading,
    error,
    fetchPrescription,
    loadPrescriptionFromHistory,
    getMedicine,
    clearPrescription
  };
};
