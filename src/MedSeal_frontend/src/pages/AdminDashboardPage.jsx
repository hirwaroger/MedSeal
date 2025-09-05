// filepath: /root/MedSeal/src/MedSeal_frontend/src/pages/AdminDashboardPage.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

// Admin Components
import AdminOverview from '../components/admin/AdminOverview';
import DoctorManagement from '../components/admin/DoctorManagement';
import VerificationManagement from '../components/admin/VerificationManagement';
import PatientManagement from '../components/admin/PatientManagement';

function AdminDashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check if user is admin
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const navigation = [
    { name: 'Overview', href: '/admin', icon: 'fa-chart-line' },
    { name: 'Doctors', href: '/admin/doctors', icon: 'fa-user-doctor' },
    { name: 'Verification', href: '/admin/verification', icon: 'fa-shield-check' },
    { name: 'Patients', href: '/admin/patients', icon: 'fa-users' },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-shield-halved text-white text-sm"></i>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-xs text-gray-600">System Management</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i className={`fa-solid ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-gray-600`}></i>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-red-50 text-red-700 border-r-2 border-red-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <i className={`fa-solid ${item.icon} ${sidebarCollapsed ? 'text-base' : 'mr-3'}`}></i>
              {!sidebarCollapsed && item.name}
            </a>
          ))}
        </nav>

        {/* User info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-user-shield text-red-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-600">System Administrator</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/doctors" element={<DoctorManagement />} />
          <Route path="/verification" element={<VerificationManagement />} />
          <Route path="/verification/:verificationId" element={<VerificationManagement />} />
          <Route path="/patients" element={<PatientManagement />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminDashboardPage;