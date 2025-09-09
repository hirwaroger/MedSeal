import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

function NGOVerificationManagement() {
  const { authenticatedActor } = useAuth();
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadVerificationRequests();
  }, [authenticatedActor]);

  const loadVerificationRequests = async () => {
    if (!authenticatedActor) return;
    
    try {
      const result = await authenticatedActor.get_all_verification_requests();
      if ('Ok' in result) {
        setVerificationRequests(result.Ok);
      }
    } catch (error) {
      console.error('Error loading verification requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRequest = async (requestId, status) => {
    setProcessing(true);
    try {
      const result = await authenticatedActor.process_verification_request({
        verification_id: requestId,
        status: { [status]: null },
        admin_notes: adminNotes ? [adminNotes] : []
      });

      if ('Ok' in result) {
        alert(`Verification request ${status.toLowerCase()} successfully!`);
        setSelectedRequest(null);
        setAdminNotes('');
        loadVerificationRequests();
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      alert('Error processing request: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    const statusKey = Object.keys(status)[0];
    switch (statusKey) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NGO Verification Management</h1>
        <p className="text-gray-600">
          Review and process NGO verification requests.
        </p>
      </div>

      {verificationRequests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {verificationRequests.map(request => (
            <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {request.institution_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Registration: {request.medical_license_number}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                    {Object.keys(request.status)[0]}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div>
                    <span className="font-medium">Website:</span>
                    <a 
                      href={request.institution_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 ml-1"
                    >
                      {request.institution_website}
                    </a>
                  </div>
                  <div>
                    <span className="font-medium">Authority:</span>
                    <span className="ml-1">{request.license_authority}</span>
                  </div>
                  <div>
                    <span className="font-medium">Authority Website:</span>
                    <a 
                      href={request.license_authority_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 ml-1"
                    >
                      {request.license_authority_website}
                    </a>
                  </div>
                  <div>
                    <span className="font-medium">Submitted:</span>
                    <span className="ml-1">{new Date(Number(request.submitted_at)).toLocaleDateString()}</span>
                  </div>
                </div>

                {request.additional_documents && request.additional_documents.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Documents:</p>
                    <div className="space-y-1">
                      {request.additional_documents.map((doc, index) => (
                        <a
                          key={index}
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 block"
                        >
                          Document {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {request.admin_notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                    <p className="text-sm text-gray-600">{request.admin_notes}</p>
                  </div>
                )}

                {Object.keys(request.status)[0] === 'Pending' && (
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Review Request
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No verification requests</h3>
          <p className="text-gray-500">
            NGO verification requests will appear here for review.
          </p>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Review NGO Verification
            </h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{selectedRequest.institution_name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Registration Number:</span>
                  <p>{selectedRequest.medical_license_number}</p>
                </div>
                <div>
                  <span className="font-medium">Authority:</span>
                  <p>{selectedRequest.license_authority}</p>
                </div>
                <div>
                  <span className="font-medium">Website:</span>
                  <a 
                    href={selectedRequest.institution_website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {selectedRequest.institution_website}
                  </a>
                </div>
                <div>
                  <span className="font-medium">Authority Website:</span>
                  <a 
                    href={selectedRequest.license_authority_website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {selectedRequest.license_authority_website}
                  </a>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add notes about your decision..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => processRequest(selectedRequest.id, 'Approved')}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => processRequest(selectedRequest.id, 'Rejected')}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminNotes('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NGOVerificationManagement;