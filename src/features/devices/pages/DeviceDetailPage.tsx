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
import WhatsAppChatUI from '../../../components/WhatsAppChatUI';
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
  const { payments } = usePayments();
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

  // Get device early to avoid temporal dead zone issues
  const device = id ? getDeviceById(id) : null;

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
    if (id && currentUser && device) {
      const isTechnician = currentUser.role === 'technician';
      const isAssignedTechnician = isTechnician && device.assignedTo === currentUser.id;
      if (isTechnician && !isAssignedTechnician) {
        handleBackClick();
      }
    }
  }, [id, currentUser, device, handleBackClick]);





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

  // Check if device is not found
  if (!device && !devicesLoading) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 font-bold text-lg mb-4">Device Not Found</div>
        <p className="text-gray-600 mb-4">The device with ID "{id}" could not be found.</p>
        <GlassButton
          variant="secondary"
          onClick={() => navigate('/devices')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Devices
        </GlassButton>
      </div>
    );
  }
  
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
  }), [device]);
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

  // Mock warranty info (replace with real data integration as needed)
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

  // Payments for this device
  const totalPaid = useMemo(() => payments.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + (p.amount || 0), 0), [payments]);
  // Try to get invoice total from attachments (if any invoice has an amount in file_name, e.g., 'invoice-1234-amount-500.pdf')
  const invoiceAttachments = useMemo(() => attachments.filter(att => att.type === 'invoice'), [attachments]);
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

  // Fetch all device activity on mount or when device ID changes
  const fetchAllDeviceActivity = useCallback(async () => {
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
  }, [safeDevice.id]);

  // Fetch device checklist and additional device info - commented out device_checklists until table is created
  const fetchDeviceDetails = useCallback(async () => {
    if (!safeDevice.id) return;
    
    setDeviceChecklistLoading(true);
    setDbDeviceLoading(true);
    
    try {

      
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
  // Fetch all device activity effect
  useEffect(() => {
    if (id) {
      fetchAllDeviceActivity();
      fetchDeviceDetails();
    }
  }, [id, fetchAllDeviceActivity, fetchDeviceDetails]);

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
  }, [safeDevice.assignedTo, allPayments.length, allTransitions.length, allRemarks.length, allRatings.length, allAttachments.length, auditLogs.length, pointsTransactions.length, smsLogs.length]);

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
    <>
      <div className="p-3 sm:p-6 max-w-7xl mx-auto w-full min-h-screen">
        <div className="space-y-6 sm:space-y-8">
          {/* Device Header */}
          <DeviceDetailHeader device={safeDevice} />

          {/* Quick Actions Bar - Mobile Optimized */}
          <GlassCard className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              <GlassButton
                variant="primary"
                size="lg"
                icon={<QrCode className="w-5 h-5" />}
                className="h-16 sm:h-20 text-xs sm:text-sm font-medium flex-col gap-1 touch-manipulation"
                onClick={handlePrintReceipt}
              >
                Print Slip
              </GlassButton>
              
              {currentUser.role === 'customer-care' && (
                <GlassButton
                  variant="secondary"
                  size="lg"
                  icon={<MessageSquare className="w-5 h-5" />}
                  className="h-16 sm:h-20 text-xs sm:text-sm font-medium flex-col gap-1 touch-manipulation"
                  onClick={() => setShowSmsModal(true)}
                >
                  Send SMS
                </GlassButton>
              )}

              {(currentUser.role === 'technician' || currentUser.role === 'admin') && (
                <GlassButton
                  variant="success"
                  size="lg"
                  icon={<Stethoscope className="w-5 h-5" />}
                  className="h-16 sm:h-20 text-xs sm:text-sm font-medium flex-col gap-1 touch-manipulation"
                  onClick={() => setShowDiagnosticChecklist(true)}
                >
                  Diagnostic
                </GlassButton>
              )}

              {(currentUser.role === 'technician' || currentUser.role === 'admin') && (
                <GlassButton
                  variant="warning"
                  size="lg"
                  icon={<Wrench className="w-5 h-5" />}
                  className="h-16 sm:h-20 text-xs sm:text-sm font-medium flex-col gap-1 touch-manipulation"
                  onClick={() => setShowRepairChecklist(true)}
                >
                  Repair
                </GlassButton>
              )}

              <GlassButton
                variant="secondary"
                size="lg"
                icon={<ArrowLeft className="w-5 h-5" />}
                className="h-16 sm:h-20 text-xs sm:text-sm font-medium flex-col gap-1 touch-manipulation"
                onClick={handleBackClick}
              >
                Back
              </GlassButton>
            </div>
          </GlassCard>
          
          {/* Customer Information Section */}
          {(customer || dbCustomer) && (
            <GlassCard className="bg-gradient-to-br from-blue-500/10 to-blue-400/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-blue-900">Customer Information</h3>
                {currentUser.role === 'customer-care' && (
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    icon={<Phone className="w-4 h-4" />}
                    className="touch-manipulation"
                    onClick={() => {
                      const phone = dbCustomer?.phone || customer?.phone;
                      if (phone) window.open(`tel:${phone}`);
                    }}
                  >
                    Call
                  </GlassButton>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Name</p>
                    <p className="text-gray-800 text-lg font-semibold">{dbCustomer?.name || customer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                    <p className="text-gray-800 text-lg">{dbCustomer?.phone || customer?.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">City</p>
                    <p className="text-gray-800 text-lg">{dbCustomer?.city || customer?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Loyalty Level</p>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <p className="text-gray-800 text-lg font-medium">{dbCustomer?.loyaltyLevel || customer?.loyaltyLevel || 'Standard'}</p>
                    </div>
                  </div>
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
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                {currentUser.role === 'customer-care' || currentUser.role === 'admin' ? (
                  <GlassButton
                    variant="primary"
                    size="lg"
                    icon={<CreditCard className="w-5 h-5" />}
                    className="w-full sm:w-auto h-12 touch-manipulation font-medium"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    Record Payment
                  </GlassButton>
                ) : (
                  <div className="w-full">
                    <GlassButton
                      variant="primary"
                      size="lg"
                      icon={<CreditCard className="w-5 h-5" />}
                      className="opacity-50 cursor-not-allowed w-full h-12 font-medium"
                      disabled
                    >
                      Record Payment
                    </GlassButton>
                    <div className="text-sm text-gray-500 mt-2 text-center sm:text-left">Only customer care can record payments.</div>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Device Information & Status Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Device Specifications */}
            <GlassCard className="bg-gradient-to-br from-gray-500/10 to-gray-400/5">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Device Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Brand</p>
                    <p className="text-gray-800 text-lg font-semibold">{safeDevice.brand || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Model</p>
                    <p className="text-gray-800 text-lg font-semibold">{safeDevice.model || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Serial Number</p>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-800 text-lg font-mono">{safeDevice.serialNumber || 'N/A'}</p>
                  </div>
                </div>

                {safeDevice.unlockCode && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Unlock Code</p>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-500" />
                      <p className="text-gray-800 text-lg font-mono bg-amber-50 px-2 py-1 rounded">{safeDevice.unlockCode}</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Issue Description</p>
                  <p className="text-gray-800 text-base bg-gray-50 p-3 rounded-lg">{safeDevice.issueDescription || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Repair Cost</p>
                    <p className="text-gray-800 text-lg font-semibold">{safeDevice.repairCost ? formatCurrency(Number(safeDevice.repairCost)) : 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Deposit</p>
                    <p className="text-gray-800 text-lg font-semibold">{safeDevice.depositAmount ? formatCurrency(Number(safeDevice.depositAmount)) : 'None'}</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Status & Timeline */}
            <GlassCard className="bg-gradient-to-br from-purple-500/10 to-pink-400/5">
              <h3 className="text-xl sm:text-2xl font-bold text-purple-900 mb-6">Status & Timeline</h3>
              
              <div className="space-y-6">
                {/* Current Status */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Current Status</p>
                  <StatusBadge status={safeDevice.status} className="text-lg px-4 py-2" />
                </div>

                {/* Expected Return Date */}
                {safeDevice.expectedReturnDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Expected Return</p>
                    <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <span className="text-lg font-semibold text-gray-800">
                          {new Date(safeDevice.expectedReturnDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-base font-medium">
                        {getMinimalCountdown(safeDevice.expectedReturnDate)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Metrics */}
                {(technicianDuration || handoverDuration) && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-3">Performance</p>
                    <div className="space-y-2">
                      {technicianDuration && (
                        <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                          <span className="text-sm text-gray-600">Repair Time:</span>
                          <span className="font-medium text-gray-800">{formatDuration(technicianDuration)}</span>
                        </div>
                      )}
                      {handoverDuration && (
                        <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                          <span className="text-sm text-gray-600">Handover Time:</span>
                          <span className="font-medium text-gray-800">{formatDuration(handoverDuration)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Update Actions */}
                {(currentUser.role === 'technician' || currentUser.role === 'admin') && (
                  <div className="pt-4 border-t border-purple-200">
                    <StatusUpdateForm
                      deviceId={safeDevice.id}
                      currentStatus={safeDevice.status}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Warranty Information */}
          {hasWarrantyData() && (
            <GlassCard className="bg-gradient-to-br from-yellow-500/10 to-orange-400/5">
              <h3 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-6">Warranty Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                  <p className="text-lg font-semibold text-yellow-700">{warrantyInfo.status}</p>
                </div>
                {warrantyInfo.startDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Start Date</p>
                    <p className="text-gray-800 text-base">{new Date(warrantyInfo.startDate).toLocaleDateString()}</p>
                  </div>
                )}
                {warrantyInfo.endDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">End Date</p>
                    <p className="text-gray-800 text-base">{new Date(warrantyInfo.endDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Communication Section */}
          <GlassCard className="bg-gradient-to-br from-blue-500/10 to-cyan-400/5">
            <h3 className="text-xl sm:text-2xl font-bold text-blue-900 mb-6">Communication & Remarks</h3>
            <div style={{ height: '500px' }}>
              <WhatsAppChatUI
                remarks={allRemarks.map(r => ({
                  id: r.id,
                  content: r.remark,
                  createdBy: r.created_by,
                  createdAt: r.created_at
                }))}
                activityEvents={getActivityEvents()}
                onAddRemark={handleAddRemark}
                currentUserId={currentUser.id}
                currentUserName={currentUser.username}
                isLoading={false}
              />
            </div>
          </GlassCard>

          {/* Attachments Section */}
          {hasAttachments() && (
            <GlassCard className="bg-gradient-to-br from-emerald-500/10 to-teal-400/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-900">Attachments</h3>
                <div className="flex gap-2">
                  {selectedAttachmentsForDelete.length > 0 && (
                    <GlassButton
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                      className="touch-manipulation"
                      onClick={() => setShowBulkDeleteModal(true)}
                    >
                      Delete ({selectedAttachmentsForDelete.length})
                    </GlassButton>
                  )}
                  <label className="cursor-pointer">
                    <GlassButton
                      variant="primary"
                      size="sm"
                      icon={<Upload className="w-4 h-4" />}
                      className="touch-manipulation"
                      as="span"
                    >
                      Upload
                    </GlassButton>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleAttachmentUpload}
                    />
                  </label>
                </div>
              </div>
              
              {attachmentsLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {uploadProgress !== null ? `Uploading... ${uploadProgress}%` : 'Loading attachments...'}
                  </p>
                </div>
              )}
              
              {attachmentsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600">{attachmentsError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {attachments.filter(att => att.type !== 'invoice').map((att) => (
                  <div key={att.id} className="bg-white rounded-lg border border-emerald-200 p-4 group hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        checked={selectedAttachmentsForDelete.includes(att.id)}
                        onChange={() => toggleAttachmentSelection(att.id)}
                      />
                      <div className="flex-shrink-0">
                        {getFilePreview(att)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{att.file_name}</p>
                        <p className="text-xs text-gray-500 mb-2">{formatRelativeTime(att.uploaded_at)}</p>
                        <div className="flex gap-2">
                          <a
                            href={att.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 transition-colors"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleRemoveAttachment(att)}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors touch-manipulation"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Repair History */}
          {hasRepairHistory() && (
            <GlassCard className="bg-gradient-to-br from-amber-500/10 to-orange-400/5">
              <h3 className="text-xl sm:text-2xl font-bold text-amber-900 mb-6">Device Repair History</h3>
              <div className="space-y-4">
                {deviceHistory.map((historyDevice) => (
                  <div key={historyDevice.id} className="bg-white rounded-lg border border-amber-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-amber-600" />
                        <span className="font-semibold text-amber-800">Previous Repair</span>
                      </div>
                      <StatusBadge status={historyDevice.status} size="sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p className="font-medium">{new Date(historyDevice.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Issue:</span>
                        <p className="font-medium">{historyDevice.issueDescription || 'No description'}</p>
                      </div>
                    </div>
                    <Link
                      to={`/devices/${historyDevice.id}`}
                      className="inline-flex items-center gap-1 mt-3 text-sm text-amber-700 hover:text-amber-800 font-medium"
                    >
                      View Details <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Invoices Section */}
          {hasInvoices() && (
            <GlassCard className="bg-gradient-to-br from-rose-500/10 to-pink-400/5">
              <h3 className="text-xl sm:text-2xl font-bold text-rose-900 mb-6">Invoices & Estimates</h3>
              <div className="space-y-4">
                {invoiceAttachments.map((invoice) => (
                  <div key={invoice.id} className="bg-white rounded-lg border border-rose-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-rose-600" />
                        <div>
                          <p className="font-medium text-gray-900">{invoice.file_name}</p>
                          <p className="text-sm text-gray-500">{formatRelativeTime(invoice.uploaded_at)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={invoice.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors touch-manipulation"
                        >
                          <FileText className="w-4 h-4" />
                          View Invoice
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Device Barcode & QR */}
          <GlassCard className="bg-gradient-to-br from-slate-500/10 to-gray-400/5">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Device Codes</h3>
            <DeviceBarcodeCard device={safeDevice} />
          </GlassCard>

          {/* Technician Assignment */}
          {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
            <GlassCard className="bg-gradient-to-br from-indigo-500/10 to-purple-400/5">
              <h3 className="text-xl sm:text-2xl font-bold text-indigo-900 mb-6">Technician Assignment</h3>
              <AssignTechnicianForm
                deviceId={safeDevice.id}
                currentAssignedTo={safeDevice.assignedTo}
                onAssignmentUpdate={(deviceId, technicianId) => {
                  // Handle assignment update
                  toast.success('Technician assigned successfully!');
                }}
              />
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
            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
              <GlassButton 
                type="button" 
                variant="secondary" 
                size="lg"
                className="w-full sm:w-auto h-12 touch-manipulation font-medium"
                onClick={() => { setShowSmsModal(false); setSmsMessage(''); setSmsResult(null); }}
              >
                Cancel
              </GlassButton>
              <GlassButton 
                type="submit" 
                variant="primary" 
                size="lg"
                className="w-full sm:w-auto h-12 touch-manipulation font-medium"
                disabled={smsSending}
              >
                {smsSending ? 'Sending...' : 'Send SMS'}
              </GlassButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Modal */}
      <Modal 
        isOpen={showPaymentModal} 
        onClose={() => { setShowPaymentModal(false); setPaymentAmount(''); setPaymentError(null); }} 
        title="Record Payment" 
        maxWidth="500px"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              className="w-full py-3 px-4 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-lg"
              placeholder="Enter amount"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              {(['cash', 'card', 'transfer'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-3 px-4 rounded-lg font-medium capitalize transition-all touch-manipulation ${
                    paymentMethod === method
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{paymentError}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8">
            <GlassButton
              type="button"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto h-12 touch-manipulation font-medium"
              onClick={() => { setShowPaymentModal(false); setPaymentAmount(''); setPaymentError(null); }}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="button"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto h-12 touch-manipulation font-medium"
              onClick={handleRecordPayment}
              disabled={recordingPayment || !paymentAmount}
            >
              {recordingPayment ? 'Recording...' : 'Record Payment'}
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        isOpen={showPaymentConfirmation}
        onClose={() => setShowPaymentConfirmation(false)}
        title="Payment Recorded"
        maxWidth="400px"
      >
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
            {lastPayment && (
              <div className="space-y-2 text-sm text-gray-600">
                <p>Amount: <span className="font-medium">{formatCurrency(lastPayment.amount)}</span></p>
                <p>Method: <span className="font-medium capitalize">{lastPayment.method}</span></p>
              </div>
            )}
          </div>
          <GlassButton
            variant="primary"
            size="lg"
            className="w-full h-12 touch-manipulation font-medium"
            onClick={() => setShowPaymentConfirmation(false)}
          >
            Close
          </GlassButton>
        </div>
      </Modal>

      {/* Delete Attachment Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Attachment"
        maxWidth="400px"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-gray-900 font-medium">Are you sure you want to delete this attachment?</p>
              {deleteTarget && (
                <p className="text-sm text-gray-600 mt-1">{deleteTarget.file_name}</p>
              )}
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">This action cannot be undone.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
            <GlassButton
              type="button"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto h-12 touch-manipulation font-medium"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="button"
              variant="danger"
              size="lg"
              className="w-full sm:w-auto h-12 touch-manipulation font-medium"
              onClick={confirmDeleteAttachment}
              disabled={attachmentsLoading}
            >
              {attachmentsLoading ? 'Deleting...' : 'Delete'}
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Attachments Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Delete Multiple Attachments"
        maxWidth="500px"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-gray-900 font-medium">
                Are you sure you want to delete {selectedAttachmentsForDelete.length} attachment(s)?
              </p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm font-medium mb-2">This will delete:</p>
            <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
              {attachments
                .filter(att => selectedAttachmentsForDelete.includes(att.id) && att.type !== 'invoice')
                .map(att => (
                  <li key={att.id} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {att.file_name}
                  </li>
                ))}
            </ul>
            <p className="text-red-800 text-sm mt-3 font-medium">This action cannot be undone.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
            <GlassButton
              type="button"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto h-12 touch-manipulation font-medium"
              onClick={() => setShowBulkDeleteModal(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="button"
              variant="danger"
              size="lg"
              className="w-full sm:w-auto h-12 touch-manipulation font-medium"
              onClick={handleBulkDeleteAttachments}
              disabled={attachmentsLoading}
            >
              {attachmentsLoading ? 'Deleting...' : `Delete ${selectedAttachmentsForDelete.length} Files`}
            </GlassButton>
          </div>
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
    </>
  );
};

export default DeviceDetailPage;