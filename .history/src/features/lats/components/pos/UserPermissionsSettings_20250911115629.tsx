// User Permissions Settings Component for POS
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Shield, Users, Settings, Save, RefreshCw, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserPermissionsSettings {
  // General Permissions
  canAccessPOS: boolean;
  canProcessSales: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  
  // Inventory Permissions
  canViewInventory: boolean;
  canAddProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canAdjustStock: boolean;
  canViewStockHistory: boolean;
  
  // Customer Permissions
  canViewCustomers: boolean;
  canAddCustomers: boolean;
  canEditCustomers: boolean;
  canDeleteCustomers: boolean;
  canViewCustomerHistory: boolean;
  
  // Financial Permissions
  canProcessRefunds: boolean;
  canViewFinancialReports: boolean;
  canManagePricing: boolean;
  canApplyDiscounts: boolean;
  canViewSalesHistory: boolean;
  
  // System Permissions
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewAuditLogs: boolean;
  canBackupData: boolean;
  canRestoreData: boolean;
  
  // Security Settings
  requirePasswordForRefunds: boolean;
  requireApprovalForLargeSales: boolean;
  largeSaleThreshold: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  
  // Role-based Access
  roles: Array<{
    id: string;
    name: string;
    permissions: string[];
    enabled: boolean;
  }>;
}

const UserPermissionsSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<UserPermissionsSettings>({
    defaultValues: {
      canAccessPOS: true,
      canProcessSales: true,
      canViewReports: true,
      canManageSettings: false,
      canViewInventory: false,
      canAddProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canAdjustStock: false,
      canViewStockHistory: true,
      canViewCustomers: true,
      canAddCustomers: true,
      canEditCustomers: true,
      canDeleteCustomers: false,
      canViewCustomerHistory: true,
      canProcessRefunds: false,
      canViewFinancialReports: false,
      canManagePricing: false,
      canApplyDiscounts: true,
      canViewSalesHistory: true,
      canManageUsers: false,
      canManageRoles: false,
      canViewAuditLogs: false,
      canBackupData: false,
      canRestoreData: false,
      requirePasswordForRefunds: true,
      requireApprovalForLargeSales: true,
      largeSaleThreshold: 100000,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      roles: [
        {
          id: '1',
          name: 'Cashier',
          permissions: ['canAccessPOS', 'canProcessSales', 'canViewCustomers', 'canAddCustomers', 'canApplyDiscounts'],
          enabled: true
        },
        {
          id: '2',
          name: 'Manager',
          permissions: ['canAccessPOS', 'canProcessSales', 'canViewReports', 'canViewInventory', 'canAddProducts', 'canEditProducts', 'canAdjustStock', 'canViewStockHistory', 'canViewCustomers', 'canAddCustomers', 'canEditCustomers', 'canViewCustomerHistory', 'canProcessRefunds', 'canViewFinancialReports', 'canApplyDiscounts', 'canViewSalesHistory'],
          enabled: true
        },
        {
          id: '3',
          name: 'Admin',
          permissions: ['canAccessPOS', 'canProcessSales', 'canViewReports', 'canManageSettings', 'canViewInventory', 'canAddProducts', 'canEditProducts', 'canDeleteProducts', 'canAdjustStock', 'canViewStockHistory', 'canViewCustomers', 'canAddCustomers', 'canEditCustomers', 'canDeleteCustomers', 'canViewCustomerHistory', 'canProcessRefunds', 'canViewFinancialReports', 'canManagePricing', 'canApplyDiscounts', 'canViewSalesHistory', 'canManageUsers', 'canManageRoles', 'canViewAuditLogs', 'canBackupData', 'canRestoreData'],
          enabled: true
        }
      ]
    }
  });

  const watchedValues = watch();

  // Load current settings
  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    setIsLoading(true);
    try {
      const savedSettings = localStorage.getItem('lats-user-permissions-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        reset(settings);
      }
    } catch (error) {
      console.error('Error loading user permissions settings:', error);
      toast.error('Failed to load user permissions settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = async (data: UserPermissionsSettings) => {
    setIsSaving(true);
    try {
      localStorage.setItem('lats-user-permissions-settings', JSON.stringify(data));
      toast.success('User permissions settings saved successfully');
    } catch (error) {
      console.error('Error saving user permissions settings:', error);
      toast.error('Failed to save user permissions settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    reset({
      canAccessPOS: true,
      canProcessSales: true,
      canViewReports: true,
      canManageSettings: false,
      canViewInventory: false,
      canAddProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canAdjustStock: false,
      canViewStockHistory: true,
      canViewCustomers: true,
      canAddCustomers: true,
      canEditCustomers: true,
      canDeleteCustomers: false,
      canViewCustomerHistory: true,
      canProcessRefunds: false,
      canViewFinancialReports: false,
      canManagePricing: false,
      canApplyDiscounts: true,
      canViewSalesHistory: true,
      canManageUsers: false,
      canManageRoles: false,
      canViewAuditLogs: false,
      canBackupData: false,
      canRestoreData: false,
      requirePasswordForRefunds: true,
      requireApprovalForLargeSales: true,
      largeSaleThreshold: 100000,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      roles: [
        {
          id: '1',
          name: 'Cashier',
          permissions: ['canAccessPOS', 'canProcessSales', 'canViewCustomers', 'canAddCustomers', 'canApplyDiscounts'],
          enabled: true
        },
        {
          id: '2',
          name: 'Manager',
          permissions: ['canAccessPOS', 'canProcessSales', 'canViewReports', 'canViewInventory', 'canAddProducts', 'canEditProducts', 'canAdjustStock', 'canViewStockHistory', 'canViewCustomers', 'canAddCustomers', 'canEditCustomers', 'canViewCustomerHistory', 'canProcessRefunds', 'canViewFinancialReports', 'canApplyDiscounts', 'canViewSalesHistory'],
          enabled: true
        },
        {
          id: '3',
          name: 'Admin',
          permissions: ['canAccessPOS', 'canProcessSales', 'canViewReports', 'canManageSettings', 'canViewInventory', 'canAddProducts', 'canEditProducts', 'canDeleteProducts', 'canAdjustStock', 'canViewStockHistory', 'canViewCustomers', 'canAddCustomers', 'canEditCustomers', 'canDeleteCustomers', 'canViewCustomerHistory', 'canProcessRefunds', 'canViewFinancialReports', 'canManagePricing', 'canApplyDiscounts', 'canViewSalesHistory', 'canManageUsers', 'canManageRoles', 'canViewAuditLogs', 'canBackupData', 'canRestoreData'],
          enabled: true
        }
      ]
    });
    toast.success('User permissions settings reset to defaults');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading user permissions settings...</span>
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">User Permissions Settings</h2>
          <p className="text-sm text-gray-600">Configure user access and security permissions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
        {/* General Permissions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            General Permissions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Access POS</div>
                <div className="text-sm text-gray-600">Can access the POS system</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canAccessPOS')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Process Sales</div>
                <div className="text-sm text-gray-600">Can process sales transactions</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canProcessSales')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">View Reports</div>
                <div className="text-sm text-gray-600">Can view sales and inventory reports</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canViewReports')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Manage Settings</div>
                <div className="text-sm text-gray-600">Can modify system settings</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canManageSettings')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Inventory Permissions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Inventory Permissions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">View Inventory</div>
                <div className="text-sm text-gray-600">Can view product inventory</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canViewInventory')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Add Products</div>
                <div className="text-sm text-gray-600">Can add new products</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canAddProducts')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Edit Products</div>
                <div className="text-sm text-gray-600">Can edit existing products</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canEditProducts')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Delete Products</div>
                <div className="text-sm text-gray-600">Can delete products</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canDeleteProducts')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Adjust Stock</div>
                <div className="text-sm text-gray-600">Can adjust product stock levels</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canAdjustStock')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">View Stock History</div>
                <div className="text-sm text-gray-600">Can view stock movement history</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canViewStockHistory')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Customer Permissions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Customer Permissions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">View Customers</div>
                <div className="text-sm text-gray-600">Can view customer information</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canViewCustomers')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Add Customers</div>
                <div className="text-sm text-gray-600">Can add new customers</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canAddCustomers')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Edit Customers</div>
                <div className="text-sm text-gray-600">Can edit customer information</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canEditCustomers')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Delete Customers</div>
                <div className="text-sm text-gray-600">Can delete customer records</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canDeleteCustomers')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">View Customer History</div>
                <div className="text-sm text-gray-600">Can view customer purchase history</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canViewCustomerHistory')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Financial Permissions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Financial Permissions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Process Refunds</div>
                <div className="text-sm text-gray-600">Can process refunds</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canProcessRefunds')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">View Financial Reports</div>
                <div className="text-sm text-gray-600">Can view financial reports</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canViewFinancialReports')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Manage Pricing</div>
                <div className="text-sm text-gray-600">Can modify product pricing</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canManagePricing')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Apply Discounts</div>
                <div className="text-sm text-gray-600">Can apply discounts to sales</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canApplyDiscounts')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">View Sales History</div>
                <div className="text-sm text-gray-600">Can view sales history</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('canViewSalesHistory')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Require Password for Refunds</div>
                <div className="text-sm text-gray-600">Require password confirmation for refunds</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requirePasswordForRefunds')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Require Approval for Large Sales</div>
                <div className="text-sm text-gray-600">Require approval for sales above threshold</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requireApprovalForLargeSales')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Large Sale Threshold (TZS)</label>
              <input
                type="number"
                {...register('largeSaleThreshold', { min: 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Sales above this amount require approval</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                {...register('sessionTimeout', { min: 5, max: 480 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="5"
                max="480"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-logout after inactivity</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
              <input
                type="number"
                {...register('maxLoginAttempts', { min: 3, max: 10 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="3"
                max="10"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum failed login attempts before lockout</p>
            </div>
          </div>
        </div>

        {/* Actions - Save button removed, will use unified save button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <GlassButton
              type="button"
              onClick={handleReset}
              variant="secondary"
            >
              Reset to Defaults
            </GlassButton>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 italic">
              Settings will be saved using the unified save button
            </div>
          </div>
        </div>
      </form>
    </GlassCard>
  );
};

export default UserPermissionsSettings;
