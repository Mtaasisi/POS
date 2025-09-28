import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import DashboardPage from '../pages/DashboardPage';
import TechnicianDashboardPage from '../pages/TechnicianDashboardPage';
import CustomerCareDashboardPage from '../pages/CustomerCareDashboardPage';

const ConditionalDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  // Show technician dashboard for technicians
  if (currentUser?.role === 'technician') {
    return <TechnicianDashboardPage />;
  }

  // Show customer care dashboard for customer-care users
  if (currentUser?.role === 'customer-care') {
    return <CustomerCareDashboardPage />;
  }

  // Show general dashboard for admin
  return <DashboardPage />;
};

export default ConditionalDashboard;
