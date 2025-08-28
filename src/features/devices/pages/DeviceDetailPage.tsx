import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { usePayments } from '../../../context/PaymentsContext';
import { QRCodeSVG } from 'qrcode.react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import CountdownTimer from '../../../features/shared/components/ui/CountdownTimer';
import StatusBadge from '../../../features/shared/components/ui/StatusBadge';
import { ChevronDown, CheckCircle, XCircle, Smartphone, Barcode, Calendar, Loader2, Image as ImageIcon, FileText, File as FileIcon, CreditCard, DollarSign, AlertTriangle, Star, Award, Activity, Gift, MessageSquare, Clock, User, Upload, Trash2, ArrowLeft, Phone, Printer, Send, RefreshCw, ArrowRight, Key, Wrench, Hash, Settings, History, QrCode, Stethoscope } from 'lucide-react';
import WhatsAppChatUI from '../../../components/WhatsAppChatUI';
import DeviceDetailHeader from '../components/DeviceDetailHeader';
import StatusUpdateForm from '../components/forms/StatusUpdateForm';
import PrintableSlip from '../components/PrintableSlip';
import AssignTechnicianForm from '../components/forms/AssignTechnicianForm';
import DeviceBarcodeCard from '../components/DeviceBarcodeCard';
import DiagnosticChecklist from '../../../features/diagnostics/components/DiagnosticChecklist';
import RepairChecklist from '../components/RepairChecklist';
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

  // Check permissions based on role
  const isTechnician = currentUser.role === 'technician';
  const isAssignedTechnician = isTechnician && device?.assignedTo === currentUser.id;
  const isAdminOrCustomerCare = currentUser.role === 'admin' || currentUser.role === 'customer-care';
  
  useEffect(() => {
    if (isTechnician && !isAssignedTechnician) {
      navigate('/dashboard');
    }
  }, [isTechnician, isAssignedTechnician, navigate]);

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

  // [Continue with rest of component logic...]
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
            <div>Can Show Full Details: {isAdminOrCustomerCare ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}

      {/* Back Button and Title */}
      <div className="flex items-center mb-3 sm:mb-4 sm:mb-6">
        <Link to="/dashboard" className="mr-3 sm:mr-4 text-gray-700 hover:text-gray-900">
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
        </Link>
        <h1 className="text-lg sm:text-xl sm:text-2xl font-bold text-gray-900">Device Details</h1>
      </div>

      <DeviceDetailHeader device={safeDevice} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 sm:gap-6">
        {/* Left Column - Details & Checklist */}
        <div className="lg:col-span-2 space-y-2 sm:space-y-3 sm:space-y-6">
          {/* Device Information Card */}
          <GlassCard>
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold text-gray-900">{safeDevice.brand} {safeDevice.model}</h1>
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
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10">
                      <Calendar size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-600/70">Date Received</p>
                      <p className="text-sm sm:text-base text-gray-900 font-mono">{new Date(safeDevice.createdAt || new Date().toISOString()).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {/* Device Issue Section */}
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

          {/* Status Update Card */}
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
                  onUpdateStatus={(newStatus: DeviceStatus, signature: string) => updateDeviceStatus(id, newStatus, signature)}
                  onAddRemark={(remark: string) => addRemark(id, remark)}
                  onAddRating={safeDevice.assignedTo ? 
                    (score, comment) => addRating(safeDevice.id, safeDevice.assignedTo!, score, comment)
                    : undefined
                  }
                />
              )
            )}
          </GlassCard>

          {/* Device Intake Details Section */}
          <GlassCard className="bg-gradient-to-br from-indigo-500/10 to-indigo-400/5">
            <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-indigo-900 mb-3 sm:mb-4">Device Intake Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Unlock Code */}
              {safeDevice.unlockCode && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-500/10">
                    <Key size={16} className="sm:w-[18px] sm:h-[18px] text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-indigo-600/70">Unlock Code</p>
                    <p className="text-sm sm:text-base text-gray-900 font-mono truncate">{safeDevice.unlockCode}</p>
                  </div>
                </div>
              )}
              
              {/* Estimated Repair Cost */}
              {safeDevice.repairCost && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                    <DollarSign size={16} className="sm:w-[18px] sm:h-[18px] text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-600/70">Est. Repair Cost</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{formatCurrency(parseFloat(safeDevice.repairCost))}</p>
                  </div>
                </div>
              )}
              
              {/* Deposit Amount */}
              {safeDevice.depositAmount && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10">
                    <CreditCard size={16} className="sm:w-[18px] sm:h-[18px] text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-600/70">Deposit Amount</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{formatCurrency(parseFloat(safeDevice.depositAmount))}</p>
                  </div>
                </div>
              )}
              
              {/* Device Cost */}
              {safeDevice.deviceCost && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10">
                    <DollarSign size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-600/70">Device Cost</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{formatCurrency(parseFloat(safeDevice.deviceCost))}</p>
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
                    {safeDevice.diagnosisRequired ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {/* Expected Return Date */}
              {safeDevice.expectedReturnDate && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-teal-500/10">
                    <Calendar size={16} className="sm:w-[18px] sm:h-[18px] text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-teal-600/70">Expected Return</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{new Date(safeDevice.expectedReturnDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {/* Estimated Hours */}
              {safeDevice.estimatedHours && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/10">
                    <Clock size={16} className="sm:w-[18px] sm:h-[18px] text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-cyan-600/70">Estimated Hours</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{safeDevice.estimatedHours}h</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Device Notes */}
            {safeDevice.deviceNotes && (
              <div className="mt-3 sm:mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="sm:w-[18px] sm:h-[18px] text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">Device Notes</span>
                </div>
                <div className="p-2 sm:p-3 bg-white/50 rounded-lg border border-gray-200">
                  <p className="text-gray-800 text-sm">{safeDevice.deviceNotes}</p>
                </div>
              </div>
            )}
            
            {/* Intake Confirmations */}
            <div className="mt-3 sm:mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
              <div className={`p-2 sm:p-3 rounded-lg border ${safeDevice.accessoriesConfirmed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className={`sm:w-4 sm:h-4 ${safeDevice.accessoriesConfirmed ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-xs sm:text-sm font-medium">Accessories Confirmed</span>
                </div>
              </div>
              <div className={`p-2 sm:p-3 rounded-lg border ${safeDevice.problemConfirmed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className={`sm:w-4 sm:h-4 ${safeDevice.problemConfirmed ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-xs sm:text-sm font-medium">Problem Confirmed</span>
                </div>
              </div>
              <div className={`p-2 sm:p-3 rounded-lg border ${safeDevice.privacyConfirmed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className={`sm:w-4 sm:h-4 ${safeDevice.privacyConfirmed ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-xs sm:text-sm font-medium">Privacy Confirmed</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Warranty Information Section */}
          {(safeDevice.warrantyStatus && safeDevice.warrantyStatus !== 'None') && (
            <GlassCard className="bg-gradient-to-br from-green-500/10 to-green-400/5">
              <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-green-900 mb-2">Warranty Information</h3>
              <div className="flex flex-col gap-1 sm:gap-2 text-green-900 text-sm sm:text-base">
                <div><span className="font-semibold">Status:</span> {safeDevice.warrantyStatus}</div>
                {safeDevice.warrantyStart && <div><span className="font-semibold">Start Date:</span> {new Date(safeDevice.warrantyStart).toLocaleDateString()}</div>}
                {safeDevice.warrantyEnd && <div><span className="font-semibold">End Date:</span> {new Date(safeDevice.warrantyEnd).toLocaleDateString()}</div>}
              </div>
            </GlassCard>
          )}

          {/* Parts and Inventory Section - Admin/Customer Care only */}
          {isAdminOrCustomerCare && (
            <GlassCard className="bg-gradient-to-br from-purple-500/10 to-purple-400/5">
              <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-purple-900 mb-3 sm:mb-4">Parts & Inventory</h3>
              <div className="text-center py-6">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <div className="text-gray-700 text-sm sm:text-base">No parts used yet for this repair.</div>
                <p className="text-xs text-gray-500 mt-2">Parts will be tracked automatically when repair begins</p>
              </div>
            </GlassCard>
          )}

          {/* Device Timeline & Activity */}
          <GlassCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Activity Timeline</h3>
              <GlassButton
                onClick={() => {
                  toast.info('Full activity timeline will show all device events');
                }}
                variant="secondary"
                icon={<History size={16} />}
                size="sm"
              >
                View All
              </GlassButton>
            </div>
            
            <div className="space-y-4">
              {safeDevice.transitions && safeDevice.transitions.length > 0 ? (
                safeDevice.transitions.slice(-3).map((transition, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Status changed to {transition.toStatus?.replace(/-/g, ' ')}</p>
                      <p className="text-sm text-gray-600">{formatRelativeTime(transition.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic text-center py-4">No status changes recorded yet</p>
              )}
            </div>
          </GlassCard>

          {/* Upselling Opportunities - Sales Workflow Integration */}
          {isAdminOrCustomerCare && (
            <GlassCard className="bg-gradient-to-br from-orange-500/10 to-orange-400/5">
              <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-orange-900 mb-3 sm:mb-4">Sales Opportunities</h3>
              <div className="space-y-3">
                <div className="p-3 bg-white/50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-800">Recommended Accessories</span>
                  </div>
                  <p className="text-xs text-gray-700">Screen protector, case, charger accessories</p>
                </div>
                <div className="p-3 bg-white/50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-800">Warranty Extension</span>
                  </div>
                  <p className="text-xs text-gray-700">Offer extended warranty for completed repairs</p>
                </div>
              </div>
              <GlassButton
                variant="primary"
                size="sm"
                icon={<Gift size={14} />}
                className="mt-3 w-full"
                onClick={() => {
                  toast.info('Sales opportunities will integrate with inventory system');
                }}
              >
                View Recommendations
              </GlassButton>
            </GlassCard>
          )}

          {/* Device Attachments Section */}
          <GlassCard className="bg-gradient-to-br from-gray-500/10 to-gray-400/5">
            <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Device Attachments</h3>
            {attachmentsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                <span className="ml-2 text-gray-700 text-sm sm:text-base">Loading attachments...</span>
              </div>
            ) : attachments.length === 0 ? (
              <div className="text-center py-6">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <div className="text-gray-700 text-sm sm:text-base">No attachments uploaded yet.</div>
                <p className="text-xs text-gray-500 mt-2">Upload photos, documents, or invoices related to this device</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {attachments.map((att) => (
                  <div key={att.id} className="relative group">
                    <div className="p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex flex-col items-center">
                        {getFilePreview(att)}
                        <p className="text-xs text-center mt-2 text-gray-600 truncate w-full">{att.file_name}</p>
                        <p className="text-xs text-gray-400">{att.type || 'file'}</p>
                      </div>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleRemoveAttachment(att)}
                          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="Delete attachment"
                        >
                          <XCircle size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {attachmentsError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{attachmentsError}</p>
              </div>
            )}
            
            {uploadProgress !== null && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 text-sm">Uploading... {uploadProgress}%</span>
                </div>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Chat Interface */}
          <div className="h-96">
            <WhatsAppChatUI
              remarks={safeDevice.remarks || []}
              activityEvents={[]}
              onAddRemark={(remark: string) => addRemark(id, remark)}
              currentUserId={currentUser?.id}
              currentUserName={currentUser?.name || currentUser?.email}
              isLoading={false}
            />
          </div>
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
                              ${QRCodeSVG({value: safeDevice.id, size: 128})}
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

              {/* Print Receipt */}
              {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
                <GlassButton
                  variant="secondary"
                  size="sm"
                  icon={<Printer size={14} className="sm:w-4 sm:h-4" />}
                  onClick={() => {
                    toast.info('Receipt printing feature will be integrated');
                  }}
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

              {/* Attach Files */}
              <GlassButton
                variant="secondary"
                size="sm"
                icon={<Upload size={14} className="sm:w-4 sm:h-4" />}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.onChange = handleAttachmentUpload;
                  input.click();
                }}
                className="w-full text-xs sm:text-sm"
                disabled={attachmentsLoading}
              >
                {attachmentsLoading ? 'Uploading...' : 'Attach Files'}
              </GlassButton>

              {/* View History */}
              <GlassButton
                variant="secondary"
                size="sm"
                icon={<History size={14} className="sm:w-4 sm:h-4" />}
                onClick={() => {
                  toast.info('Device history feature will show complete repair timeline');
                }}
                className="w-full text-xs sm:text-sm"
              >
                View History
              </GlassButton>
            </div>
          </GlassCard>

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
                    {customer?.name || safeDevice.customerName || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Phone Number</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-gray-800 text-sm sm:text-base">{customer?.phone || safeDevice.phoneNumber || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-3">
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      icon={<Phone size={14} className="sm:w-4 sm:h-4" />}
                      onClick={() => {
                        const phoneNumber = (customer?.phone || safeDevice.phoneNumber || '').replace(/\D/g, '');
                        if (phoneNumber) window.open(`tel:${phoneNumber}`);
                      }}
                      className="text-xs sm:text-sm"
                    >
                      Call
                    </GlassButton>
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      icon={<Send size={14} className="sm:w-4 sm:h-4" />}
                      onClick={() => {
                        const phoneNumber = (customer?.phone || safeDevice.phoneNumber || '').replace(/\D/g, '');
                        if (phoneNumber) window.open(`https://wa.me/${phoneNumber}`);
                      }}
                      className="text-xs sm:text-sm"
                    >
                      WhatsApp
                    </GlassButton>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Payments Section */}
          {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
            <GlassCard className="bg-gradient-to-br from-green-500/10 to-green-400/5">
              <h3 className="text-lg sm:text-xl sm:text-2xl font-bold text-green-900 mb-4">Payments</h3>
              
              <div className="text-center py-6">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <div className="text-gray-700 text-sm sm:text-base">No payments recorded for this device.</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-green-900 font-semibold">Total Paid:</span>
                  <span className="text-green-700 font-bold text-lg">{formatCurrency(0)}</span>
                </div>
              </div>
              
              <GlassButton
                variant="primary"
                icon={<CreditCard size={16} className="sm:w-[18px] sm:h-[18px]" />}
                className="mt-4 w-full sm:w-auto text-sm"
                onClick={() => {
                  toast.info('Payment recording feature will be integrated with the payment system');
                }}
              >
                Record Payment
              </GlassButton>
            </GlassCard>
          )}

          {/* Assigned Technician Information */}
          {safeDevice.assignedTo && (
            <GlassCard className="bg-gradient-to-br from-blue-500/10 to-blue-400/5">
              <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Assigned Technician</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-base sm:text-lg">
                  {safeDevice.assignedTo.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-blue-900 text-sm sm:text-base">{safeDevice.assignedTo}</p>
                  <p className="text-xs sm:text-sm text-blue-700">Technician</p>
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
        onStatusUpdate={(newStatus: DeviceStatus) => updateDeviceStatus(id, newStatus, 'checklist-update')}
      />

      {/* Repair Checklist Modal */}
      <RepairChecklist
        device={safeDevice}
        isOpen={showRepairChecklist}
        onClose={() => setShowRepairChecklist(false)}
        onStatusUpdate={(newStatus: DeviceStatus) => updateDeviceStatus(id, newStatus, 'checklist-update')}
      />

      {/* SMS Modal: Only Customer Care can use */}
      {currentUser.role === 'customer-care' && (
        <Modal isOpen={showSmsModal} onClose={() => { setShowSmsModal(false); setSmsMessage(''); setSmsResult(null); }} title="Send SMS" maxWidth="400px">
          <form
            onSubmit={async e => {
              e.preventDefault();
              setSmsSending(true);
              setSmsResult(null);
              const smsPhoneNumber = (customer?.phone || safeDevice.phoneNumber || '').replace(/\D/g, '');
              try {
                const smsResultObj = await smsService.sendSMS(smsPhoneNumber, smsMessage, customer?.id || safeDevice.customerId);
                setSmsSending(false);
                if (smsResultObj.success) {
                  const logSuccess = await logManualSMS({
                    deviceId: safeDevice.id,
                    customerId: customer?.id || safeDevice.customerId,
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
              } catch (error) {
                setSmsSending(false);
                setSmsResult('Failed to send SMS');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-gray-700 mb-1 font-medium">To</label>
              <div className="py-2 px-4 bg-gray-100 rounded">{customer?.phone || safeDevice.phoneNumber || 'N/A'}</div>
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
    </div>
  );
};

export default DeviceDetailPage;