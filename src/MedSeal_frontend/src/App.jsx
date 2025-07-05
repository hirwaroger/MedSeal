import { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

// Components
import Login from './components/Login';
import Register from './components/Register';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';
import Navbar from './components/Navbar';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'dashboard'
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const result = await MedSeal_backend.authenticate_user(email, password);
      if ('Ok' in result) {
        setCurrentUser(result.Ok);
        setCurrentView('dashboard');
      } else {
        alert('Login failed: ' + result.Err);
      }
    } catch (error) {
      alert('Login error: ' + error.message);
    }
    setLoading(false);
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    try {
      const result = await MedSeal_backend.register_user(userData);
      if ('Ok' in result) {
        setCurrentUser(result.Ok);
        setCurrentView('dashboard');
        alert('Registration successful!');
      } else {
        alert('Registration failed: ' + result.Err);
      }
    } catch (error) {
      alert('Registration error: ' + error.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  const renderCurrentView = () => {
    if (currentView === 'register') {
      return (
        <Register 
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentView('login')}
          loading={loading}
        />
      );
    }
    
    if (currentView === 'login') {
      return (
        <Login 
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentView('register')}
          loading={loading}
        />
      );
    }
    
    if (currentView === 'dashboard' && currentUser) {
      return currentUser.role.Doctor ? 
        <DoctorDashboard user={currentUser} /> : 
        <PatientDashboard user={currentUser} />;
    }
    
    return null;
  };

  return (
    <div className="min-vh-100 bg-light">
      {currentUser && (
        <Navbar 
          user={currentUser} 
          onLogout={handleLogout}
        />
      )}
      
      <div className="container-fluid">
        {renderCurrentView()}
      </div>
    </div>
  );
}

export default App;
