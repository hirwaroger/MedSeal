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

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validateForm = () => {
    const errors = {};
    
    if (!medicineForm.name.trim()) {
      errors.name = 'Medicine name is required';
    }
    
    if (!medicineForm.dosage.trim()) {
      errors.dosage = 'Dosage is required';
    }
    
    if (!medicineForm.frequency.trim()) {
      errors.frequency = 'Frequency is required';
    }
    
    if (!medicineForm.duration.trim()) {
      errors.duration = 'Duration is required';
    }
    
    if (!medicineForm.side_effects.trim()) {
      errors.side_effects = 'Side effects information is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setMedicineForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('LOG: Form submission started');
    console.log('LOG: Current form data:', medicineForm);
    console.log('LOG: onSubmit function available:', typeof onSubmit === 'function');
    
    if (typeof onSubmit !== 'function') {
      console.error('LOG: onSubmit is not a function!', onSubmit);
      showAlert('error', 'Form submission error: onSubmit function not available');
      return;
    }
    
    if (!validateForm()) {
      console.log('LOG: Form validation failed:', formErrors);
      showAlert('error', 'Please fill in all required fields');
      return;
    }
    
    if (medicineForm.extracting) {
      showAlert('warning', 'Please wait for PDF extraction to complete');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const medicineData = {
        name: medicineForm.name.trim(),
        dosage: medicineForm.dosage.trim(),
        frequency: medicineForm.frequency.trim(),
        duration: medicineForm.duration.trim(),
        side_effects: medicineForm.side_effects.trim(),
        guide_text: medicineForm.guide_text.trim() || "No guide available",
        guide_source: medicineForm.guide_file ? medicineForm.guide_file.name : "Manual entry"
      };
      
      console.log('LOG: Submitting medicine data:', medicineData);
      console.log('LOG: Calling onSubmit with data...');
      
      const success = await onSubmit(medicineData);
      console.log('LOG: Submission result:', success);
      
      if (success) {
        console.log('LOG: Medicine added successfully, clearing form');
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
        setFormErrors({});
        showAlert('success', 'Medicine added successfully!');
        
        // Check if onTabChange is available and call it
        if (typeof onTabChange === 'function') {
          console.log('LOG: Calling onTabChange to switch to medicines tab');
          onTabChange('medicines');
        } else {
          console.warn('LOG: onTabChange function not available');
        }
      } else {
        console.error('LOG: Medicine submission failed');
        showAlert('error', 'Failed to add medicine. Please try again.');
      }
    } catch (error) {
      console.error('LOG: Form submission error:', error);
      showAlert('error', 'Failed to add medicine: ' + error.message);
    } finally {
      setIsSubmitting(false);
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  value={medicineForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter medicine name"
                  disabled={loading || isSubmitting}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosage <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.dosage ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  value={medicineForm.dosage}
                  onChange={(e) => handleInputChange('dosage', e.target.value)}
                  placeholder="e.g., 500mg"
                  disabled={loading || isSubmitting}
                />
                {formErrors.dosage && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.dosage}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.frequency ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  value={medicineForm.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  placeholder="e.g., Twice daily"
                  disabled={loading || isSubmitting}
                />
                {formErrors.frequency && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.frequency}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.duration ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  value={medicineForm.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="e.g., 7 days"
                  disabled={loading || isSubmitting}
                />
                {formErrors.duration && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.duration}</p>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Side Effects <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.side_effects ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                value={medicineForm.side_effects}
                onChange={(e) => handleInputChange('side_effects', e.target.value)}
                placeholder="List potential side effects..."
                disabled={loading || isSubmitting}
              />
              {formErrors.side_effects && (
                <p className="text-red-500 text-sm mt-1">{formErrors.side_effects}</p>
              )}
            </div>
            
            {/* PDF Upload Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Medicine Guide (PDF - Optional)</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                {!medicineForm.guide_file ? (
                  <>
                    <div className="text-6xl mb-4">
                      <i className="fa-solid fa-file-pdf" aria-hidden="true" />
                    </div>
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
                        disabled={medicineForm.extracting || loading || isSubmitting}
                      />
                    </label>
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-red-600 text-2xl mr-2"><i className="fa-solid fa-file-pdf" aria-hidden="true" /></span>
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
                          disabled={loading || isSubmitting}
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
                  onChange={(e) => handleInputChange('guide_text', e.target.value)}
                  disabled={loading || isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  You can edit the extracted text if needed before saving.
                </p>
              </div>
            )}
            
            <div className="flex gap-4 mt-8">
              <button
                type="submit" 
                disabled={loading || medicineForm.extracting || isSubmitting}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                  loading || medicineForm.extracting || isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={(e) => {
                  console.log('LOG: Submit button clicked');
                  console.log('LOG: Form element:', e.target.form);
                  console.log('LOG: Button disabled state:', e.target.disabled);
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Adding Medicine...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk mr-2" aria-hidden="true" />
                    Add Medicine
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={clearForm}
                disabled={loading || medicineForm.extracting || isSubmitting}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-trash mr-2" aria-hidden="true" />
                Clear Form
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default AddMedicineForm;