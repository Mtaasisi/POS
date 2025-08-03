import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DevicesProvider, useDevices } from './context/DevicesContext';
import { CustomersProvider, useCustomers } from './context/CustomersContext';
import { UserGoalsProvider } from './context/UserGoalsContext';
import { PaymentsProvider } from './context/PaymentsContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

import BackgroundSelector from './components/BackgroundSelector';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewDevicePage from './pages/NewDevicePage';

import DeviceDetailPage from './pages/DeviceDetailPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import AppLayout from './layout/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import SettingsPage from './pages/SettingsPage';
import SMSControlCenterPage from './pages/SMSControlCenterPage';
import PointsManagementPage from './pages/PointsManagementPage';
import PaymentsReportPage from './pages/PaymentsReportPage';
import AuditLogsPage from './pages/AuditLogsPage';
import FinanceManagementPage from './pages/FinanceManagementPage';
import { getPendingActions, clearPendingActions } from './lib/offlineSync';
import { supabase } from './lib/supabaseClient';
import { reminderService } from './lib/reminderService';
import { initializeCache } from './lib/offlineCache';
import WhatsAppManagerPage from './pages/WhatsAppManagerPage';
import NewDiagnosticRequestPage from './pages/NewDiagnosticRequestPage';
import AssignedDiagnosticsPage from './pages/AssignedDiagnosticsPage';
import DiagnosticRequestDetailPage from './pages/DiagnosticRequestDetailPage';
import DiagnosticDevicePage from './pages/DiagnosticDevicePage';
import DiagnosticReportsPage from './pages/DiagnosticReportsPage';
import DiagnosticTemplatesPage from './pages/DiagnosticTemplatesPage';
import CustomerCareDiagnosticsPage from './pages/CustomerCareDiagnosticsPage';
import DiagnosticGroupedDevicesPage from './pages/DiagnosticGroupedDevicesPage';


import BrandManagementPage from './pages/BrandManagementPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import DatabaseSetupPage from './pages/DatabaseSetupPage';
import ExcelImportPage from './pages/ExcelImportPage';
import AdminDashboard from './components/admin-dashboard/AdminDashboard';
import InventoryPage from './pages/InventoryPage';
import NewInventoryPage from './pages/NewInventoryPage';
import InventoryManagementPage from './pages/InventoryManagementPage';
import ProductDetailPage from './pages/ProductDetailPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import NewPurchaseOrderPage from './pages/NewPurchaseOrderPage';
import SparePartsPage from './pages/SparePartsPage';
import SparePartForm from './components/forms/SparePartForm';
import CustomerDataUpdatePage from './pages/CustomerDataUpdatePage';

import { BackupManagementPage } from './pages/BackupManagementPage';
import POSPage from './pages/POSPage';

// AppContent component that handles the sync logic and routes
const AppContent: React.FC<{ isOnline: boolean; isSyncing: boolean }> = ({ isOnline, isSyncing }) => {
  const { addCustomer } = useCustomers();
  const { assignToTechnician, updateDeviceStatus } = useDevices();

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
          <Route path="/admin-dashboard" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminDashboard /></RoleProtectedRoute>} />

          <Route path="/devices/new" element={<NewDevicePage />} />
          <Route path="/devices/:id" element={<DeviceDetailPage />} />



        <Route path="/brand-management" element={<RoleProtectedRoute allowedRoles={['admin']}><BrandManagementPage /></RoleProtectedRoute>} />
        <Route path="/category-management" element={<RoleProtectedRoute allowedRoles={['admin']}><CategoryManagementPage /></RoleProtectedRoute>} />
        <Route path="/database-setup" element={<RoleProtectedRoute allowedRoles={['admin']}><DatabaseSetupPage /></RoleProtectedRoute>} />
        <Route path="/customers/import" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><ExcelImportPage /></RoleProtectedRoute>} />
        <Route path="/excel-import" element={<RoleProtectedRoute allowedRoles={['admin']}><ExcelImportPage /></RoleProtectedRoute>} />

          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/update-data" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><CustomerDataUpdatePage /></RoleProtectedRoute>} />

          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
<Route path="/inventory/new" element={<NewInventoryPage />} />

<Route path="/inventory/management" element={<RoleProtectedRoute allowedRoles={['admin']}><InventoryManagementPage /></RoleProtectedRoute>} />
<Route path="/inventory/products/:id" element={<ProductDetailPage />} />
          <Route path="/inventory/purchase-orders" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><PurchaseOrdersPage /></RoleProtectedRoute>} />
          <Route path="/inventory/purchase-orders/new" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><NewPurchaseOrderPage /></RoleProtectedRoute>} />
          
          {/* Spare Parts Routes */}
          <Route path="/spare-parts" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><SparePartsPage /></RoleProtectedRoute>} />
          <Route path="/spare-parts/new" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><SparePartForm /></RoleProtectedRoute>} />
          <Route path="/spare-parts/:id/edit" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><SparePartForm /></RoleProtectedRoute>} />
          <Route path="/sms" element={<RoleProtectedRoute allowedRoles={['admin']}><SMSControlCenterPage /></RoleProtectedRoute>} />
          <Route path="/points-management" element={<RoleProtectedRoute allowedRoles={['admin']}><PointsManagementPage /></RoleProtectedRoute>} />
          <Route path="/payments-report" element={<RoleProtectedRoute allowedRoles={['admin']}><PaymentsReportPage /></RoleProtectedRoute>} />
          <Route path="/audit-logs" element={<RoleProtectedRoute allowedRoles={['admin']}><AuditLogsPage /></RoleProtectedRoute>} />
          <Route path="/finance" element={<RoleProtectedRoute allowedRoles={['admin']}><FinanceManagementPage /></RoleProtectedRoute>} />
          <Route path="/pos" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><POSPage /></RoleProtectedRoute>} />
          <Route path="/backup-management" element={<RoleProtectedRoute allowedRoles={['admin']}><BackupManagementPage /></RoleProtectedRoute>} />
          <Route path="/whatsapp" element={<RoleProtectedRoute allowedRoles={['admin']}><WhatsAppManagerPage /></RoleProtectedRoute>} />
          <Route path="/whatsapp-manager" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><WhatsAppManagerPage /></RoleProtectedRoute>} />
          
          {/* Diagnostics Routes */}
          <Route path="/diagnostics/new" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><NewDiagnosticRequestPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/my-requests" element={<RoleProtectedRoute allowedRoles={['admin', 'customer-care']}><CustomerCareDiagnosticsPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/assigned" element={<RoleProtectedRoute allowedRoles={['technician']}><AssignedDiagnosticsPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/request/:requestId" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><DiagnosticRequestDetailPage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/device/:requestId/:deviceId" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><DiagnosticDevicePage /></RoleProtectedRoute>} />
          <Route path="/diagnostics/reports" element={<RoleProtectedRoute allowedRoles={['admin', 'technician']}><DiagnosticReportsPage /></RoleProtectedRoute>} />
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
        </Route>
        
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
                    <AppContent 
                      isOnline={isOnline} 
                      isSyncing={isSyncing} 
                    />
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