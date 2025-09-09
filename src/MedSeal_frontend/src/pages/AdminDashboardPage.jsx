// filepath: /root/MedSeal/src/MedSeal_frontend/src/pages/AdminDashboardPage.jsx
import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminDashboard from '../components/admin/AdminDashboard';

function AdminDashboardPage() {
  const { user } = useAuth();
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  return (
    <Routes>
      <Route path="/*" element={
        <AdminDashboard 
          user={user} 
          showAlert={showAlert}
          alert={alert}
        />
      } />
    </Routes>
  );
}

export default AdminDashboardPage;