import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { usePayments } from '../../../context/PaymentsContext';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  Smartphone, Edit, Save, X, AlertCircle, 
  FileText, Clock, CheckSquare, XSquare, Send,
  DollarSign, Calendar, Printer, Download, ArrowLeft, ArrowRight,
  User, Phone, Mail, MapPin, Star, 
  TrendingUp, BarChart3, Target, Calculator, Banknote, Receipt,
  Copy, Share2, Archive, History, Store, Info, Plus, Minus,
  RotateCcw, Shield, Percent, Layers, QrCode, Eye, MessageSquare,
  FileImage, Upload, CheckCircle2, AlertTriangle, ThumbsUp,
  ThumbsDown, ExternalLink, Zap, Users, CreditCard, Calendar as CalendarIcon,
  Hash, Tag, Scale, Hand, Fingerprint, Radio, XCircle, HardDrive,
  Cpu, Palette, Ruler, Unplug, Battery, Monitor, Camera,
  Activity, Wrench, Stethoscope, Package, Award as AwardIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DeviceStatus } from '../../../types';
import { formatCurrency } from '../../../lib/customerApi';
import { formatRelativeTime } from '../../../lib/utils';
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

        {/* Content will be added in next chunk */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Content placeholder */}
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

  // Helper functions
  function getStatusColor(status: string) {
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
  }
};

export default DeviceDetailPage;
