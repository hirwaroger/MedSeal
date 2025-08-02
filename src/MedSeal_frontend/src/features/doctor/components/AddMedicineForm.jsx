import { useState } from 'react';
import { extractTextFromPDF, isPDF, getFileSize } from '../../../utils/ocrUtils';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';

function AddMedicineForm({ onSubmit, onTabChange, loading, showAlert }) {
  const [medicineForm, setMedicineForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    side_effects: '',
    guide_file: null,
    guide_text: '',
    extracting: false,
    extraction_progress: ''
  });

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    if (!isPDF(file)) {
      showAlert('error', 'Please select a valid PDF file');
      return;
    }
    
    setMedicineForm(prev => ({
      ...prev,
      guide_file: file,
      extracting: true,
      extraction_progress: 'Starting OCR...'
    }));
    
    try {
      const extractedText = await extractTextFromPDF(file, (progress) => {
        setMedicineForm(prev => ({
          ...prev,
          extraction_progress: progress
        }));
      });
      
      setMedicineForm(prev => ({
        ...prev,
        guide_text: extractedText,
        extracting: false,
        extraction_progress: 'Text extracted successfully!'
      }));
      
      showAlert('success', 'PDF text extracted successfully!');
      
    } catch (error) {
      console.error('OCR extraction failed:', error);
      setMedicineForm(prev => ({
        ...prev,
        extracting: false,
        extraction_progress: 'Extraction failed'
      }));
      showAlert('error', 'Failed to extract text from PDF: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const medicineData = {
      name: medicineForm.name,
      dosage: medicineForm.dosage,
      frequency: medicineForm.frequency,
      duration: medicineForm.duration,
      side_effects: medicineForm.side_effects,
      guide_text: medicineForm.guide_text || "No guide available",
      guide_source: medicineForm.guide_file ? medicineForm.guide_file.name : "Manual entry"
    };
    
    const success = await onSubmit(medicineData);
    if (success) {
      setMedicineForm({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        side_effects: '',
        guide_file: null,
        guide_text: '',
        extracting: false,
        extraction_progress: ''
      });
      onTabChange('medicines');
    }
  };

  const clearForm = () => {
    setMedicineForm({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      side_effects: '',
      guide_file: null,
      guide_text: '',
      extracting: false,
      extraction_progress: ''
    });
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Medicine</h1>
            <p className="text-gray-600">Build your medicine repository with OCR-powered guides</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => onTabChange('medicines')}
            icon="←"
          >
            Back to Medicines
          </Button>
        </div>
        
        <Card title="Medicine Information" icon="➕">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={medicineForm.name}
                  onChange={(e) => setMedicineForm({...medicineForm, name: e.target.value})}
                  required
                />
                {!medicineForm.name.trim() && (
                  <p className="text-red-500 text-sm mt-1">Medicine name is required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={medicineForm.dosage}
                  onChange={(e) => setMedicineForm({...medicineForm, dosage: e.target.value})}
                  placeholder="e.g., 500mg"
                  required
                />
                {!medicineForm.dosage.trim() && (
                  <p className="text-red-500 text-sm mt-1">Dosage is required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={medicineForm.frequency}
                  onChange={(e) => setMedicineForm({...medicineForm, frequency: e.target.value})}
                  placeholder="e.g., Twice daily"
                  required
                />
                {!medicineForm.frequency.trim() && (
                  <p className="text-red-500 text-sm mt-1">Frequency is required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={medicineForm.duration}
                  onChange={(e) => setMedicineForm({...medicineForm, duration: e.target.value})}
                  placeholder="e.g., 7 days"
                  required
                />
                {!medicineForm.duration.trim() && (
                  <p className="text-red-500 text-sm mt-1">Duration is required</p>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Side Effects</label>
              <textarea
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={medicineForm.side_effects}
                onChange={(e) => setMedicineForm({...medicineForm, side_effects: e.target.value})}
                placeholder="List potential side effects..."
                required
              />
              {!medicineForm.side_effects.trim() && (
                <p className="text-red-500 text-sm mt-1">Side effects information is required</p>
              )}
            </div>
            
            {/* PDF Upload Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Medicine Guide (PDF - Optional)</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                {!medicineForm.guide_file ? (
                  <>
                    <div className="text-6xl mb-4">📄</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Drop your PDF file here or click to browse
                    </h4>
                    <p className="text-gray-600 mb-4">Maximum file size: 10MB</p>
                    <label className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                      Choose File
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files[0])}
                        disabled={medicineForm.extracting}
                      />
                    </label>
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-red-600 text-2xl mr-2">📄</span>
                      <span className="font-semibold text-gray-900">{medicineForm.guide_file.name}</span>
                      <span className="text-gray-500 ml-2">({getFileSize(medicineForm.guide_file)})</span>
                      {!medicineForm.extracting && (
                        <button
                          type="button"
                          onClick={() => {
                            setMedicineForm(prev => ({
                              ...prev,
                              guide_file: null,
                              guide_text: '',
                              extraction_progress: ''
                            }));
                          }}
                          className="ml-4 text-red-600 hover:text-red-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    {medicineForm.extracting && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <div>
                            <h4 className="font-semibold text-blue-900">Processing PDF...</h4>
                            <p className="text-sm text-blue-700">{medicineForm.extraction_progress}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {medicineForm.guide_text && !medicineForm.extracting && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800">
                          Text extracted successfully ({medicineForm.guide_text.length} characters)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Extracted Text Preview */}
            {medicineForm.guide_text && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extracted Guide Text (Preview & Edit)
                </label>
                <textarea
                  rows="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  value={medicineForm.guide_text}
                  onChange={(e) => setMedicineForm({...medicineForm, guide_text: e.target.value})}
                />
                <p className="text-sm text-gray-500 mt-1">
                  You can edit the extracted text if needed before saving.
                </p>
              </div>
            )}
            
            <div className="flex gap-4 mt-8">
              <Button 
                type="submit" 
                loading={loading || medicineForm.extracting}
                icon="💾"
              >
                Add Medicine
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={clearForm}
                icon="🗑️"
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default AddMedicineForm;