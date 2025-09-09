// filepath: /root/Mal_frontend/src/components/doctor/DoctorVerificationForm.jsx
import React, { useState } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import { useAuth } from '../../hooks/useAuth';
import FAIcon from '../FAIcon';

function DoctorVerificationForm({ onSuccess, existingRequest }) {
  const { authenticatedActor } = useAuth();
  const [formData, setFormData] = useState({
    institution_name: existingRequest?.institution_name || '',
    institution_website: existingRequest?.institution_website || '',
    license_authority: existingRequest?.license_authority || '',
    license_authority_website: existingRequest?.license_authority_website || '',
    medical_license_number: existingRequest?.medical_license_number || '',
    additional_documents: existingRequest?.additional_documents || [],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentUrls, setDocumentUrls] = useState('');

  const addDocument = () => {
    if (documentUrls.trim() && isValidUrl(documentUrls.trim())) {
      setFormData(prev => ({
        ...prev,
        additional_documents: [...prev.additional_documents, documentUrls.trim()]
      }));
      setDocumentUrls('');
    }
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      additional_documents: prev.additional_documents.filter((_, i) => i !== index)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.institution_name.trim()) {
      newErrors.institution_name = 'Institution name is required';
    }

    if (!formData.institution_website.trim()) {
      newErrors.institution_website = 'Institution website is required';
    } else if (!isValidUrl(formData.institution_website)) {
      newErrors.institution_website = 'Please enter a valid URL';
    }

    if (!formData.license_authority.trim()) {
      newErrors.license_authority = 'License authority is required';
    }

    if (!formData.license_authority_website.trim()) {
      newErrors.license_authority_website = 'License authority website is required';
    } else if (!isValidUrl(formData.license_authority_website)) {
      newErrors.license_authority_website = 'Please enter a valid URL';
    }

    if (!formData.medical_license_number.trim()) {
      newErrors.medical_license_number = 'Medical license number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Parse document URLs
      const documentList = documentUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url && isValidUrl(url));

      const verificationRequest = {
        ...formData,
        additional_documents: documentList,
      };

      const result = await authenticatedActor.submit_verification_request(verificationRequest);

      if ('Ok' in result) {
        alert('Verification request submitted successfully! You will be notified once it\'s reviewed.');
        if (onSuccess) {
          onSuccess(result.Ok);
        }
      } else {
        throw new Error(result.Err || 'Failed to submit verification request');
      }
    } catch (error) {
      console.error('Error submitting verification request:', error);
      alert('Error submitting verification request: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = existingRequest && existingRequest.status && 
    (Object.keys(existingRequest.status)[0] === 'Approved' || 
     Object.keys(existingRequest.status)[0] === 'Pending');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {existingRequest ? 'Verification Request Details' : 'Doctor Verification Request'}
        </h1>
        <p className="text-gray-600">
          {isReadOnly 
            ? 'Your verification request is being processed by our admin team.'
            : 'Submit your professional credentials for verification to unlock full platform features.'
          }
        </p>
        {existingRequest && (
          <div className="mt-4 p-3 border rounded bg-gray-50">
            <p className="text-sm">Submitted at: {new Date(Number(existingRequest.submitted_at)).toLocaleString()}</p>
            <p className="text-sm">Status: {Object.keys(existingRequest.status)[0]}</p>
            {existingRequest.processed_at && <p className="text-sm">Processed at: {new Date(Number(existingRequest.processed_at)).toLocaleString()}</p>}
            {existingRequest.admin_notes && existingRequest.admin_notes.length > 0 && (
              <p className="text-sm text-gray-700">Admin Notes: {existingRequest.admin_notes.join(', ')}</p>
            )}
          </div>
        )}
      </div>

      <Card title="Professional Information" icon={<FAIcon name="user-md" className="text-2xl" />}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="institution_name"
                value={formData.institution_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.institution_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., City General Hospital"
                disabled={isReadOnly}
                required
              />
              {errors.institution_name && (
                <p className="mt-1 text-xs text-red-600">{errors.institution_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution Website
              </label>
              <input
                type="url"
                name="institution_website"
                value={formData.institution_website}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.institution_website ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="https://example.com"
                disabled={isReadOnly}
              />
              {errors.institution_website && (
                <p className="mt-1 text-xs text-red-600">{errors.institution_website}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Authority <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="license_authority"
                value={formData.license_authority}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.license_authority ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., State Medical Board"
                disabled={isReadOnly}
                required
              />
              {errors.license_authority && (
                <p className="mt-1 text-xs text-red-600">{errors.license_authority}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Authority Website
              </label>
              <input
                type="url"
                name="license_authority_website"
                value={formData.license_authority_website}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.license_authority_website ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="https://medicalboard.state.gov"
                disabled={isReadOnly}
              />
              {errors.license_authority_website && (
                <p className="mt-1 text-xs text-red-600">{errors.license_authority_website}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical License Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="medical_license_number"
                value={formData.medical_license_number}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.medical_license_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your medical license number"
                disabled={isReadOnly}
                required
              />
              {errors.medical_license_number && (
                <p className="mt-1 text-xs text-red-600">{errors.medical_license_number}</p>
              )}
            </div>
          </div>

          {/* Additional Documents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Documents (URLs)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={documentUrls}
                onChange={(e) => setDocumentUrls(e.target.value)}
                placeholder="https://example.com/document.pdf"
                disabled={isReadOnly}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addDocument}
                disabled={!documentUrls.trim() || isReadOnly}
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-blue-600 text-xl mr-3">ℹ️</span>
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">Verification Process</h3>
                <p className="text-sm text-blue-700">
                  Your verification request will be reviewed by our admin team. You'll receive updates 
                  on your verification status. Once approved, you'll have access to all platform features.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {!isReadOnly && (
              <Button
                type="submit"
                loading={isSubmitting}
                className="flex-1"
              >
                Submit Verification Request
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

export default DoctorVerificationForm;