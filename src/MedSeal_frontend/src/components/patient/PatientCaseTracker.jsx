import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

function PatientCaseTracker() {
  const { authenticatedActor } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyCases();
  }, [authenticatedActor]);

  const loadMyCases = async () => {
    if (!authenticatedActor) return;
    
    try {
      const result = await authenticatedActor.get_my_patient_cases();
      if ('Ok' in result) {
        setCases(result.Ok);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Case Submissions</h1>
        <p className="text-gray-600">
          Track the status of your medical assistance requests.
        </p>
      </div>

      {cases.length > 0 ? (
        <div className="space-y-6">
          {cases.map(case_ => (
            <div key={case_.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{case_.case_title}</h3>
                    <p className="text-gray-600">{case_.medical_condition}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(case_.status)}`}>
                      {Object.keys(case_.status)[0]}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getUrgencyColor(case_.urgency_level)}`}>
                      {Object.keys(case_.urgency_level)[0]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Required Amount</p>
                    <p className="text-lg font-semibold text-green-600">${(case_.required_amount / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="font-medium">{new Date(Number(case_.created_at)).toLocaleDateString()}</p>
                  </div>
                  {case_.reviewed_at && (
                    <div>
                      <p className="text-sm text-gray-600">Reviewed</p>
                      <p className="font-medium">{new Date(Number(case_.reviewed_at)).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 mb-4">{case_.case_description}</p>

                {case_.admin_notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Admin Notes</h4>
                    <p className="text-blue-800">{case_.admin_notes}</p>
                  </div>
                )}

                {case_.supporting_documents && case_.supporting_documents.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Supporting Documents</p>
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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No cases submitted yet</h3>
          <p className="text-gray-500 mb-6">
            Submit your first medical assistance request to get started.
          </p>
        </div>
      )}
    </div>
  );
}

export default PatientCaseTracker;