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
  Share, Bookmark, Flag, Tag, Hash, AtSign, Hash as Hashtag,
  X, DollarSign as Dollar, CreditCard,
  Shield as Warranty, Key, CheckCircle2, AlertTriangle as Warning,
  MessageSquare as Chat, PhoneCall, Mail,
  Wrench as Repair, TestTube, Clipboard,
  TrendingUp as Trending, Target as Goal,
  Bell as Notification, AlertCircle as Alert, Info as InfoIcon
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
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
      d.status === 'done'
    ).length;
    const failed = devices.filter(d => 
      d.assignedTo === currentUser?.id && 
      d.status === 'failed'
    ).length;
    const totalCompleted = completed + failed;
    
    return {
      total,
      active: total,
      completed,
      failed,
      overdue: overdue.length,
      inProgress: inProgress.length,
      readyForTesting: readyForTesting.length,
      awaitingParts: awaitingParts.length,
      successRate: totalCompleted > 0 ? Math.round((completed / totalCompleted) * 100) : 0
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
    
    const completed = devices.filter(d => d.assignedTo === currentUser?.id && d.status === 'done').length;
    const failed = devices.filter(d => d.assignedTo === currentUser?.id && d.status === 'failed').length;
    const totalCompleted = completed + failed;
    const successRate = totalCompleted > 0 ? Math.round((completed / totalCompleted) * 100) : 0;
    
    const avgRepairTime = 2.5; // hours - would be calculated from actual data
    
    setPerformanceStats({
      completedThisWeek,
      avgRepairTime,
      successRate,
      totalRepairs: completed
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

  // Helper functions for enhanced device information
  const getDaysOverdue = (device: Device) => {
    if (!device.expectedReturnDate) return 0;
    const expectedDate = new Date(device.expectedReturnDate);
    const today = new Date();
    const diffTime = today.getTime() - expectedDate.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getTimeInCurrentStatus = (device: Device) => {
    if (!device.updatedAt) return 0;
    const updatedDate = new Date(device.updatedAt);
    const today = new Date();
    const diffTime = today.getTime() - updatedDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPriorityLevel = (device: Device) => {
    const daysOverdue = getDaysOverdue(device);
    const timeInStatus = getTimeInCurrentStatus(device);
    
    if (daysOverdue > 3 || timeInStatus > 7) return 'high';
    if (daysOverdue > 1 || timeInStatus > 3) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWarrantyStatus = (device: Device) => {
    if (!device.warrantyEnd) return null;
    const warrantyEnd = new Date(device.warrantyEnd);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((warrantyEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', days: Math.abs(daysUntilExpiry) };
    if (daysUntilExpiry <= 30) return { status: 'expiring', days: daysUntilExpiry };
    return { status: 'active', days: daysUntilExpiry };
  };

  const formatCurrency = (amount: string | number | undefined) => {
    if (!amount) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const getRepairProgress = (device: Device) => {
    const statusOrder = [
      'assigned', 'diagnosis-started', 'awaiting-parts', 
      'in-repair', 'reassembled-testing', 'repair-complete', 'done'
    ];
    const currentIndex = statusOrder.indexOf(device.status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
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
      <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>
                  <p className="text-sm text-gray-600">Welcome back, {currentUser?.name || 'Technician'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile View Toggle */}
                <button 
                  onClick={() => setMobileView(!mobileView)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Toggle Mobile View"
                >
                  {mobileView ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                </button>
                
                {/* Focus Mode Toggle */}
                <button 
                  onClick={() => setFocusMode(!focusMode)}
                  className={`p-2 rounded-lg transition-colors ${focusMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  title="Focus Mode"
                >
                  <Focus className="w-5 h-5" />
                </button>
                
                {/* Hide Completed Toggle */}
                <button 
                  onClick={() => setHideCompleted(!hideCompleted)}
                  className={`p-2 rounded-lg transition-colors ${hideCompleted ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  title="Hide Completed"
                >
                  <Eye className="w-5 h-5" />
                </button>
                
                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors relative"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* Scanner */}
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan</span>
                </button>
                
                {/* All Devices */}
                <button
                  onClick={() => handleNavigation('/devices')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">All Devices</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6" style={{ backgroundColor: 'transparent' }}>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Active Repairs</div>
                  <div className="text-2xl font-bold text-emerald-900">{repairStats.active}</div>
                </div>
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Completed</div>
                  <div className="text-2xl font-bold text-blue-900">{repairStats.completed}</div>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Overdue</div>
                  <div className="text-2xl font-bold text-orange-900">{repairStats.overdue}</div>
                </div>
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-purple-900">{repairStats.successRate}%</div>
                </div>
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Goals & Performance Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Goals Progress */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Daily Goals</h3>
                </div>
                <button
                  onClick={() => setShowGoalsModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View All
                </button>
              </div>
              {goalProgress ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Repairs Completed</span>
                    <span className="text-sm font-medium text-gray-900">{goalProgress.current}/{goalProgress.goal}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((goalProgress.current / goalProgress.goal) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    {goalProgress.current >= goalProgress.goal ? (
                      <span className="text-green-600 font-medium text-sm">🎉 Goal Achieved!</span>
                    ) : (
                      <span className="text-gray-600 text-sm">{goalProgress.goal - goalProgress.current} more to go</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Goals not available</p>
                </div>
              )}
            </div>

            {/* Performance Stats */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Performance</h3>
                </div>
                <button
                  onClick={() => setShowPerformanceModal(true)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium px-3 py-1 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Details
                </button>
              </div>
              {performanceStats ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="text-sm font-medium text-gray-900">{performanceStats.completedThisWeek} repairs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Time</span>
                    <span className="text-sm font-medium text-gray-900">{performanceStats.avgRepairTime}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-medium text-green-600">{performanceStats.successRate}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Loading performance data...</p>
                </div>
              )}
            </div>

            {/* Spare Parts Alerts */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Parts Needed</h3>
                </div>
                <button
                  onClick={() => setShowSparePartsModal(true)}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  View All
                </button>
              </div>
              {sparePartsAlerts.length > 0 ? (
                <div className="space-y-2">
                  {sparePartsAlerts.slice(0, 3).map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.device}</p>
                        <p className="text-xs text-gray-600">{alert.partsNeeded}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        alert.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.priority}
                      </span>
                    </div>
                  ))}
                  {sparePartsAlerts.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">+{sparePartsAlerts.length - 3} more</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No parts needed</p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Priority Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {dueToday.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Due Today</h3>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {dueToday.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {dueToday.length} device{dueToday.length !== 1 ? 's' : ''} due for completion today
                </p>
                <div className="space-y-2 mb-4">
                  {dueToday.slice(0, 2).map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{device.brand} {device.model}</p>
                        <p className="text-xs text-gray-600">{device.customerName}</p>
                      </div>
                      <span className="text-xs text-yellow-700 font-medium">
                        {formatCurrency(device.repairCost)}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  View All →
                </button>
              </div>
            )}

            {overdue.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Overdue</h3>
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {overdue.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {overdue.length} device{overdue.length !== 1 ? 's' : ''} past due date
                </p>
                <div className="space-y-2 mb-4">
                  {overdue.slice(0, 2).map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{device.brand} {device.model}</p>
                        <p className="text-xs text-red-600 font-medium">
                          {getDaysOverdue(device)} days overdue
                        </p>
                      </div>
                      <span className="text-xs text-red-700 font-medium">
                        {formatCurrency(device.repairCost)}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  View All →
                </button>
              </div>
            )}

            {readyForTesting.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Ready for Testing</h3>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {readyForTesting.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {readyForTesting.length} device{readyForTesting.length !== 1 ? 's' : ''} ready for testing
                </p>
                <div className="space-y-2 mb-4">
                  {readyForTesting.slice(0, 2).map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{device.brand} {device.model}</p>
                        <p className="text-xs text-gray-600">{device.customerName}</p>
                      </div>
                      <span className="text-xs text-indigo-700 font-medium">
                        {formatCurrency(device.repairCost)}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStatusFilter('reassembled-testing')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All →
                </button>
              </div>
            )}

            {/* High Priority Devices */}
            {technicianDevices.filter(d => getPriorityLevel(d) === 'high').length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Warning className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-gray-900">High Priority</h3>
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {technicianDevices.filter(d => getPriorityLevel(d) === 'high').length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {technicianDevices.filter(d => getPriorityLevel(d) === 'high').length} high priority device{technicianDevices.filter(d => getPriorityLevel(d) === 'high').length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2 mb-4">
                  {technicianDevices.filter(d => getPriorityLevel(d) === 'high').slice(0, 2).map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{device.brand} {device.model}</p>
                        <p className="text-xs text-red-600 font-medium">
                          {getDaysOverdue(device) > 0 ? `${getDaysOverdue(device)} days overdue` : 
                           getTimeInCurrentStatus(device) > 3 ? `${getTimeInCurrentStatus(device)} days in status` : 'High priority'}
                        </p>
                      </div>
                      <span className="text-xs text-red-700 font-medium">
                        {formatCurrency(device.repairCost)}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  View All →
                </button>
              </div>
            )}
          </div>

          {/* Search and Filters with Bulk Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search devices by model, customer, or issue..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | DeviceStatus)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
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
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  {viewMode === 'grid' ? 'List' : 'Grid'}
                </button>
              </div>
            </div>
            
            {/* Bulk Actions */}
            {selectedDevices.size > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {selectedDevices.size} device{selectedDevices.size !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkStatusUpdate('diagnosis-started')}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Start Diagnosis
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate('in-repair')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark In Repair
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate('reassembled-testing')}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Ready for Testing
                    </button>
                    <button
                      onClick={() => setSelectedDevices(new Set())}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Device List */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Your Assigned Devices</h2>
              </div>
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
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
                    className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                      selectedDevices.has(device.id) ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : 'hover:border-gray-300'
                    } ${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedDevices.has(device.id)}
                              onChange={() => toggleDeviceSelection(device.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            {/* Device Thumbnail */}
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {device.images && device.images.length > 0 ? (
                                <img
                                  src={device.images[0]}
                                  alt={`${device.brand} ${device.model}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center ${device.images && device.images.length > 0 ? 'hidden' : ''}`}>
                                {getStatusIcon(device.status)}
                              </div>
                            </div>
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
                          
                          {/* Enhanced Repair Information */}
                          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-100">
                            {/* Time Information */}
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-blue-500" />
                                <span className="text-xs text-gray-500">Due Date</span>
                              </div>
                              <p className="text-xs font-medium text-gray-900">
                                {device.expectedReturnDate ? 
                                  new Date(device.expectedReturnDate).toLocaleDateString() : 'N/A'
                                }
                              </p>
                              {getDaysOverdue(device) > 0 && (
                                <span className="text-xs text-red-600 font-medium">
                                  {getDaysOverdue(device)} days overdue
                                </span>
                              )}
                            </div>
                            
                            {/* Financial Information */}
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <Dollar className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-gray-500">Repair Cost</span>
                              </div>
                              <p className="text-xs font-medium text-gray-900">
                                {formatCurrency(device.repairCost)}
                              </p>
                              {device.depositAmount && (
                                <p className="text-xs text-gray-600">
                                  Deposit: {formatCurrency(device.depositAmount)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Priority and Progress */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(getPriorityLevel(device))}`}>
                                {getPriorityLevel(device).toUpperCase()} PRIORITY
                              </span>
                              {device.warrantyEnd && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <Warranty className="w-3 h-3 mr-1" />
                                  WARRANTY
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Progress</div>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${getRepairProgress(device)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                            {device.status?.replace('-', ' ')}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSendSMS(device, 'Your device repair is in progress. We will update you soon.')}
                              className="p-1 text-green-600 hover:text-green-800 transition-colors"
                              title="Send SMS"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            {device.unlockCode && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(device.unlockCode || '');
                                  toast.success('Unlock code copied to clipboard');
                                }}
                                className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
                                title="Copy Unlock Code"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleNavigation(`/devices/${device.id}`)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedDevices.has(device.id)}
                            onChange={() => toggleDeviceSelection(device.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          {/* Device Thumbnail */}
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {device.images && device.images.length > 0 ? (
                              <img
                                src={device.images[0]}
                                alt={`${device.brand} ${device.model}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center ${device.images && device.images.length > 0 ? 'hidden' : ''}`}>
                              {getStatusIcon(device.status)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {device.brand} {device.model}
                              </h3>
                              <div className="flex items-center space-x-2 ml-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(getPriorityLevel(device))}`}>
                                  {getPriorityLevel(device).toUpperCase()}
                                </span>
                                {device.warrantyEnd && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Warranty className="w-3 h-3 mr-1" />
                                    WARRANTY
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {device.customerName} • {device.phoneNumber}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {device.issueDescription}
                            </p>
                            
                            {/* Enhanced Information Row */}
                            <div className="grid grid-cols-4 gap-4 mt-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-500">Due Date</p>
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {device.expectedReturnDate ? 
                                      new Date(device.expectedReturnDate).toLocaleDateString() : 'N/A'
                                    }
                                  </p>
                                  {getDaysOverdue(device) > 0 && (
                                    <p className="text-xs text-red-600 font-medium">
                                      {getDaysOverdue(device)} days overdue
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Dollar className="w-3 h-3 text-green-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-500">Cost</p>
                                  <p className="text-xs font-medium text-gray-900">
                                    {formatCurrency(device.repairCost)}
                                  </p>
                                  {device.depositAmount && (
                                    <p className="text-xs text-gray-600">
                                      Deposit: {formatCurrency(device.depositAmount)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-500">In Status</p>
                                  <p className="text-xs font-medium text-gray-900">
                                    {getTimeInCurrentStatus(device)} days
                                  </p>
                                  {device.repairCount && device.repairCount > 1 && (
                                    <p className="text-xs text-gray-600">
                                      {device.repairCount} repairs
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Trending className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-500">Progress</p>
                                  <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                      style={{ width: `${getRepairProgress(device)}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    {Math.round(getRepairProgress(device))}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                            {device.status?.replace('-', ' ')}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSendSMS(device, 'Your device repair is in progress. We will update you soon.')}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                              title="Send SMS"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            {device.unlockCode && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(device.unlockCode || '');
                                  toast.success('Unlock code copied to clipboard');
                                }}
                                className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Copy Unlock Code"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleNavigation(`/devices/${device.id}`)}
                              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
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
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleNavigation('/devices')}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">All Devices</p>
                  <p className="text-sm text-gray-600">View all your assigned devices</p>
                </div>
              </button>

              <button
                onClick={() => handleNavigation('/lats/spare-parts')}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors group"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Spare Parts</p>
                  <p className="text-sm text-gray-600">Access spare parts inventory</p>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter('awaiting-parts')}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Awaiting Parts</p>
                  <p className="text-sm text-gray-600">View devices waiting for parts</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Panel */}
        {showNotifications && (
          <div className="fixed top-20 right-4 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'urgent' ? 'bg-red-500' :
                      notification.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barcode Scanner Modal */}
        {showScanner && (
          <BarcodeScanner
            onClose={() => setShowScanner(false)}
            onScan={(result) => {
              setSearchQuery(result);
              setShowScanner(false);
              toast.success(`Scanned: ${result}`);
            }}
          />
        )}

        {/* Goals Modal */}
        <Modal isOpen={showGoalsModal} onClose={() => setShowGoalsModal(false)} title="Daily Goals" maxWidth="md">
          <div className="p-6 space-y-4">
            {goalProgress ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Repairs Completed</h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-700">Progress</span>
                    <span className="text-sm font-medium text-blue-900">{goalProgress.current}/{goalProgress.goal}</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((goalProgress.current / goalProgress.goal) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  {goalProgress.current >= goalProgress.goal ? (
                    <div className="text-green-600 font-medium">
                      🎉 Congratulations! You've achieved your daily goal!
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      Keep going! {goalProgress.goal - goalProgress.current} more repairs to reach your goal.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Goals not available</p>
              </div>
            )}
          </div>
        </Modal>

        {/* Performance Modal */}
        <Modal isOpen={showPerformanceModal} onClose={() => setShowPerformanceModal(false)} title="Performance Analytics" maxWidth="lg">
          <div className="p-6 space-y-6">
            {performanceStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">This Week</h4>
                  <p className="text-2xl font-bold text-green-900">{performanceStats.completedThisWeek}</p>
                  <p className="text-sm text-green-700">repairs completed</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Average Time</h4>
                  <p className="text-2xl font-bold text-blue-900">{performanceStats.avgRepairTime}h</p>
                  <p className="text-sm text-blue-700">per repair</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">Success Rate</h4>
                  <p className="text-2xl font-bold text-purple-900">{performanceStats.successRate}%</p>
                  <p className="text-sm text-purple-700">repair success</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 mb-2">Total Repairs</h4>
                  <p className="text-2xl font-bold text-orange-900">{performanceStats.totalRepairs}</p>
                  <p className="text-sm text-orange-700">all time</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Performance data not available</p>
              </div>
            )}
          </div>
        </Modal>

        {/* Spare Parts Modal */}
        <Modal isOpen={showSparePartsModal} onClose={() => setShowSparePartsModal(false)} title="Spare Parts Needed" maxWidth="lg">
          <div className="p-6 space-y-4">
            {sparePartsAlerts.length > 0 ? (
              <div className="space-y-3">
                {sparePartsAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{alert.device}</h4>
                      <p className="text-sm text-gray-600">Customer: {alert.customer}</p>
                      <p className="text-sm text-orange-700">Parts needed: {alert.partsNeeded}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleNavigation('/lats/spare-parts')}
                        className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Order Parts
                      </button>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        alert.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No spare parts needed at the moment</p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </PageErrorWrapper>
  );
};

export default TechnicianDashboardPage;
