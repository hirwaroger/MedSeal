import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export const useMedicine = (user, showAlert) => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const { authenticatedActor } = useAuth();

  // Fetch medicines on component mount and when user changes
  useEffect(() => {
    if (user && authenticatedActor) {
      fetchMedicines();
    }
  }, [user, authenticatedActor]);

  const fetchMedicines = async () => {
    if (!authenticatedActor || !user) {
      console.log('LOG: Cannot fetch medicines - missing actor or user');
      return;
    }

    try {
      setLoading(true);
      console.log('LOG: Fetching medicines for user:', user.id);
      
      const result = await authenticatedActor.get_doctor_medicines(user.id);
      console.log('LOG: Fetched medicines result:', result);
      
      setMedicines(Array.isArray(result) ? result : []);
      console.log('LOG: Medicines state updated, count:', result?.length || 0);
    } catch (error) {
      console.error('LOG: Error fetching medicines:', error);
      showAlert('error', 'Failed to fetch medicines: ' + error.message);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = async (medicineData) => {
    console.log('LOG: addMedicine called with data:', medicineData);
    
    if (!authenticatedActor) {
      console.error('LOG: No authenticated actor available');
      showAlert('error', 'Backend connection not available');
      return false;
    }

    if (!user) {
      console.error('LOG: No user available');
      showAlert('error', 'User not authenticated');
      return false;
    }

    // Validate required fields
    const requiredFields = ['name', 'dosage', 'frequency', 'duration', 'side_effects'];
    const missingFields = requiredFields.filter(field => !medicineData[field] || !medicineData[field].trim());
    
    if (missingFields.length > 0) {
      console.error('LOG: Missing required fields:', missingFields);
      showAlert('error', `Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }

    setLoading(true);
    try {
      console.log('LOG: Attempting to add medicine...');
      console.log('LOG: Medicine data being sent:', medicineData);
      
      // Ensure all fields are strings and properly formatted
      const cleanedData = {
        name: medicineData.name.trim(),
        dosage: medicineData.dosage.trim(),
        frequency: medicineData.frequency.trim(),
        duration: medicineData.duration.trim(),
        side_effects: medicineData.side_effects.trim(),
        guide_text: medicineData.guide_text?.trim() || "No guide available",
        guide_source: medicineData.guide_source?.trim() || "Manual entry"
      };
      
      console.log('LOG: Cleaned medicine data:', cleanedData);
      
      const result = await authenticatedActor.add_medicine(cleanedData);
      console.log('LOG: Add medicine result:', result);
      
      if ('Ok' in result) {
        console.log('LOG: Medicine added successfully:', result.Ok);
        showAlert('success', `Medicine "${cleanedData.name}" added successfully`);
        
        // Refresh the medicines list
        await fetchMedicines();
        return true;
      } else {
        console.error('LOG: Failed to add medicine:', result.Err);
        showAlert('error', `Failed to add medicine: ${result.Err}`);
        return false;
      }
    } catch (error) {
      console.error('LOG: Error adding medicine:', error);
      showAlert('error', `Error adding medicine: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleMedicineStatus = async (medicineId) => {
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available');
      return false;
    }

    try {
      setLoading(true);
      console.log('LOG: Toggling medicine status for ID:', medicineId);
      
      const result = await authenticatedActor.toggle_medicine_status(medicineId);
      console.log('LOG: Toggle medicine status result:', result);
      
      if ('Ok' in result) {
        showAlert('success', 'Medicine status updated successfully');
        await fetchMedicines(); // Refresh the list
        return true;
      } else {
        console.error('LOG: Failed to toggle medicine status:', result.Err);
        showAlert('error', `Failed to update medicine status: ${result.Err}`);
        return false;
      }
    } catch (error) {
      console.error('LOG: Error toggling medicine status:', error);
      showAlert('error', `Error updating medicine status: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    medicines,
    loading,
    addMedicine,
    toggleMedicineStatus,
    fetchMedicines
  };
};
