import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { rbacManager, type UserRole } from '../../lib/rbac';
import {
  Search,
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
} from 'lucide-react';
import SearchDropdown from '../../../shared/components/SearchDropdown';
import { toast } from 'react-hot-toast';

interface POSTopBarProps {
  cartItemsCount: number;
  totalAmount: number;
  onProcessPayment: () => void;
  onClearCart: () => void;
  onSearch: (query: string) => void;
  onScanQrCode: () => void;
  onAddCustomer: () => void;
  onViewReceipts: () => void;
  onViewSales: () => void;
  onOpenPaymentTracking: () => void;
  onOpenDrafts: () => void;
  isProcessingPayment: boolean;
  hasSelectedCustomer: boolean;
  draftCount?: number;
}

const POSTopBar: React.FC<POSTopBarProps> = ({
  cartItemsCount,
  totalAmount,
  onProcessPayment,
  onClearCart,
  onSearch,
  onScanQrCode,
  onAddCustomer,
  onViewReceipts,
  onViewSales,
  onOpenPaymentTracking,
  onOpenDrafts,
  isProcessingPayment,
  hasSelectedCustomer,
  draftCount = 0,
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
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
          {/* Left Section - Search & Essential Actions */}
          <div className="flex items-center gap-4">
            <SearchDropdown 
              placeholder="Search products, customers, or scan barcode..."
              className="w-80"
            />
            
            {/* Essential Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onScanQrCode}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
              >
                <Scan size={16} />
                <span className="text-sm font-medium">Scan</span>
              </button>

              {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
                <button
                  onClick={onAddCustomer}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <Users size={16} />
                  <span className="text-sm font-medium">Add Customer</span>
                </button>
              )}
            </div>
          </div>

          {/* Center Section - Cart Status */}
          <div className="flex items-center gap-4">
            {cartItemsCount > 0 ? (
              <div className="flex items-center gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                <ShoppingCart size={20} className="text-green-600" />
                <div className="text-center">
                  <div className="text-sm font-medium text-green-700">Cart Items</div>
                  <div className="text-lg font-bold text-green-800">{cartItemsCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-green-700">Total Amount</div>
                  <div className="text-lg font-bold text-green-800">{formatMoney(totalAmount)}</div>
                </div>
                {hasSelectedCustomer && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 border border-blue-200 rounded-lg">
                    <User size={14} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Customer Selected</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg">
                <ShoppingCart size={16} className="text-gray-500" />
                <span className="text-sm text-gray-600">Empty Cart</span>
              </div>
            )}
          </div>

          {/* Right Section - Customer Care Actions */}
          <div className="flex items-center gap-3">
            {/* Payment Processing */}
            {cartItemsCount > 0 && (
              <button
                onClick={onProcessPayment}
                disabled={isProcessingPayment}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors font-semibold shadow-lg"
              >
                <CreditCard size={18} />
                <span>{isProcessingPayment ? 'Processing...' : 'Process Payment'}</span>
              </button>
            )}

            {/* Clear Cart */}
            {cartItemsCount > 0 && (
              <button
                onClick={onClearCart}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
              >
                <Trash2 size={16} />
                <span className="text-sm font-medium">Clear</span>
              </button>
            )}

            {/* Quick Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/lats/sales-reports')}
                className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                title="Sales Reports"
              >
                <BarChart3 size={18} />
              </button>
              
              <button
                onClick={() => navigate('/lats/customers')}
                className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                title="Customer Management"
              >
                <Users size={18} />
              </button>
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="text-gray-700 text-sm font-semibold">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </button>
              
              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 mb-2">
                      <div className="p-2 rounded-full bg-gray-200">
                        <User size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">{currentUser.name}</p>
                        <p className="text-xs text-gray-600 capitalize truncate">{currentUser.role.replace('-', ' ')}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {canAccessSettings && (
                        <button
                          onClick={() => {
                            navigate('/settings');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        >
                          <Settings size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-700">Settings</span>
                        </button>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={14} className="text-red-500" />
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