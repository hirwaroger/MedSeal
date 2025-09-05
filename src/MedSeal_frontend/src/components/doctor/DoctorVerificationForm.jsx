// filepath: /root/MedSeal/src/MedSeal_frontend/src/components/doctor/DoctorVerificationForm.jsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {existingRequest ? 'Verification Request Details' : 'Submit Verification Request'}
        </h3>
        <p className="text-gray-600">
          {isReadOnly 
            ? 'Your verification request is being processed by our admin team.'
            : 'Provide your institutional details and medical license information for verification.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Institution Information */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Institution Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution Name *
              </label>
              <input
                type="text"
                name="institution_name"
                value={formData.institution_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.institution_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., Johns Hopkins Hospital"
                disabled={isReadOnly}
                required
              />
              {errors.institution_name && (
                <p className="mt-1 text-xs text-red-600">{errors.institution_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution Website *
              </label>
              <input
                type="url"
                name="institution_website"
                value={formData.institution_website}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.institution_website ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="https://www.institution.com"
                disabled={isReadOnly}
                required
              />
              {errors.institution_website && (
                <p className="mt-1 text-xs text-red-600">{errors.institution_website}</p>
              )}
            </div>
          </div>
        </div>

        {/* License Information */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Medical License Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Authority *
              </label>
              <input
                type="text"
                name="license_authority"
                value={formData.license_authority}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.license_authority ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., Medical Board of California"
                disabled={isReadOnly}
                required
              />
              {errors.license_authority && (
                <p className="mt-1 text-xs text-red-600">{errors.license_authority}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authority Website *
              </label>
              <input
                type="url"
                name="license_authority_website"
                value={formData.license_authority_website}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.license_authority_website ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="https://www.medicalboard.ca.gov"
                disabled={isReadOnly}
                required
              />
              {errors.license_authority_website && (
                <p className="mt-1 text-xs text-red-600">{errors.license_authority_website}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical License Number *
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
            Additional Documents (Optional)
          </label>
          <textarea
            value={documentUrls}
            onChange={(e) => setDocumentUrls(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="4"
            placeholder="Enter document URLs (one per line)&#10;https://example.com/document1.pdf&#10;https://example.com/document2.pdf"
            disabled={isReadOnly}
          />
          <p className="mt-1 text-xs text-gray-500">
            Provide URLs to supporting documents like CV, certifications, etc.
          </p>
        </div>

        {/* Submit Button */}
        {!isReadOnly && (
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin inline-block mr-2 w-4 h-4 border-t-2 border-white rounded-full"></span>
                  Submitting...
                </>
              ) : (
                'Submit Verification Request'
              )}
            </button>
          </div>
        )}

        {/* Status Display */}
        {existingRequest && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                Object.keys(existingRequest.status)[0] === 'Pending' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : Object.keys(existingRequest.status)[0] === 'Approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
              }`}>
                {Object.keys(existingRequest.status)[0] === 'Pending' && 'Pending Review'}
                {Object.keys(existingRequest.status)[0] === 'Approved' && 'Approved'}
                {Object.keys(existingRequest.status)[0] === 'Rejected' && 'Rejected'}
              </span>
            </div>
            
            {existingRequest.admin_notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                <p className="text-sm text-gray-600">{existingRequest.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default DoctorVerificationForm;