import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DevicesContext';
import { useCustomers } from '../context/CustomersContext';
import {
  Smartphone,
  Menu,
  X,
  User,
  LogOut,
  Bell,
  Search,
  Settings,
  ChevronDown,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import ActivityCounter from './ui/ActivityCounter';

interface AppHeaderProps {
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  showMobileMenu = false, 
  onMobileMenuToggle,
  className = ''
}) => {
  const { currentUser, logout } = useAuth();
  const { devices } = useDevices();
  const { customers } = useCustomers();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Calculate activity counts
  const getActivityCounts = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const activeDevices = devices.filter(device => 
      device.status !== 'done' && device.status !== 'failed'
    ).length;

    const overdueDevices = devices.filter(device => {
      if (device.status === 'done' || device.status === 'failed') return false;
      if (!device.expectedReturnDate) return false;
      const dueDate = new Date(device.expectedReturnDate);
      return dueDate < now;
    }).length;

    const newCustomers = customers.filter(customer => 
      customer.isRead === false || customer.isRead === undefined
    ).length;

    return { activeDevices, overdueDevices, newCustomers };
  };

  const activityCounts = getActivityCounts();

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // You can add actual theme switching logic here
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/admin-dashboard') return 'Admin Dashboard';
    if (path === '/customers') return 'Customers';
    if (path === '/inventory') return 'Inventory';
    if (path === '/spare-parts') return 'Spare Parts';
    if (path === '/sms') return 'SMS Centre';
    if (path === '/diagnostics') return 'Diagnostics';
    if (path === '/finance') return 'Finance';
    if (path === '/pos') return 'Point of Sale';
    if (path === '/settings') return 'Settings';
    if (path === '/backup-management') return 'Backup Management';
    if (path.startsWith('/devices/')) return 'Device Details';
    if (path.startsWith('/customers/')) return 'Customer Details';
    if (path.startsWith('/inventory/')) return 'Inventory Details';
    return 'Repair Shop';
  };

  return (
    <header className={`
      sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm
      transition-all duration-300 ${className}
    `}>
      {/* Online/Offline Status Bar */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-center py-1 text-sm font-medium">
          <WifiOff className="inline w-4 h-4 mr-1" />
          You are offline. Changes will be saved locally.
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Brand & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMobileMenuToggle}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors md:hidden"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Brand Logo */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg group-hover:shadow-xl transition-shadow">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg text-gray-900">Repair Shop</h1>
                <p className="text-xs text-gray-600">Management System</p>
              </div>
            </Link>

            {/* Page Title - Desktop */}
            <div className="hidden md:block ml-6">
              <h2 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h2>
            </div>
          </div>

          {/* Center Section - Search (Desktop) */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search devices, customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center gap-3">
            {/* Activity Indicators */}
            <div className="hidden sm:flex items-center gap-2">
              {activityCounts.activeDevices > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  <Activity className="w-3 h-3" />
                  <span>{activityCounts.activeDevices}</span>
                </div>
              )}
              {activityCounts.overdueDevices > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                  <Activity className="w-3 h-3" />
                  <span>{activityCounts.overdueDevices}</span>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {activityCounts.newCustomers > 0 && (
                <ActivityCounter 
                  count={activityCounts.newCustomers} 
                  className="absolute -top-1 -right-1"
                />
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{currentUser?.name || 'User'}</p>
                  <p className="text-xs text-gray-600 capitalize">{currentUser?.role?.replace('-', ' ')}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                    <p className="text-xs text-gray-600 capitalize">{currentUser?.role?.replace('-', ' ')}</p>
                  </div>
                  
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Notifications</h3>
            <div className="space-y-2">
              {activityCounts.newCustomers > 0 && (
                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    {activityCounts.newCustomers} new customer{activityCounts.newCustomers > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {activityCounts.overdueDevices > 0 && (
                <div className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    {activityCounts.overdueDevices} overdue device{activityCounts.overdueDevices > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {activityCounts.newCustomers === 0 && activityCounts.overdueDevices === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No new notifications</p>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader; 