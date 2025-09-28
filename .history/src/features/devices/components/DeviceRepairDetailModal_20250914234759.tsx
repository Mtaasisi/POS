import React, { useState, useEffect } from 'react';
import { Device, DeviceStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../lib/customerApi';

// Icons
import { 
  X, Smartphone, User as UserIcon, Clock, CheckCircle, AlertTriangle, 
  Wrench, Stethoscope, CreditCard, Send, Printer, Upload,
  History, Timer, Target, CheckSquare, MessageSquare, 
  Edit, Trash2, Eye, Download, Phone, Mail, MapPin,
  Calendar, DollarSign, Package, FileText, Settings,
  Info, Building, Activity, BarChart3, MessageCircle, Zap
} from 'lucide-react';

// Components
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import RepairChecklist from './RepairChecklist';
import RepairPaymentButton from './RepairPaymentButton';
import RepairStatusUpdater from './RepairStatusUpdater';

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
  const { getDeviceById, updateDeviceStatus } = useDevices();
  const { customers } = useCustomers();

  // State
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  
  // Component state
  const [showRepairChecklist, setShowRepairChecklist] = useState(false);
  const [showStatusUpdater, setShowStatusUpdater] = useState(false);

  // Load device data
  useEffect(() => {
    if (isOpen && deviceId) {
      loadDeviceData();
    }
  }, [isOpen, deviceId]);

  const loadDeviceData = async () => {
    setLoading(true);
    try {
      const deviceData = await getDeviceById(deviceId);
      if (deviceData) {
        setDevice(deviceData);
        await loadUserNames();
      }
    } catch (error) {
      console.error('Error loading device data:', error);
      toast.error('Failed to load device details');
    } finally {
      setLoading(false);
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

  const isAssignedTechnician = device?.assignedTo === currentUser?.id;
  const customer = customers.find(c => c.id === device?.customerId);

  // Event handlers
  const handleStatusUpdate = async (status: DeviceStatus, fingerprint: string = '') => {
    if (!device) return;
    
    try {
      await updateDeviceStatus(device.id, status, fingerprint);
      toast.success('Status updated successfully');
      await loadDeviceData(); // Refresh data
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
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
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
              onClick={() => setActiveTab('repair')}
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
              onClick={() => setActiveTab('payments')}
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
                    <div className="text-xl font-bold text-emerald-900">{formatCurrency(0)}</div>
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
                  {/* Device Information */}
                  <div className="backdrop-blur-xl rounded-xl border shadow-lg p-6 sm:p-8 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-blue-500/10 to-blue-400/5 border-blue-200/30">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-blue-900">Device Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-blue-100/50">
                        <span className="text-sm font-medium text-gray-600">Brand</span>
                        <span className="text-sm font-semibold text-gray-900 bg-blue-50 px-3 py-1 rounded-lg">{device.brand || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-100/50">
                        <span className="text-sm font-medium text-gray-600">Model</span>
                        <span className="text-sm font-semibold text-gray-900 bg-blue-50 px-3 py-1 rounded-lg">{device.model || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-100/50">
                        <span className="text-sm font-medium text-gray-600">Serial Number</span>
                        <span className="text-sm font-semibold text-gray-900 bg-blue-50 px-3 py-1 rounded-lg font-mono">{device.serialNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-100/50">
                        <span className="text-sm font-medium text-gray-600">Status</span>
                        <StatusBadge status={device.status} />
                      </div>
                      {device.assignedTo && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-600">Assigned To</span>
                          <span className="text-sm font-semibold text-gray-900 bg-blue-50 px-3 py-1 rounded-lg">{getUserName(device.assignedTo)}</span>
                        </div>
                      )}
                    </div>
                  </div>

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
                      {currentUser?.role !== 'technician' && (
                        <button
                          onClick={handlePrintReceipt}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Printer className="w-4 h-4" />
                          Print Receipt
                        </button>
                      )}
                      
                      {currentUser?.role === 'customer-care' && (
                        <button
                          onClick={() => toast.success('SMS functionality coming soon')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Send className="w-4 h-4" />
                          Send SMS
                        </button>
                      )}
                      
                      {(isAssignedTechnician || currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
                        <>
                          <button
                            onClick={() => toast.success('Diagnostic functionality coming soon')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            <Stethoscope className="w-4 h-4" />
                            Diagnostic
                          </button>
                        
                          <button
                            onClick={() => toast.success('Repair checklist functionality coming soon')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            <Wrench className="w-4 h-4" />
                            Repair Checklist
                          </button>
                        </>
                      )}
                    </div>
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

          {activeTab === 'repair' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Repair Details</h3>
                <p className="text-gray-500">Repair functionality coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Payment Details</h3>
                <p className="text-gray-500">Payment functionality coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success('Communication functionality coming soon')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Send className="w-4 h-4" />
              Communication
            </button>
            
            <button
              onClick={() => setActiveTab('payments')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <CreditCard className="w-4 h-4" />
              Payments
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
            
            <button
              onClick={() => setActiveTab('repair')}
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