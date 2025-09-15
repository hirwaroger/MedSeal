import { useState } from 'react';
import { usePrescription } from '../hooks/usePrescription';
import FAIcon from '../../../components/FAIcon';

function PrescriptionAccess({ onPrescriptionLoad, showAlert }) {
  const [prescriptionCode, setPrescriptionCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchPrescription, loading } = usePrescription(showAlert);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prescriptionCode.trim()) {
      showAlert('error', 'Please enter a prescription code');
      return;
    }

    // More flexible parsing - handle different formats
    const trimmedCode = prescriptionCode.trim();
    let prescriptionId, code;
    
    // Try different separator patterns
    if (trimmedCode.includes('-')) {
      const parts = trimmedCode.split('-');
      if (parts.length === 2) {
        [prescriptionId, code] = parts;
      } else if (parts.length > 2) {
        // Handle cases where the code itself might contain hyphens
        prescriptionId = parts[0];
        code = parts.slice(1).join('-');
      } else {
        showAlert('error', 'Invalid prescription code format. Use format: ID-CODE');
        return;
      }
    } else if (trimmedCode.includes('_')) {
      const parts = trimmedCode.split('_');
      if (parts.length >= 2) {
        // Handle format like "prescription_17129208591076288621_RX483042"
        // Or "prescription_17129208591076288621" followed by "-RX483042"
        if (parts.length === 2 && parts[1].includes('-')) {
          prescriptionId = parts[0] + '_' + parts[1].split('-')[0];
          code = parts[1].split('-')[1];
        } else {
          // Reconstruct full ID with underscores except last part as code
          prescriptionId = parts.slice(0, -1).join('_');
          code = parts[parts.length - 1];
        }
      } else {
        showAlert('error', 'Invalid prescription code format. Use format: prescription_ID-CODE');
        return;
      }
    } else if (trimmedCode.includes(' ')) {
      const parts = trimmedCode.split(' ');
      if (parts.length === 2) {
        [prescriptionId, code] = parts;
      } else {
        showAlert('error', 'Invalid prescription code format. Separate ID and CODE with space, hyphen, or underscore');
        return;
      }
    } else {
      showAlert('error', 'Invalid prescription code format. Please use format: prescription_ID-CODE (e.g., prescription_12345-ABC123)');
      return;
    }
    
    if (!prescriptionId || !code || prescriptionId.trim() === '' || code.trim() === '') {
      showAlert('error', 'Both prescription ID and code are required');
      return;
    }

    // Validate prescription ID format (should contain letters, numbers, underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(prescriptionId.trim())) {
      showAlert('error', 'Prescription ID contains invalid characters. Should only contain letters, numbers, and underscores.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('LOG: Accessing prescription with ID:', prescriptionId.trim(), 'and code:', code.trim());
      
      const success = await fetchPrescription(prescriptionId.trim(), code.trim());
      
      if (success) {
        console.log('LOG: Prescription access successful');
        if (onPrescriptionLoad) {
          onPrescriptionLoad(true);
        }
        setPrescriptionCode('');
        showAlert('success', 'Prescription accessed successfully!');
      } else {
        console.log('LOG: Prescription access failed');
        showAlert('error', 'Failed to access prescription. Please check your code and try again.');
      }
    } catch (error) {
      console.error('LOG: Error accessing prescription:', error);
      
      let errorMessage = 'Failed to access prescription: ';
      if (error.message && error.message.includes('Network')) {
        errorMessage += 'Network connection issue. Please check your connection and try again.';
      } else if (error.message && error.message.includes('Authentication')) {
        errorMessage += 'Authentication error. Please refresh the page and try again.';
      } else if (error.message && error.message.includes('Invalid')) {
        errorMessage += 'Invalid prescription code. Please check the code and try again.';
      } else if (error.message && error.message.includes('not found')) {
        errorMessage += 'Prescription not found. Please verify the prescription code.';
      } else if (error.message && error.message.includes('decode call arguments')) {
        errorMessage += 'System compatibility issue. Please refresh the page and try again.';
      } else if (error.message && error.message.includes('Canister')) {
        errorMessage += 'Backend service temporarily unavailable. Please try again in a moment.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'An unexpected error occurred. Please try again.';
      }
      
      showAlert('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <FAIcon name="clipboard" className="text-2xl" />
          <h2 className="text-xl font-semibold text-gray-900">Access Your Prescription</h2>
        </div>
        <p className="text-gray-600">
          Enter your prescription details to view your medications and get personalized guidance.
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prescription Code (ID-CODE) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={prescriptionCode}
                onChange={(e) => setPrescriptionCode(e.target.value)}
                placeholder="e.g., prescription_17129208591076288621-RX483042"
                maxLength="100"
                disabled={isLoading}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the complete prescription code provided by your doctor (Format: prescription_ID-CODE)
              </p>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !prescriptionCode.trim()}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isSubmitting ? 'Accessing Prescription...' : 'Processing...'}
              </>
            ) : (
              <>
                <FAIcon name="unlock" className="mr-2" />
                Access Prescription
              </>
            )}
          </button>

          {/* Example format help */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <FAIcon name="info-circle" className="text-blue-600 text-sm mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Prescription Code Format</h4>
                <p className="text-xs text-blue-700">
                  Your prescription code consists of two parts separated by a hyphen:
                </p>
                <ul className="text-xs text-blue-700 mt-1 ml-3 list-disc">
                  <li><strong>Prescription ID:</strong> Starts with "prescription_" followed by numbers (e.g., prescription_17129208591076288621)</li>
                  <li><strong>Access Code:</strong> A short code provided by your doctor (e.g., RX483042)</li>
                </ul>
                <p className="text-xs text-blue-600 mt-1">
                  <strong>Examples:</strong> 
                  <br />• prescription_17129208591076288621-RX483042
                  <br />• prescription_12345678901234567890-ABC123
                  <br />• prescription_98765_DEF456 (underscore separator also works)
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PrescriptionAccess;