import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useNavigationHistory } from '../../../../hooks/useNavigationHistory';
import { rbacManager, type UserRole } from '../../lib/rbac';
import {
  Search,
  ShoppingCart,
  CreditCard,
  Receipt,
  Trash2,
  Package,
  Users,
  Plus,
  Scan,
  Calculator,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Settings,
  LogOut,
  User,
  Bell,
  FileText,
  Crown,
  Warehouse,
  BarChart3,
  Activity,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import SearchDropdown from '../../../shared/components/SearchDropdown';

interface POSTopBarProps {
  cartItemsCount: number;
  totalAmount: number;
  productsCount: number;
  salesCount: number;
  onProcessPayment: () => void;
  onClearCart: () => void;
  onSearch: (query: string) => void;
  onScanBarcode: () => void;
  onAddCustomer: () => void;
  onAddProduct: () => void;
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
  productsCount,
  salesCount,
  onProcessPayment,
  onClearCart,
  onSearch,
  onScanBarcode,
  onAddCustomer,
  onAddProduct,
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
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { handleBackClick, previousPage } = useNavigationHistory();

  // Permission checks for current user
  const userRole = currentUser?.role as UserRole;
  const canAccessInventory = rbacManager.can(userRole, 'inventory', 'view');
  const canViewReports = rbacManager.can(userRole, 'reports', 'view');
  const canAccessSettings = rbacManager.can(userRole, 'settings', 'view');
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);



  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format numbers like Instagram followers (1K, 1.2K, etc.)
  const formatNumber = (num: number): string => {
    if (num < 1000) return num.toString();
    if (num < 10000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (num < 1000000) return Math.round(num / 1000) + 'K';
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  };

  // Format money
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper function to handle restricted feature access
  const handleRestrictedAccess = (featureName: string) => {
    toast.error(`You don't have permission to access ${featureName}. Contact your administrator.`);
  };



  const getQuickActions = () => {
    const actions = [];
    
    if (currentUser.role === 'admin' || currentUser.role === 'customer-care') {
      actions.push(
        { label: 'Add Customer', icon: <Users size={16} />, action: onAddCustomer },
        { label: 'Add Product', icon: <Package size={16} />, action: onAddProduct },
        { label: 'Scan Barcode', icon: <Scan size={16} />, action: onScanBarcode }
      );
    }
    
    if (currentUser.role === 'admin') {
      actions.push(
        { label: 'View Sales', icon: <TrendingUp size={16} />, action: onViewSales },
        { label: 'View Receipts', icon: <Receipt size={16} />, action: onViewReceipts }
      );
    }
    
    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <header className="sticky top-0 z-20 transition-all duration-500">
      {/* Main TopBar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/30 shadow-lg">
        <div className="flex items-center justify-between px-4 py-4">
          {/* Left Section - Back Button & Search */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            {/* Back Button */}
            <button
              onClick={handleBackClick}
              className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm"
              title={previousPage ? "Go Back" : "Go to Dashboard"}
            >
              <ArrowLeft size={18} className="text-gray-700" />
            </button>
            
            <SearchDropdown 
              placeholder="Search products, customers..."
              className="flex-1"
            />
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100/50 text-gray-500 text-xs">
              <span>⌘K</span>
            </div>
          </div>

          {/* Center Section - Activity Pills */}
          <div className="hidden lg:flex items-center gap-2">
            {cartItemsCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-blue-100 text-blue-700 backdrop-blur-sm border border-blue-200 shadow-sm">
                <ShoppingCart size={14} />
                <span className="text-xs font-semibold">{formatNumber(cartItemsCount)}</span>
              </div>
            )}
            {totalAmount > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-green-100 text-green-700 backdrop-blur-sm border border-green-200 shadow-sm">
                <DollarSign size={14} />
                <span className="text-xs font-semibold">{formatMoney(totalAmount)}</span>
              </div>
            )}
            {productsCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-purple-100 text-purple-700 backdrop-blur-sm border border-purple-200 shadow-sm">
                <Package size={14} />
                <span className="text-xs font-semibold">{formatNumber(productsCount)}</span>
              </div>
            )}
            {salesCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-amber-100 text-amber-700 backdrop-blur-sm border border-amber-200 shadow-sm">
                <TrendingUp size={14} />
                <span className="text-xs font-semibold">{formatNumber(salesCount)}</span>
              </div>
            )}
          </div>

          {/* LATS Navigation Icons */}
          <div className="hidden lg:flex items-center gap-1">

            {/* Unified Inventory - Only show if user has inventory access */}
            {canAccessInventory && (
              <div className="relative group">
                <button 
                  onClick={() => navigate('/lats/unified-inventory')}
                  className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm hover:scale-110"
                  title="Unified Inventory Management"
                >
                  <Warehouse size={18} className="text-gray-700" />
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 text-gray-700 text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50">
                  Unified Inventory Management
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
                </div>
              </div>
            )}
            
            <div className="relative group">
              <button 
                onClick={() => navigate('/lats/customers')}
                className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm hover:scale-110"
                title="Customer Management"
              >
                <Users size={18} className="text-gray-700" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 text-gray-700 text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50">
                Customer Management
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
              </div>
            </div>
            
            {/* Sales Reports - Only show if user has reports access */}
            {canViewReports && (
              <div className="relative group">
                <button 
                  onClick={() => navigate('/lats/sales-reports')}
                  className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm hover:scale-110"
                  title="Sales Reports"
                >
                  <BarChart3 size={18} className="text-gray-700" />
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 text-gray-700 text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50">
                  Sales Reports
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
                </div>
              </div>
            )}
            
            <div className="relative group">
              <button 
                onClick={() => navigate('/lats/loyalty')}
                className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm hover:scale-110"
                title="Customer Loyalty"
              >
                <Crown size={18} className="text-gray-700" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 text-gray-700 text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50">
                Customer Loyalty
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
              </div>
            </div>
            
            <div className="relative group">
              <button 
                onClick={() => {
                  console.log('🔍 POSTopBar: Payment Tracking button clicked');
                  onOpenPaymentTracking();
                }}
                className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm hover:scale-110"
                title="Payment Tracking"
              >
                <CreditCard size={18} className="text-gray-700" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 text-gray-700 text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50">
                Payment Tracking
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
              </div>
            </div>
            
            <div className="relative group">
              <button 
                onClick={onOpenDrafts}
                className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm hover:scale-110 relative"
                title="Saved Drafts"
              >
                <Clock size={18} className="text-gray-700" />
                {draftCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {draftCount > 9 ? '9+' : draftCount}
                  </span>
                )}
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 text-gray-700 text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50">
                Saved Drafts {draftCount > 0 && `(${draftCount})`}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
              </div>
            </div>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center gap-3">
            {/* Process Payment Button */}
            <button
              onClick={onProcessPayment}
              disabled={cartItemsCount === 0 || isProcessingPayment}
              className="px-5 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium transition-all duration-300 shadow-sm flex items-center gap-2"
            >
              <CreditCard size={18} />
              <span className="hidden sm:inline">Process Payment</span>
            </button>

            {/* Clear Cart Button */}
            <button
              onClick={onClearCart}
              disabled={cartItemsCount === 0}
              className="p-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white transition-all duration-300 shadow-sm"
              title="Clear Cart"
            >
              <Trash2 size={18} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 relative shadow-sm"
              >
                <Bell size={20} className="text-gray-700" />
                {(cartItemsCount > 0 || salesCount > 0) && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full notification-badge border-2 border-white shadow-sm"></div>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/30 z-50">
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">POS Notifications</h3>
                    <div className="space-y-2">
                      {cartItemsCount > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="p-2 rounded-full bg-blue-500">
                            <ShoppingCart size={16} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{formatNumber(cartItemsCount)} items in cart</p>
                            <p className="text-xs text-gray-600">Total: {formatMoney(totalAmount)}</p>
                          </div>
                        </div>
                      )}
                      {salesCount > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                          <div className="p-2 rounded-full bg-green-500">
                            <TrendingUp size={16} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{formatNumber(salesCount)} sales today</p>
                            <p className="text-xs text-gray-600">Recent transactions</p>
                          </div>
                        </div>
                      )}
                      {cartItemsCount === 0 && salesCount === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <Bell size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-sm border border-white/30"
              >
                <span className="text-white text-sm font-semibold">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </button>
              
              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/30 z-50">
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
                      {canAccessSettings && (
                        <button
                          onClick={() => {
                            navigate('/settings');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Settings size={16} className="text-gray-500" />
                          <span className="text-sm text-gray-700">Settings</span>
                        </button>
                      )}
                      
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

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 py-4 bg-white/20 backdrop-blur-sm border-b border-white/20">
        <SearchDropdown 
          placeholder="Search products, customers..."
        />
      </div>
    </header>
  );
};

export default POSTopBar;
