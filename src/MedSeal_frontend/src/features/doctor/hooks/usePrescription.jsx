import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export function usePrescription(user, showAlert) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const { authenticatedActor } = useAuth();

  useEffect(() => {
    if (user && authenticatedActor) {
      loadPrescriptions();
    }
  }, [user, authenticatedActor]);

  const loadPrescriptions = async () => {
    if (!authenticatedActor || !user) {
      console.log('LOG: Cannot load prescriptions - missing actor or user');
      return;
    }

    try {
      setLoading(true);
      console.log('LOG: Loading prescriptions for user:', user.id);
      
      const result = await authenticatedActor.get_doctor_prescriptions(user.id);
      console.log('LOG: Loaded prescriptions result:', result);
      
      setPrescriptions(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('LOG: Error loading prescriptions:', error);
      showAlert('error', 'Error loading prescriptions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createPrescription = async (prescriptionData) => {
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available');
      return false;
    }

    if (selectedMedicines.length === 0) {
      showAlert('warning', 'Please select at least one medicine');
      return false;
    }

    setLoading(true);
    try {
      console.log('LOG: Creating prescription with data:', prescriptionData);
      console.log('LOG: Selected medicines:', selectedMedicines);
      
      const dataWithMedicines = {
        ...prescriptionData,
        medicines: selectedMedicines.map(med => ({
          medicine_id: med.id,
          custom_dosage: med.custom_dosage && med.custom_dosage.trim() ? [med.custom_dosage.trim()] : [],
          custom_instructions: med.custom_instructions || ''
        }))
      };
      
      console.log('LOG: Final prescription data:', dataWithMedicines);
      
      const result = await authenticatedActor.create_prescription(dataWithMedicines);
      console.log('LOG: Create prescription result:', result);
      
      if ('Ok' in result) {
        setSelectedMedicines([]);
        await loadPrescriptions();
        
        const prescriptionCode = result.Ok;
        showAlert('success', `Prescription created successfully! Share this code with your patient: ${prescriptionCode}`);
        return true;
      } else {
        console.error('LOG: Failed to create prescription:', result.Err);
        showAlert('error', 'Error: ' + result.Err);
        return false;
      }
    } catch (error) {
      console.error('LOG: Error creating prescription:', error);
      showAlert('error', 'Error creating prescription: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addMedicineToSelection = (medicine) => {
    if (!medicine.is_active) {
      showAlert('warning', 'Cannot add inactive medicine to prescription');
      return;
    }
    
    if (!selectedMedicines.find(m => m.id === medicine.id)) {
      setSelectedMedicines([...selectedMedicines, {
        ...medicine,
        custom_dosage: '',
        custom_instructions: ''
      }]);
    }
  };

  const removeMedicineFromSelection = (medicineId) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.id !== medicineId));
  };

  const updateSelectedMedicine = (medicineId, field, value) => {
    setSelectedMedicines(selectedMedicines.map(m => 
      m.id === medicineId ? { ...m, [field]: value } : m
    ));
  };

  return {
    prescriptions,
    selectedMedicines,
    loading,
    createPrescription,
    addMedicineToSelection,
    removeMedicineFromSelection,
    updateSelectedMedicine,
    loadPrescriptions
  };
}
