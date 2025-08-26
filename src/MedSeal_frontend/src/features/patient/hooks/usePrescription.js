import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export const usePrescription = (showAlert) => {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { authenticatedActor } = useAuth();

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
        console.log('LOG: Prescription fetched successfully:', result.Ok);
        setPrescription(result.Ok);
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
    setError(null);
  };

  return {
    prescription,
    loading,
    error,
    fetchPrescription,
    getMedicine,
    clearPrescription
  };
};
