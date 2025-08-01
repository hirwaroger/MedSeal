import { useState } from 'react';
import Alert from '../components/Alert';

function PublicLayout({ children }) {
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const clearAlert = () => {
    setAlert({ type: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alert container */}
      {alert.message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
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

export default PublicLayout;
