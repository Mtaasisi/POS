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
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="px-3 py-2 sm:px-6 sm:py-4">
        {/* Main Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Customer Care POS</h1>
            <p className="text-xs sm:text-sm text-gray-600">Desktop Point of Sale System</p>
          </div>

          {/* Current Time & Date */}
          <div className="text-right">
            <div className="text-sm sm:text-lg font-semibold text-gray-900">
              {new Date().toLocaleTimeString('en-TZ', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              {new Date().toLocaleDateString('en-TZ', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-xs text-gray-600 sm:hidden">
              {new Date().toLocaleDateString('en-TZ', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
          {/* Left Section - Essential Actions */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
            {/* Essential Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onScanQrCode}
                className="flex items-center gap-1 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 bg-green-50 text-green-700 rounded-lg active:bg-green-100 transition-all duration-200 border border-green-200 shadow-sm touch-target"
              >
                <Scan size={16} className="sm:hidden" />
                <Scan size={18} className="hidden sm:block" />
                <span className="text-xs sm:text-sm font-medium">Scan</span>
              </button>

              {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
                <button
                  onClick={onAddCustomer}
                  className="flex items-center gap-1 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 bg-blue-50 text-blue-700 rounded-lg active:bg-blue-100 transition-all duration-200 border border-blue-200 shadow-sm touch-target"
                >
                  <Users size={16} className="sm:hidden" />
                  <Users size={18} className="hidden sm:block" />
                  <span className="text-xs sm:text-sm font-medium">Add Customer</span>
                </button>
              )}
            </div>
          </div>

          {/* Center Section - Cart Status */}
          <div className="flex items-center justify-center w-full sm:w-auto">
            {cartItemsCount > 0 ? (
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                <ShoppingCart size={18} className="text-green-600 sm:hidden" />
                <ShoppingCart size={20} className="text-green-600 hidden sm:block" />
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-medium text-green-700">Items</div>
                    <div className="text-sm sm:text-lg font-bold text-green-800">{cartItemsCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-medium text-green-700">Total</div>
                    <div className="text-sm sm:text-lg font-bold text-green-800">{formatMoney(totalAmount)}</div>
                  </div>
                </div>
                {hasSelectedCustomer && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 border border-blue-200 rounded-lg">
                    <User size={12} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 hidden sm:inline">Customer Selected</span>
                    <span className="text-xs font-medium text-blue-700 sm:hidden">Customer</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg">
                <ShoppingCart size={16} className="text-gray-500" />
                <span className="text-xs sm:text-sm text-gray-600">Empty Cart</span>
              </div>
            )}
          </div>

          {/* Right Section - All Actions */}
          <div className="flex items-center gap-3">
            {/* Analytics Button - Show when available */}
            {onViewAnalytics && (
              <button
                onClick={onViewAnalytics}
                className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-all duration-200 border border-orange-200 shadow-sm hover:shadow-md min-h-[44px] min-w-[44px]"
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
                className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all duration-200 border border-emerald-200 shadow-sm hover:shadow-md min-h-[44px] min-w-[44px]"
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
                className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 border border-blue-200 shadow-sm hover:shadow-md min-h-[44px] min-w-[44px]"
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
                className="flex items-center gap-3 px-5 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 font-semibold shadow-md min-h-[44px] min-w-[44px]"
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
                className="flex items-center gap-3 px-5 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-400 transition-all duration-200 font-semibold shadow-md min-h-[44px] min-w-[44px]"
              >
                <CreditCard size={18} />
                <span className="text-sm font-medium">{isProcessingPayment ? 'Processing...' : 'Pay'}</span>
              </button>
            )}

            {/* Clear Cart - Show when cart has items */}
            {cartItemsCount > 0 && (
              <button
                onClick={onClearCart}
                className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all duration-200 border border-red-200 shadow-sm min-h-[44px] min-w-[44px]"
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
                  className="p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Refresh Data"
                >
                  <RefreshCw size={18} />
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
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-sm border border-gray-300 min-h-[44px] min-w-[44px]"
              >
                <span className="text-white text-base font-semibold">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </button>
              
              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 mb-3 border border-gray-200">
                      <div className="p-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-white">
                        <User size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{currentUser.name}</p>
                        <p className="text-sm text-gray-600 capitalize truncate">{currentUser.role.replace('-', ' ')}</p>
                        {currentUser.email && (
                          <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} className="text-red-500" />
                        <span className="text-sm text-red-700">Logout</span>
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