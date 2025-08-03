import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DevicesContext';
import { useCustomers } from '../context/CustomersContext';
import { usePayments } from '../context/PaymentsContext';
import { QRCodeSVG } from 'qrcode.react';
import GlassCard from '../components/ui/GlassCard';
import CountdownTimer from '../components/ui/CountdownTimer';
import StatusBadge from '../components/ui/StatusBadge';
import { ChevronDown, CheckCircle, XCircle, Smartphone, Barcode, Calendar, Loader2, Image as ImageIcon, FileText, File as FileIcon, CreditCard, DollarSign, AlertTriangle, Star, Award, Activity, Gift, MessageSquare, Clock, User, Upload, Trash2, ArrowLeft, Phone, Printer, Send, RefreshCw, ArrowRight, Key, Wrench, Hash, Settings, History, QrCode, Stethoscope } from 'lucide-react';
import DeviceDetailHeader from '../components/DeviceDetailHeader';
import StatusUpdateForm from '../components/StatusUpdateForm';
import PrintableSlip from '../components/PrintableSlip';
import AssignTechnicianForm from '../components/AssignTechnicianForm';
import DeviceBarcodeCard from '../components/DeviceBarcodeCard';
import DiagnosticChecklist from '../components/DiagnosticChecklist';
import RepairChecklist from '../components/RepairChecklist';
import GlassButton from '../components/ui/GlassButton';
import { DeviceStatus, Payment } from '../types';
import { smsService, logManualSMS } from '../services/smsService';
import Modal from '../components/ui/Modal';
import { uploadAttachment, listAttachments, deleteAttachment } from '../lib/attachmentsApi';
import { logAuditAction } from '../lib/auditLogApi';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/customerApi';
import { formatRelativeTime } from '../lib/utils';
import { auditService } from '../lib/auditService';

const DeviceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  // Only static check at the very top
  if (!id || !currentUser) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">Missing device ID or user session. Please try again.</div>
    );
  }

  // All hooks must be called unconditionally after this point
  const { getDeviceById, updateDeviceStatus, addRemark, addRating, devices } = useDevices();
  const { getCustomerById } = useCustomers();
  const navigate = useNavigate();

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
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [id, currentUser]);

  // Only attempt to get device if id is defined (id is always defined here)
  const device = getDeviceById(id);
  // Defensive: always have transitions and remarks as arrays, and required fields as non-undefined
  const safeDevice = {
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
    unlockCode: device?.unlockCode || '',
    repairCost: device?.repairCost || '',
    depositAmount: device?.depositAmount || '',
    diagnosisRequired: device?.diagnosisRequired || false,
    deviceNotes: device?.deviceNotes || '',
    deviceCost: device?.deviceCost || '',
    // Add fields for device condition assessment
    deviceCondition: device?.deviceCondition || {},
    deviceImages: device?.deviceImages || [],
    accessoriesConfirmed: device?.accessoriesConfirmed || false,
    problemConfirmed: device?.problemConfirmed || false,
    privacyConfirmed: device?.privacyConfirmed || false,
  };
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

  // Fetch attachments on load
  useEffect(() => {
    setAttachmentsLoading(true);
    setAttachmentsError(null);
    listAttachments(String(id))
      .then(setAttachments)
      .catch(e => setAttachmentsError('Failed to load attachments'))
      .finally(() => setAttachmentsLoading(false));
  }, [id]);

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

  // Mock warranty info (replace with real data integration as needed)
  const warrantyInfo = {
    status: safeDevice.warrantyStatus || 'None',
    startDate: safeDevice.warrantyStart,
    endDate: safeDevice.warrantyEnd,
    durationMonths: safeDevice.warrantyStart && safeDevice.warrantyEnd
      ? Math.round((new Date(safeDevice.warrantyEnd).getTime() - new Date(safeDevice.warrantyStart).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0,
  };

  // Device repair history (other devices with same serial number, excluding current)
  const deviceHistory = devices.filter(
    d => d.serialNumber === safeDevice.serialNumber && d.id !== safeDevice.id
  );

  // Payments for this device
  const payments = usePayments().payments.filter((p: any) => p.device_id === safeDevice.id);
  const totalPaid = payments.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  // Try to get invoice total from attachments (if any invoice has an amount in file_name, e.g., 'invoice-1234-amount-500.pdf')
  const invoiceAttachments = attachments.filter(att => att.type === 'invoice');
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
  useEffect(() => {
    if (isTechnician && !isAssignedTechnician) {
      navigate('/dashboard');
    }
  }, [isTechnician, isAssignedTechnician, navigate]);
  
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

  useEffect(() => {
    // Warranty expiry notification (30 days)
    if (warrantyInfo.endDate) {
      const now = new Date();
      const end = new Date(warrantyInfo.endDate);
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= 30) {
        toast(
          `Warranty for this device expires in ${diffDays} day${diffDays === 1 ? '' : 's'}!`,
          { icon: '⚠️', id: `warranty-expiry-${safeDevice.id}` }
        );
      }
    }
  }, [warrantyInfo.endDate, safeDevice.id]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [selectedAttachmentsForDelete, setSelectedAttachmentsForDelete] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

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
        payment_type: 'payment',
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
      // The payments context will handle updating the list
      toast.success('Payment recorded!');
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  // Minimal live countdown: only two most significant units, monospace, single fading dot
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  // Animated dot state for fade in/out
  const [dotVisible, setDotVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setDotVisible(v => !v), 500);
    return () => clearInterval(interval);
  }, []);
  // Minimal countdown string: only two most significant units, with color
  const getMinimalCountdown = (dateString: string) => {
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

  // Add state for audit logs, points transactions, and SMS logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [pointsTransactions, setPointsTransactions] = useState<any[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);

  // Add state for device checklist and additional device info
  const [deviceChecklist, setDeviceChecklist] = useState<any>(null);
  const [deviceChecklistLoading, setDeviceChecklistLoading] = useState(false);
  const [dbDevice, setDbDevice] = useState<any>(null);
  const [dbDeviceLoading, setDbDeviceLoading] = useState(false);

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

  // Add at the top of DeviceDetailPage component:
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allTransitions, setAllTransitions] = useState<any[]>([]);
  const [allRemarks, setAllRemarks] = useState<any[]>([]);
  const [allRatings, setAllRatings] = useState<any[]>([]);
  const [allAttachments, setAllAttachments] = useState<any[]>([]);

  // Fetch all device activity on mount or when device ID changes
  const fetchAllDeviceActivity = async () => {
    if (!safeDevice.id) return;
    // Payments
    const { data: paymentsData } = await supabase
      .from('customer_payments')
      .select(`
        *,
        customers(name)
      `)
      .eq('device_id', safeDevice.id);
    
    // Transform payments to include customer names
    const transformedPayments = (paymentsData || []).map((payment: any) => ({
      ...payment,
      customer_name: payment.customers?.name || undefined
    }));
    setAllPayments(transformedPayments);
    // Transitions
    const { data: transitionsData } = await supabase
      .from('device_transitions')
      .select('*')
      .eq('device_id', safeDevice.id);
    setAllTransitions(transitionsData || []);
    // Remarks
    const { data: remarksData } = await supabase
      .from('device_remarks')
      .select('*')
      .eq('device_id', safeDevice.id);
    setAllRemarks(remarksData || []);
    // Ratings
    const { data: ratingsData } = await supabase
      .from('device_ratings')
      .select('*')
      .eq('device_id', safeDevice.id);
    setAllRatings(ratingsData || []);
    // Attachments
    const { data: attachmentsData } = await supabase
      .from('device_attachments')
      .select('*')
      .eq('device_id', safeDevice.id);
    setAllAttachments(attachmentsData || []);
  };

  // Fetch device checklist and additional device info
  const fetchDeviceDetails = async () => {
    if (!safeDevice.id) return;
    
    setDeviceChecklistLoading(true);
    setDbDeviceLoading(true);
    
    try {
      // Fetch device checklist - handle the actual table structure
      const { data: checklistData, error: checklistError } = await supabase
        .from('device_checklists')
        .select('*')
        .eq('device_id', safeDevice.id)
        .maybeSingle();
      
      if (checklistError) {
        console.error('Error fetching device checklist:', checklistError);
        setDeviceChecklist(null);
      } else {
        setDeviceChecklist(checklistData);
      }
      
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
  };
  useEffect(() => {
    fetchAllDeviceActivity();
    fetchDeviceDetails();
  }, [safeDevice.id]);

  // Helper: normalize all events to a common structure
  function getTimelineEvents() {
    const events: any[] = [];
    // Status transitions
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
    // Remarks
    for (const r of allRemarks) {
      const isSent = currentUser && r.created_by === currentUser.id;
      events.push({
        type: 'remark',
        typeLabel: isSent ? 'Sent Remark' : 'Incoming Remark',
        isSent,
        timestamp: r.created_at,
        user: r.created_by,
        description: r.content,
        icon: <MessageSquare className={isSent ? "h-4 w-4 text-green-600" : "h-4 w-4 text-purple-600"} />,
      });
    }
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
        user: sms.sent_by || sms.created_by || sms.provider || '',
        description: `SMS: ${sms.message || sms.message_content || ''} [${sms.status}]`,
        icon: <MessageSquare className="h-4 w-4 text-blue-400" />,
      });
    }
    // Sort all events by timestamp descending
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  const [userNames, setUserNames] = useState<{ [id: string]: string }>({});

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
  }, [safeDevice, safeDevice.assignedTo, allPayments, allTransitions, allRemarks, allRatings, allAttachments, auditLogs, pointsTransactions, smsLogs]);

  // Replace getUserById with this:
  const getUserName = (userId: string) => {
    if (!userId) return 'Unknown';
    if (userNames[userId]) return userNames[userId];
    // fallback for system or provider
    if (userId === 'system') return 'System';
    return userId.slice(0, 8) + '...';
  };

  // Fetch customer info directly from Supabase
  const [dbCustomer, setDbCustomer] = useState<any>(null);
  useEffect(() => {
    async function fetchCustomer() {
      if (!safeDevice.customerId) return;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', safeDevice.customerId)
        .single();
      if (!error && data) setDbCustomer(data);
    }
    fetchCustomer();
  }, [safeDevice.customerId]);
  return (
    <div className="p-2 sm:p-4 max-w-6xl mx-auto w-full">
      {/* Highlight for failed devices */}
      {safeDevice.status === 'failed' && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-red-600/90 to-pink-500/90 text-white text-lg sm:text-xl font-bold flex flex-col gap-2 shadow-lg">
          <span>⚠️ This device was marked as <span className="underline">FAILED TO REPAIR</span></span>
          {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && safeDevice.remarks.length > 0 && (
            <div className="text-sm sm:text-base font-normal bg-white/20 rounded p-2 mt-2">
              <span className="font-semibold">Failure Reason:</span> {safeDevice.remarks[safeDevice.remarks.length-1].content}
            </div>
          )}
        </div>
      )}
      
      {/* Debug Panel - Only show for admin users */}
      {currentUser.role === 'admin' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Info (Admin Only)</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>Current User: {currentUser.name} ({currentUser.role})</div>
            <div>Device Status: {safeDevice.status}</div>
            <div>Device Assigned To: {safeDevice.assignedTo || 'None'}</div>
            <div>Is Current User Assigned: {safeDevice.assignedTo === currentUser.id ? 'Yes' : 'No'}</div>
            <div>Can Show Failed Button: {((safeDevice.status === 'in-repair' || safeDevice.status === 'assigned') && currentUser.role === 'technician' && safeDevice.assignedTo === currentUser.id) ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
      
      <div className="flex items-center mb-3 sm:mb-4 sm:mb-6">
        <Link to="/dashboard" className="mr-3 sm:mr-4 text-gray-700 hover:text-gray-900">
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
        </Link>
        <h1 className="text-lg sm:text-xl sm:text-2xl font-bold text-gray-900">Device Details</h1>
      </div>
      
      <DeviceDetailHeader device={safeDevice} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 sm:gap-6">
        {/* Left Column - Details & Checklist */}
        <div className="lg:col-span-2 space-y-2 sm:space-y-3 sm:space-y-6">
          <GlassCard>
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold text-gray-900">{getDeviceName(safeDevice)}</h1>
                  <StatusBadge status={safeDevice.status} />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
                      <Smartphone size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-600/70">Brand & Model</p>
                      <p className="text-sm sm:text-base text-gray-900 font-medium truncate">{safeDevice.brand} {safeDevice.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10">
                      <Barcode size={16} className="sm:w-[18px] sm:h-[18px] text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-purple-600/70">Serial Number</p>
                      <p className="text-sm sm:text-base text-gray-900 font-mono truncate">{safeDevice.serialNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  {/* IMEI Number - if different from Serial Number */}
                  {dbDevice?.imei && dbDevice.imei !== safeDevice.serialNumber && (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/10">
                        <Hash size={16} className="sm:w-[18px] sm:h-[18px] text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-cyan-600/70">IMEI Number</p>
                        <p className="text-sm sm:text-base text-gray-900 font-mono truncate">{dbDevice.imei}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10">
                      <Calendar size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-600/70">Date Received</p>
                      <p className="text-sm sm:text-base text-gray-900 font-mono">{formatDate(safeDevice.createdAt || new Date().toISOString())}</p>
                    </div>
                  </div>
                  {/* Est. Completion - Match Date Received Design, with date and time */}
                  <div className="flex items-center gap-2 mt-2 mb-1">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10">
                      <Calendar size={16} className="sm:w-[18px] sm:h-[18px] text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-600/70">Est. Completion</p>
                      {safeDevice.expectedReturnDate ? (
                        <>
                          <p className="text-sm sm:text-base text-gray-900 font-mono font-semibold">{getMinimalCountdown(safeDevice.expectedReturnDate)}</p>
                          <p className="text-xs text-gray-500">{formatDate(safeDevice.expectedReturnDate, true)}</p>
                        </>
                      ) : (
                        <p className="italic text-gray-400 text-sm">N/A</p>
                      )}
                    </div>
                  </div>
                  {/* Device Issue Section - Compact Version (moved below Est. Completion) */}
                  <div className="mt-2 mb-1">
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100 shadow-sm">
                      <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px] text-rose-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-rose-700 mr-1">Device Issue:</span>
                        <span className="text-xs text-gray-900 font-medium break-words leading-relaxed">
                          {safeDevice.issueDescription || <span className="italic text-gray-400">No issue description provided.</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            

            </div>
            

          </GlassCard>

          {/* Status Update Card - Moved from right column */}
          <GlassCard>
            {safeDevice.status === 'failed' ? (
              <div className="text-center text-base sm:text-lg text-red-700 font-semibold p-4 sm:p-6">No further actions are allowed for devices marked as failed to repair.</div>
            ) : (
              (currentUser.role === 'admin') && safeDevice.status === 'assigned' ? (
                <AssignTechnicianForm 
                  deviceId={safeDevice.id} 
                  currentTechId={safeDevice.assignedTo}
                  currentUser={currentUser}
                />
              ) : (
                <StatusUpdateForm
                  device={safeDevice}
                  currentUser={currentUser}
                  onUpdateStatus={handleStatusUpdate}
                  onAddRemark={handleAddRemark}
                  onAddRating={safeDevice.assignedTo ? 
                    (score, comment) => addRating(safeDevice.id, safeDevice.assignedTo!, score, comment)
                    : undefined
                  }
                  outstanding={typeof outstanding === 'number' ? outstanding : undefined}
                />
              )
            )}
          </GlassCard>
          
          {/* Device Intake Details Section */}
          <GlassCard className="bg-gradient-to-br from-indigo-500/10 to-indigo-400/5">
            <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-indigo-900 mb-3 sm:mb-4">Device Intake Details</h3>
            {dbDeviceLoading ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <Loader2 className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                <span className="ml-2 text-indigo-700 text-sm sm:text-base">Loading device details...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Unlock Code */}
                {dbDevice?.unlock_code && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-500/10">
                      <Key size={16} className="sm:w-[18px] sm:h-[18px] text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-indigo-600/70">Unlock Code</p>
                      <p className="text-sm sm:text-base text-gray-900 font-mono truncate">{dbDevice.unlock_code}</p>
                    </div>
                  </div>
                )}
                
                {/* Estimated Repair Cost */}
                {dbDevice?.repair_cost && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                      <DollarSign size={16} className="sm:w-[18px] sm:h-[18px] text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-600/70">Est. Repair Cost</p>
                      <p className="text-sm sm:text-base text-gray-900 font-semibold">{formatCurrency(parseFloat(dbDevice.repair_cost))}</p>
                    </div>
                  </div>
                )}
                
                {/* Deposit Amount */}
                {dbDevice?.deposit_amount && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10">
                      <CreditCard size={16} className="sm:w-[18px] sm:h-[18px] text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-600/70">Deposit Amount</p>
                      <p className="text-sm sm:text-base text-gray-900 font-semibold">{formatCurrency(parseFloat(dbDevice.deposit_amount))}</p>
                    </div>
                  </div>
                )}
                
                {/* Device Cost */}
                {dbDevice?.device_cost && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10">
                      <DollarSign size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-600/70">Device Cost</p>
                      <p className="text-sm sm:text-base text-gray-900 font-semibold">{formatCurrency(parseFloat(dbDevice.device_cost))}</p>
                    </div>
                  </div>
                )}
                
                {/* Diagnosis Required */}
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10">
                    <Wrench size={16} className="sm:w-[18px] sm:h-[18px] text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-600/70">Diagnosis Required</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">
                      {dbDevice?.diagnosis_required ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Device Notes */}
            {!dbDeviceLoading && dbDevice?.device_notes && (
              <div className="mt-3 sm:mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="sm:w-[18px] sm:h-[18px] text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">Device Notes</span>
                </div>
                <div className="p-2 sm:p-3 bg-white/50 rounded-lg border border-gray-200">
                  <p className="text-gray-800 text-sm">{dbDevice.device_notes}</p>
                </div>
              </div>
            )}
            
            {/* Intake Confirmations */}
            {!dbDeviceLoading && (
              <div className="mt-3 sm:mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                <div className={`p-2 sm:p-3 rounded-lg border ${dbDevice?.accessories_confirmed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="sm:w-4 sm:h-4 ${dbDevice?.accessories_confirmed ? 'text-green-600' : 'text-gray-400'}" />
                    <span className="text-xs sm:text-sm font-medium">Accessories Confirmed</span>
                  </div>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg border ${dbDevice?.problem_confirmed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="sm:w-4 sm:h-4 ${dbDevice?.problem_confirmed ? 'text-green-600' : 'text-gray-400'}" />
                    <span className="text-xs sm:text-sm font-medium">Problem Confirmed</span>
                  </div>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg border ${dbDevice?.privacy_confirmed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="sm:w-4 sm:h-4 ${dbDevice?.privacy_confirmed ? 'text-green-600' : 'text-gray-400'}" />
                    <span className="text-xs sm:text-sm font-medium">Privacy Confirmed</span>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
          
          {/* Device Condition Assessment Section */}
          {dbDevice?.device_condition && Object.keys(dbDevice.device_condition).length > 0 && (
            <GlassCard className="bg-gradient-to-br from-orange-500/10 to-orange-400/5">
              <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-orange-900 mb-3 sm:mb-4">Device Condition Assessment</h3>
              {dbDeviceLoading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Loader2 className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  <span className="ml-2 text-orange-700 text-sm sm:text-base">Loading condition assessment...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {Object.entries(dbDevice.device_condition).map(([condition, value]) => (
                    <div key={condition} className={`p-2 sm:p-3 rounded-lg border ${value ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {value ? (
                          <AlertTriangle size={14} className="sm:w-4 sm:h-4 text-orange-600" />
                        ) : (
                          <CheckCircle size={14} className="sm:w-4 sm:h-4 text-gray-400" />
                        )}
                        <span className="text-xs sm:text-sm font-medium capitalize">
                          {condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}
          
          {/* Device Checklist Section */}
          {deviceChecklist && (
            <GlassCard className="bg-gradient-to-br from-teal-500/10 to-teal-400/5">
              <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-teal-900 mb-3 sm:mb-4">Device Checklist</h3>
              {deviceChecklistLoading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Loader2 className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
                  <span className="ml-2 text-teal-700 text-sm sm:text-base">Loading checklist...</span>
                </div>
              ) : (
                <div>
                  {/* Checklist Type and Completion Info */}
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-teal-800">Checklist Type:</span>
                        <span className="ml-2 text-teal-700 capitalize text-xs sm:text-sm">{deviceChecklist.checklist_type || 'General'}</span>
                      </div>
                      {deviceChecklist.completed_by && (
                        <div className="text-xs text-teal-600">
                          Completed by: {getUserName(deviceChecklist.completed_by)}
                        </div>
                      )}
                      {deviceChecklist.completed_at && (
                        <div className="text-xs text-teal-600">
                          {formatDate(deviceChecklist.completed_at)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Checklist Items */}
                  {deviceChecklist.items && Array.isArray(deviceChecklist.items) && deviceChecklist.items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {deviceChecklist.items.map((item: any, index: number) => (
                        <div key={index} className={`p-2 sm:p-3 rounded-lg border ${item.checked ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center gap-2">
                            {item.checked ? (
                              <CheckCircle size={14} className="sm:w-4 sm:h-4 text-teal-600" />
                            ) : (
                              <XCircle size={14} className="sm:w-4 sm:h-4 text-gray-400" />
                            )}
                            <span className="text-xs sm:text-sm font-medium capitalize">
                              {item.name || `Item ${index + 1}`}
                            </span>
                          </div>
                          {item.notes && (
                            <div className="mt-1 text-xs text-gray-600">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">No checklist items found</div>
                  )}
                </div>
              )}
            </GlassCard>
          )}
          
          {/* Device Images Section */}
          {dbDevice?.device_images && dbDevice.device_images.length > 0 && (
            <GlassCard className="bg-gradient-to-br from-pink-500/10 to-pink-400/5">
              <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-pink-900 mb-3 sm:mb-4">Device Images</h3>
              {dbDeviceLoading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Loader2 className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-pink-600" />
                  <span className="ml-2 text-pink-700 text-sm sm:text-base">Loading device images...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {dbDevice.device_images.map((image: string, index: number) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Device image ${index + 1}`}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200 hover:border-pink-300 transition-colors"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <button 
                          onClick={() => window.open(image, '_blank')}
                          className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 p-1.5 sm:p-2 rounded-full transition-all"
                        >
                          <ImageIcon size={14} className="sm:w-4 sm:h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}
          
          {/* Warranty Information Section */}
          {hasWarrantyData() && (
            <GlassCard className="bg-gradient-to-br from-green-500/10 to-green-400/5">
              <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-green-900 mb-2">Warranty Information</h3>
              <div className="flex flex-col gap-1 sm:gap-2 text-green-900 text-sm sm:text-base">
                <div><span className="font-semibold">Status:</span> {warrantyInfo.status}</div>
                <div><span className="font-semibold">Start Date:</span> {formatDate(warrantyInfo.startDate)}</div>
                <div><span className="font-semibold">End Date:</span> {formatDate(warrantyInfo.endDate)}</div>
                <div><span className="font-semibold">Duration:</span> {warrantyInfo.durationMonths} months</div>
              </div>
            </GlassCard>
          )}

          {/* Device Repair History Section */}
          {hasRepairHistory() && (
            <GlassCard className="bg-gradient-to-br from-blue-500/10 to-blue-400/5">
              <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-blue-900 mb-2">Device Repair History</h3>
              <ul className="divide-y divide-blue-200 overflow-x-auto">
                {deviceHistory.map((d) => (
                  <li key={d.id} className="py-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="font-semibold text-sm sm:text-base">{d.brand} {d.model}</span> — <span className="text-xs sm:text-sm">{d.issueDescription || 'No issue description'}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-blue-700">{formatDate(d.createdAt)}</div>
                    </div>
                    <div className="text-xs text-blue-600">Status: {d.status}</div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {/* Invoices Section */}
          {hasInvoices() && (
            <GlassCard className="bg-gradient-to-br from-amber-500/10 to-amber-400/5">
              <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-amber-900 mb-2">Invoices</h3>
              <ul className="divide-y divide-amber-200 overflow-x-auto">
                {attachments.filter(att => att.type === 'invoice').map(att => (
                  <li key={att.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {getFilePreview(att)}
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="text-amber-700 underline break-all text-sm">{att.file_name}</a>
                    </div>
                    <GlassButton
                      className="ml-4"
                      variant="danger"
                      size="sm"
                      icon={<XCircle size={14} className="sm:w-4 sm:h-4" />}
                      onClick={() => handleRemoveAttachment(att)}
                      disabled={attachmentsLoading}
                    >Remove</GlassButton>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {/* Attachments Delete Card */}
          {hasAttachments() && (currentUser.role === 'admin' || currentUser.role === 'customer-care' || currentUser.role === 'technician') && (
            <GlassCard className="bg-gradient-to-br from-red-500/10 to-red-400/5 border border-red-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 rounded-full bg-red-500/20">
                    <XCircle size={18} className="sm:w-5 sm:h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-red-900">Delete Attachments</h3>
                    <p className="text-xs sm:text-sm text-red-700">Manage and remove device attachments</p>
                  </div>
                </div>
                {selectedAttachmentsForDelete.length > 0 && (
                  <GlassButton
                    variant="danger"
                    size="sm"
                    icon={<XCircle size={14} className="sm:w-4 sm:h-4" />}
                    onClick={() => setShowBulkDeleteModal(true)}
                    disabled={attachmentsLoading}
                  >
                    Delete Selected ({selectedAttachmentsForDelete.length})
                  </GlassButton>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm text-red-800">
                  <span className="font-semibold">Total Attachments:</span> {attachments.filter(att => att.type !== 'invoice').length}
                  {selectedAttachmentsForDelete.length > 0 && (
                    <span className="text-red-600 font-medium">
                      {selectedAttachmentsForDelete.length} selected
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {attachments.filter(att => att.type !== 'invoice').map(att => (
                    <div key={att.id} className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-all duration-200 ${
                      selectedAttachmentsForDelete.includes(att.id) 
                        ? 'bg-red-100/50 border-red-300' 
                        : 'bg-white/30 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedAttachmentsForDelete.includes(att.id)}
                          onChange={() => toggleAttachmentSelection(att.id)}
                          className="rounded border-red-300 text-red-600 focus:ring-red-500"
                          disabled={attachmentsLoading}
                        />
                        {getFilePreview(att)}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-red-900 truncate">{att.file_name}</p>
                          <p className="text-xs text-red-600">
                            {selectedAttachmentsForDelete.includes(att.id) ? 'Selected for deletion' : 'Click to select'}
                          </p>
                        </div>
                      </div>
                      <GlassButton
                        variant="danger"
                        size="sm"
                        icon={<XCircle size={12} className="sm:w-3.5 sm:h-3.5" />}
                        onClick={() => handleRemoveAttachment(att)}
                        disabled={attachmentsLoading}
                        className="ml-2"
                      >
                        Delete
                      </GlassButton>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <AlertTriangle size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span>Deleting attachments cannot be undone. Please confirm before proceeding.</span>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
            title="Delete Attachment?"
            actions={
              <div className="flex gap-3 justify-end">
                <GlassButton variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>Cancel</GlassButton>
                <GlassButton variant="danger" onClick={confirmDeleteAttachment} disabled={attachmentsLoading}>
                  {attachmentsLoading ? 'Deleting...' : 'Delete'}
                </GlassButton>
              </div>
            }
            maxWidth="350px"
          >
            <div className="text-gray-800">Are you sure you want to delete <span className="font-semibold">{deleteTarget?.file_name}</span>?</div>
          </Modal>

          {/* Bulk Delete Confirmation Modal */}
          <Modal
            isOpen={showBulkDeleteModal}
            onClose={() => { setShowBulkDeleteModal(false); }}
            title="Bulk Delete Attachments?"
            actions={
              <div className="flex gap-3 justify-end">
                <GlassButton variant="secondary" onClick={() => { setShowBulkDeleteModal(false); }}>Cancel</GlassButton>
                <GlassButton variant="danger" onClick={handleBulkDeleteAttachments} disabled={attachmentsLoading}>
                  {attachmentsLoading ? 'Deleting...' : `Delete ${selectedAttachmentsForDelete.length} Attachment(s)`}
                </GlassButton>
              </div>
            }
            maxWidth="400px"
          >
            <div className="text-gray-800">
              <p className="mb-3">Are you sure you want to delete <span className="font-semibold text-red-600">{selectedAttachmentsForDelete.length} attachment(s)</span>?</p>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertTriangle size={16} />
                  <span className="font-semibold">Warning:</span>
                </div>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• This action cannot be undone</li>
                  <li>• Files will be permanently removed from storage</li>
                  <li>• Audit logs will be created for each deletion</li>
                </ul>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <span className="font-semibold">Selected files:</span>
                <div className="mt-1 max-h-20 overflow-y-auto">
                  {attachments
                    .filter(att => selectedAttachmentsForDelete.includes(att.id))
                    .map(att => (
                      <div key={att.id} className="text-xs text-gray-500 truncate">
                        • {att.file_name}
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </Modal>
          

         {/* Record Payment Modal - Mobile Optimized */}
         <Modal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setPaymentAmount(''); setPaymentError(null); }} title={<span className="text-lg font-bold text-gray-900">Record Payment</span>}>
           <div className="p-4 sm:p-6">
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                 <input
                   type="number"
                   min="0"
                   step="0.01"
                   value={paymentAmount}
                   onChange={e => setPaymentAmount(e.target.value)}
                   className="w-full rounded-lg border border-gray-300 bg-white p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 text-lg"
                   placeholder="Enter amount"
                   autoFocus
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                 <div className="grid grid-cols-3 gap-2">
                   {['cash', 'card', 'transfer'].map((method) => (
                     <button
                       key={method}
                       type="button"
                       onClick={() => setPaymentMethod(method as any)}
                       className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                         paymentMethod === method
                           ? 'border-blue-500 bg-blue-50 text-blue-700'
                           : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                       }`}
                     >
                       {method.charAt(0).toUpperCase() + method.slice(1)}
                     </button>
                   ))}
                 </div>
               </div>
               {paymentError && (
                 <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                   <div className="text-red-600 text-sm font-medium">{paymentError}</div>
                 </div>
               )}
               <div className="flex flex-col sm:flex-row gap-3 pt-4">
                 <GlassButton 
                   variant="secondary" 
                   onClick={() => { setShowPaymentModal(false); setPaymentAmount(''); setPaymentError(null); }}
                   className="flex-1"
                 >
                   Cancel
                 </GlassButton>
                 <GlassButton
                   variant="primary"
                   onClick={handleRecordPayment}
                   disabled={recordingPayment}
                   className="flex-1"
                 >
                   {recordingPayment ? 'Recording...' : 'Record Payment'}
                 </GlassButton>
               </div>
             </div>
           </div>
         </Modal>
          
          {/* Payment Confirmation Modal - Mobile Optimized */}
          <Modal isOpen={showPaymentConfirmation} onClose={() => { setShowPaymentConfirmation(false); window.location.reload(); }} title={<span className="text-lg font-bold text-gray-900">Payment Receipt</span>}>
            {lastPayment && (
              <div className="p-4 sm:p-6" id="payment-receipt-content">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-900 mb-2">Payment Successful!</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-lg text-green-700">{formatCurrency(lastPayment.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium capitalize">{lastPayment.method}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{new Date(lastPayment.payment_date).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Device:</span>
                      <span className="font-medium">{safeDevice.brand} {safeDevice.model}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">{customer ? customer.name : safeDevice.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Recorded by:</span>
                      <span className="font-medium">{currentUser.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <GlassButton 
                      variant="secondary" 
                      onClick={() => { setShowPaymentConfirmation(false); window.location.reload(); }}
                      className="flex-1"
                    >
                      Close
                    </GlassButton>
                    <GlassButton 
                      variant="primary" 
                      onClick={() => { 
                        const printContents = document.getElementById('payment-receipt-content')?.innerHTML; 
                        const printWindow = window.open('', '', 'height=600,width=400'); 
                        if (printWindow && printContents) { 
                          printWindow.document.write('<html><head><title>Payment Receipt</title></head><body>' + printContents + '</body></html>'); 
                          printWindow.document.close(); 
                          printWindow.focus(); 
                          printWindow.print(); 
                          printWindow.close(); 
                        } 
                      }}
                      className="flex-1"
                    >
                      Print Receipt
                    </GlassButton>
                  </div>
                </div>
              </div>
            )}
          </Modal>
          
          {/* Timeline & Activity */}
          <GlassCard>
            {/* Debug output for remarks */}
            {/* <div className="mb-2 text-xs text-gray-500">
              {allRemarks.length > 0
                ? `Debug: ${allRemarks.length} remark(s) fetched.`
                : 'Debug: No remarks fetched for this device.'}
            </div> */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Activity Timeline</h3>
              
              {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
                <GlassButton
                  onClick={handlePrintReceipt}
                  variant="secondary"
                  icon={<Printer size={16} />}
                  size="sm"
                >
                  Print Receipt
                </GlassButton>
              )}
            </div>
            
            <div className="space-y-4">
              {timelineLoading ? (
                <div className="text-blue-700 flex items-center gap-2"><Loader2 className="animate-spin" size={18}/> Loading timeline...</div>
              ) : (
                getTimelineEvents().length === 0 ? (
                  <p className="text-gray-500 italic">No activity recorded yet</p>
                ) : (
                  getTimelineEvents().map((event, idx) => (
                    <div key={idx} className={`relative pb-4 ${event.type === 'remark' ? (event.isSent ? 'flex justify-end' : 'flex justify-start') : ''}`}> 
                      {/* Vertical line and icon only for non-remark or incoming remark */}
                      {event.type !== 'remark' || !event.isSent ? (
                        <>
                          {idx < getTimelineEvents().length - 1 && (
                            <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-gray-300"></div>
                          )}
                          <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-white flex items-center justify-center border border-gray-300 shadow">
                            {event.icon}
                          </div>
                        </>
                      ) : null}
                      <div
                        className={`rounded-lg p-3 backdrop-blur-sm border max-w-lg
                          ${event.type === 'remark' ? (event.isSent ? 'ml-auto mr-0 shadow-green-200 border-green-200 bg-green-50' : 'mr-auto ml-0 shadow-purple-200 border-purple-200 bg-purple-50') : ''}
                          ${event.type === 'payment' ? 'bg-green-50 border-green-200 shadow-green-100' : ''}
                          ${event.type === 'status' ? 'bg-blue-50 border-blue-200 shadow-blue-100' : ''}
                          ${event.type === 'rating' ? 'bg-yellow-50 border-yellow-200 shadow-yellow-100' : ''}
                          ${event.type === 'points' ? 'bg-pink-50 border-pink-200 shadow-pink-100' : ''}
                          ${event.type === 'attachment' ? 'bg-gray-50 border-gray-200 shadow-gray-100' : ''}
                          ${event.type === 'audit' ? 'bg-rose-50 border-rose-200 shadow-rose-100' : ''}
                          ${event.type === 'sms' ? 'bg-blue-50 border-blue-200 shadow-blue-100' : ''}
                        `}
                        style={event.type === 'remark' ? { minWidth: '180px' } : {}}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold uppercase tracking-wide ${event.type === 'remark' ? (event.isSent ? 'text-green-700' : 'text-purple-700') : 'text-gray-700'}`}>{event.typeLabel}</span>
                          <span className="text-xs text-gray-400">{formatDate(event.timestamp)}</span>
                        </div>
                        {event.type === 'status' ? (
                          <div className="flex items-center justify-between gap-2 p-2">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={event.fromStatus} className="opacity-50 scale-90" />
                              <ArrowRight className="text-blue-400" size={18} />
                              <StatusBadge status={event.toStatus} className="scale-110 shadow" />
                            </div>
                            {event.durationLabel && (
                              <span className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                                <Clock className="text-blue-400" size={14} />
                                {event.durationLabel}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className={`font-medium text-gray-800 ${event.type === 'remark' ? (event.isSent ? 'text-green-900' : 'text-purple-900') : ''}`}>{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </GlassCard>
          
          {/* Remarks Chat Section */}
          <GlassCard className="bg-gradient-to-br from-green-500/10 to-green-400/5">
            <h3 className="text-lg font-bold text-green-900 mb-3 sm:mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Device Remarks Chat
            </h3>
            <div className="h-96">
              <WhatsAppChatUI
                remarks={safeDevice.remarks || []}
                onAddRemark={handleAddRemark}
                currentUserId={currentUser?.id}
                currentUserName={currentUser?.name || currentUser?.email}
                isLoading={false}
              />
            </div>
          </GlassCard>
        </div>
        
        {/* Right Column - Actions Panel */}
        <div className="space-y-2 sm:space-y-3 sm:space-y-6">
          {/* Device Actions Panel */}
          <GlassCard>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
              Device Actions
            </h3>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Print QR Code */}
              <GlassButton
                variant="secondary"
                size="sm"
                icon={<QrCode size={14} className="sm:w-4 sm:h-4" />}
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Device QR Code</title>
                          <style>
                            body {
                              display: flex;
                              justify-content: center;
                              align-items: center;
                              min-height: 100vh;
                              margin: 0;
                              font-family: monospace;
                            }
                            .container {
                              text-align: center;
                              padding: 20px;
                              border: 2px solid #000;
                              border-radius: 8px;
                            }
                            .qr-code {
                              margin-bottom: 15px;
                              padding: 10px;
                              background: white;
                              border-radius: 4px;
                            }
                            .device-info {
                              font-size: 12px;
                              margin-top: 10px;
                            }
                          </style>
                        </head>
                        <body>
                          <div class="container">
                            <div class="qr-code">
                              ${document.querySelector('.barcode-svg')?.outerHTML || ''}
                            </div>
                            <div class="device-info">
                              <strong>${safeDevice.brand} ${safeDevice.model}</strong><br>
                              ID: ${safeDevice.id}<br>
                              Serial: ${safeDevice.serialNumber || 'N/A'}
                            </div>
                          </div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                  }
                }}
                className="w-full text-xs sm:text-sm"
              >
                Print QR Code
              </GlassButton>

              {/* Print Receipt */}
              {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
                <GlassButton
                  variant="secondary"
                  size="sm"
                  icon={<Printer size={14} className="sm:w-4 sm:h-4" />}
                  onClick={handlePrintReceipt}
                  className="w-full text-xs sm:text-sm"
                >
                  Print Receipt
                </GlassButton>
              )}

              {/* Send SMS */}
              {currentUser.role === 'customer-care' && (
                <GlassButton
                  variant="secondary"
                  size="sm"
                  icon={<MessageSquare size={14} className="sm:w-4 sm:h-4" />}
                  onClick={() => setShowSmsModal(true)}
                  className="w-full text-xs sm:text-sm"
                >
                  Send SMS
                </GlassButton>
              )}

              {/* Diagnostic Checklist */}
              {currentUser.role === 'technician' && (
                <GlassButton
                  variant="secondary"
                  size="sm"
                  icon={<Stethoscope size={14} className="sm:w-4 sm:h-4" />}
                  onClick={() => setShowDiagnosticChecklist(true)}
                  className="w-full text-xs sm:text-sm"
                >
                  Diagnostic
                </GlassButton>
              )}

              {/* Repair Checklist */}
              {currentUser.role === 'technician' && (
                <GlassButton
                  variant="secondary"
                  size="sm"
                  icon={<Wrench size={14} className="sm:w-4 sm:h-4" />}
                  onClick={() => setShowRepairChecklist(true)}
                  className="w-full text-xs sm:text-sm"
                >
                  Repair
                </GlassButton>
              )}

              {/* Device History */}
              {deviceHistory.length > 0 && (
                <GlassButton
                  variant="secondary"
                  size="sm"
                  icon={<History size={14} className="sm:w-4 sm:h-4" />}
                  onClick={() => {
                    // Show device history in a modal or expand section
                    toast.success(`${deviceHistory.length} previous repairs found`);
                  }}
                  className="w-full text-xs sm:text-sm"
                >
                  View History ({deviceHistory.length})
                </GlassButton>
              )}
            </div>
          </GlassCard>
          
          {/* Assigned Technician Information */}
          {safeDevice.assignedTo && (
            <GlassCard className="bg-gradient-to-br from-blue-500/10 to-blue-400/5">
              <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Assigned Technician</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-base sm:text-lg">
                  {getUserName(safeDevice.assignedTo).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-blue-900 text-sm sm:text-base">{getUserName(safeDevice.assignedTo)}</p>
                  <p className="text-xs sm:text-sm text-blue-700">Technician</p>
                </div>
              </div>
            </GlassCard>
          )}
          
        {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
            <GlassCard>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Customer Information</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="sm:w-[18px] sm:h-[18px] text-gray-500" />
                  <span 
                    className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors text-sm sm:text-base truncate"
                    onClick={() => navigate(`/customers/${safeDevice.customerId}`)}
                  >
                    {dbCustomer?.name || customer?.name || safeDevice.customerName || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Phone Number</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-gray-800 text-sm sm:text-base">{dbCustomer?.phone || customer?.phone || safeDevice.phoneNumber || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-3">
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      icon={<Phone size={14} className="sm:w-4 sm:h-4" />}
                      onClick={() => {
                        const phoneNumber = (dbCustomer?.phone || customer?.phone || safeDevice.phoneNumber || '').replace(/\D/g, '');
                        if (phoneNumber) window.open(`tel:${phoneNumber}`);
                      }}
                      className="text-xs sm:text-sm"
                    >
                      Call
                    </GlassButton>
                    {/* Only Customer Care can send SMS */}
                    {currentUser.role === 'customer-care' && (
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        icon={<MessageSquare size={14} className="sm:w-4 sm:h-4" />}
                        onClick={() => setShowSmsModal(true)}
                        className="text-xs sm:text-sm"
                      >
                        Text
                      </GlassButton>
                    )}
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      icon={<Send size={14} className="sm:w-4 sm:h-4" />}
                      onClick={() => {
                        const phoneNumber = (dbCustomer?.phone || customer?.phone || safeDevice.phoneNumber || '').replace(/\D/g, '');
                        if (phoneNumber) window.open(`https://wa.me/${phoneNumber}`);
                      }}
                      className="text-xs sm:text-sm"
                    >
                      WhatsApp
                    </GlassButton>
                  </div>
                </div>
                {/* Email hidden for privacy */}
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">City</p>
                  <p className="text-gray-800 text-sm sm:text-base">{dbCustomer?.city || customer?.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Loyalty Level</p>
                  <p className="text-gray-800 text-sm sm:text-base">{dbCustomer?.loyaltyLevel || customer?.loyaltyLevel || 'N/A'}</p>
                </div>
              </div>
            </GlassCard>
          )}
          
          {/* Payments Section - Mobile Optimized */}
          {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
            <GlassCard className="bg-gradient-to-br from-green-500/10 to-green-400/5">
              <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-green-900 mb-4">Payments</h3>
              
              {payments.length === 0 ? (
                <div className="text-center py-6">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <div className="text-gray-700 text-sm sm:text-base">No payments recorded for this device.</div>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {payments.map((p: any) => (
                    <div key={p.id} className="bg-white rounded-lg border border-green-200 p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-700 text-lg">{formatCurrency(p.amount)}</span>
                        </div>
                        <span className="text-xs text-gray-500 capitalize">{p.method}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <p className="font-medium capitalize">{p.payment_type === 'payment' ? 'Payment' : p.payment_type === 'deposit' ? 'Deposit' : 'Refund'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <p className="font-medium capitalize">{p.status}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        {p.payment_date ? formatRelativeTime(p.payment_date) : ''}
                        {p.created_by && (
                          <span className="ml-2 text-blue-700">by {p.created_by}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="bg-green-50 rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-green-900 font-semibold">Total Paid:</span>
                  <span className="text-green-700 font-bold text-lg">{formatCurrency(totalPaid)}</span>
                </div>
                {invoiceTotal > 0 && outstanding !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-amber-900 font-semibold">Outstanding:</span>
                    <span className="text-amber-700 font-bold">{formatCurrency(outstanding)}</span>
                  </div>
                )}
              </div>
              
              {currentUser.role === 'customer-care' || currentUser.role === 'admin' ? (
                <GlassButton
                  variant="primary"
                  icon={<CreditCard size={16} className="sm:w-[18px] sm:h-[18px]" />}
                  className="mt-4 w-full sm:w-auto text-sm"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Record Payment
                </GlassButton>
              ) : (
                <div className="mt-4">
                  <GlassButton
                    variant="primary"
                    icon={<CreditCard size={16} className="sm:w-[18px] sm:h-[18px]" />}
                    className="opacity-50 cursor-not-allowed w-full sm:w-auto text-sm"
                    disabled
                  >
                    Record Payment
                  </GlassButton>
                  <div className="text-xs text-gray-500 mt-2 text-center sm:text-left">Only customer care can record payments.</div>
                </div>
              )}
            </GlassCard>
          )}
          
        </div>
      </div>
      
      <PrintableSlip ref={printRef} device={safeDevice} />

      {/* SMS Modal: Only Customer Care can use */}
      {currentUser.role === 'customer-care' && (
        <Modal isOpen={showSmsModal} onClose={() => { setShowSmsModal(false); setSmsMessage(''); setSmsResult(null); }} title="Send SMS" maxWidth="400px">
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
            className="space-y-4"
          >
            <div>
              <label className="block text-gray-700 mb-1 font-medium">To</label>
              <div className="py-2 px-4 bg-gray-100 rounded">{dbCustomer?.phone || customer?.phone || safeDevice.phoneNumber || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Message</label>
              <textarea
                value={smsMessage}
                onChange={e => setSmsMessage(e.target.value)}
                rows={3}
                className="w-full py-2 px-4 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Type your message here"
                required
              />
            </div>
            {smsResult && <div className={`text-sm ${smsResult.startsWith('Failed') ? 'text-red-600' : 'text-green-600'}`}>{smsResult}</div>}
            <div className="flex gap-3 justify-end mt-4">
              <GlassButton type="button" variant="secondary" onClick={() => { setShowSmsModal(false); setSmsMessage(''); setSmsResult(null); }}>Cancel</GlassButton>
              <GlassButton type="submit" variant="primary" disabled={smsSending}>{smsSending ? 'Sending...' : 'Send SMS'}</GlassButton>
            </div>
          </form>
        </Modal>
      )}

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