function PrescriptionHistory({ prescriptions, onTabChange, showAlert }) {
  const copyToClipboard = (prescription) => {
    const fullCode = `${prescription.id}-${prescription.prescription_code}`;
    navigator.clipboard.writeText(fullCode);
    showAlert('success', 'Prescription code copied to clipboard!');
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prescription History</h1>
        <p className="text-gray-600 mb-8">View all created prescriptions ({prescriptions.length})</p>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {prescriptions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">📋</div>
              <h3 className="text-xl font-semibold text-gray-500 mb-2">No Prescriptions Created</h3>
              <p className="text-gray-500 mb-6">Start creating prescriptions for your patients</p>
              <button 
                onClick={() => onTabChange('prescriptions')}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">➕</span>
                Create First Prescription
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prescription Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicines Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prescriptions.map(prescription => (
                    <tr key={prescription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {prescription.id}-{prescription.prescription_code}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {prescription.patient_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {prescription.patient_contact}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {prescription.medicines.length} medicine{prescription.medicines.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(Number(prescription.created_at) / 1000000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          prescription.accessed_at && prescription.accessed_at.length > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {prescription.accessed_at && prescription.accessed_at.length > 0 ? 'Accessed' : 'Pending'}
                        </span>
                        {prescription.accessed_at && prescription.accessed_at.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Accessed: {new Date(Number(prescription.accessed_at[0]) / 1000000).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => copyToClipboard(prescription)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Copy prescription code"
                        >
                          📋
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PrescriptionHistory;
