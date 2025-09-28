import React, { useState, useEffect } from 'react';
import { Device, DeviceStatus } from '../../../types';
import GlassCard from '../../shared/components/ui/GlassCard';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import CountdownTimer from '../../shared/components/ui/CountdownTimer';
import { Clock, User, Smartphone, Wrench, Calendar, AlarmClock, CheckSquare, MessageSquare, Edit, AlertTriangle, Star, DollarSign } from 'lucide-react';
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
  const { getDeviceOverdueStatus } = useDevices();
  
  // Add state for technician quick actions
  const [showRepairChecklist, setShowRepairChecklist] = useState(false);
  const [showQuickStatusUpdate, setShowQuickStatusUpdate] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Partial<Device>>({});
  const [saving, setSaving] = useState(false);

  // Add state for customer information
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

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
    navigate(`/devices/${device.id}`);
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
      <GlassCard 
        onClick={handleCardClick}
        className={`transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg relative ${
          device.status === 'done' ? 'border-green-200 bg-green-50/30' :
          device.status === 'failed' ? 'border-red-200 bg-red-50/30' :
          getDeviceOverdueStatus(device).isOverdue ? 'border-orange-200 bg-orange-50/30' :
          getDeviceOverdueStatus(device).status === 'due-today' ? 'border-yellow-200 bg-yellow-50/30' :
          'border-blue-200 bg-blue-50/30'
        } ${showDetails ? '' : 'p-4'} ${selected ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}
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
          <div className="absolute top-1 left-1 z-10">
            <span className="bg-red-500 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center border border-white shadow">
              {device.remarks.length}
            </span>
          </div>
        )}
        
        {/* Move intake date to a new prominent line below the device title */}
        <div className="flex justify-between items-start mb-1 pt-2">
          <div className="flex items-center gap-2 w-full">
            <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate overflow-hidden text-ellipsis" title={getDisplayModel()}>{getDisplayModel()}</h3>
          </div>
          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingDevice(device);
                  setShowEditModal(true);
                }}
                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                title="Edit Device"
              >
                <Edit size={16} />
              </button>
            )}
            <StatusBadge status={device.status} />
          </div>
        </div>
        {/* Minimal device issue display */}
        {device.issueDescription && (
          <div
            className="pl-2 sm:pl-3 py-1 mb-2 border-l-4 border-red-500 bg-red-50 text-red-800 text-xs sm:text-sm line-clamp-2 uppercase"
            title={device.issueDescription}
          >
            {device.issueDescription}
          </div>
        )}
        {/* Serial Number and Intake Date */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-2 text-xs text-gray-500">
          <div>
            <span className="font-medium">Serial:</span> {device.serialNumber || 'N/A'}
          </div>
          {/* Overdue Indicator removed */}
        </div>
        {showDetails ? (
          <>
            <div className="space-y-2 mb-3">
              {/* Simplified Customer Information */}
              <div className="flex items-center gap-2 text-gray-700">
                <User size={14} />
                <span className="text-sm font-medium truncate capitalize">
                  {customerInfo?.name || device.customerName || 'Unknown Customer'}
                </span>
                {customerInfo?.color_tag && (
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${
                    customerInfo.color_tag === 'vip' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    customerInfo.color_tag === 'complainer' ? 'bg-red-100 text-red-700 border-red-200' :
                    customerInfo.color_tag === 'purchased' ? 'bg-green-100 text-green-700 border-green-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {customerInfo.color_tag}
                  </span>
                )}
              </div>
              
              {/* Simplified Status Display */}
              {(() => {
                if (device.status === 'done' || device.status === 'failed') {
                  return null;
                }
                
                const overdueStatus = getDeviceOverdueStatus(device);
                if (overdueStatus.isOverdue) {
                  return (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-50 border border-red-200">
                      <AlertTriangle className="text-red-600" size={12} />
                      <span className="text-xs font-medium text-red-700">Overdue</span>
                    </div>
                  );
                } else if (overdueStatus.status === 'due-today') {
                  return (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-50 border border-orange-200">
                      <AlarmClock className="text-orange-600" size={12} />
                      <span className="text-xs font-medium text-orange-700">Due Today</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            {currentUser?.role === 'admin' && (
              <div className="mt-1 sm:mt-2 text-xs text-gray-600">
                <div>Tech job: <span className="font-semibold">{formatDuration(technicianDuration)}</span></div>
                <div>CC handover: <span className="font-semibold">{formatDuration(handoverDuration)}</span></div>
              </div>
            )}

          </>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-700">
              <Smartphone size={16} />
              <span className="truncate">{device.model}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 text-xs">
              <User size={12} />
              <span className="truncate capitalize">
                {customerInfo?.name || device.customerName || 'Unknown Customer'}
              </span>
            </div>
          </div>
        )}

        {/* Technician Quick Actions */}
        {currentUser?.role === 'technician' && showDetails && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRepairChecklist(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 rounded-lg border border-blue-200/50 transition-all duration-200 text-sm font-medium"
            >
              <CheckSquare size={16} />
              Checklist
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickStatusUpdate(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 rounded-lg border border-purple-200/50 transition-all duration-200 text-sm font-medium"
            >
              <MessageSquare size={16} />
              Update
            </button>
            {device.status === 'repair-complete' && customerInfo && (
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
                className="flex-1"
                variant="secondary"
                size="sm"
              />
            )}
          </div>
        )}
      </GlassCard>

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
    </>
  );
});

export default DeviceCard;