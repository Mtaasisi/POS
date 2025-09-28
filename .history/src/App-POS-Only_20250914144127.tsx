import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DevicesProvider, useDevices } from './context/DevicesContext';
import { CustomersProvider, useCustomers } from './context/CustomersContext';
import { PaymentsProvider } from './context/PaymentsContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import { GeneralSettingsProvider } from './context/GeneralSettingsContext';
import { PaymentMethodsProvider } from './context/PaymentMethodsContext';
import { Toaster } from 'react-hot-toast';

// Import only POS-related components
import GlobalLoadingProgress from './features/shared/components/ui/GlobalLoadingProgress';
import LoginPage from './features/shared/pages/LoginPage';
import DashboardPage from './features/shared/pages/DashboardPage';
import AppLayout from './layout/AppLayout';
import { ErrorBoundary } from './features/shared/components/ErrorBoundary';
import DynamicImportErrorBoundary from './features/shared/components/DynamicImportErrorBoundary';
import UrlValidatedRoute from './components/UrlValidatedRoute';

// Lazy load POS components
const POSPage = lazy(() => import('./features/lats/pages/MobilePOSPage'));
const UnifiedInventoryPage = lazy(() => import('./features/lats/pages/UnifiedInventoryPage'));
const AddProductPage = lazy(() => import('./features/lats/pages/AddProductPage'));
const EditProductPage = lazy(() => import('./features/lats/pages/EditProductPage'));
const ProductDetailPage = lazy(() => import('./features/lats/pages/ProductDetailPage'));
const SalesReportsPage = lazy(() => import('./features/lats/pages/SalesReportsPage'));
const CustomerLoyaltyPage = lazy(() => import('./features/lats/pages/CustomerLoyaltyPage'));
const PaymentTrackingPage = lazy(() => import('./features/lats/pages/PaymentTrackingPage'));

// Customer management (needed for POS)
const CustomersPage = lazy(() => import('./features/customers/pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./features/customers/pages/CustomerDetailPage'));

// Settings (minimal for POS)
const SettingsPage = lazy(() => import('./features/settings/pages/UnifiedSettingsPage'));

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
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setHasError(false);
  }, []);
  
  let isAuthenticated = false;
  let loading = true;
  
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    loading = auth.loading;
  } catch (error) {
    console.warn('Auth context not available during hot reload:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }
  
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

// AppContent component for POS-only routes
const AppContent: React.FC<{ isOnline: boolean; isSyncing: boolean }> = ({ isOnline, isSyncing }) => {
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
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="/dashboard" element={<Navigate to="/pos" replace />} />

          {/* POS Routes */}
          <Route path="/pos" element={
            <ErrorBoundary fallback={DynamicImportErrorFallback}>
              <Suspense fallback={<PageLoadingSpinner />}>
                <POSPage />
              </Suspense>
            </ErrorBoundary>
          } />

          {/* Inventory Routes (needed for POS) */}
          <Route path="/inventory" element={
            <ErrorBoundary fallback={DynamicImportErrorFallback}>
              <Suspense fallback={<PageLoadingSpinner />}>
                <UnifiedInventoryPage />
              </Suspense>
            </ErrorBoundary>
          } />
          
          <Route path="/add-product" element={
            <Suspense fallback={<PageLoadingSpinner />}>
              <AddProductPage />
            </Suspense>
          } />
          
          <Route path="/products/:productId/edit" element={
            <UrlValidatedRoute enableImageUrlValidation={true} enableUrlLogging={false}>
              <Suspense fallback={<PageLoadingSpinner />}>
                <EditProductPage />
              </Suspense>
            </UrlValidatedRoute>
          } />
          
          <Route path="/products/:id" element={
            <UrlValidatedRoute enableImageUrlValidation={true} enableUrlLogging={false}>
              <ProductDetailPage />
            </UrlValidatedRoute>
          } />

          {/* Customer Routes (needed for POS) */}
          <Route path="/customers" element={
            <ErrorBoundary fallback={DynamicImportErrorFallback}>
              <Suspense fallback={<PageLoadingSpinner />}>
                <CustomersPage />
              </Suspense>
            </ErrorBoundary>
          } />

          {/* Sales & Reports Routes */}
          <Route path="/sales-reports" element={
            <Suspense fallback={<PageLoadingSpinner />}>
              <SalesReportsPage />
            </Suspense>
          } />
          
          <Route path="/loyalty" element={
            <Suspense fallback={<PageLoadingSpinner />}>
              <CustomerLoyaltyPage />
            </Suspense>
          } />
          
          <Route path="/payments" element={
            <Suspense fallback={<PageLoadingSpinner />}>
              <PaymentTrackingPage />
            </Suspense>
          } />

          {/* Settings Route (minimal) */}
          <Route path="/settings" element={
            <Suspense fallback={<PageLoadingSpinner />}>
              <SettingsPage />
            </Suspense>
          } />
        </Route>

        {/* Redirect all other routes to POS */}
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </>
  );
};

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, _setIsSyncing] = useState(false);

  // Global scroll position persistence
  useEffect(() => {
    const saved = sessionStorage.getItem(`scroll-pos-${window.location.pathname}`);
    if (saved) {
      window.scrollTo(0, parseInt(saved, 10));
    }
    const saveScroll = () => {
      sessionStorage.setItem(`scroll-pos-${window.location.pathname}`, String(window.scrollY));
    };
    window.addEventListener('beforeunload', saveScroll);
    window.addEventListener('popstate', saveScroll);
    return () => {
      window.removeEventListener('beforeunload', saveScroll);
      window.removeEventListener('popstate', saveScroll);
      saveScroll();
    };
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
                <PaymentsProvider>
                  <PaymentMethodsProvider>
                    <LoadingProvider>
                      <GeneralSettingsProvider>
                        <AppContent 
                          isOnline={isOnline} 
                          isSyncing={isSyncing} 
                        />
                        <LoadingProgressWrapper />
                      </GeneralSettingsProvider>
                    </LoadingProvider>
                  </PaymentMethodsProvider>
                </PaymentsProvider>
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
