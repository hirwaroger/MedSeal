function MedicineRepository({ 
  medicines, 
  loading, 
  onTabChange, 
  onViewGuide, 
  onAddToSelection, 
  onToggleStatus 
}) {
  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Medicine Repository</h1>
            <p className="text-gray-600">
              Manage your medicine library ({medicines.filter(m => m.is_active).length} active, {medicines.filter(m => !m.is_active).length} inactive)
            </p>
          </div>
          <button 
            onClick={() => onTabChange('add-medicine')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">➕</span>
            Add New Medicine
          </button>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center py-12">
            <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading medicines...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-center py-12">
              <div className="text-6xl mb-6"><i className="fa-solid fa-pills" aria-hidden="true" /></div>
              <h3 className="text-xl font-semibold text-gray-500 mb-2">No Medicines Added</h3>
              <p className="text-gray-500 mb-6">Start building your medicine repository with OCR-powered guides</p>
              <button 
                onClick={() => onTabChange('add-medicine')}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">➕</span>
                Add Your First Medicine
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map(medicine => (
              <div key={medicine.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 ${medicine.is_active ? '' : 'opacity-60'}`}>
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{medicine.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      medicine.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {medicine.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {medicine.guide_text && (
                      <button
                        onClick={() => onViewGuide(medicine)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Guide"
                      >
                        <i className="fa-solid fa-eye text-sm" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      onClick={() => onAddToSelection(medicine)}
                      disabled={!medicine.is_active}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Add to Prescription"
                    >
                      <i className="fa-solid fa-plus text-sm" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(medicine.id, medicine.is_active)}
                      className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                      title={medicine.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <i className={`fa-solid ${medicine.is_active ? 'fa-pause' : 'fa-play'}`} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Dosage:</span>
                      <span className="text-sm text-gray-900">{medicine.dosage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Frequency:</span>
                      <span className="text-sm text-gray-900">{medicine.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Duration:</span>
                      <span className="text-sm text-gray-900">{medicine.duration}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <p className="text-xs text-gray-500">
                        Side Effects: {medicine.side_effects}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Added {new Date(Number(medicine.created_at) / 1000000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MedicineRepository;
