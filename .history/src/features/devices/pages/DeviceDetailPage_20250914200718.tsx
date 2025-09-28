import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNavigationHistory } from '../../../hooks/useNavigationHistory';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { usePayments } from '../../../context/PaymentsContext';
import { usePaymentMethodsContext } from '../../../context/PaymentMethodsContext';
import { QRCodeSVG } from 'qrcode.react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import CountdownTimer from '../../../features/shared/components/ui/CountdownTimer';
import StatusBadge from '../../../features/shared/components/ui/StatusBadge';
import { ChevronDown, CheckCircle, XCircle, Smartphone, Barcode, Calendar, Loader2, Image as ImageIcon, FileText, File as FileIcon, CreditCard, DollarSign, AlertTriangle, Star, Award, Activity, Gift, MessageSquare, Clock, User, Upload, Trash2, ArrowLeft, Phone, Printer, Send, RefreshCw, ArrowRight, Key, Wrench, Hash, Settings, History, QrCode, Stethoscope, Timer, Play, Pause, Square, Tool, Zap, Target, CheckSquare, X, Edit, Save, AlertCircle, Info, Building, Package, BarChart3, Eye, Share2, Archive, Plus, Minus, RotateCcw, Shield, Percent, Layers, Download } from 'lucide-react';

import DeviceDetailHeader from '../components/DeviceDetailHeader';
import StatusUpdateForm from '../components/forms/StatusUpdateForm';

import AssignTechnicianForm from '../components/forms/AssignTechnicianForm';
import DeviceBarcodeCard from '../components/DeviceBarcodeCard';
import DiagnosticChecklist from '../../../features/diagnostics/components/DiagnosticChecklist';
import RepairChecklist from '../components/RepairChecklist';
import PrintableSlip from '../components/PrintableSlip';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { DeviceStatus, Payment } from '../../../types';
import { smsService, logManualSMS } from '../../../services/smsService';
import Modal from '../../../features/shared/components/ui/Modal';
import { uploadAttachment, listAttachments, deleteAttachment } from '../../../lib/attachmentsApi';
import { logAuditAction } from '../../../lib/auditLogApi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { formatCurrency } from '../../../lib/customerApi';
import { validateMobileMoneyReference, requiresReferenceNumber, getReferencePlaceholder, getReferenceHelpText } from '../../../utils/mobileMoneyValidation';
import { formatRelativeTime } from '../../../lib/utils';
import { auditService } from '../../../lib/auditService';
import PaymentsPopupModal from '../../../components/PaymentsPopupModal';

const DeviceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  // All hooks must be called unconditionally before any early returns
  const { getDeviceById, updateDeviceStatus, addRemark, addRating, devices, loading: devicesLoading } = useDevices();
  const { getCustomerById } = useCustomers();
  const { payments, refreshPayments } = usePayments();
  const { paymentMethods, loading: paymentMethodsLoading } = usePaymentMethodsContext();
  const navigate = useNavigate();
  const { handleBackClick } = useNavigationHistory();

  const printRef = useRef<HTMLDivElement>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<string | null>(null);
  // Attachments state (real, from backend)
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDiagnosticChecklist, setShowDiagnosticChecklist] = useState(false);
  const [showRepairChecklist, setShowRepairChecklist] = useState(false);
  // Technician work timer state
  const [workTimer, setWorkTimer] = useState<{
    isRunning: boolean;
    startTime: string | null;
    elapsedTime: number;
    sessions: Array<{ start: string; end?: string; duration?: number }>;
  }>({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    sessions: []
  });
  // Loading state (mock, since data is synchronous in context, but for demo)
  const [loading, setLoading] = useState(true);
  
  // Preserve scroll position to prevent auto-scrolling
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [selectedAttachmentsForDelete, setSelectedAttachmentsForDelete] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  // Technician notes state
  const [technicianNote, setTechnicianNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  
  // Status update loading state
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Minimal live countdown state
  const [now, setNow] = useState(new Date());
  const [dotVisible, setDotVisible] = useState(true);

  // Timeline and activity state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [pointsTransactions, setPointsTransactions] = useState<any[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);

  // Device checklist state
  const [deviceChecklist, setDeviceChecklist] = useState<any>(null);
  const [deviceChecklistLoading, setDeviceChecklistLoading] = useState(false);
  const [dbDevice, setDbDevice] = useState<any>(null);
  const [dbDeviceLoading, setDbDeviceLoading] = useState(false);

  // All device activity state
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allTransitions, setAllTransitions] = useState<any[]>([]);
  const [allRemarks, setAllRemarks] = useState<any[]>([]);
  const [allRatings, setAllRatings] = useState<any[]>([]);
  const [allAttachments, setAllAttachments] = useState<any[]>([]);

  // User names and customer state
  const [userNames, setUserNames] = useState<{ [id: string]: string }>({});
  const [dbCustomer, setDbCustomer] = useState<any>(null);

  // New state for enhanced features (matching PurchaseOrderDetailPage)
  const [activeTab, setActiveTab] = useState('overview');
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showWorkTimerModal, setShowWorkTimerModal] = useState(false);
  const [showAssignTechnicianModal, setShowAssignTechnicianModal] = useState(false);
  
  // Lazy load data only when needed
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [communicationHistory, setCommunicationHistory] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [repairHistory, setRepairHistory] = useState<any[]>([]);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['overview']));

  // Get device early to avoid temporal dead zone issues
  const device = id ? getDeviceById(id) : null;

  // Defensive: always have transitions and remarks as arrays, and required fields as non-undefined
  const safeDevice = useMemo(() => ({
    id: device?.id || '',
    customerId: device?.customerId || '',
    customerName: device?.customerName || '',
    phoneNumber: device?.phoneNumber || '',
    brand: device?.brand || '',
    model: device?.model || '',
    serialNumber: device?.serialNumber || '',
    createdAt: device?.createdAt || '',
    updatedAt: device?.updatedAt || '',
    expectedReturnDate: device?.expectedReturnDate || '',
    estimatedHours: device?.estimatedHours || 0,
    status: device?.status || 'assigned',
    assignedTo: device?.assignedTo || '',
    issueDescription: device?.issueDescription || '',
    transitions: device?.transitions || [],
    remarks: device?.remarks || [],
    warrantyStart: device?.warrantyStart || '',
    warrantyEnd: device?.warrantyEnd || '',
    warrantyStatus: device?.warrantyStatus || 'None',
    // Add missing fields from New Device Form
    unlockCode: device?.unlockCode || device?.unlock_code || '',
    repairCost: device?.repairCost || device?.repair_cost || '',
    depositAmount: device?.depositAmount || device?.deposit_amount || '',
    diagnosisRequired: device?.diagnosisRequired || device?.diagnosis_required || false,
    deviceNotes: device?.deviceNotes || device?.device_notes || '',
    deviceCost: device?.deviceCost || device?.device_cost || '',
    // Add fields for device condition assessment
    deviceCondition: device?.deviceCondition || device?.device_condition || {},
    deviceImages: device?.deviceImages || device?.device_images || [],
    accessoriesConfirmed: device?.accessoriesConfirmed || device?.accessories_confirmed || false,
    problemConfirmed: device?.problemConfirmed || device?.problem_confirmed || false,
    privacyConfirmed: device?.privacyConfirmed || device?.privacy_confirmed || false,
  }), [device]);

  // All useEffects must be called before any early returns
  useEffect(() => {
    // Save current scroll position
    const currentScroll = window.scrollY;
    setScrollPosition(currentScroll);
    
    setLoading(true);
    const timeout = setTimeout(() => {
      setLoading(false);
      // Restore scroll position after loading
      window.scrollTo(0, currentScroll);
    }, 500);
    return () => clearTimeout(timeout);
  }, [id, currentUser]);

  // All useMemo hooks must be called before any early returns
  const warrantyInfo = useMemo(() => ({
    status: safeDevice.warrantyStatus || 'None',
    startDate: safeDevice.warrantyStart,
    endDate: safeDevice.warrantyEnd,
    durationMonths: safeDevice.warrantyStart && safeDevice.warrantyEnd
      ? Math.round((new Date(safeDevice.warrantyEnd).getTime() - new Date(safeDevice.warrantyStart).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0,
  }), [safeDevice.warrantyStatus, safeDevice.warrantyStart, safeDevice.warrantyEnd]);

  // Device repair history (other devices with same serial number, excluding current)
  const deviceHistory = useMemo(() => devices.filter(
    d => d.serialNumber === safeDevice.serialNumber && d.id !== safeDevice.id
  ), [devices, safeDevice.serialNumber, safeDevice.id]);

  // Payments for this device - filter by device_id
  const devicePayments = useMemo(() => 
    payments.filter((p: any) => p.device_id === safeDevice.id), 
    [payments, safeDevice.id]
  );
  
  const totalPaid = useMemo(() => 
    devicePayments.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + (p.amount || 0), 0), 
    [devicePayments]
  );
  
  // Try to get invoice total from attachments (if any invoice has an amount in filename, e.g., 'invoice-1234-amount-500.pdf')
  const invoiceAttachments = useMemo(() => attachments.filter(att => att.type === 'invoice'), [attachments]);
  
  // Minimal countdown string: only two most significant units, with color
  const getMinimalCountdown = useMemo(() => {
    return (dateString: string) => {
      const target = new Date(dateString);
      const diff = target.getTime() - now.getTime();
      let color = '#22c55e'; // green-500
      if (diff <= 0) color = '#ef4444'; // red-500
      else if (diff < 24 * 60 * 60 * 1000) color = '#f59e42'; // orange-400
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      if (diff <= 0) return <span style={{fontFamily: 'monospace', fontSize: '0.95em', color, fontWeight: 600}}>Overdue</span>;
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
  }, [now, dotVisible]);

  // Handle tab switching with lazy loading
  const handleTabChange = useCallback(async (tabName: string) => {
    setActiveTab(tabName);
    
    // Load data only when tab is first accessed
    if (!loadedTabs.has(tabName)) {
      setLoadedTabs(prev => new Set(Array.from(prev).concat(tabName)));
      
      // Load specific data based on tab
      switch (tabName) {
        case 'timeline':
        case 'history':
          // Load audit history from database
          if (safeDevice.id) {
            try {
              const logs = await auditService.getEntityAuditLogs('device', safeDevice.id);
              setAuditHistory(logs);
            } catch (error) {
              console.error('Failed to load audit history:', error);
            }
          }
          break;
        case 'payments':
          // Payment data is already loaded
          break;
        case 'files':
          // File data is already loaded
          break;
        case 'repair':
          // Repair data is already loaded
          break;
        default:
          break;
      }
    }
  }, [loadedTabs, safeDevice.id, deviceHistory]);

  // All useCallback hooks must be called before any early returns
  const fetchAllDeviceActivity = useCallback(async () => {
    if (!safeDevice.id) return;
    
    try {
      // Payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('customer_payments')
        .select(`
          *,
          customers(name)
        `)
        .eq('device_id', safeDevice.id);
      
      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      }
      
      // Transform payments to include customer names
      const transformedPayments = (paymentsData || []).map((payment: any) => ({
        ...payment,
        customer_name: payment.customers?.name || undefined
      }));
      setAllPayments(transformedPayments);
      
      // Transitions
      const { data: transitionsData, error: transitionsError } = await supabase
        .from('device_transitions')
        .select('*')
        .eq('device_id', safeDevice.id);
      
      if (transitionsError) {
        console.error('Error fetching transitions:', transitionsError);
      }
      setAllTransitions(transitionsData || []);
      
      // Remarks
      const { data: remarksData, error: remarksError } = await supabase
        .from('device_remarks')
        .select('*')
        .eq('device_id', safeDevice.id);
      
      if (remarksError) {
        console.error('Error fetching remarks:', remarksError);
      }
      setAllRemarks(remarksData || []);
      
      // Ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('device_ratings')
        .select('*')
        .eq('device_id', safeDevice.id);
      
      if (ratingsError) {
        console.error('Error fetching ratings:', ratingsError);
      }
      setAllRatings(ratingsData || []);
      
      // Attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('device_attachments')
        .select('*')
        .eq('device_id', safeDevice.id);
      
      if (attachmentsError) {
        console.error('Error fetching attachments:', attachmentsError);
      }
      setAllAttachments(attachmentsData || []);
    } catch (error) {
      console.error('Error fetching device activity:', error);
      // Set empty arrays on error to prevent undefined issues
      setAllPayments([]);
      setAllTransitions([]);
      setAllRemarks([]);
      setAllRatings([]);
      setAllAttachments([]);
    }
  }, [safeDevice.id]);

  // Fetch device checklist and additional device info - commented out device_checklists until table is created
  const fetchDeviceDetails = useCallback(async () => {
    if (!safeDevice.id) return;
    
    setDeviceChecklistLoading(true);
    setDbDeviceLoading(true);
    
    try {
      // Fetch device checklist - commented out until device_checklists table is created
      // const { data: checklistData, error: checklistError } = await supabase
      //   .from('device_checklists')
      //   .select('*')
      //   .eq('device_id', safeDevice.id)
      //   .maybeSingle();
      
      // if (checklistError) {
      //   console.error('Error fetching device checklist:', checklistError);
      //   setDeviceChecklist(null);
      // } else {
      //   setDeviceChecklist(checklistData);
      // }
      
      // Fetch additional device info from devices table
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('*')
        .eq('id', safeDevice.id)
        .single();
      
      if (deviceError) {
        console.error('Error fetching device data:', deviceError);
        setDbDevice(null);
      } else {
        setDbDevice(deviceData);
      }
    } catch (error) {
      console.error('Error fetching device details:', error);
      setDeviceChecklist(null);
      setDbDevice(null);
    } finally {
      setDeviceChecklistLoading(false);
      setDbDeviceLoading(false);
    }
  }, [safeDevice.id]);

  // Fetch attachments on load
  useEffect(() => {
    if (id) {
      setAttachmentsLoading(true);
      setAttachmentsError(null);
      listAttachments(String(id))
        .then(setAttachments)
        .catch(e => setAttachmentsError('Failed to load attachments'))
        .finally(() => setAttachmentsLoading(false));
    }
  }, [id]);

  // Minimal live countdown effects
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setDotVisible(v => !v), 500);
    return () => clearInterval(interval);
  }, []);

  // Warranty expiry notification effect
  useEffect(() => {
    if (id && currentUser && device) {
      // Warranty expiry notification (30 days)
      if (device.warrantyEnd) {
        const now = new Date();
        const end = new Date(device.warrantyEnd);
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 30) {
          toast(
            `Warranty for this device expires in ${diffDays} day${diffDays === 1 ? '' : 's'}!`,
            { icon: '⚠️', id: `warranty-expiry-${device.id}` }
          );
        }
      }
    }
  }, [id, currentUser, device]);

  // Technician permission check effect
  useEffect(() => {
    if (id && currentUser && device && !devicesLoading) {
      const isTechnician = currentUser.role === 'technician';
      const isAssignedTechnician = isTechnician && device.assignedTo === currentUser.id;
      
      // Only redirect if we're sure the device is loaded and technician is not assigned
      if (isTechnician && device.assignedTo && !isAssignedTechnician) {
        console.log('🚫 Technician access denied - device assigned to different technician:', {
          deviceId: device.id,
          assignedTo: device.assignedTo,
          currentUserId: currentUser.id
        });
        handleBackClick();
      }
    }
  }, [id, currentUser, device, devicesLoading, handleBackClick]);

  // Device checklist effect - commented out until device_checklists table is created
  // useEffect(() => {
  //   if (id) {
  //     setDeviceChecklistLoading(true);
  //     // Fetch device checklist from database
  //     const fetchDeviceChecklist = async () => {
  //       try {
  //         const { data, error } = await supabase
  //           .from('device_checklists')
  //           .select('*')
  //           .eq('device_id', id)
  //           .single();
  //         
  //         if (error && error.code !== 'PGRST116') {
  //           console.error('Error fetching device checklist:', error);
  //         } else if (data) {
  //           setDeviceChecklist(data);
  //         }
  //       } catch (err) {
  //         console.error('Error fetching device checklist:', err);
  //       } finally {
  //         setDeviceChecklistLoading(false);
  //       }
  //     };
  //     
  //     fetchDeviceChecklist();
  //   }
  // }, [id]);

  // Fetch all device activity effect
  useEffect(() => {
    if (id) {
      // This will be called after device is loaded
    }
  }, [id]);

  // Fetch work timer data
  const fetchWorkTimer = useCallback(async () => {
    if (!safeDevice.id || !currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('device_work_sessions')
        .select('*')
        .eq('device_id', safeDevice.id)
        .eq('technician_id', currentUser.id)
        .order('start_time', { ascending: false });
      
      if (error) {
        console.error('Error fetching work sessions:', error);
        return;
      }
      
      const sessions = (data || []).map(session => ({
        start: session.start_time,
        end: session.end_time,
        duration: session.duration_minutes
      }));
      
      setWorkTimer(prev => ({
        ...prev,
        sessions
      }));
    } catch (error) {
      console.error('Error fetching work timer:', error);
    }
  }, [safeDevice.id, currentUser]);

  // Fetch all device activity effect
  useEffect(() => {
    if (id) {
      fetchAllDeviceActivity();
      fetchDeviceDetails();
      fetchWorkTimer();
    }
  }, [id, fetchAllDeviceActivity, fetchDeviceDetails, fetchWorkTimer]);

  // Work timer functions
  const startWorkTimer = async () => {
    if (!safeDevice.id || !currentUser) return;
    
    const startTime = new Date().toISOString();
    setWorkTimer(prev => ({
      ...prev,
      isRunning: true,
      startTime,
      elapsedTime: 0
    }));
    
    // Save to database
    try {
      const { error } = await supabase
        .from('device_work_sessions')
        .insert({
          device_id: safeDevice.id,
          technician_id: currentUser.id,
          start_time: startTime,
          status: 'active'
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error starting work timer:', error);
      toast.error('Failed to start work timer');
    }
  };

  const stopWorkTimer = async () => {
    if (!workTimer.startTime || !safeDevice.id || !currentUser) return;
    
    const endTime = new Date();
    const startTime = new Date(workTimer.startTime);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    setWorkTimer(prev => ({
      ...prev,
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      sessions: [{
        start: workTimer.startTime!,
        end: endTime.toISOString(),
        duration: durationMinutes
      }, ...prev.sessions]
    }));
    
    // Update database
    try {
      const { error } = await supabase
        .from('device_work_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          status: 'completed'
        })
        .eq('device_id', safeDevice.id)
        .eq('technician_id', currentUser.id)
        .eq('start_time', workTimer.startTime);
      
      if (error) throw error;
      toast.success(`Work session recorded: ${formatDuration(durationMs)}`);
    } catch (error) {
      console.error('Error stopping work timer:', error);
      toast.error('Failed to stop work timer');
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workTimer.isRunning && workTimer.startTime) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const start = new Date(workTimer.startTime!).getTime();
        setWorkTimer(prev => ({
          ...prev,
          elapsedTime: now - start
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workTimer.isRunning, workTimer.startTime]);

  // Fetch audit logs, points transactions, and SMS logs on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchTimelineExtras() {
      setTimelineLoading(true);
      try {
        // Audit logs
        const logs = await auditService.getEntityAuditLogs('device', safeDevice.id);
        // Points transactions (optional - table might not exist)
        let points = [];
        try {
          const { data: pointsData, error: pointsError } = await supabase
          .from('points_transactions')
          .select('*')
          .eq('device_id', safeDevice.id);
          if (!pointsError) points = pointsData || [];
        } catch (error) {
          console.warn('Points transactions table not available:', error);
        }
        
        // SMS logs (optional - table might not exist)
        let sms = [];
        try {
          const { data: smsData, error: smsError } = await supabase
          .from('sms_logs')
          .select('*')
          .eq('device_id', safeDevice.id);
          if (!smsError) sms = smsData || [];
        } catch (error) {
          console.warn('SMS logs table not available:', error);
        }
        if (isMounted) {
          setAuditLogs(logs || []);
          setPointsTransactions(points);
          setSmsLogs(sms);
        }
      } catch (err) {
        if (isMounted) {
          setAuditLogs([]);
          setPointsTransactions([]);
          setSmsLogs([]);
        }
      } finally {
        if (isMounted) setTimelineLoading(false);
      }
    }
    if (safeDevice.id) fetchTimelineExtras();
    return () => { isMounted = false; };
  }, [safeDevice.id]);

  // Fetch user names for all unique user IDs in timeline events
  useEffect(() => {
    async function fetchUserNames() {
      // Gather all unique user IDs from device transitions, remarks, payments, attachments, ratings, auditLogs, pointsTransactions, smsLogs
      const ids = new Set<string>();
      
      // Add assigned technician
      if (safeDevice.assignedTo) {
        ids.add(safeDevice.assignedTo);
      }
      
      allTransitions.forEach((t: any) => t.performed_by && ids.add(t.performed_by));
      allRemarks.forEach((r: any) => r.created_by && ids.add(r.created_by));
      allPayments.forEach((p: any) => p.created_by && ids.add(p.created_by));
      allAttachments.forEach((a: any) => a.uploaded_by && ids.add(a.uploaded_by));
      allRatings.forEach((r: any) => r.technician_id && ids.add(r.technician_id));
      auditLogs.forEach(a => a.user_id && ids.add(a.user_id));
      pointsTransactions.forEach(pt => pt.created_by && ids.add(pt.created_by));
      smsLogs.forEach(sms => (sms.sent_by || sms.created_by) && ids.add(sms.sent_by || sms.created_by));
      
      // Remove empty/undefined/null
      const uniqueIds = Array.from(ids).filter(Boolean);
      if (uniqueIds.length === 0) return;
      
      // Only fetch those not already in userNames
      const idsToFetch = uniqueIds.filter(id => !(id in userNames));
      if (idsToFetch.length === 0) return;
      
      // Query auth_users for these IDs
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, username')
        .in('id', idsToFetch);
      if (!error && data) {
        const newNames: { [id: string]: string } = {};
        data.forEach((u: any) => { newNames[u.id] = u.username; });
        setUserNames(prev => ({ ...prev, ...newNames }));
      }
    }
    fetchUserNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeDevice.assignedTo, allPayments.length, allTransitions.length, allRemarks.length, allRatings.length, allAttachments.length, auditLogs.length, pointsTransactions.length, smsLogs.length]);

  // Fetch customer info directly from Supabase
  useEffect(() => {
    async function fetchCustomer() {
      if (!safeDevice.customerId) return;
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', safeDevice.customerId)
          .single();
        if (error) {
          console.error('Error fetching customer:', error);
          setDbCustomer(null);
        } else if (data) {
          setDbCustomer(data);
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
        setDbCustomer(null);
      }
    }
    fetchCustomer();
  }, [safeDevice.customerId]);

  // Only static check at the very top
  if (!id || !currentUser) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">Missing device ID or user session. Please try again.</div>
    );
  }

  // Check if devices are still loading
  if (devicesLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading device data...</p>
      </div>
    );
  }

  // Check if device data is still loading
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading device details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if device is not found
  if (!device && !devicesLoading) {
    // Check if this is a technician trying to access a device not assigned to them
    const isTechnician = currentUser?.role === 'technician';
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        {isTechnician ? (
          <>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4">You can only view devices assigned to you.</p>
            <p className="text-sm text-gray-500 mb-6">If you believe this is an error, please contact your administrator.</p>
          </>
        ) : (
          <>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Device Not Found</h2>
                <p className="text-gray-600 mb-4">The device you're looking for doesn't exist.</p>
          </>
        )}
        <div className="space-y-2">
              <button
            onClick={() => navigate('/devices')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm mx-auto"
          >
                <ArrowLeft className="w-4 h-4" />
            Back to Devices
              </button>
          {!isTechnician && (
                <button
              onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm mx-auto"
            >
                  <RefreshCw className="w-4 h-4" />
              Retry Loading
                </button>
          )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const customer = getCustomerById(safeDevice.customerId);

  // Helper: get file type icon/preview
  const getFilePreview = (att: any) => {
    const ext = att.filename.split('.').pop()?.toLowerCase();
    const publicUrl = supabase.storage.from('device-attachments').getPublicUrl(att.file_path).data.publicUrl;
    if (att.filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return <img src={publicUrl} alt={att.filename} className="w-10 h-10 object-cover rounded shadow" />;
    }
    if (ext === 'pdf') {
      return <FileText className="w-8 h-8 text-red-600" />;
    }
    return <FileIcon className="w-8 h-8 text-gray-500" />;
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !currentUser || !id) return;
    setAttachmentsLoading(true);
    setAttachmentsError(null);
    setUploadProgress(0);
    try {
      for (const [i, file] of Array.from(files).entries()) {
        setUploadProgress(Math.round(((i) / files.length) * 100));
        const newAtt = await uploadAttachment(String(id), file, currentUser.id);
        setAttachments(prev => [newAtt, ...prev]);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        await logAuditAction({
          userId: currentUser.id,
          action: 'upload',
          entityType: 'attachment',
          entityId: newAtt.id,
          details: { fileName: newAtt.filename, deviceId: id }
        });
      }
    } catch (err) {
      setAttachmentsError('Failed to upload attachment');
    } finally {
      setAttachmentsLoading(false);
      setUploadProgress(null);
    }
  };

  const handleRemoveAttachment = (att: any) => {
    setDeleteTarget(att);
    setShowDeleteModal(true);
  };

  const confirmDeleteAttachment = async () => {
    if (!deleteTarget) return;
    setAttachmentsLoading(true);
    setAttachmentsError(null);
    try {
      await deleteAttachment(deleteTarget.id, deleteTarget.file_path);
      setAttachments(prev => prev.filter(att => att.id !== deleteTarget.id));
      setShowDeleteModal(false);
      if (currentUser) {
        await logAuditAction({
          userId: currentUser.id,
          action: 'delete',
          entityType: 'attachment',
          entityId: deleteTarget.id,
          details: { fileName: deleteTarget.filename, deviceId: id }
        });
      }
      setDeleteTarget(null);
    } catch (err) {
      setAttachmentsError('Failed to delete attachment');
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const handleBulkDeleteAttachments = async () => {
    if (selectedAttachmentsForDelete.length === 0) return;
    setAttachmentsLoading(true);
    setAttachmentsError(null);
    try {
      const attachmentsToDelete = attachments.filter(att => 
        selectedAttachmentsForDelete.includes(att.id) && att.type !== 'invoice'
      );
      
      for (const att of attachmentsToDelete) {
        await deleteAttachment(att.id, att.file_path);
        if (currentUser) {
          await logAuditAction({
            userId: currentUser.id,
            action: 'delete',
            entityType: 'attachment',
            entityId: att.id,
            details: { fileName: att.filename, deviceId: id }
          });
        }
      }
      
      setAttachments(prev => prev.filter(att => !selectedAttachmentsForDelete.includes(att.id)));
      setSelectedAttachmentsForDelete([]);
      setShowBulkDeleteModal(false);
      toast.success(`Successfully deleted ${attachmentsToDelete.length} attachment(s)`);
    } catch (err) {
      setAttachmentsError('Failed to delete some attachments');
      toast.error('Failed to delete some attachments');
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const toggleAttachmentSelection = (attachmentId: string) => {
    setSelectedAttachmentsForDelete(prev => 
      prev.includes(attachmentId) 
        ? prev.filter(id => id !== attachmentId)
        : [...prev, attachmentId]
    );
  };

  // Calculate invoice total from attachments (if any invoice has an amount in filename, e.g., 'invoice-1234-amount-500.pdf')
  let invoiceTotal = 0;
  invoiceAttachments.forEach(att => {
    const match = att.filename.match(/amount[-_](\d+)/i);
    if (match) invoiceTotal += parseFloat(match[1]);
  });
  const outstanding = invoiceTotal > 0 ? Math.max(invoiceTotal - totalPaid, 0) : null;

  // Helper functions to check if sections have data
  const hasWarrantyData = () => {
    return warrantyInfo.status && warrantyInfo.status !== 'None' && 
           (warrantyInfo.startDate || warrantyInfo.endDate || warrantyInfo.durationMonths > 0);
  };

  const hasRepairHistory = () => {
    return deviceHistory.length > 0;
  };

  const hasInvoices = () => {
    return attachments.filter(att => att.type === 'invoice').length > 0;
  };

  const hasAttachments = () => {
    return attachments.filter(att => att.type !== 'invoice').length > 0;
  };

  // Check permissions based on role
  const isTechnician = currentUser.role === 'technician';
  const isAssignedTechnician = isTechnician && device?.assignedTo === currentUser.id;
  
  const handleStatusUpdate = async (newStatus: DeviceStatus, signature: string) => {
    if (!id) return;
    setStatusUpdateLoading(true);
    try {
      const success = await updateDeviceStatus(id, newStatus, signature);
      if (success) {
        toast.success(`Status updated to ${newStatus.replace('-', ' ')}`);
        // Refresh device activity to show the new status
        await fetchAllDeviceActivity();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleChecklistStatusUpdate = async (newStatus: DeviceStatus) => {
    if (!id) return;
    setStatusUpdateLoading(true);
    try {
      const success = await updateDeviceStatus(id, newStatus, 'checklist-update');
      if (success) {
        toast.success(`Status updated to ${newStatus.replace('-', ' ')}`);
        // Refresh device activity to show the new status
        await fetchAllDeviceActivity();
        // Refresh device details to get updated diagnostic data
        await fetchDeviceDetails();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  
  const handleAddRemark = async (remark: string) => {
    await addRemark(id, remark);
    await fetchAllDeviceActivity();
  };

  // Add technician note
  const handleAddTechnicianNote = async () => {
    if (!technicianNote.trim() || !currentUser || addingNote) return;
    
    setAddingNote(true);
    try {
      const { error } = await supabase
        .from('device_remarks')
        .insert({
          device_id: safeDevice.id,
          remark: technicianNote,
          created_by: currentUser.id,
          remark_type: 'technician_note'
        });
      
      if (error) throw error;
      
      setTechnicianNote('');
      await fetchAllDeviceActivity();
      toast.success('Note added successfully');
    } catch (error: any) {
      console.error('Error adding technician note:', error);
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };
  
  const handlePrintReceipt = () => {
    // Use timeout to ensure the component has rendered
    setTimeout(() => {
      if (printRef.current) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Repair Shop Receipt</title>
                <style>
                  body { font-family: Arial, sans-serif; }
                  .container { padding: 20px; }
                  .receipt { 
                    border: 2px solid #000; 
                    padding: 20px; 
                    max-width: 400px; 
                    margin: 0 auto; 
                  }
                  .header { 
                    text-align: center; 
                    margin-bottom: 20px; 
                  }
                  .divider { 
                    border-top: 2px solid #000; 
                    border-bottom: 2px solid #000; 
                    padding: 15px 0; 
                    margin: 15px 0; 
                  }
                  .row { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 10px; 
                  }
                  .footer { 
                    text-align: center; 
                    font-size: 12px; 
                  }
                  .dotted-divider { 
                    border-top: 1px dashed #000; 
                    margin-top: 15px; 
                    padding-top: 15px; 
                  }
                  .small-text { 
                    font-size: 10px; 
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="receipt">
                    <div class="header">
                      <h2>REPAIR SHOP</h2>
                      <p>Customer Receipt</p>
                    </div>
                    
                    <div class="divider">
                      <div class="row">
                        <span><strong>Device:</strong></span>
                        <span style="font-size: 18px;">${getDeviceName(device || { brand: '', model: '' })}</span>
                      </div>
                      
                      <div class="row">
                        <span><strong>Customer:</strong></span>
                        <span>${device?.customerName || 'N/A'}</span>
                      </div>
                      
                      <div class="row">
                        <span><strong>Expected Return:</strong></span>
                        <span>${new Date(device?.expectedReturnDate || new Date().toISOString()).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div class="footer">
                      <p>Please present this receipt when collecting your device.</p>
                      <p>Contact: (555) 123-4567</p>
                    </div>
                    
                    <div class="dotted-divider small-text">
                      <p>Device: ${device?.brand || 'N/A'} ${device?.model || 'N/A'}</p>
                      <p>Received: ${new Date(device?.createdAt || new Date().toISOString()).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      }
    }, 100);
  };
  
  

  // Helper to get device name
  const getDeviceName = (device: { brand: string; model: string }) => `${device.model}`;

  // Add payment handler for new modal with multiple payments support
  const handlePaymentComplete = async (payments: any[], totalPaid: number) => {
    try {
      if (!customer) {
        toast.error('Customer must be selected before processing payment');
        return;
      }
      if (!safeDevice) throw new Error('Device information is missing');
      
      // Create payment records for each payment entry
      const paymentRecords = payments.map(payment => ({
        id: crypto.randomUUID(),
        customer_id: customer.id,
        amount: payment.amount,
        currency: payment.currency || 'TZS', // Default to TZS if not provided
        method: payment.paymentMethod,
        device_id: safeDevice.id,
        payment_date: payment.timestamp,
        payment_type: 'payment',
        status: 'completed',
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
        reference: payment.reference || undefined,
        notes: payment.notes || undefined,
        payment_account_id: payment.paymentAccountId,
        // Add a transaction group ID to link multiple payments together
        transaction_group_id: payments[0].id, // Use first payment ID as group ID
        payment_sequence: payments.indexOf(payment) + 1,
        total_transaction_amount: totalPaid
      }));
      
      // Insert all payment records
      const { error } = await supabase
        .from('customer_payments')
        .insert(paymentRecords);
      if (error) throw error;
      
      // Update finance account balances for each payment
      for (const payment of payments) {
        // Get the account to check its currency
        const { data: accountData, error: accountError } = await supabase
          .from('finance_accounts')
          .select('currency')
          .eq('id', payment.paymentAccountId)
          .single();

        if (accountError) {
          console.error('Error fetching account currency:', accountError);
          continue;
        }

        // For now, we'll use the payment amount directly
        // In a production system, you'd want proper currency conversion
        const amountToAdd = payment.amount;

        const { error: balanceError } = await supabase
          .from('finance_accounts')
          .update({ 
            balance: supabase.raw(`balance + ${amountToAdd}`),
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.paymentAccountId);

        if (balanceError) {
          console.error('Error updating account balance:', balanceError);
        }
      }
      
      setLastPayment({
        amount: totalPaid,
        method: `${payments.length} payment(s)`,
        payment_date: new Date().toISOString()
      });
      setShowPaymentConfirmation(true);
      // Refresh payments to show the new payments
      await refreshPayments();
      
    } catch (err: any) {
      console.error('Payment processing error:', err);
      throw err; // This will be caught by the modal and show error toast
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

  // Helper functions for status display (matching PurchaseOrderDetailPage style)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'in-repair': return 'text-orange-600 bg-orange-100';
      case 'reassembled-testing': return 'text-purple-600 bg-purple-100';
      case 'repair-complete': return 'text-green-600 bg-green-100';
      case 'ready-for-pickup': return 'text-green-600 bg-green-100';
      case 'picked-up': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <User className="w-4 h-4" />;
      case 'in-repair': return <Wrench className="w-4 h-4" />;
      case 'reassembled-testing': return <CheckSquare className="w-4 h-4" />;
      case 'repair-complete': return <CheckCircle className="w-4 h-4" />;
      case 'ready-for-pickup': return <CheckCircle className="w-4 h-4" />;
      case 'picked-up': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number, currencyCode: string = 'TZS') => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper to get transition time
  function getTransitionTime(transitions: {toStatus: string, timestamp: string}[], toStatus: string): number | undefined {
    const t = transitions.find((tr) => tr.toStatus === toStatus);
    return t ? new Date(t.timestamp).getTime() : undefined;
  }

  const inRepairTime = device?.transitions ? getTransitionTime(device.transitions, 'in-repair') : undefined;
  const repairCompleteTime = device?.transitions ? getTransitionTime(device.transitions, 'repair-complete') : undefined;
  const doneTime = device?.transitions ? getTransitionTime(device.transitions, 'done') : undefined;

  const technicianDuration = (inRepairTime && repairCompleteTime) ? repairCompleteTime - inRepairTime : undefined;
  const handoverDuration = (repairCompleteTime && doneTime) ? doneTime - repairCompleteTime : undefined;






  // Helper: normalize all events to a common structure
  function getTimelineEvents() {
    const events: any[] = [];
    // Only Status transitions - keep timeline focused on device status changes
    for (const t of allTransitions) {
      // Find the previous transition to get the timestamp for fromStatus
      const prev = allTransitions.find(pt => pt.to_status === t.from_status);
      let durationMs = null;
      let durationLabel = '';
      if (prev && prev.created_at && t.created_at) {
        durationMs = new Date(t.created_at).getTime() - new Date(prev.created_at).getTime();
        // Format duration as h m
        const totalMinutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        durationLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      }
      events.push({
        type: 'status',
        typeLabel: 'Status Change',
        timestamp: t.created_at,
        user: t.performed_by,
        description: `Changed to ${t.to_status?.replace(/-/g, ' ')}`,
        icon: <Clock className="h-4 w-4 text-blue-600" />, 
        toStatus: t.to_status,
        fromStatus: t.from_status,
        durationMs,
        durationLabel
      });
    }
    
        // Return only status events for timeline
    return events;
  }

  // Helper: get all activity events for chat display
  function getActivityEvents() {
    const events: any[] = [];
    
    // Payments
    for (const p of allPayments) {
      events.push({
        type: 'payment',
        typeLabel: 'Payment',
        timestamp: p.payment_date,
        user: p.created_by,
        description: `${p.payment_type === 'payment' ? 'Payment' : p.payment_type === 'deposit' ? 'Deposit' : 'Refund'}: ${formatCurrency(p.amount)} (${p.method}) [${p.status}]`,
        icon: <CreditCard className="h-4 w-4 text-green-600" />,
      });
    }
    
    // Attachments
    for (const att of allAttachments) {
      events.push({
        type: 'attachment',
        typeLabel: 'Attachment',
        timestamp: att.uploaded_at,
        user: att.uploaded_by,
        description: `Attachment uploaded: ${att.filename}`,
        icon: <Upload className="h-4 w-4 text-gray-600" />,
      });
    }
    
    // Ratings (if available)
    for (const rating of allRatings) {
      events.push({
        type: 'rating',
        typeLabel: 'Rating',
        timestamp: rating.created_at,
        user: rating.technician_id,
        description: `Device rated ${rating.score} star${rating.score > 1 ? 's' : ''}${rating.comment ? `: ${rating.comment}` : ''}`,
        icon: <Star className="h-4 w-4 text-yellow-500" />,
      });
    }
    
    // Audit logs
    for (const log of auditLogs) {
      events.push({
        type: 'audit',
        typeLabel: 'Audit',
        timestamp: log.timestamp,
        user: log.user_id,
        description: `[Audit] ${log.action.replace(/_/g, ' ')}${log.details && log.details.fileName ? `: ${log.details.fileName}` : ''}`,
        icon: <Activity className="h-4 w-4 text-rose-600" />,
      });
    }
    
    // Points transactions
    for (const pt of pointsTransactions) {
      events.push({
        type: 'points',
        typeLabel: 'Points',
        timestamp: pt.created_at,
        user: pt.created_by,
        description: `Points ${pt.points_change > 0 ? 'earned' : 'spent'}: ${pt.points_change} (${pt.transaction_type}) - ${pt.reason}`,
        icon: <Award className="h-4 w-4 text-pink-600" />,
      });
    }
    
        // SMS logs
    for (const sms of smsLogs) {
      events.push({
        type: 'sms',
        typeLabel: 'SMS',
        timestamp: sms.sent_at || sms.created_at,
        user: sms.sent_by,
        description: `SMS ${sms.direction === 'outbound' ? 'sent' : 'received'}: ${sms.message_content?.substring(0, 50)}${sms.message_content?.length > 50 ? '...' : ''}`,
        icon: <MessageSquare className="h-4 w-4 text-blue-600" />,
      });
    }
    
    return events;
  }




  // Replace getUserById with this:
  const getUserName = (userId: string) => {
    if (!userId) return 'Unknown';
    if (userNames[userId]) return userNames[userId];
    // fallback for system or provider
    if (userId === 'system') return 'System';
    return userId.slice(0, 8) + '...';
  };

  // Helper function to calculate repair progress based on status
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
    return statusProgress[safeDevice.status] || 0;
  };

  // Export device data function
  const handleExportDeviceData = () => {
    try {
      const deviceData = {
        device: safeDevice,
        customer: customer || dbCustomer,
        payments: allPayments,
        attachments: attachments,
        auditHistory: auditHistory,
        workTimer: workTimer,
        timestamp: new Date().toISOString()
      };

      const dataStr = JSON.stringify(deviceData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `device-${safeDevice.serialNumber}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Device data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export device data');
    }
  };


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
        {/* Minimal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{safeDevice.brand} {safeDevice.model}</h2>
              </div>
              <p className="text-sm text-gray-500">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(safeDevice.status)}`}>
                  {getStatusIcon(safeDevice.status)}
                  <span className="capitalize">{safeDevice.status.replace('-', ' ')}</span>
                </span>
                <span className="ml-2">Created {formatDate(safeDevice.createdAt)}</span>
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
                <Upload className="w-4 h-4" />
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
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Layers className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Repair Progress</h3>
                        <p className="text-sm text-gray-600 capitalize">{safeDevice.status.replace('-', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{getRepairProgress()}%</div>
                      <div className="text-sm text-gray-500">Complete</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${getRepairProgress()}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between mt-3 text-sm text-gray-600">
                    <span>Started</span>
                    <span>In Progress</span>
                    <span>Testing</span>
                    <span>Complete</span>
                  </div>
                </div>
              </div>

              {/* Main Content Layout - Two Column */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Device Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Info className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Device Information</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Device:</span>
                        <span className="text-sm font-medium">{safeDevice.brand} {safeDevice.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Serial:</span>
                        <span className="text-sm font-medium font-mono">{safeDevice.serialNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(safeDevice.status)}`}>
                          {getStatusIcon(safeDevice.status)}
                          <span className="capitalize">{safeDevice.status.replace('-', ' ')}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Created Date:</span>
                        <span className="text-sm font-medium">{formatDate(safeDevice.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expected Return:</span>
                        <span className="text-sm font-medium">
                          {safeDevice.expectedReturnDate ? formatDate(safeDevice.expectedReturnDate) : 'Not set'}
                        </span>
                      </div>
                      {safeDevice.assignedTo && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Assigned To:</span>
                          <span className="text-sm font-medium">{getUserName(safeDevice.assignedTo)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Customer Information</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="text-xs text-gray-600 uppercase tracking-wide">Name</span>
                        </div>
                        <span className="text-sm font-medium">{dbCustomer?.name || customer?.name || safeDevice.customerName || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                            <Phone className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-xs text-gray-600 uppercase tracking-wide">Phone</span>
                        </div>
                        <span className="text-sm font-medium">{dbCustomer?.phone || customer?.phone || safeDevice.phoneNumber || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                            <Calendar className="w-3 h-3 text-purple-600" />
                          </div>
                          <span className="text-xs text-gray-600 uppercase tracking-wide">Expected Return</span>
                        </div>
                        <span className="text-sm font-medium">
                          {safeDevice.expectedReturnDate 
                            ? new Date(safeDevice.expectedReturnDate).toLocaleDateString()
                            : 'Not set'
                          }
                        </span>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Customer ID:</span>
                          <span className="text-sm font-medium text-gray-900">{dbCustomer?.id || customer?.id || safeDevice.customerId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="text-sm font-medium text-gray-500">{dbCustomer?.email || customer?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Financial Summary</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Paid:</span>
                        <span className="text-sm font-medium text-green-600">{formatCurrency(totalPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payments:</span>
                        <span className="text-sm font-medium">{allPayments.length}</span>
                      </div>
                      {allPayments.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Avg Payment:</span>
                          <span className="text-sm font-medium">{formatCurrency(totalPaid / allPayments.length)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Notes</h3>
                    </div>
                    <div className="space-y-3">
                      {safeDevice.issueDescription ? (
                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {safeDevice.issueDescription}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No notes added</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Actions */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Actions</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowStatusUpdateModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Update Status
                      </button>

                      <button
                        onClick={handlePrintReceipt}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Printer className="w-4 h-4" />
                        Print Receipt
                      </button>

                      {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <CreditCard className="w-4 h-4" />
                          Record Payment
                        </button>
                      )}

                      <button
                        onClick={() => setShowDiagnosticChecklist(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Stethoscope className="w-4 h-4" />
                        Diagnostic
                      </button>

                      <button
                        onClick={() => setShowRepairChecklist(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Wrench className="w-4 h-4" />
                        Repair Checklist
                      </button>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => setShowAssignTechnicianModal(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <User className="w-4 h-4" />
                          Assign Technician
                        </button>
                      )}

                      {currentUser.role === 'customer-care' && (
                        <button
                          onClick={() => setShowSmsModal(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Send SMS
                        </button>
                      )}

                      <button
                        onClick={handleExportDeviceData}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Export Data
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </>
          )}

          {/* Repair Tab */}
          {activeTab === 'repair' && (
            <div className="space-y-6">
              {/* Repair Status & Work Timer */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Repair Status</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(safeDevice.status)}`}>
                      {getStatusIcon(safeDevice.status)}
                      <span className="capitalize">{safeDevice.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Progress</span>
                    <p className="text-sm font-medium text-gray-900">{getRepairProgress()}%</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Assigned To</span>
                    <p className="text-sm font-medium text-gray-900">
                      {safeDevice.assignedTo ? getUserName(safeDevice.assignedTo) : 'Unassigned'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Expected Return</span>
                    <p className="text-sm font-medium text-gray-900">
                      {safeDevice.expectedReturnDate ? formatDate(safeDevice.expectedReturnDate) : 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Work Timer for Assigned Technicians */}
                {isAssignedTechnician && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-medium text-gray-700">Work Timer</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Current</span>
                        <p className="text-sm font-medium text-gray-900">
                          {workTimer.isRunning ? formatDuration(workTimer.elapsedTime) : 'Not running'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Total Time</span>
                        <p className="text-sm font-medium text-gray-900">
                          {workTimer.sessions.reduce((total, session) => total + (session.duration || 0), 0)}m
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!workTimer.isRunning ? (
                        <button
                          onClick={startWorkTimer}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Play className="w-4 h-4" />
                          Start Timer
                        </button>
                      ) : (
                        <button
                          onClick={stopWorkTimer}
                          className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Square className="w-4 h-4" />
                          Stop Timer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Payment Summary</h3>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add Payment
                  </button>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                    <div className="text-xs text-green-700 uppercase tracking-wide">Total Paid</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{allPayments.length}</div>
                    <div className="text-xs text-blue-700 uppercase tracking-wide">Payments</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {allPayments.length > 0 ? formatCurrency(totalPaid / allPayments.length) : 'TZS 0'}
                    </div>
                    <div className="text-xs text-purple-700 uppercase tracking-wide">Avg Payment</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">
                      {allPayments.length > 0 ? formatRelativeTime(allPayments[0].created_at) : 'None'}
                    </div>
                    <div className="text-xs text-orange-700 uppercase tracking-wide">Last Payment</div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <History className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Payment History</h3>
                </div>
                <div className="space-y-2">
                  {allPayments.length > 0 ? (
                    allPayments.slice(0, 10).map((payment, index) => (
                      <div key={payment.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-gray-600">{payment.method}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatRelativeTime(payment.created_at)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                            payment.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No payment history</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              {/* Attachments */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Attachments</h3>
                  </div>
                  <button
                    onClick={() => setShowAttachmentModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Upload Files
                  </button>
                </div>
                
                <div className="space-y-2">
                  {attachments.length > 0 ? (
                    attachments.slice(0, 10).map((attachment, index) => (
                      <div key={attachment.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                            <p className="text-xs text-gray-600">{attachment.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatRelativeTime(attachment.uploaded_at)}</p>
                          <button
                            onClick={() => window.open(supabase.storage.from('device-attachments').getPublicUrl(attachment.file_path).data.publicUrl, '_blank')}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No attachments uploaded</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && !loadedTabs.has('timeline') && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading timeline...</p>
              </div>
            </div>
          )}
          {activeTab === 'timeline' && loadedTabs.has('timeline') && (
            <div className="space-y-6">
              {/* Audit Trail */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <History className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Activity Timeline</h3>
                </div>
                <div className="space-y-2">
                  {auditHistory.length > 0 ? (
                    auditHistory.slice(0, 15).map((entry, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                          <p className="text-xs text-gray-600">{entry.description}</p>
                          <p className="text-xs text-gray-500">By: {getUserName(entry.user_id)}</p>
                        </div>
                        <span className="text-xs text-gray-500">{formatRelativeTime(entry.created_at)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No activity history available</p>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* History Tab */}
          {activeTab === 'history' && !loadedTabs.has('history') && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading history...</p>
              </div>
            </div>
          )}
          {activeTab === 'history' && loadedTabs.has('history') && (
            <div className="space-y-6">
              {/* Audit Trail */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <History className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Audit Trail</h3>
                </div>
                <div className="space-y-2">
                  {auditHistory.length > 0 ? (
                    auditHistory.slice(0, 10).map((entry, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                          <p className="text-xs text-gray-600">{entry.description}</p>
                          <p className="text-xs text-gray-500">By: {getUserName(entry.user_id)}</p>
                        </div>
                        <span className="text-xs text-gray-500">{formatRelativeTime(entry.created_at)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No audit history available</p>
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Payment History</h3>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add Payment
                  </button>
                </div>
                <div className="space-y-2">
                  {allPayments.length > 0 ? (
                    allPayments.slice(0, 5).map((payment, index) => (
                      <div key={payment.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-gray-600">{payment.method}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatRelativeTime(payment.created_at)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                            payment.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No payment history</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCommunicationModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Communication
            </button>
            
            <button
              onClick={() => setShowAttachmentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Upload className="w-4 h-4" />
              Attachments
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/devices')}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
            
            <button
              onClick={() => setShowStatusUpdateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Edit className="w-4 h-4" />
              Update Status
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PrintableSlip ref={printRef} device={safeDevice} />

      {/* Status Update Modal */}
      <Modal 
        isOpen={showStatusUpdateModal} 
        onClose={() => setShowStatusUpdateModal(false)} 
        title="Update Device Status" 
        maxWidth="600px"
      >
        <StatusUpdateForm
          device={safeDevice}
          currentUser={currentUser}
          onUpdateStatus={handleStatusUpdate}
          onAddRemark={handleAddRemark}
          onAddRating={addRating}
          outstanding={outstanding}
        />
      </Modal>

      {/* Communication Modal */}
      <Modal 
        isOpen={showCommunicationModal} 
        onClose={() => setShowCommunicationModal(false)} 
        title="Communication History" 
        maxWidth="800px"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Customer Contact</h4>
            <p className="text-sm text-gray-600">
              Phone: {dbCustomer?.phone || customer?.phone || safeDevice.phoneNumber || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              Name: {dbCustomer?.name || customer?.name || safeDevice.customerName || 'N/A'}
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Communication Options</h4>
            <div className="grid grid-cols-1 gap-3">
              {currentUser.role === 'customer-care' && (
                <button
                  onClick={() => {
                    setShowCommunicationModal(false);
                    setShowSmsModal(true);
                  }}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">Send SMS</p>
                    <p className="text-sm text-gray-600">Send text message to customer</p>
                  </div>
                </button>
              )}
              
              <button
                onClick={() => {
                  const phoneNumber = dbCustomer?.phone || customer?.phone || safeDevice.phoneNumber;
                  if (phoneNumber) {
                    window.open(`tel:${phoneNumber}`, '_self');
                  }
                }}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">Call Customer</p>
                  <p className="text-sm text-gray-600">Open phone dialer</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Attachment Modal */}
      <Modal 
        isOpen={showAttachmentModal} 
        onClose={() => setShowAttachmentModal(false)} 
        title="Manage Attachments" 
        maxWidth="800px"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">Upload Files</h4>
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleAttachmentUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm">
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
            </label>
          </div>

          {uploadProgress !== null && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-900">Uploading...</span>
                <span className="text-sm text-blue-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {attachments.length > 0 ? (
              attachments.map((attachment, index) => (
                <div key={attachment.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                      <p className="text-xs text-gray-600">{attachment.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(supabase.storage.from('device-attachments').getPublicUrl(attachment.file_path).data.publicUrl, '_blank')}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleRemoveAttachment(attachment)}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No attachments uploaded</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Assign Technician Modal */}
      <Modal 
        isOpen={showAssignTechnicianModal} 
        onClose={() => setShowAssignTechnicianModal(false)} 
        title="Assign Technician" 
        maxWidth="500px"
      >
        <AssignTechnicianForm 
          deviceId={safeDevice.id}
          currentTechId={safeDevice.assignedTo}
          currentUser={currentUser}
        />
      </Modal>

      {/* SMS Modal: Only Customer Care can use */}
      {currentUser.role === 'customer-care' && (
        <Modal 
          isOpen={showSmsModal} 
          onClose={() => { setShowSmsModal(false); setSmsMessage(''); setSmsResult(null); }} 
          title="Send SMS" 
          maxWidth="600px"
        >
          <form
            onSubmit={async e => {
              e.preventDefault();
              setSmsSending(true);
              setSmsResult(null);
              const smsPhoneNumber = (dbCustomer?.phone || customer?.phone || safeDevice.phoneNumber || '').replace(/\D/g, '');
              const smsResultObj = await smsService.sendSMS(smsPhoneNumber, smsMessage, dbCustomer?.id || customer?.id || safeDevice.customerId);
              setSmsSending(false);
              if (smsResultObj.success) {
                const logSuccess = await logManualSMS({
                  deviceId: safeDevice.id,
                  customerId: dbCustomer?.id || customer?.id || safeDevice.customerId,
                  sentBy: currentUser.id,
                  message: smsMessage,
                });
                if (!logSuccess) {
                  setSmsResult('SMS sent, but failed to log the message.');
                } else {
                  setSmsResult('SMS sent!');
                }
                setSmsMessage('');
              } else {
                setSmsResult(`Failed: ${smsResultObj.error}`);
              }
            }}
            className="space-y-6"
          >
            <div>
              <label className="block text-gray-700 mb-3 font-semibold">To</label>
              <div className="py-4 px-6 bg-gray-100 rounded-lg font-medium">
                {dbCustomer?.phone || customer?.phone || safeDevice.phoneNumber || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-3 font-semibold">Message</label>
              <textarea
                value={smsMessage}
                onChange={e => setSmsMessage(e.target.value)}
                rows={6}
                className="w-full py-4 px-6 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message here"
                required
              />
              <div className="mt-2 text-sm text-gray-500">
                Character count: {smsMessage.length}/160
              </div>
            </div>
            {smsResult && (
              <div className={`p-4 rounded-lg ${
                smsResult.startsWith('Failed') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {smsResult}
              </div>
            )}
            <div className="flex gap-4 justify-end">
              <button 
                type="button" 
                onClick={() => { setShowSmsModal(false); setSmsMessage(''); setSmsResult(null); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={smsSending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {smsSending ? 'Sending...' : 'Send SMS'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Modal */}
      <PaymentsPopupModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentAmount('');
        }}
        amount={paymentAmount ? Number(paymentAmount) : 0}
        customerId={customer?.id}
        customerName={customer?.name}
        description={`Payment for ${getDeviceName(safeDevice)} repair`}
        onPaymentComplete={handlePaymentComplete}
        title="Record Payment"
        deviceId={safeDevice?.id}
        allowPriceEdit={true}
      />

      {/* Diagnostic Checklist Modal */}
      <DiagnosticChecklist
        device={safeDevice}
        isOpen={showDiagnosticChecklist}
        onClose={() => setShowDiagnosticChecklist(false)}
        onStatusUpdate={handleChecklistStatusUpdate}
      />

      {/* Repair Checklist Modal */}
      <RepairChecklist
        device={safeDevice}
        isOpen={showRepairChecklist}
        onClose={() => setShowRepairChecklist(false)}
        onStatusUpdate={handleChecklistStatusUpdate}
      />
    </div>
  );
};

export default DeviceDetailPage;
