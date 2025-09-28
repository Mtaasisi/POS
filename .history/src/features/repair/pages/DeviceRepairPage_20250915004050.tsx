import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Wrench, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  MoreVertical
} from 'lucide-react';
import { useDevices } from '../../../context/DevicesContext';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../context/CustomersContext';
import { Device, DeviceStatus } from '../../../types';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassBadge from '../../shared/components/ui/GlassBadge';
import Modal from '../../shared/components/ui/Modal';
import DeviceCard, { sortDevicesForAction, removeDuplicateDevices } from '../../devices/components/DeviceCard';

type RepairStatusFilter = 'all' | 'active' | 'completed' | 'overdue';
type SortOption = 'date' | 'status' | 'customer' | 'priority';

interface RepairStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  averageRepairTime: number;
  completionRate: number;
}

export const DeviceRepairPage: React.FC = () => {
  const { devices, loading, getDeviceOverdueStatus } = useDevices();
  const { currentUser } = useAuth();
  const { customers } = useCustomers();
  const navigate = useNavigate();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RepairStatusFilter>('active');
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and sort devices
  const filteredDevices = useMemo(() => {
    let filtered = [...devices];

    // Remove duplicates
    filtered = removeDuplicateDevices(filtered);

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(device => 
        device.model?.toLowerCase().includes(term) ||
        device.brand?.toLowerCase().includes(term) ||
        device.serialNumber?.toLowerCase().includes(term) ||
        device.customerName?.toLowerCase().includes(term) ||
        device.issueDescription?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    switch (statusFilter) {
      case 'active':
        filtered = filtered.filter(device => 
          device.status && !['done', 'failed'].includes(device.status)
        );
        break;
      case 'completed':
        filtered = filtered.filter(device => 
          device.status === 'done' || device.status === 'failed'
        );
        break;
      case 'overdue':
        filtered = filtered.filter(device => 
          getDeviceOverdueStatus(device).isOverdue
        );
        break;
      case 'all':
      default:
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'status':
          return a.status?.localeCompare(b.status || '') || 0;
        case 'customer':
          return (a.customerName || '').localeCompare(b.customerName || '');
        case 'priority':
          const aOverdue = getDeviceOverdueStatus(a).isOverdue ? 1 : 0;
          const bOverdue = getDeviceOverdueStatus(b).isOverdue ? 1 : 0;
          return bOverdue - aOverdue;
        default:
          return 0;
      }
    });

    return filtered;
  }, [devices, searchTerm, statusFilter, sortOption, getDeviceOverdueStatus]);

  // Calculate repair statistics
  const repairStats = useMemo((): RepairStats => {
    const total = devices.length;
    const active = devices.filter(d => d.status && !['done', 'failed'].includes(d.status)).length;
    const completed = devices.filter(d => d.status === 'done').length;
    const overdue = devices.filter(d => getDeviceOverdueStatus(d).isOverdue).length;
    
    // Calculate average repair time for completed devices
    const completedDevices = devices.filter(d => d.status === 'done');
    const averageRepairTime = completedDevices.length > 0 
      ? completedDevices.reduce((sum, device) => {
          const createdAt = new Date(device.createdAt || 0);
          const doneTime = device.transitions?.find(t => t.toStatus === 'done')?.timestamp;
          if (doneTime) {
            return sum + (new Date(doneTime).getTime() - createdAt.getTime());
          }
          return sum;
        }, 0) / completedDevices.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      active,
      completed,
      overdue,
      averageRepairTime,
      completionRate
    };
  }, [devices, getDeviceOverdueStatus]);

  // Handle device selection
  const handleDeviceSelect = (deviceId: string, selected: boolean) => {
    const newSelected = new Set(selectedDevices);
    if (selected) {
      newSelected.add(deviceId);
    } else {
      newSelected.delete(deviceId);
    }
    setSelectedDevices(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedDevices.size === filteredDevices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(filteredDevices.map(d => d.id)));
    }
  };

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'diagnosis-started': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'awaiting-parts': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in-repair': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reassembled-testing': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'repair-complete': return 'bg-green-100 text-green-800 border-green-200';
      case 'returned-to-customer-care': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'done': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading repair data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Repair Center</h1>
            <p className="text-gray-600">Manage and track device repairs with advanced tools</p>
          </div>
          <div className="flex items-center space-x-3">
            <GlassButton
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              icon={viewMode === 'grid' ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={() => navigate('/devices/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              New Device
            </GlassButton>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{repairStats.total}</p>
              </div>
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Repairs</p>
                <p className="text-2xl font-bold text-orange-600">{repairStats.active}</p>
              </div>
              <Wrench className="w-8 h-8 text-orange-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{repairStats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{repairStats.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{repairStats.completionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </GlassCard>
        </div>

        {/* Search and Filters */}
        <GlassCard className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <GlassInput
                type="text"
                placeholder="Search devices, customers, or issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'active', 'completed', 'overdue'] as RepairStatusFilter[]).map((filter) => (
                <GlassButton
                  key={filter}
                  variant={statusFilter === filter ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter(filter)}
                  size="sm"
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </GlassButton>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex gap-2">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
                <option value="customer">Sort by Customer</option>
                <option value="priority">Sort by Priority</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedDevices.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedDevices.size} device{selectedDevices.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <GlassButton variant="outline" size="sm">
                    Bulk Update
                  </GlassButton>
                  <GlassButton variant="danger" size="sm">
                    Delete Selected
                  </GlassButton>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {statusFilter === 'all' ? 'All Devices' : 
             statusFilter === 'active' ? 'Active Repairs' :
             statusFilter === 'completed' ? 'Completed Repairs' :
             'Overdue Repairs'} ({filteredDevices.length})
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedDevices.size === filteredDevices.length && filteredDevices.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Select All</span>
          </div>
        </div>

        {/* Device Grid/List */}
        {filteredDevices.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'No devices match the current filters'}
            </p>
            <GlassButton
              variant="primary"
              onClick={() => navigate('/devices/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              Add First Device
            </GlassButton>
          </GlassCard>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredDevices.map((device) => (
              <div key={device.id} className="relative">
                <DeviceCard
                  device={device}
                  showDetails={true}
                  selected={selectedDevices.has(device.id)}
                  onSelect={handleDeviceSelect}
                  showSelection={true}
                />
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassButton
              variant="outline"
              onClick={() => navigate('/devices/new')}
              icon={<Plus className="w-5 h-5" />}
              className="h-auto p-4 flex-col"
            >
              <span className="font-medium">New Device</span>
              <span className="text-sm text-gray-600">Add a new device for repair</span>
            </GlassButton>

            <GlassButton
              variant="outline"
              onClick={() => navigate('/devices')}
              icon={<Smartphone className="w-5 h-5" />}
              className="h-auto p-4 flex-col"
            >
              <span className="font-medium">All Devices</span>
              <span className="text-sm text-gray-600">View all devices in the system</span>
            </GlassButton>

            <GlassButton
              variant="outline"
              onClick={() => navigate('/customers')}
              icon={<Users className="w-5 h-5" />}
              className="h-auto p-4 flex-col"
            >
              <span className="font-medium">Customers</span>
              <span className="text-sm text-gray-600">Manage customer information</span>
            </GlassButton>

            <GlassButton
              variant="outline"
              onClick={() => navigate('/reports')}
              icon={<TrendingUp className="w-5 h-5" />}
              className="h-auto p-4 flex-col"
            >
              <span className="font-medium">Reports</span>
              <span className="text-sm text-gray-600">View repair analytics</span>
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default DeviceRepairPage;
