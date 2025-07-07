import { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';
import { sessionUtils } from './utils/session';

// Components
import Login from './components/Login';
import Register from './components/Register';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';
import Navbar from './components/Navbar';
import Alert from './components/Alert';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Load session on app start
  useEffect(() => {
    console.log('App mounted, loading session...');
    loadSession();
  }, []);

  // Add activity listeners when user is logged in
  useEffect(() => {
    if (currentUser) {
      const handleActivity = () => {
        sessionUtils.updateActivity();
      };

      window.addEventListener('mousedown', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('scroll', handleActivity);
      
      return () => {
        window.removeEventListener('mousedown', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('scroll', handleActivity);
      };
    }
  }, [currentUser]);

  const loadSession = () => {
    console.log('Loading session from localStorage...');
    try {
      const session = sessionUtils.loadSession();
      
      if (session) {
        console.log('Valid session found:', session.user);
        setCurrentUser(session.user);
        setCurrentView('dashboard');
        showAlert('info', `Welcome back, ${session.user.name}!`);
      } else {
        console.log('No valid session found, showing login');
        setCurrentView('login');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      sessionUtils.clearSession();
      setCurrentView('login');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    console.log('Showing alert:', type, message);
    setAlert({ type, message });
  };

  const clearAlert = () => {
    setAlert({ type: '', message: '' });
  };

  const handleLogin = async (email, password) => {
    console.log('Login attempt started for:', email);
    clearAlert();
    setLoading(true);
    
    try {
      const result = await MedSeal_backend.authenticate_user(email, password);
      console.log('Backend authentication result:', result);
      
      if ('Ok' in result) {
        const user = result.Ok;
        console.log('Login successful, user data:', user);
        
        // Set user and view first
        setCurrentUser(user);
        setCurrentView('dashboard');
        
        // Save session
        const sessionSaved = sessionUtils.saveSession(user, 'dashboard');
        console.log('Session saved:', sessionSaved);
        
        showAlert('success', `Welcome back, ${user.name}!`);
        
        // Force a re-render by logging the state
        console.log('After login - currentUser:', user);
        console.log('After login - currentView:', 'dashboard');
        
      } else {
        console.error('Login failed with error:', result.Err);
        showAlert('error', 'Login failed: ' + result.Err);
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('error', 'Login error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    console.log('Registration attempt started for:', userData.email);
    clearAlert();
    setLoading(true);
    
    try {
      const registrationData = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        license_number: userData.license_number || ""
      };

      console.log('Sending registration data:', registrationData);

      const result = await MedSeal_backend.register_user(registrationData);
      console.log('Backend registration result:', result);
      
      if ('Ok' in result) {
        const user = result.Ok;
        console.log('Registration successful, user data:', user);
        
        // Set user and view first
        setCurrentUser(user);
        setCurrentView('dashboard');
        
        // Save session
        const sessionSaved = sessionUtils.saveSession(user, 'dashboard');
        console.log('Session saved:', sessionSaved);
        
        showAlert('success', `Registration successful! Welcome to MedSeal, ${user.name}!`);
        
      } else {
        console.error('Registration failed with error:', result.Err);
        showAlert('error', 'Registration failed: ' + result.Err);
      }
    } catch (error) {
      console.error('Registration error:', error);
      showAlert('error', 'Registration error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('Logout initiated');
    setCurrentUser(null);
    setCurrentView('login');
    sessionUtils.clearSession();
    clearAlert();
    showAlert('info', 'You have been logged out successfully.');
  };

  const switchView = (view) => {
    console.log('Switching view to:', view);
    setCurrentView(view);
    clearAlert();
    if (currentUser) {
      sessionUtils.saveSession(currentUser, view);
    }
  };

  const renderCurrentView = () => {
    console.log('Rendering view. currentView:', currentView, 'currentUser:', currentUser?.name || 'null');
    
    // Always check currentUser state first
    if (currentUser && currentView === 'dashboard') {
      console.log('User logged in, rendering dashboard');
      console.log('User role:', currentUser.role);
      
      // Check if user role is Doctor
      const isDoctor = currentUser.role === 'Doctor' || 
                      (typeof currentUser.role === 'object' && 'Doctor' in currentUser.role);
      
      console.log('Is doctor:', isDoctor);
      
      if (isDoctor) {
        return <DoctorDashboard user={currentUser} showAlert={showAlert} />;
      } else {
        return <PatientDashboard user={currentUser} showAlert={showAlert} />;
      }
    }
    
    if (currentView === 'register') {
      console.log('Rendering registration form');
      return (
        <Register 
          onRegister={handleRegister}
          onSwitchToLogin={() => switchView('login')}
          loading={loading}
          showAlert={showAlert}
        />
      );
    }
    
    // Default to login
    console.log('Rendering login form');
    return (
      <Login 
        onLogin={handleLogin}
        onSwitchToRegister={() => switchView('register')}
        loading={loading}
        showAlert={showAlert}
      />
    );
  };

  // Show loading spinner while checking for existing session
  if (loading) {
    console.log('Showing loading spinner');
    return (
      <div className="min-vh-100 bg-light d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading MedSeal...</h5>
          <p className="text-muted">Checking for existing session</p>
        </div>
      </div>
    );
  }

  console.log('Rendering main app. User:', currentUser?.name || 'null', 'View:', currentView);

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
                autoClose={alert.type === 'success' || alert.type === 'info'}
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