import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNavigationHistory } from '../../../hooks/useNavigationHistory';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { usePayments } from '../../../context/PaymentsContext';
import { QRCodeSVG } from 'qrcode.react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import CountdownTimer from '../../../features/shared/components/ui/CountdownTimer';
import StatusBadge from '../../../features/shared/components/ui/StatusBadge';
import { ChevronDown, CheckCircle, XCircle, Smartphone, Barcode, Calendar, Loader2, Image as ImageIcon, FileText, File as FileIcon, CreditCard, DollarSign, AlertTriangle, Star, Award, Activity, Gift, MessageSquare, Clock, User, Upload, Trash2, ArrowLeft, Phone, Printer, Send, RefreshCw, ArrowRight, Key, Wrench, Hash, Settings, History, QrCode, Stethoscope } from 'lucide-react';

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
import { formatRelativeTime } from '../../../lib/utils';
import { auditService } from '../../../lib/auditService';

const DeviceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  // All hooks must be called unconditionally before any early returns
  const { getDeviceById, updateDeviceStatus, addRemark, addRating, devices, loading: devicesLoading } = useDevices();
  const { getCustomerById } = useCustomers();
  const { payments, refreshPayments } = usePayments();
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
  // Loading state (mock, since data is synchronous in context, but for demo)
  const [loading, setLoading] = useState(true);
  
  // Preserve scroll position to prevent auto-scrolling
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentType, setPaymentType] = useState<'payment' | 'deposit' | 'refund'>('payment');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [selectedAttachmentsForDelete, setSelectedAttachmentsForDelete] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

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

  // Fetch all device activity effect
  useEffect(() => {
    if (id) {
      fetchAllDeviceActivity();
      fetchDeviceDetails();
    }
  }, [id, fetchAllDeviceActivity, fetchDeviceDetails]);

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
  
  const handleStatusUpdate = (newStatus: DeviceStatus, signature: string) => {
    return updateDeviceStatus(id, newStatus, signature);
  };

  const handleChecklistStatusUpdate = (newStatus: DeviceStatus) => {
    // For checklist components that don't need signature
    updateDeviceStatus(id, newStatus, 'checklist-update');
  };
  
  const handleAddRemark = async (remark: string) => {
    await addRemark(id, remark);
    await fetchAllDeviceActivity();
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
  
  // Format date to readable format
  const formatDate = (dateString: string, showTime: boolean = false) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString(undefined, options);
    if (showTime) {
      return `${formattedDate} ${date.toLocaleTimeString()}`;
    }
    return formattedDate;
  };
  
  // Find user by ID
  const getUserById = (userId: string) => {
    // In a real app this would come from a users store/context
    const roles = {
      '1': 'Admin',
      '2': 'Customer Care',
      '3': 'Technician'
    };
    return roles[userId as keyof typeof roles] || 'Unknown';
  };

  // Helper to get device name
  const getDeviceName = (device: { brand: string; model: string }) => `${device.model}`;

  // Add payment handler
  const handleRecordPayment = async () => {
    setRecordingPayment(true);
    setPaymentError(null);
    try {
      if (!customer || !safeDevice) throw new Error('Missing customer or device');
      if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
        setPaymentError('Enter a valid amount');
        setRecordingPayment(false);
        return;
      }
      const payment = {
        id: crypto.randomUUID(),
        customer_id: customer.id,
        amount: Number(paymentAmount),
        method: paymentMethod,
        device_id: safeDevice.id,
        payment_date: new Date().toISOString(),
        payment_type: paymentType,
        status: 'completed',
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('customer_payments')
        .insert(payment);
      if (error) throw error;
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMethod('cash');
      setLastPayment(payment);
      setShowPaymentConfirmation(true);
      // Refresh payments to show the new payment
      await refreshPayments();
      toast.success('Payment recorded!');
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
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


  return (
    <>
      {/* Main Tablet-Optimized Layout */}
      <div className="p-3 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Device Header - Full Width */}
        <div className="mb-6 md:mb-8">
          <DeviceDetailHeader device={safeDevice} />
        </div>

        {/* Tablet Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Left Column - Device Info & Customer */}
          <div className="md:col-span-1 lg:col-span-1 space-y-6">
            
            {/* Device Quick Actions Card */}
            <GlassCard className="bg-gradient-to-br from-purple-500/10 to-purple-400/5">
              <h3 className="text-xl md:text-2xl font-bold text-purple-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4">
                <GlassButton
                  variant="primary"
                  icon={<Printer size={20} />}
                  className="h-12 md:h-14 text-base md:text-lg w-full justify-center"
                  onClick={handlePrintReceipt}
                >
                  Print Receipt
                </GlassButton>
                
                {currentUser.role === 'customer-care' && (
                  <GlassButton
                    variant="secondary"
                    icon={<Send size={20} />}
                    className="h-12 md:h-14 text-base md:text-lg w-full justify-center"
                    onClick={() => setShowSmsModal(true)}
                  >
                    Send SMS
                  </GlassButton>
                )}
                
                {(isAssignedTechnician || currentUser.role === 'admin') && (
                  <GlassButton
                    variant="secondary"
                    icon={<Stethoscope size={20} />}
                    className="h-12 md:h-14 text-base md:text-lg w-full justify-center"
                    onClick={() => setShowDiagnosticChecklist(true)}
                  >
                    Diagnostic
                  </GlassButton>
                )}
                
                {(isAssignedTechnician || currentUser.role === 'admin') && (
                  <GlassButton
                    variant="secondary"
                    icon={<Wrench size={20} />}
                    className="h-12 md:h-14 text-base md:text-lg w-full justify-center"
                    onClick={() => setShowRepairChecklist(true)}
                  >
                    Repair Checklist
                  </GlassButton>
                )}
              </div>
            </GlassCard>

            {/* Device Status Card */}
            <GlassCard className="bg-gradient-to-br from-indigo-500/10 to-indigo-400/5">
              <h3 className="text-xl md:text-2xl font-bold text-indigo-900 mb-6">Device Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base text-gray-600">Current Status:</span>
                  <StatusBadge status={safeDevice.status} />
                </div>
                
                {safeDevice.expectedReturnDate && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base text-gray-600">Expected Return:</span>
                      <span className="text-sm md:text-base font-medium">
                        {new Date(safeDevice.expectedReturnDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base text-gray-600">Time Remaining:</span>
                      <div className="text-sm md:text-base">
                        {getMinimalCountdown(safeDevice.expectedReturnDate)}
                      </div>
                    </div>
                  </div>
                )}
                
                {safeDevice.assignedTo && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm md:text-base text-gray-600">Assigned To:</span>
                    <span className="text-sm md:text-base font-medium">
                      {getUserName(safeDevice.assignedTo)}
                    </span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Device Barcode */}
            <DeviceBarcodeCard device={safeDevice} />
          </div>

          {/* Middle Column - Customer & Details */}
          <div className="md:col-span-1 lg:col-span-1 space-y-6">
            
            {/* Customer Information Section */}
            {(customer || dbCustomer) && (
              <GlassCard className="bg-gradient-to-br from-blue-500/10 to-blue-400/5">
                <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-6">Customer Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm md:text-base text-gray-500 mb-1">Name</p>
                    <p className="text-gray-800 text-base md:text-lg font-medium">
                      {dbCustomer?.name || customer?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm md:text-base text-gray-500 mb-1">Phone</p>
                    <p className="text-gray-800 text-base md:text-lg font-medium">
                      {dbCustomer?.phone || customer?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm md:text-base text-gray-500 mb-1">City</p>
                    <p className="text-gray-800 text-base md:text-lg font-medium">
                      {dbCustomer?.city || customer?.city || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm md:text-base text-gray-500 mb-1">Loyalty Level</p>
                    <p className="text-gray-800 text-base md:text-lg font-medium">
                      {dbCustomer?.loyaltyLevel || customer?.loyaltyLevel || 'N/A'}
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Device Information */}
            <GlassCard className="bg-gradient-to-br from-slate-500/10 to-slate-400/5">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Device Details</h3>
              <div className="space-y-4">

                <div>
                  <p className="text-sm md:text-base text-gray-500 mb-1">Model</p>
                  <p className="text-gray-800 text-base md:text-lg font-medium">{safeDevice.model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm md:text-base text-gray-500 mb-1">Serial Number</p>
                  <p className="text-gray-800 text-base md:text-lg font-medium">{safeDevice.serialNumber || 'N/A'}</p>
                </div>
                {safeDevice.unlockCode && (
                  <div>
                    <p className="text-sm md:text-base text-gray-500 mb-1">Unlock Code</p>
                    <p className="text-gray-800 text-base md:text-lg font-medium font-mono">
                      {safeDevice.unlockCode}
                    </p>
                  </div>
                )}
                {safeDevice.issueDescription && (
                  <div>
                    <p className="text-sm md:text-base text-gray-500 mb-1">Issue Description</p>
                    <p className="text-gray-800 text-base md:text-lg">
                      {safeDevice.issueDescription}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Payments & Actions */}
          <div className="md:col-span-2 lg:col-span-1 space-y-6">
            
            {/* Payments Section - Tablet Optimized */}
            {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
              <GlassCard className="bg-gradient-to-br from-green-500/10 to-green-400/5">
                <h3 className="text-xl md:text-2xl font-bold text-green-900 mb-6">Payments</h3>
                
                {devicePayments.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <CreditCard className="w-16 h-16 md:w-20 md:h-20 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-700 text-base md:text-lg">No payments recorded for this device.</div>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {devicePayments.map((p: any) => (
                      <div key={p.id} className="bg-white rounded-xl border border-green-200 p-4 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                            <span className="font-bold text-green-700 text-xl md:text-2xl">
                              {formatCurrency(p.amount)}
                            </span>
                          </div>
                          <span className="text-sm md:text-base text-gray-500 capitalize bg-gray-100 px-3 py-1 rounded-full">
                            {p.method}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm md:text-base">
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <p className="font-medium capitalize">
                              {p.payment_type === 'payment' ? 'Payment' : p.payment_type === 'deposit' ? 'Deposit' : 'Refund'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <p className="font-medium capitalize">{p.status}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-sm md:text-base text-gray-500">
                          {p.payment_date ? formatRelativeTime(p.payment_date) : ''}
                          {p.created_by && (
                            <span className="ml-2 text-blue-700">by {getUserName(p.created_by)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="bg-green-50 rounded-xl p-4 md:p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-green-900 font-semibold text-base md:text-lg">Total Paid:</span>
                    <span className="text-green-700 font-bold text-xl md:text-2xl">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  {invoiceTotal > 0 && outstanding !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-amber-900 font-semibold text-base md:text-lg">Outstanding:</span>
                      <span className="text-amber-700 font-bold text-xl md:text-2xl">
                        {formatCurrency(outstanding)}
                      </span>
                    </div>
                  )}
                </div>
                
                {currentUser.role === 'customer-care' || currentUser.role === 'admin' ? (
                  <GlassButton
                    variant="primary"
                    icon={<CreditCard size={20} />}
                    className="mt-6 h-12 md:h-14 w-full text-base md:text-lg justify-center"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    Record Payment
                  </GlassButton>
                ) : (
                  <div className="mt-6">
                    <GlassButton
                      variant="primary"
                      icon={<CreditCard size={20} />}
                      className="opacity-50 cursor-not-allowed h-12 md:h-14 w-full text-base md:text-lg justify-center"
                      disabled
                    >
                      Record Payment
                    </GlassButton>
                    <div className="text-sm md:text-base text-gray-500 mt-3 text-center">
                      Only customer care can record payments.
                    </div>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Status Update Section */}
            {(isAssignedTechnician || currentUser.role === 'admin') && (
              <GlassCard className="bg-gradient-to-br from-orange-500/10 to-orange-400/5">
                <h3 className="text-xl md:text-2xl font-bold text-orange-900 mb-6">Update Status</h3>
                <StatusUpdateForm
                  device={safeDevice}
                  onStatusUpdate={handleStatusUpdate}
                />
              </GlassCard>
            )}

            {/* Technician Assignment */}
            {currentUser.role === 'admin' && (
              <GlassCard className="bg-gradient-to-br from-purple-500/10 to-purple-400/5">
                <h3 className="text-xl md:text-2xl font-bold text-purple-900 mb-6">Assign Technician</h3>
                <AssignTechnicianForm 
                  deviceId={safeDevice.id}
                  currentTechId={safeDevice.assignedTo}
                  currentUser={currentUser}
                />
              </GlassCard>
            )}
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="mt-8 space-y-8">
          
          {/* Device Timeline & Activity - Full Width for tablets */}
          <GlassCard className="bg-gradient-to-br from-gray-500/10 to-gray-400/5">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Device Timeline</h3>
            
            {timelineLoading ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading activity...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status Timeline */}
                <div className="space-y-4">
                  {getTimelineEvents().length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No status changes recorded yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getTimelineEvents().slice(0, 6).map((event, index) => (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start gap-3">
                            {event.icon}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {event.typeLabel}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatRelativeTime(event.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                              {event.durationLabel && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  Duration: {event.durationLabel}
                                </span>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                by {getUserName(event.user)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Attachments Section */}
          <GlassCard className="bg-gradient-to-br from-amber-500/10 to-amber-400/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-amber-900 mb-4 md:mb-0">Attachments</h3>
              
              {(currentUser.role === 'admin' || currentUser.role === 'customer-care' || isAssignedTechnician) && (
                <div className="flex gap-3">
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
                      icon={<Upload size={20} />}
                      className="h-12 md:h-14 px-6 text-base md:text-lg"
                      disabled={attachmentsLoading}
                    >
                      Upload Files
                    </GlassButton>
                  </label>
                  
                  {selectedAttachmentsForDelete.length > 0 && (
                    <GlassButton
                      variant="secondary"
                      icon={<Trash2 size={20} />}
                      className="h-12 md:h-14 px-6 text-base md:text-lg"
                      onClick={() => setShowBulkDeleteModal(true)}
                    >
                      Delete ({selectedAttachmentsForDelete.length})
                    </GlassButton>
                  )}
                </div>
              )}
            </div>

            {uploadProgress !== null && (
              <div className="mb-4">
                <div className="bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-600 mt-1">Uploading... {uploadProgress}%</p>
              </div>
            )}

            {attachmentsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {attachmentsError}
              </div>
            )}

            {attachments.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Upload className="w-16 h-16 md:w-20 md:h-20 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-700 text-base md:text-lg">No attachments uploaded yet.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attachments.map((att) => (
                  <div key={att.id} className="bg-white rounded-lg border border-amber-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {getFilePreview(att)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{att.file_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {att.uploaded_at ? formatRelativeTime(att.uploaded_at) : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          by {getUserName(att.uploaded_by)}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <a 
                            href={att.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            View
                          </a>
                          {(currentUser.role === 'admin' || att.uploaded_by === currentUser.id) && att.type !== 'invoice' && (
                            <button
                              onClick={() => toggleAttachmentSelection(att.id)}
                              className={`text-xs px-2 py-1 rounded ${
                                selectedAttachmentsForDelete.includes(att.id)
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {selectedAttachmentsForDelete.includes(att.id) ? 'Selected' : 'Select'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Warranty Information */}
          {hasWarrantyData() && (
            <GlassCard className="bg-gradient-to-br from-cyan-500/10 to-cyan-400/5">
              <h3 className="text-xl md:text-2xl font-bold text-cyan-900 mb-6">Warranty Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm md:text-base text-gray-500 mb-1">Status</p>
                  <p className="text-gray-800 text-base md:text-lg font-medium">{warrantyInfo.status}</p>
                </div>
                {warrantyInfo.startDate && (
                  <div>
                    <p className="text-sm md:text-base text-gray-500 mb-1">Start Date</p>
                    <p className="text-gray-800 text-base md:text-lg font-medium">
                      {new Date(warrantyInfo.startDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {warrantyInfo.endDate && (
                  <div>
                    <p className="text-sm md:text-base text-gray-500 mb-1">End Date</p>
                    <p className="text-gray-800 text-base md:text-lg font-medium">
                      {new Date(warrantyInfo.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Device Repair History */}
          {hasRepairHistory() && (
            <GlassCard className="bg-gradient-to-br from-rose-500/10 to-rose-400/5">
              <h3 className="text-xl md:text-2xl font-bold text-rose-900 mb-6">Previous Repairs</h3>
              <div className="space-y-4">
                {deviceHistory.slice(0, 3).map((historyDevice) => (
                  <div key={historyDevice.id} className="bg-white rounded-lg border border-rose-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Date:</span>
                        <p className="font-medium">{new Date(historyDevice.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <StatusBadge status={historyDevice.status} />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Customer:</span>
                        <p className="font-medium">{historyDevice.customerName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Issue:</span>
                        <p className="text-sm">{historyDevice.issueDescription || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
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

      {/* Payment Modal - Tablet Optimized */}
      <Modal 
        isOpen={showPaymentModal} 
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentAmount('');
          setPaymentMethod('cash');
          setPaymentType('payment');
          setPaymentError(null);
        }} 
        title="Record Payment" 
        maxWidth="700px"
      >
        <form
          onSubmit={async e => {
            e.preventDefault();
            await handleRecordPayment();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-700 mb-3 font-semibold text-base md:text-lg">Amount</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                step="0.01"
                min="0"
                className="w-full py-4 px-6 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base md:text-lg"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-3 font-semibold text-base md:text-lg">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as 'cash' | 'card' | 'transfer')}
                className="w-full py-4 px-6 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base md:text-lg"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-3 font-semibold text-base md:text-lg">Payment Type</label>
              <select
                value={paymentType}
                onChange={e => setPaymentType(e.target.value as 'payment' | 'deposit' | 'refund')}
                className="w-full py-4 px-6 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base md:text-lg"
              >
                <option value="payment">Payment</option>
                <option value="deposit">Deposit</option>
                <option value="refund">Refund</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 md:p-6">
            <h4 className="font-semibold text-base md:text-lg text-gray-800 mb-3">Payment Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{dbCustomer?.name || customer?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Device:</span>
                <span className="font-medium">{safeDevice.brand} {safeDevice.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-lg">{paymentAmount ? formatCurrency(Number(paymentAmount)) : '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium capitalize">{paymentMethod}</span>
              </div>
            </div>
          </div>

          {paymentError && (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-base md:text-lg">
              {paymentError}
            </div>
          )}

          <div className="flex gap-4 justify-end mt-6">
            <GlassButton 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowPaymentModal(false);
                setPaymentAmount('');
                setPaymentMethod('cash');
                setPaymentType('payment');
                setPaymentError(null);
              }}
              className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg"
            >
              Cancel
            </GlassButton>
            <GlassButton 
              type="submit" 
              variant="primary" 
              disabled={recordingPayment}
              className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg"
            >
              {recordingPayment ? 'Recording...' : 'Record Payment'}
            </GlassButton>
          </div>
        </form>
      </Modal>

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