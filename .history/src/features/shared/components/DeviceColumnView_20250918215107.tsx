import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Device, DeviceStatus } from '../../../types';
import StatusBadge from './ui/StatusBadge';
import { 
  Clock, User, Smartphone, Wrench, Calendar, AlarmClock, CheckSquare, 
  MessageSquare, Edit, AlertTriangle, Star, DollarSign, Phone, Mail,
  ChevronRight, MoreVertical, Eye, Zap, Shield, Activity, TrendingUp,
  PhoneCall, MessageCircle, FileText, Calendar as CalendarIcon, Timer,
  ArrowRight, ExternalLink, Copy, Share2, Download, Printer, ChevronUp, ChevronDown,
  ArrowUpDown, Filter, Search, CheckCircle2, Circle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../context/CustomersContext';
import { useDevices } from '../../../context/DevicesContext';
import { updateDeviceInDb, fixCorruptedDeviceData } from '../../../lib/deviceApi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

interface DeviceColumnViewProps {
  devices: Device[];
  loading: boolean;
  onDeviceSelect?: (device: Device) => void;
  onBulkAction?: (devices: Device[], action: string) => void;
}

interface SortConfig {
  key: keyof Device | 'customerName' | 'createdAt';
  direction: 'asc' | 'desc';
}

const DeviceColumnView: React.FC<DeviceColumnViewProps> = ({
  devices,
  loading,
  onDeviceSelect,
  onBulkAction
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { customers } = useCustomers();
  
  // Safely access devices context with error handling
  let getDeviceOverdueStatus: any = null;
  
  try {
    const devicesContext = useDevices();
    getDeviceOverdueStatus = devicesContext?.getDeviceOverdueStatus || null;
  } catch (error) {
    console.warn('Devices context not available:', error);
  }
  
  // State management
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<Record<string, any>>({});
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Fetch customer information for all devices
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      const customerIds = [...new Set(devices.map(d => d.customerId).filter(Boolean))];
      if (customerIds.length === 0) return;
      
      setLoadingCustomers(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .in('id', customerIds);
        
        if (!error && data) {
          const customerMap = data.reduce((acc, customer) => {
            acc[customer.id] = customer;
            return acc;
          }, {} as Record<string, any>);
          setCustomerInfo(customerMap);
        }
      } catch (error) {
        console.error('Error fetching customer info:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomerInfo();
  }, [devices]);

  // Helper functions
  const getDisplayModel = (device: Device) => {
    return `${device.brand} ${device.model}`.trim();
  };

  const formatDuration = (duration: number) => {
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m`;
    return `${Math.floor(duration / 3600)}h`;
  };

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'repair-complete': return 'bg-green-100 text-green-800 border-green-200';
      case 'returned-to-customer-care': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'done': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: DeviceStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in-progress': return <Wrench className="w-4 h-4" />;
      case 'repair-complete': return <CheckSquare className="w-4 h-4" />;
      case 'returned-to-customer-care': return <User className="w-4 h-4" />;
      case 'done': return <CheckSquare className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Smartphone className="w-4 h-4" />;
    }
  };

  const getPriorityLevel = (status: DeviceStatus) => {
    switch (status) {
      case 'failed': return 'high';
      case 'repair-complete': return 'high';
      case 'returned-to-customer-care': return 'medium';
      case 'in-progress': return 'medium';
      case 'pending': return 'low';
      case 'done': return 'low';
      default: return 'low';
    }
  };

  // Sorting function
  const sortDevices = (devices: Device[]) => {
    return [...devices].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'customerName':
          aValue = customerInfo[a.customerId]?.name || a.customerName || '';
          bValue = customerInfo[b.customerId]?.name || b.customerName || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key: keyof Device | 'customerName' | 'createdAt') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectDevice = (deviceId: string) => {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedDevices.size === devices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(devices.map(d => d.id)));
    }
  };

  const handleToggleSelection = () => {
    setShowSelection(!showSelection);
    if (showSelection) {
      // Clear selections when hiding selection mode
      setSelectedDevices(new Set());
    }
  };

  // Customer Care Quick Actions
  const handleCallCustomer = (phoneNumber: string) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    } else {
      toast.error('No phone number available');
    }
  };

  const handleSendSMS = (phoneNumber: string) => {
    if (phoneNumber) {
      window.open(`sms:${phoneNumber}`, '_self');
    } else {
      toast.error('No phone number available');
    }
  };

  const handleCopyDeviceInfo = (device: Device) => {
    const deviceInfo = `${getDisplayModel(device)}\nSerial: ${device.serialNumber}\nCustomer: ${device.customerName}\nStatus: ${device.status}`;
    navigator.clipboard.writeText(deviceInfo);
    toast.success('Device info copied to clipboard');
  };

  const handlePrintDevice = (device: Device) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Device Info - ${getDisplayModel(device)}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Device Information</h2>
            <p><strong>Device:</strong> ${getDisplayModel(device)}</p>
            <p><strong>Serial:</strong> ${device.serialNumber}</p>
            <p><strong>Customer:</strong> ${device.customerName}</p>
            <p><strong>Phone:</strong> ${device.phoneNumber}</p>
            <p><strong>Status:</strong> ${device.status}</p>
            <p><strong>Issue:</strong> ${device.issueDescription}</p>
            <p><strong>Created:</strong> ${new Date(device.createdAt).toLocaleDateString()}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const sortedDevices = sortDevices(devices);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Devices ({devices.length})</h3>
            {showSelection && selectedDevices.size > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {selectedDevices.size} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSelection}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showSelection
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showSelection ? 'Cancel Selection' : 'Select'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Filters"
            >
              <Filter size={16} />
            </button>
            {showSelection && selectedDevices.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onBulkAction?.(devices.filter(d => selectedDevices.has(d.id)), 'call')}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                >
                  Call Selected
                </button>
                <button
                  onClick={() => onBulkAction?.(devices.filter(d => selectedDevices.has(d.id)), 'sms')}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  SMS Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Column Headers */}
        <div className={`grid gap-4 text-sm font-medium text-gray-500 uppercase tracking-wide ${
          showSelection ? 'grid-cols-11' : 'grid-cols-10'
        }`}>
          {showSelection && (
            <div className="col-span-1 flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {selectedDevices.size === devices.length ? (
                  <CheckCircle2 size={16} className="text-blue-600" />
                ) : (
                  <Circle size={16} className="text-gray-400" />
                )}
              </button>
            </div>
          )}
          <button
            onClick={() => handleSort('brand')}
            className="col-span-2 flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            Device
            {sortConfig.key === 'brand' && (
              sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
          </button>
          <button
            onClick={() => handleSort('customerName')}
            className="col-span-2 flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            Customer
            {sortConfig.key === 'customerName' && (
              sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
          </button>
          <button
            onClick={() => handleSort('status')}
            className="col-span-1 flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            Status
            {sortConfig.key === 'status' && (
              sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
          </button>
          <button
            onClick={() => handleSort('createdAt')}
            className="col-span-1 flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            Created
            {sortConfig.key === 'createdAt' && (
              sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
          </button>
          <div className="col-span-3">Issue</div>
          <div className="col-span-2">Actions</div>
        </div>
      </div>

      {/* Device Rows */}
      <div className="divide-y divide-gray-200">
        {sortedDevices.map((device) => {
          const priorityLevel = getPriorityLevel(device.status);
          const customer = customerInfo[device.customerId];
          const overdueStatus = getDeviceOverdueStatus?.(device);
          
          return (
            <div
              key={device.id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                selectedDevices.has(device.id) ? 'bg-blue-50' : ''
              } ${
                priorityLevel === 'high' ? 'border-l-4 border-l-red-400' :
                priorityLevel === 'medium' ? 'border-l-4 border-l-yellow-400' :
                'border-l-4 border-l-green-400'
              }`}
              onClick={() => navigate(`/devices/${device.id}`)}
            >
              <div className={`grid gap-4 items-center ${
                showSelection ? 'grid-cols-11' : 'grid-cols-10'
              }`}>
                {/* Selection */}
                {showSelection && (
                  <div className="col-span-1">
                    <button
                      onClick={() => handleSelectDevice(device.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {selectedDevices.has(device.id) ? (
                        <CheckCircle2 size={16} className="text-blue-600" />
                      ) : (
                        <Circle size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                )}

                {/* Device Info */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${getStatusColor(device.status)} flex items-center justify-center flex-shrink-0`}>
                      {getStatusIcon(device.status)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate" title={getDisplayModel(device)}>
                        {getDisplayModel(device)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {device.serialNumber || 'No Serial'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="col-span-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {customer?.name || device.customerName || 'Unknown'}
                    </p>
                    {device.phoneNumber && (
                      <p className="text-xs text-gray-500 truncate">
                        {device.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <StatusBadge status={device.status} />
                </div>

                {/* Created Date */}
                <div className="col-span-1">
                  <p className="text-sm text-gray-900">
                    {new Date(device.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Issue */}
                <div className="col-span-3">
                  <div className="flex items-center gap-1">
                    {overdueStatus?.isOverdue && (
                      <AlertTriangle size={14} className="text-red-500" />
                    )}
                    {overdueStatus?.status === 'due-today' && (
                      <AlarmClock size={14} className="text-orange-500" />
                    )}
                    <p className="text-sm text-gray-600 truncate" title={device.issueDescription}>
                      {device.issueDescription || 'No issue description'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5">
                    {/* Customer Care Shortcuts */}
                    {currentUser?.role === 'customer-care' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCallCustomer(device.phoneNumber || '');
                          }}
                          className="group relative p-2 bg-green-50 text-green-600 hover:bg-green-100 hover:scale-105 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Call Customer"
                        >
                          <PhoneCall size={16} />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendSMS(device.phoneNumber || '');
                          }}
                          className="group relative p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Send SMS"
                        >
                          <MessageCircle size={16} />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyDeviceInfo(device);
                          }}
                          className="group relative p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:scale-105 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Copy Device Info"
                        >
                          <Copy size={16} />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                      </>
                    )}

                    {/* Admin Actions */}
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/devices/${device.id}/edit`);
                        }}
                        className="group relative p-2 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:scale-105 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        title="Edit Device"
                      >
                        <Edit size={16} />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </button>
                    )}

                    {/* View Details */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/devices/${device.id}`);
                      }}
                      className="group relative p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:scale-105 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      title="View Details"
                    >
                      <Eye size={16} />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {devices.length === 0 && (
        <div className="p-12 text-center">
          <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No devices found</p>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default DeviceColumnView;
