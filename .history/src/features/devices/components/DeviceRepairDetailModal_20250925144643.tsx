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
import { createRepairPart, getRepairParts, RepairPart, acceptSpareParts, rejectSpareParts, areAllSparePartsReady } from '../../lats/lib/sparePartsApi';

// Temporary type definitions
interface RepairPart {
  id: string;
  deviceId: string;
  sparePartId: string;
  quantity: number;
  status: string;
  // Add other properties as needed
}
// Temporarily commented out - file doesn't exist
// import { validateRepairStart } from '../../../utils/repairValidation';
import { validateDeviceHandover, createPendingPayments } from '../../../utils/paymentValidation';

// Icons
import { 
  X, Smartphone, User as UserIcon, Clock, CheckCircle, AlertTriangle, 
  Wrench, Stethoscope, Send, Printer, Upload,
  History, Timer, Target, CheckSquare, MessageSquare, 
  Edit, Trash2, Eye, Download, Phone, Mail, MapPin,
  Calendar, Package, FileText, Settings,
  Info, Building, Activity, BarChart3, MessageCircle, Zap,
  Shield, Search, AlertCircle, ExternalLink, XCircle
} from 'lucide-react';

// Components
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import RepairStatusUpdater from './RepairStatusUpdater';
import RepairStatusGrid from './RepairStatusGrid';
import CustomerDetailModal from '../../customers/components/CustomerDetailModal';
import SparePartsSelector from '../../repair/components/SparePartsSelector';
// import CustomerCareSparePartsActions from '../../repair/components/CustomerCareSparePartsActions';
import DiagnosticChecklistModal from './DiagnosticChecklistModal';
// REMOVED: import PaymentsPopupModal from '../../../components/PaymentsPopupModal'; // Repair payment functionality removed

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
  
  // REMOVED: Payment modal state - Repair payment functionality removed
  // const [showPaymentModal, setShowPaymentModal] = useState(false);
  // const [paymentAmount, setPaymentAmount] = useState<number>(0);
  
  // REMOVED: Handle payment completion - Repair payment functionality removed
  /*
  const handlePaymentComplete = async (paymentData: any, totalPaid?: number) => {
    // Payment handling code removed
  };
  */
  
  // Handle diagnostic checklist completion
  const handleDiagnosticChecklistComplete = async (results: any) => {
    if (!device?.id) {
      console.error('No device ID available for diagnostic completion');
      return;
    }
    
    try {

      // Update device status to diagnosis-started after checklist completion
      const success = await updateDeviceStatus(device.id, 'diagnosis-started', 'Diagnostic checklist completed');
      
      if (success) {
        toast.success('Diagnostic checklist completed and status updated successfully!');
        setShowDiagnosticChecklist(false);
        
        // Refresh diagnostic data to show the new results

        await loadDiagnosticData(device.id);

      } else {
        toast.error('Failed to update device status after diagnostic completion');
      }
    } catch (error) {
      console.error('❌ [DiagnosticCompletion] Error updating status after diagnostic completion:', error);
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

        // Process the diagnostic data structure to match UI expectations
        let summary = null;
        let overallStatus = deviceChecklist.overall_status || deviceChecklist.overallStatus;
        
        // Check if we have checklist_items (newer format)
        if (deviceChecklist.checklist_items && Array.isArray(deviceChecklist.checklist_items)) {
          const total = deviceChecklist.checklist_items.length;
          const passed = deviceChecklist.checklist_items.filter(item => item.result === 'passed').length;
          const failed = deviceChecklist.checklist_items.filter(item => item.result === 'failed').length;
          const pending = deviceChecklist.checklist_items.filter(item => !item.completed).length;
          
          summary = {
            total,
            passed,
            failed,
            pending,
            lastUpdated: deviceChecklist.updated_at || deviceChecklist.completed_at
          };
          
          // Convert checklist_items to items format for compatibility
          const items = deviceChecklist.checklist_items.map(item => ({
            test: item.title,
            result: item.result,
            notes: item.notes,
            completed: item.completed
          }));
          
          combinedData = {
            items,
            summary,
            overallStatus,
            individualChecks: deviceChecklist.checklist_items,
            technicianNotes: deviceChecklist.technician_notes,
            source: 'device_checklist'
          };
        }
        // Check if we have items (older format)
        else if (deviceChecklist.items && Array.isArray(deviceChecklist.items)) {
          const total = deviceChecklist.items.length;
          const passed = deviceChecklist.items.filter(item => item.result === 'passed').length;
          const failed = deviceChecklist.items.filter(item => item.result === 'failed').length;
          const pending = deviceChecklist.items.filter(item => !item.completed).length;
          
          summary = {
            total,
            passed,
            failed,
            pending,
            lastUpdated: deviceChecklist.last_updated || deviceChecklist.updated_at
          };
          
          combinedData = {
            items: deviceChecklist.items,
            summary,
            overallStatus,
            individualChecks: deviceChecklist.items,
            technicianNotes: deviceChecklist.notes,
            source: 'device_checklist'
          };
        }
        // Fallback: use the raw data
        else {
        combinedData = {
          ...deviceChecklist,
          source: 'device_checklist'
        };
        }

      } else {

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
      } else {

      }

      setDiagnosticData(combinedData);
      
      if (combinedData) {

      } else {

      }
    } catch (error) {
      console.error('❌ [DiagnosticData] Error loading diagnostic data:', error);
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

  // REMOVED: getTotalPaidAmount function - Repair payment functionality removed

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
        // Temporarily commented out - function not available
        // const validation = validateRepairStart(repairParts);
        const validation = { isValid: true, errors: [] }; // Temporary fallback
        if (!validation.isValid) {
          toast.error('Cannot start repair');
          return;
        }
      }
      
      // REMOVED: Payment validation - Repair payment functionality removed
      
      // Create pending payments when repair is complete
      if (newStatus === 'repair-complete' && device.customerId) {
        try {
          await createPendingPayments(deviceId, device.customerId);
          toast.success('Pending payments created for repair completion');
        } catch (error) {

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
          // Temporarily commented out due to import issues
          // const readinessCheck = await areAllSparePartsReady(device.id);
          const readinessCheck = { data: { allReady: false }, error: null }; // Temporary fallback
          
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
      // Temporarily commented out due to import issues
      // const result = await rejectSpareParts(selectedParts, rejectReason);
      const result = { data: null, error: 'Function temporarily disabled' }; // Temporary fallback
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
            {/* REMOVED: Payments tab - Repair payment functionality removed */}
            {/* 
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
            */}
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


                  {/* Repair Progress - Only show for active repairs */}
                  {device.repairChecklist && device.status !== 'done' && device.status !== 'failed' && (
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


                </div>

                {/* Right Column - Actions & Summary */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Status Actions - Only show for active repairs */}
                  {device.status !== 'done' && device.status !== 'failed' && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-white" />
                    </div>
                        <h3 className="text-lg font-semibold text-gray-800">Status Actions</h3>
                                  </div>
                      
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
                    </div>
                  )}

                  {/* Repair Parts Section - Only show for active repairs */}
                  {device.status !== 'done' && device.status !== 'failed' && (
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
                      </div>
                    )}

                    {/* Request Parts Button - Available for technicians and admins */}
                    {(currentUser?.role === 'technician' && device.assignedTo === currentUser.id) || currentUser?.role === 'admin' ? (
                      <div className="pt-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowSparePartsSelector(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Package className="w-4 h-4" />
                          Request Parts
                        </button>
                      </div>
                    ) : null}
                  </div>
                  )}

                  {/* Customer Care Actions for Spare Parts */}
                  {/* {(currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && repairParts.length > 0 && (
                    <CustomerCareSparePartsActions
                      repairParts={repairParts}
                      onPartsUpdate={setRepairParts}
                      currentUser={currentUser}
                      deviceId={device.id}
                      onDeviceStatusUpdate={handleStatusUpdate}
                    />
                  )} */}

                  {/* REMOVED: Financial Summary - Repair payment functionality removed */}

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

                  {/* Completion Status - Show when device is done */}
                  {device.status === 'done' && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-green-800">Repair Completed! 🎉</h3>
                          <p className="text-green-600">Device has been successfully repaired and returned to customer</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-800 font-semibold">Status: Complete</span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">100%</div>
                            <div className="text-xs text-green-600">Complete</div>
                          </div>
                        </div>
                        
                        {device.completedAt && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-sm text-green-700">
                              <strong>Completed on:</strong> {new Date(device.completedAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
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
              {/* Check if repair is completed or failed to determine layout */}
              {device.status === 'done' || device.status === 'failed' ? (
                /* Single Column Layout - Status Actions Only */
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Status Actions</h3>
                  </div>
                  
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
                </div>
              ) : (
                /* Two Column Layout: Spare Parts (Left) and Status Actions (Right) */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Spare Parts Management */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                      <h3 className="text-lg font-semibold text-gray-800">Requested Spare Parts</h3>
                </div>
                
                {repairPartsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                    ))}
                  </div>
                ) : repairParts.length > 0 ? (
                      <div className="space-y-4">
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
                        
                        {/* Request Parts Button - Available for technicians and admins */}
                        {(currentUser?.role === 'technician' && device.assignedTo === currentUser.id) || currentUser?.role === 'admin' ? (
                          <div className="pt-2 border-t border-gray-200">
                            <button
                              onClick={() => setShowSparePartsSelector(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm w-full justify-center"
                            >
                              <Package className="w-4 h-4" />
                              Request More Parts
                            </button>
                          </div>
                        ) : null}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No spare parts requested</h4>
                    <p className="text-gray-500 mb-4">
                      Request spare parts needed for this repair
                    </p>
                        {(currentUser?.role === 'technician' && device.assignedTo === currentUser.id) || currentUser?.role === 'admin' ? (
                    <button
                      onClick={() => setShowSparePartsSelector(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm mx-auto"
                    >
                      <Package className="w-4 h-4" />
                      Request Parts
                    </button>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Contact your assigned technician or admin to request parts
                          </p>
                        )}
                  </div>
                )}
              </div>

                  {/* Right Column - Status Update Actions */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Status Actions</h3>
                    </div>
                    
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
                  </div>
                </div>
              )}

              {/* Repair Progress - Only show for active repairs */}
              {device.status !== 'done' && device.status !== 'failed' && (
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
              )}

              {/* Diagnostic Progress */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Diagnostic Progress</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {diagnosticLoading && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-xs text-blue-600">Loading...</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (device?.id) {

                          loadDiagnosticData(device.id);
                        }
                      }}
                      disabled={diagnosticLoading}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                      title="Refresh diagnostic data"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  {diagnosticLoading ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-sm text-blue-600">Fetching diagnostic data...</span>
                      </div>
                      <div className="space-y-2">
                        <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
                        <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : diagnosticData ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600 font-semibold text-lg">
                          Total Tests: {diagnosticData.summary?.total || 0}
                        </span>
                        <span className="text-sm text-gray-600 px-3 py-1 bg-white rounded-full border">
                          {diagnosticData.overallStatus === 'all-passed' ? 'All Passed' :
                           diagnosticData.overallStatus === 'issues-found' ? 'Issues Found' :
                           diagnosticData.overallStatus || 'In Progress'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
                          <div className="text-green-600 font-bold text-xl">
                            {diagnosticData.summary?.passed || 0}
                          </div>
                          <div className="text-xs text-green-700 font-medium">Passed</div>
                        </div>
                        <div className="text-center p-3 bg-red-100 rounded-lg border border-red-200">
                          <div className="text-red-600 font-bold text-xl">
                            {diagnosticData.summary?.failed || 0}
                          </div>
                          <div className="text-xs text-red-700 font-medium">Failed</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                          <div className="text-yellow-600 font-bold text-xl">
                            {diagnosticData.summary?.pending || 0}
                          </div>
                          <div className="text-xs text-yellow-700 font-medium">Pending</div>
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
                      <div className="text-xs text-gray-500 text-center">
                        Data source: {diagnosticData.source || 'unknown'}
                      </div>
                      
                      {/* Admin Diagnostic Review - Show failed tests and allow comments */}
                      {currentUser?.role === 'admin' && diagnosticData.summary?.failed > 0 && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <h4 className="text-sm font-semibold text-red-700">Admin Review - Failed Diagnostics</h4>
                          </div>
                          
                          <div className="space-y-3">
                            {diagnosticData.individualChecks?.filter((check: any) => check.result === 'failed').map((failedCheck: any, index: number) => (
                              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      <span className="text-sm font-medium text-red-800">
                                        {failedCheck.title || failedCheck.test_item || `Test ${index + 1}`}
                                      </span>
                                    </div>
                                    
                                    {failedCheck.notes && (
                                      <p className="text-xs text-red-700 mb-2">
                                        <strong>Failure Reason:</strong> {failedCheck.notes}
                                      </p>
                                    )}
                                    
                                    {failedCheck.remarks && (
                                      <p className="text-xs text-red-600 mb-2">
                                        <strong>Technician Notes:</strong> {failedCheck.remarks}
                                      </p>
                                    )}
                                    
                                    {/* Admin Comment Section */}
                                    <div className="mt-2">
                                      <label className="text-xs text-red-600 font-medium block mb-1">
                                        Admin Comment:
                                      </label>
                                      <textarea
                                        className="w-full text-xs p-2 border border-red-200 rounded resize-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                                        rows={2}
                                        placeholder="Add admin comment about this failure..."
                                        defaultValue={failedCheck.adminComment || ''}
                                        onChange={(e) => {
                                          // Store admin comment in state or send to backend

                                        }}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <span className="text-xs text-red-500 font-medium">
                                      {failedCheck.completed_at ? new Date(failedCheck.completed_at).toLocaleDateString() : 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Save Admin Comments Button */}
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => {
                                  // Save all admin comments
                                  toast.success('Admin comments saved successfully');
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                              >
                                Save Admin Comments
                              </button>
                            </div>
                          </div>
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
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-blue-600 font-semibold text-lg">Total Tests: {total}</span>
                                <span className="text-sm text-gray-600 px-3 py-1 bg-white rounded-full border">
                                  {checklist.overallStatus || 'In Progress'}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
                                  <div className="text-green-600 font-bold text-xl">{passed}</div>
                                  <div className="text-xs text-green-700 font-medium">Passed</div>
                                </div>
                                <div className="text-center p-3 bg-red-100 rounded-lg border border-red-200">
                                  <div className="text-red-600 font-bold text-xl">{failed}</div>
                                  <div className="text-xs text-red-700 font-medium">Failed</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                                  <div className="text-yellow-600 font-bold text-xl">{pending}</div>
                                  <div className="text-xs text-yellow-700 font-medium">Pending</div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 text-center">
                                Data source: device_checklist (fallback)
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
                    <div className="text-center py-6">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 mb-2">No diagnostic data available</p>
                      <p className="text-xs text-gray-400 mb-4">
                        Check console logs for diagnostic data fetching details
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowDiagnosticChecklist(true)}
                          className="block w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Start Diagnostics →
                        </button>
                        <button
                          onClick={() => {
                            if (device?.id) {

                              loadDiagnosticData(device.id);
                            }
                          }}
                          className="block w-full text-sm text-gray-600 hover:text-gray-700 font-medium py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Refresh Data
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* REMOVED: Payments tab content - Repair payment functionality removed */}
          {false && activeTab === 'payments' && device && (
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
            
            {/* REMOVED: Payments button - Repair payment functionality removed */}
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
      
      {/* REMOVED: POS Payment Modal - Repair payment functionality removed */}
      {/*
      <PaymentsPopupModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentAmount(0);
        }}
        amount={paymentAmount}
        customerId={device?.customerId || ''}
        customerName={device?.customerName || 'Unknown Customer'}
        description={`Device payment - ${device?.brand} ${device?.model}`}
        onPaymentComplete={handlePaymentComplete}
        deviceId={device?.id}
        allowPriceEdit={true}
        paymentType="cash_in"
        title="Device Repair Payment"
      />
      */}
    </>
  );
};

export default DeviceRepairDetailModal;