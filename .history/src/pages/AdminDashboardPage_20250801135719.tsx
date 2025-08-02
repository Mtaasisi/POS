import React from 'react';
import { Toaster } from 'react-hot-toast';
import AdminDashboard from '../components/admin-dashboard/AdminDashboard';

const AdminDashboardPage: React.FC = () => {
  return (
    <div>
      <Toaster position="top-right" />
      <AdminDashboard />
    </div>
  );
};

export default AdminDashboardPage; 