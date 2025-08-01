import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Alert from '../components/Alert';

function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const clearAlert = () => {
    setAlert({ type: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} />
      
      {/* Alert container */}
      {alert.message && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert 
            type={alert.type}
            message={alert.message}
            onClose={clearAlert}
            autoClose={alert.type === 'success' || alert.type === 'info'}
          />
        </div>
      )}
      
      {/* Main content */}
      <div>{children}</div>
    </div>
  );
}

export default DashboardLayout;
