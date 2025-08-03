import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DevicesContext';
import { useCustomers } from '../context/CustomersContext';
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
} from 'lucide-react';
import ActivityCounter from './ui/ActivityCounter';
import GlassButton from './ui/GlassButton';

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
        { label: 'Add Product', icon: <Package size={16} />, action: () => navigate('/inventory/new') }
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
          {/* Left Section - Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuToggle}
              className="p-3 rounded-xl bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm md:hidden border border-white/30 shadow-sm"
            >
              {isMenuOpen ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
            </button>
          </div>

          {/* Center Section - Search */}
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-lg mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search devices, customers, inventory..."
                className="w-full pl-12 pr-6 py-3 rounded-xl bg-white/70 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm font-medium text-gray-800 placeholder-gray-500 shadow-sm"
              />
            </div>
          </div>

          {/* Right Section - Status & Actions */}
          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-white/30 shadow-sm">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className="text-xs text-gray-700 font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Activity Pills */}
            <div className="hidden lg:flex items-center gap-3">
              {activityCounts.activeDevices > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100 text-blue-700 backdrop-blur-sm border border-blue-200 shadow-sm">
                  <Smartphone size={14} />
                  <span className="text-xs font-semibold">{activityCounts.activeDevices}</span>
                </div>
              )}
              {activityCounts.newCustomers > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-100 text-green-700 backdrop-blur-sm border border-green-200 shadow-sm">
                  <Users size={14} />
                  <span className="text-xs font-semibold">{activityCounts.newCustomers}</span>
                </div>
              )}
              {activityCounts.overdueDevices > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-red-100 text-red-700 backdrop-blur-sm border border-red-200 shadow-sm">
                  <Smartphone size={14} />
                  <span className="text-xs font-semibold">{activityCounts.overdueDevices}</span>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 rounded-xl bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 relative shadow-sm"
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
                            <p className="text-sm font-medium text-gray-900">{activityCounts.activeDevices} active devices</p>
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
                            <p className="text-sm font-medium text-gray-900">{activityCounts.newCustomers} new customers</p>
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
                            <p className="text-sm font-medium text-gray-900">{activityCounts.overdueDevices} overdue devices</p>
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

            {/* Quick Actions */}
            <div className="hidden lg:flex items-center gap-2">
              {quickActions.slice(0, 2).map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="p-3 rounded-xl bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm"
                  title={action.label}
                >
                  {React.cloneElement(action.icon, { className: "text-gray-700", size: 18 })}
                </button>
              ))}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm"
              >
                <div className="p-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-sm">
                  <User size={18} />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-24">{currentUser.name}</p>
                  <p className="text-xs text-gray-600 capitalize">{currentUser.role.replace('-', ' ')}</p>
                </div>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              
              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/30 z-50">
                  <div className="p-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 mb-3 border border-gray-200">
                      <div className="p-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-white">
                        <User size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{currentUser.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{currentUser.role.replace('-', ' ')}</p>
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
      <div className="md:hidden px-6 py-4 bg-white/20 backdrop-blur-sm border-b border-white/20">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search devices, customers, inventory..."
            className="w-full pl-12 pr-6 py-3 rounded-xl bg-white/70 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm font-medium text-gray-800 placeholder-gray-500 shadow-sm"
          />
        </div>
      </div>
    </header>
  );
};

export default TopBar; 