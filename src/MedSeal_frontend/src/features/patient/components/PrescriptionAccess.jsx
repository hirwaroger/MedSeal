import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

function PrescriptionAccess({ onPrescriptionLoad, showAlert }) {
  const [loading, setLoading] = useState(false);
  const [prescriptionCode, setPrescriptionCode] = useState('');
  const { authenticatedActor } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available');
      return;
    }
    
    if (!prescriptionCode.trim()) {
      showAlert('error', 'Please enter a prescription code');
      return;
    }

    const parts = prescriptionCode.trim().split('-');
    if (parts.length !== 2) {
      showAlert('error', 'Invalid prescription code format. Use format: ID-CODE');
      return;
    }

    const [prescriptionId, code] = parts;
    setLoading(true);

    try {
      console.log('LOG: Fetching prescription with ID:', prescriptionId, 'Code:', code);
      
      const result = await authenticatedActor.get_prescription(prescriptionId, code);
      console.log('LOG: Prescription fetch result:', result);
      
      if ('Ok' in result) {
        const prescriptionData = result.Ok;
        console.log('LOG: Prescription loaded successfully:', prescriptionData);
        
        // Get medicine details for each medicine in the prescription
        const medicineDetails = await Promise.all(
          prescriptionData.medicines.map(async (prescriptionMedicine) => {
            try {
              const medicineResult = await authenticatedActor.get_medicine(prescriptionMedicine.medicine_id);
              console.log('LOG: Fetched medicine:', medicineResult, 'for ID:', prescriptionMedicine.medicine_id);
              
              // Handle case where backend returns an array or single object
              let medicine = null;
              if (Array.isArray(medicineResult) && medicineResult.length > 0) {
                medicine = medicineResult[0];
                console.log('LOG: Extracted medicine from array:', medicine);
              } else if (medicineResult && !Array.isArray(medicineResult)) {
                medicine = medicineResult;
                console.log('LOG: Using medicine object directly:', medicine);
              }
              
              if (medicine) {
                // Structure the data to match what MedicationCard expects
                return {
                  medicine_id: prescriptionMedicine.medicine_id,
                  custom_dosage: prescriptionMedicine.custom_dosage && prescriptionMedicine.custom_dosage.length > 0 
                    ? prescriptionMedicine.custom_dosage[0] 
                    : null,
                  custom_instructions: prescriptionMedicine.custom_instructions || '',
                  medicine: {
                    id: medicine.id,
                    name: medicine.name,
                    dosage: medicine.dosage,
                    frequency: medicine.frequency,
                    duration: medicine.duration,
                    side_effects: medicine.side_effects,
                    guide_text: medicine.guide_text,
                    is_active: medicine.is_active,
                    created_at: medicine.created_at
                  }
                };
              } else {
                console.warn('LOG: Medicine not found for ID:', prescriptionMedicine.medicine_id);
                return {
                  medicine_id: prescriptionMedicine.medicine_id,
                  custom_dosage: prescriptionMedicine.custom_dosage && prescriptionMedicine.custom_dosage.length > 0 
                    ? prescriptionMedicine.custom_dosage[0] 
                    : null,
                  custom_instructions: prescriptionMedicine.custom_instructions || '',
                  medicine: null
                };
              }
            } catch (error) {
              console.error('LOG: Error fetching medicine for ID:', prescriptionMedicine.medicine_id, error);
              return {
                medicine_id: prescriptionMedicine.medicine_id,
                custom_dosage: prescriptionMedicine.custom_dosage && prescriptionMedicine.custom_dosage.length > 0 
                  ? prescriptionMedicine.custom_dosage[0] 
                  : null,
                custom_instructions: prescriptionMedicine.custom_instructions || '',
                medicine: null
              };
            }
          })
        );
        
        console.log('LOG: All medicine details:', medicineDetails);
        
        const prescription = {
          ...prescriptionData,
          medicineDetails: medicineDetails
        };
        
        onPrescriptionLoad(prescription);
        showAlert('success', 'Prescription loaded successfully!');
        setPrescriptionCode('');
      } else {
        console.error('LOG: Failed to fetch prescription:', result.Err);
        showAlert('error', 'Error: ' + result.Err);
      }
    } catch (error) {
      console.error('LOG: Error fetching prescription:', error);
      showAlert('error', 'Error fetching prescription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">📋</span>
          <h2 className="text-xl font-semibold text-gray-900">Access Your Prescription</h2>
        </div>
        <p className="text-gray-600">
          Enter your prescription details to view your medications and get personalized guidance.
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prescription Code (ID-CODE)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={prescriptionCode}
                onChange={(e) => setPrescriptionCode(e.target.value)}
                placeholder="Enter prescription code"
                maxLength="20"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !prescriptionCode.trim()}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Accessing...
              </>
            ) : (
              <>
                <span className="mr-2">🔓</span>
                Access Prescription
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PrescriptionAccess;
