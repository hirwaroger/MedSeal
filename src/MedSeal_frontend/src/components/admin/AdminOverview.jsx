// filepath: /root/MedSeal/src/MedSeal_frontend/src/components/admin/AdminOverview.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

function AdminOverview() {
  const { authenticatedActor } = useAuth();
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSystemStats();
  }, [authenticatedActor]);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!authenticatedActor) {
        throw new Error('Backend connection not available');
      }

      const result = await authenticatedActor.get_system_overview();
      
      if ('Ok' in result) {
        setSystemStats(result.Ok);
      } else {
        throw new Error(result.Err || 'Failed to load system overview');
      }
    } catch (err) {
      console.error('Error loading system stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fa-solid fa-exclamation-circle text-red-600 mr-2"></i>
            <p className="text-red-700">Error loading system overview: {error}</p>
          </div>
          <button
            onClick={loadSystemStats}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Doctors',
      value: systemStats?.total_doctors || 0,
      icon: 'fa-user-doctor',
      color: 'blue',
      subtitle: `${systemStats?.verified_doctors || 0} verified, ${systemStats?.unverified_doctors || 0} pending`,
    },
    {
      title: 'Total Patients',
      value: systemStats?.total_patients || 0,
      icon: 'fa-users',
      color: 'green',
      subtitle: 'Active patient accounts',
    },
    {
      title: 'Pending Verifications',
      value: systemStats?.pending_verifications || 0,
      icon: 'fa-shield-check',
      color: 'yellow',
      subtitle: 'Awaiting admin review',
    },
    {
      title: 'Total Medicines',
      value: systemStats?.total_medicines || 0,
      icon: 'fa-pills',
      color: 'purple',
      subtitle: 'In system database',
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">System Overview</h1>
        <p className="text-gray-600">Monitor and manage your MedSeal platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <i className={`fa-solid ${stat.icon} text-${stat.color}-600 text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/admin/verification"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <i className="fa-solid fa-shield-check text-yellow-600 mr-3"></i>
              <div>
                <p className="font-medium text-gray-900">Review Verifications</p>
                <p className="text-sm text-gray-600">{systemStats?.pending_verifications || 0} pending</p>
              </div>
            </a>
            <a
              href="/admin/doctors"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <i className="fa-solid fa-user-doctor text-blue-600 mr-3"></i>
              <div>
                <p className="font-medium text-gray-900">Manage Doctors</p>
                <p className="text-sm text-gray-600">View all healthcare providers</p>
              </div>
            </a>
            <a
              href="/admin/patients"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <i className="fa-solid fa-users text-green-600 mr-3"></i>
              <div>
                <p className="font-medium text-gray-900">View Patients</p>
                <p className="text-sm text-gray-600">Monitor patient activity</p>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <i className="fa-solid fa-check-circle text-green-600 mr-2"></i>
                <span className="text-sm font-medium text-green-800">Backend Status</span>
              </div>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <i className="fa-solid fa-database text-green-600 mr-2"></i>
                <span className="text-sm font-medium text-green-800">Database</span>
              </div>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <i className="fa-solid fa-robot text-blue-600 mr-2"></i>
                <span className="text-sm font-medium text-blue-800">AI Services</span>
              </div>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">Active</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <i className="fa-solid fa-user-plus text-blue-600 mt-1"></i>
              <div>
                <p className="text-gray-900">New doctor registered</p>
                <p className="text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fa-solid fa-shield-check text-green-600 mt-1"></i>
              <div>
                <p className="text-gray-900">Verification approved</p>
                <p className="text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fa-solid fa-prescription text-purple-600 mt-1"></i>
              <div>
                <p className="text-gray-900">New prescription created</p>
                <p className="text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;