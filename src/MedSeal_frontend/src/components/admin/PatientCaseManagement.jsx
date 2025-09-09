import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

function PatientCaseManagement() {
  const { authenticatedActor } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    loadCases();
  }, [authenticatedActor, filter]);

  const loadCases = async () => {
    if (!authenticatedActor) return;
    
    try {
      let result;
      if (filter === 'pending') {
        result = await authenticatedActor.get_pending_patient_cases();
      } else {
        result = await authenticatedActor.get_all_patient_cases();
      }
      
      if ('Ok' in result) {
        let filteredCases = result.Ok;
        if (filter === 'approved') {
          filteredCases = result.Ok.filter(c => Object.keys(c.status)[0] === 'Approved');
        } else if (filter === 'rejected') {
          filteredCases = result.Ok.filter(c => Object.keys(c.status)[0] === 'Rejected');
        }
        setCases(filteredCases);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const processCase = async (caseId, status) => {
    setProcessing(true);
    try {
      const result = await authenticatedActor.process_patient_case({
        case_id: caseId,
        status: { [status]: null },
        admin_notes: adminNotes || null
      });

      if ('Ok' in result) {
        alert(`Case ${status.toLowerCase()} successfully!`);
        setSelectedCase(null);
        setAdminNotes('');
        loadCases();
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error processing case:', error);
      alert('Error processing case: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    const statusKey = Object.keys(status)[0];
    switch (statusKey) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'UnderReview': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Funded': return 'bg-purple-100 text-purple-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    const urgencyKey = Object.keys(urgency)[0];
    switch (urgencyKey) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Case Management</h1>
        <p className="text-gray-600">
          Review and process patient medical assistance requests.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', label: 'All Cases' },
              { id: 'pending', label: 'Pending Review' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {cases.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cases.map(case_ => (
            <div key={case_.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {case_.case_title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Patient: {case_.patient_name} • {case_.patient_contact}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-col items-end">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(case_.status)}`}>
                      {Object.keys(case_.status)[0]}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(case_.urgency_level)}`}>
                      {Object.keys(case_.urgency_level)[0]}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Medical Condition:</p>
                  <p className="text-sm text-gray-600">{case_.medical_condition}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{case_.case_description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Required Amount:</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${(case_.required_amount / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Submitted:</p>
                    <p>{new Date(Number(case_.created_at)).toLocaleDateString()}</p>
                  </div>
                </div>

                {case_.supporting_documents && case_.supporting_documents.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Supporting Documents:</p>
                    <div className="space-y-1">
                      {case_.supporting_documents.map((doc, index) => (
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

                {case_.admin_notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                    <p className="text-sm text-gray-600">{case_.admin_notes}</p>
                  </div>
                )}

                {Object.keys(case_.status)[0] === 'Pending' && (
                  <button
                    onClick={() => setSelectedCase(case_)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Review Case
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-500 mb-2">
            No {filter !== 'all' ? filter : ''} cases found
          </h3>
          <p className="text-gray-500">
            Patient cases will appear here for review.
          </p>
        </div>
      )}

      {/* Review Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Review Patient Case
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedCase.case_title}</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Patient:</span>
                    <span className="ml-1">{selectedCase.patient_name}</span>
                  </div>
                  <div>
                    <span className="font-medium">Contact:</span>
                    <span className="ml-1">{selectedCase.patient_contact}</span>
                  </div>
                  <div>
                    <span className="font-medium">Condition:</span>
                    <span className="ml-1">{selectedCase.medical_condition}</span>
                  </div>
                  <div>
                    <span className="font-medium">Amount Needed:</span>
                    <span className="ml-1 text-green-600 font-semibold">
                      ${(selectedCase.required_amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Urgency:</span>
                    <span className={`ml-1 px-2 py-1 text-xs rounded ${getUrgencyColor(selectedCase.urgency_level)}`}>
                      {Object.keys(selectedCase.urgency_level)[0]}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Case Description:</h4>
                <p className="text-sm text-gray-600 mb-4">{selectedCase.case_description}</p>
                
                {selectedCase.supporting_documents && selectedCase.supporting_documents.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Supporting Documents:</h4>
                    <div className="space-y-1">
                      {selectedCase.supporting_documents.map((doc, index) => (
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
                onClick={() => processCase(selectedCase.id, 'Approved')}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Approve Case'}
              </button>
              <button
                onClick={() => processCase(selectedCase.id, 'Rejected')}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Reject Case'}
              </button>
              <button
                onClick={() => {
                  setSelectedCase(null);
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

export default PatientCaseManagement;