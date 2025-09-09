import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

function SystemAnalytics() {
  const { authenticatedActor } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemOverview();
  }, [authenticatedActor]);

  const loadSystemOverview = async () => {
    if (!authenticatedActor) return;
    
    try {
      const result = await authenticatedActor.get_system_overview();
      if ('Ok' in result) {
        setOverview(result.Ok);
      }
    } catch (error) {
      console.error('Error loading system overview:', error);
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

  if (!overview) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4"><i className="fa-solid fa-chart-simple"></i></div>
        <h3 className="text-xl font-semibold text-gray-500 mb-2">No data available</h3>
        <p className="text-gray-500">System analytics will appear here.</p>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Doctors',
      value: Number(overview.total_doctors),
      icon: <i className="fa-solid fa-user-doctor"></i>,
      color: 'blue'
    },
    {
      name: 'Total Patients',
      value: Number(overview.total_patients),
      icon: <i className="fa-solid fa-users"></i>,
      color: 'green'
    },
    {
      name: 'Verified Doctors',
      value: Number(overview.verified_doctors),
      icon: <i className="fa-solid fa-check"></i>,
      color: 'purple'
    },
    {
      name: 'Pending Verifications',
      value: Number(overview.pending_verifications),
      icon: <i className="fa-solid fa-hourglass-half"></i>,
      color: 'yellow'
    },
    {
      name: 'Total Prescriptions',
      value: Number(overview.total_prescriptions),
      icon: <i className="fa-solid fa-file-prescription"></i>,
      color: 'indigo'
    },
    {
      name: 'Total Medicines',
      value: Number(overview.total_medicines),
      icon: <i className="fa-solid fa-pills"></i>,
      color: 'pink'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      purple: 'bg-purple-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      indigo: 'bg-indigo-500 text-white',
      pink: 'bg-pink-500 text-white'
    };
    return colors[color] || 'bg-gray-500 text-white';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Analytics</h1>
        <p className="text-gray-600">
          Overview of platform usage and statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-lg ${getColorClasses(stat.color)} flex items-center justify-center text-xl`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Verification Rate</h3>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{
                      width: `${overview.total_doctors > 0 ? (Number(overview.verified_doctors) / Number(overview.total_doctors)) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {overview.total_doctors > 0 ? Math.round((Number(overview.verified_doctors) / Number(overview.total_doctors)) * 100) : 0}%
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Platform Activity</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Healthy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemAnalytics;