// filepath: /root/MedSeal/src/MedSeal_frontend/src/components/admin/VerificationManagement.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function VerificationManagement() {
  const { verificationId } = useParams();
  const navigate = useNavigate();
  const { authenticatedActor } = useAuth();
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('');

  useEffect(() => {
    loadVerificationRequests();
  }, [authenticatedActor]);

  useEffect(() => {
    if (verificationId && verificationRequests.length > 0) {
      const request = verificationRequests.find(r => r.id === verificationId);
      if (request) {
        setSelectedRequest(request);
        setAdminNotes(request.admin_notes || '');
      }
    }
  }, [verificationId, verificationRequests]);

  const loadVerificationRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!authenticatedActor) {
        throw new Error('Backend connection not available');
      }

      const result = await authenticatedActor.get_all_verification_requests();
      
      if ('Ok' in result) {
        setVerificationRequests(result.Ok);
      } else {
        throw new Error(result.Err || 'Failed to load verification requests');
      }
    } catch (err) {
      console.error('Error loading verification requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (status) => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);

      const processRequest = {
        verification_id: selectedRequest.id,
        status: { [status]: null },
        admin_notes: adminNotes.trim() || null,
      };

      const result = await authenticatedActor.process_verification_request(processRequest);

      if ('Ok' in result) {
        alert(`Verification request ${status.toLowerCase()} successfully!`);
        await loadVerificationRequests();
        setShowModal(false);
        setSelectedRequest(null);
        navigate('/admin/verification');
      } else {
        throw new Error(result.Err || 'Failed to process verification request');
      }
    } catch (err) {
      console.error('Error processing verification request:', err);
      alert('Error processing request: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (action) => {
    setModalAction(action);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Pending: { class: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
      Approved: { class: 'bg-green-100 text-green-800', text: 'Approved' },
      Rejected: { class: 'bg-red-100 text-red-800', text: 'Rejected' },
    };

    const statusKey = typeof status === 'string' ? status : Object.keys(status)[0];
    const config = statusMap[statusKey] || statusMap.Pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.text}
      </span>
    );
  };

  // ...existing code for loading and error states...

  if (selectedRequest) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => { setSelectedRequest(null); navigate('/admin/verification'); }}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Back to Verification Requests
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Verification Request Details</h1>
            <p className="text-gray-600">Review and process doctor verification</p>
          </div>
          <div className="flex space-x-3">
            {selectedRequest.status && Object.keys(selectedRequest.status)[0] === 'Pending' && (
              <>
                <button
                  onClick={() => openModal('Rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={processing}
                >
                  <i className="fa-solid fa-times mr-2"></i>
                  Reject
                </button>
                <button
                  onClick={() => openModal('Approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={processing}
                >
                  <i className="fa-solid fa-check mr-2"></i>
                  Approve
                </button>
              </>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctor Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request ID</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRequest.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor ID</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRequest.doctor_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical License Number</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRequest.medical_license_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {new Date(Number(selectedRequest.submitted_at) / 1000000).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Institution Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedRequest.institution_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution Website</label>
                  <a
                    href={selectedRequest.institution_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 bg-gray-50 p-3 rounded block"
                  >
                    {selectedRequest.institution_website}
                    <i className="fa-solid fa-external-link ml-1"></i>
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">License Authority</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Authority Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedRequest.license_authority}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Authority Website</label>
                  <a
                    href={selectedRequest.license_authority_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 bg-gray-50 p-3 rounded block"
                  >
                    {selectedRequest.license_authority_website}
                    <i className="fa-solid fa-external-link ml-1"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                {selectedRequest.processed_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Processed At</label>
                    <p className="text-sm text-gray-900">
                      {new Date(Number(selectedRequest.processed_at) / 1000000).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedRequest.processed_by && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Processed By</label>
                    <p className="text-sm text-gray-900">{selectedRequest.processed_by}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Notes</h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this verification request..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={selectedRequest.status && Object.keys(selectedRequest.status)[0] !== 'Pending'}
              />
              {selectedRequest.admin_notes && selectedRequest.admin_notes !== adminNotes && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Previous notes:</strong> {selectedRequest.admin_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm {modalAction}
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to {modalAction.toLowerCase()} this verification request? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleProcessRequest(modalAction)}
                  className={`px-4 py-2 text-white rounded-lg ${
                    modalAction === 'Approved' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Confirm ${modalAction}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Management</h1>
        <p className="text-gray-600">Review and approve doctor verification requests</p>
      </div>

      {/* Verification Requests List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {verificationRequests
            .filter(req => Object.keys(req.status)[0] === 'Pending')
            .map((request) => (
              <div key={request.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">{request.institution_name}</p>
                        <p className="text-sm text-gray-500">Doctor ID: {request.doctor_id}</p>
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(Number(request.submitted_at) / 1000000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(request.status)}
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        navigate(`/admin/verification/${request.id}`);
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {verificationRequests.filter(req => Object.keys(req.status)[0] === 'Pending').length === 0 && (
          <div className="p-8 text-center">
            <i className="fa-solid fa-shield-check text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
            <p className="text-gray-500">All verification requests have been processed</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificationManagement;