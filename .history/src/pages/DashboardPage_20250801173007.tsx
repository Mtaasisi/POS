import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DevicesContext';
import { useCustomers } from '../context/CustomersContext';
import { supabase } from '../lib/supabaseClient';
import GlassCard from '../components/ui/GlassCard';
import DeviceCard, { removeDuplicateDevices } from '../components/DeviceCard';
import SearchBar from '../components/ui/SearchBar';
import BarcodeScanner from '../components/BarcodeScanner';
import TechnicianDashboard from '../components/dashboards/TechnicianDashboard';
import CustomerCareDashboard from '../components/dashboards/CustomerCareDashboard';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  Bell, 
  CheckCircle, 
  Layers, 
  WifiOff, 
  Database, 
  X,
  AlertTriangle,
  Info,
  Clock,
  UserCheck,
  Hammer,
  PackageCheck,
  Wrench,
  User,
  XCircle,
  PlusCircle,
  Smartphone,
  QrCode,
  Stethoscope,
  AlertCircle,
  CheckSquare,
  Zap,
  Shield,
  RefreshCw,
  Settings,
  Download,
  Users,
  BarChart3
} from 'lucide-react';
import { DeviceStatus, Device } from '../types';
import { getDiagnosticRequests } from '../lib/diagnosticsApi';
import { DiagnosticRequest } from '../types/diagnostics';
import GlassButton from '../components/ui/GlassButton';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { devices, getDevicesDueToday, getOverdueDevices, getDevicesByTechnician } = useDevices();
  const { customers } = useCustomers();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | DeviceStatus>('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  
  // Add state for diagnostic devices
  const [diagnosticRequests, setDiagnosticRequests] = useState<DiagnosticRequest[]>([]);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(true);

  // Notification state
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    action?: () => void;
  }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Advanced search and filter state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'customer' | 'technician'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Refresh devices by calling the devices context refresh instead of page reload
    // This prevents the infinite re-render loop
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    // Remove the focus handler that was causing page reloads
    // const handleFocus = () => {
    //   if (document.hasFocus()) {
    //     handleRefresh();
    //   }
    // };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Load diagnostic requests
  async function loadDiagnostics() {
    try {
      setDiagnosticsLoading(true);
      const requests = await getDiagnosticRequests();
      setDiagnosticRequests(requests);
    } catch (error) {
      console.error('Failed to load diagnostic requests:', error);
    } finally {
      setDiagnosticsLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadDiagnostics();
    }
  }, [currentUser?.role]);

  // Generate notifications based on device status
  const generateNotifications = useCallback(() => {
    const newNotifications: Array<{
      id: string;
      type: 'warning' | 'error' | 'info' | 'success';
      title: string;
      message: string;
      timestamp: Date;
      read: boolean;
      action?: () => void;
    }> = [];

    // Overdue devices
    const overdueDevices = getOverdueDevices();
    if (overdueDevices.length > 0) {
      newNotifications.push({
        id: 'overdue-devices',
        type: 'error',
        title: 'Overdue Devices',
        message: `${overdueDevices.length} device(s) are overdue for completion`,
        timestamp: new Date(),
        read: false,
        action: () => {
          setStatusFilter('overdue');
          setShowNotifications(false);
        }
      });
    }

    // Devices due today
    const dueTodayDevices = getDevicesDueToday();
    if (dueTodayDevices.length > 0) {
      newNotifications.push({
        id: 'due-today',
        type: 'warning',
        title: 'Devices Due Today',
        message: `${dueTodayDevices.length} device(s) are due for completion today`,
        timestamp: new Date(),
        read: false,
        action: () => {
          setStatusFilter('all');
          setShowNotifications(false);
        }
      });
    }

    // New devices (added in last 24 hours)
    const newDevices = devices.filter(device => {
      const deviceDate = new Date(device.createdAt);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return deviceDate > yesterday;
    });
    
    if (newDevices.length > 0) {
      newNotifications.push({
        id: 'new-devices',
        type: 'info',
        title: 'New Devices',
        message: `${newDevices.length} new device(s) added in the last 24 hours`,
        timestamp: new Date(),
        read: false,
        action: () => {
          setStatusFilter('all');
          setShowNotifications(false);
        }
      });
    }

    // System status
    if (isOffline) {
      newNotifications.push({
        id: 'offline-mode',
        type: 'warning',
        title: 'Offline Mode',
        message: 'You are currently working offline. Changes will sync when connection is restored.',
        timestamp: new Date(),
        read: false
      });
    }

    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  }, [devices, getOverdueDevices, getDevicesDueToday, isOffline, setStatusFilter]);

  // Update notifications when devices change
  useEffect(() => {
    generateNotifications();
  }, [devices, generateNotifications]);

  // Close notifications panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notifications-panel')) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Filter devices based on role, search query, and status filter
  const filteredDevices = useMemo(() => {
    let filtered = devices;
    
    // Filter devices for technician role
    if (currentUser?.role === 'technician' && currentUser.id) {
      filtered = getDevicesByTechnician(currentUser.id);
    }
    
    // Show all devices by default (including "done" devices)
    // Only filter out "done" devices if a specific status filter is selected (not "all")
    if (statusFilter !== 'all' && statusFilter !== 'done') {
      // Hide "done" devices for specific status filters
      filtered = filtered.filter(device => device.status !== 'done');
    }
      
    // Apply search filter if exists
    if (searchQuery) {
      filtered = filtered.filter(device => 
        (device.id?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.customerName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.brand?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.model?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply status filter if not set to 'all'
    if (statusFilter !== 'all') {
      // Only filter if statusFilter is a valid DeviceStatus
      const validStatuses: DeviceStatus[] = [
        'assigned',
        'diagnosis-started',
        'awaiting-parts',
        'in-repair',
        'reassembled-testing',
        'repair-complete',
        'returned-to-customer-care',
        'done',
        'failed'
      ];
      if (validStatuses.includes(statusFilter as DeviceStatus)) {
        filtered = filtered.filter(device => device.status === statusFilter);
      }
    }
    
    return filtered;
  }, [devices, currentUser?.role, currentUser?.id, searchQuery, statusFilter, getDevicesByTechnician]);

  // Advanced filtering and sorting
  const advancedFilteredDevices = useMemo(() => {
    let filtered = filteredDevices;

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(device => {
        const deviceDate = new Date(device.createdAt);
        switch (dateFilter) {
          case 'today':
            return deviceDate >= today;
          case 'week':
            return deviceDate >= weekAgo;
          case 'month':
            return deviceDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Technician filter
    if (technicianFilter !== 'all') {
      filtered = filtered.filter(device => device.assignedTo === technicianFilter);
    }

    // Customer filter
    if (customerFilter !== 'all') {
      filtered = filtered.filter(device => 
        device.customerName?.toLowerCase().includes(customerFilter.toLowerCase())
      );
    }

    // Brand filter
    if (brandFilter !== 'all') {
      filtered = filtered.filter(device => 
        device.brand?.toLowerCase().includes(brandFilter.toLowerCase())
      );
    }

    // Priority filter (based on status)
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(device => {
        const priority = getDevicePriority(device.status);
        return priority === priorityFilter;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'customer':
          aValue = a.customerName || '';
          bValue = b.customerName || '';
          break;
        case 'technician':
          aValue = a.assignedTo || '';
          bValue = b.assignedTo || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [filteredDevices, dateFilter, technicianFilter, customerFilter, brandFilter, priorityFilter, sortBy, sortOrder]);

  // Helper function to get device priority
  const getDevicePriority = (status: DeviceStatus): 'high' | 'medium' | 'low' => {
    switch (status) {
      case 'overdue':
      case 'failed':
        return 'high';
      case 'in-repair':
      case 'diagnosis-started':
      case 'awaiting-parts':
        return 'medium';
      default:
        return 'low';
    }
  };

  // Count devices by status - for cards, use all devices for admin/customer-care, filtered for technicians
  // Show all devices in counts by default
  const countByStatus = (status: DeviceStatus) => {
    let devicesToCount = (currentUser?.role === 'technician') ? filteredDevices : devices;
    
    // Only filter out "done" devices if a specific status filter is selected (not "all")
    if (statusFilter !== 'all' && statusFilter !== 'done') {
      devicesToCount = devicesToCount.filter(device => device.status !== 'done');
    }
    
    return devicesToCount.filter(d => d.status === status).length;
  };
  
  const statCards = [
    {
      label: 'Assigned',
      count: countByStatus('assigned'),
      icon: <UserCheck className="h-6 w-6 text-amber-500" />,
      status: 'assigned' as DeviceStatus,
      color: 'from-amber-500/20 to-orange-400/10',
      show: true
    },
    {
      label: 'Diagnosis',
      count: countByStatus('diagnosis-started'),
      icon: <Hammer className="h-6 w-6 text-blue-500" />,
      status: 'diagnosis-started' as DeviceStatus,
      color: 'from-blue-500/20 to-blue-400/10',
      show: true
    },
    {
      label: 'Awaiting Parts',
      count: countByStatus('awaiting-parts'),
      icon: <PackageCheck className="h-6 w-6 text-yellow-500" />,
      status: 'awaiting-parts' as DeviceStatus,
      color: 'from-yellow-400/20 to-yellow-200/10',
      show: true
    },
    {
      label: 'In Repair',
      count: countByStatus('in-repair'),
      icon: <Wrench className="h-6 w-6 text-purple-500" />,
      status: 'in-repair' as DeviceStatus,
      color: 'from-purple-500/20 to-purple-400/10',
      show: true
    },
    {
      label: 'Back to CC',
      count: countByStatus('returned-to-customer-care'),
      icon: <UserCheck className="h-6 w-6 text-teal-500" />,
      status: 'returned-to-customer-care' as DeviceStatus,
      color: 'from-teal-500/20 to-cyan-400/10',
      show: true
    },
    {
      label: 'Done',
      count: countByStatus('done'),
      icon: <CheckCircle className="h-6 w-6 text-gray-500" />,
      status: 'done' as DeviceStatus,
      color: 'from-gray-500/20 to-gray-400/10',
      show: true
    },
    {
      label: 'Failed',
      count: countByStatus('failed'),
      icon: <XCircle className="h-6 w-6 text-red-500" />,
      status: 'failed' as DeviceStatus,
      color: 'from-red-500/20 to-pink-400/10',
      show: true
    }
  ].filter(card => card.show);

  // Update status filter buttons
  const statusOptions: DeviceStatus[] = [
    'assigned',
    'diagnosis-started',
    'awaiting-parts',
    'in-repair',
    'reassembled-testing',
    'repair-complete',
    'returned-to-customer-care',
    'done',
    'failed'
  ];

  // Devices due today and overdue
  const dueToday = getDevicesDueToday();
  const overdue = getOverdueDevices();
  
  // Show all devices in the main grid, except done devices (they have their own section)
  const mainGridDevices = advancedFilteredDevices.filter(device => device.status !== 'done');

  // Show a toast notification if there are due today or overdue devices (once per page load)
  useEffect(() => {
    if (overdue.length > 0) {
      toast.error(`You have ${overdue.length} overdue device${overdue.length > 1 ? 's' : ''}! Please take action.`, { id: 'overdue-reminder' });
    } else if (dueToday.length > 0) {
      toast(`You have ${dueToday.length} device${dueToday.length > 1 ? 's' : ''} due today.`, { id: 'due-today-reminder' });
    }
    // Only show once per page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getStatusIcon(status: DeviceStatus | 'all') {
    switch (status) {
      case 'assigned': return <UserCheck size={18} className="text-amber-500" />;
      case 'diagnosis-started': return <Hammer size={18} className="text-blue-500" />;
      case 'awaiting-parts': return <PackageCheck size={18} className="text-yellow-500" />;
      case 'in-repair': return <Wrench size={18} className="text-purple-500" />;
      case 'reassembled-testing': return <CheckCircle size={18} className="text-cyan-500" />;
      case 'repair-complete': return <CheckCircle size={18} className="text-emerald-500" />;
      case 'returned-to-customer-care': return <User size={18} className="text-teal-500" />;
      case 'done': return <UserCheck size={18} className="text-gray-500" />;
      case 'failed': return <XCircle size={18} className="text-red-500" />;
      case 'all': return <Layers size={18} className="text-gray-500" />;
      default: return <Layers size={18} className="text-gray-500" />;
    }
  }

  function DropdownOption({ value, label, icon }: { value: DeviceStatus | 'all'; label: string; icon: JSX.Element }) {
    return (
      <button
        type="button"
        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-blue-50/80 focus:bg-blue-100/90 transition-all duration-200 text-gray-800 rounded-lg mx-2"
        onClick={() => { setStatusFilter(value); setStatusDropdownOpen(false); }}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </button>
    );
  }

  // Render role-based dashboards
  if (currentUser) {
    if (currentUser.role === 'technician') {
      return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <TechnicianDashboard
            devices={devices}
            loading={false}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>
      );
    }

    if (currentUser.role === 'customer-care') {
      return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <CustomerCareDashboard
            devices={devices}
            loading={false}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>
      );
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Device Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage and track all device repairs</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Offline Indicator */}
          {isOffline && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <WifiOff className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">Offline Mode</span>
            </div>
          )}
          
          {/* Cache Indicator */}
          {isFromCache && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">Cached Data</span>
            </div>
          )}

          {/* Notifications Panel */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200"
            >
              <Bell className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="notifications-panel absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="p-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors duration-200 ${
                          notification.read ? 'bg-gray-50' : 'bg-blue-50'
                        }`}
                        onClick={() => {
                          if (notification.action) notification.action();
                          setNotifications(prev => 
                            prev.map(n => 
                              n.id === notification.id ? { ...n, read: true } : n
                            )
                          );
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-1 rounded-full ${
                            notification.type === 'error' ? 'bg-red-100' :
                            notification.type === 'warning' ? 'bg-yellow-100' :
                            notification.type === 'info' ? 'bg-blue-100' :
                            'bg-green-100'
                          }`}>
                            {notification.type === 'error' ? <AlertTriangle className="h-3 w-3 text-red-600" /> :
                             notification.type === 'warning' ? <AlertTriangle className="h-3 w-3 text-yellow-600" /> :
                             notification.type === 'info' ? <Info className="h-3 w-3 text-blue-600" /> :
                             <CheckCircle className="h-3 w-3 text-green-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Add Device Button */}
          <Link
            to="/devices/new"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Add Device</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="mb-6">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Quick Actions
            </h3>
            <div className="text-sm text-gray-500">
              {mainGridDevices.length} active devices
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Bulk Assign */}
            <button
              onClick={() => {
                const assignableDevices = mainGridDevices.filter(d => d.status === 'intake');
                if (assignableDevices.length > 0) {
                  toast.success(`Ready to assign ${assignableDevices.length} devices`);
                } else {
                  toast.error('No devices ready for assignment');
                }
              }}
              className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
            >
              <UserCheck className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Bulk Assign</span>
            </button>

            {/* Bulk Status Update */}
            <button
              onClick={() => {
                const updatableDevices = mainGridDevices.filter(d => 
                  ['assigned', 'diagnosis-started', 'awaiting-parts'].includes(d.status)
                );
                if (updatableDevices.length > 0) {
                  toast.success(`Ready to update ${updatableDevices.length} devices`);
                } else {
                  toast.error('No devices ready for status update');
                }
              }}
              className="flex flex-col items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
            >
              <Settings className="h-5 w-5 text-green-600" />
              <span className="text-xs font-medium text-green-700">Bulk Update</span>
            </button>

            {/* Export Data */}
            <button
              onClick={() => {
                const exportData = mainGridDevices.map(d => ({
                  id: d.id,
                  customer: d.customerName,
                  device: d.deviceName,
                  status: d.status,
                  technician: d.technician,
                  createdAt: new Date(d.createdAt).toLocaleDateString()
                }));
                const csv = [
                  Object.keys(exportData[0]).join(','),
                  ...exportData.map(row => Object.values(row).join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `devices-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast.success('Data exported successfully');
              }}
              className="flex flex-col items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
            >
              <Download className="h-5 w-5 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Export CSV</span>
            </button>

            {/* Add New Device */}
            <Link
              to="/new-device"
              className="flex flex-col items-center gap-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200"
            >
              <Plus className="h-5 w-5 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">Add Device</span>
            </Link>

            {/* Customer Management */}
            <Link
              to="/customers"
              className="flex flex-col items-center gap-2 p-3 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors duration-200"
            >
              <Users className="h-5 w-5 text-teal-600" />
              <span className="text-xs font-medium text-teal-700">Customers</span>
            </Link>

            {/* Reports */}
            <button
              onClick={() => {
                const stats = {
                  total: mainGridDevices.length,
                  overdue: getOverdueDevices().length,
                  dueToday: getDevicesDueToday().length,
                  completed: devices.filter(d => d.status === 'done').length
                };
                toast.success(`Stats: ${stats.total} active, ${stats.overdue} overdue, ${stats.completed} completed`);
              }}
              className="flex flex-col items-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
            >
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-700">Quick Stats</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4 mb-6">
        {statCards.map((card) => (
          <button
            key={card.status}
            onClick={() => setStatusFilter(card.status)}
            className={`p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
              statusFilter === card.status
                ? 'border-blue-300 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white/80 backdrop-blur-sm hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              {card.icon}
              <span className="text-lg font-bold text-gray-900">{card.count}</span>
            </div>
            <p className="text-sm font-medium text-gray-700 text-left">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search devices, customers, or technicians..."
              className="w-full"
            />
          </div>
          
          {/* Advanced Filters Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters</span>
              {showAdvancedFilters && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </button>
            
            {/* Clear Filters */}
            {(dateFilter !== 'all' || technicianFilter !== 'all' || customerFilter !== 'all' || 
              brandFilter !== 'all' || priorityFilter !== 'all') && (
              <button
                onClick={() => {
                  setDateFilter('all');
                  setTechnicianFilter('all');
                  setCustomerFilter('all');
                  setBrandFilter('all');
                  setPriorityFilter('all');
                }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              {/* Technician Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
                <select
                  value={technicianFilter}
                  onChange={(e) => setTechnicianFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Technicians</option>
                  {Array.from(new Set(devices.map(d => d.technician).filter(Boolean))).map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>

              {/* Customer Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Customers</option>
                  {Array.from(new Set(devices.map(d => d.customerName).filter(Boolean))).map(customer => (
                    <option key={customer} value={customer}>{customer}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Brands</option>
                  {Array.from(new Set(devices.map(d => d.brand).filter(Boolean))).map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <div className="flex gap-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="date">Date</option>
                    <option value="status">Status</option>
                    <option value="customer">Customer</option>
                    <option value="technician">Technician</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors duration-200"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* All Devices Grid - Shows all devices with overdue status */}
      {mainGridDevices.length > 0 ? (
        <>
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-700 mb-4 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Layers className="h-5 w-5 text-gray-600" />
              </div>
              Active Devices ({mainGridDevices.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {removeDuplicateDevices(mainGridDevices).map(device => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </>
      ) : (
        <GlassCard className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
          <Smartphone className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
          <h3 className="text-xl sm:text-2xl font-medium text-gray-900 mb-3">No devices found</h3>
          <p className="text-gray-600 text-sm sm:text-base max-w-md">
            {searchQuery 
              ? "No devices match your search criteria" 
              : statusFilter !== 'all'
                ? `No devices with status "${statusFilter.replace(/-/g, ' ')}"`
                : "No devices available in your queue"}
          </p>
        </GlassCard>
      )}

      {/* Done Devices Section - Separate section for completed devices */}
      {(() => {
        const doneDevices = devices.filter(device => device.status === 'done');
        const [showAllDoneDevices, setShowAllDoneDevices] = useState(false);
        
        return doneDevices.length > 0 ? (
          <div className="mt-8 sm:mt-12 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-400/10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{doneDevices.length}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Completed Devices</h3>
                  <p className="text-sm text-gray-600">Successfully completed work</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {removeDuplicateDevices(doneDevices)
                .slice(0, showAllDoneDevices ? doneDevices.length : 4)
                .map(device => (
                  <DeviceCard key={device.id} device={device} />
                ))}
            </div>
            
            {doneDevices.length > 4 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAllDoneDevices(!showAllDoneDevices)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200 hover:shadow-md"
                >
                  {showAllDoneDevices ? (
                    <>
                      <span>Show Less</span>
                    </>
                  ) : (
                    <>
                      <span>View More ({doneDevices.length - 4} more)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : null;
      })()}

      {/* Customer Diagnostic Request Section */}
      {currentUser?.role === 'customer-care' && (
        <div className="mt-8 sm:mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-blue-700 mb-2 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Stethoscope className="h-5 w-5 text-blue-600" />
              </div>
              Device Diagnostics
            </h2>
          </div>
          
          <GlassCard className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Device Diagnostics?</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Submit your devices for professional diagnostic testing. Our technicians will thoroughly test your equipment and provide detailed reports.
              </p>
              <Link
                to="/diagnostics/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 hover:shadow-md"
              >
                <PlusCircle className="h-5 w-5" />
                Request Device Diagnostics
              </Link>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Diagnostics Dashboard Section */}
      {currentUser?.role === 'admin' && (
        <div className="mt-8 sm:mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-purple-700 mb-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Stethoscope className="h-5 w-5 text-purple-600" />
              </div>
              Diagnostics Dashboard
            </h2>
            <div className="flex items-center gap-3">
              <Link 
                to="/diagnostics/new"
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Diagnostic</span>
              </Link>
              <Link 
                to="/diagnostics/reports"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors duration-200"
              >
                View All →
              </Link>
            </div>
          </div>

          {/* Diagnostics Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {(() => {
              const activeDevices = diagnosticRequests.flatMap(request => 
                request.devices?.filter(device => device.result_status !== 'passed' && device.result_status !== 'failed' && device.result_status !== 'partially_failed') || []
              );
              const completedDevices = diagnosticRequests.flatMap(request => 
                request.devices?.filter(device => device.result_status === 'passed' || device.result_status === 'failed' || device.result_status === 'partially_failed') || []
              );
              const pendingDevices = diagnosticRequests.flatMap(request => 
                request.devices?.filter(device => !device.result_status || device.result_status === 'pending') || []
              );
              const inProgressDevices = diagnosticRequests.flatMap(request => 
                request.devices?.filter(device => device.result_status === 'in_progress' || device.result_status === 'testing') || []
              );

              return [
                {
                  label: 'Active Diagnostics',
                  count: activeDevices.length,
                  icon: <Stethoscope className="h-6 w-6 text-purple-500" />,
                  color: 'from-purple-500/20 to-purple-400/10',
                  description: 'Currently being tested'
                },
                {
                  label: 'Pending',
                  count: pendingDevices.length,
                  icon: <Clock className="h-6 w-6 text-yellow-500" />,
                  color: 'from-yellow-400/20 to-yellow-200/10',
                  description: 'Waiting to start'
                },
                {
                  label: 'In Progress',
                  count: inProgressDevices.length,
                  icon: <Settings className="h-6 w-6 text-blue-500" />,
                  color: 'from-blue-500/20 to-blue-400/10',
                  description: 'Currently testing'
                },
                {
                  label: 'Completed',
                  count: completedDevices.length,
                  icon: <CheckCircle className="h-6 w-6 text-green-500" />,
                  color: 'from-green-500/20 to-green-400/10',
                  description: 'Tests finished'
                }
              ].map((card, index) => (
                <GlassCard key={index} className={`p-4 cursor-pointer hover:scale-105 transition-all duration-200`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                        {card.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{card.label}</h3>
                        <p className="text-sm text-gray-600">{card.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{card.count}</div>
                    </div>
                  </div>
                </GlassCard>
              ));
            })()}
          </div>

          {/* Active Diagnostic Devices Grid */}
          {diagnosticsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-3 text-sm">Loading diagnostic devices...</p>
            </div>
          ) : diagnosticRequests.length === 0 ? (
            <GlassCard className="p-8 sm:p-12 text-center">
              <Stethoscope className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Diagnostic Devices</h3>
              <p className="text-gray-600 text-sm sm:text-base mb-6">Start by creating diagnostic requests to see devices here</p>
              <Link
                to="/diagnostics/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors duration-200 hover:shadow-md"
              >
                <Plus className="h-5 w-5" />
                Create Diagnostic Request
              </Link>
            </GlassCard>
          ) : (
            <div className="space-y-6">
              {/* Active Devices */}
              {(() => {
                const activeDevices = diagnosticRequests.flatMap(request => 
                  request.devices?.filter(device => device.result_status !== 'passed' && device.result_status !== 'failed' && device.result_status !== 'partially_failed').map(device => ({...device, request})) || []
                );
                
                return activeDevices.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Active Diagnostic Devices ({activeDevices.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {activeDevices.map(device => (
                        <div key={device.id} className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:scale-105 transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Stethoscope className="h-4 w-4 text-purple-600" />
                              </div>
                              <span className="font-medium text-gray-900 text-sm truncate">{device.device_name}</span>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              device.result_status === 'passed' ? 'text-green-600 bg-green-50 border border-green-200' :
                              device.result_status === 'failed' ? 'text-red-600 bg-red-50 border border-red-200' :
                              device.result_status === 'in_progress' ? 'text-blue-600 bg-blue-50 border border-blue-200' :
                              device.result_status === 'testing' ? 'text-orange-600 bg-orange-50 border border-orange-200' :
                              'text-yellow-600 bg-yellow-50 border border-yellow-200'
                            }`}>
                              {device.result_status || 'pending'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mb-4 space-y-1">
                            <div className="truncate">Request: {device.request.title}</div>
                            <div>Model: {device.model || 'N/A'}</div>
                            <div>Assigned: {device.request.assigned_to_user?.name || 'Unassigned'}</div>
                            <div>Created: {new Date(device.request.created_at).toLocaleDateString()}</div>
                          </div>
                          <Link 
                            to={`/diagnostics/device/${device.request.id}/${device.id}`}
                            className="block w-full text-center px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg font-medium transition-colors duration-200 hover:shadow-md"
                          >
                            View Details
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Completed Devices */}
              {(() => {
                const completedDevices = diagnosticRequests.flatMap(request => 
                  request.devices?.filter(device => device.result_status === 'passed' || device.result_status === 'failed' || device.result_status === 'partially_failed').map(device => ({...device, request})) || []
                );
                
                return completedDevices.length > 0 ? (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Completed Diagnostics ({completedDevices.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {completedDevices.slice(0, 4).map(device => (
                        <div key={device.id} className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:scale-105 transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="font-medium text-gray-900 text-sm truncate">{device.device_name}</span>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              device.result_status === 'passed' ? 'text-green-600 bg-green-50 border border-green-200' :
                              device.result_status === 'failed' ? 'text-red-600 bg-red-50 border border-red-200' :
                              'text-yellow-600 bg-yellow-50 border border-yellow-200'
                            }`}>
                              {device.result_status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mb-4 space-y-1">
                            <div className="truncate">Request: {device.request.title}</div>
                            <div>Model: {device.model || 'N/A'}</div>
                            <div>Completed: {new Date(device.updated_at || device.created_at).toLocaleDateString()}</div>
                          </div>
                          <Link 
                            to={`/diagnostics/device/${device.request.id}/${device.id}`}
                            className="block w-full text-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-medium transition-colors duration-200 hover:shadow-md"
                          >
                            View Results
                          </Link>
                        </div>
                      ))}
                    </div>
                    {completedDevices.length > 4 && (
                      <div className="mt-4 text-center">
                        <Link
                          to="/diagnostics/reports"
                          className="inline-flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors duration-200"
                        >
                          View All Completed ({completedDevices.length - 4} more)
                        </Link>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;