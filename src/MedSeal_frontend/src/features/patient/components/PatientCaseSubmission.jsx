import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import FAIcon from '../../../components/FAIcon';

function PatientCaseSubmission({ onSuccess }) {
  const { authenticatedActor } = useAuth();
  const [formData, setFormData] = useState({
    case_title: '',
    case_description: '',
    medical_condition: '',
    required_amount: '',
    supporting_documents: [],
    urgency_level: 'Medium'
  });
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const urgencyLevels = [
    { value: 'Low', label: 'Low Priority', color: 'text-green-600', desc: 'Non-urgent medical needs' },
    { value: 'Medium', label: 'Medium Priority', color: 'text-yellow-600', desc: 'Important but not immediate' },
    { value: 'High', label: 'High Priority', color: 'text-orange-600', desc: 'Urgent medical attention needed' },
    { value: 'Critical', label: 'Critical', color: 'text-red-600', desc: 'Life-threatening condition' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.case_title.trim()) newErrors.case_title = 'Case title is required';
    if (!formData.case_description.trim()) newErrors.case_description = 'Description is required';
    if (!formData.medical_condition.trim()) newErrors.medical_condition = 'Medical condition is required';
    if (!formData.required_amount || parseFloat(formData.required_amount) <= 0) {
      newErrors.required_amount = 'Valid amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addDocument = () => {
    if (documentUrl.trim()) {
      try {
        new URL(documentUrl.trim());
        setFormData(prev => ({
          ...prev,
          supporting_documents: [...prev.supporting_documents, documentUrl.trim()]
        }));
        setDocumentUrl('');
      } catch {
        alert('Please enter a valid URL');
      }
    }
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      supporting_documents: prev.supporting_documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        case_title: formData.case_title.trim(),
        case_description: formData.case_description.trim(),
        medical_condition: formData.medical_condition.trim(),
        required_amount: Math.floor(parseFloat(formData.required_amount) * 100), // Convert to cents
        supporting_documents: formData.supporting_documents,
        urgency_level: { [formData.urgency_level]: null }
      };

      const result = await authenticatedActor.submit_patient_case(payload);
      
      if ('Ok' in result) {
        alert('Case submitted successfully! It will be reviewed by administrators.');
        if (onSuccess) onSuccess(result.Ok);
        // Reset form
        setFormData({
          case_title: '',
          case_description: '',
          medical_condition: '',
          required_amount: '',
          supporting_documents: [],
          urgency_level: 'Medium'
        });
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error submitting case:', error);
      alert('Error submitting case: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Medical Assistance Request</h1>
        <p className="text-gray-600">
          Request financial assistance for your medical needs. Our verified NGO partners will review and may create contribution campaigns.
        </p>
      </div>

      <Card title="Case Information" icon="📋">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.case_title ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.case_title}
              onChange={(e) => setFormData(prev => ({ ...prev, case_title: e.target.value }))}
              placeholder="Brief title describing your medical need"
            />
            {errors.case_title && <p className="text-red-500 text-sm mt-1">{errors.case_title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Condition <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.medical_condition ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.medical_condition}
              onChange={(e) => setFormData(prev => ({ ...prev, medical_condition: e.target.value }))}
              placeholder="e.g., Cancer treatment, Surgery required, Chronic illness"
            />
            {errors.medical_condition && <p className="text-red-500 text-sm mt-1">{errors.medical_condition}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="4"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.case_description ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.case_description}
              onChange={(e) => setFormData(prev => ({ ...prev, case_description: e.target.value }))}
              placeholder="Detailed description of your situation, treatment needs, and why assistance is needed..."
            />
            {errors.case_description && <p className="text-red-500 text-sm mt-1">{errors.case_description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Amount (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.required_amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                value={formData.required_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, required_amount: e.target.value }))}
                placeholder="0.00"
              />
              {errors.required_amount && <p className="text-red-500 text-sm mt-1">{errors.required_amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.urgency_level}
                onChange={(e) => setFormData(prev => ({ ...prev, urgency_level: e.target.value }))}
              >
                {urgencyLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Documents (URLs)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://example.com/medical-report.pdf"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addDocument}
                disabled={!documentUrl.trim()}
              >
                Add
              </Button>
            </div>

            {formData.supporting_documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Added documents:</p>
                {formData.supporting_documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <a 
                      href={doc} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 truncate"
                    >
                      {doc}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="text-red-600 hover:text-red-700 ml-2"
                    >
                      <FAIcon name="times" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FAIcon name="info-circle" className="text-blue-600 text-xl mr-3" />
               <div>
                 <h3 className="text-sm font-medium text-blue-900 mb-1">Review Process</h3>
                 <p className="text-sm text-blue-700">
                   Your case will be reviewed by our administrators. Once approved, verified NGOs can create contribution campaigns to help with your medical needs.
                 </p>
               </div>
             </div>
           </div>

          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full"
          >
            Submit Medical Assistance Request
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default PatientCaseSubmission;