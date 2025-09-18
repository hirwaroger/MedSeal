import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFavicon } from '../useFavicon';
import AdminSidebar from './AdminSidebar';
import AdminOverview from './AdminOverview';
import DoctorManagement from './DoctorManagement';
import PatientManagement from './PatientManagement';
import VerificationManagement from './VerificationManagement';
import SystemAnalytics from './SystemAnalytics';
import PatientCaseManagement from './PatientCaseManagement';

function AdminDashboard({ user, showAlert }) {
  useFavicon('/favicon.png');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { authenticatedActor } = useAuth();

  const sidebarItems = [
    { id: 'overview', icon: <i className="fa-solid fa-chart-pie"></i>, label: 'Admin Overview' },
    { id: 'doctors', icon: <i className="fa-solid fa-user-doctor"></i>, label: 'Manage Doctors' },
    { id: 'patients', icon: <i className="fa-solid fa-users"></i>, label: 'Manage Patients' },
    { id: 'verification', icon: <i className="fa-solid fa-shield-check"></i>, label: 'Verifications' },
    { id: 'patient-cases', icon: <i className="fa-solid fa-heart"></i>, label: 'Patient Cases' },
    { id: 'analytics', icon: <i className="fa-solid fa-chart-line"></i>, label: 'System Analytics' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-gradient-to-br from-blue-600 to-blue-700 text-white flex flex-col transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-blue-500/30">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="MedSeal"
              className="w-10 h-10 rounded-full bg-white/80 p-1 object-contain ring-2 ring-white/20"
              onError={(e)=>{e.currentTarget.style.display='none';}}
            />
            {!sidebarCollapsed && (
              <div>
                <h2 className="font-semibold">Admin {user.name}</h2>
                <p className="text-sm text-blue-100">System Administrator</p>
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
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
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
        <div className="p-4 border-t border-blue-500/30">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full text-white hover:bg-white/20 rounded p-2 transition-colors"
          >
            {sidebarCollapsed ? <i className="fa-solid fa-arrow-right"></i> : <i className="fa-solid fa-arrow-left"></i>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'doctors' && <DoctorManagement />}
        {activeTab === 'patients' && <PatientManagement />}
        {activeTab === 'verification' && <VerificationManagement />}
        {activeTab === 'patient-cases' && <PatientCaseManagement />}
        {activeTab === 'analytics' && <SystemAnalytics />}
      </div>
    </div>
  );
}

export default AdminDashboard;