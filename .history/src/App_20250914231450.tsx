import React, { useEffect, useState, lazy, Suspense } from 'react';
// HMR Test - This comment should appear when you save
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DevicesProvider, useDevices } from './context/DevicesContext';
import { CustomersProvider, useCustomers } from './context/CustomersContext';
import { UserGoalsProvider } from './context/UserGoalsContext';
import { PaymentsProvider } from './context/PaymentsContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import { GeneralSettingsProvider } from './context/GeneralSettingsContext';
import { PaymentMethodsProvider } from './context/PaymentMethodsContext';
import { SimpleRepairPage } from './features/repair/pages/SimpleRepairPage';
import { Toaster } from 'react-hot-toast';

// import BackgroundSelector from './features/settings/components/BackgroundSelector';
import GlobalLoadingProgress from './features/shared/components/ui/GlobalLoadingProgress';
import LoginPage from './features/shared/pages/LoginPage';
import DashboardPage from './features/shared/pages/DashboardPage';
const NewDevicePage = lazy(() => import('./features/devices/pages/NewDevicePage'));
import DevicesPage from './features/devices/pages/DevicesPage';

const CustomersPage = lazy(() => import('./features/customers/pages/CustomersPage'));
import CustomerDataUpdatePage from './features/customers/pages/CustomerDataUpdatePage';
import AppLayout from './layout/AppLayout';
import { ErrorBoundary } from './features/shared/components/ErrorBoundary';
import DynamicImportErrorBoundary from './features/shared/components/DynamicImportErrorBoundary';
import UrlValidatedRoute from './components/UrlValidatedRoute';
const SettingsPage = lazy(() => import('./features/settings/pages/UnifiedSettingsPage'));
const AdminSettingsPage = lazy(() => import('./features/admin/pages/AdminSettingsPage'));
import AdminManagementPage from './features/admin/pages/AdminManagementPage';
import IntegrationTestingPage from './features/admin/pages/IntegrationTestingPage';
import UserManagementPage from './features/users/pages/UserManagementPage';
const UnifiedSupplierManagementPage = lazy(() => import('./features/settings/pages/UnifiedSupplierManagementPage'));
import { SuppliersProvider } from './context/SuppliersContext';
import { WhatsAppProvider } from './context/WhatsAppContext';
const SMSControlCenterPage = lazy(() => import('./features/reports/pages/SMSControlCenterPage'));
const EnhancedPaymentManagementPage = lazy(() => import('./features/payments/pages/EnhancedPaymentManagementPage'));
const PaymentReconciliationPage = lazy(() => import('./features/payments/pages/PaymentReconciliationPage'));
const PaymentProviderManagementPage = lazy(() => import('./features/payments/pages/PaymentProviderManagementPage'));

import AuditLogsPage from './features/admin/pages/AuditLogsPage';
const FinanceManagementPage = lazy(() => import('./features/finance/pages/FinanceManagementPage'));

const EmployeeManagementPage = lazy(() => import('./features/employees/pages/EmployeeManagementPage'));
import EmployeeAttendancePage from './features/employees/pages/EmployeeAttendancePage';
// import CustomerCareDiagnosticsPage from './features/customers/pages/CustomerCareDiagnosticsPage';

// import BirthdayManagementPage from './features/customers/pages/BirthdayManagementPage';

// import NotificationSettingsPage from './features/notifications/pages/NotificationSettingsPage';
// import NotificationsPage from './features/notifications/pages/NotificationsPage';
import ServiceManagementPage from './features/services/pages/ServiceManagementPage';

const UnifiedAppointmentPage = lazy(() => import('./features/appointments/pages/UnifiedAppointmentPage'));
const BusinessManagementPage = lazy(() => import('./features/business/pages/BusinessManagementPage'));
import MobileOptimizationPage from './features/mobile/pages/MobileOptimizationPage';
const UnifiedAnalyticsPage = lazy(() => import('./features/analytics/pages/UnifiedAnalyticsPage'));
import GlobalSearchPage from './features/shared/pages/GlobalSearchPage';


const CategoryManagementPage = lazy(() => import('./features/settings/pages/CategoryManagementPage'));
import { StoreLocationManagementPage } from './features/settings/pages/StoreLocationManagementPage';
import DatabaseSetupPage from './features/admin/pages/DatabaseSetupPage';
import { BackupManagementPage } from './features/backup/pages/BackupManagementPage';
import ExcelImportPage from './features/reports/pages/ExcelImportPage';
import ExcelTemplateDownloadPage from './features/lats/pages/ExcelTemplateDownloadPage';
import ProductExportPage from './features/lats/pages/ProductExportPage';

const UnifiedDiagnosticManagementPage = lazy(() => import('./features/diagnostics/pages/UnifiedDiagnosticManagementPage'));

const LATSDashboardPage = lazy(() => import('./features/lats/pages/LATSDashboardPage'));
const PurchaseOrdersPage = lazy(() => import('./features/lats/pages/PurchaseOrdersPage'));
const POcreate = lazy(() => import('./features/lats/pages/POcreate'));
const PurchaseOrderDetailPage = lazy(() => import('./features/lats/pages/PurchaseOrderDetailPage'));
const SparePartsPage = lazy(() => import('./features/lats/pages/SparePartsPage'));
const PaymentHistoryPage = lazy(() => import('./features/lats/pages/PaymentHistoryPage'));

const SalesReportsPage = lazy(() => import('./features/lats/pages/SalesReportsPage'));
const CustomerLoyaltyPage = lazy(() => import('./features/lats/pages/CustomerLoyaltyPage'));
const PaymentTrackingPage = lazy(() => import('./features/lats/pages/PaymentTrackingPage'));

// Purchase Orders Module Pages
const ShippedItemsPage = lazy(() => import('./features/lats/pages/ShippedItemsPage'));
const SuppliersManagementPage = lazy(() => import('./features/lats/pages/SuppliersManagementPage'));



const UnifiedInventoryPage = lazy(() => import('./features/lats/pages/UnifiedInventoryPage'));
const AddProductPage = lazy(() => import('./features/lats/pages/AddProductPage'));
const EditProductPage = lazy(() => import('./features/lats/pages/EditProductPage'));

import ProductDetailPage from './features/lats/pages/ProductDetailPage';
const POSPage = lazy(() => import('./features/lats/pages/POSPageOptimized'));

import { CustomerQueryTest } from './components/CustomerQueryTest';
import InventoryManagementPage from './features/lats/pages/InventoryManagementPage';
const StorageRoomManagementPage = lazy(() => import('./features/lats/pages/StorageRoomManagementPage'));
import StorageRoomDetailPage from './features/lats/pages/StorageRoomDetailPage';

const WhatsAppConnectionManager = lazy(() => import('./features/lats/pages/WhatsAppConnectionManager'));
const WhatsAppSettingsPage = lazy(() => import('./features/lats/pages/WhatsAppSettingsPage'));
const WhatsAppChatPage = lazy(() => import('./features/lats/pages/WhatsAppChatPage'));
const WhatsAppHubPage = lazy(() => import('./features/lats/pages/WhatsAppHubPage'));
const BluetoothPrinterPage = lazy(() => import('./pages/BluetoothPrinterPage'));

import AITrainingManagerPage from './pages/AITrainingManagerPage';

import { initializeDatabaseCheck } from './lib/databaseUtils';
import { supabase } from './lib/supabaseClient';
import { reminderService } from './lib/reminderService';
import { initializeCache } from './lib/offlineCache';
import { getPendingActions, clearPendingActions } from './lib/offlineSync';
import HeaderSizeDiagnostic from './components/HeaderSizeDiagnostic';
import BackgroundDataLoader from './components/BackgroundDataLoader';
import { POSSettingsDatabaseSetup } from './components/POSSettingsDatabaseSetup';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Loading component for lazy-loaded pages
const PageLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Error fallback for dynamic imports
const DynamicImportErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="text-red-600 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load page</h3>
      <p className="text-gray-600 mb-4">There was an error loading this page. This might be a temporary issue.</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  </div>
);

// LoadingProgressWrapper component that can access the loading context
const LoadingProgressWrapper: React.FC = () => {
  const { isVisible, jobs, cancelJob } = useLoading();
  
  return (
    <GlobalLoadingProgress
      isVisible={isVisible}
      jobs={jobs}
      onCancel={cancelJob}
    />
  );
};

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add error boundary for React refresh issues
  const [hasError, setHasError] = useState(false);
  
  // Reset error state on mount
  useEffect(() => {
    setHasError(false);
  }, []);
  
  // Try to get auth context with error handling
  let isAuthenticated = false;
  let loading = true;
  
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    loading = auth.loading;
  } catch (error) {
    console.warn('Auth context not available during hot reload:', error);
    // During hot reload, show loading state instead of error
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }
  
  // Handle any errors during render
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
          <p className="text-gray-600 mb-4">There was an issue with authentication. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Handle authentication check
  try {
    if (!isAuthenticated) {
      localStorage.setItem('postLoginRedirect', window.location.pathname);
      return <Navigate to="/login" />;
    }
    
    return <>{children}</>;
  } catch (error) {
    console.error('ProtectedRoute error:', error);
    setHasError(true);
    return null;
  }
};

// Role-based protected route component
const RoleProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  
  // Add error boundary for React refresh issues
  const [hasError, setHasError] = useState(false);
  
  // Reset error state on mount
  useEffect(() => {
    setHasError(false);
  }, []);
  
  // Handle any errors during render
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Error</h3>
          <p className="text-gray-600 mb-4">There was an issue with role verification. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Handle role-based access control
  try {
    if (!isAuthenticated) {
      localStorage.setItem('postLoginRedirect', window.location.pathname);
      return <Navigate to="/login" />;
    }
    
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
    
    return <>{children}</>;
  } catch (error) {
    console.error('RoleProtectedRoute error:', error);
    setHasError(true);
    return null;
  }
};

// AppContent component that handles the sync logic and routes
const AppContent: React.FC<{ isOnline: boolean; isSyncing: boolean }> = ({ isOnline, isSyncing }) => {
  const [showHeaderDiagnostic, setShowHeaderDiagnostic] = useState(false);
  
  // Access context hooks with error handling
  let customersContext: any;
  let devicesContext: any;
  
  try {
    customersContext = useCustomers();
  } catch (error) {
    console.warn('Customers context not ready:', error);
  }
  
  try {
    devicesContext = useDevices();
  } catch (error) {
    console.warn('Devices context not ready:', error);
  }
  
  // Enable keyboard shortcuts (moved here to have access to router context)
  useKeyboardShortcuts();

  // Initialize database check on app startup
  useEffect(() => {
    initializeDatabaseCheck().catch(console.error);
  }, []);

  // Add keyboard shortcut for header diagnostic (Ctrl+Shift+H)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'H') {
        event.preventDefault();
        setShowHeaderDiagnostic(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle offline sync
  useEffect(() => {
    async function syncPending() {
      try {
        // Only proceed if context functions are available
        if (!customersContext?.addCustomer || !devicesContext?.assignToTechnician || !devicesContext?.updateDeviceStatus) {
          console.warn('Context functions not ready, skipping sync');
          return;
        }
        
        const actions = await getPendingActions();
        for (const action of actions) {
          try {
            if (action.type === 'submitData') {
              await fetch('/api/endpoint', { method: 'POST', body: JSON.stringify(action.payload) });
            } else if (action.type === 'createCustomerFromSearch') {
              await customersContext.addCustomer(action.payload);
            } else if (action.type === 'adjustPoints') {
              const { operation, pointsToAdjust, reason, customerId } = action.payload;
              const adjustment = operation === 'add' ? Math.abs(pointsToAdjust) : -Math.abs(pointsToAdjust);
              
              // Use the proper customer update function instead of direct Supabase calls
              if (customersContext?.updateCustomer) {
                // Fetch current customer to get current points
                const currentCustomer = customersContext.customers.find(c => c.id === customerId);
                if (currentCustomer) {
                  const newPoints = (currentCustomer.points || 0) + adjustment;
                  await customersContext.updateCustomer(customerId, { points: newPoints });
                  
                  // Add a note about the points adjustment
                  if (customersContext.addNote) {
                    await customersContext.addNote(customerId, `${operation === 'add' ? 'Added' : 'Subtracted'} ${Math.abs(pointsToAdjust)} points - ${reason}`);
                  }
                }
              }
            } else if (action.type === 'assignTechnician') {
              const { deviceId, selectedTechId } = action.payload;
              await devicesContext.assignToTechnician(deviceId, selectedTechId, '');
            } else if (action.type === 'markDeviceFailed') {
              const { deviceId, remark } = action.payload;
              await devicesContext.updateDeviceStatus(deviceId, 'failed', remark || '');
            }
          } catch (actionError) {
            console.error('Error syncing action:', actionError);
            // Continue with other actions even if one fails
          }
        }
        if (actions.length > 0) {
          await clearPendingActions();
        }
      } catch (error) {
        console.error('Error during offline sync:', error);
        // Don't throw - let the app continue
      }
    }

    if (isOnline) {
      syncPending();
    }
  }, [isOnline, customersContext, devicesContext]);

  return (
    <>
      {!isOnline && (
        <div style={{ background: '#f87171', color: 'white', padding: '8px', textAlign: 'center' }}>
          You are offline. Changes will be saved and synced when you are back online.
        </div>
      )}
      {isOnline && isSyncing && (
        <div style={{ background: '#fbbf24', color: 'black', padding: '8px', textAlign: 'center' }}>
          Syncing your offline changes...
        </div>
      )}
      
      {/* Header Size Diagnostic Modal */}
      {showHeaderDiagnostic && (
        <HeaderSizeDiagnostic onClose={() => setShowHeaderDiagnostic(false)} />
      )}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/devices/new" element={<Suspense fallback={<PageLoadingSpinner />}><NewDevicePage /></Suspense>} />

          {/* Repair Module Routes */}
          <Route path="/repair" element={<Suspense fallback={<PageLoadingSpinner />}><SimpleRepairPage /></Suspense>} />


        <Route path="/category-management" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoadingSpinner />}><CategoryManagementPage /></Suspense></RoleProtectedRoute>} />
                  <Route path="/supplier-management" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedSupplierManagementPage /></Suspense></RoleProtectedRoute>} />
        <Route path="/store-locations" element={<RoleProtectedRoute allowedRoles={['admin']}><StoreLocationManagementPage /></RoleProtectedRoute>} />
        <Route path="/database-setup" element={<RoleProtectedRoute allowedRoles={['admin']}><DatabaseSetupPage /></RoleProtectedRoute>} />
        <Route path="/backup-management" element={<RoleProtectedRoute allowedRoles={['admin']}><BackupManagementPage /></RoleProtectedRoute>} />
        <Route path="/customers/import" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ExcelImportPage /></RoleProtectedRoute>} />
        <Route path="/excel-import" element={<RoleProtectedRoute allowedRoles={['admin']}><ExcelImportPage /></RoleProtectedRoute>} />
        <Route path="/excel-templates" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ExcelTemplateDownloadPage /></RoleProtectedRoute>} />
        <Route path="/product-export" element={<RoleProtectedRoute allowedRoles={['admin']}><ProductExportPage /></RoleProtectedRoute>} />

          <Route path="/customers" element={
            <ErrorBoundary fallback={DynamicImportErrorFallback}>
              <Suspense fallback={<PageLoadingSpinner />}>
                <CustomersPage />
              </Suspense>
            </ErrorBoundary>
          } />

          <Route path="/customers/update" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><CustomerDataUpdatePage /></RoleProtectedRoute>} />

          <Route path="/settings" element={<Suspense fallback={<PageLoadingSpinner />}><SettingsPage /></Suspense>} />
          <Route path="/sms" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoadingSpinner />}><SMSControlCenterPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/admin-settings" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoadingSpinner />}><AdminSettingsPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/admin-management" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminManagementPage /></RoleProtectedRoute>} />
          <Route path="/integration-testing" element={<RoleProtectedRoute allowedRoles={['admin']}><IntegrationTestingPage /></RoleProtectedRoute>} />
          <Route path="/users" element={<RoleProtectedRoute allowedRoles={['admin']}><UserManagementPage /></RoleProtectedRoute>} />
          <Route path="/audit-logs" element={<RoleProtectedRoute allowedRoles={['admin']}><AuditLogsPage /></RoleProtectedRoute>} />
          <Route path="/finance" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoadingSpinner />}><FinanceManagementPage /></Suspense></RoleProtectedRoute>} />
          
          {/* Enhanced Payment Management Routes */}
          <Route path="/finance/payments" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><EnhancedPaymentManagementPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/finance/payments/reconciliation" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoadingSpinner />}><PaymentReconciliationPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/finance/payments/providers" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoadingSpinner />}><PaymentProviderManagementPage /></Suspense></RoleProtectedRoute>} />
          
          {/* Appointment Management Routes */}
          <Route path="/appointments" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedAppointmentPage /></Suspense></RoleProtectedRoute>} />
          
          {/* Service Management Routes */}
          <Route path="/services" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ServiceManagementPage /></RoleProtectedRoute>} />
          
          {/* Employee Management Routes */}
          <Route path="/employees" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><Suspense fallback={<PageLoadingSpinner />}><EmployeeManagementPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/attendance" element={<RoleProtectedRoute allowedRoles={['admin', 'manager', 'technician', 'customer-care']}><EmployeeAttendancePage /></RoleProtectedRoute>} />

          {/* Advanced Analytics Routes */}
          <Route path="/analytics" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedAnalyticsPage /></Suspense></RoleProtectedRoute>} />
          
          {/* Calendar View Routes */}

          
          {/* Mobile Optimization Routes */}
          <Route path="/mobile" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><MobileOptimizationPage /></RoleProtectedRoute>} />
          
          {/* Consolidated Management Routes */}
          <Route path="/business" element={<RoleProtectedRoute allowedRoles={['admin', 'manager', 'customer-care']}><BusinessManagementPage /></RoleProtectedRoute>} />

          {/* Diagnostics Routes - Unified Interface */}
          <Route path="/diagnostics" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care', 'technician']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedDiagnosticManagementPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/diagnostics/new" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care', 'technician']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedDiagnosticManagementPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/diagnostics/new-request" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care', 'technician']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedDiagnosticManagementPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/diagnostics/my-requests" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care', 'technician']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedDiagnosticManagementPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/diagnostics/assigned" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care', 'technician']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedDiagnosticManagementPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/diagnostics/reports" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care', 'technician']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedDiagnosticManagementPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/diagnostics/templates" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care', 'technician']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedDiagnosticManagementPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/diagnostics/device/:requestId/:deviceId" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care', 'technician']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedDiagnosticManagementPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/diagnostics/grouped/:requestId/:deviceName/:model" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care', 'technician']}><Suspense fallback={<PageLoadingSpinner />}><UnifiedDiagnosticManagementPage /></Suspense></RoleProtectedRoute>} />
          
          {/* LATS Module Routes */}
          <Route path="/lats" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><LATSDashboardPage /></Suspense></RoleProtectedRoute>} />
          
          {/* POS Route */}
          <Route path="/pos" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><POSPage /></Suspense></RoleProtectedRoute>} />

          <Route path="/customer-query-test" element={<CustomerQueryTest />} />
          
          {/* Primary Unified Inventory Route */}
          <Route path="/lats/unified-inventory" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><DynamicImportErrorBoundary><Suspense fallback={<PageLoadingSpinner />}><UnifiedInventoryPage /></Suspense></DynamicImportErrorBoundary></RoleProtectedRoute>} />
          
          {/* Inventory Management Route */}
          <Route path="/lats/inventory-management" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><InventoryManagementPage /></RoleProtectedRoute>} />
          
          {/* Storage Room Management Route */}
          <Route path="/lats/storage-rooms" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><StorageRoomManagementPage /></Suspense></RoleProtectedRoute>} />
          
          {/* Storage Room Detail Route */}
          <Route path="/lats/storage-rooms/:id" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><StorageRoomDetailPage /></RoleProtectedRoute>} />
          
          {/* Redirect old inventory routes to unified inventory */}
          <Route path="/lats/inventory" element={<Navigate to="/lats/unified-inventory" replace />} />
          <Route path="/lats/products" element={<Navigate to="/lats/unified-inventory" replace />} />
          
          {/* Keep product detail route for individual product views */}
          <Route path="/lats/products/:id" element={
            <UrlValidatedRoute enableImageUrlValidation={true} enableUrlLogging={false}>
              <RoleProtectedRoute allowedRoles={['admin', 'customer-care']}>
                <ProductDetailPage />
              </RoleProtectedRoute>
            </UrlValidatedRoute>
          } />
          
          {/* Add Product Route */}
          <Route path="/lats/add-product" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><AddProductPage /></Suspense></RoleProtectedRoute>} />
          
          {/* Edit Product Route */}
          <Route path="/lats/products/:productId/edit" element={
            <UrlValidatedRoute enableImageUrlValidation={true} enableUrlLogging={false}>
              <RoleProtectedRoute allowedRoles={['admin', 'customer-care']}>
                <Suspense fallback={<PageLoadingSpinner />}>
                  <EditProductPage />
                </Suspense>
              </RoleProtectedRoute>
            </UrlValidatedRoute>
          } />

          <Route path="/lats/sales-reports" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><SalesReportsPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/lats/loyalty" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><CustomerLoyaltyPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/lats/payments" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoadingSpinner />}><PaymentTrackingPage /></Suspense></RoleProtectedRoute>} />

          <Route path="/lats/purchase-orders" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><PurchaseOrdersPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/lats/purchase-order/create" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><POcreate /></Suspense></RoleProtectedRoute>} />
          <Route path="/lats/purchase-orders/:id" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><PurchaseOrderDetailPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/lats/purchase-orders/:id/edit" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><PurchaseOrderDetailPage editMode={true} /></Suspense></RoleProtectedRoute>} />
          <Route path="/lats/purchase-orders/shipped-items" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><ShippedItemsPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/lats/purchase-orders/suppliers" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><SuppliersManagementPage /></Suspense></RoleProtectedRoute>} />
          <Route path="/lats/purchase-orders/reports" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><SalesReportsPage /></Suspense></RoleProtectedRoute>} />

          <Route path="/lats/spare-parts" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><Suspense fallback={<PageLoadingSpinner />}><SparePartsPage /></Suspense></RoleProtectedRoute>} />
          
          {/* Payment routes */}
          <Route path="/lats/payment-history" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><PaymentHistoryPage /></Suspense></RoleProtectedRoute>} />

          

        <Route path="/lats/whatsapp-hub" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoadingSpinner />}><WhatsAppHubPage /></Suspense></RoleProtectedRoute>} />
        <Route path="/lats/whatsapp-connection-manager" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoadingSpinner />}><WhatsAppConnectionManager /></Suspense></RoleProtectedRoute>} />
        <Route path="/lats/whatsapp-chat" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><WhatsAppChatPage /></Suspense></RoleProtectedRoute>} />
        <Route path="/lats/whatsapp-settings/:instanceId" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoadingSpinner />}><WhatsAppSettingsPage /></Suspense></RoleProtectedRoute>} />

        {/* Bluetooth Printer Management Route */}
        <Route path="/bluetooth-printer" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><Suspense fallback={<PageLoadingSpinner />}><BluetoothPrinterPage /></Suspense></RoleProtectedRoute>} />

          {/* AI Training Manager Route */}
          <Route path="/ai-training" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><AITrainingManagerPage /></RoleProtectedRoute>} />
          
          {/* Global Search Route */}
          <Route path="/search" element={<GlobalSearchPage />} />
        </Route>

        {/* Full-page routes (outside AppLayout) */}
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

function _clearAllIndexedDB() {
  const databases = ['clean-app-cache', 'clean-app-offline-sync', 'user-goals', 'offline-cache', 'pending-actions'];
  databases.forEach(dbName => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => console.log(`Deleted database: ${dbName}`);
    request.onerror = () => console.error(`Error deleting database: ${dbName}`);
  });
}

// Function to clear all IndexedDB databases and reset the app
function clearAllDatabases() {
  try {
    _clearAllIndexedDB();
    // Also clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('All databases and storage cleared');
  } catch (error) {
    console.error('Error clearing databases:', error);
  }
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, _setIsSyncing] = useState(false);

  // --- Global scroll position persistence ---
  useEffect(() => {
    // Restore scroll position on mount
    const saved = sessionStorage.getItem(`scroll-pos-${window.location.pathname}`);
    if (saved) {
      window.scrollTo(0, parseInt(saved, 10));
    }
    // Save scroll position on unload
    const saveScroll = () => {
      sessionStorage.setItem(`scroll-pos-${window.location.pathname}`, String(window.scrollY));
    };
    window.addEventListener('beforeunload', saveScroll);
    // Save on route change (popstate)
    window.addEventListener('popstate', saveScroll);
    return () => {
      window.removeEventListener('beforeunload', saveScroll);
      window.removeEventListener('popstate', saveScroll);
      saveScroll(); // Save on component unmount
    };
  }, []);
  // --- End global scroll position persistence ---

  // Start reminder service
  useEffect(() => {
    reminderService.start();
    return () => {
      reminderService.stop();
    };
  }, []);

  // Initialize cache
  useEffect(() => {
    initializeCache();
  }, []);

  // Make clearAllDatabases available globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).clearAllDatabases = clearAllDatabases;
      (window as any).clearAllIndexedDB = _clearAllIndexedDB;
    }
  }, []);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) {
      // Initial sync when online
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider>
          <AuthProvider>
            {/* <RepairProvider> */}
              <DevicesProvider>
                <CustomersProvider>
                  <UserGoalsProvider>
                    <PaymentsProvider>
                      <PaymentMethodsProvider>
                        <LoadingProvider>
                        <GeneralSettingsProvider>
                            <SuppliersProvider>
                              <WhatsAppProvider>
                              <POSSettingsDatabaseSetup>
                                <AppContent 
                                  isOnline={isOnline} 
                                  isSyncing={isSyncing} 
                                />
                                <LoadingProgressWrapper />
                                <BackgroundDataLoader />
                              </POSSettingsDatabaseSetup>
                            </WhatsAppProvider>
                          </SuppliersProvider>
                      </GeneralSettingsProvider>
                      </LoadingProvider>
                    </PaymentMethodsProvider>
                  </PaymentsProvider>
                </UserGoalsProvider>
              </CustomersProvider>
            </DevicesProvider>
            {/* </RepairProvider> */}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
    </ErrorBoundary>
  );
}

export default App;