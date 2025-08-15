import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DevicesProvider, useDevices } from './context/DevicesContext';
import { CustomersProvider, useCustomers } from './context/CustomersContext';
import { UserGoalsProvider } from './context/UserGoalsContext';
import { PaymentsProvider } from './context/PaymentsContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';
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
import AppLayout from './layout/AppLayout';
import { ErrorBoundary } from './features/shared/components/ErrorBoundary';
import SettingsPage from './features/settings/pages/SettingsPage';
import AdminSettingsPage from './features/admin/pages/AdminSettingsPage';
import SMSControlCenterPage from './features/reports/pages/SMSControlCenterPage';
import PointsManagementPage from './features/finance/pages/PointsManagementPage';
import PaymentsReportPage from './features/finance/pages/PaymentsReportPage';
import AuditLogsPage from './features/admin/pages/AuditLogsPage';
import FinanceManagementPage from './features/finance/pages/FinanceManagementPage';
import PaymentsAccountsPage from './features/finance/pages/PaymentsAccountsPage';
import { getPendingActions, clearPendingActions } from './lib/offlineSync';
import { supabase } from './lib/supabaseClient';
import { reminderService } from './lib/reminderService';
import { initializeCache } from './lib/offlineCache';
import WhatsAppWebPage from './features/whatsapp/pages/WhatsAppWebPage';
import NewDiagnosticRequestPage from './features/diagnostics/pages/NewDiagnosticRequestPage';
import AssignedDiagnosticsPage from './features/diagnostics/pages/AssignedDiagnosticsPage';
import DiagnosticRequestDetailPage from './features/diagnostics/pages/DiagnosticRequestDetailPage';
import DiagnosticDevicePage from './features/diagnostics/pages/DiagnosticDevicePage';
import DiagnosticReportsPage from './features/diagnostics/pages/DiagnosticReportsPage';
import DiagnosticTemplatesPage from './features/diagnostics/pages/DiagnosticTemplatesPage';
import CustomerCareDiagnosticsPage from './features/customers/pages/CustomerCareDiagnosticsPage';
import DiagnosticGroupedDevicesPage from './features/diagnostics/pages/DiagnosticGroupedDevicesPage';


import BrandManagementPage from './features/settings/pages/BrandManagementPage';
import CategoryManagementPage from './features/settings/pages/CategoryManagementPage';
import DatabaseSetupPage from './features/admin/pages/DatabaseSetupPage';
import ExcelImportPage from './features/reports/pages/ExcelImportPage';
import BackupManagementPage from './features/backup/pages/BackupManagementPage';

import CustomerDataUpdatePage from './features/customers/pages/CustomerDataUpdatePage';
import CustomerAnalyticsPage from './features/customers/pages/CustomerAnalyticsPage';
import NetworkDiagnostic from './components/NetworkDiagnostic';
import LoadingDemoPage from './features/shared/pages/LoadingDemoPage';
import POSPage from './features/lats/pages/POSPage';

// New feature imports
import UserManagementPage from './features/users/pages/UserManagementPage';
import AppointmentPage from './features/appointments/pages/AppointmentPage';
import ServiceManagementPage from './features/services/pages/ServiceManagementPage';
import EmployeeManagementPage from './features/employees/pages/EmployeeManagementPage';
import EmployeeAttendancePage from './features/employees/pages/EmployeeAttendancePage';
import LocationTestPage from './features/employees/pages/LocationTestPage';
import AdvancedAnalyticsPage from './features/analytics/pages/AdvancedAnalyticsPage';
import CalendarViewPage from './features/calendar/pages/CalendarViewPage';
import MobileOptimizationPage from './features/mobile/pages/MobileOptimizationPage';
import AdminManagementPage from './features/admin/pages/AdminManagementPage';
import BusinessManagementPage from './features/business/pages/BusinessManagementPage';
import SalesAnalyticsPage from './features/lats/pages/SalesAnalyticsPage';
import InventoryPage from './features/lats/pages/InventoryPage';
import ProductCatalogPage from './features/lats/pages/ProductCatalogPage';
import UnifiedInventoryPage from './features/lats/pages/UnifiedInventoryPage';

import ProductDetailPage from './features/lats/pages/ProductDetailPage';

import SalesReportsPage from './features/lats/pages/SalesReportsPage';
import CustomerLoyaltyPage from './features/lats/pages/CustomerLoyaltyPage';
import PaymentTrackingPage from './features/lats/pages/PaymentTrackingPage';
import BusinessAnalyticsPage from './features/lats/pages/BusinessAnalyticsPage';
import LATSDashboardPage from './features/lats/pages/LATSDashboardPage';
import PurchaseOrdersPage from './features/lats/pages/PurchaseOrdersPage';
import NewPurchaseOrderPage from './features/lats/pages/NewPurchaseOrderPage';
import PurchaseOrderDetailPage from './features/lats/pages/PurchaseOrderDetailPage';
import SparePartsPage from './features/lats/pages/SparePartsPage';
import QuickCashPage from './features/lats/pages/QuickCashPage';
import QuickCashDemoPage from './features/lats/pages/QuickCashDemoPage';
import VariantSelectionPage from './features/lats/pages/VariantSelectionPage';
import ZenoPayTestPage from './features/lats/pages/ZenoPayTestPage';
import GlobalSearchPage from './features/shared/pages/GlobalSearchPage';
import { initializeDatabaseCheck } from './lib/databaseUtils';



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

  // Initialize database check on app startup
  useEffect(() => {
    initializeDatabaseCheck().catch(console.error);
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

        <Route path="/database-setup" element={<RoleProtectedRoute allowedRoles={['admin']}><DatabaseSetupPage /></RoleProtectedRoute>} />
        <Route path="/backup-management" element={<RoleProtectedRoute allowedRoles={['admin']}><BackupManagementPage /></RoleProtectedRoute>} />
        <Route path="/customers/import" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ExcelImportPage /></RoleProtectedRoute>} />
        <Route path="/excel-import" element={<RoleProtectedRoute allowedRoles={['admin']}><ExcelImportPage /></RoleProtectedRoute>} />

          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/analytics" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><CustomerAnalyticsPage /></RoleProtectedRoute>} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/update-data" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><CustomerDataUpdatePage /></RoleProtectedRoute>} />

          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/sms" element={<RoleProtectedRoute allowedRoles={['admin']}><SMSControlCenterPage /></RoleProtectedRoute>} />
          <Route path="/points-management" element={<RoleProtectedRoute allowedRoles={['admin']}><PointsManagementPage /></RoleProtectedRoute>} />
          <Route path="/payments-report" element={<RoleProtectedRoute allowedRoles={['admin']}><PaymentsReportPage /></RoleProtectedRoute>} />
          <Route path="/admin-settings" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></RoleProtectedRoute>} />
          <Route path="/audit-logs" element={<RoleProtectedRoute allowedRoles={['admin']}><AuditLogsPage /></RoleProtectedRoute>} />
          <Route path="/finance" element={<RoleProtectedRoute allowedRoles={['admin']}><FinanceManagementPage /></RoleProtectedRoute>} />
          <Route path="/payments-accounts" element={<RoleProtectedRoute allowedRoles={['admin']}><PaymentsAccountsPage /></RoleProtectedRoute>} />
          
          {/* User Management Routes */}
          <Route path="/users" element={<RoleProtectedRoute allowedRoles={['admin']}><UserManagementPage /></RoleProtectedRoute>} />
          
          {/* Appointment Management Routes */}
          <Route path="/appointments" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><AppointmentPage /></RoleProtectedRoute>} />
          
          {/* Service Management Routes */}
          <Route path="/services" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ServiceManagementPage /></RoleProtectedRoute>} />
          
          {/* Employee Management Routes */}
          <Route path="/employees" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><EmployeeManagementPage /></RoleProtectedRoute>} />
          <Route path="/attendance" element={<RoleProtectedRoute allowedRoles={['admin', 'manager', 'technician', 'customer-care']}><EmployeeAttendancePage /></RoleProtectedRoute>} />
          <Route path="/location-test" element={<RoleProtectedRoute allowedRoles={['admin', 'manager', 'technician', 'customer-care']}><LocationTestPage /></RoleProtectedRoute>} />
          
          {/* Advanced Analytics Routes */}
          <Route path="/analytics" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><AdvancedAnalyticsPage /></RoleProtectedRoute>} />
          
          {/* Calendar View Routes */}
          <Route path="/calendar" element={<RoleProtectedRoute allowedRoles={['admin', 'manager', 'customer-care']}><CalendarViewPage /></RoleProtectedRoute>} />
          
          {/* Mobile Optimization Routes */}
          <Route path="/mobile" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><MobileOptimizationPage /></RoleProtectedRoute>} />
          
          {/* Consolidated Management Routes */}
          <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminManagementPage /></RoleProtectedRoute>} />
          <Route path="/business" element={<RoleProtectedRoute allowedRoles={['admin', 'manager', 'customer-care']}><BusinessManagementPage /></RoleProtectedRoute>} />

          <Route path="/whatsapp" element={<RoleProtectedRoute allowedRoles={['admin']}><WhatsAppWebPage /></RoleProtectedRoute>} />
          <Route path="/whatsapp-manager" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><WhatsAppWebPage /></RoleProtectedRoute>} />
          <Route path="/whatsapp-web" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><WhatsAppWebPage /></RoleProtectedRoute>} />
          
          {/* Diagnostics Routes */}
          <Route path="/diagnostics/new" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><NewDiagnosticRequestPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/new-request" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><NewDiagnosticRequestPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/my-requests" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><CustomerCareDiagnosticsPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/assigned" element={<RoleProtectedRoute allowedRoles={['technician']}><AssignedDiagnosticsPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/request/:requestId" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><DiagnosticRequestDetailPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/device/:requestId/:deviceId" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><DiagnosticDevicePage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/grouped/:requestId/:deviceName/:model" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><DiagnosticGroupedDevicesPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/reports" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><DiagnosticReportsPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/templates" element={<RoleProtectedRoute allowedRoles={['admin']}><DiagnosticTemplatesPage /></RoleProtectedRoute>} />
          
          {/* LATS POS Route */}
          <Route path="/pos" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><POSPage /></RoleProtectedRoute>} />
          <Route path="/lats/pos" element={<Navigate to="/pos" replace />} />
          
          {/* LATS Module Routes */}
          <Route path="/lats" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><LATSDashboardPage /></RoleProtectedRoute>} />
          <Route path="/lats/sales-analytics" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><SalesAnalyticsPage /></RoleProtectedRoute>} />
          
          {/* Primary Unified Inventory Route */}
          <Route path="/lats/unified-inventory" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><UnifiedInventoryPage /></RoleProtectedRoute>} />
          
          {/* Redirect old inventory routes to unified inventory */}
          <Route path="/lats/inventory" element={<Navigate to="/lats/unified-inventory" replace />} />
          <Route path="/lats/products" element={<Navigate to="/lats/unified-inventory" replace />} />
          
          {/* Keep product detail route for individual product views */}
          <Route path="/lats/products/:id" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ProductDetailPage /></RoleProtectedRoute>} />

          <Route path="/lats/sales-reports" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><SalesReportsPage /></RoleProtectedRoute>} />
          <Route path="/lats/loyalty" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><CustomerLoyaltyPage /></RoleProtectedRoute>} />
          <Route path="/lats/payments" element={<RoleProtectedRoute allowedRoles={['admin']}><PaymentTrackingPage /></RoleProtectedRoute>} />
          <Route path="/lats/analytics" element={<RoleProtectedRoute allowedRoles={['admin']}><BusinessAnalyticsPage /></RoleProtectedRoute>} />
          <Route path="/lats/purchase-orders" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><PurchaseOrdersPage /></RoleProtectedRoute>} />
          <Route path="/lats/purchase-orders/new" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><NewPurchaseOrderPage /></RoleProtectedRoute>} />
          <Route path="/lats/quick-cash" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><QuickCashPage /></RoleProtectedRoute>} />
          <Route path="/lats/quick-cash-demo" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><QuickCashDemoPage /></RoleProtectedRoute>} />
          <Route path="/lats/variant-selection" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><VariantSelectionPage /></RoleProtectedRoute>} />
          <Route path="/lats/purchase-orders/:id" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><PurchaseOrderDetailPage /></RoleProtectedRoute>} />
          <Route path="/lats/spare-parts" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><SparePartsPage /></RoleProtectedRoute>} />
          
          {/* ZenoPay Test Route */}
          <Route path="/lats/zenopay-test" element={<RoleProtectedRoute allowedRoles={['admin']}><ZenoPayTestPage /></RoleProtectedRoute>} />
          
          {/* Global Search Route */}
          <Route path="/search" element={<GlobalSearchPage />} />
        </Route>

        {/* Full-page routes (outside AppLayout) */}
        <Route path="/network-diagnostic" element={<NetworkDiagnostic />} />
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
                      <AppContent 
                        isOnline={isOnline} 
                        isSyncing={isSyncing} 
                      />
                      <LoadingProgressWrapper />
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
    </ErrorBoundary>
  );
}

export default App;