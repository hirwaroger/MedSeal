import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export function useMedicine(user, showAlert) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const { authenticatedActor } = useAuth();

  useEffect(() => {
    if (user && authenticatedActor) {
      loadMedicines();
    }
  }, [user, authenticatedActor]);

  const loadMedicines = async () => {
    if (!authenticatedActor || !user) {
      console.log('LOG: Cannot load medicines - missing actor or user');
      return;
    }

    setLoading(true);
    try {
      console.log('LOG: Loading medicines for user:', user.id);
      
      const result = await authenticatedActor.get_doctor_medicines(user.id);
      console.log('LOG: Loaded medicines result:', result);
      
      setMedicines(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('LOG: Error loading medicines:', error);
      showAlert('error', 'Error loading medicines: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = async (medicineData) => {
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available');
      return false;
    }

    try {
      console.log('LOG: Adding medicine with data:', medicineData);
      
      const result = await authenticatedActor.add_medicine(medicineData);
      console.log('LOG: Add medicine result:', result);
      
      if ('Ok' in result) {
        console.log('LOG: Medicine added successfully:', result.Ok);
        await loadMedicines();
        showAlert('success', 'Medicine added successfully!');
        return true;
      } else {
        console.error('LOG: Failed to add medicine:', result.Err);
        showAlert('error', 'Error: ' + result.Err);
        return false;
      }
    } catch (error) {
      console.error('LOG: Error adding medicine:', error);
      showAlert('error', 'Error adding medicine: ' + error.message);
      return false;
    }
  };

  const toggleMedicineStatus = async (medicineId, currentStatus) => {
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available');
      return false;
    }

    try {
      console.log('LOG: Toggling medicine status for ID:', medicineId);
      
      const result = await authenticatedActor.toggle_medicine_status(medicineId);
      console.log('LOG: Toggle medicine status result:', result);
      
      if ('Ok' in result) {
        await loadMedicines();
        const newStatus = result.Ok.is_active;
        showAlert('success', `Medicine has been ${newStatus ? 'activated' : 'deactivated'} successfully.`);
        return true;
      } else {
        console.error('LOG: Failed to toggle medicine status:', result.Err);
        showAlert('error', 'Error: ' + result.Err);
        return false;
      }
    } catch (error) {
      console.error('LOG: Error toggling medicine status:', error);
      showAlert('error', 'Error updating medicine status: ' + error.message);
      return false;
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
