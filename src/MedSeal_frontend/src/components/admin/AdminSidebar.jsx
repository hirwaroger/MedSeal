import React from 'react';

function AdminSidebar({ activeTab, setActiveTab, sidebarCollapsed, setSidebarCollapsed, user }) {
  const sidebarItems = [
    { id: 'overview', icon: '📊', label: 'Admin Overview' },
    { id: 'doctors', icon: '👨‍⚕️', label: 'Manage Doctors' },
    { id: 'patients', icon: '👥', label: 'Manage Patients' },
    { id: 'verification', icon: '✅', label: 'Doctor Verification' },
    { id: 'system', icon: '⚙️', label: 'System Settings' },
    { id: 'analytics', icon: '📈', label: 'Analytics' }
  ];

  return (
    <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-gradient-to-br from-blue-600 to-blue-700 text-white flex flex-col transition-all duration-300`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-blue-500/30">
        <div className="flex items-center gap-3">
          {/* Replace emoji circle with favicon */}
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
            data-tab={item.id}
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
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;