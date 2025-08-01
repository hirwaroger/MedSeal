import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Register from '../components/Register';

function RegisterPage() {
  const { register, loading } = useAuth();
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleRegister = async (userData) => {
    const result = await register(userData);
    setAlert({ 
      type: result.success ? 'success' : 'error', 
      message: result.message 
    });
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  return (
    <Register 
      onRegister={handleRegister}
      onSwitchToLogin={() => {}} // Not used since we're using Link
      loading={loading}
      showAlert={showAlert}
      alert={alert}
    />
  );
}

export default RegisterPage;
