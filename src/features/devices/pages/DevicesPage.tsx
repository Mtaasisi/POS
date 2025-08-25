import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevices } from '../../../context/DevicesContext';
import { useAuth } from '../../../context/AuthContext';
import { Device, DeviceStatus } from '../../../types';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import DeviceCard from '../components/DeviceCard';
import { 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Download, 
  Upload,
  Smartphone,
  Users,
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
import { supabase } from '../../../lib/supabaseClient';

const DevicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { devices, loading, deleteDevice } = useDevices();
  const { currentUser } = useAuth();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'createdAt' | 'expectedReturnDate' | 'status' | 'customerName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

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
        setCustomers(customerData || []);
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
      const customerMatch = customerFilter === 'all' || device.customerId === customerFilter;

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
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devices for Repair</h1>
          <p className="text-gray-600">Manage all devices in the repair system</p>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton
            onClick={() => navigate('/devices/new')}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus size={16} />
            New Device
          </GlassButton>
          <GlassButton
            onClick={() => window.location.reload()}
            variant="secondary"
          >
            <RefreshCw size={16} />
          </GlassButton>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Devices</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Smartphone className="w-8 h-8 text-blue-600" />
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Active</p>
              <p className="text-2xl font-bold text-orange-900">{stats.active}</p>
            </div>
            <Wrench className="w-8 h-8 text-orange-600" />
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Overdue</p>
              <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
            </div>
            <X className="w-8 h-8 text-gray-600" />
          </div>
        </GlassCard>
      </div>

      {/* Filters and Search */}
      <GlassCard>
        <div className="space-y-4">
          {/* Search and View Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search devices, customers, or serial numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <FilterIcon size={16} />
                Filters
                {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </GlassButton>
              
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | 'all')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
                <select
                  value={technicianFilter}
                  onChange={(e) => setTechnicianFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Technicians</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Customers</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="createdAt">Date Created</option>
                <option value="expectedReturnDate">Return Date</option>
                <option value="status">Status</option>
                <option value="customerName">Customer Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </button>
            </div>

                         <div className="flex items-center gap-2">
               {filteredAndSortedDevices.length > 0 && (
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
               {selectedDevices.length > 0 && (
                 <span className="text-sm text-gray-600">
                   {selectedDevices.length} selected
                 </span>
               )}
               <GlassButton
                 onClick={clearFilters}
                 variant="secondary"
                 size="sm"
               >
                 Clear Filters
               </GlassButton>
             </div>
          </div>
        </div>
      </GlassCard>

      {/* Bulk Actions */}
      {selectedDevices.length > 0 && (
        <GlassCard className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedDevices.length} device(s) selected
            </span>
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={handleBulkDelete}
                variant="danger"
                size="sm"
              >
                <Trash2 size={16} />
                Delete Selected
              </GlassButton>
              <GlassButton
                onClick={() => setSelectedDevices([])}
                variant="secondary"
                size="sm"
              >
                Clear Selection
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Devices List */}
      {loading ? (
        <GlassCard>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading devices...</span>
          </div>
        </GlassCard>
      ) : filteredAndSortedDevices.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
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
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus size={16} />
              Add New Device
            </GlassButton>
          </div>
        </GlassCard>
      ) : (
                 <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
           {filteredAndSortedDevices.map(device => (
             <DeviceCard
               key={device.id}
               device={device}
               variant={viewMode === 'grid' ? 'default' : 'detailed'}
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
        <div className="text-center text-sm text-gray-600">
          Showing {filteredAndSortedDevices.length} of {devices.length} devices
        </div>
      )}
    </div>
  );
};

export default DevicesPage;
