import React, { useState, useEffect } from 'react';
import { Device, DeviceStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../lib/customerApi';
import { repairPaymentService, RepairPayment } from '../../../lib/repairPaymentService';
import { supabase } from '../../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { createRepairPart, getRepairParts, RepairPart } from '../../repair/services/repairPartsApi';

// Icons
import { 
  X, Smartphone, User as UserIcon, Clock, CheckCircle, AlertTriangle, 
  Wrench, Stethoscope, CreditCard, Send, Printer, Upload,
  History, Timer, Target, CheckSquare, MessageSquare, 
  Edit, Trash2, Eye, Download, Phone, Mail, MapPin,
  Calendar, DollarSign, Package, FileText, Settings,
  Info, Building, Activity, BarChart3, MessageCircle, Zap,
  Shield, Search, AlertCircle, ExternalLink
} from 'lucide-react';

// Components
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import RepairChecklist from './RepairChecklist';
import RepairPaymentButton from './RepairPaymentButton';
import RepairStatusUpdater from './RepairStatusUpdater';
import RepairStatusGrid from './RepairStatusGrid';
import CustomerDetailModal from '../../customers/components/CustomerDetailModal';
import SparePartsSelector from '../../repair/components/SparePartsSelector';

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
  const { devices, getDeviceById, updateDeviceStatus } = useDevices();
  const { customers } = useCustomers();
  const navigate = useNavigate();

  // Get device from context (real-time updates)
  const device = devices.find(d => d.id === deviceId) || null;
  
  // Debug logging for device data
  useEffect(() => {
    if (device) {
      console.log('[DeviceRepairDetailModal] Device data updated:', {
        id: device.id,
        status: device.status,
        updatedAt: device.updatedAt,
        timestamp: new Date().toISOString()
      });
    }
  }, [device?.status, device?.updatedAt]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  
  // Component state
  const [showRepairChecklist, setShowRepairChecklist] = useState(false);
  const [repairPayments, setRepairPayments] = useState<RepairPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  
  // Financial information state
  const [financialInfo, setFinancialInfo] = useState<any>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [deviceCosts, setDeviceCosts] = useState<any>(null);
  const [costsLoading, setCostsLoading] = useState(false);
  
  // Pending payments state
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [pendingPaymentsLoading, setPendingPaymentsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPendingPayment, setSelectedPendingPayment] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Spare parts state
  const [repairParts, setRepairParts] = useState<RepairPart[]>([]);
  const [repairPartsLoading, setRepairPartsLoading] = useState(false);
  const [showSparePartsSelector, setShowSparePartsSelector] = useState(false);

  // Device data is now loaded from context automatically

  // Fetch user names when device data is loaded
  useEffect(() => {
    if (device) {
      const userIds: string[] = [];
      
      // Collect all user IDs that need names
      if (device.assignedTo) userIds.push(device.assignedTo);
      if (device.transitions) {
        device.transitions.forEach(transition => {
          if (transition.performedBy && !userIds.includes(transition.performedBy)) {
            userIds.push(transition.performedBy);
          }
        });
      }
      
      // Fetch names for users we don't have yet
      const missingUserIds = userIds.filter(id => !userNames[id] && id !== 'system');
      if (missingUserIds.length > 0) {
        fetchUserNames(missingUserIds);
      }
    }
  }, [device, userNames]);

  // Countdown timer for expected return date
  useEffect(() => {
    if (!device?.expectedReturnDate) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const expectedDate = new Date(device.expectedReturnDate);
      const diffMs = expectedDate.getTime() - now.getTime();

      // Add 24-hour grace period before showing "Overdue"
      const gracePeriodMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (diffMs <= -gracePeriodMs) {
        setCountdown('Overdue');
        return;
      }

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffDays > 0) {
        setCountdown(`${diffDays}d ${diffHours}h ${diffMinutes}m`);
      } else if (diffHours > 0) {
        setCountdown(`${diffHours}h ${diffMinutes}m`);
      } else if (diffMinutes > 0) {
        setCountdown(`${diffMinutes}m`);
      } else {
        // Within the same day but not yet 24 hours overdue
        const overdueHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
        const overdueMinutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));
        
        if (overdueHours > 0) {
          setCountdown(`${overdueHours}h ${overdueMinutes}m overdue`);
        } else {
          setCountdown(`${overdueMinutes}m overdue`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [device?.expectedReturnDate]);

  // Load additional data when device changes
  useEffect(() => {
    if (device && isOpen) {
      loadUserNames();
      loadRepairPayments(device.id);
      loadFinancialInfo(device.id);
      loadDeviceCosts(device.id);
      loadPendingPayments(device.id);
      loadRepairParts(device.id);
    }
  }, [device, isOpen]);

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

  const loadFinancialInfo = async (deviceId: string) => {
    // Only load financial information for admin and customer-care
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'customer-care') {
      setFinancialInfo({
        totalPaid: 0,
        totalPending: 0,
        totalFailed: 0,
        paymentCount: 0,
        lastPayment: null,
        payments: []
      });
      setFinancialLoading(false);
      return;
    }

    setFinancialLoading(true);
    try {
      // Fetch comprehensive financial information
      const { data, error } = await supabase
        .from('customer_payments')
        .select(`
          *,
          customers(name),
          devices(brand, model)
        `)
        .eq('device_id', deviceId)
        .order('payment_date', { ascending: false });

      if (!error && data) {
        const totalPaid = data
          .filter(payment => payment.status === 'completed')
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        const totalPending = data
          .filter(payment => payment.status === 'pending')
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);

        const totalFailed = data
          .filter(payment => payment.status === 'failed')
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);

        setFinancialInfo({
          totalPaid,
          totalPending,
          totalFailed,
          paymentCount: data.length,
          lastPayment: data[0] || null,
          payments: data
        });
      } else if (error) {
        console.warn('Error loading financial info:', error);
        // Set default values if there's an error
        setFinancialInfo({
          totalPaid: 0,
          totalPending: 0,
          totalFailed: 0,
          paymentCount: 0,
          lastPayment: null,
          payments: []
        });
      }
    } catch (error) {
      console.error('Error loading financial info:', error);
      // Set default values if there's an error
      setFinancialInfo({
        totalPaid: 0,
        totalPending: 0,
        totalFailed: 0,
        paymentCount: 0,
        lastPayment: null,
        payments: []
      });
    } finally {
      setFinancialLoading(false);
    }
  };

  const loadDeviceCosts = async (deviceId: string) => {
    // Only load device costs for admin and customer-care
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'customer-care') {
      setDeviceCosts({
        repairCost: 0,
        depositAmount: 0
      });
      setCostsLoading(false);
      return;
    }

    setCostsLoading(true);
    try {
      // Fetch device cost breakdown including form fields
      const { data, error } = await supabase
        .from('devices')
        .select(`
          repair_price,
          repair_cost,
          deposit_amount,
          estimated_hours,
          warranty_start,
          warranty_end,
          warranty_status,
          repair_count
        `)
        .eq('id', deviceId)
        .single();

      if (!error && data) {
        setDeviceCosts({
          repairPrice: data.repair_price || 0,
          repairCost: data.repair_cost || 0,
          depositAmount: data.deposit_amount || 0,
          estimatedHours: data.estimated_hours || 0,
          warrantyStart: data.warranty_start,
          warrantyEnd: data.warranty_end,
          warrantyStatus: data.warranty_status,
          repairCount: data.repair_count || 0,
          hourlyRate: data.estimated_hours > 0 ? (data.repair_price || 0) / data.estimated_hours : 0
        });
      }
    } catch (error) {
      console.error('Error loading device costs:', error);
    } finally {
      setCostsLoading(false);
    }
  };

  const loadPendingPayments = async (deviceId: string) => {
    setPendingPaymentsLoading(true);
    try {
      // First, check if we need to create pending payments from form data
      await createPendingPaymentsFromForm(deviceId);
      
      // Then fetch all pending payments
      const { data, error } = await supabase
        .from('customer_payments')
        .select(`
          *,
          customers(name),
          devices(brand, model)
        `)
        .eq('device_id', deviceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPendingPayments(data);
      } else if (error) {
        console.warn('Error loading pending payments:', error);
        // Set empty array if there's an error
        setPendingPayments([]);
      }
    } catch (error) {
      console.error('Error loading pending payments:', error);
      // Set empty array if there's an error
      setPendingPayments([]);
    } finally {
      setPendingPaymentsLoading(false);
    }
  };

  const loadRepairParts = async (deviceId: string) => {
    setRepairPartsLoading(true);
    try {
      const response = await getRepairParts(deviceId);
      if (response.ok && response.data) {
        setRepairParts(response.data);
      } else {
        console.warn('Error loading repair parts:', response.message);
        setRepairParts([]);
      }
    } catch (error) {
      console.error('Error loading repair parts:', error);
      setRepairParts([]);
    } finally {
      setRepairPartsLoading(false);
    }
  };

  const createPendingPaymentsFromForm = async (deviceId: string) => {
    try {
      // Get device data to check for repair_cost and deposit_amount
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('repair_cost, deposit_amount, customer_id, brand, model')
        .eq('id', deviceId)
        .single();

      if (deviceError || !deviceData) return;

      // Check if pending payments already exist for this device
      const { data: existingPayments, error: existingError } = await supabase
        .from('customer_payments')
        .select('id, payment_type')
        .eq('device_id', deviceId)
        .eq('status', 'pending');

      if (existingError) {
        console.warn('Error checking existing payments:', existingError);
        // If the query fails, assume no existing payments and continue
        const paymentsToCreate = [];
        
        // Create pending payment for repair cost if it exists
        if (deviceData.repair_cost && deviceData.repair_cost > 0) {
          paymentsToCreate.push({
            customer_id: deviceData.customer_id,
            device_id: deviceId,
            amount: deviceData.repair_cost,
            method: 'cash',
            payment_type: 'payment',
            status: 'pending',
            payment_date: new Date().toISOString()
          });
        }

        // Create pending payment for deposit amount if it exists
        if (deviceData.deposit_amount && deviceData.deposit_amount > 0) {
          paymentsToCreate.push({
            customer_id: deviceData.customer_id,
            device_id: deviceId,
            amount: deviceData.deposit_amount,
            method: 'cash',
            payment_type: 'deposit',
            status: 'pending',
            payment_date: new Date().toISOString()
          });
        }

        // Insert pending payments if any were created
        if (paymentsToCreate.length > 0) {
          const { error: insertError } = await supabase
            .from('customer_payments')
            .insert(paymentsToCreate);

          if (insertError) {
            console.error('Error creating pending payments:', insertError);
          } else {
            console.log(`Created ${paymentsToCreate.length} pending payments for device ${deviceId}`);
          }
        }
        return;
      }

      const paymentsToCreate = [];

      // Create pending payment for repair cost if it exists and no pending payment exists
      if (deviceData.repair_cost && deviceData.repair_cost > 0) {
        const hasRepairCostPayment = existingPayments?.some(p => p.payment_type === 'payment');
        if (!hasRepairCostPayment) {
          paymentsToCreate.push({
            customer_id: deviceData.customer_id,
            device_id: deviceId,
            amount: deviceData.repair_cost,
            method: 'cash', // Default method, can be changed later
            payment_type: 'payment',
            status: 'pending',
            payment_date: new Date().toISOString()
          });
        }
      }

      // Create pending payment for deposit amount if it exists and no pending payment exists
      if (deviceData.deposit_amount && deviceData.deposit_amount > 0) {
        const hasDepositPayment = existingPayments?.some(p => p.payment_type === 'deposit');
        if (!hasDepositPayment) {
          paymentsToCreate.push({
            customer_id: deviceData.customer_id,
            device_id: deviceId,
            amount: deviceData.deposit_amount,
            method: 'cash', // Default method, can be changed later
            payment_type: 'deposit',
            status: 'pending',
            payment_date: new Date().toISOString()
          });
        }
      }

      // Insert pending payments if any were created
      if (paymentsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('customer_payments')
          .insert(paymentsToCreate);

        if (insertError) {
          console.error('Error creating pending payments:', insertError);
        } else {
          console.log(`Created ${paymentsToCreate.length} pending payments for device ${deviceId}`);
        }
      }
    } catch (error) {
      console.error('Error creating pending payments from form:', error);
    }
  };

  // Fetch user names from database
  const fetchUserNames = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, name, username')
        .in('id', userIds);
      
      if (error) {
        console.error('Error fetching user names:', error);
        return;
      }
      
      if (data) {
        const nameMap: { [key: string]: string } = {};
        data.forEach(user => {
          nameMap[user.id] = user.name || user.username || 'Unknown User';
        });
        setUserNames(prev => ({ ...prev, ...nameMap }));
      }
    } catch (error) {
      console.error('Error fetching user names:', error);
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
      // Called from RepairStatusGrid or RepairStatusUpdater: (deviceId, status, notes)
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
      console.log('[DeviceRepairDetailModal] Updating status:', { deviceId, status, signature });
      
      // Use context method for optimistic updates
      const success = await updateDeviceStatus(deviceId, status, signature);
      
      if (success) {
        toast.success('Status updated successfully');
      } else {
        toast.error('Failed to update status');
      }
      
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePrintReceipt = () => {
    toast.success('Print receipt functionality coming soon');
  };

  // Handle spare parts selection
  const handleSparePartsSelected = async (selectedParts: any[]) => {
    if (!device) return;
    
    try {
      // Create repair parts one by one since the API expects single parts
      const results = await Promise.all(
        selectedParts.map(async (part) => {
          const repairPartData = {
            device_id: device.id,
            spare_part_id: part.spare_part_id,
            quantity_needed: part.quantity,
            cost_per_unit: part.cost_per_unit,
            notes: part.notes || `Requested for ${device.brand} ${device.model} repair`
          };

          return await createRepairPart(repairPartData);
        })
      );
      
      const successful = results.filter(result => result.ok);
      const failed = results.filter(result => !result.ok);
      
      if (successful.length > 0) {
        toast.success(`Successfully requested ${successful.length} spare parts`);
        await loadRepairParts(device.id); // Refresh repair parts list
      }
      
      if (failed.length > 0) {
        toast.error(`Failed to request ${failed.length} spare parts`);
      }
    } catch (error) {
      console.error('Error requesting spare parts:', error);
      toast.error('Failed to request spare parts');
    }
  };

  if (!isOpen) return null;

  if (!device) {
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
        onClick={(e) => {
          e.preventDefault();
          onClose();
        }}
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
                Serial: {device.serialNumber}
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
            {/* Hide payments tab from technicians */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
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
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {activeTab === 'overview' && (
            <>
              {/* Simplified Overview */}
              <div className="mb-8">
                {/* Progress Bar Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Target className="w-5 h-5 text-orange-500" />
                      Repair Progress
                    </h3>
                    <span className="text-sm font-medium text-gray-500">
                      {getRepairProgress()}% Complete
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${getRepairProgress()}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        getRepairProgress() >= 25 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Diagnosis</p>
                        <p className="text-xs text-gray-500">Initial assessment</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        getRepairProgress() >= 50 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Parts Order</p>
                        <p className="text-xs text-gray-500">Components sourced</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        getRepairProgress() >= 75 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Repair</p>
                        <p className="text-xs text-gray-500">Work in progress</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        getRepairProgress() >= 100 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Testing</p>
                        <p className="text-xs text-gray-500">Quality assurance</p>
                      </div>
                    </div>
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
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Device Name</span>
                        <p className="text-sm font-medium text-gray-900">{device.model || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Serial Number</span>
                        <p className="text-sm font-medium text-gray-900 font-mono">{device.serialNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                        <div className="mt-1">
                          <StatusBadge status={device.status} />
                        </div>
                      </div>
                      {device.assignedTo && (
                        <div className="space-y-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Assigned To</span>
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                              <UserIcon className="w-4 h-4" />
                              {getUserName(device.assignedTo)}
                            </span>
                          </div>
                        </div>
                      )}
                      {device.estimatedHours && (
                        <div className="space-y-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Estimated Hours</span>
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                              <Timer className="w-4 h-4" />
                              {device.estimatedHours}h
                            </span>
                          </div>
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
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(device.expectedReturnDate).toLocaleDateString()}
                          </p>
                          {countdown && (
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              countdown === 'Overdue' 
                                ? 'bg-red-100 text-red-700 border border-red-200' 
                                : countdown.includes('overdue')
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                : 'bg-orange-100 text-orange-700 border border-orange-200'
                            }`}>
                              <Timer className="w-3 h-3" />
                              {countdown}
                            </div>
                          )}
                        </div>
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

                  {/* Repair Parts Section */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Requested Spare Parts</h3>
                      </div>
                      {repairParts.length > 0 && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {repairParts.length} parts
                        </span>
                      )}
                    </div>
                    
                    {repairPartsLoading ? (
                      <div className="space-y-2">
                        <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
                        <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2"></div>
                      </div>
                    ) : repairParts.length > 0 ? (
                      <div className="space-y-2">
                        {repairParts.slice(0, 3).map((part) => (
                          <div key={part.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {part.spare_part?.name || 'Unknown Part'}
                              </div>
                              <div className="text-xs text-gray-600">
                                Qty: {part.quantity_needed} • {formatCurrency(part.cost_per_unit)} each
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                part.status === 'needed' ? 'bg-yellow-100 text-yellow-800' :
                                part.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                                part.status === 'received' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {part.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {repairParts.length > 3 && (
                          <div className="text-center">
                            <button
                              onClick={() => setActiveTab('repair')}
                              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                            >
                              View all {repairParts.length} parts →
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No spare parts requested yet</p>
                        <button
                          onClick={() => setShowSparePartsSelector(true)}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1"
                        >
                          Request parts →
                        </button>
                      </div>
                    )}
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
                          key={`${device.id}-${device.status}-${device.updatedAt}`}
                          device={device}
                          currentUser={currentUser}
                          onStatusUpdate={handleStatusUpdate}
                          onClose={() => {}}
                          compact={true}
                          financialInfo={financialInfo}
                          deviceCosts={deviceCosts}
                        />
                      )}

                      
                      {/* Process Payments Button - Show when repair is complete but payments not done */}
                      {device.status === 'repair-complete' && financialInfo && deviceCosts && (
                        (() => {
                          const totalRepairCost = deviceCosts.repairCost || 0;
                          const totalPaid = financialInfo.totalPaid || 0;
                          const totalPending = financialInfo.totalPending || 0;
                          const needsPayment = totalPending > 0 || (totalRepairCost > 0 && totalPaid < totalRepairCost);
                          
                          if (needsPayment) {
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveTab('payments');
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                              >
                                <CreditCard className="w-4 h-4" />
                                Process Payments
                              </button>
                            );
                          }
                          return null;
                        })()
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

                  {/* Customer Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-green-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Customer Information</h3>
                      </div>
                      {customer && (
                        <button
                          onClick={() => setShowCustomerModal(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold border border-green-600 hover:bg-green-600 hover:border-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Profile
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Name</span>
                        <p className="text-sm font-medium text-gray-900">{customer?.name || 'N/A'}</p>
                      </div>
                      {/* Hide phone number from technicians */}
                      {(currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Phone</span>
                          <p className="text-sm font-medium text-gray-900">{customer?.phone || 'N/A'}</p>
                        </div>
                      )}
                      {device.estimatedHours && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Est. Hours</span>
                          <p className="text-sm font-medium text-gray-900">{device.estimatedHours}h</p>
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

                  {/* Financial Summary - Hide from technicians */}
                  {(currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Financial Summary</h3>
                      {financialLoading && <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>}
                    </div>
                    
                    {financialLoading ? (
                      <div className="space-y-3">
                        <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
                        <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Dynamic Financial Status */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Amount Due */}
                          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(deviceCosts?.repairCost || 0)}
                            </div>
                            <div className="text-xs text-green-700 uppercase tracking-wide">
                              Repair Cost
                            </div>
                          </div>

                          {/* Deposited Amount */}
                          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-lg font-bold text-blue-600">
                              {formatCurrency(deviceCosts?.depositAmount || 0)}
                            </div>
                            <div className="text-xs text-blue-700 uppercase tracking-wide">
                              {deviceCosts?.depositAmount > 0 ? 'Deposited' : 'No Deposit'}
                            </div>
                          </div>
                        </div>

                        {/* Payment Status Indicator - Only show if there are payments */}
                        {deviceCosts && financialInfo?.totalPaid > 0 && (
                          <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-sm font-medium text-gray-700">
                              <span className="text-green-600">
                                {formatCurrency(financialInfo.totalPaid)} Paid
                                {financialInfo.totalPending > 0 && (
                                  <span className="text-yellow-600 ml-2">
                                    • {formatCurrency(financialInfo.totalPending)} Pending
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Quick Action - View Details */}
                        <div className="border-t border-gray-100 pt-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveTab('payments');
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                          >
                            <CreditCard className="w-4 h-4" />
                            View Payment Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Additional Information - Moved to right side */}
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

              {/* Repair Parts Management */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Spare Parts Management</h3>
                  </div>
                  <button
                    onClick={() => setShowSparePartsSelector(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <Package className="w-4 h-4" />
                    Request Parts
                  </button>
                </div>
                
                {repairPartsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                    ))}
                  </div>
                ) : repairParts.length > 0 ? (
                  <div className="space-y-3">
                    {repairParts.map((part) => (
                      <div key={part.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {part.spare_part?.name || 'Unknown Part'}
                            </h4>
                            <span className="text-sm text-gray-500">
                              #{part.spare_part?.part_number || 'N/A'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>Quantity: {part.quantity_needed}</div>
                            <div>Cost: {formatCurrency(part.cost_per_unit)} each</div>
                            <div>Total: {formatCurrency(part.quantity_needed * part.cost_per_unit)}</div>
                            <div>Used: {part.quantity_used || 0}</div>
                          </div>
                          {part.notes && (
                            <div className="mt-2 text-sm text-gray-500 italic">
                              Note: {part.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            part.status === 'needed' ? 'bg-yellow-100 text-yellow-800' :
                            part.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                            part.status === 'received' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {part.status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(part.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No spare parts requested</h4>
                    <p className="text-gray-500 mb-4">
                      Request spare parts needed for this repair
                    </p>
                    <button
                      onClick={() => setShowSparePartsSelector(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm mx-auto"
                    >
                      <Package className="w-4 h-4" />
                      Request Parts
                    </button>
                  </div>
                )}
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
                {financialLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                    <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Form-Based Costs */}
                    {deviceCosts && deviceCosts.repairCost > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-blue-600 mb-1">Repair Cost (Form)</div>
                        <div className="text-xl font-bold text-blue-700">
                          {formatCurrency(deviceCosts.repairCost)}
                        </div>
                      </div>
                    )}
                    {deviceCosts && deviceCosts.depositAmount > 0 && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm text-green-600 mb-1">Deposit Amount (Form)</div>
                        <div className="text-xl font-bold text-green-700">
                          {formatCurrency(deviceCosts.depositAmount)}
                        </div>
                      </div>
                    )}
                    
                    {/* Database Costs */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Repair Price (DB)</div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(deviceCosts?.repairPrice || Number(device.repairCost) || 0)}
                      </div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="text-sm text-emerald-600 mb-1">Total Paid</div>
                      <div className="text-xl font-bold text-emerald-700">
                        {formatCurrency(financialInfo?.totalPaid || 0)}
                      </div>
                    </div>
                    {financialInfo && (
                      <>
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <div className="text-sm text-yellow-600 mb-1">Pending</div>
                          <div className="text-xl font-bold text-yellow-700">
                            {formatCurrency(financialInfo.totalPending)}
                          </div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                          <div className="text-sm text-red-600 mb-1">Failed</div>
                          <div className="text-xl font-bold text-red-700">
                            {formatCurrency(financialInfo.totalFailed)}
                          </div>
                        </div>
                      </>
                    )}
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

              {/* Pending Payments */}
              {pendingPayments.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Pending Payments</h3>
                  </div>
                  {pendingPaymentsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </span>
                                {payment.payment_type === 'payment' && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                    Repair Cost
                                  </span>
                                )}
                                {payment.payment_type === 'deposit' && (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                    Deposit
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {payment.method} • {new Date(payment.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedPendingPayment(payment);
                                setShowPaymentModal(true);
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              Pay Now
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPendingPayment(payment);
                                setShowPaymentModal(true);
                              }}
                              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              Edit Amount
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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

      {/* Payment Modal for Pending Payments */}
      {showPaymentModal && selectedPendingPayment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Process Payment</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPendingPayment(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Original Amount</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(selectedPendingPayment.amount)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">
                      Method: {selectedPendingPayment.method}
                    </span>
                    {selectedPendingPayment.payment_type === 'payment' && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        Repair Cost
                      </span>
                    )}
                    {selectedPendingPayment.payment_type === 'deposit' && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        Deposit
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={selectedPendingPayment.amount}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    defaultValue={selectedPendingPayment.method}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Transaction reference"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedPendingPayment(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      // Process payment logic here
                      toast.success('Payment processed successfully!');
                      setShowPaymentModal(false);
                      setSelectedPendingPayment(null);
                      // Refresh data
                      if (device) {
                        await loadFinancialInfo(device.id);
                        await loadPendingPayments(device.id);
                        await loadRepairPayments(device.id);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Process Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {customer && (
        <CustomerDetailModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          customer={customer}
          onEdit={(updatedCustomer) => {
            // Handle customer edit if needed
            console.log('Customer edited:', updatedCustomer);
          }}
        />
      )}

      {/* Spare Parts Selector Modal */}
      {device && (
        <SparePartsSelector
          device={device}
          isOpen={showSparePartsSelector}
          onClose={() => setShowSparePartsSelector(false)}
          onPartsSelected={handleSparePartsSelected}
        />
      )}

    </div>
  );
};

export default DeviceRepairDetailModal;