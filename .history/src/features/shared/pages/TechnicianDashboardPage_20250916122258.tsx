import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { useUserGoals } from '../../../context/UserGoalsContext';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { PageErrorWrapper } from '../components/PageErrorWrapper';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import BarcodeScanner from '../../devices/components/BarcodeScanner';
import Modal from '../components/ui/Modal';
import { toast } from 'react-hot-toast';
import { smsService } from '../../../services/smsService';
import {
  Smartphone, Wrench, CheckCircle, Clock, AlertTriangle, 
  TrendingUp, Calendar, Eye, Package, User, Phone,
  RefreshCw, Search, Filter, Plus, ArrowRight, Target,
  Activity, Zap, Award, Timer, BarChart3, Settings,
  Bell, Star, ChevronRight, Play, Pause, RotateCcw,
  Layers, Grid3X3, List, MoreHorizontal, Download,
  Upload, MessageSquare, FileText, Camera, QrCode,
  MessageCircle, Edit3, Trash2, CheckSquare, Square,
  Focus, Maximize2, Minimize2, Volume2, VolumeX,
  Battery, Wifi, Signal, MapPin, Globe, Shield,
  TrendingDown, Users, DollarSign, PieChart, BarChart,
  CalendarDays, Clock3, TimerIcon, Gauge, Thermometer,
  Zap as Lightning, Heart, ThumbsUp, ThumbsDown,
  AlertCircle, Info, HelpCircle, ExternalLink, Copy,
  Share, Bookmark, Flag, Tag, Hash, AtSign, Hash as Hashtag
} from 'lucide-react';
import { Device, DeviceStatus } from '../../../types';

const TechnicianDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { devices, loading, getDeviceOverdueStatus, updateDeviceStatus } = useDevices();
  const { customers } = useCustomers();
  const { getGoalProgress } = useUserGoals();
  const navigate = useNavigate();
  
  // Error handling
  const { handleError, withErrorHandling } = useErrorHandler({
    maxRetries: 3,
    showToast: true,
    logToConsole: true
  });

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DeviceStatus>('all');
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // New feature states
  const [showScanner, setShowScanner] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showSparePartsModal, setShowSparePartsModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [goalProgress, setGoalProgress] = useState<any>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [sparePartsAlerts, setSparePartsAlerts] = useState<any[]>([]);
  const [workflowTasks, setWorkflowTasks] = useState<any[]>([]);
  const [mobileView, setMobileView] = useState(false);

  // Filter devices for technician role - only assigned devices
  const technicianDevices = useMemo(() => {
    let filtered = devices.filter(device => 
      device.assignedTo === currentUser?.id &&
      (hideCompleted ? device.status !== 'done' && device.status !== 'failed' : true)
    );
    
    if (focusMode) {
      // In focus mode, show only high priority devices
      filtered = filtered.filter(device => 
        ['assigned', 'diagnosis-started', 'awaiting-parts'].includes(device.status)
      );
    }
    
    return filtered;
  }, [devices, currentUser?.id, hideCompleted, focusMode]);

  // Apply search and status filters
  const filteredDevices = useMemo(() => {
    let filtered = technicianDevices;
    
    if (searchQuery) {
      filtered = filtered.filter(device => 
        device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.issueDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }
    
    return filtered;
  }, [technicianDevices, searchQuery, statusFilter]);

  // Get priority devices
  const dueToday = useMemo(() => 
    technicianDevices.filter(d => {
      const overdueStatus = getDeviceOverdueStatus(d);
      return overdueStatus.isDueToday && !overdueStatus.isOverdue;
    }), 
    [technicianDevices, getDeviceOverdueStatus]
  );
  
  const overdue = useMemo(() => 
    technicianDevices.filter(d => getDeviceOverdueStatus(d).isOverdue), 
    [technicianDevices, getDeviceOverdueStatus]
  );
  
  const inProgress = useMemo(() => 
    technicianDevices.filter(d => 
      ['diagnosis-started', 'in-repair', 'reassembled-testing'].includes(d.status)
    ), 
    [technicianDevices]
  );
  
  const readyForTesting = useMemo(() => 
    technicianDevices.filter(d => d.status === 'reassembled-testing'), 
    [technicianDevices]
  );
  
  const awaitingParts = useMemo(() => 
    technicianDevices.filter(d => d.status === 'awaiting-parts'), 
    [technicianDevices]
  );

  // Count devices by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    technicianDevices.forEach(device => {
      counts[device.status] = (counts[device.status] || 0) + 1;
    });
    return counts;
  }, [technicianDevices]);

  // Calculate repair statistics
  const repairStats = useMemo(() => {
    const total = technicianDevices.length;
    const completed = devices.filter(d => 
      d.assignedTo === currentUser?.id && 
      (d.status === 'done' || d.status === 'failed')
    ).length;
    
    return {
      total,
      active: total,
      completed,
      overdue: overdue.length,
      inProgress: inProgress.length,
      readyForTesting: readyForTesting.length,
      awaitingParts: awaitingParts.length,
      completionRate: total > 0 ? Math.round((completed / (total + completed)) * 100) : 0
    };
  }, [technicianDevices, devices, currentUser?.id, overdue.length, inProgress.length, readyForTesting.length, awaitingParts.length]);

  // Load dashboard data and new features
  useEffect(() => {
    const loadDashboardData = async () => {
      await withErrorHandling(async () => {
        setIsLoading(true);
        
        // Load goals progress
        try {
          const progress = await getGoalProgress('repairs_completed');
          setGoalProgress(progress);
        } catch (error) {
          console.warn('Goals not available:', error);
        }
        
        // Load performance stats
        loadPerformanceStats();
        
        // Load spare parts alerts
        loadSparePartsAlerts();
        
        // Load workflow tasks
        loadWorkflowTasks();
        
        // Load notifications
        loadNotifications();
        
        // Check mobile view
        setMobileView(window.innerWidth < 768);
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);
      }, 'Loading technician dashboard');
    };

    loadDashboardData();
  }, [withErrorHandling, getGoalProgress]);

  // Load performance statistics
  const loadPerformanceStats = () => {
    const completedThisWeek = devices.filter(d => 
      d.assignedTo === currentUser?.id && 
      d.status === 'done' && 
      new Date(d.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    const avgRepairTime = 2.5; // hours - would be calculated from actual data
    const successRate = 95; // percentage
    
    setPerformanceStats({
      completedThisWeek,
      avgRepairTime,
      successRate,
      totalRepairs: devices.filter(d => d.assignedTo === currentUser?.id && d.status === 'done').length
    });
  };

  // Load spare parts alerts
  const loadSparePartsAlerts = () => {
    const alerts = technicianDevices
      .filter(d => d.status === 'awaiting-parts')
      .map(device => ({
        id: device.id,
        device: `${device.brand} ${device.model}`,
        customer: device.customerName,
        partsNeeded: 'Screen, Battery', // Would come from actual data
        priority: 'high'
      }));
    setSparePartsAlerts(alerts);
  };

  // Load workflow tasks
  const loadWorkflowTasks = () => {
    const tasks = [
      { id: '1', title: 'Complete iPhone 12 screen replacement', priority: 'high', due: '2 hours' },
      { id: '2', title: 'Test Samsung Galaxy S21', priority: 'medium', due: '4 hours' },
      { id: '3', title: 'Order replacement parts for Pixel 6', priority: 'low', due: '1 day' }
    ];
    setWorkflowTasks(tasks);
  };

  // Load notifications
  const loadNotifications = () => {
    const notifs = [
      { id: '1', type: 'urgent', message: 'Device DEV-001 is overdue', time: '5 min ago' },
      { id: '2', type: 'info', message: 'New device assigned: iPhone 13', time: '1 hour ago' },
      { id: '3', type: 'success', message: 'Repair completed successfully', time: '2 hours ago' }
    ];
    setNotifications(notifs);
  };

  // Handle device selection
  const toggleDeviceSelection = (deviceId: string) => {
    const newSelected = new Set(selectedDevices);
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId);
    } else {
      newSelected.add(deviceId);
    }
    setSelectedDevices(newSelected);
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus: DeviceStatus) => {
    if (selectedDevices.size === 0) {
      toast.error('Please select devices first');
      return;
    }

    try {
      for (const deviceId of selectedDevices) {
        await updateDeviceStatus(deviceId, newStatus, `Bulk update by ${currentUser?.name}`);
      }
      toast.success(`Updated ${selectedDevices.size} devices to ${newStatus}`);
      setSelectedDevices(new Set());
    } catch (error) {
      toast.error('Failed to update devices');
    }
  };

  // Handle quick status update
  const handleQuickStatusUpdate = async (deviceId: string, newStatus: DeviceStatus) => {
    try {
      await updateDeviceStatus(deviceId, newStatus, `Quick update by ${currentUser?.name}`);
      toast.success(`Device status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update device status');
    }
  };

  // Handle SMS to customer
  const handleSendSMS = async (device: Device, message: string) => {
    try {
      const result = await smsService.sendSMS(
        device.phoneNumber?.replace(/\D/g, '') || '',
        message,
        device.customerId
      );
      if (result.success) {
        toast.success('SMS sent successfully');
      } else {
        toast.error('Failed to send SMS');
      }
    } catch (error) {
      toast.error('Failed to send SMS');
    }
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      handleError(error as Error, 'Navigation');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'diagnosis-started': return 'bg-yellow-100 text-yellow-800';
      case 'awaiting-parts': return 'bg-orange-100 text-orange-800';
      case 'in-repair': return 'bg-purple-100 text-purple-800';
      case 'reassembled-testing': return 'bg-indigo-100 text-indigo-800';
      case 'repair-complete': return 'bg-green-100 text-green-800';
      case 'returned-to-customer-care': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'in-repair': return <Wrench className="w-4 h-4 text-purple-600" />;
      case 'awaiting-parts': return <Package className="w-4 h-4 text-orange-600" />;
      case 'reassembled-testing': return <CheckCircle className="w-4 h-4 text-indigo-600" />;
      default: return <Smartphone className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading technician dashboard...</span>
      </div>
    );
  }

  return (
    <PageErrorWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>
                  <p className="text-sm text-gray-500">Welcome back, {currentUser?.name || 'Technician'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleNavigation('/devices')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <Eye className="w-4 h-4" />
                  All Devices
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
              <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Active Repairs</div>
              <div className="text-lg font-bold text-emerald-900">{repairStats.active}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
              <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Completed</div>
              <div className="text-lg font-bold text-blue-900">{repairStats.completed}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
              <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Overdue</div>
              <div className="text-lg font-bold text-orange-900">{repairStats.overdue}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
              <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Success Rate</div>
              <div className="text-lg font-bold text-purple-900">{repairStats.completionRate}%</div>
            </div>
          </div>

          {/* Priority Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {dueToday.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-gray-900">Due Today</h3>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {dueToday.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {dueToday.length} device{dueToday.length !== 1 ? 's' : ''} due for completion today
                </p>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  View Devices →
                </button>
              </div>
            )}

            {overdue.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-gray-900">Overdue</h3>
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {overdue.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {overdue.length} device{overdue.length !== 1 ? 's' : ''} past due date
                </p>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  View Devices →
                </button>
              </div>
            )}

            {readyForTesting.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">Ready for Testing</h3>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {readyForTesting.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {readyForTesting.length} device{readyForTesting.length !== 1 ? 's' : ''} ready for testing
                </p>
                <button
                  onClick={() => setStatusFilter('reassembled-testing')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View Devices →
                </button>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search devices by model, customer, or issue..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | DeviceStatus)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="assigned">Assigned</option>
                  <option value="diagnosis-started">Diagnosis Started</option>
                  <option value="awaiting-parts">Awaiting Parts</option>
                  <option value="in-repair">In Repair</option>
                  <option value="reassembled-testing">Ready for Testing</option>
                  <option value="repair-complete">Repair Complete</option>
                </select>
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {viewMode === 'grid' ? 'List' : 'Grid'}
                </button>
              </div>
            </div>
          </div>

          {/* Device List */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Your Assigned Devices</h2>
              <span className="text-sm text-gray-600">
                {filteredDevices.length} of {technicianDevices.length} devices
              </span>
            </div>
          
            {filteredDevices.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-4"
              }>
                {filteredDevices.map((device) => (
                  <div 
                    key={device.id} 
                    className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                      viewMode === 'list' ? 'flex items-center justify-between' : ''
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(device.status)}
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {device.brand} {device.model}
                              </h3>
                              <p className="text-sm text-gray-600">
                                SN: {device.serialNumber}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{device.customerName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{device.phoneNumber}</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Wrench className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span className="text-sm text-gray-900 line-clamp-2">{device.issueDescription}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                            {device.status?.replace('-', ' ')}
                          </span>
                          <button
                            onClick={() => handleNavigation(`/devices/${device.id}`)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(device.status)}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {device.brand} {device.model}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {device.customerName} • {device.phoneNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                            {device.status?.replace('-', ' ')}
                          </span>
                          <button
                            onClick={() => handleNavigation(`/devices/${device.id}`)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Devices Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No devices match your current filters.'
                    : 'You have no assigned devices at the moment.'
                  }
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleNavigation('/devices')}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Smartphone className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">All Devices</p>
                  <p className="text-sm text-gray-600">View all your assigned devices</p>
                </div>
              </button>

              <button
                onClick={() => handleNavigation('/lats/spare-parts')}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Package className="w-6 h-6 text-orange-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Spare Parts</p>
                  <p className="text-sm text-gray-600">Access spare parts inventory</p>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter('awaiting-parts')}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Clock className="w-6 h-6 text-purple-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Awaiting Parts</p>
                  <p className="text-sm text-gray-600">View devices waiting for parts</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageErrorWrapper>
  );
};

export default TechnicianDashboardPage;
