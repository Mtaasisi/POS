import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { useDevices } from '../../../../context/DevicesContext';
import { useCustomers } from '../../../../context/CustomersContext';
import { useUserGoals } from '../../../../context/UserGoalsContext';
import GlassCard from '../ui/GlassCard';
import DeviceCard from '../DeviceCard';
import SearchBar from '../ui/SearchBar';
import BarcodeScanner from '../../../devices/components/BarcodeScanner';
import { Link } from 'react-router-dom';
import { PlusCircle, Smartphone, CheckCircle, UserCheck, QrCode, Clock, AlertTriangle, TrendingUp, Calendar, Settings, Trophy, Star, Stethoscope, ChevronDown, ChevronUp, Eye, Wrench, PackageCheck, Hammer } from 'lucide-react';
import { DeviceStatus, Device } from '../../../types';

import { getDiagnosticRequests } from '../../../../lib/diagnosticsApi';
import { DiagnosticRequest } from '../../types/diagnostics';
import UserGoalsManagement from '../../../admin/components/UserGoalsManagement';
import AdminGoalsManagement from '../../../admin/components/AdminGoalsManagement';
import GlassButton from '../ui/GlassButton';
import { supabase } from '../../../../lib/supabaseClient';

interface TechnicianDashboardProps {
  devices: Device[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | DeviceStatus;
  setStatusFilter: (status: 'all' | DeviceStatus) => void;
}

const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({
  devices,
  loading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter
}) => {
  const { currentUser } = useAuth();
  const { getOverdueDevices } = useDevices();
  const { getGoalProgress } = useUserGoals();
  const [showScanner, setShowScanner] = useState(false);
  const [_assignedReturns, setAssignedReturns] = useState<any[]>([]);
  const [_returnsLoading, setReturnsLoading] = useState(true);
  
  // Add diagnostic devices state
  const [diagnosticRequests, setDiagnosticRequests] = useState<DiagnosticRequest[]>([]);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(true);
  

  
  // Add state for goals management modal
  const [showGoalsManagement, setShowGoalsManagement] = useState(false);
  const [showAdminGoalsManagement, setShowAdminGoalsManagement] = useState(false);
  
  // Add state for expanding the goals card
  const [expanded, setExpanded] = useState(false);
  
  // Add mobile-specific state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileGoals, setShowMobileGoals] = useState(false);
  
  // Add goals-related state
  const [dailyGoal, setDailyGoal] = useState(5);
  const [progress, setProgress] = useState(0);



  // Load diagnostic devices for technician
  useEffect(() => {
    async function loadDiagnostics() {
      if (!currentUser || currentUser.role !== 'technician') {
        return;
      }
      setDiagnosticsLoading(true);
      try {
        const data = await getDiagnosticRequests({ assigned_to: currentUser.id });
        setDiagnosticRequests(data || []);
      } catch (error) {
        console.error('Error loading diagnostic requests:', error);
        setDiagnosticRequests([]);
      } finally {
        setDiagnosticsLoading(false);
      }
    }
    loadDiagnostics();
  }, [currentUser]);



  // Set default status filter to "all" for technicians to show all assigned devices
  useEffect(() => {
    if (currentUser?.role === 'technician' && statusFilter === 'assigned') {
      setStatusFilter('all');
    }
  }, [currentUser?.role, statusFilter, setStatusFilter]);

  // Get user-specific daily goal and progress
  useEffect(() => {
    const fetchUserGoal = async () => {
      if (currentUser?.id) {
        try {
          const goalProgress = await getGoalProgress('repairs_completed');
          setDailyGoal(goalProgress.goal);
          setProgress(goalProgress.progress);
        } catch (error) {
          console.warn('Goals system not available yet:', error);
          // Set default values if goals system is not available
          setDailyGoal(5);
          setProgress(0);
        }
      }
    };
    fetchUserGoal();
  }, [currentUser?.id, getGoalProgress]);



  // Filter devices for technician role - devices are already filtered at DB level, just exclude completed devices
  const technicianDevices = devices.filter(device => 
    device.status !== 'repair-complete' && 
    device.status !== 'done'
  );

  // Apply search and status filters
  const filteredDevices = useMemo(() => {
    // Always start with only assigned devices for technicians
    let filtered = technicianDevices;
    
    if (searchQuery) {
      filtered = filtered.filter(device => 
        device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.serialNumber && device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.phoneNumber && device.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.remarks && device.remarks.some(r => r.content && r.content.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }
    
    return filtered;
  }, [technicianDevices, searchQuery, statusFilter]);

  // Get priority devices - filter for current technician since these functions return all devices
  const dueToday = getDevicesDueToday().filter(d => d.assignedTo === currentUser?.id);
  const overdue = getOverdueDevices().filter(d => d.assignedTo === currentUser?.id);
  const inProgress = technicianDevices.filter(d => 
    ['diagnosis-started', 'in-repair', 'reassembled-testing'].includes(d.status)
  );
  const readyForTesting = technicianDevices.filter(d => d.status === 'reassembled-testing');
  const awaitingParts = technicianDevices.filter(d => d.status === 'awaiting-parts');

  // Count devices by status - use technicianDevices (all assigned) not filteredDevices
  const countByStatus = (status: DeviceStatus) => {
    return technicianDevices.filter(d => d.status === status).length;
  };

  const priorityCards = [
    {
      label: 'Overdue',
      count: overdue.length,
      icon: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />,
      color: 'from-red-500/20 to-red-400/10',
      priority: 'high'
    },
    {
      label: 'Due Today',
      count: dueToday.length,
      icon: <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />,
      color: 'from-orange-500/20 to-orange-400/10',
      priority: 'medium'
    },
    {
      label: 'In Progress',
      count: inProgress.length,
      icon: <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />,
      color: 'from-blue-500/20 to-blue-400/10',
      priority: 'medium'
    },
    {
      label: 'Ready for Testing',
      count: readyForTesting.length,
      icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-500" />,
      color: 'from-cyan-500/20 to-cyan-400/10',
      priority: 'low'
    },
    {
      label: 'Awaiting Parts',
      count: awaitingParts.length,
      icon: <PackageCheck className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />,
      color: 'from-yellow-500/20 to-yellow-400/10',
      priority: 'low'
    }
  ];

  const statusCards = [
    {
      label: 'Diagnosis',
      count: countByStatus('diagnosis-started'),
      icon: <Hammer className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />,
      status: 'diagnosis-started' as DeviceStatus,
      color: 'from-blue-500/20 to-blue-400/10'
    },
    {
      label: 'Awaiting Parts',
      count: countByStatus('awaiting-parts'),
      icon: <PackageCheck className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />,
      status: 'awaiting-parts' as DeviceStatus,
      color: 'from-yellow-400/20 to-yellow-200/10'
    },
    {
      label: 'In Repair',
      count: countByStatus('in-repair'),
      icon: <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />,
      status: 'in-repair' as DeviceStatus,
      color: 'from-purple-500/20 to-purple-400/10'
    },
    {
      label: 'Testing',
      count: countByStatus('reassembled-testing'),
      icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-500" />,
      status: 'reassembled-testing' as DeviceStatus,
      color: 'from-cyan-500/20 to-blue-200/10'
    }
  ];

  // Show notifications for priority items
  useEffect(() => {
    if (overdue.length > 0) {
      toast.error(`You have ${overdue.length} overdue device${overdue.length > 1 ? 's' : ''}! Please take action.`, { 
        id: 'technician-overdue-reminder',
        duration: 6000
      });
    } else if (dueToday.length > 0) {
      toast(`You have ${dueToday.length} device${dueToday.length > 1 ? 's' : ''} due today.`, { 
        id: 'technician-due-today-reminder',
        duration: 4000
      });
    }
  }, [overdue.length, dueToday.length]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Goals Card - Collapsible */}
      <div className="sm:hidden">
        <div
          className="mb-4 flex flex-col gap-0 justify-between py-4 px-4 bg-white/90 rounded-xl transition-all duration-300 cursor-pointer"
          onClick={() => setShowMobileGoals(!showMobileGoals)}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left: Trophy Icon in circle */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
                <Trophy size={24} className="text-yellow-500" />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-gray-900">{currentUser?.points ?? 0}</span>
                <span className="text-lg font-bold text-gray-700">Daily points</span>
              </div>
            </div>
            {/* Right: Expand/Collapse Icon */}
            <div className="flex gap-2 items-center text-base font-bold">
              <span className="flex items-center gap-1 text-blue-600 text-sm"><Wrench size={16} />{inProgress.length}</span>
              <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle size={16} />{readyForTesting.length}</span>
              {showMobileGoals ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </div>
        
        {/* Mobile Goals Details */}
        {showMobileGoals && (
          <div className="mb-4 bg-white/90 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              {/* In Progress */}
              <div className="flex flex-col items-center justify-center bg-white rounded-lg p-3 border border-blue-100">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 mb-1"><Wrench size={20} className="text-blue-500" /></span>
                <span className="text-xl font-extrabold text-gray-900 mb-1">{inProgress.length}</span>
                <span className="text-xs font-semibold text-gray-500">In Progress</span>
              </div>
              {/* Ready for Testing */}
              <div className="flex flex-col items-center justify-center bg-white rounded-lg p-3 border border-green-100">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 mb-1"><CheckCircle size={20} className="text-green-500" /></span>
                <span className="text-xl font-extrabold text-gray-900 mb-1">{readyForTesting.length}</span>
                <span className="text-xs font-semibold text-gray-500">Ready for Testing</span>
              </div>
              {/* Awaiting Parts */}
              <div className="flex flex-col items-center justify-center bg-white rounded-lg p-3 border border-yellow-100">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 mb-1"><PackageCheck size={20} className="text-yellow-500" /></span>
                <span className="text-xl font-extrabold text-gray-900 mb-1">{awaitingParts.length}</span>
                <span className="text-xs font-semibold text-gray-500">Awaiting Parts</span>
              </div>
              {/* Completed Today */}
              <div className="flex flex-col items-center justify-center bg-white rounded-lg p-3 border border-emerald-100">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 mb-1"><CheckCircle size={20} className="text-emerald-500" /></span>
                <span className="text-xl font-extrabold text-gray-900 mb-1">{filteredDevices.filter(d => d.status === 'repair-complete').length}</span>
                <span className="text-xs font-semibold text-gray-500">Completed</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Goals Card */}
      <div className="hidden sm:block">
        <div
          className={`mb-4 flex flex-col gap-0 justify-between py-4 px-6 bg-white/90 rounded-xl transition-all duration-300 cursor-pointer ${expanded ? 'shadow-2xl scale-[1.03]' : ''}`}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center justify-between gap-5">
            {/* Left: Trophy Icon in circle */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100">
                <Trophy size={28} className="text-yellow-500" />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-gray-900">{currentUser?.points ?? 0}</span>
                <span className="text-2xl font-bold text-gray-700">Daily points</span>
              </div>
            </div>
            {/* Right: Progress Icons Only */}
            <div className="flex gap-4 items-center text-base font-bold">
              <span className="flex items-center gap-1 text-blue-600"><Wrench size={20} />{inProgress.length}</span>
              <span className="flex items-center gap-1 text-green-600"><CheckCircle size={20} />{readyForTesting.length}</span>
              <span className="flex items-center gap-1 text-yellow-600"><PackageCheck size={20} />{awaitingParts.length}</span>
              <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={20} />{filteredDevices.filter(d => d.status === 'repair-complete').length}</span>
            </div>
          </div>
          {/* Expandable details */}
          <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[400px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* In Progress */}
              <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-blue-100">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2"><Wrench size={28} className="text-blue-500" /></span>
                <span className="text-3xl font-extrabold text-gray-900 mb-1">{inProgress.length}</span>
                <span className="text-xs font-semibold text-gray-500 mb-2">In Progress</span>
                <div className="w-full h-1 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-1 bg-blue-500 rounded-full transition-all duration-1000 animate-progress" style={{ width: `${Math.min(100, Math.round((inProgress.length / dailyGoal) * 100))}%` }} />
                </div>
              </div>
              {/* Ready for Testing */}
              <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-green-100">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-2"><CheckCircle size={28} className="text-green-500" /></span>
                <span className="text-3xl font-extrabold text-gray-900 mb-1">{readyForTesting.length}</span>
                <span className="text-xs font-semibold text-gray-500 mb-2">Ready for Testing</span>
                <div className="w-full h-1 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-1 bg-green-500 rounded-full transition-all duration-1000 animate-progress" style={{ width: `${Math.min(100, Math.round((readyForTesting.length / dailyGoal) * 100))}%` }} />
                </div>
              </div>
              {/* Awaiting Parts */}
              <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-yellow-100">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-2"><PackageCheck size={28} className="text-yellow-500" /></span>
                <span className="text-3xl font-extrabold text-gray-900 mb-1">{awaitingParts.length}</span>
                <span className="text-xs font-semibold text-gray-500 mb-2">Awaiting Parts</span>
                <div className="w-full h-1 bg-yellow-100 rounded-full overflow-hidden">
                  <div className="h-1 bg-yellow-500 rounded-full transition-all duration-1000 animate-progress" style={{ width: `${Math.min(100, Math.round((awaitingParts.length / dailyGoal) * 100))}%` }} />
                </div>
              </div>
              {/* Completed Today */}
              <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-emerald-100">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-2"><CheckCircle size={28} className="text-emerald-500" /></span>
                <span className="text-3xl font-extrabold text-gray-900 mb-1">{filteredDevices.filter(d => d.status === 'repair-complete').length}</span>
                <span className="text-xs font-semibold text-gray-500 mb-2">Completed</span>
                <div className="w-full h-1 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-1 bg-emerald-500 rounded-full transition-all duration-1000 animate-progress" style={{ width: `${Math.min(100, Math.round((filteredDevices.filter(d => d.status === 'repair-complete').length / dailyGoal) * 100))}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Cards - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {priorityCards.map((card, index) => (
          <GlassCard 
            key={index} 
            className={`bg-gradient-to-br ${card.color} p-3 sm:p-4`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-center sm:text-left">
                <p className="text-sm sm:text-lg font-medium text-gray-600">{card.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{card.count}</p>
              </div>
              <div className="flex justify-center sm:justify-end">
                {card.icon}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => setShowScanner(true)}
          className="inline-flex items-center gap-2 bg-purple-500/70 hover:bg-purple-600/70 text-white py-3 px-4 rounded-lg border border-purple-300/30 backdrop-blur-md transition-all duration-300 text-sm sm:text-base min-h-[44px]"
        >
          <QrCode size={18} />
          <span>Scan Device</span>
        </button>
      </div>

      {/* Search Bar - Mobile Optimized */}
      <div className="mb-4">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search devices..."
          className="w-full"
          suggestions={Array.from(new Set([
            ...devices.map(d => d.id),
            ...devices.map(d => d.customerName),
            ...devices.map(d => d.brand),
            ...devices.map(d => d.model),
            ...devices.map(d => d.serialNumber || ''),
            ...devices.map(d => d.phoneNumber || ''),
            ...devices.flatMap(d => d.remarks ? d.remarks.map(r => r.content) : [])
          ].filter(Boolean)))}
        />
      </div>

      {/* Mobile Filter Toggle */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 text-sm font-medium"
        >
          <span>Filters ({statusFilter === 'all' ? 'All' : statusFilter})</span>
          {showMobileFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Status Filter Buttons - Mobile Optimized */}
      <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block flex flex-wrap gap-2 mb-4 sm:mb-6`}>
        {/* All Button */}
        <button
          onClick={() => setStatusFilter('all')}
          className={`relative px-4 sm:px-6 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border min-w-[80px] sm:min-w-[100px] min-h-[44px] ${
            statusFilter === 'all'
              ? 'bg-blue-500/90 text-white border-blue-400/50 shadow-lg shadow-blue-500/25'
              : 'bg-white/60 text-gray-700 border-gray-200/50 hover:bg-white/80 hover:border-blue-300/50 hover:shadow-md'
          }`}
        >
          All
          {technicianDevices.length > 0 && (
            <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
              statusFilter === 'all'
                ? 'bg-white text-blue-500 shadow-sm'
                : 'bg-red-500 text-white shadow-sm'
            }`}>
              {technicianDevices.length}
            </span>
          )}
        </button>
        
        {/* Status Filter Buttons */}
        {statusCards.map((card) => (
          <button
            key={card.status}
            onClick={() => setStatusFilter(card.status)}
            className={`relative px-4 sm:px-6 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border min-w-[80px] sm:min-w-[100px] min-h-[44px] ${
              statusFilter === card.status
                ? 'bg-blue-500/90 text-white border-blue-400/50 shadow-lg shadow-blue-500/25'
                : 'bg-white/60 text-gray-700 border-gray-200/50 hover:bg-white/80 hover:border-blue-300/50 hover:shadow-md'
            }`}
          >
            {card.label}
            {card.count > 0 && (
              <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                statusFilter === card.status
                  ? 'bg-white text-blue-500 shadow-sm'
                  : 'bg-red-500 text-white shadow-sm'
              }`}>
                {card.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Live Device Preview for Search - Mobile Optimized */}
      {searchQuery && filteredDevices.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow p-2 mb-4 max-h-48 sm:max-h-64 overflow-y-auto">
          <div className="text-xs text-gray-500 px-2 pb-1">Matching Devices</div>
          {filteredDevices.slice(0, 6).map((device, idx) => (
            <div key={device.id + '-' + idx} className="px-2 py-2 border-b last:border-0 flex flex-col">
              <span className="font-medium text-gray-900 text-sm">
                {highlightMatch(device.brand, searchQuery)} {highlightMatch(device.model, searchQuery)}
              </span>
              <span className="text-xs text-gray-600">
                {highlightMatch(device.customerName, searchQuery)}
              </span>
              <span className="text-xs text-gray-400">ID: {highlightMatch(device.id, searchQuery)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Device List - Mobile Optimized */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading your assigned devices...</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="text-center py-8">
            <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No assigned devices found</p>
            <p className="text-sm text-gray-500">
              {technicianDevices.length === 0 
                ? "You don't have any devices assigned to you yet." 
                : "Try adjusting your search or filters"
              }
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Your Assigned Devices ({filteredDevices.length})
              </h3>
              {technicianDevices.length !== filteredDevices.length && (
                <span className="text-sm text-gray-500 hidden sm:inline">
                  Showing {filteredDevices.length} of {technicianDevices.length} devices
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredDevices.map((device, idx) => (
                <DeviceCard key={`${device.id}-${idx}`} device={device} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Diagnostic Devices Section - Mobile Optimized */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-purple-500" />
            <span className="hidden sm:inline">Diagnostic Devices</span>
            <span className="sm:hidden">Diagnostics</span>
            <span className="text-sm text-gray-500">({diagnosticRequests.flatMap(r => r.devices || []).length})</span>
          </h3>
          <Link 
            to="/diagnostics/assigned"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            <span className="hidden sm:inline">View All →</span>
            <span className="sm:hidden">View All</span>
          </Link>
        </div>
        
        {diagnosticsLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-2 text-sm">Loading diagnostic devices...</p>
          </div>
        ) : diagnosticRequests.length === 0 ? (
          <GlassCard className="p-4 sm:p-6 text-center">
            <Stethoscope className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No diagnostic devices assigned</p>
            <p className="text-xs text-gray-500 mt-1">You'll see diagnostic devices here when they're assigned to you</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {diagnosticRequests.flatMap(request => 
              request.devices?.map(device => (
                <div key={device.id} className="
                  backdrop-blur-xl bg-white/70 rounded-xl 
                  border border-white/30 shadow-lg 
                  p-4 sm:p-6 transition-all duration-300 
                  hover:bg-white/80 hover:shadow-xl hover:border-white/40
                  hover:backdrop-blur-2xl hover:scale-[1.02]
                  cursor-pointer active:scale-[0.98]
                  group transform transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl cursor-pointer relative overflow-hidden
                ">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-3 right-3 z-20">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 shadow-lg backdrop-blur-sm ${
                      device.result_status === 'passed' ? 'text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                      device.result_status === 'failed' ? 'text-red-700 bg-gradient-to-r from-red-50 to-pink-50 border-red-200' :
                      'text-yellow-700 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                    }`}>
                      <CheckCircle className="h-5 w-5" />
                      <span className="capitalize">{device.result_status || 'pending'}</span>
                    </span>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4 pt-8 pr-20">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center border-2 border-purple-200 shadow-sm">
                          <Stethoscope className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate" title={device.device_name}>{device.device_name}</h3>
                        <p className="text-sm text-gray-600 font-mono truncate" title={`S/N: ${device.serial_number || 'N/A'}`}>S/N: {device.serial_number || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {device.result_status === 'passed' ? '8/8 tests completed' : 
                           device.result_status === 'failed' ? 'Tests failed' : 
                           'Tests pending'}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ease-out ${
                            device.result_status === 'passed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            device.result_status === 'failed' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                            'bg-gradient-to-r from-yellow-500 to-orange-500'
                          }`} style={{ width: device.result_status === 'passed' ? '100%' : device.result_status === 'failed' ? '100%' : '0%' }}></div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 p-2 bg-purple-50/50 rounded-lg border border-purple-100">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 font-medium">Created</p>
                          <p className="text-sm font-semibold text-purple-700 truncate">
                            {new Date(request.created_at || Date.now()).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 font-medium">Assigned</p>
                          <p className="text-sm font-semibold text-blue-700 truncate">
                            {request.assigned_to || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-800">Request</span>
                      </div>
                      <p className="text-sm text-indigo-700 font-medium truncate">{request.title}</p>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <Link 
                        to={`/diagnostics/device/${request.id}/${device.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              )) || []
            )}
          </div>
        )}
      </div>



      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScanner onClose={() => setShowScanner(false)} />
      )}

      {/* User Goals Management Modal */}
      <UserGoalsManagement
        isOpen={showGoalsManagement}
        onClose={() => setShowGoalsManagement(false)}
      />

      {/* Admin Goals Management Modal */}
      <AdminGoalsManagement
        isOpen={showAdminGoalsManagement}
        onClose={() => setShowAdminGoalsManagement(false)}
      />
    </div>
  );
};

// Helper function for highlighting
function highlightMatch(text: string, query: string) {
  if (!text) return '';
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<span className="bg-yellow-200 text-black font-bold">{text.slice(idx, idx + query.length)}</span>{text.slice(idx + query.length)}</>;
}

export default TechnicianDashboard; 