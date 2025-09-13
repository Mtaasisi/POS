// POS Permission Test Component
// This component demonstrates the permission-based features for customer care users

import React from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { rbacManager, type UserRole } from '../../lib/rbac';
import GlassCard from '../../../../shared/components/ui/GlassCard';
import { Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const POSPermissionTest: React.FC = () => {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role as UserRole;

  if (!currentUser) {
    return (
      <GlassCard className="p-6">
        <div className="text-center text-gray-500">
          Please log in to view permissions
        </div>
      </GlassCard>
    );
  }

  // Test all POS permissions
  const permissions = [
    { name: 'View POS', resource: 'pos', action: 'view' },
    { name: 'Process Sales', resource: 'pos', action: 'sell' },
    { name: 'Process Refunds', resource: 'pos', action: 'refund' },
    { name: 'Void Transactions', resource: 'pos', action: 'void' },
    { name: 'View Inventory', resource: 'pos-inventory', action: 'view' },
    { name: 'Search Inventory', resource: 'pos-inventory', action: 'search' },
    { name: 'Add to Cart', resource: 'pos-inventory', action: 'add-to-cart' },
    { name: 'View Sales', resource: 'sales', action: 'view' },
    { name: 'Create Sales', resource: 'sales', action: 'create' },
    { name: 'Edit Sales', resource: 'sales', action: 'edit' },
    { name: 'Delete Sales', resource: 'sales', action: 'delete' },
    { name: 'Refund Sales', resource: 'sales', action: 'refund' },
  ];

  const hasPermission = (resource: string, action: string) => {
    return rbacManager.can(userRole, resource, action);
  };

  const getPermissionIcon = (hasAccess: boolean) => {
    if (hasAccess) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'customer-care': return 'bg-blue-100 text-blue-800';
      case 'technician': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="space-y-6">
        {/* User Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">POS Permissions Test</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(userRole)}`}>
            {userRole === 'admin' ? 'Administrator' : 
             userRole === 'customer-care' ? 'Customer Care' : 
             userRole === 'technician' ? 'Technician' : 'User'}
          </div>
        </div>

        {/* User Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">User:</span>
              <span className="ml-2 text-gray-900">{currentUser.name || currentUser.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Role:</span>
              <span className="ml-2 text-gray-900">{userRole}</span>
            </div>
          </div>
        </div>

        {/* Permissions Grid */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Permission Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {permissions.map((permission, index) => {
              const hasAccess = hasPermission(permission.resource, permission.action);
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    hasAccess 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {getPermissionIcon(hasAccess)}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {permission.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {permission.resource}.{permission.action}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Care Specific Info */}
        {userRole === 'customer-care' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-blue-900 mb-2">Customer Care Access</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Can process sales and manage customers</li>
                  <li>• Can view and search inventory</li>
                  <li>• Cannot process refunds or void transactions</li>
                  <li>• Cannot edit or delete sales records</li>
                  <li>• Limited inventory management capabilities</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Admin Specific Info */}
        {userRole === 'admin' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-red-900 mb-2">Administrator Access</h5>
                <p className="text-sm text-red-700">
                  Full access to all POS features including refunds, voids, and inventory management.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default POSPermissionTest;
