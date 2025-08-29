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
import WhatsAppChatUI from '../components/WhatsAppChatUI';
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

  // All hooks must be called unconditionally before any early returns
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

  // Only static check at the very top
  if (!id || !currentUser) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">Missing device ID or user session. Please try again.</div>
    );
  }

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

                {/* Assigned Technician */}
                {(dbDevice?.assigned_to || safeDevice.assignedTo) && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
                      <User size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-600/70">Assigned Technician</p>
                      <p className="text-sm sm:text-base text-gray-900 font-semibold">{getUserName(dbDevice?.assigned_to || safeDevice.assignedTo)}</p>
                    </div>
                  </div>
                )}

                {/* Issue Description */}
                {(dbDevice?.issue_description || safeDevice.issueDescription) && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/10">
                      <FileText size={16} className="sm:w-[18px] sm:h-[18px] text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-orange-600/70">Issue Description</p>
                      <p className="text-sm sm:text-base text-gray-900">{dbDevice?.issue_description || safeDevice.issueDescription}</p>
                    </div>
                  </div>
                )}

                {/* Device Condition Assessment */}
                {dbDevice?.device_condition && Object.keys(dbDevice.device_condition).length > 0 && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/10">
                      <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px] text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-600/70">Device Condition</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(dbDevice.device_condition).map(([condition, value]) => (
                          value && (
                            <span key={condition} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              {condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expected Return Date */}
                {(dbDevice?.expected_return_date || safeDevice.expectedReturnDate) && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-teal-500/10">
                      <Calendar size={16} className="sm:w-[18px] sm:h-[18px] text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-teal-600/70">Expected Return</p>
                      <p className="text-sm sm:text-base text-gray-900 font-semibold">{formatDate(dbDevice?.expected_return_date || safeDevice.expectedReturnDate)}</p>
                    </div>
                  </div>
                )}

                {/* Estimated Hours */}
                {(dbDevice?.estimated_hours || safeDevice.estimatedHours) && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/10">
                      <Clock size={16} className="sm:w-[18px] sm:h-[18px] text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-cyan-600/70">Estimated Hours</p>
                      <p className="text-sm sm:text-base text-gray-900 font-semibold">{dbDevice?.estimated_hours || safeDevice.estimatedHours}h</p>
                    </div>
                  </div>
                )}
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
        </div>
        
        {/* Right Column - Actions Panel */}
        <div className="space-y-2 sm:space-y-3 sm:space-y-6">
          {/* Customer Information */}
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
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
      
      <PrintableSlip ref={printRef} device={safeDevice} />
      
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