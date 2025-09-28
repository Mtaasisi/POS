import React, { useState, useEffect } from 'react';
import { Device, DeviceStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../lib/customerApi';
import { repairPaymentService, RepairPayment } from '../../../lib/repairPaymentService';

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
import ProgressBar from '../../shared/components/ui/ProgressBar';
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
      const deviceData = await getDeviceById(deviceId);
      if (deviceData) {
        setDevice(deviceData);
        await loadUserNames();
        await loadRepairPayments(deviceData.id);
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
              {/* Enhanced Overview with Quick Actions */}
              <div className="mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Current Status & Progress */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        {getStatusIcon(device.status)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-blue-900 capitalize">
                          {device.status.replace('-', ' ')}
                        </h3>
                        <p className="text-blue-700 text-sm">Current Status</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600">Progress</span>
                        <span className="font-semibold text-blue-900">{getRepairProgress()}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3 relative overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                          style={{ width: `${getRepairProgress()}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-800">
                            {getRepairProgress()}%
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600">
                        {device.remarks ? 'Has notes' : 'No notes yet'}
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-emerald-900">Payment</h3>
                        <p className="text-emerald-700 text-sm">Financial Summary</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-600 text-sm">Repair Cost</span>
                        <span className="font-semibold text-emerald-900">
                          {formatCurrency(Number(device.repairCost) || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-600 text-sm">Paid</span>
                        <span className="font-semibold text-emerald-900">
                          {paymentsLoading ? (
                            <div className="animate-pulse bg-emerald-200 h-4 w-16 rounded"></div>
                          ) : (
                            formatCurrency(getTotalPaidAmount())
                          )}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-emerald-200">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-600 text-sm font-medium">Balance</span>
                          <span className="font-bold text-emerald-900">
                            {formatCurrency((Number(device.repairCost) || 0) - getTotalPaidAmount())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-purple-900">Quick Actions</h3>
                        <p className="text-purple-700 text-sm">Common Tasks</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(isAssignedTechnician || currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
                        <>
                          <button
                            onClick={() => setShowRepairChecklist(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            <CheckSquare className="w-4 h-4" />
                            Open Checklist
                          </button>
                          
                          <button
                            onClick={() => setShowStatusUpdater(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            <Activity className="w-4 h-4" />
                            Update Status
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => toast.success('Print functionality coming soon')}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Printer className="w-4 h-4" />
                        Print Report
                      </button>
                    </div>
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
                            onClick={() => setShowStatusUpdater(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            <Stethoscope className="w-4 h-4" />
                            Update Status
                          </button>
                        
                          <button
                            onClick={() => setShowRepairChecklist(true)}
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
                    onClick={() => setShowRepairChecklist(true)}
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
                  <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-700 ease-out relative"
                      style={{ width: `${getRepairProgress()}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-800 drop-shadow-sm">
                        {getRepairProgress()}% Complete
                      </span>
                    </div>
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

      {/* Repair Checklist Modal */}
      {device && (
        <RepairChecklist
          device={device}
          isOpen={showRepairChecklist}
          onClose={() => setShowRepairChecklist(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Status Updater Modal */}
      {device && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${showStatusUpdater ? 'block' : 'hidden'}`}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowStatusUpdater(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Update Device Status</h3>
              <button 
                onClick={() => setShowStatusUpdater(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <RepairStatusUpdater
                device={device}
                currentUser={currentUser}
                onStatusUpdate={handleStatusUpdate}
                onClose={() => setShowStatusUpdater(false)}
                compact={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceRepairDetailModal;