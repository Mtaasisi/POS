import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';

export const UserRoleDebug: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <GlassCard className="p-4 mb-4 bg-red-50 border-red-200">
        <h3 className="font-semibold text-red-800">Debug: No User</h3>
        <p className="text-red-600">You are not logged in</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 mb-4 bg-blue-50 border-blue-200">
      <h3 className="font-semibold text-blue-800">Debug: User Info</h3>
      <div className="text-sm text-blue-700 space-y-1">
        <p><strong>Email:</strong> {currentUser.email}</p>
        <p><strong>Role:</strong> {currentUser.role}</p>
        <p><strong>Name:</strong> {currentUser.name || 'N/A'}</p>
        <p><strong>Active:</strong> {currentUser.isActive ? 'Yes' : 'No'}</p>
        <p><strong>Permissions:</strong> {currentUser.permissions?.join(', ') || 'None'}</p>
      </div>
    </GlassCard>
  );
};
