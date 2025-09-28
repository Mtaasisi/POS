import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import SearchBar from '../../shared/components/ui/SearchBar';
import { BackButton } from '../../shared/components/ui/BackButton';
import { 
  CreditCard, RefreshCw, Download, Settings, ShoppingCart, Search, Filter, 
  Calendar, ChevronLeft, ChevronRight, CheckSquare, Square, MoreHorizontal,
  AlertTriangle, CheckCircle, Clock, XCircle, TrendingUp, TrendingDown, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import PaymentTrackingDashboard from '../components/PaymentTrackingDashboard';
import PurchaseOrderPaymentDashboard from '../components/PurchaseOrderPaymentDashboard';
import PaymentAccountManagement from '../components/PaymentAccountManagement';

const EnhancedPaymentManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'tracking' | 'providers' | 'purchase-orders' | 'transactions'>('tracking');
  
  // Error handling
  const { errorState, handleError, clearError, withErrorHandling } = useErrorHandler({
    maxRetries: 3,
    showToast: true,
    logToConsole: true
  });

  return (
    <PageErrorBoundary pageName="Payment Management" showDetails={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
            <p className="text-gray-600">Manage payments, providers, and purchase orders</p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('tracking')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'tracking'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('providers')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'providers'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Payment Accounts
                </button>
                <button
                  onClick={() => setActiveTab('purchase-orders')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'purchase-orders'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Purchase Orders
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'tracking' && (
              <PaymentTrackingDashboard
                onViewDetails={(payment) => {
                  console.log('View payment details:', payment);
                }}
                onRefund={(payment) => {
                  console.log('Refund payment:', payment);
                }}
                onExport={() => {
                  console.log('Export data');
                }}
                onNavigateToTab={(tab) => {
                  setActiveTab(tab as 'tracking' | 'providers' | 'purchase-orders');
                }}
              />
            )}
            {activeTab === 'providers' && (
              <PaymentAccountManagement />
            )}
            {activeTab === 'purchase-orders' && (
              <PurchaseOrderPaymentDashboard
                onViewDetails={(payment) => {
                  console.log('View purchase order payment details:', payment);
                }}
                onMakePayment={(purchaseOrder) => {
                  console.log('Make payment for purchase order:', purchaseOrder);
                }}
                onExport={() => {
                  console.log('Export purchase order data');
                }}
              />
            )}
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
};

export default EnhancedPaymentManagementPage;
