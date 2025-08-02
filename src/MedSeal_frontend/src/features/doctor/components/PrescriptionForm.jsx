import { useState } from 'react';

function PrescriptionForm({ 
  medicines, 
  selectedMedicines, 
  onAddMedicine, 
  onRemoveMedicine, 
  onUpdateMedicine, 
  onSubmit, 
  onOpenAI,
  onTabChange,
  loading 
}) {
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient_name: '',
    patient_contact: '',
    additional_notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Filter medicines based on search and category
  const filteredMedicines = medicines
    .filter(m => m.is_active)
    .filter(medicine => {
      const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           medicine.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           medicine.side_effects.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

  // Get unique categories from medicine names (simplified categorization)
  const categories = ['all', ...new Set(medicines.map(m => {
    const name = m.name.toLowerCase();
    if (name.includes('antibiotic') || name.includes('amoxicillin') || name.includes('penicillin')) return 'antibiotics';
    if (name.includes('pain') || name.includes('ibuprofen') || name.includes('acetaminophen')) return 'pain-relief';
    if (name.includes('vitamin') || name.includes('supplement')) return 'vitamins';
    if (name.includes('blood') || name.includes('pressure') || name.includes('cardiac')) return 'cardiovascular';
    return 'other';
  }))];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onSubmit(prescriptionForm);
    if (result.success) {
      setSuccessData({
        prescriptionCode: result.prescriptionCode,
        patientName: result.patientName
      });
      setShowSuccessModal(true);
      setPrescriptionForm({
        patient_name: '',
        patient_contact: '',
        additional_notes: ''
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getPrescriptionSummary = () => {
    if (selectedMedicines.length === 0) return '';
    
    return `Patient: ${prescriptionForm.patient_name || '[Patient Name]'}
Contact: ${prescriptionForm.patient_contact || '[Contact]'}

Prescribed Medications:
${selectedMedicines.map(med => `• ${med.name}
  Dosage: ${med.custom_dosage || med.dosage}
  Frequency: ${med.frequency}
  Duration: ${med.duration}
  Instructions: ${med.custom_instructions || 'Follow standard guidelines'}
  Side Effects: ${med.side_effects}`).join('\n\n')}

Additional Notes: ${prescriptionForm.additional_notes || 'None'}`;
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with AI Assistant */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Prescription</h1>
            <p className="text-gray-600">Create prescriptions with AI-powered medicine recommendations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onOpenAI(null, 'general')}
              className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span className="mr-2">🤖</span>
              AI Assistant
            </button>
            {selectedMedicines.length > 0 && (
              <button
                onClick={() => onOpenAI({
                  type: 'prescription_review',
                  prescription: getPrescriptionSummary(),
                  medicines: selectedMedicines
                }, 'prescription')}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <span className="mr-2">💊</span>
                Review with AI
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Patient Information - Left Column */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={prescriptionForm.patient_name}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, patient_name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Patient Contact</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={prescriptionForm.patient_contact}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, patient_contact: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                      <textarea
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={prescriptionForm.additional_notes}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, additional_notes: e.target.value})}
                        placeholder="Special instructions, allergies, etc."
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading || selectedMedicines.length === 0}
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">💾</span>
                          Create Prescription ({selectedMedicines.length})
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Selected Medicines Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <h2 className="text-xl font-semibold text-gray-900">Selected Medicines</h2>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                    {selectedMedicines.length}
                  </span>
                </div>
              </div>
              <div className="p-6">
                {selectedMedicines.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No medicines selected yet</p>
                ) : (
                  <div className="space-y-3">
                    {selectedMedicines.map(medicine => (
                      <div key={medicine.id} className="bg-gray-50 rounded-lg p-3 border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">{medicine.name}</h4>
                            <p className="text-xs text-gray-600">
                              {medicine.custom_dosage || medicine.dosage} - {medicine.frequency}
                            </p>
                            {medicine.custom_instructions && (
                              <p className="text-xs text-blue-600 mt-1">
                                📝 {medicine.custom_instructions}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => onRemoveMedicine(medicine.id)}
                            className="text-red-500 hover:text-red-700 text-sm ml-2"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medicine Selection - Right Columns */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💊</span>
                    <h2 className="text-xl font-semibold text-gray-900">Medicine Repository</h2>
                  </div>
                  <button
                    onClick={() => onOpenAI({
                      type: 'medicine_recommendation',
                      patient: prescriptionForm.patient_name || 'Patient',
                      symptoms: prescriptionForm.additional_notes || 'General consultation'
                    }, 'medicine')}
                    className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <span className="mr-2">🧠</span>
                    Get AI Recommendations
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search medicines by name, dosage, or side effects..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">🔍</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category.replace('-', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Medicine Cards Grid */}
              <div className="p-6">
                {filteredMedicines.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💊</div>
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                      {searchTerm ? 'No medicines found' : 'No active medicines available'}
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms' : 'Add medicines to your repository first'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredMedicines.map(medicine => {
                      const isSelected = selectedMedicines.find(m => m.id === medicine.id);
                      const selectedMedicine = selectedMedicines.find(m => m.id === medicine.id);
                      
                      return (
                        <div key={medicine.id} className={`border rounded-xl p-4 transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{medicine.name}</h3>
                              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded">💊 {medicine.dosage}</span>
                                <span className="bg-gray-100 px-2 py-1 rounded">⏰ {medicine.frequency}</span>
                                <span className="bg-gray-100 px-2 py-1 rounded">📅 {medicine.duration}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => isSelected ? onRemoveMedicine(medicine.id) : onAddMedicine(medicine)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                isSelected
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {isSelected ? '✕ Remove' : '+ Add'}
                            </button>
                          </div>

                          {/* Medicine Details */}
                          <div className="space-y-2 mb-3">
                            <div>
                              <p className="text-xs font-medium text-gray-700">Side Effects:</p>
                              <p className="text-xs text-gray-600">{medicine.side_effects}</p>
                            </div>
                            {medicine.guide_text && (
                              <div>
                                <p className="text-xs font-medium text-gray-700">Guide Preview:</p>
                                <p className="text-xs text-gray-600">
                                  {medicine.guide_text.substring(0, 100)}
                                  {medicine.guide_text.length > 100 && '...'}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Custom Instructions for Selected Medicine */}
                          {isSelected && (
                            <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Custom Dosage (Optional)
                                </label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  value={selectedMedicine?.custom_dosage || ''}
                                  onChange={(e) => onUpdateMedicine(medicine.id, 'custom_dosage', e.target.value)}
                                  placeholder={`Default: ${medicine.dosage}`}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Custom Instructions
                                </label>
                                <textarea
                                  rows="2"
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  value={selectedMedicine?.custom_instructions || ''}
                                  onChange={(e) => onUpdateMedicine(medicine.id, 'custom_instructions', e.target.value)}
                                  placeholder="Additional instructions for patient..."
                                />
                              </div>
                              <button
                                onClick={() => onOpenAI({
                                  type: 'medicine_details',
                                  medicine: medicine,
                                  patient: prescriptionForm.patient_name || 'Patient'
                                }, 'medicine')}
                                className="w-full inline-flex items-center justify-center px-3 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded hover:bg-indigo-200 transition-colors"
                              >
                                <span className="mr-2">🧠</span>
                                Get AI Guidance for This Medicine
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Prescription Created Successfully!
              </h2>
              <p className="text-gray-600 mb-4">
                Prescription for <strong>{successData.patientName}</strong> has been created.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Share this code with your patient:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-3 py-2 bg-white border rounded text-lg font-mono font-bold text-blue-600">
                    {successData.prescriptionCode}
                  </code>
                  <button
                    onClick={() => copyToClipboard(successData.prescriptionCode)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    onTabChange('history');
                  }}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="mr-2">📚</span>
                  View All Prescriptions
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Create Another Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrescriptionForm;
