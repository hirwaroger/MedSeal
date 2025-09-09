import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DoctorVerification from './DoctorVerification';
import UserManagement from './UserManagement';
import SystemAnalytics from './SystemAnalytics';
import NGOVerificationManagement from './NGOVerificationManagement';
import PatientCaseManagement from './PatientCaseManagement';
import { useFavicon } from '../useFavicon';

function AdminDashboard({ user, showAlert }) {
  useFavicon('/favicon.png');
  const [activeTab, setActiveTab] = useState('overview');

  const { logout } = useAuth();

  const sidebarItems = [
    { id: 'overview', icon: <i className="fa-solid fa-chart-pie"></i>, label: 'Overview' },
    { id: 'users', icon: <i className="fa-solid fa-users"></i>, label: 'User Management' },
    { id: 'doctor-verification', icon: <i className="fa-solid fa-user-doctor"></i>, label: 'Doctor Verification' },
    { id: 'ngo-verification', icon: <i className="fa-solid fa-handshake"></i>, label: 'NGO Verification' },
    { id: 'patient-cases', icon: <i className="fa-solid fa-clipboard-list"></i>, label: 'Patient Cases' },
    { id: 'analytics', icon: <i className="fa-solid fa-chart-line"></i>, label: 'System Analytics' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-gradient-to-br from-blue-600 to-blue-700 text-white flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="MedSeal"
              className="w-10 h-10 rounded-full bg-white/80 p-1 object-contain ring-2 ring-white/30"
              onError={(e)=>{e.currentTarget.style.display='none';}}
            />
            <div>
              <h2 className="font-semibold">{user.name}</h2>
              <p className="text-sm text-purple-100">System Administrator</p>
            </div>
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
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
        
        {/* Logout */}
        <div className="p-4 border-t border-purple-500/30">
          <button 
            onClick={logout}
            className="w-full text-white hover:bg-white/20 rounded p-2 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
            <SystemAnalytics />
          </div>
        )}
        
        {activeTab === 'users' && (
          <div className="p-6">
            <UserManagement showAlert={showAlert} />
          </div>
        )}
        
        {activeTab === 'doctor-verification' && (
          <div className="p-6">
            <DoctorVerification showAlert={showAlert} />
          </div>
        )}
        
        {activeTab === 'ngo-verification' && (
          <div className="p-6">
            <NGOVerificationManagement showAlert={showAlert} />
          </div>
        )}
        
        {activeTab === 'patient-cases' && (
          <div className="p-6">
            <PatientCaseManagement showAlert={showAlert} />
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="p-6">
            <SystemAnalytics />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;