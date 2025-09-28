import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevices } from '../../../context/DevicesContext';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../context/CustomersContext';
import { Device, DeviceStatus } from '../../../types';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import DeviceCard from '../components/DeviceCard';
import DeviceRepairDetailModal from '../components/DeviceRepairDetailModal';
import { 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Download, 
  Upload,
  Smartphone,
  Users,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Grid3X3,
  List,
  BarChart3,
  Filter as FilterIcon,
  X,
  ChevronDown,
  ChevronUp,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { updateDeviceInDb } from '../../../lib/deviceApi';
import { supabase } from '../../../lib/supabaseClient';

const DevicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Safely access customers context with error handling
  let customers: any[] = [];
  try {
    const customersContext = useCustomers();
    customers = customersContext?.customers || [];
  } catch (error) {
    console.warn('Customers context not available:', error);
  }
  
  // Safely access devices context with error handling
  let devices: any[] = [];
  let loading = false;
  let deleteDevice: any = null;
  
  try {
    const devicesContext = useDevices();
    devices = devicesContext?.devices || [];
    loading = devicesContext?.loading || false;
    deleteDevice = devicesContext?.deleteDevice || null;
  } catch (error) {
    console.warn('Devices context not available:', error);
  }
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'createdAt' | 'expectedReturnDate' | 'status' | 'customerName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  
  // Modal states for device actions
  const [showDeviceDetailModal, setShowDeviceDetailModal] = useState(false);
  const [showDeviceEditModal, setShowDeviceEditModal] = useState(false);
  const [selectedDeviceForDetail, setSelectedDeviceForDetail] = useState<string | null>(null);
  const [selectedDeviceForEdit, setSelectedDeviceForEdit] = useState<Device | null>(null);

  // Fetch technicians and customers for filters
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // Fetch technicians
        const { data: techData } = await supabase
          .from('auth_users')
          .select('id, name, email')
          .eq('role', 'technician');
        setTechnicians(techData || []);

        // Fetch customers
        const { data: customerData } = await supabase
          .from('customers')
          .select('id, name, phone')
          .order('name');
        setCustomersList(customerData || []);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };

    fetchFilterData();
  }, []);

  // Filter and sort devices
  const filteredAndSortedDevices = useMemo(() => {
    const filtered = devices.filter(device => {
      // Search filter
      const searchMatch = searchQuery === '' || 
        device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.phoneNumber.includes(searchQuery);

      // Status filter
      const statusMatch = statusFilter === 'all' || device.status === statusFilter;

      // Technician filter
      const technicianMatch = technicianFilter === 'all' || device.assignedTo === technicianFilter;

      // Customer filter
      const customerMatch = customerFilter === 'all' || device.customerName === customerFilter;

      // Date filter
      let dateMatch = true;
      if (dateFilter !== 'all') {
        const deviceDate = new Date(device.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        switch (dateFilter) {
          case 'today':
            dateMatch = deviceDate >= today;
            break;
          case 'week':
            dateMatch = deviceDate >= weekAgo;
            break;
          case 'month':
            dateMatch = deviceDate >= monthAgo;
            break;
        }
      }

      return searchMatch && statusMatch && technicianMatch && customerMatch && dateMatch;
    });

    // Sort devices
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'expectedReturnDate':
          aValue = new Date(a.expectedReturnDate);
          bValue = new Date(b.expectedReturnDate);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'customerName':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [devices, searchQuery, statusFilter, technicianFilter, customerFilter, dateFilter, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = devices.length;
    const active = devices.filter(d => !['done', 'failed'].includes(d.status)).length;
    const overdue = devices.filter(d => {
      if (d.status === 'done' || d.status === 'failed') return false;
      if (!d.expectedReturnDate) return false;
      return new Date(d.expectedReturnDate) < new Date();
    }).length;
    const completed = devices.filter(d => d.status === 'done').length;
    const failed = devices.filter(d => d.status === 'failed').length;

    return { total, active, overdue, completed, failed };
  }, [devices]);

  // Handle device selection
  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDevices.length === filteredAndSortedDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredAndSortedDevices.map(d => d.id));
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      // Clear selections when exiting selection mode
      setSelectedDevices([]);
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedDevices.length} devices?`)) return;
    
    try {
      for (const deviceId of selectedDevices) {
        await deleteDevice(deviceId);
      }
      setSelectedDevices([]);
      toast.success(`Successfully deleted ${selectedDevices.length} devices`);
    } catch (error) {
      toast.error('Error deleting devices');
    }
  };

  const handleBulkAssign = async (technicianId: string) => {
    // Implementation for bulk assignment
    toast.success(`Assigned ${selectedDevices.length} devices to technician`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTechnicianFilter('all');
    setCustomerFilter('all');
    setDateFilter('all');
    setSelectedDevices([]);
  };

  const getStatusCount = (status: DeviceStatus) => {
    return devices.filter(d => d.status === status).length;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Devices for Repair</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-500">Manage all devices in the repair system</span>
              <span className="text-sm text-gray-400">• {stats.total} total devices</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <GlassButton
              onClick={() => navigate('/devices/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              <Plus size={16} />
              New Device
            </GlassButton>
            <GlassButton
              onClick={toggleSelectionMode}
              variant={isSelectionMode ? "danger" : "secondary"}
              className="px-4 py-2"
            >
              {isSelectionMode ? (
                <>
                  <X size={16} />
                  Cancel Select
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Select
                </>
              )}
            </GlassButton>
            <GlassButton
              onClick={() => window.location.reload()}
              variant="secondary"
              className="px-4 py-2"
            >
              <RefreshCw size={16} />
            </GlassButton>
          </div>
        </div>

        {/* Statistics Cards - Enhanced Design */}
        <div className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Total Devices</div>
              <div className="text-xl font-bold text-blue-900">{stats.total}</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Active</div>
              <div className="text-xl font-bold text-orange-900">{stats.active}</div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">Overdue</div>
              <div className="text-xl font-bold text-red-900">{stats.overdue}</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Completed</div>
              <div className="text-xl font-bold text-green-900">{stats.completed}</div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">Failed</div>
              <div className="text-xl font-bold text-gray-900">{stats.failed}</div>
            </div>
          </div>
        </div>

        {/* Filters and Search - Enhanced Design */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4">
            <FilterIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Filters & Search</h3>
          </div>
          
          {/* Search and View Controls */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search devices, customers, or serial numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <GlassButton
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                variant="secondary"
                className="flex items-center gap-2 px-4 py-2"
              >
                <FilterIcon size={16} />
                Filters
                {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </GlassButton>
              
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | 'all')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="assigned">Assigned</option>
                  <option value="diagnosis-started">Diagnosis Started</option>
                  <option value="awaiting-parts">Awaiting Parts</option>
                  <option value="in-repair">In Repair</option>
                  <option value="reassembled-testing">Testing</option>
                  <option value="repair-complete">Repair Complete</option>
                  <option value="returned-to-customer-care">Returned to Care</option>
                  <option value="done">Done</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Technician</label>
                <select
                  value={technicianFilter}
                  onChange={(e) => setTechnicianFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Technicians</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Customers</option>
                  {customersList.map(customer => (
                    <option key={customer.id} value={customer.name}>{customer.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          )}

          {/* Sort Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">Date Created</option>
                <option value="expectedReturnDate">Return Date</option>
                <option value="status">Status</option>
                <option value="customerName">Customer Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isSelectionMode && filteredAndSortedDevices.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={selectedDevices.length === filteredAndSortedDevices.length && filteredAndSortedDevices.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Select All
                </label>
              )}
              {isSelectionMode && selectedDevices.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedDevices.length} selected
                </span>
              )}
              <GlassButton
                onClick={clearFilters}
                variant="secondary"
                size="sm"
                className="px-3 py-1"
              >
                Clear Filters
              </GlassButton>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDevices.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedDevices.length} device(s) selected
              </span>
              <div className="flex items-center gap-2">
                <GlassButton
                  onClick={handleBulkDelete}
                  variant="danger"
                  size="sm"
                  className="px-3 py-1"
                >
                  <Trash2 size={16} />
                  Delete Selected
              </GlassButton>
                <GlassButton
                  onClick={() => setSelectedDevices([])}
                  variant="secondary"
                  size="sm"
                  className="px-3 py-1"
                >
                  Clear Selection
                </GlassButton>
              </div>
            </div>
          </div>
        )}

        {/* Devices List */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading devices...</span>
            </div>
          </div>
        ) : filteredAndSortedDevices.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12">
            <div className="text-center">
              <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' || technicianFilter !== 'all' || customerFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by adding your first device for repair.'
                }
              </p>
              <GlassButton
                onClick={() => navigate('/devices/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                <Plus size={16} />
                Add New Device
              </GlassButton>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50 bg-gray-50/50">
                    {isSelectionMode && (
                      <th className="text-left py-6 px-4 font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedDevices.length === filteredAndSortedDevices.length && filteredAndSortedDevices.length > 0}
                          onChange={toggleSelectAll}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                      </th>
                    )}
                    <th className="text-left py-6 px-4 font-medium text-gray-700">Device</th>
                    <th className="text-left py-6 px-4 font-medium text-gray-700">Serial</th>
                    <th className="text-left py-6 px-4 font-medium text-gray-700">Customer</th>
                    <th className="text-left py-6 px-4 font-medium text-gray-700">Issue & Notes</th>
                    <th className="text-center py-6 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-6 px-4 font-medium text-gray-700">Technician</th>
                    <th className="text-left py-6 px-4 font-medium text-gray-700">Timeline</th>
                    <th className="text-right py-6 px-4 font-medium text-gray-700">Costs</th>
                    <th className="text-center py-6 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedDevices.map((device, index) => (
                    <tr 
                      key={device.id} 
                      className={`border-b border-gray-100 hover:bg-blue-50/70 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                        selectedDevices.includes(device.id) ? 'bg-blue-50/50' : ''
                      } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                      onClick={() => {
                        setSelectedDeviceForDetail(device.id);
                        setShowDeviceDetailModal(true);
                      }}
                    >
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <td className="py-6 px-4">
                          <input
                            type="checkbox"
                            checked={selectedDevices.includes(device.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleDeviceSelection(device.id);
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                      )}

                      {/* Device Info */}
                      <td className="py-6 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Smartphone className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate" title={`${device.brand} ${device.model}`}>
                              {device.brand} {device.model}
                            </div>
                            {device.unlockCode && (
                              <div className="text-xs text-orange-600">
                                Unlock: {device.unlockCode}
                              </div>
                            )}
                            {device.deviceCondition && Object.keys(device.deviceCondition).length > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                {Object.entries(device.deviceCondition)
                                  .filter(([_, value]) => value)
                                  .map(([key, _]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
                                  .slice(0, 1)
                                  .join(', ')}
                                {Object.values(device.deviceCondition).filter(Boolean).length > 1 && '...'}
                              </div>
                            )}
                            {device.blacklistCheckResult && device.blacklistCheckResult !== 'clean' && (
                              <div className="text-xs text-red-600">
                                Blacklist: {device.blacklistCheckResult}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Serial Number */}
                      <td className="py-6 px-4 max-w-xs">
                        <div className="text-sm text-gray-700 font-mono truncate" title={device.serialNumber || '-'}>
                          {device.serialNumber || '-'}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-6 px-4 max-w-xs">
                        <div>
                          <div className="font-medium text-gray-900 truncate" title={device.customerName}>
                            {device.customerName}
                          </div>
                        </div>
                      </td>

                      {/* Issue & Notes */}
                      <td className="py-6 px-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-700 truncate" title={device.issueDescription || device.issue}>
                            {device.issueDescription || device.issue || 'No issue description'}
                          </div>
                          {device.deviceNotes && (
                            <div className="text-xs text-gray-500 truncate mt-1" title={device.deviceNotes}>
                              Note: {device.deviceNotes}
                            </div>
                          )}
                          {device.diagnosisRequired && (
                            <div className="text-xs text-orange-600 mt-1">
                              Diagnosis Required
                            </div>
                          )}
                          {device.deviceImages && device.deviceImages.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {device.deviceImages.length} image{device.deviceImages.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-6 px-4">
                        <div className="flex justify-center">
                          <StatusBadge status={device.status} />
                        </div>
                        {device.remarks && device.remarks.length > 0 && (
                          <div className="text-xs text-center text-blue-600 mt-1">
                            {device.remarks.length} remark{device.remarks.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>


                      {/* Technician */}
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {device.assignedTo ? technicians.find(t => t.id === device.assignedTo)?.name || 'Unknown' : 'Unassigned'}
                          </span>
                        </div>
                        {device.estimatedHours && (
                          <div className="text-xs text-gray-500 mt-1">
                            Est: {device.estimatedHours}h
                          </div>
                        )}
                      </td>

                      {/* Timeline */}
                      <td className="py-6 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {device.expectedReturnDate 
                                ? new Date(device.expectedReturnDate).toLocaleDateString()
                                : 'Not set'
                              }
                            </span>
                          </div>
                          {device.lastReturnDate && (
                            <div className="text-xs text-gray-500">
                              Last: {new Date(device.lastReturnDate).toLocaleDateString()}
                            </div>
                          )}
                          {device.pickupScheduledDate && (
                            <div className="text-xs text-green-600">
                              Pickup: {new Date(device.pickupScheduledDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Costs */}
                      <td className="py-6 px-4 text-right">
                        <div className="space-y-1">
                          {device.repairCost && (
                            <div className="font-medium text-gray-900">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'TZS',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(parseFloat(device.repairCost))}
                            </div>
                          )}
                          {device.deviceCost && (
                            <div className="text-xs text-gray-500">
                              Device: {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'TZS',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(parseFloat(device.deviceCost))}
                            </div>
                          )}
                          {!device.repairCost && !device.deviceCost && (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </div>
                      </td>


                      {/* Actions */}
                      <td className="py-6 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open device detail modal
                              setSelectedDeviceForDetail(device.id);
                              setShowDeviceDetailModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open device edit modal
                              setSelectedDeviceForEdit(device);
                              setShowDeviceEditModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Device"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this device?')) {
                                deleteDevice(device.id);
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Device"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                variant="default"
                showDetails={true}
                selected={selectedDevices.includes(device.id)}
                onSelect={toggleDeviceSelection}
                showSelection={false}
              />
            ))}
          </div>
        )}

        {/* Results Summary */}
        {filteredAndSortedDevices.length > 0 && (
          <div className="text-center text-sm text-gray-600 mt-6">
            Showing {filteredAndSortedDevices.length} of {devices.length} devices
          </div>
        )}
      </div>
      
      {/* Device Detail Modal */}
      {selectedDeviceForDetail && (
        <DeviceRepairDetailModal
          isOpen={showDeviceDetailModal}
          onClose={() => {
            setShowDeviceDetailModal(false);
            setSelectedDeviceForDetail(null);
          }}
          deviceId={selectedDeviceForDetail}
        />
      )}
      
      {/* Device Edit Modal */}
      {selectedDeviceForEdit && showDeviceEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Device</h3>
                <button
                  onClick={() => {
                    setShowDeviceEditModal(false);
                    setSelectedDeviceForEdit(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedDeviceForEdit?.id) return;
                
                try {
                  await updateDeviceInDb(selectedDeviceForEdit.id, selectedDeviceForEdit);
                  toast.success('Device updated successfully');
                  setShowDeviceEditModal(false);
                  setSelectedDeviceForEdit(null);
                  // Refresh the devices list
                  window.location.reload();
                } catch (error) {
                  console.error('Error updating device:', error);
                  toast.error('Failed to update device');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={selectedDeviceForEdit.brand || ''}
                      onChange={(e) => setSelectedDeviceForEdit({
                        ...selectedDeviceForEdit,
                        brand: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={selectedDeviceForEdit.model || ''}
                      onChange={(e) => setSelectedDeviceForEdit({
                        ...selectedDeviceForEdit,
                        model: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={selectedDeviceForEdit.serialNumber || ''}
                      onChange={(e) => setSelectedDeviceForEdit({
                        ...selectedDeviceForEdit,
                        serialNumber: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Description
                    </label>
                    <textarea
                      value={selectedDeviceForEdit.issueDescription || ''}
                      onChange={(e) => setSelectedDeviceForEdit({
                        ...selectedDeviceForEdit,
                        issueDescription: e.target.value
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={selectedDeviceForEdit.status || ''}
                      onChange={(e) => setSelectedDeviceForEdit({
                        ...selectedDeviceForEdit,
                        status: e.target.value as DeviceStatus
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="assigned">Assigned</option>
                      <option value="diagnosis-started">Diagnosis Started</option>
                      <option value="awaiting-parts">Awaiting Parts</option>
                      <option value="in-repair">In Repair</option>
                      <option value="reassembled-testing">Reassembled Testing</option>
                      <option value="repair-complete">Repair Complete</option>
                      <option value="returned-to-customer-care">Returned to Customer Care</option>
                      <option value="done">Done</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeviceEditModal(false);
                      setSelectedDeviceForEdit(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { DevicesPage };
export default DevicesPage;
