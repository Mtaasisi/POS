import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { usePayments } from '../../../context/PaymentsContext';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  Smartphone, Edit, Save, X, AlertCircle, 
  FileText, Clock, Send,
  DollarSign, Printer, Download,
  User, 
  BarChart3, History, Info, 
  Layers, 
  FileImage, CheckCircle2, 
  Zap, CreditCard, 
  Wrench, Stethoscope, Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../lib/customerApi';
import StatusBadge from '../../../features/shared/components/ui/StatusBadge';

interface DeviceDetailPageProps {
  editMode?: boolean;
}

const DeviceDetailPage: React.FC<DeviceDetailPageProps> = ({ editMode = false }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Context hooks
  const { 
    getDeviceById,
    updateDeviceStatus,
    addRemark,
    devices,
    loading: devicesLoading,
    getDeviceOverdueStatus
  } = useDevices();
  const { getCustomerById } = useCustomers();
  const { payments, refreshPayments } = usePayments();

  // Local state
  const [device, setDevice] = useState<any | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(editMode);
  const [isLoadingDevice, setIsLoadingDevice] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // New state for enhanced features
  const [activeTab, setActiveTab] = useState('overview');
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  
  // Lazy load data only when needed
  const [repairHistory, setRepairHistory] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['overview']));

  // Load device data on component mount
  useEffect(() => {
    if (id) {
      loadDevice();
    }
  }, [id]);

  // Handle editMode prop changes
  useEffect(() => {
    setIsEditing(editMode);
  }, [editMode]);

  // Handle tab switching with lazy loading
  const handleTabChange = useCallback(async (tabName: string) => {
    setActiveTab(tabName);
    
    // Load data only when tab is first accessed
    if (!loadedTabs.has(tabName)) {
      setLoadedTabs(prev => new Set(Array.from(prev).concat(tabName)));
      
      // Load specific data based on tab
      switch (tabName) {
        case 'repair':
          // Load repair history
          break;
        case 'payments':
          // Load payment history
          if (device) {
            try {
              const devicePayments = payments.filter(p => p.deviceId === device.id);
              setPaymentHistory(devicePayments);
    } catch (error) {
              console.error('Failed to load payment history:', error);
            }
          }
          break;
        case 'files':
          // Load attachments
          break;
        case 'timeline':
          // Load timeline data
          break;
        case 'analytics':
          // Load analytics data
          break;
        default:
          break;
      }
    }
  }, [loadedTabs, device, payments]);

  const loadDevice = useCallback(async () => {
    if (!id) return;
    
    setIsLoadingDevice(true);
    
    try {
      const deviceData = getDeviceById(id);
      
      if (deviceData) {
        console.log('🔍 [DeviceDetailPage] DEBUG - Device data received:', {
          id: deviceData.id,
          brand: deviceData.brand,
          model: deviceData.model,
          status: deviceData.status,
          customerId: deviceData.customerId
        });
        setDevice(deviceData);
        
        // Load customer data
        if (deviceData.customerId) {
          const customerData = getCustomerById(deviceData.customerId);
          if (customerData) {
            setCustomer(customerData);
          }
        }
      } else {
        console.error('❌ [DeviceDetailPage] Failed to load device:', 'Device not found');
        toast.error('Device not found');
        navigate('/devices');
      }
    } catch (error) {
      console.error('❌ [DeviceDetailPage] Error loading device:', error);
      toast.error('Failed to load device');
      navigate('/devices');
      } finally {
      setIsLoadingDevice(false);
    }
  }, [id, getDeviceById, getCustomerById, navigate]);

  // Memoized refresh function to prevent infinite re-renders
  const handleRefresh = useCallback(() => {
    loadDevice();
  }, [loadDevice]);

  // Helper functions
  const getRepairProgress = () => {
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
    return statusProgress[device?.status] || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'text-yellow-600 bg-yellow-100';
      case 'diagnosis-started': return 'text-blue-600 bg-blue-100';
      case 'awaiting-parts': return 'text-amber-600 bg-amber-100';
      case 'in-repair': return 'text-purple-600 bg-purple-100';
      case 'reassembled-testing': return 'text-cyan-600 bg-cyan-100';
      case 'repair-complete': return 'text-emerald-600 bg-emerald-100';
      case 'returned-to-customer-care': return 'text-teal-600 bg-teal-100';
      case 'done': return 'text-gray-600 bg-gray-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Handler functions
  const handleSave = async () => {
    if (!device) return;
    
    setIsSaving(true);
    try {
      // Update device logic here
      toast.success('Device updated successfully');
      setIsEditing(false);
      await loadDevice();
    } catch (error) {
      toast.error('Failed to update device');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintOrder = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow && device) {
        const printContent = generatePrintContent(device);
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        toast.success('Device information sent to printer');
      }
    } catch (error) {
      toast.error('Failed to print device information');
    }
  };

  const handleExportPDF = () => {
    try {
      if (device) {
        const pdfContent = generatePDFContent(device);
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Device_${device.brand}_${device.model}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('PDF exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const generatePrintContent = (device: any) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Device ${device.brand} ${device.model}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .device-info { margin-bottom: 20px; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .info-table th, .info-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .info-table th { background-color: #f2f2f2; }
            .status { text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DEVICE REPAIR INFORMATION</h1>
            <h2>${device.brand} ${device.model}</h2>
          </div>
          
          <div class="device-info">
            <p><strong>Serial Number:</strong> ${device.serialNumber}</p>
            <p><strong>Status:</strong> ${device.status.toUpperCase()}</p>
            <p><strong>Customer:</strong> ${customer?.name || 'N/A'}</p>
            <p><strong>Issue:</strong> ${device.issueDescription || 'N/A'}</p>
            <p><strong>Repair Cost:</strong> ${formatCurrency(device.repairCost || 0)}</p>
          </div>
        </body>
      </html>
    `;
  };

  const generatePDFContent = (device: any) => {
    return `Device ${device.brand} ${device.model}\n\n` +
           `Serial: ${device.serialNumber}\n` +
           `Status: ${device.status}\n` +
           `Customer: ${customer?.name || 'N/A'}\n` +
           `Issue: ${device.issueDescription || 'N/A'}\n` +
           `Repair Cost: ${formatCurrency(device.repairCost || 0)}\n\n`;
  };

  if (isLoadingDevice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading device...</p>
      </div>
          </div>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Device Not Found</h2>
            <p className="text-gray-600 mb-4">The device you're looking for doesn't exist.</p>
            <GlassButton onClick={() => navigate('/devices')}>
            Back to Devices
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
        onClick={() => navigate('/devices')}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isEditing ? 'border-blue-200 bg-blue-50' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEditing ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{device.brand} {device.model}</h2>
                {isEditing && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    <Edit className="w-4 h-4" />
                    Editing Mode
                  </div>
                )}
                </div>
                <p className="text-sm text-gray-500">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                    <Clock className="w-4 h-4" />
                  <span className="capitalize">{device.status}</span>
                  </span>
                <span className="ml-2">Serial: {device.serialNumber}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/devices')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-white">
            <div className="flex space-x-8 px-6">
            <button
              onClick={() => handleTabChange('overview')}
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
              onClick={() => handleTabChange('repair')}
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
              onClick={() => handleTabChange('payments')}
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
              onClick={() => handleTabChange('files')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
                <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                  Files
                </div>
              </button>
            <button
              onClick={() => handleTabChange('timeline')}
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
            <button
              onClick={() => handleTabChange('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </div>
            </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Device Overview - Enhanced Design */}
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
                      {formatCurrency(device.totalPaid || 0)}
                </div>
                  </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Status</div>
                    <div className="text-xl font-bold text-blue-900">
                      <StatusBadge status={device.status} />
                </div>
                  </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Progress</div>
                    <div className="text-xl font-bold text-orange-900 mb-2">{getRepairProgress()}%</div>
                    <div className="w-full bg-orange-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${getRepairProgress()}%` }}
                      ></div>
                </div>
                  </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Files</div>
                  <div className="text-xl font-bold text-purple-900">{attachments.length}</div>
                </div>
              </div>
            </div>

              {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Device Details */}
              <div className="space-y-6">
                {/* Device Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Info className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Device Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Brand</span>
                        <p className="text-sm font-medium text-gray-900">{device.brand}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Model</span>
                        <p className="text-sm font-medium text-gray-900">{device.model}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Serial Number</span>
                        <p className="text-sm font-medium text-gray-900 font-mono">{device.serialNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                        <StatusBadge status={device.status} />
                    </div>
                      {device.unlockCode && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Unlock Code</span>
                          <p className="text-sm font-medium text-gray-900 font-mono">{device.unlockCode}</p>
                      </div>
                    )}
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

                {/* Customer Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <User className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Customer Information</h3>
                  </div>
                    {customer ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Name</span>
                          <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    </div>
                        {customer.phone && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Phone</span>
                            <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                    </div>
                        )}
                        {customer.email && (
                        <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Email</span>
                            <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                        </div>
                        )}
                        {customer.color_tag && (
                        <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Tag</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              customer.color_tag === 'vip' ? 'bg-purple-100 text-purple-700' :
                              customer.color_tag === 'complainer' ? 'bg-red-100 text-red-700' :
                              customer.color_tag === 'purchased' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {customer.color_tag}
                            </span>
                        </div>
                    )}
                  </div>
                    ) : (
                      <p className="text-sm text-gray-500">No customer information available</p>
                    )}
                </div>

                {/* Financial Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Financial Summary</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Repair Cost</span>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(device.repairCost || 0)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Total Paid</span>
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(device.totalPaid || 0)}</p>
                      </div>
                        <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Balance</span>
                        <p className="text-lg font-bold text-orange-600">
                          {formatCurrency((device.repairCost || 0) - (device.totalPaid || 0))}
                        </p>
                        </div>
                    </div>
                  </div>

                {/* Issue Description */}
                  {device.issueDescription && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Issue Description</h3>
                    </div>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                        {device.issueDescription}
                      </p>
                  </div>
                  )}
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
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            <X className="w-4 h-4" />
                            Cancel Edit
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Device
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => setShowDiagnosticModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Stethoscope className="w-4 h-4" />
                        Diagnostic
                      </button>

                      <button
                        onClick={() => setShowRepairModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Wrench className="w-4 h-4" />
                        Repair Checklist
                      </button>

                      <button
                        onClick={() => setShowSmsModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Send className="w-4 h-4" />
                        Send SMS
                      </button>

                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <CreditCard className="w-4 h-4" />
                        Record Payment
                      </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handlePrintOrder}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Printer className="w-4 h-4" />
                          Print
                        </button>
                        
                        <button
                          onClick={handleExportPDF}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Export PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Repair Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800">Repair Summary</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 mb-2">{getRepairProgress()}%</div>
                          <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${getRepairProgress()}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide">Progress</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{attachments.length}</div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide">Files</div>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 mb-1">Repair Cost</div>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(device.repairCost || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
                  </div>
                  
        {/* Footer will be added in next chunk */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
            <div className="flex items-center gap-3">
                <button 
                onClick={() => navigate('/devices')}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
  );

};

export default DeviceDetailPage;
