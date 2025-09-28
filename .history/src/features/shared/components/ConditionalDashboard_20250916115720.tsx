import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import DashboardPage from '../pages/DashboardPage';
import TechnicianDashboardPage from '../pages/TechnicianDashboardPage';

const ConditionalDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  // Show technician dashboard for technicians
  if (currentUser?.role === 'technician') {
    return <TechnicianDashboardPage />;
  }

  // Show general dashboard for admin and customer-care
  return <DashboardPage />;
};

export default ConditionalDashboard;
