import React, { useState, useEffect } from 'react';
import { Device, User, DeviceStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../lib/customerApi';
import { usePaymentMethodsContext } from '../../../context/PaymentMethodsContext';

// Icons
import { 
  X, Smartphone, User as UserIcon, Clock, CheckCircle, AlertTriangle, 
  Wrench, Stethoscope, CreditCard, Send, Printer, Upload,
  History, Timer, Target, CheckSquare, MessageSquare, 
  Edit, Trash2, Eye, Download, Phone, Mail, MapPin,
  Calendar, DollarSign, Package, FileText, Settings,
  Info, Building, Activity, BarChart3, MessageCircle
} from 'lucide-react';

// Components
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import DeviceBarcodeCard from './DeviceBarcodeCard';
import RepairChecklist from './RepairChecklist';
import DiagnosticChecklist from '../../../features/diagnostics/components/DiagnosticChecklist';
import StatusUpdateForm from './forms/StatusUpdateForm';
import AssignTechnicianForm from './forms/AssignTechnicianForm';
import PaymentsPopupModal from '../../../components/PaymentsPopupModal';
// import SmsModal from '../../../components/SmsModal'; // TODO: Create SmsModal component

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
  const { paymentMethods } = usePaymentMethodsContext();

  // State
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  
  // Modal states
  const [showRepairChecklist, setShowRepairChecklist] = useState(false);
  const [showDiagnosticChecklist, setShowDiagnosticChecklist] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  
  // Work timer state
  const [workTimer, setWorkTimer] = useState({
    isRunning: false,
    startTime: null as Date | null,
    elapsedTime: 0,
    sessions: [] as Array<{ start: Date; end?: Date; duration?: number }>
  });

  // Payment and financial data
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [outstanding, setOutstanding] = useState<number | null>(null);
  const [invoiceTotal, setInvoiceTotal] = useState(0);

  // Attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);

  // Timeline
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

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
        await Promise.all([
          loadUserNames(),
          loadPayments(deviceData.id),
          loadAttachments(deviceData.id),
          loadTimeline(deviceData.id)
        ]);
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
      const { data: users, error } = await supabase
        .from('auth_users')
        .select('id, name');
      
      if (!error && users) {
        const names: { [key: string]: string } = {};
        users.forEach(user => {
          names[user.id] = user.name;
        });
        setUserNames(names);
      }
    } catch (error) {
      console.error('Error loading user names:', error);
    }
  };

  const loadPayments = async (deviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPayments(data);
        const total = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        setTotalPaid(total);
        
        // Calculate outstanding if device has repair cost
        if (device?.repairCost) {
          const repairCost = Number(device.repairCost);
          setInvoiceTotal(repairCost);
          setOutstanding(Math.max(0, repairCost - total));
        }
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const loadAttachments = async (deviceId: string) => {
    setAttachmentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('device_attachments')
        .select('*')
        .eq('device_id', deviceId)
        .order('uploaded_at', { ascending: false });

      if (!error && data) {
        setAttachments(data);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
      setAttachmentsError('Failed to load attachments');
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const loadTimeline = async (deviceId: string) => {
    setTimelineLoading(true);
    try {
      const { data, error } = await supabase
        .from('device_audit_log')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setTimeline(data);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setTimelineLoading(false);
    }
  };

  // Work timer functions
  const startWorkTimer = () => {
    const now = new Date();
    setWorkTimer(prev => ({
      ...prev,
      isRunning: true,
      startTime: now,
      elapsedTime: 0
    }));
  };

  const stopWorkTimer = () => {
    if (workTimer.startTime) {
      const now = new Date();
      const duration = Math.floor((now.getTime() - workTimer.startTime.getTime()) / 60000); // minutes
      
      setWorkTimer(prev => ({
        ...prev,
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        sessions: [
          { start: prev.startTime!, end: now, duration },
          ...prev.sessions
        ]
      }));
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper functions
  const getUserName = (userId: string) => {
    if (!userId) return 'Unknown';
    if (userNames[userId]) return userNames[userId];
    if (userId === 'system') return 'System';
    return userId.slice(0, 8) + '...';
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
    // Implement print receipt functionality
    toast.success('Print receipt functionality coming soon');
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !device) return;

    setUploadProgress(0);
    setAttachmentsError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${device.id}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `device-attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('device-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('device-attachments')
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from('device_attachments')
          .insert({
            device_id: device.id,
            filename: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: currentUser?.id
          });

        if (insertError) throw insertError;

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      toast.success('Files uploaded successfully');
      await loadAttachments(device.id);
    } catch (error) {
      console.error('Error uploading files:', error);
      setAttachmentsError('Failed to upload files');
    } finally {
      setUploadProgress(null);
    }
  };

  const getFilePreview = (attachment: any) => {
    if (attachment.mime_type?.startsWith('image/')) {
      const publicUrl = supabase.storage.from('device-attachments').getPublicUrl(attachment.file_path).data.publicUrl;
      return (
        <img 
          src={publicUrl} 
          alt={attachment.filename}
          className="w-12 h-12 object-cover rounded-lg"
        />
      );
    }
    return (
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
        <FileText className="w-6 h-6 text-gray-500" />
      </div>
    );
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
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
                <StatusBadge status={device.status} />
              </div>
              <p className="text-sm text-gray-500">
                <span className="font-medium">{customer?.name || 'Unknown Customer'}</span>
                <span className="ml-2">•</span>
                <span className="ml-2">ID: {device.id.slice(0, 8)}</span>
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
            <button
              onClick={() => setActiveTab('attachments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'attachments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Files
              </div>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Timeline
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Device Information */}
              <GlassCard className="bg-gradient-to-br from-blue-500/10 to-blue-400/5">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Device Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Brand:</span>
                    <span className="text-sm font-medium">{device.brand || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Model:</span>
                    <span className="text-sm font-medium">{device.model || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Serial:</span>
                    <span className="text-sm font-medium">{device.serialNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <StatusBadge status={device.status} />
                  </div>
                  {device.assignedTo && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Assigned To:</span>
                      <span className="text-sm font-medium">{getUserName(device.assignedTo)}</span>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Customer Information */}
              <GlassCard className="bg-gradient-to-br from-green-500/10 to-green-400/5">
                <h3 className="text-lg font-bold text-green-900 mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium">{customer?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm font-medium">{customer?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium">{customer?.email || 'N/A'}</span>
                  </div>
                  {device.expectedReturnDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Expected Return:</span>
                      <span className="text-sm font-medium">
                        {new Date(device.expectedReturnDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Quick Actions */}
              <GlassCard className="bg-gradient-to-br from-purple-500/10 to-purple-400/5 lg:col-span-2">
                <h3 className="text-lg font-bold text-purple-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {currentUser?.role !== 'technician' && (
                    <GlassButton
                      variant="primary"
                      icon={<Printer size={16} />}
                      className="h-10 text-sm justify-center"
                      onClick={handlePrintReceipt}
                    >
                      Print Receipt
                    </GlassButton>
                  )}
                  
                  {currentUser?.role === 'customer-care' && (
                    <GlassButton
                      variant="secondary"
                      icon={<Send size={16} />}
                      className="h-10 text-sm justify-center"
                      onClick={() => setShowSmsModal(true)}
                    >
                      Send SMS
                    </GlassButton>
                  )}
                  
                  {(isAssignedTechnician || currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
                    <>
                      <GlassButton
                        variant="secondary"
                        icon={<Stethoscope size={16} />}
                        className="h-10 text-sm justify-center"
                        onClick={() => setShowDiagnosticChecklist(true)}
                      >
                        Diagnostic
                      </GlassButton>
                      
                      <GlassButton
                        variant="secondary"
                        icon={<Wrench size={16} />}
                        className="h-10 text-sm justify-center"
                        onClick={() => setShowRepairChecklist(true)}
                      >
                        Repair Checklist
                      </GlassButton>
                    </>
                  )}
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === 'repair' && (
            <div className="space-y-6">
              {/* Repair Progress */}
              <GlassCard className="bg-gradient-to-br from-orange-500/10 to-orange-400/5">
                <h3 className="text-lg font-bold text-orange-900 mb-4">Repair Progress</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-lg font-bold text-orange-700">{getRepairProgress()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getRepairProgress()}%` }}
                    ></div>
                  </div>
                </div>
              </GlassCard>

              {/* Status Update */}
              {(isAssignedTechnician || currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
                <GlassCard className="bg-gradient-to-br from-blue-500/10 to-blue-400/5">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Update Status</h3>
                  <StatusUpdateForm
                    device={device}
                    currentUser={currentUser!}
                    onUpdateStatus={handleStatusUpdate}
                    onAddRemark={() => {}} // Implement if needed
                    onAddRating={() => {}} // Implement if needed
                    outstanding={outstanding}
                  />
                </GlassCard>
              )}

              {/* Work Timer for Technicians */}
              {isAssignedTechnician && (
                <GlassCard className="bg-gradient-to-br from-emerald-500/10 to-emerald-400/5">
                  <h3 className="text-lg font-bold text-emerald-900 mb-4">Work Timer</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Current Session</span>
                      <span className="text-lg font-mono font-bold text-emerald-700">
                        {workTimer.isRunning ? formatDuration(workTimer.elapsedTime) : '00:00:00'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      {!workTimer.isRunning ? (
                        <GlassButton
                          variant="primary"
                          icon={<Timer size={16} />}
                          className="flex-1 h-10 text-sm"
                          onClick={startWorkTimer}
                        >
                          Start Work
                        </GlassButton>
                      ) : (
                        <GlassButton
                          variant="secondary"
                          icon={<Timer size={16} />}
                          className="flex-1 h-10 text-sm"
                          onClick={stopWorkTimer}
                        >
                          Stop Work
                        </GlassButton>
                      )}
                    </div>
                    
                    {workTimer.sessions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Recent Sessions</h4>
                        <div className="space-y-1">
                          {workTimer.sessions.slice(0, 3).map((session, index) => (
                            <div key={index} className="flex justify-between text-xs bg-white/20 rounded p-2">
                              <span>{new Date(session.start).toLocaleDateString()}</span>
                              <span className="font-medium">
                                {session.duration ? `${session.duration}m` : 'In progress'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <GlassCard className="bg-gradient-to-br from-green-500/10 to-green-400/5">
                <h3 className="text-lg font-bold text-green-900 mb-4">Payment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 border border-white/30">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Total Paid</span>
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      {formatCurrency(totalPaid)}
                    </div>
                  </div>
                  
                  {device.repairCost && (
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 border border-white/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Repair Cost</span>
                      </div>
                      <div className="text-lg font-bold text-green-700">
                        {formatCurrency(Number(device.repairCost))}
                      </div>
                    </div>
                  )}
                  
                  {outstanding !== null && (
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 border border-white/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-gray-700">Outstanding</span>
                      </div>
                      <div className="text-lg font-bold text-amber-700">
                        {formatCurrency(outstanding)}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Payment Actions */}
              {(currentUser?.role === 'customer-care' || currentUser?.role === 'admin') && (
                <GlassCard className="bg-gradient-to-br from-blue-500/10 to-blue-400/5">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Payment Actions</h3>
                  <GlassButton
                    variant="primary"
                    icon={<CreditCard size={16} />}
                    className="h-12 w-full text-base justify-center"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    Record Payment
                  </GlassButton>
                </GlassCard>
              )}

              {/* Payment History */}
              {payments.length > 0 && (
                <GlassCard className="bg-gradient-to-br from-gray-500/10 to-gray-400/5">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History</h3>
                  <div className="space-y-3">
                    {payments.map((payment, index) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.payment_method} • {formatRelativeTime(payment.created_at)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              by {getUserName(payment.created_by)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-6">
              {/* Upload Section */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'customer-care' || isAssignedTechnician) && (
                <GlassCard className="bg-gradient-to-br from-purple-500/10 to-purple-400/5">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">Upload Files</h3>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={handleAttachmentUpload}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <GlassButton
                      variant="primary"
                      icon={<Upload size={16} />}
                      className="h-12 w-full text-base justify-center"
                      disabled={attachmentsLoading}
                    >
                      Choose Files
                    </GlassButton>
                  </label>
                  
                  {uploadProgress !== null && (
                    <div className="mt-4">
                      <div className="bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </GlassCard>
              )}

              {/* Attachments List */}
              <GlassCard className="bg-gradient-to-br from-gray-500/10 to-gray-400/5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Attachments</h3>
                {attachments.length === 0 ? (
                  <div className="text-center py-8">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-700">No attachments uploaded yet.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attachments.map((att) => (
                      <div key={att.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {getFilePreview(att)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{att.filename}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {att.uploaded_at ? formatRelativeTime(att.uploaded_at) : ''}
                            </p>
                            <p className="text-xs text-gray-500">
                              by {getUserName(att.uploaded_by)}
                            </p>
                            <div className="mt-3">
                              <a 
                                href={supabase.storage.from('device-attachments').getPublicUrl(att.file_path).data.publicUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <GlassCard className="bg-gradient-to-br from-gray-500/10 to-gray-400/5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Timeline</h3>
                {timelineLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading activity...</p>
                  </div>
                ) : timeline.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No activity recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((event, index) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Activity className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {event.action || 'Status Update'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(event.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {event.description || event.old_values || 'No description available'}
                            </p>
                            <div className="text-xs text-gray-500">
                              by {getUserName(event.created_by)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showRepairChecklist && (
        <RepairChecklist
          device={device}
          isOpen={showRepairChecklist}
          onClose={() => setShowRepairChecklist(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {showDiagnosticChecklist && (
        <DiagnosticChecklist
          device={device}
          isOpen={showDiagnosticChecklist}
          onClose={() => setShowDiagnosticChecklist(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {showPaymentModal && customer && (
        <PaymentsPopupModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={outstanding || 0}
          customerId={customer.id}
          customerName={customer.name}
          description={`Repair payment for ${device.brand} ${device.model}`}
          onPaymentComplete={async () => {
            toast.success('Payment recorded successfully');
            await loadPayments(device.id);
            setShowPaymentModal(false);
          }}
          title="Record Repair Payment"
          showCustomerInfo={true}
        />
      )}

      {/* TODO: Implement SmsModal component
      {showSmsModal && customer && (
        <SmsModal
          isOpen={showSmsModal}
          onClose={() => setShowSmsModal(false)}
          customerId={customer.id}
          customerName={customer.name}
          customerPhone={customer.phone}
        />
      )}
      */}
    </div>
  );
};

export default DeviceRepairDetailModal;
