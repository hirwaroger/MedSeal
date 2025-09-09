import { useState, useMemo } from 'react';

function PrescriptionForm({ 
  medicines, 
  selectedMedicines, 
  onAddMedicine, 
  onRemoveMedicine, 
  onUpdateMedicine, 
  onSubmit, 
  onOpenAI,
  loading 
}) {
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient_name: '',
    patient_contact: '',
    additional_notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter medicines based on search and category
  const filteredMedicines = useMemo(() => {
    return medicines
      .filter(m => m.is_active)
      .filter(medicine => {
        const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            medicine.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            medicine.side_effects.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (selectedCategory === 'all') return matchesSearch;
        
        // You can add more sophisticated categorization based on medicine properties
        return matchesSearch;
      });
  }, [medicines, searchTerm, selectedCategory]);

  // Get medicine categories (you can enhance this based on your needs)
  const categories = [
    { id: 'all', name: 'All Medicines', count: medicines.filter(m => m.is_active).length },
    { id: 'recent', name: 'Recently Added', count: medicines.filter(m => m.is_active && Date.now() - Number(m.created_at) / 1000000 < 7 * 24 * 60 * 60 * 1000).length }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSubmit(prescriptionForm);
    if (success) {
      setPrescriptionForm({
        patient_name: '',
        patient_contact: '',
        additional_notes: ''
      });
    }
  };

  const handleAIRecommendation = () => {
    const context = {
      patientInfo: `Patient: ${prescriptionForm.patient_name}, Contact: ${prescriptionForm.patient_contact}`,
      currentMedicines: selectedMedicines.map(m => m.name).join(', '),
      notes: prescriptionForm.additional_notes
    };
    onOpenAI(context, 'medicine-recommendation');
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Prescription</h1>
          <p className="text-gray-600">Create new prescriptions for patients using active medicines</p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Patient Information Card */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-user text-blue-600" aria-hidden="true" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
                  </div>
                  <button
                    onClick={handleAIRecommendation}
                    className="inline-flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    title="Get AI medicine recommendations"
                  >
                    <i className="fa-solid fa-robot mr-1" aria-hidden="true" />
                    AI Recommend
                  </button>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={prescriptionForm.patient_name}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, patient_name: e.target.value})}
                      placeholder="Enter patient's full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Patient Contact *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={prescriptionForm.patient_contact}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, patient_contact: e.target.value})}
                      placeholder="Phone or email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={prescriptionForm.additional_notes}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, additional_notes: e.target.value})}
                      placeholder="Special instructions or notes..."
                    />
                  </div>
                  
                  {/* Selected Medicines Summary */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Selected Medicines</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {selectedMedicines.length}
                      </span>
                    </div>
                    {selectedMedicines.length === 0 ? (
                      <p className="text-gray-500 text-sm">No medicines selected</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedMedicines.map(medicine => (
                          <div key={medicine.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">{medicine.name}</span>
                            <button
                              onClick={() => onRemoveMedicine(medicine.id)}
                              className="text-red-600 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading || selectedMedicines.length === 0 || !prescriptionForm.patient_name || !prescriptionForm.patient_contact}
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
                        Create Prescription ({selectedMedicines.length} medicines)
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          {/* Medicine Selection */}
          <div className="xl:col-span-2">
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">🔍</span>
                      </div>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Search medicines by name, dosage, or side effects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.name} ({category.count})
                      </button>
                    ))}
                  </div>
                </div>
                
                {searchTerm && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Found {filteredMedicines.length} medicine{filteredMedicines.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>

              {/* Medicine Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredMedicines.length === 0 ? (
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                      <div className="text-6xl mb-4"><i className="fa-solid fa-pills" aria-hidden="true" /></div>
                      <h3 className="text-xl font-semibold text-gray-500 mb-2">
                        {searchTerm ? 'No medicines found' : 'No active medicines available'}
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {searchTerm 
                          ? `Try adjusting your search term "${searchTerm}"`
                          : 'Add medicines to your repository first'
                        }
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <i className="fa-solid fa-magnifying-glass mr-2" aria-hidden="true" />
                          Clear Search
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  filteredMedicines.map(medicine => {
                    const isSelected = selectedMedicines.find(m => m.id === medicine.id);
                    
                    return (
                      <div key={medicine.id} className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                      }`}>
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {medicine.name}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  {medicine.dosage}
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  {medicine.frequency}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Duration: {medicine.duration}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                if (isSelected) {
                                  onRemoveMedicine(medicine.id);
                                } else {
                                  onAddMedicine(medicine);
                                }
                              }}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                isSelected
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {isSelected ? '✕ Remove' : '+ Add'}
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Side Effects
                              </label>
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {medicine.side_effects}
                              </p>
                            </div>
                            
                            {medicine.guide_text && medicine.guide_text !== 'No guide available' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Guide Preview
                                </label>
                                <p className="text-sm text-gray-700 line-clamp-2">
                                  {medicine.guide_text.substring(0, 100)}...
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Medicines Detail Section */}
        {selectedMedicines.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Selected Medicines - Customize Instructions
                </h2>
                <p className="text-gray-600 mt-1">
                  Modify dosages and add custom instructions for each selected medicine
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedMedicines.map(medicine => (
                    <div key={medicine.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{medicine.name}</h3>
                          <p className="text-sm text-gray-600">
                            Default: {medicine.dosage} - {medicine.frequency}
                          </p>
                        </div>
                        <button
                          onClick={() => onRemoveMedicine(medicine.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Custom Dosage (optional)
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={medicine.custom_dosage || ''}
                            onChange={(e) => onUpdateMedicine(medicine.id, 'custom_dosage', e.target.value)}
                            placeholder="e.g., 250mg (override default)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Special Instructions
                          </label>
                          <textarea
                            rows="2"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={medicine.custom_instructions || ''}
                            onChange={(e) => onUpdateMedicine(medicine.id, 'custom_instructions', e.target.value)}
                            placeholder="e.g., Take with food, avoid alcohol..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PrescriptionForm;
