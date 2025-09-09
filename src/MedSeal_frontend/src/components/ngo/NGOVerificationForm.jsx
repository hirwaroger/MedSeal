import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../shared/components/Button';
import FAIcon from '../FAIcon';

function NGOVerificationForm({ onSuccess, existingRequest }) {
  const { authenticatedActor } = useAuth();
  const [formData, setFormData] = useState({
    institution_name: existingRequest?.institution_name || '',
    institution_website: existingRequest?.institution_website || '',
    license_authority: existingRequest?.license_authority || '',
    license_authority_website: existingRequest?.license_authority_website || '',
    medical_license_number: existingRequest?.medical_license_number || '',
    additional_documents: existingRequest?.additional_documents || []
  });
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isReadOnly = existingRequest && ['Pending', 'Approved'].includes(Object.keys(existingRequest.status)[0]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.institution_name.trim()) newErrors.institution_name = 'NGO name is required';
    if (!formData.institution_website.trim()) newErrors.institution_website = 'Website is required';
    if (!formData.license_authority.trim()) newErrors.license_authority = 'Registration authority is required';
    if (!formData.license_authority_website.trim()) newErrors.license_authority_website = 'Authority website is required';
    if (!formData.medical_license_number.trim()) newErrors.medical_license_number = 'Registration number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addDocument = () => {
    if (documentUrl.trim()) {
      try {
        new URL(documentUrl.trim());
        setFormData(prev => ({
          ...prev,
          additional_documents: [...prev.additional_documents, documentUrl.trim()]
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
      additional_documents: prev.additional_documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await authenticatedActor.submit_verification_request({
        institution_name: formData.institution_name.trim(),
        institution_website: formData.institution_website.trim(),
        license_authority: formData.license_authority.trim(),
        license_authority_website: formData.license_authority_website.trim(),
        medical_license_number: formData.medical_license_number.trim(),
        additional_documents: formData.additional_documents
      });

      if ('Ok' in result) {
        alert('NGO verification request submitted successfully!');
        if (onSuccess) onSuccess();
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert('Error submitting verification: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {existingRequest ? 'NGO Verification Status' : 'NGO Verification Request'}
        </h1>
        <p className="text-gray-600">
          {isReadOnly 
            ? 'Your NGO verification request is being processed by our admin team.'
            : 'Submit your NGO credentials for verification to start helping patients.'
          }
        </p>
        {existingRequest && (
          <div className="mt-4 p-3 border rounded bg-gray-50">
            <p className="text-sm">Submitted: {new Date(Number(existingRequest.submitted_at)).toLocaleString()}</p>
            <p className="text-sm">Status: {Object.keys(existingRequest.status)[0]}</p>
            {existingRequest.processed_at && <p className="text-sm">Processed: {new Date(Number(existingRequest.processed_at)).toLocaleString()}</p>}
            {existingRequest.admin_notes && (
              <p className="text-sm text-gray-700">Admin Notes: {existingRequest.admin_notes}</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">NGO Information</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NGO Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.institution_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
                value={formData.institution_name}
                onChange={(e) => setFormData(prev => ({ ...prev, institution_name: e.target.value }))}
                placeholder="Your NGO name"
                disabled={isReadOnly}
              />
              {errors.institution_name && <p className="text-red-500 text-sm mt-1">{errors.institution_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NGO Website <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.institution_website ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
                value={formData.institution_website}
                onChange={(e) => setFormData(prev => ({ ...prev, institution_website: e.target.value }))}
                placeholder="https://yourngo.org"
                disabled={isReadOnly}
              />
              {errors.institution_website && <p className="text-red-500 text-sm mt-1">{errors.institution_website}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Authority <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.license_authority ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
                value={formData.license_authority}
                onChange={(e) => setFormData(prev => ({ ...prev, license_authority: e.target.value }))}
                placeholder="Government department that registered your NGO"
                disabled={isReadOnly}
              />
              {errors.license_authority && <p className="text-red-500 text-sm mt-1">{errors.license_authority}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authority Website <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.license_authority_website ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-100' : ''}`}
                value={formData.license_authority_website}
                onChange={(e) => setFormData(prev => ({ ...prev, license_authority_website: e.target.value }))}
                placeholder="https://authority-website.gov"
                disabled={isReadOnly}
              />
              {errors.license_authority_website && <p className="text-red-500 text-sm mt-1">{errors.license_authority_website}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NGO Registration Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.medical_license_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
              } ${isReadOnly ? 'bg-gray-100' : ''}`}
              value={formData.medical_license_number}
              onChange={(e) => setFormData(prev => ({ ...prev, medical_license_number: e.target.value }))}
              placeholder="Your official NGO registration number"
              disabled={isReadOnly}
            />
            {errors.medical_license_number && <p className="text-red-500 text-sm mt-1">{errors.medical_license_number}</p>}
          </div>

          {!isReadOnly && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Documents (URLs)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://example.com/registration-certificate.pdf"
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

              {formData.additional_documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Added documents:</p>
                  {formData.additional_documents.map((doc, index) => (
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
          )}

          {existingRequest?.additional_documents && existingRequest.additional_documents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Submitted Documents</label>
              <div className="space-y-2">
                {existingRequest.additional_documents.map((doc, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-lg">
                    <a 
                      href={doc} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {doc}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isReadOnly && (
            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Submit NGO Verification Request
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

export default NGOVerificationForm;