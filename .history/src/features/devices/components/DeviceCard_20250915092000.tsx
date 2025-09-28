import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Device, DeviceStatus } from '../../../types';
import GlassCard from '../../shared/components/ui/GlassCard';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import CountdownTimer from '../../shared/components/ui/CountdownTimer';
import { Clock, User, Smartphone, Wrench, Calendar, AlarmClock, CheckSquare, MessageSquare, Edit, AlertTriangle, Star, DollarSign, Shield } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../context/CustomersContext';
import { useDevices } from '../../../context/DevicesContext';
import RepairChecklist from './RepairChecklist';
import QuickStatusUpdate from './QuickStatusUpdate';
import RepairPaymentButton from './RepairPaymentButton';
import DeviceRepairDetailModal from './DeviceRepairDetailModal';
import { updateDeviceInDb } from '../../../lib/deviceApi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

interface DeviceCardProps {
  device: Device;
  showDetails?: boolean;
  now?: Date; // Pass the shared timer from parent
  selected?: boolean;
  onSelect?: (deviceId: string, selected: boolean) => void;
  showSelection?: boolean;
}

// Utility: Sort devices so 'done' and 'failed' are at the bottom, action-needed devices at the top
export function sortDevicesForAction(devices: Device[]) {
  return devices.slice().sort((a, b) => {
    const isADone = a.status === 'done' || a.status === 'failed';
    const isBDone = b.status === 'done' || b.status === 'failed';
    if (isADone === isBDone) return 0;
    return isADone ? 1 : -1;
  });
}

// Utility: Remove duplicate devices based on device ID
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

// Usage: Sort your device list with sortDevicesForAction before rendering DeviceCard.
// Usage: Remove duplicates with removeDuplicateDevices before rendering DeviceCard.

const DeviceCard: React.FC<DeviceCardProps> = React.memo(({ 
  device, 
  showDetails = true, 
  now = new Date(),
  selected = false,
  onSelect,
  showSelection = false
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
  
  // Add state for technician quick actions
  const [showRepairChecklist, setShowRepairChecklist] = useState(false);
  const [showQuickStatusUpdate, setShowQuickStatusUpdate] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Partial<Device>>({});
  const [saving, setSaving] = useState(false);

  // Add state for comprehensive device information
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [devicePayments, setDevicePayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [technicianInfo, setTechnicianInfo] = useState<any>(null);
  const [loadingTechnician, setLoadingTechnician] = useState(false);
  // Device checklists removed - table not available
  const [deviceRatings, setDeviceRatings] = useState<any[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Fetch comprehensive device information
  useEffect(() => {
    const fetchAllDeviceInfo = async () => {
      if (!device.id) return;
      
      // Fetch customer information
      if (device.customerId) {
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
      }

      // Fetch device payments
      setLoadingPayments(true);
      try {
        const { data, error } = await supabase
          .from('customer_payments')
          .select(`
            *,
            customers(name),
            devices(brand, model)
          `)
          .eq('device_id', device.id)
          .order('payment_date', { ascending: false });
        
        if (!error && data) {
          setDevicePayments(data);
        }
      } catch (error) {
        console.error('Error fetching device payments:', error);
      } finally {
        setLoadingPayments(false);
      }

      // Fetch technician information
      if (device.assignedTo) {
        setLoadingTechnician(true);
        try {
          const { data, error } = await supabase
            .from('auth_users')
            .select('*')
            .eq('id', device.assignedTo)
            .single();
          
          if (!error && data) {
            setTechnicianInfo(data);
          }
        } catch (error) {
          console.error('Error fetching technician info:', error);
        } finally {
          setLoadingTechnician(false);
        }
      }

      // Device checklists removed - table not available

      // Fetch device ratings
      setLoadingRatings(true);
      try {
        const { data, error } = await supabase
          .from('device_ratings')
          .select(`
            *,
            auth_users(name)
          `)
          .eq('device_id', device.id)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setDeviceRatings(data);
        }
      } catch (error) {
        console.error('Error fetching device ratings:', error);
      } finally {
        setLoadingRatings(false);
      }
    };

    fetchAllDeviceInfo();
  }, [device.id, device.customerId, device.assignedTo]);

  // Track if the card has been opened (clicked)
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    // Check localStorage for opened state
    if (localStorage.getItem(`devicecard_opened_${device.id}`) === '1') {
      setOpened(true);
    }
  }, [device.id]);
  
  // Animated dot state for fade in/out
  const [dotVisible, setDotVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setDotVisible(v => !v), 500);
    return () => clearInterval(interval);
  }, []);

  // Format date to readable format
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const options: Intl.DateTimeFormatOptions = {
      year: '2-digit', // two-digit year
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(undefined, options);
  };

  // Minimal countdown string: only two most significant units, with color
  const getMinimalCountdown = (dateString: string) => {
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();
    let color = '#22c55e'; // green-500
    if (diff <= 0) color = '#ef4444'; // red-500
    else if (diff < 24 * 60 * 60 * 1000) color = '#f59e42'; // orange-400
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    
    // Hide the "Overdue" text in countdown - let the status display handle it
    let units = [];
    if (days > 0) units.push(`${days}d`);
    if (hours > 0 || days > 0) units.push(`${hours}h`);
    if (minutes > 0 && days === 0) units.push(`${minutes}m`);
    if (days === 0 && hours === 0) units.push(`${seconds}s`);
    units = units.slice(0, 2);
    const dot = <span style={{opacity: dotVisible ? 1 : 0.2, transition: 'opacity 0.3s', fontWeight: 'bold', color}}>.</span>;
    return (
      <span style={{fontFamily: 'monospace', fontSize: '0.95em', letterSpacing: '0.5px', color, fontWeight: 600}}>
        {units.map((u, i) => (
          <React.Fragment key={i}>
            {u}
            {i < units.length - 1 && dot}
          </React.Fragment>
        ))}
      </span>
    );
  };

  const handleCardClick = () => {
    // Mark as opened in localStorage
    localStorage.setItem(`devicecard_opened_${device.id}`, '1');
    setOpened(true);
    setShowDetailModal(true);
  };

  const handleStatusUpdate = (newStatus: DeviceStatus) => {
    // This will be handled by the RepairChecklist or QuickStatusUpdate components
    console.log('Status update:', newStatus);
  };

  const handleSaveDevice = async () => {
    if (!editingDevice.id) return;
    
    setSaving(true);
    try {
      await updateDeviceInDb(editingDevice.id, editingDevice);
      toast.success('Device updated successfully');
      setShowEditModal(false);
      // Refresh the device data
      window.location.reload();
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
    } finally {
      setSaving(false);
    }
  };

  // Helper to format duration
  function formatDuration(ms?: number) {
    if (!ms || ms < 0 || isNaN(ms)) return '-';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // Helper to get transition time
  function getTransitionTime(transitions: {toStatus: string, timestamp: string}[] = [], toStatus: string): number | undefined {
    const t = transitions.find((tr) => tr.toStatus === toStatus);
    return t ? new Date(t.timestamp).getTime() : undefined;
  }

  // Helper to get display model name (hide model number for iPhone)
  const getDisplayModel = () => {
    if ((device.brand && device.brand.toLowerCase() === 'apple') || (device.model && device.model.toLowerCase().includes('iphone'))) {
      // Remove model numbers in parentheses, e.g., 'iPhone 7 (A1660, A1778)' => 'iPhone 7'
      let model = device.model.replace(/\s*\([^)]*A\d{4}[^)]*\)/gi, '');
      // Also remove trailing model number if present
      const parts = model.split(' ');
      if (parts.length > 2 && /^A\d{4,}$/.test(parts[parts.length - 1])) {
        model = parts.slice(0, -1).join(' ');
      }
      return model.trim();
    }
    return device.model;
  };

  // Minimal live repair timer: only the most significant unit, small font, no extra styling
  const getMinimalLiveRepairTimer = (ms: number) => {
    if (!ms || ms < 0 || isNaN(ms)) return '-';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor((totalSeconds % 60));
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const inRepairTime = getTransitionTime(device.transitions || [], 'in-repair');
  const repairCompleteTime = getTransitionTime(device.transitions || [], 'repair-complete');
  const doneTime = getTransitionTime(device.transitions || [], 'done');

  const technicianDuration = (inRepairTime && repairCompleteTime) ? repairCompleteTime - inRepairTime : undefined;
  const handoverDuration = (repairCompleteTime && doneTime) ? doneTime - repairCompleteTime : undefined;

  return (
    <>
      <div 
        onClick={handleCardClick}
        className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] cursor-pointer relative overflow-hidden ${
          device.status === 'done' ? 'border-green-200 bg-green-50/30' :
          device.status === 'failed' ? 'border-red-200 bg-red-50/30' :
          getDeviceOverdueStatus(device).isOverdue ? 'border-orange-200 bg-orange-50/30' :
          getDeviceOverdueStatus(device).status === 'due-today' ? 'border-yellow-200 bg-yellow-50/30' :
          'border-gray-200 bg-white'
        } ${showDetails ? 'p-5' : 'p-4'} ${selected ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}
      >
        {/* Selection checkbox */}
        {showSelection && (
          <div className="absolute top-1 left-1 z-30">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect?.(device.id, e.target.checked);
              }}
              className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
          </div>
        )}

        {/* Comment count in top-left corner */}
        {device.remarks && device.remarks.length > 0 && !opened && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-sm">
              {device.remarks.length}
            </span>
          </div>
        )}
        
        {/* Device Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 truncate" title={getDisplayModel()}>{getDisplayModel()}</h3>
              <p className="text-sm text-gray-500">Serial: {device.serialNumber || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingDevice(device);
                  setShowEditModal(true);
                }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title="Edit Device"
              >
                <Edit size={16} />
              </button>
            )}
            <StatusBadge status={device.status} />
          </div>
        </div>
        {/* Issue Description */}
        {device.issueDescription && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Issue</span>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200" title={device.issueDescription}>
              {device.issueDescription}
            </p>
          </div>
        )}
        {showDetails ? (
          <>
            {/* Customer Information */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</span>
                {loadingCustomer && <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>}
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 capitalize truncate">
                      {customerInfo?.name || device.customerName || 'Unknown Customer'}
                    </p>
                    {customerInfo?.phone && (
                      <p className="text-xs text-gray-600 mt-1">{customerInfo.phone}</p>
                    )}
                    {customerInfo?.email && (
                      <p className="text-xs text-gray-600">{customerInfo.email}</p>
                    )}
                    {customerInfo?.color_tag && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        customerInfo.color_tag === 'vip' ? 'bg-purple-100 text-purple-700' :
                        customerInfo.color_tag === 'complainer' ? 'bg-red-100 text-red-700' :
                        customerInfo.color_tag === 'purchased' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {customerInfo.color_tag}
                      </span>
                    )}
                    {customerInfo?.loyalty_level && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 bg-yellow-100 text-yellow-700">
                        {customerInfo.loyalty_level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Information */}
            {device.assignedTo && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                    <Wrench className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned Technician</span>
                  {loadingTechnician && <div className="w-3 h-3 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>}
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <Wrench className="w-4 h-4 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {technicianInfo?.name || 'Unknown Technician'}
                      </p>
                      {technicianInfo?.email && (
                        <p className="text-xs text-gray-600 mt-1">{technicianInfo.email}</p>
                      )}
                      {technicianInfo?.role && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 bg-purple-100 text-purple-700">
                          {technicianInfo.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Information */}
            {devicePayments.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <DollarSign className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment History</span>
                  {loadingPayments && <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>}
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="space-y-2">
                    {devicePayments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            payment.status === 'completed' ? 'bg-green-500' : 
                            payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900">
                            ${payment.amount}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-600 capitalize">{payment.method}</span>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {devicePayments.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{devicePayments.length - 3} more payments
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Warranty Information */}
            {(device.warrantyStart || device.warrantyEnd || device.warrantyStatus) && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Warranty</span>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="space-y-2">
                    {device.warrantyStatus && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`text-sm font-medium capitalize ${
                          device.warrantyStatus === 'active' ? 'text-green-700' :
                          device.warrantyStatus === 'expired' ? 'text-red-700' :
                          'text-gray-700'
                        }`}>
                          {device.warrantyStatus}
                        </span>
                      </div>
                    )}
                    {device.warrantyStart && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Start:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(device.warrantyStart).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {device.warrantyEnd && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">End:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(device.warrantyEnd).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {device.repairCount && device.repairCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Repair Count:</span>
                        <span className="text-sm font-medium text-gray-900">{device.repairCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Device Ratings */}
            {deviceRatings.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ratings</span>
                  {loadingRatings && <div className="w-3 h-3 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>}
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="space-y-2">
                    {deviceRatings.slice(0, 2).map((rating) => (
                      <div key={rating.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < rating.score ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{rating.score}/5</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-600">
                            {rating.auth_users?.name || 'Anonymous'}
                          </span>
                          <p className="text-xs text-gray-500">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {deviceRatings.length > 2 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{deviceRatings.length - 2} more ratings
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Device Checklists */}
            {deviceChecklists && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                    <CheckSquare className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Checklists</span>
                  {loadingChecklists && <div className="w-3 h-3 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>}
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                  <div className="space-y-2">
                    {deviceChecklists.diagnostic_checklist && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Diagnostic:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {typeof deviceChecklists.diagnostic_checklist === 'object' 
                            ? 'Completed' 
                            : deviceChecklists.diagnostic_checklist}
                        </span>
                      </div>
                    )}
                    {deviceChecklists.repair_checklist && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Repair:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {typeof deviceChecklists.repair_checklist === 'object' 
                            ? 'Completed' 
                            : deviceChecklists.repair_checklist}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Status Alerts */}
            {(() => {
              if (device.status === 'done' || device.status === 'failed') {
                return null;
              }
              
              const overdueStatus = getDeviceOverdueStatus(device);
              if (overdueStatus.isOverdue) {
                return (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status Alert</span>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Device is overdue for return</span>
                      </div>
                    </div>
                  </div>
                );
              } else if (overdueStatus.status === 'due-today') {
                return (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                        <AlarmClock className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status Alert</span>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center gap-2">
                        <AlarmClock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Device is due today</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            {/* Admin Duration Info */}
            {currentUser?.role === 'admin' && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Timing</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Tech job:</span>
                      <span className="font-semibold text-blue-700 ml-1">{formatDuration(technicianDuration)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">CC handover:</span>
                      <span className="font-semibold text-blue-700 ml-1">{formatDuration(handoverDuration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 truncate">{device.model}</span>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 truncate capitalize">
                {customerInfo?.name || device.customerName || 'Unknown Customer'}
              </span>
            </div>
          </div>
        )}

        {/* Technician Quick Actions */}
        {currentUser?.role === 'technician' && showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                <Wrench className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRepairChecklist(true);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <CheckSquare size={16} />
                Checklist
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickStatusUpdate(true);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <MessageSquare size={16} />
                Update
              </button>
            </div>
            {device.status === 'repair-complete' && customerInfo && (
              <div className="mt-2">
                <RepairPaymentButton
                  customerId={device.customerId || ''}
                  customerName={customerInfo.name || 'Unknown Customer'}
                  deviceId={device.id}
                  deviceName={`${device.brand} ${device.model}`}
                  repairAmount={Number(device.repairCost) || 0}
                  onPaymentComplete={(paymentData) => {
                    toast.success('Repair payment processed successfully!');
                    // Optionally refresh device data or update status
                  }}
                  className="w-full"
                  variant="secondary"
                  size="sm"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Repair Checklist Modal */}
      <RepairChecklist
        device={device}
        isOpen={showRepairChecklist}
        onClose={() => setShowRepairChecklist(false)}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Quick Status Update Modal */}
      <QuickStatusUpdate
        device={device}
        isOpen={showQuickStatusUpdate}
        onClose={() => setShowQuickStatusUpdate(false)}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Edit Device Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Device</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSaveDevice();
              }}>
                <div className="space-y-4">

                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={editingDevice.model || ''}
                      onChange={(e) => setEditingDevice({...editingDevice, model: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                    <input
                      type="text"
                      value={editingDevice.serialNumber || ''}
                      onChange={(e) => setEditingDevice({...editingDevice, serialNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                    <textarea
                      value={editingDevice.issueDescription || ''}
                      onChange={(e) => setEditingDevice({...editingDevice, issueDescription: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Date</label>
                    <input
                      type="date"
                      value={editingDevice.expectedReturnDate ? editingDevice.expectedReturnDate.split('T')[0] : ''}
                      onChange={(e) => setEditingDevice({...editingDevice, expectedReturnDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editingDevice.status || ''}
                      onChange={(e) => setEditingDevice({...editingDevice, status: e.target.value as DeviceStatus})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="assigned">Assigned</option>
                      <option value="diagnosis-started">Diagnosis Started</option>
                      <option value="awaiting-parts">Awaiting Parts</option>
                      <option value="in-repair">In Repair</option>
                      <option value="reassembled-testing">Reassembled/Testing</option>
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
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Device Repair Detail Modal */}
      <DeviceRepairDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        deviceId={device.id}
      />
    </>
  );
});

export default DeviceCard;