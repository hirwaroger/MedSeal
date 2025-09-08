import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFavicon } from './useFavicon';

function NGODashboard({ user, showAlert }) {
  useFavicon('/favicon.png');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { authenticatedActor } = useAuth();

  const sidebarItems = [
    { id: 'overview', icon: '📊', label: 'NGO Overview' },
    { id: 'cases', icon: '📋', label: 'Approved Cases' },
    { id: 'pools', icon: '💰', label: 'My Contribution Pools' },
    { id: 'create-pool', icon: '➕', label: 'Create Pool' },
    { id: 'analytics', icon: '📈', label: 'Impact Analytics' },
    { 
      id: 'verification', 
      icon: user.verification_status === 'Approved' ? '✅' : user.verification_status === 'Pending' ? '⏳' : '🔍', 
      label: user.verification_status === 'Approved' ? 'Verified ✓' : 
             user.verification_status === 'Pending' ? 'Verification Pending' : 'Request Verification'
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-gradient-to-br from-green-600 to-green-700 text-white flex flex-col transition-all duration-300`}>
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
                    {user.verification_status === 'Approved' ? '✅ Verified NGO' :
                     user.verification_status === 'Pending' ? '⏳ Pending Verification' :
                     'Not Verified'}
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
                    {user.verification_status === 'Pending' ? '⏳' : user.verification_status === 'Rejected' ? '❌' : '🔍'}
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
                <div className="text-6xl mb-4">🤝</div>
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
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">NGO Verification</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <p className="text-gray-600 mb-4">
                  To create contribution pools and help patients, your NGO must be verified by our administrators.
                </p>
                <p className="text-sm text-gray-500">
                  Please provide your NGO registration documents and verification will be processed within 24-48 hours.
                </p>
                {/* Add NGO verification form here */}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'cases' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Approved Patient Cases</h2>
            {user.verification_status === 'Approved' ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-500 mb-2">No approved cases yet</h3>
                <p className="text-gray-500">Approved patient cases will appear here for pool creation.</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔒</div>
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
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-gray-500 mb-2">No pools created yet</h3>
                <p className="text-gray-500 mb-4">Create your first contribution pool to start helping patients.</p>
                <button
                  onClick={() => setActiveTab('create-pool')}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span className="mr-2">➕</span>
                  Create Pool
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔒</div>
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