import { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

// Components
import Login from './components/Login';
import Register from './components/Register';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';
import Navbar from './components/Navbar';
import Alert from './components/Alert';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'dashboard'
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const clearAlert = () => {
    setAlert({ type: '', message: '' });
  };

  const handleLogin = async (email, password) => {
    clearAlert();
    setLoading(true);
    
    try {
      console.log('Attempting login for:', email);
      const result = await MedSeal_backend.authenticate_user(email, password);
      console.log('Login result:', result);
      
      if ('Ok' in result) {
        setCurrentUser(result.Ok);
        setCurrentView('dashboard');
        showAlert('success', `Welcome back, ${result.Ok.name}!`);
      } else {
        showAlert('error', 'Login failed: ' + result.Err);
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('error', 'Login error: ' + error.message);
    }
    setLoading(false);
  };

  const handleRegister = async (userData) => {
    clearAlert();
    setLoading(true);
    
    try {
      // Format the request data according to the Candid interface
      const registrationData = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        license_number: userData.license_number || "" // Send empty string for patients
      };

      console.log('Sending registration data:', registrationData);

      const result = await MedSeal_backend.register_user(registrationData);
      console.log('Registration result:', result);
      
      if ('Ok' in result) {
        setCurrentUser(result.Ok);
        setCurrentView('dashboard');
        showAlert('success', `Registration successful! Welcome to MedSeal, ${result.Ok.name}!`);
      } else {
        showAlert('error', 'Registration failed: ' + result.Err);
      }
    } catch (error) {
      console.error('Registration error details:', error);
      showAlert('error', 'Registration error: ' + error.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    clearAlert();
    showAlert('info', 'You have been logged out successfully.');
  };

  const renderCurrentView = () => {
    if (currentView === 'register') {
      return (
        <Register 
          onRegister={handleRegister}
          onSwitchToLogin={() => {
            setCurrentView('login');
            clearAlert();
          }}
          loading={loading}
          showAlert={showAlert}
        />
      );
    }
    
    if (currentView === 'login') {
      return (
        <Login 
          onLogin={handleLogin}
          onSwitchToRegister={() => {
            setCurrentView('register');
            clearAlert();
          }}
          loading={loading}
          showAlert={showAlert}
        />
      );
    }
    
    if (currentView === 'dashboard' && currentUser) {
      // Debug log to see the user role structure
      console.log('Current user role:', currentUser.role);
      
      // Check if user role is Doctor (handle both possible structures)
      const isDoctor = currentUser.role === 'Doctor' || 
                      (typeof currentUser.role === 'object' && currentUser.role.Doctor !== undefined) ||
                      currentUser.role.Doctor === null;
      
      return isDoctor ? 
        <DoctorDashboard user={currentUser} showAlert={showAlert} /> : 
        <PatientDashboard user={currentUser} showAlert={showAlert} />;
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
        {/* Global Alert */}
        {alert.message && (
          <div className="row">
            <div className="col-12">
              <Alert 
                type={alert.type}
                message={alert.message}
                onClose={clearAlert}
                autoClose={alert.type === 'success'}
              />
            </div>
          </div>
        )}
        
        {renderCurrentView()}
      </div>
    </div>
  );
}

export default App;
