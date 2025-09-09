import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

function DoctorVerification() {
  const { authenticatedActor } = useAuth();
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerificationRequests();
  }, [authenticatedActor]);

  const loadVerificationRequests = async () => {
    if (!authenticatedActor) return;
    
    try {
      const result = await authenticatedActor.get_pending_verification_requests();
      if ('Ok' in result) {
        setVerificationRequests(result.Ok);
      }
    } catch (error) {
      console.error('Error loading verification requests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Verification</h1>
        <p className="text-gray-600">
          Review and process doctor verification requests.
        </p>
      </div>

      {verificationRequests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {verificationRequests.map(request => (
            <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {request.institution_name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                License: {request.medical_license_number}
              </p>
              <p className="text-sm text-gray-500">
                Submitted: {new Date(Number(request.submitted_at)).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No pending verifications</h3>
          <p className="text-gray-500">
            Doctor verification requests will appear here for review.
          </p>
        </div>
      )}
    </div>
  );
}

export default DoctorVerification;