import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserRole } from '../lib/adminUtils';
import GlassCard from '../features/shared/components/ui/GlassCard';
import GlassButton from '../features/shared/components/ui/GlassButton';
import { Shield, User, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminRoleUpdater: React.FC = () => {
  const { currentUser, refreshSession } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [email, setEmail] = useState('xamuelhance10@gmail.com');

  const handleUpdateRole = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsUpdating(true);
    try {
      const success = await updateUserRole(email, 'admin');
      if (success) {
        // Refresh the session to get updated user data
        await refreshSession();
        toast.success('Role updated successfully! Please refresh the page.');
      }
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <GlassCard className="p-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Role Updater</h2>
        <p className="text-gray-600 mb-6">
          Update user role to admin for full system access
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>

          <GlassButton
            onClick={handleUpdateRole}
            disabled={isUpdating}
            className="w-full flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Update to Admin
              </>
            )}
          </GlassButton>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>Current User: {currentUser?.email || 'Not logged in'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <Shield className="w-4 h-4" />
            <span>Current Role: {currentUser?.role || 'Unknown'}</span>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>After updating, refresh the page to see the new role.</p>
        </div>
      </div>
    </GlassCard>
  );
};

export default AdminRoleUpdater;
