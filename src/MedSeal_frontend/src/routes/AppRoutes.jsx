import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DoctorDashboardPage from '../pages/DoctorDashboardPage';
import PatientDashboardPage from '../pages/PatientDashboardPage';

// Protected Route wrapper
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole) {
    const userRole = typeof user.role === 'string' ? user.role : 
                    (user.role?.Doctor !== undefined ? 'Doctor' : 'Patient');
    
    if (userRole !== requiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

// Public Route wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <PublicRoute>
          <PublicLayout>
            <LandingPage />
          </PublicLayout>
        </PublicRoute>
      } />
      
      <Route path="/login" element={
        <PublicRoute>
          <PublicLayout>
            <LoginPage />
          </PublicLayout>
        </PublicRoute>
      } />
      
      <Route path="/register" element={
        <PublicRoute>
          <PublicLayout>
            <RegisterPage />
          </PublicLayout>
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <DashboardRedirect />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/doctor/*" element={
        <ProtectedRoute requiredRole="Doctor">
          <DashboardLayout>
            <DoctorDashboardPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/patient/*" element={
        <ProtectedRoute requiredRole="Patient">
          <DashboardLayout>
            <PatientDashboardPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Helper component to redirect to correct dashboard based on user role
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  const userRole = typeof user.role === 'string' ? user.role : 
                  (user.role?.Doctor !== undefined ? 'Doctor' : 'Patient');
  
  return <Navigate to={userRole === 'Doctor' ? '/doctor' : '/patient'} replace />;
};

export default AppRoutes;
