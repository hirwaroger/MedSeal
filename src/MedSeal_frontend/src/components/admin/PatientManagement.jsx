// filepath: /root/MedSeal/src/MedSeal_frontend/src/components/admin/PatientManagement.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

function PatientManagement() {
  const { authenticatedActor } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    loadPatients();
  }, [authenticatedActor]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!authenticatedActor) {
        throw new Error('Backend connection not available');
      }

      const result = await authenticatedActor.get_all_patients();
      
      if ('Ok' in result) {
        setPatients(result.Ok);
      } else {
        throw new Error(result.Err || 'Failed to load patients');
      }
    } catch (err) {
      console.error('Error loading patients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients
    .filter(patient => {
      return patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created_at') return Number(b.created_at) - Number(a.created_at);
      if (sortBy === 'last_active') {
        const aActive = a.last_active ? Number(a.last_active) : 0;
        const bActive = b.last_active ? Number(b.last_active) : 0;
        return bActive - aActive;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Management</h1>
        <p className="text-gray-600">View and monitor patient accounts</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fa-solid fa-exclamation-circle text-red-600 mr-2"></i>
            <p className="text-red-700">Error: {error}</p>
          </div>
          <button
            onClick={loadPatients}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Sort */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at">Sort by Date Joined</option>
              <option value="name">Sort by Name</option>
              <option value="last_active">Sort by Last Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Patient</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Last Active</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-user text-green-600 text-sm"></i>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">ID: {patient.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900">{patient.email}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-500">
                      {patient.last_active 
                        ? new Date(Number(patient.last_active) / 1000000).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-500">
                      {new Date(Number(patient.created_at) / 1000000).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <i className="fa-solid fa-ellipsis-v"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && !loading && (
          <div className="text-center py-12">
            <i className="fa-solid fa-users text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'No patients have registered yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-800">
            Showing {filteredPatients.length} of {patients.length} patients
          </span>
          <div className="flex space-x-4 text-green-600">
            <span>{patients.filter(p => p.last_active).length} active users</span>
            <span>{patients.length} total registered</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientManagement;