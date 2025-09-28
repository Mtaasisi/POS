import React, { useState, useEffect } from 'react';
import { Device, DeviceStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../lib/customerApi';
import { repairPaymentService, RepairPayment } from '../../../lib/repairPaymentService';
import { supabase } from '../../../lib/supabaseClient';

// Icons
import { 
  X, Smartphone, User as UserIcon, Clock, CheckCircle, AlertTriangle, 
  Wrench, Stethoscope, CreditCard, Send, Printer, Upload,
  History, Timer, Target, CheckSquare, MessageSquare, 
  Edit, Trash2, Eye, Download, Phone, Mail, MapPin,
  Calendar, DollarSign, Package, FileText, Settings,
  Info, Building, Activity, BarChart3, MessageCircle, Zap,
  Shield, Search, AlertCircle
} from 'lucide-react';

// Components
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import RepairChecklist from './RepairChecklist';
import RepairPaymentButton from './RepairPaymentButton';
import RepairStatusUpdater from './RepairStatusUpdater';
import RepairStatusGrid from './RepairStatusGrid';

interface DeviceRepairDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

const DeviceRepairDetailModal: React.FC<DeviceRepairDetailModalProps> = ({
  isOpen,
  onClose,
  deviceId
}) => {
  const { currentUser } = useAuth();
  // Safely access devices context with error handling
  let getDeviceById: any = null;
  let updateDeviceStatus: any = null;
  
  try {
    const devicesContext = useDevices();
    getDeviceById = devicesContext?.getDeviceById || null;
    updateDeviceStatus = devicesContext?.updateDeviceStatus || null;
  } catch (error) {
    console.warn('Devices context not available:', error);
  }
  const { customers } = useCustomers();

  // State
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  
  // Component state
  const [showRepairChecklist, setShowRepairChecklist] = useState(false);
  const [repairPayments, setRepairPayments] = useState<RepairPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Load device data
  useEffect(() => {
    if (isOpen && deviceId) {
      loadDeviceData();
    }
  }, [isOpen, deviceId]);

  const loadDeviceData = async () => {
    setLoading(true);
    try {
      let deviceData = null;
      
      // Try to get device data from context first
      if (getDeviceById) {
        deviceData = await getDeviceById(deviceId);
      }
      
      // If context method fails, fetch directly from database
      if (!deviceData) {
        console.log('[DeviceRepairDetailModal] Fetching device directly from database...');
        const { data, error } = await supabase
          .from('devices')
          .select(`
            id,
            customer_id,
            brand,
            model,
            serial_number,
            issue_description,
            status,
            assigned_to,
            expected_return_date,
            created_at,
            updated_at,
            estimated_hours,
            warranty_start,
            warranty_end,
            warranty_status,
            repair_count,
            last_return_date,
            customers (id, name, phone, email),
            remarks:device_remarks(*),
            transitions:device_transitions(*),
            ratings:device_ratings(*)
          `)
          .eq('id', deviceId)
          .single();
          
        if (error) {
          console.error('Error fetching device from database:', error);
          toast.error('Failed to load device details');
          return;
        }
        
        if (data) {
          // Transform the data to match Device interface
          deviceData = {
            ...data,
            serialNumber: data.serial_number,
            issueDescription: data.issue_description,
            customerId: data.customer_id,
            assignedTo: data.assigned_to,
            expectedReturnDate: data.expected_return_date,
            customerName: Array.isArray(data.customers) && data.customers.length > 0 ? data.customers[0]?.name || '' : '',
            phoneNumber: Array.isArray(data.customers) && data.customers.length > 0 ? data.customers[0]?.phone || '' : '',
            remarks: (data.remarks || []).map((remark: any) => ({
              id: remark.id,
              content: remark.content,
              createdBy: remark.created_by,
              createdAt: remark.created_at
            })),
            transitions: (data.transitions || []).map((transition: any) => ({
              id: transition.id,
              fromStatus: transition.from_status,
              toStatus: transition.to_status,
              performedBy: transition.performed_by,
              timestamp: transition.created_at,
              signature: transition.signature || ''
            })),
            ratings: (data.ratings || []).map((rating: any) => ({
              id: rating.id,
              deviceId: rating.device_id,
              technicianId: rating.technician_id,
              score: rating.score,
              comment: rating.comment,
              createdAt: rating.created_at
            })),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      }
      
      if (deviceData) {
        console.log('[DeviceRepairDetailModal] Device data loaded:', deviceData.status);
        setDevice(deviceData);
        await loadUserNames();
        await loadRepairPayments(deviceData.id);
      } else {
        toast.error('Device not found');
      }
    } catch (error) {
      console.error('Error loading device data:', error);
      toast.error('Failed to load device details');
    } finally {
      setLoading(false);
    }
  };

  const loadRepairPayments = async (deviceId: string) => {
    setPaymentsLoading(true);
    try {
      const payments = await repairPaymentService.getDeviceRepairPayments(deviceId);
      setRepairPayments(payments);
    } catch (error) {
      console.error('Error loading repair payments:', error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadUserNames = async () => {
    try {
      // Simplified user loading
      setUserNames({});
    } catch (error) {
      console.error('Error loading user names:', error);
    }
  };

  // Helper functions
  const getUserName = (userId: string) => {
    if (!userId) return 'Unknown';
    if (userNames[userId]) return userNames[userId];
    if (userId === 'system') return 'System';
    return userId.slice(0, 8) + '...';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Wrench className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getRepairProgress = () => {
    if (!device) return 0;
    const statusProgress: { [key: string]: number } = {
      'assigned': 0,
      'diagnosis-started': 20,
      'awaiting-parts': 30,
      'in-repair': 60,
      'reassembled-testing': 80,
      'repair-complete': 90,
      'returned-to-customer-care': 95,
      'done': 100,
      'failed': 0
    };
    return statusProgress[device.status] || 0;
  };

  const getTotalPaidAmount = () => {
    return repairPayments
      .filter(payment => payment.status === 'completed')
      .reduce((total, payment) => total + (payment.amount || 0), 0);
  };

  const isAssignedTechnician = device?.assignedTo === currentUser?.id;
  const customer = customers.find(c => c.id === device?.customerId);

  // Event handlers
  const handleStatusUpdate = async (deviceIdOrStatus: string | DeviceStatus, newStatus?: DeviceStatus, notes?: string) => {
    if (!device) return;
    
    // Handle different function signatures
    let deviceId: string;
    let status: DeviceStatus;
    let signature: string;
    
    if (typeof deviceIdOrStatus === 'string' && newStatus) {
      // Called from RepairStatusGrid: (deviceId, status, notes)
      deviceId = deviceIdOrStatus;
      status = newStatus;
      signature = notes || '';
    } else {
      // Called from other components: (status, fingerprint)
      deviceId = device.id;
      status = deviceIdOrStatus as DeviceStatus;
      signature = newStatus || '';
    }
    
    try {
      console.log('[DeviceRepairDetailModal] Calling updateDeviceStatus with:', { deviceId, status, signature });
      
      // Try to use context method first, fallback to direct API call
      if (updateDeviceStatus) {
        await updateDeviceStatus(deviceId, status, signature);
      } else {
        // Fallback: direct API call
        const { error } = await supabase
          .from('devices')
          .update({ status })
          .eq('id', deviceId);
          
        if (error) {
          throw error;
        }
      }
      
      toast.success('Status updated successfully');
      
      // Force refresh device data from database with delay
      console.log('[DeviceRepairDetailModal] Refreshing device data...');
      await loadDeviceData();
      
      // Additional refresh after a short delay to ensure database consistency
      setTimeout(async () => {
        console.log('[DeviceRepairDetailModal] Secondary refresh...');
        await loadDeviceData();
      }, 500);
      
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePrintReceipt = () => {
    toast.success('Print receipt functionality coming soon');
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium text-gray-700">Loading device details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Device Not Found</h3>
            <p className="text-gray-600 mb-4">The device you're looking for doesn't exist or has been deleted.</p>
            <GlassButton onClick={onClose} variant="primary">
              Close
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {device.brand} {device.model}
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                  {getStatusIcon(device.status)}
                  <span className="capitalize">{device.status}</span>
                </span>
                <span className="ml-2">Serial: {device.serialNumber}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex space-x-8 px-6">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('overview');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('repair');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'repair'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Repair
              </div>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('payments');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payments
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {activeTab === 'overview' && (
            <>
              {/* Simplified Overview */}
              <div className="mb-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Paid</div>
                    <div className="text-xl font-bold text-emerald-900">
                      {paymentsLoading ? (
                        <div className="animate-pulse bg-emerald-200 h-6 w-20 rounded"></div>
                      ) : (
                        formatCurrency(getTotalPaidAmount())
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Status</div>
                    <div className="text-xl font-bold text-blue-900 capitalize">{device.status}</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Progress</div>
                    <div className="text-xl font-bold text-orange-900">{getRepairProgress()}%</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Files</div>
                    <div className="text-xl font-bold text-purple-900">0</div>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Device Details */}
                <div className="space-y-6">
                  {/* Basic Device Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Device Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Brand</span>
                        <p className="text-sm font-medium text-gray-900">{device.brand || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Model</span>
                        <p className="text-sm font-medium text-gray-900">{device.model || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Serial Number</span>
                        <p className="text-sm font-medium text-gray-900 font-mono">{device.serialNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                        <StatusBadge status={device.status} />
                      </div>
                      {device.assignedTo && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Assigned To</span>
                          <p className="text-sm font-medium text-gray-900">{getUserName(device.assignedTo)}</p>
                        </div>
                      )}
                      {device.estimatedHours && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Estimated Hours</span>
                          <p className="text-sm font-medium text-gray-900">{device.estimatedHours}h</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Issue & Problem Description */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Issue & Problem</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Issue Description</span>
                        <p className="text-sm font-medium text-gray-900 bg-red-50 p-3 rounded-lg border border-red-100">
                          {device.issueDescription || 'No issue description provided'}
                        </p>
                      </div>
                      {device.diagnosisRequired && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Diagnosis Required</span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Yes - Diagnosis Required
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Financial Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {device.repairCost && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Repair Cost</span>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(Number(device.repairCost))}</p>
                        </div>
                      )}
                      {device.repairPrice && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Repair Price</span>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(Number(device.repairPrice))}</p>
                        </div>
                      )}
                      {device.depositAmount && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Deposit Amount</span>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(Number(device.depositAmount))}</p>
                        </div>
                      )}
                      {device.deviceCost && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Device Cost</span>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(Number(device.deviceCost))}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates & Timeline */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Dates & Timeline</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Created</span>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(device.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</span>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(device.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Expected Return</span>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(device.expectedReturnDate).toLocaleDateString()}
                        </p>
                      </div>
                      {device.lastReturnDate && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Last Return</span>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(device.lastReturnDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Device Condition */}
                  {device.deviceCondition && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Shield className="w-5 h-5 text-orange-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Device Condition</h3>
                      </div>
                      <div className="space-y-2">
                        {typeof device.deviceCondition === 'object' ? (
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(device.deviceCondition).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  value ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {value ? 'Yes' : 'No'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded">
                            {device.deviceCondition}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Diagnostic Progress */}
                  {device.diagnosticChecklist && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Search className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Diagnostic Progress</h3>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        {(() => {
                          try {
                            const checklist = typeof device.diagnosticChecklist === 'string' 
                              ? JSON.parse(device.diagnosticChecklist) 
                              : device.diagnosticChecklist;
                            
                            if (checklist.summary) {
                              const { total, passed, failed, pending } = checklist.summary;
                              return (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-blue-600 font-semibold">Total Tests: {total}</span>
                                    <span className="text-sm text-gray-600">
                                      {checklist.overallStatus || 'In Progress'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center p-2 bg-green-100 rounded">
                                      <div className="text-green-600 font-bold text-lg">{passed}</div>
                                      <div className="text-xs text-green-700">Passed</div>
                                    </div>
                                    <div className="text-center p-2 bg-red-100 rounded">
                                      <div className="text-red-600 font-bold text-lg">{failed}</div>
                                      <div className="text-xs text-red-700">Failed</div>
                                    </div>
                                    <div className="text-center p-2 bg-yellow-100 rounded">
                                      <div className="text-yellow-600 font-bold text-lg">{pending}</div>
                                      <div className="text-xs text-yellow-700">Pending</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return <p className="text-sm text-gray-600">Diagnostic tests available</p>;
                          } catch {
                            return <p className="text-sm text-gray-600">Diagnostic data available</p>;
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Repair Progress */}
                  {device.repairChecklist && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Wrench className="w-5 h-5 text-green-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Repair Progress</h3>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        {(() => {
                          try {
                            const checklist = typeof device.repairChecklist === 'string' 
                              ? JSON.parse(device.repairChecklist) 
                              : device.repairChecklist;
                            
                            if (checklist.items) {
                              const completed = checklist.items.filter((item: any) => item.completed).length;
                              const total = checklist.items.length;
                              const percentage = Math.round((completed / total) * 100);
                              
                              return (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-green-600 font-semibold">
                                      {completed}/{total} Steps Complete
                                    </span>
                                    <span className="text-sm text-gray-600">{percentage}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            }
                            return <p className="text-sm text-gray-600">Repair workflow available</p>;
                          } catch {
                            return <p className="text-sm text-gray-600">Repair data available</p>;
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Warranty Information */}
                  {(device.warrantyStart || device.warrantyEnd || device.warrantyStatus || device.repairCount) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Warranty Information</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {device.warrantyStart && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Warranty Start</span>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(device.warrantyStart).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {device.warrantyEnd && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Warranty End</span>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(device.warrantyEnd).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {device.warrantyStatus && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Warranty Status</span>
                            <p className="text-sm font-medium text-gray-900 capitalize">{device.warrantyStatus}</p>
                          </div>
                        )}
                        {device.repairCount && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Repair Count</span>
                            <p className="text-sm font-medium text-gray-900">{device.repairCount}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  {(device.unlockCode || device.deviceNotes) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Additional Information</h3>
                      </div>
                      <div className="space-y-3">
                        {device.unlockCode && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Unlock Code</span>
                            <p className="text-sm font-medium text-gray-900 font-mono bg-gray-50 p-2 rounded">
                              {device.unlockCode}
                            </p>
                          </div>
                        )}
                        {device.deviceNotes && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Device Notes</span>
                            <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {device.deviceNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <UserIcon className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Customer Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Name</span>
                        <p className="text-sm font-medium text-gray-900">{customer?.name || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Phone</span>
                        <p className="text-sm font-medium text-gray-900">{customer?.phone || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Email</span>
                        <p className="text-sm font-medium text-gray-900">{customer?.email || 'N/A'}</p>
                      </div>
                      {device.expectedReturnDate && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Expected Return</span>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(device.expectedReturnDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Actions & Summary */}
                <div className="space-y-6">
                  {/* Actions */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Actions</h3>
                    </div>
                    
                    {/* Primary Actions */}
                    <div className="space-y-2">
                      {/* Status Update Dropdown - Always visible */}
                      {device && (
                        <RepairStatusUpdater
                          device={device}
                          currentUser={currentUser}
                          onStatusUpdate={handleStatusUpdate}
                          onClose={() => {}}
                          compact={true}
                        />
                      )}

                      
                      {currentUser?.role === 'customer-care' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toast.success('SMS functionality coming soon');
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Send className="w-4 h-4" />
                          Send SMS
                        </button>
                      )}
                      
                      {(isAssignedTechnician || currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
                        <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowRepairChecklist(!showRepairChecklist);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Wrench className="w-4 h-4" />
                          {showRepairChecklist ? 'Hide Checklist' : 'Repair Checklist'}
                        </button>
                        </>
                      )}
                    </div>


                    {/* Inline Repair Checklist within Action Card */}
                    {device && showRepairChecklist && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-800">Repair Checklist</h4>
                          <button 
                            onClick={() => setShowRepairChecklist(false)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <RepairChecklist
                          device={device}
                          isOpen={true}
                          onClose={() => setShowRepairChecklist(false)}
                          onStatusUpdate={handleStatusUpdate}
                        />
                      </div>
                    )}
                  </div>

                  {/* Device Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800">Device Summary</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{getRepairProgress()}</div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide">Progress %</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">0</div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide">Files</div>
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(0)}
                        </div>
                        <div className="text-xs text-green-700 uppercase tracking-wide">Total Paid</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'repair' && device && (
            <div className="space-y-6">
              {/* Enhanced Repair Status Grid */}
              <RepairStatusGrid
                device={device}
                currentUser={currentUser}
                onStatusUpdate={handleStatusUpdate}
                onPartsUpdate={(parts) => {
                  // Handle parts update - could save to database
                  console.log('Parts updated:', parts);
                }}
              />

              {/* Repair Checklist */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckSquare className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Repair Checklist</h3>
                  </div>
                  <button
                    onClick={() => setShowRepairChecklist(!showRepairChecklist)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Open Checklist
                  </button>
                </div>
                <p className="text-gray-600 text-sm">
                  Track repair progress and manage diagnostic steps
                </p>
              </div>

              {/* Repair Progress */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Repair Progress</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Overall Progress</span>
                    <span className="text-sm font-semibold text-gray-900">{getRepairProgress()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getRepairProgress()}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Diagnosis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">Repair</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && device && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Payment Summary</h3>
                </div>
                {paymentsLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                    <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Repair Cost</div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(Number(device.repairCost) || 0)}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 mb-1">Total Paid</div>
                      <div className="text-xl font-bold text-green-700">
                        {formatCurrency(getTotalPaidAmount())}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Payment Actions</h3>
                </div>
                <div className="space-y-4">
                  {device.status === 'repair-complete' && customer && (
                    <RepairPaymentButton
                      customerId={device.customerId || ''}
                      customerName={customer.name || 'Unknown Customer'}
                      deviceId={device.id}
                      deviceName={`${device.brand} ${device.model}`}
                      repairAmount={Number(device.repairCost) || 0}
                      onPaymentComplete={(paymentData) => {
                        toast.success('Repair payment processed successfully!');
                        loadDeviceData(); // Refresh device data
                        loadRepairPayments(device.id); // Refresh payment data
                      }}
                      className="w-full"
                      variant="primary"
                      size="md"
                    />
                  )}
                  
                  {device.status !== 'repair-complete' && (
                    <div className="text-center py-4">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        Payment will be available once repair is complete
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <History className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Payment History</h3>
                </div>
                {paymentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                    ))}
                  </div>
                ) : repairPayments.length > 0 ? (
                  <div className="space-y-3">
                    {repairPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            payment.status === 'completed' ? 'bg-green-500' : 
                            payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {payment.method} • {new Date(payment.payment_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {payment.status}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.payment_account_name || 'Unknown Account'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      No payment history available
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.success('Communication functionality coming soon');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Send className="w-4 h-4" />
              Communication
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('payments');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <CreditCard className="w-4 h-4" />
              Payments
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
            
            {currentUser?.role !== 'technician' && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePrintReceipt();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            )}
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('repair');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Wrench className="w-4 h-4" />
              Repair Details
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DeviceRepairDetailModal;