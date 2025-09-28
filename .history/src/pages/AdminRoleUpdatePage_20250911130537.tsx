import React from 'react';
import AdminRoleUpdater from '../components/AdminRoleUpdater';
import { BackButton } from '../features/shared/components/ui/BackButton';

const AdminRoleUpdatePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton to="/dashboard" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Role Management</h1>
          <p className="text-gray-600">
            Update user roles to grant admin access to the system
          </p>
        </div>

        <AdminRoleUpdater />
      </div>
    </div>
  );
};

export default AdminRoleUpdatePage;
