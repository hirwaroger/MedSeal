import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFavicon } from './useFavicon';
import NGOVerificationForm from './ngo/NGOVerificationForm';

function NGODashboard({ user, showAlert }) {
  useFavicon('/favicon.png');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [approvedCases, setApprovedCases] = useState([]);
  const [myPools, setMyPools] = useState([]);
  const [loading, setLoading] = useState(false);

  const { authenticatedActor } = useAuth();

  useEffect(() => {
    if (user.verification_status === 'Approved' && authenticatedActor) {
      loadApprovedCases();
      loadMyPools();
    }
  }, [user.verification_status, authenticatedActor]);

  const loadApprovedCases = async () => {
    try {
      const result = await authenticatedActor.get_approved_patient_cases();
      if ('Ok' in result) {
        setApprovedCases(result.Ok);
      }
    } catch (error) {
      console.error('Error loading approved cases:', error);
    }
  };

  const loadMyPools = async () => {
    try {
      const result = await authenticatedActor.get_ngo_contribution_pools(user.id);
      if ('Ok' in result) {
        setMyPools(result.Ok);
      }
    } catch (error) {
      console.error('Error loading my pools:', error);
    }
  };

  const sidebarItems = [
    { id: 'overview', icon: <i className="fa-solid fa-chart-pie" aria-hidden="true" />, label: 'NGO Overview' },
    { id: 'cases', icon: <i className="fa-solid fa-clipboard-list" aria-hidden="true" />, label: 'Approved Cases' },
    { id: 'pools', icon: <i className="fa-solid fa-coins" aria-hidden="true" />, label: 'My Contribution Pools' },
    { id: 'create-pool', icon: <i className="fa-solid fa-plus" aria-hidden="true" />, label: 'Create Pool' },
    { id: 'analytics', icon: <i className="fa-solid fa-chart-line" aria-hidden="true" />, label: 'Impact Analytics' },
    {
      id: 'verification',
      icon: user.verification_status === 'Approved' ? <i className="fa-solid fa-check-circle" aria-hidden="true" /> : user.verification_status === 'Pending' ? <i className="fa-solid fa-hourglass-half" aria-hidden="true" /> : <i className="fa-solid fa-search" aria-hidden="true" />,
      label: user.verification_status === 'Approved' ? 'Verified ✓' :
             user.verification_status === 'Pending' ? 'Verification Pending' : 'Request Verification'
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-gradient-to-br from-blue-600 to-blue-700 text-white flex flex-col transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-green-500/30">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="MedSeal"
              className="w-10 h-10 rounded-full bg-white/80 p-1 object-contain ring-2 ring-white/20"
              onError={(e)=>{e.currentTarget.style.display='none';}}
            />
            {!sidebarCollapsed && (
              <div>
                <h2 className="font-semibold">{user.name} NGO</h2>
                <p className="text-sm text-green-100">Healthcare Partner</p>
                {user.verification_status && (
                  <p className={`text-xs mt-1 ${
                    user.verification_status === 'Approved' ? 'text-green-200' :
                    user.verification_status === 'Pending' ? 'text-yellow-200' :
                    'text-green-200'
                  }`}>
                    {user.verification_status === 'Approved' ? <><i className="fa-solid fa-check-circle mr-1" /> Verified NGO</> :
                     user.verification_status === 'Pending' ? <><i className="fa-solid fa-hourglass-half mr-1" /> Pending Verification</> : 'Not Verified'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-white/20 text-white'
                  : 'text-green-100 hover:bg-white/10 hover:text-white'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="text-xl">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </div>
        
        {/* Toggle Button */}
        <div className="p-4 border-t border-green-500/30">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full text-white hover:bg-white/20 rounded p-2 transition-colors"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Verification status banner */}
            {user.verification_status !== 'Approved' && (
              <div className="mb-6">
                <div className={`rounded-lg border p-4 flex items-start gap-3 shadow-sm ${
                  user.verification_status === 'Pending' ? 'bg-yellow-50 border-yellow-300' :
                  user.verification_status === 'Rejected' ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'
                }`}>
                  <span className="text-2xl">
                    {user.verification_status === 'Pending' ? <i className="fa-solid fa-hourglass-half" aria-hidden="true" /> : user.verification_status === 'Rejected' ? <i className="fa-solid fa-xmark" aria-hidden="true" /> : <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {user.verification_status === 'Pending' && 'Your NGO verification is under review'}
                      {user.verification_status === 'Rejected' && 'Your NGO verification was rejected'}
                      {!user.verification_status && 'Complete NGO verification to start helping patients'}
                    </h3>
                    {user.verification_status === 'Rejected' && user.verification_request?.admin_notes && (
                      <p className="text-sm text-red-700 mb-1">
                        Reason: {user.verification_request.admin_notes}
                      </p>
                    )}
                    {user.verification_status !== 'Pending' && (
                      <button
                        onClick={() => setActiveTab('verification')}
                        className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
                      >
                        {user.verification_status === 'Rejected' ? 'Resubmit verification →' : 'Submit verification →'}
                      </button>
                    )}
                    {user.verification_status === 'Pending' && (
                      <p className="text-sm text-yellow-800">You will be notified once an admin reviews your request.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <h1 className="text-3xl font-bold text-gray-900 mb-6">NGO Dashboard</h1>
            
            {user.verification_status === 'Approved' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Pools</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Raised</p>
                      <p className="text-2xl font-bold text-gray-900">$0</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <span className="text-2xl">🎯</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Patients Helped</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <span className="text-2xl">❤️</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  <i className="fa-solid fa-chart-pie" aria-hidden="true"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-500 mb-2">
                  Welcome to MedSeal NGO Platform
                </h3>
                <p className="text-gray-500 mb-6">
                  Complete verification to start creating contribution pools and helping patients in need.
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'verification' && (
          <div className="p-6">
            <NGOVerificationForm existingRequest={user.verification_request} />
          </div>
        )}
        
        {activeTab === 'cases' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Approved Patient Cases</h2>
            {user.verification_status === 'Approved' ? (
              approvedCases.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {approvedCases.map(case_ => (
                    <div key={case_.id} className="bg-white p-6 rounded-lg shadow-sm border">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{case_.case_title}</h3>
                          <p className="text-sm text-gray-600">Patient: {case_.patient_name}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          case_.urgency_level.Critical ? 'bg-red-100 text-red-800' :
                          case_.urgency_level.High ? 'bg-orange-100 text-orange-800' :
                          case_.urgency_level.Medium ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {Object.keys(case_.urgency_level)[0]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{case_.medical_condition}</p>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{case_.case_description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-green-600">
                          ${(case_.required_amount / 100).toFixed(2)}
                        </span>
                        <button
                          onClick={() => setActiveTab('create-pool')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Create Pool
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">
                    <i className="fa-solid fa-clipboard-list" aria-hidden="true"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">No approved cases yet</h3>
                  <p className="text-gray-500">Approved patient cases will appear here for pool creation.</p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4"><i className="fa-solid fa-lock" aria-hidden="true" /></div>
                <h3 className="text-xl font-semibold text-gray-500 mb-2">Verification Required</h3>
                <p className="text-gray-500">Complete NGO verification to view patient cases.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'pools' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Contribution Pools</h2>
            {user.verification_status === 'Approved' ? (
              myPools.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {myPools.map(pool => (
                    <div key={pool.id} className="bg-white p-6 rounded-lg shadow-sm border">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{pool.pool_title}</h3>
                          <p className="text-sm text-gray-600">Created: {new Date(Number(pool.created_at)).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          pool.is_completed ? 'bg-green-100 text-green-800' :
                          pool.is_active ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pool.is_completed ? 'Completed' : pool.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{pool.pool_description}</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Progress:</span>
                          <span>{Math.round((pool.current_amount / pool.target_amount) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{width: `${Math.min((pool.current_amount / pool.target_amount) * 100, 100)}%`}}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>${(pool.current_amount / 100).toFixed(2)} raised</span>
                          <span>${(pool.target_amount / 100).toFixed(2)} goal</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{Number(pool.contributors_count)} contributors</span>
                        {pool.deadline && (
                          <span>Ends: {new Date(Number(pool.deadline)).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">
                    <i className="fa-solid fa-coins" aria-hidden="true"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">No pools created yet</h3>
                  <p className="text-gray-500 mb-4">Create your first contribution pool to start helping patients.</p>
                  <button
                    onClick={() => setActiveTab('create-pool')}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <span className="mr-2">
                      <i className="fa-solid fa-plus" aria-hidden="true"></i>
                    </span>
                    Create Pool
                  </button>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4"><i className="fa-solid fa-lock" aria-hidden="true" /></div>
                <h3 className="text-xl font-semibold text-gray-500 mb-2">Verification Required</h3>
                <p className="text-gray-500">Complete NGO verification to create contribution pools.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default NGODashboard;