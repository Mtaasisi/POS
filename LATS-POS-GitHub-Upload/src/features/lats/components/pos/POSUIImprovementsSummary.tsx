// POS UI Improvements Summary Component
// This component shows what improvements were made for customer care users

import React from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { rbacManager, type UserRole } from '../../lib/rbac';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import { CheckCircle, XCircle, Shield, Eye, EyeOff, Settings, BarChart3, Warehouse } from 'lucide-react';

const POSUIImprovementsSummary: React.FC = () => {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role as UserRole;

  if (!currentUser) {
    return (
      <GlassCard className="p-6">
        <div className="text-center text-gray-500">
          Please log in to view improvements
        </div>
      </GlassCard>
    );
  }

  // Check permissions
  const canAccessInventory = rbacManager.can(userRole, 'inventory', 'view');
  const canViewReports = rbacManager.can(userRole, 'reports', 'view');
  const canAccessSettings = rbacManager.can(userRole, 'settings', 'view');
  const canAddProducts = rbacManager.can(userRole, 'products', 'create');

  const improvements = [
    {
      title: 'Navigation Button Visibility',
      description: 'Admin-only navigation buttons are now hidden for customer care users',
      items: [
        { name: 'Unified Inventory', visible: canAccessInventory, icon: <Warehouse className="w-4 h-4" /> },
        { name: 'Sales Reports', visible: canViewReports, icon: <BarChart3 className="w-4 h-4" /> },
        { name: 'Settings Access', visible: canAccessSettings, icon: <Settings className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Product Management',
      description: 'Product creation features are now properly restricted',
      items: [
        { name: 'Add External Product', visible: canAddProducts, icon: <Shield className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Quick Actions',
      description: 'Quick action buttons are now role-based',
      items: [
        { name: 'Add Customer', visible: true, icon: <CheckCircle className="w-4 h-4" /> },
        { name: 'Scan Barcode', visible: true, icon: <CheckCircle className="w-4 h-4" /> },
        { name: 'Add Product', visible: userRole === 'admin', icon: userRole === 'admin' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" /> },
        { name: 'View Sales', visible: userRole === 'admin', icon: userRole === 'admin' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" /> },
      ]
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'customer-care': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'technician': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">POS UI Improvements</h3>
            <p className="text-sm text-gray-600">Enhanced permission-based UI for better user experience</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(userRole)}`}>
            {userRole === 'admin' ? 'Administrator' : 
             userRole === 'customer-care' ? 'Customer Care' : 
             userRole === 'technician' ? 'Technician' : 'User'}
          </div>
        </div>

        {/* Improvements List */}
        <div className="space-y-6">
          {improvements.map((improvement, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <h4 className="text-md font-medium text-gray-900">{improvement.title}</h4>
                <p className="text-sm text-gray-600">{improvement.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {improvement.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      item.visible 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className={`p-1 rounded ${
                      item.visible ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {item.visible ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.visible ? 'Visible' : 'Hidden'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-blue-900 mb-2">UI Improvements Summary</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Navigation buttons are now hidden based on user permissions</li>
                <li>• Settings access is restricted to authorized users only</li>
                <li>• Product creation features are properly gated</li>
                <li>• Quick actions are role-based and contextually relevant</li>
                <li>• Better error handling for restricted features</li>
                <li>• Cleaner, more intuitive interface for customer care users</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default POSUIImprovementsSummary;
