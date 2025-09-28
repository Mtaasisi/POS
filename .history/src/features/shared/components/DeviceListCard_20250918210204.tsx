import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Device, DeviceStatus } from '../../../types';
import StatusBadge from './ui/StatusBadge';
import { 
  Clock, User, Smartphone, Wrench, Calendar, AlarmClock, CheckSquare, 
  MessageSquare, Edit, AlertTriangle, Star, DollarSign, Phone, Mail,
  ChevronRight, MoreVertical, Eye, Zap, Shield, Activity, TrendingUp,
  PhoneCall, MessageCircle, FileText, Calendar as CalendarIcon, Timer,
  ArrowRight, ExternalLink, Copy, Share2, Download, Print
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../context/CustomersContext';
import { useDevices } from '../../../context/DevicesContext';
import { updateDeviceInDb, fixCorruptedDeviceData } from '../../../lib/deviceApi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

interface DeviceListCardProps {
  device: Device;
  showDetails?: boolean;
  now?: Date;
}

const DeviceListCard: React.FC<DeviceListCardProps> = React.memo(({ device, showDetails = true, now = new Date() }) => {
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Partial<Device>>({});
  const [saving, setSaving] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

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

  // Customer Care Quick Actions
  const handleCallCustomer = () => {
    if (device.phoneNumber) {
      window.open(`tel:${device.phoneNumber}`, '_self');
    } else {
      toast.error('No phone number available');
    }
  };

  const handleSendSMS = () => {
    if (device.phoneNumber) {
      window.open(`sms:${device.phoneNumber}`, '_self');
    } else {
      toast.error('No phone number available');
    }
  };

  const handleCopyDeviceInfo = () => {
    const deviceInfo = `${getDisplayModel()}\nSerial: ${device.serialNumber}\nCustomer: ${device.customerName}\nStatus: ${device.status}`;
    navigator.clipboard.writeText(deviceInfo);
    toast.success('Device info copied to clipboard');
  };

  const handlePrintDevice = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Device Info - ${getDisplayModel()}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Device Information</h2>
            <p><strong>Device:</strong> ${getDisplayModel()}</p>
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

  const handleShareDevice = () => {
    if (navigator.share) {
      navigator.share({
        title: `Device: ${getDisplayModel()}`,
        text: `Device ${getDisplayModel()} - ${device.customerName} - Status: ${device.status}`,
        url: window.location.href
      });
    } else {
      handleCopyDeviceInfo();
    }
  };

  return (
    <>
      <div 
        className={`
          relative bg-white rounded-lg border border-gray-200 shadow-sm
          transition-all duration-200 ease-out
          hover:shadow-md hover:shadow-gray-200/50
          ${isHovered ? 'ring-1 ring-blue-200' : ''}
          ${priorityLevel === 'high' ? 'border-l-4 border-l-red-400' : ''}
          ${priorityLevel === 'medium' ? 'border-l-4 border-l-yellow-400' : ''}
          ${priorityLevel === 'low' ? 'border-l-4 border-l-green-400' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Device Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Status Icon */}
              <div className={`w-10 h-10 rounded-lg ${getStatusColor(device.status)} flex items-center justify-center flex-shrink-0`}>
                {getStatusIcon(device.status)}
              </div>

              {/* Device Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate" title={getDisplayModel()}>
                    {getDisplayModel()}
                  </h3>
                  <StatusBadge status={device.status} />
                  {device.remarks && device.remarks.length > 0 && (
                    <div className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {device.remarks.length}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Serial: {device.serialNumber || 'N/A'}</span>
                  <span>•</span>
                  <span>Created: {new Date(device.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Middle Section - Customer Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-gray-900 text-sm truncate">
                    {customerInfo?.name || device.customerName || 'Unknown Customer'}
                  </span>
                </div>
                {device.phoneNumber && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{device.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - Issue & Actions */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                {device.issueDescription && (
                  <p className="text-xs text-gray-600 truncate mb-1" title={device.issueDescription}>
                    {device.issueDescription}
                  </p>
                )}
                
                {/* Overdue Status */}
                {(() => {
                  if (device.status === 'done' || device.status === 'failed') {
                    return null;
                  }
                  
                  const overdueStatus = getDeviceOverdueStatus?.(device);
                  if (!overdueStatus) return null;

                  if (overdueStatus.isOverdue) {
                    return (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle size={12} />
                        <span>{overdueStatus.overdueTime}</span>
                      </div>
                    );
                  } else if (overdueStatus.status === 'due-today') {
                    return (
                      <div className="flex items-center gap-1 text-xs text-orange-600">
                        <AlarmClock size={12} />
                        <span>Due Today</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Customer Care Shortcuts */}
                {currentUser?.role === 'customer-care' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCallCustomer();
                      }}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-all duration-200"
                      title="Call Customer"
                    >
                      <PhoneCall size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendSMS();
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-200"
                      title="Send SMS"
                    >
                      <MessageCircle size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyDeviceInfo();
                      }}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-all duration-200"
                      title="Copy Device Info"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                )}

                {/* Admin Actions */}
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={handleEditClick}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-200"
                    title="Edit Device"
                  >
                    <Edit size={14} />
                  </button>
                )}

                {/* More Actions */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQuickActions(!showQuickActions);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-all duration-200"
                    title="More Actions"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {/* Quick Actions Dropdown */}
                  {showQuickActions && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintDevice();
                            setShowQuickActions(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Print size={14} />
                          Print Device Info
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareDevice();
                            setShowQuickActions(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Share2 size={14} />
                          Share Device
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/devices/${device.id}`);
                            setShowQuickActions(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <ExternalLink size={14} />
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Arrow Indicator */}
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

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

DeviceListCard.displayName = 'DeviceListCard';

export default DeviceListCard;
