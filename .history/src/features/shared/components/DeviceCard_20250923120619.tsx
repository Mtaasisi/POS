import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Device, DeviceStatus } from '../../../types';
import StatusBadge from './ui/StatusBadge';
import CountdownTimer from './ui/CountdownTimer';
import { 
  Clock, User, Smartphone, Wrench, Calendar, AlarmClock, CheckSquare, 
  MessageSquare, Edit, AlertTriangle, Star, DollarSign, Phone, Mail,
  ChevronRight, MoreVertical, Eye, Zap, Shield, Activity, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../context/CustomersContext';
import { useDevices } from '../../../context/DevicesContext';
import QuickStatusUpdate from '../../devices/components/QuickStatusUpdate';
import { updateDeviceInDb, fixCorruptedDeviceData } from '../../../lib/deviceApi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

interface DeviceCardProps {
  device: Device;
  showDetails?: boolean;
  now?: Date;
}

// Utility functions
export function sortDevicesForAction(devices: Device[]) {
  return devices.slice().sort((a, b) => {
    const isADone = a.status === 'done' || a.status === 'failed';
    const isBDone = b.status === 'done' || b.status === 'failed';
    if (isADone === isBDone) return 0;
    return isADone ? 1 : -1;
  });
}

export function removeDuplicateDevices<T extends { id: string }>(devices: T[]): T[] {
  const seen = new Set<string>();
  return devices.filter(device => {
    if (seen.has(device.id)) {
      return false;
    }
    seen.add(device.id);
    return true;
  });
}

const DeviceCard: React.FC<DeviceCardProps> = React.memo(({ device, showDetails = true, now = new Date() }) => {
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
  const [showQuickStatusUpdate, setShowQuickStatusUpdate] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Partial<Device>>({});
  const [saving, setSaving] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch detailed customer information
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      if (!device.customerId) return;
      
      setLoadingCustomer(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', device.customerId)
          .single();
        
        if (!error && data) {
          setCustomerInfo(data);
        }
      } catch (error) {
        console.error('Error fetching customer info:', error);
      } finally {
        setLoadingCustomer(false);
      }
    };

    fetchCustomerInfo();
  }, [device.customerId]);

  // Helper functions
  const getDisplayModel = () => {
    return `${device.brand} ${device.model}`.trim();
  };

  const formatDuration = (duration: number) => {
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m`;
    return `${Math.floor(duration / 3600)}h`;
  };

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'pending': return 'from-yellow-400 to-orange-500';
      case 'in-progress': return 'from-blue-400 to-blue-600';
      case 'repair-complete': return 'from-green-400 to-green-600';
      case 'returned-to-customer-care': return 'from-teal-400 to-teal-600';
      case 'done': return 'from-gray-400 to-gray-600';
      case 'failed': return 'from-red-400 to-red-600';
      default: return 'from-gray-400 to-gray-600';
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

  const priorityLevel = getPriorityLevel(device.status);

  // Calculate durations
  const technicianDuration = device.transitions?.reduce((total, transition) => {
    if (transition.fromStatus === 'assigned' && transition.toStatus === 'repair-complete') {
      const start = new Date(transition.timestamp).getTime();
      const end = new Date(device.updatedAt || Date.now()).getTime();
      return total + (end - start) / 1000;
    }
    return total;
  }, 0) || 0;

  const handoverDuration = device.transitions?.reduce((total, transition) => {
    if (transition.fromStatus === 'repair-complete' && transition.toStatus === 'returned-to-customer-care') {
      const start = new Date(transition.timestamp).getTime();
      const end = new Date(device.updatedAt || Date.now()).getTime();
      return total + (end - start) / 1000;
    }
    return total;
  }, 0) || 0;

  const handleCardClick = () => {
    navigate(`/devices/${device.id}`);
  };

  const handleEditClick = async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  
                  // Validate device data before opening edit modal
                  const validStatusValues = [
                    'assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair',
                    'reassembled-testing', 'repair-complete', 'returned-to-customer-care', 'done', 'failed'
                  ];
                  
                  if (device.status && !validStatusValues.includes(device.status)) {
                    console.error('Device has invalid status:', device.status);
                    toast.error(`Device has invalid status: ${device.status}. Please contact support.`);
                    return;
                  }
                  
                  if (device.status && device.status.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                    console.error('Device status field contains UUID instead of valid status:', device.status);
                    toast.error('Device data is corrupted. Attempting to fix...');
                    
                    const fixed = await fixCorruptedDeviceData(device.id);
                    if (fixed) {
                      toast.success('Device data fixed! Please refresh the page.');
                      window.location.reload();
                    } else {
                      toast.error('Could not fix device data. Please contact support.');
                    }
                    return;
                  }
                  
                  setEditingDevice(device);
                  setShowEditModal(true);
  };

  return (
    <>
      <div 
        className={`
          relative bg-white rounded-2xl border border-gray-200 shadow-sm
          transition-all duration-300 ease-out
          hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1
          ${isHovered ? 'ring-2 ring-blue-100' : ''}
          ${priorityLevel === 'high' ? 'border-l-4 border-l-red-400' : ''}
          ${priorityLevel === 'medium' ? 'border-l-4 border-l-yellow-400' : ''}
          ${priorityLevel === 'low' ? 'border-l-4 border-l-green-400' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Header Section */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between mb-3">
            {/* Device Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getStatusColor(device.status)} flex items-center justify-center text-white shadow-sm`}>
                  {getStatusIcon(device.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate" title={getDisplayModel()}>
                    {getDisplayModel()}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {device.serialNumber || 'No Serial'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Badge & Actions */}
            <div className="flex items-center gap-2">
              {device.remarks && device.remarks.length > 0 && (
                <div className="relative">
                  <div className="w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {device.remarks.length}
                  </div>
                </div>
              )}
              
              {currentUser?.role === 'admin' && (
                <button
                  onClick={handleEditClick}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="Edit Device"
              >
                  <Edit size={14} />
              </button>
            )}
              
            <StatusBadge status={device.status} />
          </div>
        </div>

          {/* Issue Description */}
        {device.issueDescription && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800 font-medium line-clamp-2" title={device.issueDescription}>
            {device.issueDescription}
              </p>
          </div>
        )}

          {/* Customer Information */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={12} className="text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {customerInfo?.name || device.customerName || 'Unknown Customer'}
              </p>
              {device.phoneNumber && (
                <p className="text-xs text-gray-500 truncate">
                  {device.phoneNumber}
                </p>
              )}
            </div>
          </div>
              </div>
              
        {/* Status Indicators */}
        {showDetails && (
          <div className="px-4 pb-3">
            {/* Overdue Status */}
              {(() => {
                if (device.status === 'done' || device.status === 'failed') {
                  return null;
                }
                
              const overdueStatus = getDeviceOverdueStatus?.(device);
              if (!overdueStatus) return null;

                if (overdueStatus.status === 'completed') {
                  return (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg mb-2">
                    <CheckSquare className="text-green-600" size={14} />
                    <span className="text-xs font-medium text-green-700">Completed</span>
                    </div>
                  );
                } else if (overdueStatus.isOverdue) {
                  return (
                  <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg mb-2">
                    <AlertTriangle className="text-red-600" size={14} />
                    <span className="text-xs font-medium text-red-700">{overdueStatus.overdueTime}</span>
                    </div>
                  );
                } else if (overdueStatus.status === 'due-today') {
                  return (
                  <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg mb-2">
                    <AlarmClock className="text-orange-600" size={14} />
                    <span className="text-xs font-medium text-orange-700">Due Today</span>
                    </div>
                  );
                } else if (overdueStatus.overdueTime) {
                  return (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                    <Clock className="text-blue-600" size={14} />
                    <span className="text-xs font-medium text-blue-700">{overdueStatus.overdueTime}</span>
                    </div>
                  );
                }
                return null;
              })()}

            {/* Admin Duration Info */}
            {currentUser?.role === 'admin' && (
              <div className="flex gap-3 text-xs text-gray-500 mb-2">
                <div className="flex items-center gap-1">
                  <Wrench size={12} />
                  <span>Tech: {formatDuration(technicianDuration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>CC: {formatDuration(handoverDuration)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Technician Quick Actions */}
        {currentUser?.role === 'technician' && showDetails && (
          <div className="px-4 pb-4">
            <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRepairChecklist(true);
              }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all duration-200 text-xs font-medium"
            >
                <CheckSquare size={12} />
              Checklist
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickStatusUpdate(true);
              }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-all duration-200 text-xs font-medium"
            >
                <MessageSquare size={12} />
              Update
            </button>
            </div>
          </div>
        )}

        {/* Hover Indicator */}
        {isHovered && (
          <div className="absolute top-4 right-4">
            <ChevronRight size={16} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Modals */}
      <RepairChecklist
        isOpen={showRepairChecklist}
        onClose={() => setShowRepairChecklist(false)}
        deviceId={device.id}
      />

      <QuickStatusUpdate
        isOpen={showQuickStatusUpdate}
        onClose={() => setShowQuickStatusUpdate(false)}
        deviceId={device.id}
      />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Device</h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                try {
                  await updateDeviceInDb(device.id, editingDevice);
                  toast.success('Device updated successfully');
                  setShowEditModal(false);
                } catch (error) {
                  toast.error('Failed to update device');
                } finally {
                  setSaving(false);
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editingDevice.status || device.status}
                      onChange={(e) => setEditingDevice({...editingDevice, status: e.target.value as DeviceStatus})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="repair-complete">Repair Complete</option>
                      <option value="returned-to-customer-care">Returned to CC</option>
                      <option value="done">Done</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                    <textarea
                      value={editingDevice.issueDescription || device.issueDescription || ''}
                      onChange={(e) => setEditingDevice({...editingDevice, issueDescription: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

DeviceCard.displayName = 'DeviceCard';

export default DeviceCard;