import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { useNavigationHistory } from '../../../hooks/useNavigationHistory';
import { useNotifications } from '../../notifications/hooks/useNotifications';
import {
  Bell,
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
  Monitor,
  Laptop,
  Tablet,
  TestTube,
  Receipt,
  Calendar,
  Briefcase,
  MapPin,
  Layers,
  Brain,
  Wrench,
  Star,
  ClipboardList,
  Building,
  DollarSign,
  Home,
  Shield,
  Database,
  Upload,
  Download,
  Clock,
  UserCheck,
  MobileIcon,
} from 'lucide-react';
import ActivityCounter from './ui/ActivityCounter';
import GlassButton from './ui/GlassButton';
import SearchDropdown from './SearchDropdown';
import CacheClearButton from '../../../components/CacheClearButton';

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
  
  // Use the notifications hook
  const { 
    notifications, 
    unreadNotifications, 
    markAsRead, 
    _markAsActioned, 
    dismissNotification 
  } = useNotifications();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [isOnline, _setIsOnline] = useState(navigator.onLine);
  
  const { handleBackClick, previousPage } = useNavigationHistory();
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const createDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
        setShowCreateDropdown(false);
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
    const _oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

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
        { label: 'Add Product', icon: <Plus size={16} />, action: () => navigate('/lats/add-product') },
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

          {/* Center Section - Search & Create Dropdown */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4">
            <SearchDropdown 
              placeholder="Search devices, customers..."
              className="flex-1"
            />
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100/50 text-gray-500 text-xs">
              <span>⌘K</span>
            </div>
          </div>

          {/* Create Dropdown - Role-based */}
          {currentUser?.role !== 'technician' && (
            <div className="relative" ref={createDropdownRef}>
              <button
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="font-medium">Create</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${showCreateDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Create Dropdown Menu - Image Style */}
              {showCreateDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 space-y-3">
                    {/* New Device */}
                    <button
                      onClick={() => {
                        navigate('/devices/new');
                        setShowCreateDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-blue-500 text-white">
                        <Smartphone size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">New Device</p>
                        <p className="text-sm text-gray-600">Add device for repair</p>
                      </div>
                    </button>
                    
                    {/* Diagnostic Request */}
                    <button
                      onClick={() => {
                        navigate('/diagnostics/new');
                        setShowCreateDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-green-500 text-white">
                        <Stethoscope size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">Diagnostic Request</p>
                        <p className="text-sm text-gray-600">Create device analysis</p>
                      </div>
                    </button>
                    
                    {/* Add Customer */}
                    <button
                      onClick={() => {
                        navigate('/customers');
                        setShowCreateDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-purple-500 text-white">
                        <Users size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">Add Customer</p>
                        <p className="text-sm text-gray-600">Register new customer</p>
                      </div>
                    </button>
                    
                    {/* Add Product */}
                    <button
                      onClick={() => {
                        navigate('/lats/add-product');
                        setShowCreateDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-orange-500 text-white">
                        <Package size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">Add Product</p>
                        <p className="text-sm text-gray-600">Add new inventory item</p>
                      </div>
                    </button>
                    
                    {/* New Sale */}
                    <button
                      onClick={() => {
                        navigate('/pos');
                        setShowCreateDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-emerald-500 text-white">
                        <ShoppingCart size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">New Sale</p>
                        <p className="text-sm text-gray-600">Start POS transaction</p>
                      </div>
                    </button>
                    
                    {/* SMS Centre */}
                    <button
                      onClick={() => {
                        navigate('/sms');
                        setShowCreateDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-indigo-500 text-white">
                        <MessageSquare size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">SMS Centre</p>
                        <p className="text-sm text-gray-600">Send messages to customers</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Technician Quick Actions */}
          {currentUser?.role === 'technician' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/repair')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Wrench size={16} />
                <span className="font-medium">Repair Center</span>
              </button>
              <button
                onClick={() => navigate('/lats/spare-parts')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Package size={16} />
                <span className="font-medium">Spare Parts</span>
              </button>
            </div>
          )}

          {/* LATS Navigation Icons - Hidden for technicians */}
          {currentUser?.role !== 'technician' && (
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
                onClick={() => navigate('/finance/payments')}
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
                {unreadNotifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full notification-badge border-2 border-white shadow-sm flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                    </span>
                  </div>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/30 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadNotifications.length > 0 && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          {unreadNotifications.length} unread
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 8).map((notification) => (
                          <div
                            key={notification.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${
                              notification.status === 'unread' 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                            onClick={() => {
                              if (notification.status === 'unread') {
                                markAsRead(notification.id);
                              }
                              if (notification.actionUrl) {
                                navigate(notification.actionUrl);
                                setShowNotifications(false);
                              }
                            }}
                          >
                            <div className={`p-2 rounded-full text-lg ${notification.color || 'bg-gray-500'}`}>
                              {notification.icon || '🔔'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${
                                notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              {notification.status === 'unread' && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(notification.id);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Dismiss"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Bell size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">No notifications</p>
                        </div>
                      )}
                    </div>
                    {notifications.length > 8 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            navigate('/notifications');
                            setShowNotifications(false);
                          }}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
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
                      
                      <div className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition-colors">
                        <Trash2 size={16} className="text-orange-500" />
                        <CacheClearButton 
                          variant="text" 
                          className="text-sm text-orange-700 hover:text-orange-800"
                          showConfirmation={true}
                        />
                      </div>
                      
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

      {/* Mobile Search Bar & Create Button */}
      <div className="md:hidden px-4 py-3 bg-white/20 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center gap-3">
          <SearchDropdown 
            placeholder="Search devices, customers..."
            className="flex-1"
          />
          <button
            onClick={() => setShowCreateDropdown(!showCreateDropdown)}
            className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>
        
        {/* Mobile Create Dropdown */}
        {showCreateDropdown && (
          <div className="mt-3 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="space-y-3">
              <button
                onClick={() => {
                  navigate('/devices/new');
                  setShowCreateDropdown(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-blue-500 text-white">
                  <Smartphone size={20} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">New Device</p>
                  <p className="text-sm text-gray-600">Add device for repair</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  navigate('/diagnostics/new');
                  setShowCreateDropdown(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-green-500 text-white">
                  <Stethoscope size={20} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Diagnostic Request</p>
                  <p className="text-sm text-gray-600">Create device analysis</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  navigate('/customers');
                  setShowCreateDropdown(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-purple-500 text-white">
                  <Users size={20} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Add Customer</p>
                  <p className="text-sm text-gray-600">Register new customer</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  navigate('/lats/add-product');
                  setShowCreateDropdown(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-orange-500 text-white">
                  <Package size={20} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Add Product</p>
                  <p className="text-sm text-gray-600">Add new inventory item</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  navigate('/pos');
                  setShowCreateDropdown(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-emerald-500 text-white">
                  <ShoppingCart size={20} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">New Sale</p>
                  <p className="text-sm text-gray-600">Start POS transaction</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  navigate('/sms');
                  setShowCreateDropdown(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-indigo-500 text-white">
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">SMS Centre</p>
                  <p className="text-sm text-gray-600">Send messages to customers</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar; 