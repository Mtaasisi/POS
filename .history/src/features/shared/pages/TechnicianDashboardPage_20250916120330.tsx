import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { PageErrorWrapper } from '../components/PageErrorWrapper';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import {
  Smartphone, Wrench, CheckCircle, Clock, AlertTriangle, 
  TrendingUp, Calendar, Eye, Package, User, Phone,
  RefreshCw, Search, Filter, Plus, ArrowRight, Target,
  Activity, Zap, Award, Timer, BarChart3, Settings,
  Bell, Star, ChevronRight, Play, Pause, RotateCcw,
  Layers, Grid3X3, List, MoreHorizontal, Download,
  Upload, MessageSquare, FileText, Camera, QrCode
} from 'lucide-react';
import { Device, DeviceStatus } from '../../../types';

const TechnicianDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { devices, loading, getDeviceOverdueStatus } = useDevices();
  const { customers } = useCustomers();
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

  // Filter devices for technician role - only assigned devices
  const technicianDevices = useMemo(() => {
    return devices.filter(device => 
      device.assignedTo === currentUser?.id &&
      device.status !== 'done' &&
      device.status !== 'failed'
    );
  }, [devices, currentUser?.id]);

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

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      await withErrorHandling(async () => {
        setIsLoading(true);
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);
      }, 'Loading technician dashboard');
    };

    loadDashboardData();
  }, [withErrorHandling]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Repair Center
                  </h1>
                  <p className="text-sm text-gray-600">Welcome back, {currentUser?.name || 'Technician'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleNavigation('/devices')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">All Devices</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">

          {/* Modern Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{repairStats.active}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">In Progress</span>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">+12%</span>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{repairStats.completed}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">This Week</span>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">+8%</span>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{repairStats.overdue}</p>
                  <p className="text-sm text-gray-600">Overdue</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Needs Attention</span>
                <div className="flex items-center text-red-600">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Urgent</span>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{repairStats.completionRate}%</p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">This Month</span>
                <div className="flex items-center text-blue-600">
                  <Award className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Excellent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Workflow Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Due Today */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Due Today</h3>
                    <p className="text-sm text-gray-600">Priority repairs</p>
                  </div>
                </div>
                <div className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full">
                  {dueToday.length}
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                {dueToday.length} device{dueToday.length !== 1 ? 's' : ''} need completion today
              </p>
              <button
                onClick={() => setStatusFilter('all')}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 font-medium"
              >
                View All Devices
              </button>
            </div>

            {/* Overdue */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Overdue</h3>
                    <p className="text-sm text-gray-600">Urgent attention</p>
                  </div>
                </div>
                <div className="bg-red-100 text-red-800 text-sm font-bold px-3 py-1 rounded-full">
                  {overdue.length}
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                {overdue.length} device{overdue.length !== 1 ? 's' : ''} past due date
              </p>
              <button
                onClick={() => setStatusFilter('all')}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 px-4 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-medium"
              >
                Handle Urgent
              </button>
            </div>

            {/* Ready for Testing */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Ready for Testing</h3>
                    <p className="text-sm text-gray-600">Final testing</p>
                  </div>
                </div>
                <div className="bg-indigo-100 text-indigo-800 text-sm font-bold px-3 py-1 rounded-full">
                  {readyForTesting.length}
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                {readyForTesting.length} device{readyForTesting.length !== 1 ? 's' : ''} ready for testing
              </p>
              <button
                onClick={() => setStatusFilter('reassembled-testing')}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-2 px-4 rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 font-medium"
              >
                Start Testing
              </button>
            </div>
          </div>

          {/* Modern Search and Controls */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search devices by model, customer, or issue..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | DeviceStatus)}
                  className="px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
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
                  className="px-4 py-3 bg-white/50 border border-gray-200 rounded-xl hover:bg-white transition-all duration-200 flex items-center space-x-2"
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  <span className="hidden sm:inline">{viewMode === 'grid' ? 'List' : 'Grid'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modern Device List */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Assigned Devices</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredDevices.length} of {technicianDevices.length} devices
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          
            {filteredDevices.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredDevices.map((device) => (
                  <div 
                    key={device.id} 
                    className={`bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                      viewMode === 'list' ? 'flex items-center justify-between' : ''
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                              {getStatusIcon(device.status)}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">
                                {device.brand} {device.model}
                              </h3>
                              <p className="text-sm text-gray-600">
                                SN: {device.serialNumber}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center space-x-3">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">{device.customerName}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{device.phoneNumber}</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <Wrench className="w-4 h-4 text-gray-500 mt-0.5" />
                            <span className="text-sm text-gray-700 line-clamp-2">{device.issueDescription}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(device.status)}`}>
                            {device.status?.replace('-', ' ')}
                          </span>
                          <button
                            onClick={() => handleNavigation(`/devices/${device.id}`)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                            {getStatusIcon(device.status)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {device.brand} {device.model}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {device.customerName} • {device.phoneNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(device.status)}`}>
                            {device.status?.replace('-', ' ')}
                          </span>
                          <button
                            onClick={() => handleNavigation(`/devices/${device.id}`)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
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
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="p-6">
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
        </GlassCard>
      </div>
    </PageErrorWrapper>
  );
};

export default TechnicianDashboardPage;
