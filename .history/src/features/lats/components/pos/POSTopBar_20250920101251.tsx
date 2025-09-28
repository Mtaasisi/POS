import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { rbacManager, type UserRole } from '../../lib/rbac';
import {
  ShoppingCart,
  CreditCard,
  Trash2,
  Users,
  Scan,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  User,
  FileText,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface POSTopBarProps {
  cartItemsCount: number;
  totalAmount: number;
  onProcessPayment: () => void;
  onClearCart: () => void;
  onScanQrCode: () => void;
  onAddCustomer: () => void;
  onViewReceipts: () => void;
  onViewSales: () => void;
  onOpenPaymentTracking: () => void;
  onOpenDrafts: () => void;
  isProcessingPayment: boolean;
  hasSelectedCustomer: boolean;
  draftCount?: number;
  // Bottom bar actions
  onViewAnalytics?: () => void;
  onPaymentTracking?: () => void;
  onSettings?: () => void;
  onCustomers?: () => void;
  onReports?: () => void;
  onRefreshData?: () => void;
}

const POSTopBar: React.FC<POSTopBarProps> = ({
  cartItemsCount,
  totalAmount,
  onProcessPayment,
  onClearCart,
  onScanQrCode,
  onAddCustomer,
  onViewReceipts,
  onViewSales,
  onOpenPaymentTracking,
  onOpenDrafts,
  isProcessingPayment,
  hasSelectedCustomer,
  draftCount = 0,
  // Bottom bar actions
  onViewAnalytics,
  onPaymentTracking,
  onSettings,
  onCustomers,
  onReports,
  onRefreshData,
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Permission checks for current user
  const userRole = currentUser?.role as UserRole;
  const canViewReports = rbacManager.can(userRole, 'reports', 'view');
  const canAccessSettings = rbacManager.can(userRole, 'settings', 'view');

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format money
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.log('Error attempting to exit fullscreen:', err);
      });
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-soft">
      <div className="px-6 py-4">
        {/* Main Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Customer Care POS</h1>
            <p className="text-sm text-neutral-600">Desktop Point of Sale System</p>
          </div>

          {/* Current Time & Date */}
          <div className="text-right">
            <div className="text-lg font-semibold text-neutral-900">
              {new Date().toLocaleTimeString('en-TZ', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="text-sm text-neutral-600">
              {new Date().toLocaleDateString('en-TZ', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          {/* Left Section - Essential Actions */}
          <div className="flex items-center gap-3">
            <button
                onClick={onScanQrCode}
                className="flex items-center gap-3 px-4 py-3 bg-lats-pos-50 text-lats-pos-700 rounded-lg hover:bg-lats-pos-100 transition-all duration-200 border border-lats-pos-200 shadow-soft hover:shadow-medium min-h-[44px] min-w-[44px]"
              >
                <Scan size={18} />
                <span className="text-sm font-medium">Scan</span>
              </button>

              {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
                <button
                  onClick={onAddCustomer}
                  className="flex items-center gap-3 px-4 py-3 bg-lats-customer-care-50 text-lats-customer-care-700 rounded-lg hover:bg-lats-customer-care-100 transition-all duration-200 border border-lats-customer-care-200 shadow-soft hover:shadow-medium min-h-[44px] min-w-[44px]"
                >
                  <Users size={18} />
                  <span className="text-sm font-medium">Add Customer</span>
                </button>
              )}
            </div>
          </div>

          {/* Center Section - Cart Status */}
          <div className="flex items-center gap-4">
            {cartItemsCount > 0 ? (
              <div className="flex items-center gap-3 px-6 py-3 bg-lats-pos-50 border border-lats-pos-200 rounded-xl shadow-soft">
                <ShoppingCart size={20} className="text-lats-pos-600" />
                <div className="text-center">
                  <div className="text-sm font-medium text-lats-pos-700">Cart Items</div>
                  <div className="text-lg font-bold text-lats-pos-800">{cartItemsCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-lats-pos-700">Total Amount</div>
                  <div className="text-lg font-bold text-lats-pos-800">{formatMoney(totalAmount)}</div>
                </div>
                {hasSelectedCustomer && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-lats-customer-care-100 border border-lats-customer-care-200 rounded-lg">
                    <User size={14} className="text-lats-customer-care-600" />
                    <span className="text-xs font-medium text-lats-customer-care-700">Customer Selected</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 border border-neutral-200 rounded-lg">
                <ShoppingCart size={16} className="text-neutral-500" />
                <span className="text-sm text-neutral-600">Empty Cart</span>
              </div>
            )}
          </div>

          {/* Right Section - All Actions */}
          <div className="flex items-center gap-3">
            {/* Analytics Button - Show when available */}
            {onViewAnalytics && (
              <button
                onClick={onViewAnalytics}
                className="flex items-center gap-3 px-4 py-3 bg-lats-analytics-50 text-lats-analytics-700 rounded-lg hover:bg-lats-analytics-100 transition-all duration-200 border border-lats-analytics-200 shadow-soft hover:shadow-medium min-h-[44px] min-w-[44px]"
                title="View Analytics"
              >
                <BarChart3 size={18} />
                <span className="text-sm font-medium">Analytics</span>
              </button>
            )}

            {/* Payment Tracking Button - Show when available */}
            {onPaymentTracking && (
              <button
                onClick={onPaymentTracking}
                className="flex items-center gap-3 px-4 py-3 bg-lats-finance-50 text-lats-finance-700 rounded-lg hover:bg-lats-finance-100 transition-all duration-200 border border-lats-finance-200 shadow-soft hover:shadow-medium min-h-[44px] min-w-[44px]"
                title="Payment Tracking"
              >
                <FileText size={18} />
                <span className="text-sm font-medium">Payments</span>
              </button>
            )}

            {/* Customers Button - Show when available */}
            {onCustomers && (
              <button
                onClick={onCustomers}
                className="flex items-center gap-3 px-4 py-3 bg-lats-customer-care-50 text-lats-customer-care-700 rounded-lg hover:bg-lats-customer-care-100 transition-all duration-200 border border-lats-customer-care-200 shadow-soft hover:shadow-medium min-h-[44px] min-w-[44px]"
                title="Manage Customers"
              >
                <Users size={18} />
                <span className="text-sm font-medium">Customers</span>
              </button>
            )}

            {/* Reports Button - Show when available */}
            {onReports && (
              <button
                onClick={onReports}
                className="flex items-center gap-3 px-5 py-3 bg-lats-analytics-500 text-white rounded-lg hover:bg-lats-analytics-600 transition-all duration-200 font-semibold shadow-glow min-h-[44px] min-w-[44px]"
                title="Sales Reports"
              >
                <BarChart3 size={18} />
                <span className="text-sm font-medium">Reports</span>
              </button>
            )}

            {/* Payment Processing - Show when cart has items */}
            {cartItemsCount > 0 && (
              <button
                onClick={onProcessPayment}
                disabled={isProcessingPayment}
                className="flex items-center gap-3 px-5 py-3 bg-lats-finance-500 text-white rounded-lg hover:bg-lats-finance-600 disabled:bg-neutral-400 transition-all duration-200 font-semibold shadow-glow-green hover:shadow-glow-green min-h-[44px] min-w-[44px]"
              >
                <CreditCard size={18} />
                <span className="text-sm font-medium">{isProcessingPayment ? 'Processing...' : 'Pay'}</span>
              </button>
            )}

            {/* Clear Cart - Show when cart has items */}
            {cartItemsCount > 0 && (
              <button
                onClick={onClearCart}
                className="flex items-center gap-3 px-4 py-3 bg-error-50 text-error-700 rounded-lg hover:bg-error-100 transition-all duration-200 border border-error-200 shadow-soft min-h-[44px] min-w-[44px]"
                title="Clear Cart"
              >
                <Trash2 size={18} />
                <span className="text-sm font-medium">Clear</span>
              </button>
            )}

            {/* System Actions */}
            <div className="flex items-center gap-2">
              {/* Refresh Data - Show when available */}
              {onRefreshData && (
                <button
                  onClick={onRefreshData}
                  className="p-3 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-all duration-200 shadow-soft min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Refresh Data"
                >
                  <RefreshCw size={18} />
                </button>
              )}

              {/* Settings - Show when available */}
              {onSettings && (
                <button
                  onClick={onSettings}
                  className="p-3 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-all duration-200 shadow-soft min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Settings"
                >
                  <Settings size={18} />
                </button>
              )}

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-3 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-all duration-200 shadow-soft min-h-[44px] min-w-[44px] flex items-center justify-center"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 hover:from-neutral-600 hover:to-neutral-700 transition-all duration-300 shadow-soft border border-neutral-300 min-h-[44px] min-w-[44px]"
              >
                <span className="text-white text-base font-semibold">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </button>
              
              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-neutral-200 z-50">
                  <div className="p-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-50 mb-3 border border-neutral-200">
                      <div className="p-2 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 text-white">
                        <User size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{currentUser.name}</p>
                        <p className="text-sm text-neutral-600 capitalize truncate">{currentUser.role.replace('-', ' ')}</p>
                        {currentUser.email && (
                          <p className="text-xs text-neutral-500 truncate">{currentUser.email}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {canAccessSettings && (
                        <button
                          onClick={() => {
                            navigate('/settings');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          <Settings size={16} className="text-neutral-500" />
                          <span className="text-sm text-neutral-700">Settings</span>
                        </button>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-error-50 transition-colors"
                      >
                        <LogOut size={16} className="text-error-500" />
                        <span className="text-sm text-error-700">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default POSTopBar;