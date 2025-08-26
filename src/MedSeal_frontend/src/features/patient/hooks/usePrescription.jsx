import React, { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

export function usePrescription(showAlert) {
  const [currentPrescription, setCurrentPrescription] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const savePrescriptionToHistory = (prescription, medicines) => {
    const historyEntry = {
      id: prescription.id,
      patient_name: prescription.patient_name,
      created_at: prescription.created_at,
      accessed_at: Date.now(),
      medicines_count: medicines.length,
      doctor_notes: prescription.additional_notes,
      prescription_data: prescription,
      medicines_data: medicines
    };

    const updatedHistory = [
      historyEntry,
      ...prescriptionHistory.filter(h => h.id !== prescription.id)
    ].slice(0, 10); // Keep only last 10

    setPrescriptionHistory(updatedHistory);
    localStorage.setItem('prescriptionHistory', JSON.stringify(updatedHistory));
  };

  const accessPrescription = async (prescriptionId, prescriptionCode) => {
    setLoading(true);
    try {
      const result = await MedSeal_backend.get_prescription(prescriptionId, prescriptionCode);
      
      if ('Ok' in result) {
        const prescription = result.Ok;
        
        // Get full medicine details for each medicine in the prescription
        const medicinesWithDetails = await Promise.all(
          prescription.medicines.map(async (med) => {
            try {
              const medicineResult = await MedSeal_backend.get_medicine(med.medicine_id);
              return {
                ...med,
                medicine: medicineResult || null
              };
            } catch (error) {
              console.error('Error fetching medicine details:', error);
              return {
                ...med,
                medicine: null
              };
            }
          })
        );

        setCurrentPrescription(prescription);
        setMedicines(medicinesWithDetails);
        
        // Save to history
        savePrescriptionToHistory(prescription, medicinesWithDetails);
        
        showAlert('success', 'Prescription accessed successfully!');
        return true;
      } else {
        showAlert('error', 'Error: ' + result.Err);
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
    try {
      setCurrentPrescription(historyEntry.prescription_data);
      setMedicines(historyEntry.medicines_data);
      showAlert('info', 'Prescription loaded from history');
      return true;
    } catch (error) {
      console.error('Error loading from history:', error);
      showAlert('error', 'Error loading prescription from history');
      return false;
    }
  };

  return {
    currentPrescription,
    medicines,
    prescriptionHistory,
    loading,
    accessPrescription,
    loadPrescriptionFromHistory
  };
}