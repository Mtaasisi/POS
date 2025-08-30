import React from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  Package, Crown, Users, Settings, Plus, 
  BarChart3, Database, Shield, Bell
} from 'lucide-react';

interface SettingsTabProps {
  setShowCategoryForm: (show: boolean) => void;
  setShowSupplierForm: (show: boolean) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  setShowCategoryForm,
  setShowSupplierForm
}) => {
  return (
    <div className="space-y-6">
      {/* Management Forms */}
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-purple-900">Product Inventory Management</h3>
            <p className="text-sm text-purple-600">Add and manage products, inventory, and stock levels</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setShowCategoryForm(true)}
            className="p-3 bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">New Category</span>
            </div>
            <p className="text-xs text-gray-600">Add category</p>
          </button>



          <button
            onClick={() => setShowSupplierForm(true)}
            className="p-3 bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">New Supplier</span>
            </div>
            <p className="text-xs text-gray-600">Add supplier</p>
          </button>

          <button
            onClick={() => {/* TODO: Add product form */}}
            className="p-3 bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">New Product</span>
            </div>
            <p className="text-xs text-gray-600">Add product</p>
          </button>
        </div>
      </GlassCard>

      {/* System Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">System Settings</h3>
              <p className="text-sm text-blue-600">Configure inventory system preferences</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Low Stock Threshold</p>
                <p className="text-xs text-gray-500">Alert when stock falls below this level</p>
              </div>
              <input
                type="number"
                defaultValue={10}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Reorder Point</p>
                <p className="text-xs text-gray-500">Automatically suggest reorder at this level</p>
              </div>
              <input
                type="number"
                defaultValue={5}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Stock Alerts</p>
                <p className="text-xs text-gray-500">Enable email notifications for low stock</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">Analytics Settings</h3>
              <p className="text-sm text-green-600">Configure reporting and analytics</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto Refresh</p>
                <p className="text-xs text-gray-500">Refresh data every 5 minutes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Export Format</p>
                <p className="text-xs text-gray-500">Default export file format</p>
              </div>
              <select className="px-2 py-1 border border-gray-300 rounded text-sm">
                <option>CSV</option>
                <option>Excel</option>
                <option>PDF</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Dashboard Widgets</p>
                <p className="text-xs text-gray-500">Show quick stats on dashboard</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Data Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Database className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-orange-900">Data Management</h3>
              <p className="text-sm text-orange-600">Backup and restore your inventory data</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <GlassButton
              variant="secondary"
              className="w-full justify-start"
              icon={<Database size={16} />}
            >
              Export All Data
            </GlassButton>
            
            <GlassButton
              variant="secondary"
              className="w-full justify-start"
              icon={<Database size={16} />}
            >
              Import Data
            </GlassButton>
            
            <GlassButton
              variant="secondary"
              className="w-full justify-start"
              icon={<Database size={16} />}
            >
              Backup Database
            </GlassButton>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-red-900">Security & Permissions</h3>
              <p className="text-sm text-red-600">Manage access and security settings</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <GlassButton
              variant="secondary"
              className="w-full justify-start"
              icon={<Shield size={16} />}
            >
              User Permissions
            </GlassButton>
            
            <GlassButton
              variant="secondary"
              className="w-full justify-start"
              icon={<Shield size={16} />}
            >
              Audit Log
            </GlassButton>
            
            <GlassButton
              variant="secondary"
              className="w-full justify-start"
              icon={<Shield size={16} />}
            >
              Security Settings
            </GlassButton>
          </div>
        </GlassCard>
      </div>

      {/* Notifications */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bell className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-purple-900">Notification Settings</h3>
            <p className="text-sm text-purple-600">Configure alerts and notifications</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Low Stock Alerts</p>
                <p className="text-xs text-gray-500">Email notifications for low stock</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Out of Stock Alerts</p>
                <p className="text-xs text-gray-500">Immediate notifications for out of stock</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Weekly Reports</p>
                <p className="text-xs text-gray-500">Automated weekly inventory reports</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">System Updates</p>
                <p className="text-xs text-gray-500">Notifications for system updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Save Settings */}
      <div className="flex justify-end">
        <GlassButton
          className="bg-blue-600 hover:bg-blue-700 text-white"
          icon={<Settings size={16} />}
        >
          Save Settings
        </GlassButton>
      </div>
    </div>
  );
};

export default SettingsTab;
