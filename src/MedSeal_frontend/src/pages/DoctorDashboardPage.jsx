import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import DoctorDashboard from '../components/DoctorDashboard';

function DoctorDashboardPage() {
  const { user } = useAuth();
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  return (
    <Routes>
      <Route path="/*" element={
        <DoctorDashboard 
          user={user} 
          showAlert={showAlert}
          alert={alert}
        />
      } />
    </Routes>
  );
}

export default DoctorDashboardPage;
