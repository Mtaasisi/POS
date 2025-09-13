import React from 'react';
import { useAuth } from '../../../../context/AuthContext';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import { Users, Monitor, Package } from 'lucide-react';

const GroupedDevicesTab: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser || !['admin', 'technician'].includes(currentUser.role)) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view grouped device diagnostics.</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Grouped Device Diagnostics</h2>
        <p className="text-gray-600">Diagnostic interface for groups of similar devices</p>
      </div>

      <GlassCard className="p-12 text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Grouped Diagnostic Interface</h3>
        <p className="text-gray-500 mb-4">
          This interface will be available when accessing grouped device diagnostics (devices of the same model) through the diagnostic request workflow.
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Monitor className="w-4 h-4" />
            <span>Batch Testing</span>
          </div>
          <div className="flex items-center space-x-1">
            <Package className="w-4 h-4" />
            <span>Group Management</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default GroupedDevicesTab;
