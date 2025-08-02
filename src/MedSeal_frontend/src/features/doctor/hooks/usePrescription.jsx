import { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

export function usePrescription(user, showAlert) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrescriptions();
  }, [user]);

  const loadPrescriptions = async () => {
    try {
      const result = await MedSeal_backend.get_doctor_prescriptions(user.id);
      setPrescriptions(result || []);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const createPrescription = async (prescriptionData) => {
    if (selectedMedicines.length === 0) {
      showAlert('warning', 'Please select at least one medicine');
      return false;
    }

    setLoading(true);
    try {
      const dataWithMedicines = {
        ...prescriptionData,
        medicines: selectedMedicines.map(med => ({
          medicine_id: med.id,
          custom_dosage: med.custom_dosage && med.custom_dosage.trim() ? [med.custom_dosage.trim()] : [],
          custom_instructions: med.custom_instructions || ''
        }))
      };
      
      const result = await MedSeal_backend.create_prescription(dataWithMedicines);
      
      if ('Ok' in result) {
        setSelectedMedicines([]);
        await loadPrescriptions();
        
        const prescriptionCode = result.Ok;
        return {
          success: true,
          prescriptionCode,
          patientName: prescriptionData.patient_name
        };
      } else {
        showAlert('error', 'Error: ' + result.Err);
        return { success: false };
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      showAlert('error', 'Error creating prescription: ' + error.message);
      return { success: false };
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
