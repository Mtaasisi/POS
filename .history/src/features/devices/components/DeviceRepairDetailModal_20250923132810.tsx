import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Device, DeviceStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../lib/customerApi';
import { supabase } from '../../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { createRepairPart, getRepairParts, RepairPart, acceptSpareParts, rejectSpareParts, areAllSparePartsReady } from '../../repair/services/repairPartsApi';
import { validateRepairStart } from '../../../utils/repairValidation';
import { validateDeviceHandover, createPendingPayments } from '../../../utils/paymentValidation';

// Icons
import { 
  X, Smartphone, User as UserIcon, Clock, CheckCircle, AlertTriangle, 
  Wrench, Stethoscope, Send, Printer, Upload,
  History, Timer, Target, CheckSquare, MessageSquare, 
  Edit, Trash2, Eye, Download, Phone, Mail, MapPin,
  Calendar, Package, FileText, Settings,
  Info, Building, Activity, BarChart3, MessageCircle, Zap,
  Shield, Search, AlertCircle, ExternalLink, XCircle, CreditCard, DollarSign
} from 'lucide-react';

// Components
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import RepairStatusUpdater from './RepairStatusUpdater';
import RepairStatusGrid from './RepairStatusGrid';
import CustomerDetailModal from '../../customers/components/CustomerDetailModal';
import SparePartsSelector from '../../repair/components/SparePartsSelector';
import CustomerCareSparePartsActions from '../../repair/components/CustomerCareSparePartsActions';
import DiagnosticChecklistModal from './DiagnosticChecklistModal';
import PaymentsPopupModal from '../../../components/PaymentsPopupModal';

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
  
  // Device data updates are handled automatically by the context
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  
  // Component state
  const [countdown, setCountdown] = useState<string>('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Spare parts state
  const [repairParts, setRepairParts] = useState<RepairPart[]>([]);
  const [repairPartsLoading, setRepairPartsLoading] = useState(false);
  const [showSparePartsSelector, setShowSparePartsSelector] = useState(false);
  
  // Spare parts actions state
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [partsActionLoading, setPartsActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // Financial information state
  const [financialInfo, setFinancialInfo] = useState<{
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
  } | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  
  // Device costs state - extracted from device object
  const [deviceCosts, setDeviceCosts] = useState<{
    repairCost: number;
    depositAmount: number;
  } | null>(null);
  
  // Diagnostic checklist state
  const [showDiagnosticChecklist, setShowDiagnosticChecklist] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  
  // Handle payment completion
  const handlePaymentComplete = async (paymentData: any, totalPaid?: number) => {
    try {
      // Record the payment in customer_payments table
      const { error } = await supabase
        .from('customer_payments')
        .insert({
          customer_id: device?.customerId,
          device_id: device?.id,
          amount: totalPaid || paymentData.amount,
          method: paymentData.method || 'cash',
          payment_type: 'payment',
          status: 'completed',
          payment_date: new Date().toISOString(),
          notes: `Device repair payment - ${device?.brand} ${device?.model}`,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast.success(`Payment of ${formatCurrency(totalPaid || paymentData.amount)} recorded successfully`);
      
      // Refresh financial info
      await loadFinancialInfo();
      
      // Check if all payments are now complete
      const validation = await validateDeviceHandover(device?.id || '');
      if (validation.valid) {
        toast.success('All payments completed! Device ready for handover.');
      }
      
      setShowPaymentModal(false);
      
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };
  
  // Handle diagnostic checklist completion
  const handleDiagnosticChecklistComplete = async (results: any) => {
    try {
      // Update device status to diagnosis-started after checklist completion
      const success = await updateDeviceStatus(deviceId, 'diagnosis-started', 'Diagnostic checklist completed');
      
      if (success) {
        toast.success('Diagnostic checklist completed and status updated successfully!');
        setShowDiagnosticChecklist(false);
        // Refresh diagnostic data to show the new results
        await loadDiagnosticData(deviceId);
      } else {
        toast.error('Failed to update device status after diagnostic completion');
      }
    } catch (error) {
      console.error('Error updating status after diagnostic completion:', error);
      toast.error('Failed to update device status after diagnostic completion');
    }
  };

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

  // Update device costs when device changes
  useEffect(() => {
    if (device) {
      setDeviceCosts({
        repairCost: Number(device.repairCost) || 0,
        depositAmount: Number(device.depositAmount) || 0
      });
    } else {
      setDeviceCosts(null);
    }
  }, [device]);

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
      loadRepairParts(device.id);
      loadDiagnosticData(device.id);
      loadFinancialInfo(device.id);
    }
  }, [device, isOpen]);


  const loadUserNames = async () => {
    try {
      // Load user names from auth_users table
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, name, username, email')
        .not('id', 'is', null);
      
      if (error) {
        console.error('Error loading user names:', error);
        return;
      }
      
      if (data) {
        const nameMap: { [key: string]: string } = {};
        data.forEach(user => {
          nameMap[user.id] = user.name || user.username || user.email || 'Unknown User';
        });
        setUserNames(nameMap);
      }
    } catch (error) {
      console.error('Error loading user names:', error);
    }
  };

  const loadFinancialInfo = async (deviceId: string) => {
    try {
      const { data: payments, error } = await supabase
        .from('customer_payments')
        .select('amount, status')
        .eq('device_id', deviceId);

      if (error) {
        console.error('Error loading financial info:', error);
        return;
      }

      const financialData = {
        totalPaid: 0,
        totalPending: 0,
        totalFailed: 0
      };

      if (payments) {
        payments.forEach(payment => {
          const amount = Number(payment.amount) || 0;
          switch (payment.status) {
            case 'completed':
              financialData.totalPaid += amount;
              break;
            case 'pending':
              financialData.totalPending += amount;
              break;
            case 'failed':
              financialData.totalFailed += amount;
              break;
          }
        });
      }

      setFinancialInfo(financialData);
    } catch (error) {
      console.error('Error loading financial info:', error);
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

  const loadDiagnosticData = async (deviceId: string) => {
    setDiagnosticLoading(true);
    try {
      // Load diagnostic data from both sources
      const [deviceDiagnostic, diagnosticChecks] = await Promise.all([
        // Get diagnostic checklist from devices table
        supabase
          .from('devices')
          .select('diagnostic_checklist')
          .eq('id', deviceId)
          .single(),
        
        // Get individual diagnostic checks from diagnostic_checks table
        supabase
          .from('diagnostic_checks')
          .select('*')
          .eq('diagnostic_device_id', deviceId)
          .order('created_at', { ascending: false })
      ]);

      let combinedData = null;

      // Process device diagnostic checklist (JSONB field)
      if (deviceDiagnostic.data?.diagnostic_checklist) {
        const deviceChecklist = typeof deviceDiagnostic.data.diagnostic_checklist === 'string' 
          ? JSON.parse(deviceDiagnostic.data.diagnostic_checklist) 
          : deviceDiagnostic.data.diagnostic_checklist;
        
        combinedData = {
          ...deviceChecklist,
          source: 'device_checklist'
        };
      }

      // Process individual diagnostic checks
      if (diagnosticChecks.data && diagnosticChecks.data.length > 0) {
        const checks = diagnosticChecks.data;
        const total = checks.length;
        const passed = checks.filter(check => check.result === 'passed').length;
        const failed = checks.filter(check => check.result === 'failed').length;
        const pending = 0; // All checks in the table are completed

        const summary = {
          total,
          passed,
          failed,
          pending,
          lastUpdated: checks[0]?.created_at
        };

        // If we have device checklist data, merge it, otherwise create new data
        if (combinedData) {
          combinedData = {
            ...combinedData,
            individualChecks: checks,
            summary: {
              ...combinedData.summary,
              ...summary
            }
          };
        } else {
          combinedData = {
            items: checks.map(check => ({
              test: check.test_item,
              result: check.result,
              notes: check.remarks,
              completed: true
            })),
            summary,
            overallStatus: failed > 0 ? 'issues-found' : 'all-passed',
            individualChecks: checks,
            source: 'diagnostic_checks'
          };
        }
      }

      setDiagnosticData(combinedData);
    } catch (error) {
      console.error('Error loading diagnostic data:', error);
      setDiagnosticData(null);
    } finally {
      setDiagnosticLoading(false);
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

  // Track diagnostic checklist modal state changes
  useEffect(() => {
    // Modal state tracking for debugging if needed
  }, [showDiagnosticChecklist, device?.id, device?.status]);

  // Event handlers
  const handleStatusUpdate = async (deviceId: string, newStatus: DeviceStatus, notes?: string) => {
    if (!device || device.id !== deviceId) {
      console.error('[DeviceRepairDetailModal] Invalid device or device ID mismatch');
      toast.error('Invalid device for status update');
      return;
    }
    
    try {
      // Status update in progress
      
      // Validate status transition
      if (device.status === newStatus) {
        toast.info(`Device is already in "${newStatus}" status`);
        return;
      }
      
      // Special handling for starting diagnostics
      if (newStatus === 'diagnosis-started') {
        setShowDiagnosticChecklist(true);
        return; // Don't update status yet, wait for checklist completion
      }
      
      // Validate repair start transitions
      if (newStatus === 'in-repair') {
        const validation = validateRepairStart(repairParts);
        if (!validation.valid) {
          toast.error(validation.message || 'Cannot start repair');
          return;
        }
      }
      
      // Validate payment completion for customer handover transitions
      if (newStatus === 'returned-to-customer-care' || newStatus === 'done') {
        const paymentValidation = await validateDeviceHandover(deviceId);
        if (!paymentValidation.valid) {
          toast.error(paymentValidation.message || 'Cannot handover device to customer');
          return;
        }
      }
      
      // Create pending payments when repair is complete
      if (newStatus === 'repair-complete' && device.customerId) {
        try {
          await createPendingPayments(deviceId, device.customerId);
          toast.success('Pending payments created for repair completion');
        } catch (error) {
          console.warn('Failed to create pending payments:', error);
          toast.warn('Failed to create pending payments - please check payment setup');
          // Don't block the status update for this
        }
      }
      
      // Use context method for optimistic updates
      const success = await updateDeviceStatus(deviceId, newStatus, notes || '');
      
      if (success) {
        toast.success(`Status updated to "${newStatus}" successfully`);
        
        // Refresh related data after successful status update
        if (newStatus === 'repair-complete' || newStatus === 'process-payments') {
          // Refresh financial data when repair is complete
          await loadFinancialInfo(deviceId);
          await loadPendingPayments(deviceId);
        }
        
        // Refresh repair parts if status involves parts
        if (newStatus === 'awaiting-parts' || newStatus === 'parts-arrived' || newStatus === 'in-repair') {
          await loadRepairParts(deviceId);
        }
      } else {
        toast.error(`Failed to update status to "${newStatus}". Please try again.`);
      }
      
    } catch (error) {
      console.error('[DeviceRepairDetailModal] Error updating status:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        toast.error(`Status update failed: ${error.message}`);
      } else {
        toast.error('Failed to update status. Please check your connection and try again.');
      }
    }
  };

  const handlePrintReceipt = () => {
    if (!device) return;
    
    // Generate receipt data
    const receiptData = {
      device: `${device.brand} ${device.model}`,
      serialNumber: device.serialNumber,
      customer: customer?.name || 'Unknown Customer',
      repairCost: deviceCosts?.repairCost || 0,
      depositAmount: deviceCosts?.depositAmount || 0,
      totalPaid: financialInfo?.totalPaid || 0,
      status: device.status,
      date: new Date().toLocaleDateString()
    };
    
    // Create printable receipt
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Repair Receipt - ${receiptData.device}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .section { margin: 15px 0; }
              .row { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { font-weight: bold; border-top: 1px solid #333; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Device Repair Receipt</h2>
              <p>LATS CHANCE Repair Center</p>
            </div>
            <div class="section">
              <div class="row"><span>Device:</span><span>${receiptData.device}</span></div>
              <div class="row"><span>Serial:</span><span>${receiptData.serialNumber}</span></div>
              <div class="row"><span>Customer:</span><span>${receiptData.customer}</span></div>
              <div class="row"><span>Date:</span><span>${receiptData.date}</span></div>
              <div class="row"><span>Status:</span><span>${receiptData.status}</span></div>
            </div>
            <div class="section">
              <div class="row"><span>Repair Cost:</span><span>${formatCurrency(receiptData.repairCost)}</span></div>
              <div class="row"><span>Deposit:</span><span>${formatCurrency(receiptData.depositAmount)}</span></div>
              <div class="row total"><span>Total Paid:</span><span>${formatCurrency(receiptData.totalPaid)}</span></div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      toast.success('Receipt generated successfully');
    } else {
      toast.error('Unable to open print window. Please check your browser settings.');
    }
  };

  const handleSendSMS = async () => {
    if (!device || !customer) return;
    
    try {
      // Create SMS message based on device status
      let message = '';
      const deviceName = `${device.brand} ${device.model}`;
      const customerName = customer.name || 'Valued Customer';
      
      switch (device.status) {
        case 'diagnosis-started':
          message = `Hello ${customerName}, your ${deviceName} (Serial: ${device.serialNumber}) is now being diagnosed. We'll update you soon. - LATS CHANCE`;
          break;
        case 'awaiting-parts':
          message = `Hello ${customerName}, we're waiting for parts for your ${deviceName}. We'll notify you when they arrive. - LATS CHANCE`;
          break;
        case 'in-repair':
          message = `Hello ${customerName}, your ${deviceName} is currently being repaired. We'll update you on progress. - LATS CHANCE`;
          break;
        case 'repair-complete':
          message = `Hello ${customerName}, your ${deviceName} repair is complete! Please visit us to collect your device. - LATS CHANCE`;
          break;
        case 'done':
          message = `Hello ${customerName}, thank you for choosing LATS CHANCE! Your ${deviceName} is ready for collection. - LATS CHANCE`;
          break;
        default:
          message = `Hello ${customerName}, this is an update about your ${deviceName} repair. Current status: ${device.status}. - LATS CHANCE`;
      }
      
      // Store SMS in database for tracking
      const { error } = await supabase
        .from('customer_communications')
        .insert({
          customer_id: customer.id,
          device_id: device.id,
          type: 'sms',
          message: message,
          status: 'sent',
          sent_by: currentUser?.id,
          sent_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error saving SMS record:', error);
        toast.error('Failed to save SMS record');
        return;
      }
      
      // In a real implementation, you would integrate with an SMS service like Twilio
      // For now, we'll simulate the SMS sending
      toast.success(`SMS sent to ${customer.phone || 'customer'}: "${message.substring(0, 50)}..."`);
      
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send SMS');
    }
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

  // Handle spare parts actions for customer care
  const handleSelectPart = (partId: string) => {
    setSelectedParts(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  const handleSelectAllParts = () => {
    const actionableParts = repairParts.filter(part => 
      part.status === 'needed' || part.status === 'ordered'
    );
    
    if (selectedParts.length === actionableParts.length) {
      setSelectedParts([]);
    } else {
      setSelectedParts(actionableParts.map(part => part.id));
    }
  };

  const handleAcceptParts = async () => {
    if (selectedParts.length === 0) {
      toast.error('Please select parts to accept');
      return;
    }

    setPartsActionLoading(true);
    try {
      const result = await acceptSpareParts(selectedParts);
      if (result.ok && result.data) {
        // Update the parts in the local state
        const updatedParts = repairParts.map(part => {
          if (selectedParts.includes(part.id)) {
            return { ...part, status: 'accepted' as const };
          }
          return part;
        });
        setRepairParts(updatedParts);
        
        toast.success(result.message);
        setSelectedParts([]);
        
        // Auto-update device status if all parts are now accepted/received
        if (device && device.id) {
          const readinessCheck = await areAllSparePartsReady(device.id);
          
          if (readinessCheck.ready) {
            // Update device status to parts-arrived if it's currently awaiting-parts
            await handleStatusUpdate(device.id, 'parts-arrived');
            toast.success(`All parts accepted! Device status updated to "Parts Arrived" (${readinessCheck.message})`);
          } else {
            toast.success(`Parts accepted! ${readinessCheck.message}`);
          }
        }
      } else {
        toast.error(result.message || 'Failed to accept parts');
      }
    } catch (error) {
      console.error('Error accepting parts:', error);
      toast.error('Failed to accept parts');
    } finally {
      setPartsActionLoading(false);
    }
  };

  const handleRejectParts = async () => {
    if (selectedParts.length === 0) {
      toast.error('Please select parts to reject');
      return;
    }

    setPartsActionLoading(true);
    try {
      const result = await rejectSpareParts(selectedParts, rejectReason);
      if (result.ok && result.data) {
        // Update the parts in the local state
        const updatedParts = repairParts.map(part => {
          if (selectedParts.includes(part.id)) {
            return { 
              ...part, 
              status: 'needed' as const,
              notes: rejectReason ? `Rejected by customer care: ${rejectReason}` : part.notes
            };
          }
          return part;
        });
        setRepairParts(updatedParts);
        
        toast.success(result.message);
        setSelectedParts([]);
        setShowRejectModal(false);
        setRejectReason('');
      } else {
        toast.error(result.message || 'Failed to reject parts');
      }
    } catch (error) {
      console.error('Error rejecting parts:', error);
      toast.error('Failed to reject parts');
    } finally {
      setPartsActionLoading(false);
    }
  };

  if (!isOpen) return null;

  if (!device) {
    return createPortal(
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ zIndex: 99999 }}>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium text-gray-700">Loading device details...</span>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (!device) {
    return createPortal(
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ zIndex: 99999 }}>
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
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col my-2 sm:my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
              <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {device.brand} {device.model}
                </h2>
                {device.model && device.model.includes('(') && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {device.model.match(/\(([^)]+)\)/)?.[1] || ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-500 truncate">
                  Serial: {device.serialNumber}
                </p>
                <div className="flex-shrink-0">
                  <StatusBadge status={device.status} />
                </div>
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex w-full">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('overview');
              }}
              className={`flex-1 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Info</span>
              </div>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('repair');
              }}
              className={`flex-1 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'repair'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Wrench className="w-4 h-4" />
                <span>Repair</span>
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
                className={`flex-1 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="hidden sm:inline">Payments</span>
                  <span className="sm:hidden">Pay</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="p-3 sm:p-4">
            {activeTab === 'overview' && (
              <>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                {/* Left Column - Device Details */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Basic Device Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Device Information</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Device Name</span>
                        <p className="text-sm font-medium text-gray-900 truncate">{device.model || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Serial Number</span>
                        <p className="text-sm font-medium text-gray-900 font-mono truncate">{device.serialNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                        <div className="mt-1">
                          <StatusBadge status={device.status} />
                        </div>
                      </div>
                      {device.assignedTo && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Assigned To</span>
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                              <UserIcon className="w-3 h-3" />
                              <span className="truncate">{getUserName(device.assignedTo)}</span>
                            </span>
                          </div>
                        </div>
                      )}
                      {device.estimatedHours && (
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Estimated Hours</span>
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200">
                              <Timer className="w-3 h-3" />
                              {device.estimatedHours}h
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Issue & Problem Description */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Issue & Problem</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Issue Description</span>
                        <div className="bg-red-50 p-2 rounded-lg border border-red-100 max-h-24 overflow-y-auto">
                          <p className="text-sm font-medium text-gray-900 break-words">
                            {device.issueDescription || 'No issue description provided'}
                          </p>
                        </div>
                      </div>
                      {device.diagnosisRequired && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Diagnosis Required</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Yes - Diagnosis Required</span>
                            <span className="sm:hidden">Diagnosis Required</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Dates & Timeline */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Dates & Timeline</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
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

                  {/* Diagnostic Progress */}
                  {(diagnosticData || device.diagnosticChecklist) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Search className="w-5 h-5 text-blue-600" />
                          <h3 className="text-sm font-semibold text-gray-800">Diagnostic Progress</h3>
                        </div>
                        {diagnosticLoading && (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        )}
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        {diagnosticLoading ? (
                          <div className="space-y-2">
                            <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
                            <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2"></div>
                          </div>
                        ) : diagnosticData ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-blue-600 font-semibold">
                                Total Tests: {diagnosticData.summary?.total || 0}
                              </span>
                              <span className="text-sm text-gray-600">
                                {diagnosticData.overallStatus === 'all-passed' ? 'All Passed' :
                                 diagnosticData.overallStatus === 'issues-found' ? 'Issues Found' :
                                 diagnosticData.overallStatus || 'In Progress'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-2 bg-green-100 rounded">
                                <div className="text-green-600 font-bold text-lg">
                                  {diagnosticData.summary?.passed || 0}
                                </div>
                                <div className="text-xs text-green-700">Passed</div>
                              </div>
                              <div className="text-center p-2 bg-red-100 rounded">
                                <div className="text-red-600 font-bold text-lg">
                                  {diagnosticData.summary?.failed || 0}
                                </div>
                                <div className="text-xs text-red-700">Failed</div>
                              </div>
                              <div className="text-center p-2 bg-yellow-100 rounded">
                                <div className="text-yellow-600 font-bold text-lg">
                                  {diagnosticData.summary?.pending || 0}
                                </div>
                                <div className="text-xs text-yellow-700">Pending</div>
                              </div>
                            </div>
                            {diagnosticData.summary?.lastUpdated && (
                              <div className="text-xs text-gray-500 text-center pt-2 border-t border-blue-200">
                                Last updated: {new Date(diagnosticData.summary.lastUpdated).toLocaleDateString()}
                              </div>
                            )}
                            {diagnosticData.individualChecks && diagnosticData.individualChecks.length > 0 && (
                              <div className="text-xs text-blue-600 text-center">
                                {diagnosticData.individualChecks.length} individual checks recorded
                              </div>
                            )}
                          </div>
                        ) : device.diagnosticChecklist ? (
                          // Fallback to device diagnostic checklist if no real data
                          (() => {
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
                          })()
                        ) : (
                          <div className="text-center py-4">
                            <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No diagnostic data available</p>
                            <button
                              onClick={() => setShowDiagnosticChecklist(true)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                            >
                              Start Diagnostics →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column - Actions & Summary */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Actions */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Actions</h3>
                    </div>
                    
                    {/* Primary Actions */}
                    <div className="space-y-1.5">
                      {/* Action Buttons - Mirror Repair Tab Logic */}
                      {device && (
                        <div className="relative space-y-3">
                          <div className="space-y-2">
                            {/* Start Diagnosis Button */}
                            {device.status === 'assigned' && (
                              <button 
                                type="button" 
                                onClick={() => setShowDiagnosticChecklist(true)}
                                className="
                                  flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
                                  bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20
                                  py-3 px-6 text-lg font-medium
                                  hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
                                  w-full justify-start bg-yellow-600 hover:bg-yellow-700 text-white py-4 
                                "
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                                <span className="ml-2">Start Diagnosis</span>
                              </button>
                            )}

                            {/* Awaiting Parts Button */}
                            {device.status === 'diagnosis-started' && repairParts.some(part => part.status === 'needed' || part.status === 'ordered') && (
                              <button 
                                type="button" 
                                onClick={async () => {
                                  try {
                                    await handleStatusUpdate(device.id, 'awaiting-parts');
                                  } catch (error) {
                                    console.error('Error updating to awaiting-parts:', error);
                                  }
                                }}
                                className="
                                  flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
                                  bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20
                                  py-3 px-6 text-lg font-medium
                                  hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
                                  w-full justify-start bg-orange-600 hover:bg-orange-700 text-white py-4 
                                "
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M16.5 9.4 7.55 4.24"></path>
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                  <polyline points="3.29 7 12 12 20.71 7"></polyline>
                                  <line x1="12" x2="12" y1="22" y2="12"></line>
                                </svg>
                                <span className="ml-2">Awaiting Parts</span>
                              </button>
                            )}

                            {/* Start Repair Button */}
                            {(device.status === 'parts-arrived' || 
                              (device.status === 'diagnosis-started' && repairParts.length === 0) ||
                              (device.status === 'diagnosis-started' && repairParts.every(part => part.status === 'received' || part.status === 'used'))) && (
                              <button 
                                type="button" 
                                onClick={async () => {
                                  try {
                                    await handleStatusUpdate(device.id, 'in-repair');
                                  } catch (error) {
                                    console.error('Error updating to in-repair:', error);
                                  }
                                }}
                                className="
                                  flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
                                  bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20
                                  py-3 px-6 text-lg font-medium
                                  hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
                                  w-full justify-start bg-purple-600 hover:bg-purple-700 text-white py-4 
                                "
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                </svg>
                                <span className="ml-2">Start Repair</span>
                              </button>
                            )}

                            {/* Parts Arrived Button */}
                            {device.status === 'awaiting-parts' && repairParts.every(part => part.status === 'received' || part.status === 'used') && (
                              <button 
                                type="button" 
                                onClick={async () => {
                                  try {
                                    await handleStatusUpdate(device.id, 'parts-arrived');
                                  } catch (error) {
                                    console.error('Error updating to parts-arrived:', error);
                                  }
                                }}
                                className="
                                  flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
                                  bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20
                                  py-3 px-6 text-lg font-medium
                                  hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
                                  w-full justify-start bg-green-600 hover:bg-green-700 text-white py-4 
                                "
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M16.5 9.4 7.55 4.24"></path>
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                  <polyline points="3.29 7 12 12 20.71 7"></polyline>
                                  <line x1="12" x2="12" y1="22" y2="12"></line>
                                </svg>
                                <span className="ml-2">Parts Arrived</span>
                              </button>
                            )}

                            {/* Start Testing Button */}
                            {device.status === 'in-repair' && (
                              <button 
                                type="button" 
                                onClick={async () => {
                                  try {
                                    await handleStatusUpdate(device.id, 'reassembled-testing');
                                  } catch (error) {
                                    console.error('Error updating to reassembled-testing:', error);
                                  }
                                }}
                                className="
                                  flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
                                  bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20
                                  py-3 px-6 text-lg font-medium
                                  hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
                                  w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white py-4 
                                "
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M9 12l2 2 4-4"></path>
                                  <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z"></path>
                                </svg>
                                <span className="ml-2">Start Testing</span>
                              </button>
                            )}

                            {/* Complete Repair Button */}
                            {device.status === 'reassembled-testing' && (
                              <button 
                                type="button" 
                                onClick={async () => {
                                  try {
                                    await handleStatusUpdate(device.id, 'repair-complete');
                                  } catch (error) {
                                    console.error('Error updating to repair-complete:', error);
                                  }
                                }}
                                className="
                                  flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
                                  bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20
                                  py-3 px-6 text-lg font-medium
                                  hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
                                  w-full justify-start bg-green-600 hover:bg-green-700 text-white py-4 
                                "
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M9 12l2 2 4-4"></path>
                                  <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z"></path>
                                </svg>
                                <span className="ml-2">Complete Repair</span>
                              </button>
                            )}

                            {/* Payment Warning for Return Actions */}
                            {device.status === 'repair-complete' && financialInfo && financialInfo.totalPending > 0 && (
                              <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white">
                                      <path d="M12 9v4"></path>
                                      <path d="M12 17h.01"></path>
                                      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"></path>
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-yellow-800 mb-1">Payment Required</h4>
                                    <p className="text-sm text-yellow-700 mb-2">
                                      Cannot return device to customer. {formatCurrency(financialInfo.totalPending)} in pending payments must be completed first.
                                    </p>
                                    <div className="text-xs text-yellow-600">
                                      Complete all pending payments before proceeding with device handover.
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Return to Customer Care Button */}
                            {device.status === 'repair-complete' && (
                              <button 
                                type="button" 
                                onClick={async () => {
                                  try {
                                    await handleStatusUpdate(device.id, 'returned-to-customer-care');
                                  } catch (error) {
                                    console.error('Error updating to returned-to-customer-care:', error);
                                  }
                                }}
                                disabled={financialInfo && financialInfo.totalPending > 0}
                                className={`
                                  flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
                                  py-3 px-6 text-lg font-medium
                                  hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
                                  w-full justify-start py-4
                                  ${financialInfo && financialInfo.totalPending > 0 
                                    ? 'bg-gray-400 hover:bg-gray-400 text-gray-200 cursor-not-allowed opacity-60' 
                                    : 'bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20 bg-teal-600 hover:bg-teal-700'
                                  }
                                `}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="9" cy="7" r="4"></circle>
                                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <span className="ml-2">Return to Customer Care</span>
                              </button>
                            )}

                            {/* Payment Warning for Mark as Done */}
                            {device.status === 'returned-to-customer-care' && financialInfo && financialInfo.totalPending > 0 && (
                              <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white">
                                      <path d="M12 9v4"></path>
                                      <path d="M12 17h.01"></path>
                                      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"></path>
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-yellow-800 mb-1">Payment Required</h4>
                                    <p className="text-sm text-yellow-700 mb-2">
                                      Cannot mark device as done. {formatCurrency(financialInfo.totalPending)} in pending payments must be completed first.
                                    </p>
                                    <div className="text-xs text-yellow-600">
                                      Complete all pending payments before finalizing device handover.
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Mark as Done Button */}
                            {device.status === 'returned-to-customer-care' && (
                              <button 
                                type="button" 
                                onClick={async () => {
                                  try {
                                    await handleStatusUpdate(device.id, 'done');
                                  } catch (error) {
                                    console.error('Error updating to done:', error);
                                  }
                                }}
                                disabled={financialInfo && financialInfo.totalPending > 0}
                                className={`
                                  flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
                                  py-3 px-6 text-lg font-medium
                                  hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
                                  w-full justify-start py-4
                                  ${financialInfo && financialInfo.totalPending > 0 
                                    ? 'bg-gray-400 hover:bg-gray-400 text-gray-200 cursor-not-allowed opacity-60' 
                                    : 'bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20 bg-green-600 hover:bg-green-700'
                                  }
                                `}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M9 12l2 2 4-4"></path>
                                  <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z"></path>
                                </svg>
                                <span className="ml-2">Mark as Done</span>
                              </button>
                            )}
                          </div>
                          
                          {/* Request Spare Parts Button - Always available for relevant statuses */}
                          {['diagnosis-started', 'awaiting-parts', 'parts-arrived', 'in-repair'].includes(device.status) && (
                            <button 
                              type="button" 
                              onClick={() => setShowSparePartsSelector(true)}
                              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 sm:w-4 sm:h-4">
                                <path d="M16.5 9.4 7.55 4.24"></path>
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.29 7 12 12 20.71 7"></polyline>
                                <line x1="12" x2="12" y1="22" y2="12"></line>
                              </svg>
                              <span className="hidden sm:inline">Request Spare Parts</span>
                              <span className="sm:hidden">Parts</span>
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Fallback to RepairStatusUpdater for statuses not covered above */}
                      {device && !['assigned', 'diagnosis-started', 'awaiting-parts', 'parts-arrived', 'in-repair', 'reassembled-testing', 'repair-complete', 'returned-to-customer-care'].includes(device.status) && (
                        <RepairStatusUpdater
                          key={`status-updater-${device.id}`}
                          device={device}
                          currentUser={currentUser}
                          onStatusUpdate={handleStatusUpdate}
                          onClose={() => {}}
                          compact={true}
                          financialInfo={financialInfo}
                          deviceCosts={deviceCosts}
                          repairParts={repairParts}
                          repairPartsLoading={repairPartsLoading}
                        />
                      )}

                      
                      {/* Process Payments Button - Show when repair is complete but payments not done */}
                      {device.status === 'repair-complete' && financialInfo && deviceCosts && (
                        (() => {
                          const totalRepairCost = deviceCosts.repairCost || 0;
                          const totalPaid = financialInfo.totalPaid || 0;
                          const totalPending = financialInfo.totalPending || 0;
                          const needsPayment = totalPending > 0 || (totalRepairCost > 0 && totalPaid < totalRepairCost);
                          
                          if (needsPayment && (currentUser?.role === 'admin' || currentUser?.role === 'customer-care')) {
                            return (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    // Calculate the amount due
                                    const totalCost = deviceCosts.repairCost || 0;
                                    const totalPaid = financialInfo.totalPaid || 0;
                                    const amountDue = totalCost - totalPaid;
                                    
                                    if (amountDue > 0) {
                                      setPaymentAmount(amountDue);
                                      setShowPaymentModal(true);
                                    } else {
                                      // No payment needed, move to process-payments status
                                      await handleStatusUpdate(device.id, 'process-payments');
                                      setActiveTab('payments');
                                    }
                                  } catch (error) {
                                    console.error('Error processing payments:', error);
                                  }
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

                      {/* Record Payment Button - Show when in process-payments status */}
                      {device.status === 'process-payments' && financialInfo && deviceCosts && (
                        (() => {
                          const totalCost = deviceCosts.repairCost || 0;
                          const totalPaid = financialInfo.totalPaid || 0;
                          const amountDue = totalCost - totalPaid;
                          
                          if (amountDue > 0 && (currentUser?.role === 'admin' || currentUser?.role === 'customer-care')) {
                            return (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setPaymentAmount(amountDue);
                                  setShowPaymentModal(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                              >
                                <DollarSign className="w-4 h-4" />
                                Record Payment ({formatCurrency(amountDue)})
                              </button>
                            );
                          }
                          return null;
                        })()
                      )}

                      {currentUser?.role === 'customer-care' && customer && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSendSMS();
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm"
                        >
                          <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Send SMS</span>
                          <span className="sm:hidden">SMS</span>
                        </button>
                      )}
                      
                      {(isAssignedTechnician || currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
                        <>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowSparePartsSelector(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm"
                        >
                          <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Request Spare Parts</span>
                          <span className="sm:hidden">Parts</span>
                        </button>
                        </>
                      )}
                    </div>

                  </div>


                  {/* Repair Parts Section */}
                  <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
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
                        {/* Customer Care Actions - Show for customer care and admin users */}
                        {(currentUser?.role === 'customer-care' || currentUser?.role === 'admin') && (() => {
                          const actionableParts = repairParts.filter(part => 
                            part.status === 'needed' || part.status === 'ordered'
                          );
                          
                          if (actionableParts.length > 0) {
                            return (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedParts.length === actionableParts.length && actionableParts.length > 0}
                                      onChange={handleSelectAllParts}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-blue-800">
                                      Select All ({actionableParts.length} actionable)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={handleAcceptParts}
                                      disabled={selectedParts.length === 0 || partsActionLoading}
                                      className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      Accept ({selectedParts.length})
                                    </button>
                                    <button
                                      onClick={() => setShowRejectModal(true)}
                                      disabled={selectedParts.length === 0 || partsActionLoading}
                                      className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      Decline ({selectedParts.length})
                                    </button>
                                  </div>
                                </div>
                                {partsActionLoading && (
                                  <div className="text-center">
                                    <div className="inline-flex items-center gap-2 text-sm text-blue-600">
                                      <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                                      Processing...
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {repairParts.slice(0, 3).map((part) => (
                          <div key={part.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              {/* Checkbox for customer care users */}
                              {(currentUser?.role === 'customer-care' || currentUser?.role === 'admin') && 
                               (part.status === 'needed' || part.status === 'ordered') && (
                                <input
                                  type="checkbox"
                                  checked={selectedParts.includes(part.id)}
                                  onChange={() => handleSelectPart(part.id)}
                                  className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                  {part.spare_part?.name || 'Unknown Part'}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  Qty: {part.quantity_needed} • {formatCurrency(part.cost_per_unit)} each
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`inline-flex items-center px-1 sm:px-2 py-1 rounded-full text-xs font-medium ${
                                part.status === 'needed' ? 'bg-yellow-100 text-yellow-800' :
                                part.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                                part.status === 'accepted' ? 'bg-purple-100 text-purple-800' :
                                part.status === 'received' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                <span className="hidden sm:inline">{part.status}</span>
                                <span className="sm:hidden">{part.status.charAt(0).toUpperCase()}</span>
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


                  {/* Customer Care Actions for Spare Parts */}
                  {(currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && repairParts.length > 0 && (
                    <CustomerCareSparePartsActions
                      repairParts={repairParts}
                      onPartsUpdate={setRepairParts}
                      currentUser={currentUser}
                      deviceId={device.id}
                      onDeviceStatusUpdate={handleStatusUpdate}
                    />
                  )}

                  {/* Financial Summary - Hide from technicians */}
                  {(currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
                    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Financial Summary</h3>
                      {financialLoading && <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>}
                    </div>
                    
                    {financialLoading ? (
                      <div className="space-y-3">
                        <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
                        <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Dynamic Financial Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Amount Due */}
                          <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-sm sm:text-lg font-bold text-green-600">
                              {formatCurrency(deviceCosts?.repairCost || 0)}
                            </div>
                            <div className="text-xs text-green-700 uppercase tracking-wide">
                              Repair Cost
                            </div>
                          </div>

                          {/* Deposited Amount */}
                          <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm sm:text-lg font-bold text-blue-600">
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
                  // Parts updated successfully
                }}
              />


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
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Repair Cost - Single source of truth */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600 mb-1">Repair Cost</div>
                      <div className="text-xl font-bold text-blue-700">
                        {formatCurrency(deviceCosts?.repairCost || deviceCosts?.repairPrice || Number(device.repairCost) || 0)}
                      </div>
                    </div>
                    
                    {/* Deposit Amount */}
                    {deviceCosts && deviceCosts.depositAmount > 0 && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm text-green-600 mb-1">Deposit</div>
                        <div className="text-xl font-bold text-green-700">
                          {formatCurrency(deviceCosts.depositAmount)}
                        </div>
                      </div>
                    )}
                    
                    {/* Total Paid */}
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="text-sm text-emerald-600 mb-1">Total Paid</div>
                      <div className="text-xl font-bold text-emerald-700">
                        {formatCurrency(financialInfo?.totalPaid || 0)}
                      </div>
                    </div>
                    
                    {/* Balance Due */}
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-sm text-orange-600 mb-1">Balance Due</div>
                      <div className="text-xl font-bold text-orange-700">
                        {formatCurrency((deviceCosts?.repairCost || deviceCosts?.repairPrice || Number(device.repairCost) || 0) - (financialInfo?.totalPaid || 0))}
                      </div>
                    </div>
                    
                    {/* Payment Status Summary */}
                    {financialInfo && (financialInfo.totalPending > 0 || financialInfo.totalFailed > 0) && (
                      <>
                        {financialInfo.totalPending > 0 && (
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <div className="text-sm text-yellow-600 mb-1">Pending</div>
                            <div className="text-xl font-bold text-yellow-700">
                              {formatCurrency(financialInfo.totalPending)}
                            </div>
                          </div>
                        )}
                        {financialInfo.totalFailed > 0 && (
                          <div className="bg-red-50 rounded-lg p-4">
                            <div className="text-sm text-red-600 mb-1">Failed</div>
                            <div className="text-xl font-bold text-red-700">
                              {formatCurrency(financialInfo.totalFailed)}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>



            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSendSMS();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-xs"
            >
              <Send className="w-3 h-3" />
              SMS
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('payments');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-xs"
            >
              <CreditCard className="w-3 h-3" />
              Payments
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-xs font-medium"
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-xs"
              >
                <Printer className="w-3 h-3" />
                Print
              </button>
            )}
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('repair');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-xs"
            >
              <Wrench className="w-3 h-3" />
              Repair
            </button>
          </div>
        </div>
      </div>


      {/* Customer Detail Modal */}
      {customer && (
        <CustomerDetailModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          customer={customer}
          onEdit={(updatedCustomer) => {
            // Handle customer edit if needed
            // Customer updated successfully
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

      {/* Diagnostic Checklist Modal */}
      {device && (
        <DiagnosticChecklistModal
          isOpen={showDiagnosticChecklist}
          onClose={() => {
            setShowDiagnosticChecklist(false);
          }}
          deviceId={device.id}
          deviceModel={device.model}
          issueDescription={device.issueDescription}
          onChecklistComplete={handleDiagnosticChecklistComplete}
        />
      )}

      {/* Reject Parts Modal */}
      {showRejectModal && createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ zIndex: 100000 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reject Spare Parts</h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-sm text-yellow-800">
                    <strong>{selectedParts.length} parts</strong> will be rejected and returned to "needed" status.
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (Optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectParts}
                    disabled={partsActionLoading}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {partsActionLoading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    Reject Parts
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Quick Action Bar - Mobile Only */}
      <div className="xl:hidden bg-white border-t border-gray-200 p-2 sm:p-3">
        <div className="flex gap-1.5">
          {(isAssignedTechnician || currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
            <>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSparePartsSelector(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-xs"
              >
                <Package className="w-3 h-3" />
                Parts
              </button>
            </>
          )}
          
          {currentUser?.role === 'customer-care' && customer && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSendSMS();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-xs"
            >
              <Send className="w-3 h-3" />
              SMS
            </button>
          )}
        </div>
      </div>

      </div>
    </div>,
    document.body
  );

  return (
    <>
      {modalContent}
      
      {/* POS Payment Modal */}
      <PaymentsPopupModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentAmount(0);
        }}
        amount={paymentAmount}
        customerId={device?.customerId || ''}
        customerName={device?.customerName || 'Unknown Customer'}
        description={`Device repair payment - ${device?.brand} ${device?.model}`}
        onPaymentComplete={handlePaymentComplete}
        deviceId={device?.id}
        allowPriceEdit={true}
        paymentType="cash_in"
        title="Device Repair Payment"
      />
    </>
  );
};

export default DeviceRepairDetailModal;