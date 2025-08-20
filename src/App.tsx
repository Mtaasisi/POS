import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DevicesProvider, useDevices } from './context/DevicesContext';
import { CustomersProvider, useCustomers } from './context/CustomersContext';
import { UserGoalsProvider } from './context/UserGoalsContext';
import { PaymentsProvider } from './context/PaymentsContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import { GeneralSettingsProvider } from './context/GeneralSettingsContext';
import { BrandsProvider } from './context/BrandsContext';
import { Toaster } from 'react-hot-toast';

import BackgroundSelector from './features/settings/components/BackgroundSelector';
import GlobalLoadingProgress from './features/shared/components/ui/GlobalLoadingProgress';
import LoginPage from './features/shared/pages/LoginPage';
import DashboardPage from './features/shared/pages/DashboardPage';
import NewDevicePage from './features/devices/pages/NewDevicePage';
import DevicesPage from './features/devices/pages/DevicesPage';

import DeviceDetailPage from './features/devices/pages/DeviceDetailPage';
import CustomersPage from './features/customers/pages/CustomersPage';
import CustomerDetailPage from './features/customers/pages/CustomerDetailPage';
import CustomerDataUpdatePage from './features/customers/pages/CustomerDataUpdatePage';
import AppLayout from './layout/AppLayout';
import { ErrorBoundary } from './features/shared/components/ErrorBoundary';
import SettingsPage from './features/settings/pages/SettingsPage';
import AdminSettingsPage from './features/admin/pages/AdminSettingsPage';
import AdminManagementPage from './features/admin/pages/AdminManagementPage';
import UserManagementPage from './features/users/pages/UserManagementPage';
import SupplierManagementPage from './features/settings/pages/SupplierManagementPage';
import { SuppliersProvider } from './context/SuppliersContext';
import SMSControlCenterPage from './features/reports/pages/SMSControlCenterPage';
import PointsManagementPage from './features/finance/pages/PointsManagementPage';
import PaymentsReportPage from './features/finance/pages/PaymentsReportPage';
import AuditLogsPage from './features/admin/pages/AuditLogsPage';
import FinanceManagementPage from './features/finance/pages/FinanceManagementPage';
import PaymentsAccountsPage from './features/finance/pages/PaymentsAccountsPage';
import EmployeeManagementPage from './features/employees/pages/EmployeeManagementPage';
import EmployeeAttendancePage from './features/employees/pages/EmployeeAttendancePage';
import CustomerCareDiagnosticsPage from './features/customers/pages/CustomerCareDiagnosticsPage';
import CustomerAnalyticsPage from './features/customers/pages/CustomerAnalyticsPage';
import BirthdayManagementPage from './features/customers/pages/BirthdayManagementPage';
import WhatsAppWebPage from './features/whatsapp/pages/WhatsAppWebPage';
import WhatsAppTemplatesPage from './features/whatsapp/pages/WhatsAppTemplatesPage';
import ChromeExtensionPage from './features/whatsapp/pages/ChromeExtensionPage';
import NotificationSettingsPage from './features/notifications/pages/NotificationSettingsPage';
import NotificationsPage from './features/notifications/pages/NotificationsPage';
import ServiceManagementPage from './features/services/pages/ServiceManagementPage';
import CalendarViewPage from './features/calendar/pages/CalendarViewPage';
import AppointmentPage from './features/appointments/pages/AppointmentPage';
import BusinessManagementPage from './features/business/pages/BusinessManagementPage';
import MobileOptimizationPage from './features/mobile/pages/MobileOptimizationPage';
import AdvancedAnalyticsPage from './features/analytics/pages/AdvancedAnalyticsPage';
import GlobalSearchPage from './features/shared/pages/GlobalSearchPage';
import LoadingDemoPage from './features/shared/pages/LoadingDemoPage';
import BrandManagementPage from './features/settings/pages/BrandManagementPage';
import CategoryManagementPage from './features/settings/pages/CategoryManagementPage';
import { StoreLocationManagementPage } from './features/settings/pages/StoreLocationManagementPage';
import { ShelfManagementPage } from './features/settings/pages/ShelfManagementPage';
import DatabaseSetupPage from './features/admin/pages/DatabaseSetupPage';
import BackupManagementPage from './features/backup/pages/BackupManagementPage';
import ExcelImportPage from './features/reports/pages/ExcelImportPage';
import ExcelTemplateDownloadPage from './features/lats/pages/ExcelTemplateDownloadPage';
import ProductExportPage from './features/lats/pages/ProductExportPage';

import NewDiagnosticRequestPage from './features/diagnostics/pages/NewDiagnosticRequestPage';
import AssignedDiagnosticsPage from './features/diagnostics/pages/AssignedDiagnosticsPage';
import DiagnosticDevicePage from './features/diagnostics/pages/DiagnosticDevicePage';
import DiagnosticReportsPage from './features/diagnostics/pages/DiagnosticReportsPage';
import DiagnosticTemplatesPage from './features/diagnostics/pages/DiagnosticTemplatesPage';
import DiagnosticGroupedDevicesPage from './features/diagnostics/pages/DiagnosticGroupedDevicesPage';

import LATSDashboardPage from './features/lats/pages/LATSDashboardPage';
import PurchaseOrdersPage from './features/lats/pages/PurchaseOrdersPage';
import NewPurchaseOrderPage from './features/lats/pages/NewPurchaseOrderPage';
import PurchaseOrderDetailPage from './features/lats/pages/PurchaseOrderDetailPage';
import SparePartsPage from './features/lats/pages/SparePartsPage';
import PaymentHistoryPage from './features/lats/pages/PaymentHistoryPage';
import PaymentAnalyticsPage from './features/lats/pages/PaymentAnalyticsPage';
import SalesReportsPage from './features/lats/pages/SalesReportsPage';
import CustomerLoyaltyPage from './features/lats/pages/CustomerLoyaltyPage';
import PaymentTrackingPage from './features/lats/pages/PaymentTrackingPage';
import BusinessAnalyticsPage from './features/lats/pages/BusinessAnalyticsPage';
import InventoryPage from './features/lats/pages/InventoryPage';
import ProductCatalogPage from './features/lats/pages/ProductCatalogPage';
import UnifiedInventoryPage from './features/lats/pages/UnifiedInventoryPage';
import AddProductPage from './features/lats/pages/AddProductPage';
import EditProductPage from './features/lats/pages/EditProductPage';

import ProductDetailPage from './features/lats/pages/ProductDetailPage';
import POSPage from './features/lats/pages/POSPage';
import GeneralSettingsTestPage from './features/lats/pages/GeneralSettingsTestPage';
import InventoryManagementPage from './features/lats/pages/InventoryManagementPage';
import BeemTestPage from './features/lats/pages/BeemTestPage';

import { initializeDatabaseCheck } from './lib/databaseUtils';
import { supabase } from './lib/supabaseClient';
import { reminderService } from './lib/reminderService';
import { initializeCache } from './lib/offlineCache';
import { getPendingActions, clearPendingActions } from './lib/offlineSync';
import HeaderSizeDiagnostic from './components/HeaderSizeDiagnostic';
import BackgroundDataLoader from './components/BackgroundDataLoader';
import { POSSettingsDatabaseSetup } from './components/POSSettingsDatabaseSetup';
import DebugPanel from './components/DebugPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';


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

// AppContent component that handles the sync logic and routes
const AppContent: React.FC<{ isOnline: boolean; isSyncing: boolean }> = ({ isOnline, isSyncing }) => {
  const { addCustomer } = useCustomers();
  const { assignToTechnician, updateDeviceStatus } = useDevices();
  const [showHeaderDiagnostic, setShowHeaderDiagnostic] = useState(false);
  
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
      const actions = await getPendingActions();
      for (const action of actions) {
        if (action.type === 'submitData') {
          await fetch('/api/endpoint', { method: 'POST', body: JSON.stringify(action.payload) });
        } else if (action.type === 'createCustomerFromSearch') {
          await addCustomer(action.payload);
        } else if (action.type === 'adjustPoints') {
          const { operation, pointsToAdjust, reason, customerId } = action.payload;
          const adjustment = operation === 'add' ? Math.abs(pointsToAdjust) : -Math.abs(pointsToAdjust);
          // Fetch current points
          const { data, error } = await supabase
            .from('customers')
            .select('points')
            .eq('id', customerId)
            .single();
          if (!error && data) {
            const newPoints = (data.points || 0) + adjustment;
            await supabase
              .from('customers')
              .update({ points: newPoints })
              .eq('id', customerId);
            // Optionally add a note
            await supabase
              .from('customer_notes')
              .insert({
                id: `note-${Date.now()}`,
                content: `${operation === 'add' ? 'Added' : 'Subtracted'} ${Math.abs(pointsToAdjust)} points - ${reason}`,
                created_by: 'system',
                created_at: new Date().toISOString(),
                customer_id: customerId
              });
          }
        } else if (action.type === 'assignTechnician') {
          const { deviceId, selectedTechId } = action.payload;
          await assignToTechnician(deviceId, selectedTechId, '');
        } else if (action.type === 'markDeviceFailed') {
          const { deviceId, remark } = action.payload;
          await updateDeviceStatus(deviceId, 'failed', remark || '');
        }
      }
      if (actions.length > 0) {
        await clearPendingActions();
      }
    }

    if (isOnline) {
      syncPending();
    }
  }, [isOnline, addCustomer, assignToTechnician, updateDeviceStatus]);

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
          <Route path="/devices/new" element={<NewDevicePage />} />
          <Route path="/devices/:id" element={<DeviceDetailPage />} />



        <Route path="/brand-management" element={<RoleProtectedRoute allowedRoles={['admin']}><BrandManagementPage /></RoleProtectedRoute>} />
        <Route path="/category-management" element={<RoleProtectedRoute allowedRoles={['admin']}><CategoryManagementPage /></RoleProtectedRoute>} />
        <Route path="/supplier-management" element={<RoleProtectedRoute allowedRoles={['admin']}><SupplierManagementPage /></RoleProtectedRoute>} />
        <Route path="/store-locations" element={<RoleProtectedRoute allowedRoles={['admin']}><StoreLocationManagementPage /></RoleProtectedRoute>} />
        <Route path="/shelf-management" element={<RoleProtectedRoute allowedRoles={['admin']}><ShelfManagementPage /></RoleProtectedRoute>} />
        <Route path="/database-setup" element={<RoleProtectedRoute allowedRoles={['admin']}><DatabaseSetupPage /></RoleProtectedRoute>} />
        <Route path="/backup-management" element={<RoleProtectedRoute allowedRoles={['admin']}><BackupManagementPage /></RoleProtectedRoute>} />
        <Route path="/customers/import" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ExcelImportPage /></RoleProtectedRoute>} />
        <Route path="/excel-import" element={<RoleProtectedRoute allowedRoles={['admin']}><ExcelImportPage /></RoleProtectedRoute>} />
        <Route path="/excel-templates" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ExcelTemplateDownloadPage /></RoleProtectedRoute>} />
        <Route path="/product-export" element={<RoleProtectedRoute allowedRoles={['admin']}><ProductExportPage /></RoleProtectedRoute>} />

          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/analytics" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><CustomerAnalyticsPage /></RoleProtectedRoute>} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/update" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><CustomerDataUpdatePage /></RoleProtectedRoute>} />

          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/sms" element={<RoleProtectedRoute allowedRoles={['admin']}><SMSControlCenterPage /></RoleProtectedRoute>} />
          <Route path="/points-management" element={<RoleProtectedRoute allowedRoles={['admin']}><PointsManagementPage /></RoleProtectedRoute>} />
          <Route path="/payments-report" element={<RoleProtectedRoute allowedRoles={['admin']}><PaymentsReportPage /></RoleProtectedRoute>} />
          <Route path="/admin-settings" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></RoleProtectedRoute>} />
          <Route path="/admin-management" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminManagementPage /></RoleProtectedRoute>} />
          <Route path="/users" element={<RoleProtectedRoute allowedRoles={['admin']}><UserManagementPage /></RoleProtectedRoute>} />
          <Route path="/audit-logs" element={<RoleProtectedRoute allowedRoles={['admin']}><AuditLogsPage /></RoleProtectedRoute>} />
          <Route path="/finance" element={<RoleProtectedRoute allowedRoles={['admin']}><FinanceManagementPage /></RoleProtectedRoute>} />
          <Route path="/payments-accounts" element={<RoleProtectedRoute allowedRoles={['admin']}><PaymentsAccountsPage /></RoleProtectedRoute>} />
          
          {/* Appointment Management Routes */}
          <Route path="/appointments" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><AppointmentPage /></RoleProtectedRoute>} />
          
          {/* Service Management Routes */}
          <Route path="/services" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ServiceManagementPage /></RoleProtectedRoute>} />
          
          {/* Employee Management Routes */}
          <Route path="/employees" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><EmployeeManagementPage /></RoleProtectedRoute>} />
          <Route path="/attendance" element={<RoleProtectedRoute allowedRoles={['admin', 'manager', 'technician', 'customer-care']}><EmployeeAttendancePage /></RoleProtectedRoute>} />

          
          {/* Advanced Analytics Routes */}
          <Route path="/analytics" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><AdvancedAnalyticsPage /></RoleProtectedRoute>} />
          
          {/* Calendar View Routes */}
          <Route path="/calendar" element={<RoleProtectedRoute allowedRoles={['admin', 'manager', 'customer-care']}><CalendarViewPage /></RoleProtectedRoute>} />
          
          {/* Mobile Optimization Routes */}
          <Route path="/mobile" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><MobileOptimizationPage /></RoleProtectedRoute>} />
          
          {/* Consolidated Management Routes */}
          <Route path="/business" element={<RoleProtectedRoute allowedRoles={['admin', 'manager', 'customer-care']}><BusinessManagementPage /></RoleProtectedRoute>} />

          <Route path="/whatsapp" element={<RoleProtectedRoute allowedRoles={['admin']}><WhatsAppWebPage /></RoleProtectedRoute>} />
          <Route path="/whatsapp-manager" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><WhatsAppWebPage /></RoleProtectedRoute>} />
          <Route path="/whatsapp-web" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><WhatsAppWebPage /></RoleProtectedRoute>} />
          <Route path="/whatsapp/chrome-extension" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ChromeExtensionPage /></RoleProtectedRoute>} />
          <Route path="/chrome-extension" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ChromeExtensionPage /></RoleProtectedRoute>} />
          
          {/* Diagnostics Routes */}
          <Route path="/diagnostics/new" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><NewDiagnosticRequestPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/new-request" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><NewDiagnosticRequestPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/my-requests" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><CustomerCareDiagnosticsPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/assigned" element={<RoleProtectedRoute allowedRoles={['technician']}><AssignedDiagnosticsPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/device/:requestId/:deviceId" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><DiagnosticDevicePage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/grouped/:requestId/:deviceName/:model" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><DiagnosticGroupedDevicesPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/reports" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><DiagnosticReportsPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/templates" element={<RoleProtectedRoute allowedRoles={['admin']}><DiagnosticTemplatesPage /></RoleProtectedRoute>} />
          
          {/* LATS Module Routes */}
          <Route path="/lats" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><LATSDashboardPage /></RoleProtectedRoute>} />
          
          {/* POS Route */}
          <Route path="/pos" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><POSPage /></RoleProtectedRoute>} />
          <Route path="/general-settings-test" element={<GeneralSettingsTestPage />} />
          
          {/* Primary Unified Inventory Route */}
          <Route path="/lats/unified-inventory" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><UnifiedInventoryPage /></RoleProtectedRoute>} />
          
          {/* Inventory Management Route */}
          <Route path="/lats/inventory-management" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><InventoryManagementPage /></RoleProtectedRoute>} />
          
          {/* Redirect old inventory routes to unified inventory */}
          <Route path="/lats/inventory" element={<Navigate to="/lats/unified-inventory" replace />} />
          <Route path="/lats/products" element={<Navigate to="/lats/unified-inventory" replace />} />
          
          {/* Keep product detail route for individual product views */}
          <Route path="/lats/products/:id" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ProductDetailPage /></RoleProtectedRoute>} />
          
          {/* Add Product Route */}
          <Route path="/lats/add-product" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><AddProductPage /></RoleProtectedRoute>} />
          
          {/* Edit Product Route */}
          <Route path="/lats/products/:productId/edit" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><EditProductPage /></RoleProtectedRoute>} />

          <Route path="/lats/sales-reports" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><SalesReportsPage /></RoleProtectedRoute>} />
          <Route path="/lats/loyalty" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><CustomerLoyaltyPage /></RoleProtectedRoute>} />
          <Route path="/lats/payments" element={<RoleProtectedRoute allowedRoles={['admin']}><PaymentTrackingPage /></RoleProtectedRoute>} />
          <Route path="/lats/analytics" element={<RoleProtectedRoute allowedRoles={['admin']}><BusinessAnalyticsPage /></RoleProtectedRoute>} />
          <Route path="/lats/purchase-orders" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><PurchaseOrdersPage /></RoleProtectedRoute>} />
          <Route path="/lats/purchase-orders/new" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><NewPurchaseOrderPage /></RoleProtectedRoute>} />
          <Route path="/lats/purchase-orders/:id" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><PurchaseOrderDetailPage /></RoleProtectedRoute>} />
          <Route path="/lats/supplier-management" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><SupplierManagementPage /></RoleProtectedRoute>} />
          <Route path="/lats/spare-parts" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><SparePartsPage /></RoleProtectedRoute>} />
          
          {/* Payment routes */}
          <Route path="/lats/payment-history" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><PaymentHistoryPage /></RoleProtectedRoute>} />
          <Route path="/lats/payment-analytics" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><PaymentAnalyticsPage /></RoleProtectedRoute>} />
          <Route path="/lats/beem-test" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><BeemTestPage /></RoleProtectedRoute>} />
          
          {/* Global Search Route */}
          <Route path="/search" element={<GlobalSearchPage />} />
        </Route>

        {/* Full-page routes (outside AppLayout) */}
        <Route path="/loading-demo" element={<LoadingDemoPage />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
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
  
  if (!isAuthenticated) {
    localStorage.setItem('postLoginRedirect', window.location.pathname);
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Role-based protected route component
const RoleProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  
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
  
  if (!isAuthenticated) {
    localStorage.setItem('postLoginRedirect', window.location.pathname);
    return <Navigate to="/login" />;
  }
  
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function clearAllIndexedDB() {
  const databases = ['offline-cache', 'pending-actions', 'user-goals'];
  databases.forEach(dbName => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => console.log(`Deleted database: ${dbName}`);
    request.onerror = () => console.error(`Error deleting database: ${dbName}`);
  });
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

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

  // Debug panel keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        setShowDebugPanel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
            <DevicesProvider>
              <CustomersProvider>
                <UserGoalsProvider>
                  <PaymentsProvider>
                    <LoadingProvider>
                      <GeneralSettingsProvider>
                        <BrandsProvider>
                          <SuppliersProvider>
                            <POSSettingsDatabaseSetup>
                              <AppContent 
                                isOnline={isOnline} 
                                isSyncing={isSyncing} 
                              />
                              <LoadingProgressWrapper />
                              <BackgroundDataLoader />
                            </POSSettingsDatabaseSetup>
                          </SuppliersProvider>
                        </BrandsProvider>
                      </GeneralSettingsProvider>
                    </LoadingProvider>
                  </PaymentsProvider>
                </UserGoalsProvider>
              </CustomersProvider>
            </DevicesProvider>
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
      {import.meta.env.DEV && (
        <DebugPanel 
          isVisible={showDebugPanel} 
          onToggle={() => setShowDebugPanel(prev => !prev)} 
        />
      )}
    </ErrorBoundary>
  );
}

export default App;