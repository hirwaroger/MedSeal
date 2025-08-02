import { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

export function usePrescription(showAlert) {
  const [currentPrescription, setCurrentPrescription] = useState(null);
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrescriptionHistory();
  }, []);

  const loadPrescriptionHistory = () => {
    const history = JSON.parse(localStorage.getItem('prescriptionHistory') || '[]');
    setPrescriptionHistory(history);
  };

  const savePrescriptionToHistory = (prescription, medicines) => {
    const historyEntry = {
      id: prescription.id,
      prescription_code: prescription.prescription_code,
      patient_name: prescription.patient_name,
      created_at: prescription.created_at.toString(),
      accessed_at: prescription.accessed_at ? prescription.accessed_at.toString() : Date.now().toString(),
      medicines_count: medicines.length,
      doctor_notes: prescription.additional_notes,
      medicines: medicines.map(m => ({
        name: m.medicine?.name || 'Unknown',
        dosage: m.custom_dosage || m.medicine?.dosage || 'N/A',
        instructions: m.custom_instructions
      }))
    };

    const history = JSON.parse(localStorage.getItem('prescriptionHistory') || '[]');
    const existingIndex = history.findIndex(h => h.id === prescription.id);
    
    if (existingIndex >= 0) {
      history[existingIndex] = historyEntry;
    } else {
      history.unshift(historyEntry);
    }

    const limitedHistory = history.slice(0, 10);
    localStorage.setItem('prescriptionHistory', JSON.stringify(limitedHistory));
    setPrescriptionHistory(limitedHistory);
  };

  const accessPrescription = async (prescriptionId, prescriptionCode) => {
    if (!prescriptionId || !prescriptionCode) {
      showAlert('warning', 'Please enter both Prescription ID and Code');
      return;
    }

    setLoading(true);
    try {
      const result = await MedSeal_backend.get_prescription(prescriptionId, prescriptionCode);
      
      if ('Ok' in result) {
        const prescription = result.Ok;
        setCurrentPrescription(prescription);
        
        // Fetch medicine details
        const medicineDetails = await Promise.all(
          prescription.medicines.map(async (med, index) => {
            try {
              const medicineResult = await MedSeal_backend.get_medicine(med.medicine_id);
              
              if (medicineResult && medicineResult.name) {
                return {
                  ...med,
                  medicine: medicineResult
                };
              } else {
                // Fallback for missing medicine
                return {
                  ...med,
                  medicine: { 
                    name: `Medicine (ID: ${med.medicine_id})`, 
                    dosage: 'Contact your doctor for details', 
                    frequency: 'As prescribed', 
                    duration: 'As prescribed', 
                    side_effects: 'Contact your doctor for details',
                    guide_text: 'No guide available - Contact your doctor'
                  }
                };
              }
            } catch (error) {
              console.error(`Error fetching medicine for ID ${med.medicine_id}:`, error);
              return {
                ...med,
                medicine: { 
                  name: `Medicine (ID: ${med.medicine_id})`, 
                  dosage: 'Contact your doctor for details', 
                  frequency: 'As prescribed', 
                  duration: 'As prescribed', 
                  side_effects: 'Contact your doctor for details',
                  guide_text: 'No guide available - Contact your doctor'
                }
              };
            }
          })
        );
        
        setMedicines(medicineDetails);
        savePrescriptionToHistory(prescription, medicineDetails);
        
        const validMedicines = medicineDetails.filter(med => med.medicine && med.medicine.name);
        
        if (validMedicines.length < medicineDetails.length) {
          showAlert('warning', `Prescription accessed but some medicine details could not be loaded. Contact your doctor if needed.`);
        } else {
          showAlert('success', 'Prescription accessed successfully!');
        }

        return true; // Success
      } else {
        showAlert('error', 'Failed to access prescription: ' + result.Err);
        return false;
      }
    } catch (error) {
      console.error('Error accessing prescription:', error);
      showAlert('error', 'Error accessing prescription: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadPrescriptionFromHistory = (historyEntry) => {
    const prescription = {
      id: historyEntry.id,
      prescription_code: historyEntry.prescription_code,
      patient_name: historyEntry.patient_name,
      patient_contact: '',
      created_at: historyEntry.created_at,
      accessed_at: historyEntry.accessed_at,
      additional_notes: historyEntry.doctor_notes,
      medicines: []
    };

    const medicineDetails = historyEntry.medicines.map((med, index) => ({
      medicine_id: `history_${index}`,
      custom_dosage: med.dosage === 'N/A' ? null : med.dosage,
      custom_instructions: med.instructions || '',
      medicine: {
        name: med.name,
        dosage: med.dosage,
        frequency: 'As prescribed',
        duration: 'As prescribed',
        side_effects: 'Consult your doctor'
      }
    }));

    setCurrentPrescription(prescription);
    setMedicines(medicineDetails);
    showAlert('info', 'Prescription loaded from history');
    return true;
  };

  return {
    currentPrescription,
    prescriptionHistory,
    medicines,
    loading,
    accessPrescription,
    loadPrescriptionFromHistory
  };
}
