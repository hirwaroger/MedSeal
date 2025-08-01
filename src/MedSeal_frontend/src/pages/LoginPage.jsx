import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Login from '../components/Login';

function LoginPage() {
  const { login, loading } = useAuth();
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    setAlert({ 
      type: result.success ? 'success' : 'error', 
      message: result.message 
    });
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  return (
    <Login 
      onLogin={handleLogin}
      onSwitchToRegister={() => {}} // Not used since we're using Link in Login component
      loading={loading}
      showAlert={showAlert}
      alert={alert}
    />
  );
}

export default LoginPage;
