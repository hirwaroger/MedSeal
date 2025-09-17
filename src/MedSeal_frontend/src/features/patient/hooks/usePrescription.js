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
      showAlert('error', 'Backend connection not available. Please refresh the page and try again.');
      return false;
    }

    if (!prescriptionId || !code) {
      showAlert('error', 'Both prescription ID and code are required');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('LOG: Fetching prescription with ID:', prescriptionId, 'Code:', code);
      console.log('LOG: Using authenticated actor:', !!authenticatedActor);
      
      let result;
      try {
        // Try the updated get_prescription method with separate arguments
        console.log('LOG: Calling get_prescription with separate arguments');
        result = await authenticatedActor.get_prescription(prescriptionId, code);
        console.log('LOG: get_prescription result:', result);
      } catch (firstError) {
        console.log('LOG: get_prescription failed, trying get_prescription_by_code:', firstError);
        
        // If that fails, try get_prescription_by_code with combined format
        const combinedCode = `${prescriptionId}-${code}`;
        try {
          const directResult = await authenticatedActor.get_prescription_by_code(combinedCode);
          if (directResult && directResult.length > 0) {
            result = { Ok: directResult[0] };
          } else if (directResult) {
            result = { Ok: directResult };
          } else {
            throw new Error('Prescription not found');
          }
          console.log('LOG: get_prescription_by_code result:', result);
        } catch (secondError) {
          console.log('LOG: Both methods failed, trying legacy method');
          // Last resort: try with patient contact (legacy)
          try {
            result = await authenticatedActor.get_prescription_legacy(prescriptionId, code);
          } catch (thirdError) {
            throw firstError; // Throw the original error
          }
        }
      }
      
      console.log('LOG: Final fetch prescription result:', result);
      
      // Handle Result<Prescription, String> format
      let prescriptionData = null;
      if (result && 'Ok' in result) {
        prescriptionData = result.Ok;
      } else if (result && typeof result === 'object' && !('Err' in result)) {
        // Direct prescription object
        prescriptionData = result;
      } else if (result && 'Err' in result) {
        console.error('LOG: Backend returned error:', result.Err);
        setError(result.Err);
        showAlert('error', result.Err);
        return false;
      }
      
      if (!prescriptionData) {
        console.error('LOG: No prescription data found');
        setError('Prescription not found');
        showAlert('error', 'Prescription not found. Please check the prescription ID and code.');
        return false;
      }
      
      // Unwrap optional accessed_at if array
      prescriptionData.accessed_at = unwrapOptNat64(prescriptionData.accessed_at);
      console.log('LOG: Prescription fetched successfully:', prescriptionData);
      
      // Normalize prescription data immediately to handle BigInt timestamps
      const normalizedPrescription = normalizePrescriptionData(prescriptionData);
      console.log('LOG: Normalized prescription data:', normalizedPrescription);
      
      // Clear previous state first
      setPrescription(null);
      setMedicines([]);
      
      // Set prescription first
      setPrescription(normalizedPrescription);
      
      // Get medicine details for each medicine in the prescription
      console.log('LOG: Starting to fetch medicine details for', prescriptionData.medicines.length, 'medicines');
      const medicinesWithDetails = await Promise.all(
        prescriptionData.medicines.map(async (prescriptionMedicine, index) => {
          try {
            console.log(`LOG: Fetching medicine ${index + 1}/${prescriptionData.medicines.length} for ID:`, prescriptionMedicine.medicine_id);
            
            let medicineResult;
            try {
              // Try get_all_medicines first as it's more reliable
              const allMedicines = await authenticatedActor.get_all_medicines();
              console.log('LOG: Got all medicines, count:', allMedicines.length);
              medicineResult = allMedicines.find(m => m.id === prescriptionMedicine.medicine_id);
              console.log('LOG: Found medicine in all medicines:', !!medicineResult);
              
              // If not found in all medicines, try direct lookup
              if (!medicineResult) {
                console.log('LOG: Medicine not found in all medicines, trying direct get_medicine');
                medicineResult = await authenticatedActor.get_medicine?.(prescriptionMedicine.medicine_id);
              }
            } catch (medicineError) {
              console.log('LOG: Error fetching medicine:', medicineError);
              medicineResult = null;
            }
            
            console.log('LOG: Final medicine result for ID', prescriptionMedicine.medicine_id, ':', medicineResult);
            
            // Handle case where backend returns different formats
            let medicine = null;
            if (medicineResult && 'Ok' in medicineResult) {
              medicine = medicineResult.Ok;
            } else if (Array.isArray(medicineResult) && medicineResult.length > 0) {
              medicine = medicineResult[0];
            } else if (medicineResult && !Array.isArray(medicineResult) && typeof medicineResult === 'object') {
              medicine = medicineResult;
            }
            
            if (medicine) {
              // Normalize medicine data
              const normalizedMedicine = normalizeMedicineData(medicine);
              console.log('LOG: Successfully normalized medicine:', normalizedMedicine.name);
              
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
      console.log('LOG: Medicines with valid data:', medicinesWithDetails.filter(m => m.medicine).length);
      
      // Set medicines state
      setMedicines(medicinesWithDetails);
      
      console.log('LOG: State updated - medicines set to count:', medicinesWithDetails.length);
      
      // Save to history with normalized data
      savePrescriptionToHistory(normalizedPrescription, medicinesWithDetails);
      
      return true;
    } catch (error) {
      console.error('LOG: Error fetching prescription:', error);
      const errorMessage = error.message || 'Failed to fetch prescription';
      setError(errorMessage);
      
      let userErrorMessage = 'Error fetching prescription: ';
      if (error.message && error.message.includes('Network')) {
        userErrorMessage += 'Network connection issue. Please check your connection and try again.';
      } else if (error.message && error.message.includes('timeout')) {
        userErrorMessage += 'Request timed out. Please try again.';
      } else if (error.message && error.message.includes('Authentication')) {
        userErrorMessage += 'Authentication error. Please refresh the page and try again.';
      } else if (error.message && error.message.includes('Invalid')) {
        userErrorMessage += 'Invalid data provided. Please check your prescription code.';
      } else if (error.message && error.message.includes('decode call arguments')) {
        userErrorMessage += 'System compatibility issue. The prescription format may have changed. Please contact support.';
      } else if (error.message && error.message.includes('Canister')) {
        userErrorMessage += 'Backend service error. Please try again in a moment or contact support.';
      } else if (error.message && error.message.includes('trap')) {
        userErrorMessage += 'System error occurred. Please verify your prescription code format and try again.';
      } else if (error.message && error.message.includes('No more values on the wire')) {
        userErrorMessage += 'Invalid prescription code format. Please check your prescription code and try again.';
      } else if (error.message) {
        userErrorMessage += error.message;
      } else {
        userErrorMessage += 'An unexpected error occurred. Please try again later.';
      }
      
      showAlert('error', userErrorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadPrescriptionFromHistory = (historyEntry) => {
    try {
      console.log('LOG: Loading prescription from history:', historyEntry);
      
      // Clear current state first
      setPrescription(null);
      setMedicines([]);
      
      // Set state from history
      setPrescription(historyEntry.prescription_data);
      setMedicines(historyEntry.medicines_data);
      
      console.log('LOG: Loaded from history - prescription:', historyEntry.prescription_data);
      console.log('LOG: Loaded from history - medicines count:', historyEntry.medicines_data.length);
      
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