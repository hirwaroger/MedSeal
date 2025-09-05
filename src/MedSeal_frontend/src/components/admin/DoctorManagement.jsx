// filepath: /root/MedSeal/src/MedSeal_frontend/src/components/admin/DoctorManagement.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

function DoctorManagement() {
  const { authenticatedActor } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    loadDoctors();
  }, [authenticatedActor]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!authenticatedActor) {
        throw new Error('Backend connection not available');
      }

      const result = await authenticatedActor.get_all_doctors();
      
      if ('Ok' in result) {
        setDoctors(result.Ok);
      } else {
        throw new Error(result.Err || 'Failed to load doctors');
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Pending: { class: 'bg-yellow-100 text-yellow-800', text: 'Pending Verification' },
      Approved: { class: 'bg-green-100 text-green-800', text: 'Verified' },
      Rejected: { class: 'bg-red-100 text-red-800', text: 'Rejected' },
      NotRequired: { class: 'bg-gray-100 text-gray-800', text: 'Not Required' },
    };

    const statusKey = typeof status === 'string' ? status : Object.keys(status)[0];
    const config = statusMap[statusKey] || statusMap.Pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const filteredDoctors = doctors
    .filter(doctor => {
      const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doctor.license_number.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterStatus === 'all') return matchesSearch;

      const statusKey = typeof doctor.verification_status === 'string' 
        ? doctor.verification_status 
        : Object.keys(doctor.verification_status)[0];

      return matchesSearch && statusKey.toLowerCase() === filterStatus.toLowerCase();
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created_at') return Number(b.created_at) - Number(a.created_at);
      if (sortBy === 'verification_status') {
        const aStatus = typeof a.verification_status === 'string' ? a.verification_status : Object.keys(a.verification_status)[0];
        const bStatus = typeof b.verification_status === 'string' ? b.verification_status : Object.keys(b.verification_status)[0];
        return aStatus.localeCompare(bStatus);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Doctor Management</h1>
        <p className="text-gray-600">Manage healthcare provider accounts and verification status</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fa-solid fa-exclamation-circle text-red-600 mr-2"></i>
            <p className="text-red-700">Error: {error}</p>
          </div>
          <button
            onClick={loadDoctors}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="verification_status">Sort by Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Doctors List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Doctor</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">License</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Activity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDoctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{doctor.name}</div>
                      <div className="text-sm text-gray-500">{doctor.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-900">{doctor.license_number}</span>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(doctor.verification_status)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <div className="text-gray-900">{doctor.total_prescriptions} prescriptions</div>
                      <div className="text-gray-500">{doctor.total_medicines} medicines</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-500">
                      {new Date(Number(doctor.created_at) / 1000000).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      {doctor.verification_request && (
                        <a
                          href={`/admin/verification/${doctor.verification_request.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Request
                        </a>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <i className="fa-solid fa-ellipsis-v"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDoctors.length === 0 && !loading && (
          <div className="text-center py-12">
            <i className="fa-solid fa-user-doctor text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No doctors have registered yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-800">
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </span>
          <div className="flex space-x-4 text-blue-600">
            <span>{doctors.filter(d => {
              const status = typeof d.verification_status === 'string' ? d.verification_status : Object.keys(d.verification_status)[0];
              return status === 'Approved';
            }).length} verified</span>
            <span>{doctors.filter(d => {
              const status = typeof d.verification_status === 'string' ? d.verification_status : Object.keys(d.verification_status)[0];
              return status === 'Pending';
            }).length} pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorManagement;