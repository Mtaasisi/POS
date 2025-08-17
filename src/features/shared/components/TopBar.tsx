import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { useNavigationHistory } from '../../../hooks/useNavigationHistory';
import {
  Bell,
  Search,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Smartphone,
  Users,
  Package,
  MessageSquare,
  Stethoscope,
  Plus,
  ChevronDown,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  ShoppingCart,
  FileText,
  Crown,
  CreditCard,
  Scan,
  Trash2,
  TrendingUp,
  Warehouse,
  BarChart3,
  Activity,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';
import ActivityCounter from './ui/ActivityCounter';
import GlassButton from './ui/GlassButton';
import SearchDropdown from './SearchDropdown';

interface TopBarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  isNavCollapsed: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuToggle, isMenuOpen, isNavCollapsed }) => {
  const { currentUser, logout } = useAuth();
  const { devices } = useDevices();
  const { customers } = useCustomers();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const { handleBackClick, previousPage } = useNavigationHistory();
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);



  // Close dropdowns when clicking outside
  useEffect(() => {
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

  // Calculate activity counts
  const getActivityCounts = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Active devices (not done or failed)
    const activeDevices = devices.filter(device => {
      return device.status !== 'done' && device.status !== 'failed';
    }).length;

    // New customers (unread)
    const newCustomers = customers.filter(customer => {
      return customer.isRead === false || customer.isRead === undefined;
    }).length;

    // Overdue devices
    const overdueDevices = devices.filter(device => {
      if (device.status === 'done' || device.status === 'failed') return false;
      if (!device.expectedReturnDate) return false;
      const dueDate = new Date(device.expectedReturnDate);
      return dueDate < now;
    }).length;

    return {
      activeDevices,
      newCustomers,
      overdueDevices
    };
  };

  const activityCounts = getActivityCounts();

  // Format numbers like Instagram followers (1K, 1.2K, etc.)
  const formatNumber = (num: number): string => {
    if (num < 1000) return num.toString();
    if (num < 10000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (num < 1000000) return Math.round(num / 1000) + 'K';
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getQuickActions = () => {
    const actions = [];
    
    if (currentUser.role === 'admin' || currentUser.role === 'customer-care') {
      actions.push(
        { label: 'Add Customer', icon: <Users size={16} />, action: () => navigate('/customers') },
        { label: 'Add Device', icon: <Smartphone size={16} />, action: () => navigate('/devices/new') },
        { label: 'Unified Inventory', icon: <Package size={16} />, action: () => navigate('/lats/unified-inventory') }
      );
    }
    
    if (currentUser.role === 'customer-care') {
      actions.push(
        { label: 'New Diagnostic', icon: <Stethoscope size={16} />, action: () => navigate('/diagnostics/new') }
      );
    }
    
    if (currentUser.role === 'admin') {
      actions.push(
        { label: 'SMS Centre', icon: <MessageSquare size={16} />, action: () => navigate('/sms') }
      );
    }
    
    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <header className={`sticky top-0 z-20 transition-all duration-500 ${isNavCollapsed ? 'md:ml-[5.5rem]' : 'md:ml-72'}`}>
      {/* Main TopBar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/30 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left Section - Menu Toggle & Back Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm md:hidden border border-white/30 shadow-sm"
            >
              {isMenuOpen ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
            </button>
            
            {/* Back Button */}
            <button
              onClick={handleBackClick}
              className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm"
              title={previousPage ? "Go Back" : "Go to Dashboard"}
            >
              <ArrowLeft size={18} className="text-gray-700" />
            </button>
          </div>

          {/* Center Section - Search & LATS Navigation */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4">
            <SearchDropdown 
              placeholder="Search devices, customers..."
              className="flex-1"
            />
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100/50 text-gray-500 text-xs">
              <span>⌘K</span>
            </div>
          </div>

          {/* LATS Navigation Icons */}
          <div className="hidden lg:flex items-center gap-1">
            <div className="relative group">
              <button 
                onClick={() => navigate('/pos')}
                className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm hover:scale-110"
                title="POS System"
              >
                <ShoppingCart size={18} className="text-gray-700" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 text-gray-700 text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50">
                POS System
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
              </div>
            </div>
            

            
            <div className="relative group">
              <button 
                onClick={() => navigate('/lats/unified-inventory')}
                className={`p-3 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-sm hover:scale-110 ${
                  location.pathname.includes('/lats/unified-inventory') 
                    ? 'bg-blue-500 text-white border-blue-400' 
                    : 'bg-white/30 hover:bg-white/50 border-white/30'
                }`}
                title="Unified Inventory Management"
              >
                <Warehouse size={18} className={location.pathname.includes('/lats/unified-inventory') ? 'text-white' : 'text-gray-700'} />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 text-gray-700 text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50">
                Unified Inventory Management
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
              </div>
            </div>
            
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
                onClick={() => navigate('/lats/payments')}
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
                onClick={() => navigate('/lats')}
                className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm hover:scale-110"
                title="LATS Dashboard"
              >
                <LayoutDashboard size={18} className="text-gray-700" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 text-gray-700 text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50">
                LATS Dashboard
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
              </div>
            </div>
          </div>

          {/* Right Section - Status & Actions */}
          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="hidden sm:flex items-center justify-center w-6 h-6">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            </div>

            {/* Activity Pills */}
            <div className="hidden lg:flex items-center gap-2">
              {activityCounts.activeDevices > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100 text-blue-700 backdrop-blur-sm border border-blue-200 shadow-sm">
                  <Smartphone size={14} />
                  <span className="text-xs font-semibold">{formatNumber(activityCounts.activeDevices)}</span>
                </div>
              )}
              {activityCounts.newCustomers > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-100 text-green-700 backdrop-blur-sm border border-green-200 shadow-sm">
                  <Users size={14} />
                  <span className="text-xs font-semibold">{formatNumber(activityCounts.newCustomers)}</span>
                </div>
              )}
              {activityCounts.overdueDevices > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-red-100 text-red-700 backdrop-blur-sm border border-red-200 shadow-sm">
                  <Smartphone size={14} />
                  <span className="text-xs font-semibold">{formatNumber(activityCounts.overdueDevices)}</span>
                </div>
              )}
              
              {/* LATS Activity Counters */}
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-purple-100 text-purple-700 backdrop-blur-sm border border-purple-200 shadow-sm">
                <Package size={14} />
                <span className="text-xs font-semibold">1</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-amber-100 text-amber-700 backdrop-blur-sm border border-amber-200 shadow-sm">
                <TrendingUp size={14} />
                <span className="text-xs font-semibold">3</span>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 relative shadow-sm"
              >
                <Bell size={20} className="text-gray-700" />
                {(activityCounts.activeDevices > 0 || activityCounts.newCustomers > 0 || activityCounts.overdueDevices > 0) && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full notification-badge border-2 border-white shadow-sm"></div>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/30 z-50">
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
                    <div className="space-y-2">
                      {activityCounts.activeDevices > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="p-2 rounded-full bg-blue-500">
                            <Smartphone size={16} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{formatNumber(activityCounts.activeDevices)} active devices</p>
                            <p className="text-xs text-gray-600">Devices currently being repaired</p>
                          </div>
                        </div>
                      )}
                      {activityCounts.newCustomers > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                          <div className="p-2 rounded-full bg-green-500">
                            <Users size={16} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{formatNumber(activityCounts.newCustomers)} new customers</p>
                            <p className="text-xs text-gray-600">Recently added customers</p>
                          </div>
                        </div>
                      )}
                      {activityCounts.overdueDevices > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                          <div className="p-2 rounded-full bg-red-500">
                            <Smartphone size={16} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{formatNumber(activityCounts.overdueDevices)} overdue devices</p>
                            <p className="text-xs text-gray-600">Devices past due date</p>
                          </div>
                        </div>
                      )}
                      {activityCounts.activeDevices === 0 && activityCounts.newCustomers === 0 && activityCounts.overdueDevices === 0 && (
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

            {/* Quick Actions - HIDDEN */}
            {/* <div className="hidden lg:flex items-center gap-1">
              {quickActions.slice(0, 2).map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="p-2 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm"
                  title={action.label}
                >
                  {React.cloneElement(action.icon, { className: "text-gray-700", size: 18 })}
                </button>
              ))}
              
              <button
                className="p-3 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm"
                title="Scan Barcode"
              >
                <Scan size={18} className="text-gray-700" />
              </button>
              
              <button
                className="p-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white transition-all duration-300 shadow-sm"
                title="Clear Cart"
                disabled
              >
                <Trash2 size={18} />
              </button>
            </div> */}

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-sm border border-white/30"
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
      <div className="md:hidden px-4 py-3 bg-white/20 backdrop-blur-sm border-b border-white/20">
        <SearchDropdown 
          placeholder="Search devices, customers..."
        />
      </div>
    </header>
  );
};

export default TopBar; 