import { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

export function useMedicine(user, showAlert) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMedicines();
  }, [user]);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const result = await MedSeal_backend.get_doctor_medicines(user.id);
      setMedicines(result || []);
    } catch (error) {
      console.error('Error loading medicines:', error);
      showAlert('error', 'Error loading medicines: ' + error.message);
    }
    setLoading(false);
  };

  const addMedicine = async (medicineData) => {
    try {
      const result = await MedSeal_backend.add_medicine(medicineData);
      
      if ('Ok' in result) {
        await loadMedicines();
        showAlert('success', 'Medicine added successfully!');
        return true;
      } else {
        showAlert('error', 'Error: ' + result.Err);
        return false;
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      showAlert('error', 'Error adding medicine: ' + error.message);
      return false;
    }
  };

  const toggleMedicineStatus = async (medicineId, currentStatus) => {
    try {
      const result = await MedSeal_backend.toggle_medicine_status(medicineId);
      if ('Ok' in result) {
        await loadMedicines();
        const newStatus = result.Ok.is_active;
        showAlert('success', `Medicine has been ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      } else {
        showAlert('error', 'Error: ' + result.Err);
      }
    } catch (error) {
      console.error('Error toggling medicine status:', error);
      showAlert('error', 'Error updating medicine status: ' + error.message);
    }
  };

  return {
    medicines,
    loading,
    addMedicine,
    toggleMedicineStatus,
    loadMedicines
  };
}
