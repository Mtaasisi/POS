import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNavigationHistory } from '../../../hooks/useNavigationHistory';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { usePayments } from '../../../context/PaymentsContext';
import StatusBadge from '../../../features/shared/components/ui/StatusBadge';
import { CheckCircle, Smartphone, Loader2, FileText, File as FileIcon, CreditCard, DollarSign, AlertTriangle, Star, Award, Activity, MessageSquare, Clock, User, Upload, ArrowLeft, Printer, Send, RefreshCw, ArrowRight, Wrench, History, Stethoscope, Zap, X, Info, Package, Layers, CheckCircle2, Download, BarChart3, TrendingUp, PieChart, LineChart, Users, Award as AwardIcon } from 'lucide-react';

import DiagnosticChecklist from '../../../features/diagnostics/components/DiagnosticChecklist';
import RepairChecklist from '../components/RepairChecklist';
import PrintableSlip from '../components/PrintableSlip';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { DeviceStatus } from '../../../types';
import { smsService, logManualSMS } from '../../../services/smsService';
import Modal from '../../../features/shared/components/ui/Modal';
import { uploadAttachment, listAttachments, deleteAttachment } from '../../../lib/attachmentsApi';
import { logAuditAction } from '../../../lib/auditLogApi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { formatCurrency } from '../../../lib/customerApi';
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
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tab change handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

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
  
  // Try to get invoice total from attachments (if any invoice has an amount in file_name, e.g., 'invoice-1234-amount-500.pdf')
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
        // Points transactions
        const { data: points, error: pointsError } = await supabase
          .from('points_transactions')
          .select('*')
          .eq('device_id', safeDevice.id);
        // SMS logs
        const { data: sms, error: smsError } = await supabase
          .from('sms_logs')
          .select('*')
          .eq('device_id', safeDevice.id);
        if (isMounted) {
          setAuditLogs(logs || []);
          setPointsTransactions(points || []);
          setSmsLogs(sms || []);
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
      <div className="p-8 text-center">
        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading device details...</p>
      </div>
    );
  }

  // Check if device is not found
  if (!device && !devicesLoading) {
    // Check if this is a technician trying to access a device not assigned to them
    const isTechnician = currentUser?.role === 'technician';
    
    return (
      <div className="p-8 text-center">
        {isTechnician ? (
          <>
            <div className="text-red-500 font-bold text-lg mb-4">Access Restricted</div>
            <p className="text-gray-600 mb-4">You can only view devices assigned to you.</p>
            <p className="text-sm text-gray-500 mb-6">If you believe this is an error, please contact your administrator.</p>
          </>
        ) : (
          <>
            <div className="text-red-500 font-bold text-lg mb-4">Device Not Found</div>
            <p className="text-gray-600 mb-4">The device with ID "{id}" could not be found.</p>
          </>
        )}
        <div className="space-y-2">
          <GlassButton
            variant="secondary"
            onClick={() => navigate('/devices')}
            icon={<ArrowLeft size={16} />}
          >
            Back to Devices
          </GlassButton>
          {!isTechnician && (
            <GlassButton
              variant="primary"
              onClick={() => window.location.reload()}
              icon={<RefreshCw size={16} />}
            >
              Retry Loading
            </GlassButton>
          )}
        </div>
      </div>
    );
  }
  
  const customer = getCustomerById(safeDevice.customerId);

  // Helper: get file type icon/preview
  const getFilePreview = (att: any) => {
    const ext = att.file_name.split('.').pop()?.toLowerCase();
    if (att.file_url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return <img src={att.file_url} alt={att.file_name} className="w-10 h-10 object-cover rounded shadow" />;
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
          details: { fileName: newAtt.file_name, deviceId: id }
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
      await deleteAttachment(deleteTarget.id, deleteTarget.file_url);
      setAttachments(prev => prev.filter(att => att.id !== deleteTarget.id));
      setShowDeleteModal(false);
      if (currentUser) {
        await logAuditAction({
          userId: currentUser.id,
          action: 'delete',
          entityType: 'attachment',
          entityId: deleteTarget.id,
          details: { fileName: deleteTarget.file_name, deviceId: id }
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
        await deleteAttachment(att.id, att.file_url);
        if (currentUser) {
          await logAuditAction({
            userId: currentUser.id,
            action: 'delete',
            entityType: 'attachment',
            entityId: att.id,
            details: { fileName: att.file_name, deviceId: id }
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

  // Calculate invoice total from attachments (if any invoice has an amount in file_name, e.g., 'invoice-1234-amount-500.pdf')
  let invoiceTotal = 0;
  invoiceAttachments.forEach(att => {
    const match = att.file_name.match(/amount[-_](\d+)/i);
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
        const { error: balanceError } = await supabase
          .from('finance_accounts')
          .update({ 
            balance: supabase.raw(`balance + ${payment.amount}`),
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
        description: `Attachment uploaded: ${att.file_name}`,
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


  return (
    <>
      {/* Modal-style Layout - Purchase Order Style */}
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
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    {safeDevice.brand} {safeDevice.model}
                  </h2>
                </div>
                <p className="text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                    <Clock className="w-4 h-4" />
                    <span className="capitalize">{safeDevice.status.replace('-', ' ')}</span>
                  </span>
                  <span className="ml-2">Serial: {safeDevice.serialNumber}</span>
                </p>
              </div>
            </div>
            <button 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => navigate('/devices')}
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
                {/* Financial Overview - Enhanced Design */}
                <div className="mb-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Paid</div>
                      <div className="text-xl font-bold text-emerald-900">{formatCurrency(totalPaid)}</div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Status</div>
                      <div className="text-xl font-bold text-blue-900 capitalize">{safeDevice.status.replace('-', ' ')}</div>
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
                          <p className="text-sm font-medium text-gray-900">{safeDevice.brand}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Model</span>
                          <p className="text-sm font-medium text-gray-900">{safeDevice.model}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Serial Number</span>
                          <p className="text-sm font-medium text-gray-900 font-mono">{safeDevice.serialNumber}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                          <StatusBadge status={safeDevice.status} />
                        </div>
                        {safeDevice.unlockCode && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Unlock Code</span>
                            <p className="text-sm font-medium text-gray-900 font-mono">{safeDevice.unlockCode}</p>
                          </div>
                        )}
                        {safeDevice.expectedReturnDate && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Expected Return</span>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(safeDevice.expectedReturnDate).toLocaleDateString()}
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
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Name</span>
                          <p className="text-sm font-medium text-gray-900">{dbCustomer?.name || customer?.name || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Phone</span>
                          <p className="text-sm font-medium text-gray-900">{dbCustomer?.phone || customer?.phone || 'N/A'}</p>
                        </div>
                        {currentUser.role !== 'technician' && (
                          <>
                            <div className="space-y-1">
                              <span className="text-xs text-gray-500 uppercase tracking-wide">City</span>
                              <p className="text-sm font-medium text-gray-900">{dbCustomer?.city || customer?.city || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-gray-500 uppercase tracking-wide">Loyalty Level</span>
                              <p className="text-sm font-medium text-gray-900">{dbCustomer?.loyaltyLevel || customer?.loyaltyLevel || 'N/A'}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
                      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <h3 className="text-sm font-semibold text-gray-800">Financial Summary</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Total Paid</span>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                          </div>
                          {outstanding !== null && (
                            <div className="space-y-1">
                              <span className="text-xs text-gray-500 uppercase tracking-wide">Outstanding</span>
                              <p className="text-lg font-bold text-orange-600">{formatCurrency(outstanding)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Issue Description */}
                    {safeDevice.issueDescription && (
                      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <h3 className="text-sm font-semibold text-gray-800">Issue Description</h3>
                        </div>
                        <p className="text-sm text-gray-700">{safeDevice.issueDescription}</p>
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
                        {(isAssignedTechnician || currentUser.role === 'admin') && (
                          <button 
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                            onClick={() => setShowDiagnosticChecklist(true)}
                          >
                            <Stethoscope className="w-4 h-4" />
                            Diagnostic
                          </button>
                        )}
                        
                        {(isAssignedTechnician || currentUser.role === 'admin') && (
                          <button 
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                            onClick={() => setShowRepairChecklist(true)}
                          >
                            <Wrench className="w-4 h-4" />
                            Repair Checklist
                          </button>
                        )}

                        {currentUser.role === 'customer-care' && (
                          <button 
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                            onClick={() => setShowSmsModal(true)}
                          >
                            <Send className="w-4 h-4" />
                            Send SMS
                          </button>
                        )}

                        {(currentUser.role === 'customer-care' || currentUser.role === 'admin') && (
                          <button 
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm"
                            onClick={() => {
                              if (!paymentAmount) {
                                setPaymentAmount('0');
                              }
                              setShowPaymentModal(true);
                            }}
                          >
                            <CreditCard className="w-4 h-4" />
                            Record Payment
                          </button>
                        )}
                      </div>

                      {/* Secondary Actions */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2">
                          {currentUser.role !== 'technician' && (
                            <button 
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                              onClick={handlePrintReceipt}
                            >
                              <Printer className="w-4 h-4" />
                              Print
                            </button>
                          )}
                          <button className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm">
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
                        
                        {isAssignedTechnician && (
                          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-2xl font-bold text-green-600">
                              {workTimer.sessions.reduce((total, session) => total + (session.duration || 0), 0)}m
                            </div>
                            <div className="text-xs text-green-700 uppercase tracking-wide">Time Spent</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Repair Tab */}
            {activeTab === 'repair' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Repair Management</h3>
                  <p className="text-gray-600">Repair tools and checklists will be displayed here.</p>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
                  <p className="text-gray-600">Payment information and history will be displayed here.</p>
                </div>
              </div>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Device Files</h3>
                  <p className="text-gray-600">File attachments and documents will be displayed here.</p>
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Device Timeline</h3>
                  </div>
                  
                  {timelineLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading timeline...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getTimelineEvents().length > 0 ? (
                        getTimelineEvents().map((event, index) => (
                          <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Activity className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  Status: {event.fromStatus} → {event.toStatus}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {formatRelativeTime(event.timestamp)}
                                </span>
                              </div>
                              {event.duration && (
                                <p className="text-xs text-gray-600">
                                  Duration: {event.duration}
                                </p>
                              )}
                              {event.userName && (
                                <p className="text-xs text-gray-600">
                                  By: {event.userName}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No timeline events found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Status Duration Analytics */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Status Duration Analytics</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Duration Chart */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Time Spent in Each Status</h4>
                      <div className="space-y-3">
                        {allTransitions.map((transition, index) => {
                          const duration = transition.duration ? Math.round(transition.duration / (1000 * 60 * 60)) : 0; // Convert to hours
                          const maxDuration = Math.max(...allTransitions.map(t => t.duration ? Math.round(t.duration / (1000 * 60 * 60)) : 0));
                          const percentage = maxDuration > 0 ? (duration / maxDuration) * 100 : 0;
                          
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">
                                  {transition.from_status} → {transition.to_status}
                                </span>
                                <span className="text-gray-500">{duration}h</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Summary Stats */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Repair Summary</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Time</span>
                          </div>
                          <div className="text-xl font-bold text-blue-900">
                            {allTransitions.reduce((total, t) => total + (t.duration || 0), 0) > 0 
                              ? Math.round(allTransitions.reduce((total, t) => total + (t.duration || 0), 0) / (1000 * 60 * 60)) + 'h'
                              : 'N/A'
                            }
                          </div>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Status Changes</span>
                          </div>
                          <div className="text-xl font-bold text-green-900">{allTransitions.length}</div>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Technicians</span>
                          </div>
                          <div className="text-xl font-bold text-purple-900">
                            {new Set(allTransitions.map(t => t.user_id).filter(Boolean)).size}
                          </div>
                        </div>
                        
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <AwardIcon className="w-4 h-4 text-orange-600" />
                            <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">Current Progress</span>
                          </div>
                          <div className="text-xl font-bold text-orange-900">{getRepairProgress()}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <LineChart className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Performance Metrics</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Average Status Duration */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Average Status Duration</h4>
                      <div className="space-y-2">
                        {['diagnosis-started', 'in-repair', 'reassembled-testing'].map(status => {
                          const statusTransitions = allTransitions.filter(t => t.to_status === status);
                          const avgDuration = statusTransitions.length > 0 
                            ? statusTransitions.reduce((sum, t) => sum + (t.duration || 0), 0) / statusTransitions.length
                            : 0;
                          
                          return (
                            <div key={status} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-600 capitalize">{status.replace('-', ' ')}</span>
                              <span className="text-sm font-medium text-gray-900">
                                {avgDuration > 0 ? Math.round(avgDuration / (1000 * 60 * 60)) + 'h' : 'N/A'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Efficiency Metrics */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Efficiency Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Repair Speed</span>
                          <span className="text-sm font-medium text-green-600">
                            {allTransitions.length > 0 ? 'Good' : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Status Changes</span>
                          <span className="text-sm font-medium text-blue-600">{allTransitions.length}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Completion Rate</span>
                          <span className="text-sm font-medium text-purple-600">
                            {safeDevice.status === 'done' ? '100%' : getRepairProgress() + '%'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Device Type Analysis */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Device Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Brand</span>
                          <span className="text-sm font-medium text-gray-900">{safeDevice.brand}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Model</span>
                          <span className="text-sm font-medium text-gray-900">{safeDevice.model}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Complexity</span>
                          <span className="text-sm font-medium text-orange-600">
                            {allTransitions.length > 5 ? 'High' : allTransitions.length > 2 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Transition Flow */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Status Transition Flow</h3>
                  </div>
                  
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-4 overflow-x-auto">
                      {allTransitions.map((transition, index) => (
                        <div key={index} className="flex items-center">
                          <div className="bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 text-sm font-medium text-blue-800 whitespace-nowrap">
                            {transition.to_status.replace('-', ' ')}
                          </div>
                          {index < allTransitions.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                onClick={() => navigate('/devices')}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Devices
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button 
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
                onClick={() => navigate('/devices')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <PrintableSlip ref={printRef} device={safeDevice} />

      {/* SMS Modal: Only Customer Care can use - Tablet Optimized */}
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
                // Log the manual SMS
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
              <label className="block text-gray-700 mb-3 font-semibold text-base md:text-lg">To</label>
              <div className="py-4 px-6 bg-gray-100 rounded-lg text-base md:text-lg font-medium">
                {dbCustomer?.phone || customer?.phone || safeDevice.phoneNumber || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-3 font-semibold text-base md:text-lg">Message</label>
              <textarea
                value={smsMessage}
                onChange={e => setSmsMessage(e.target.value)}
                rows={6}
                className="w-full py-4 px-6 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base md:text-lg"
                placeholder="Type your message here"
                required
              />
              <div className="mt-2 text-sm text-gray-500">
                Character count: {smsMessage.length}/160
              </div>
            </div>
            {smsResult && (
              <div className={`p-4 rounded-lg text-base md:text-lg ${
                smsResult.startsWith('Failed') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {smsResult}
              </div>
            )}
            <div className="flex gap-4 justify-end mt-6">
              <GlassButton 
                type="button" 
                variant="secondary" 
                onClick={() => { setShowSmsModal(false); setSmsMessage(''); setSmsResult(null); }}
                className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg"
              >
                Cancel
              </GlassButton>
              <GlassButton 
                type="submit" 
                variant="primary" 
                disabled={smsSending}
                className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg"
              >
                {smsSending ? 'Sending...' : 'Send SMS'}
              </GlassButton>
            </div>
          </form>
        </Modal>
      )}

      {/* New Payments Popup Modal */}
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
        showCustomerInfo={true}
      />

      {/* Payment Confirmation Modal */}
      <Modal 
        isOpen={showPaymentConfirmation} 
        onClose={() => setShowPaymentConfirmation(false)} 
        title="Payment Recorded" 
        maxWidth="500px"
      >
        <div className="text-center py-6">
          <CheckCircle className="w-16 h-16 md:w-20 md:h-20 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl md:text-2xl font-bold text-green-800 mb-4">Payment Successfully Recorded!</h3>
          {lastPayment && (
            <div className="bg-green-50 rounded-lg p-4 md:p-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-lg">{formatCurrency(lastPayment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium capitalize">{lastPayment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(lastPayment.payment_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
          <GlassButton 
            variant="primary" 
            onClick={() => setShowPaymentConfirmation(false)}
            className="mt-6 h-12 md:h-14 px-6 md:px-8 text-base md:text-lg"
          >
            Close
          </GlassButton>
        </div>
      </Modal>

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

      {/* Bulk Delete Confirmation Modal */}
      <Modal 
        isOpen={showBulkDeleteModal} 
        onClose={() => setShowBulkDeleteModal(false)} 
        title="Delete Attachments" 
        maxWidth="500px"
      >
        <div className="space-y-6">
          <div className="text-center py-4">
            <AlertTriangle className="w-16 h-16 md:w-20 md:h-20 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
              Confirm Deletion
            </h3>
            <p className="text-base text-gray-600">
              Are you sure you want to delete {selectedAttachmentsForDelete.length} attachment(s)? 
              This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-4 justify-end">
            <GlassButton 
              type="button" 
              variant="secondary" 
              onClick={() => setShowBulkDeleteModal(false)}
              className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg"
            >
              Cancel
            </GlassButton>
            <GlassButton 
              type="button" 
              variant="primary" 
              onClick={handleBulkDeleteAttachments}
              disabled={attachmentsLoading}
              className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg bg-red-600 hover:bg-red-700"
            >
              {attachmentsLoading ? 'Deleting...' : 'Delete'}
            </GlassButton>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeviceDetailPage;