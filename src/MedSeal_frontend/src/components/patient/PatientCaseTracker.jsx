import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import FAIcon from '../FAIcon';

function PatientCaseTracker() {
  const { authenticatedActor } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to convert BigInt timestamps to regular numbers
  const convertBigIntTimestamp = (timestamp) => {
    if (!timestamp) return null;
    
    // Handle array format (IC optional types sometimes return arrays)
    if (Array.isArray(timestamp)) {
      if (timestamp.length === 0) return null;
      timestamp = timestamp[0];
    }
    
    if (typeof timestamp === 'bigint') {
      // Convert BigInt to Number and handle nanoseconds to milliseconds conversion
      const numericTimestamp = Number(timestamp);
      // IC timestamps are in nanoseconds, convert to milliseconds
      return Math.floor(numericTimestamp / 1000000);
    }
    
    if (typeof timestamp === 'string') {
      const parsed = parseInt(timestamp, 10);
      if (isNaN(parsed)) return null;
      return parsed > 1e15 ? Math.floor(parsed / 1000000) : parsed;
    }
    
    if (typeof timestamp === 'number') {
      // If it's already a number, check if it needs nanosecond conversion
      return timestamp > 1e15 ? Math.floor(timestamp / 1000000) : timestamp;
    }
    
    return timestamp;
  };

  // Helper function to normalize case data
  const normalizeCaseData = (caseData) => {
    return {
      ...caseData,
      created_at: convertBigIntTimestamp(caseData.created_at),
      reviewed_at: convertBigIntTimestamp(caseData.reviewed_at),
      // Ensure required_amount is properly handled
      required_amount: typeof caseData.required_amount === 'bigint' 
        ? Number(caseData.required_amount) 
        : caseData.required_amount
    };
  };

  useEffect(() => {
    loadMyCases();
  }, [authenticatedActor]);

  const loadMyCases = async () => {
    if (!authenticatedActor) return;
    
    try {
      console.log('LOG: Loading patient cases...');
      const result = await authenticatedActor.get_my_patient_cases();
      console.log('LOG: Raw cases result:', result);
      
      if ('Ok' in result) {
        // Normalize all case data to handle BigInt timestamps
        const normalizedCases = result.Ok.map(caseData => {
          console.log('LOG: Normalizing case:', caseData.id);
          return normalizeCaseData(caseData);
        });
        
        console.log('LOG: Normalized cases:', normalizedCases);
        setCases(normalizedCases);
      } else {
        console.error('LOG: Error loading cases:', result.Err);
      }
    } catch (error) {
      console.error('LOG: Error loading cases:', error);
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

  // Safe date formatting
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString();
    } catch (error) {
      console.error('LOG: Error formatting date:', timestamp, error);
      return 'Invalid Date';
    }
  };

  // Safe amount formatting
  const formatAmount = (amount) => {
    try {
      const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
      return (numAmount / 100).toFixed(2);
    } catch (error) {
      console.error('LOG: Error formatting amount:', amount, error);
      return '0.00';
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
                    <p className="text-lg font-semibold text-green-600">${formatAmount(case_.required_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="font-medium">{formatDate(case_.created_at)}</p>
                  </div>
                  {case_.reviewed_at && (
                    <div>
                      <p className="text-sm text-gray-600">Reviewed</p>
                      <p className="font-medium">{formatDate(case_.reviewed_at)}</p>
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
                          <FAIcon name="file-lines" className="mr-2" /> Document {index + 1}
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
          <div className="text-6xl mb-4">
            <FAIcon name="folder-open" className="inline-block" />
          </div>
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