import { useState } from 'react';

function PrescriptionAccess({ onAccessPrescription, loading }) {
  const [prescriptionId, setPrescriptionId] = useState('');
  const [prescriptionCode, setPrescriptionCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAccessPrescription(prescriptionId.trim(), prescriptionCode.trim());
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
                Prescription ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={prescriptionId}
                onChange={(e) => setPrescriptionId(e.target.value)}
                placeholder="Enter 6-digit ID"
                maxLength="6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={prescriptionCode}
                onChange={(e) => setPrescriptionCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength="6"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !prescriptionId.trim() || !prescriptionCode.trim()}
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
