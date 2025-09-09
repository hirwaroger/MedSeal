import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

function UserManagement() {
  const { authenticatedActor } = useAuth();
  const [users, setUsers] = useState({ doctors: [], patients: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doctors');

  useEffect(() => {
    loadUsers();
  }, [authenticatedActor]);

  const loadUsers = async () => {
    if (!authenticatedActor) return;
    
    try {
      const [doctorsResult, patientsResult] = await Promise.all([
        authenticatedActor.get_all_doctors(),
        authenticatedActor.get_all_patients()
      ]);

      setUsers({
        doctors: 'Ok' in doctorsResult ? doctorsResult.Ok : [],
        patients: 'Ok' in patientsResult ? patientsResult.Ok : []
      });
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusColor = (status) => {
    if (typeof status === 'string') {
      switch (status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        case 'Approved': return 'bg-green-100 text-green-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'NotRequired': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else if (typeof status === 'object' && status !== null) {
      const statusKey = Object.keys(status)[0];
      switch (statusKey) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        case 'Approved': return 'bg-green-100 text-green-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'NotRequired': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getVerificationStatusText = (status) => {
    if (typeof status === 'string') {
      return status;
    } else if (typeof status === 'object' && status !== null) {
      return Object.keys(status)[0];
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentUsers = activeTab === 'doctors' ? users.doctors : users.patients;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">
          Manage all registered users in the system.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'doctors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fa-solid fa-user-md mr-1"></i>
              Doctors ({users.doctors.length})
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'patients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fa-solid fa-hospital-user mr-1"></i>
              Patients ({users.patients.length})
            </button>
          </nav>
        </div>
      </div>

      {currentUsers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentUsers.map(user => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVerificationStatusColor(user.verification_status)}`}>
                    {getVerificationStatusText(user.verification_status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Role:</span>
                    <span className="ml-1">
                      {typeof user.role === 'string' ? user.role : Object.keys(user.role)[0]}
                    </span>
                  </div>
                  {user.license_number && user.license_number !== 'Not Needed' && (
                    <div>
                      <span className="font-medium">License:</span>
                      <span className="ml-1">{user.license_number}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Joined:</span>
                    <span className="ml-1">{new Date(Number(user.created_at)).toLocaleDateString()}</span>
                  </div>
                  {user.total_prescriptions !== undefined && (
                    <div>
                      <span className="font-medium">Prescriptions:</span>
                      <span className="ml-1">{Number(user.total_prescriptions)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4"><i className="fa-solid fa-users"></i></div>
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No {activeTab} found</h3>
          <p className="text-gray-500">
            Registered {activeTab} will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

export default UserManagement;