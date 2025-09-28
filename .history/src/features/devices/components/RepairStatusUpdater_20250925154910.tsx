import React, { useState, useEffect, useMemo } from 'react';
import { Device, DeviceStatus, User } from '../../../types';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  Stethoscope, 
  Package, 
  TestTube, 
  UserCheck, 
  XCircle,
  ArrowRight,
  Save,
  X,
  MessageSquare,
  Info,
  CreditCard
} from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import DiagnosticChecklistModal from './DiagnosticChecklistModal';
// import SparePartsSelector from '../../repair/components/SparePartsSelector';
import { createRepairPart, createRepairParts, getRepairParts, RepairPart } from '../../lats/lib/sparePartsApi';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../lib/customerApi';
import { supabase } from '../../../lib/supabaseClient';
import { validateDeviceHandover, getDevicePaymentInfo } from '../../../utils/paymentValidation';

interface RepairStatusUpdaterProps {
  device: Device;
  currentUser: User;
  onStatusUpdate: (deviceId: string, newStatus: DeviceStatus, notes?: string) => Promise<void>;
  onClose?: () => void;
  compact?: boolean;
  financialInfo?: {
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
  };
  deviceCosts?: {
    repairCost: number;
    depositAmount: number;
  };
  repairParts?: RepairPart[];
  repairPartsLoading?: boolean;
}

interface StatusTransition {
  from: DeviceStatus;
  to: DeviceStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requiresNotes: boolean;
  allowedRoles: string[];
  priority?: number; // Lower number = higher priority
  validation?: (device: Device) => { valid: boolean; message?: string };
}

const RepairStatusUpdater: React.FC<RepairStatusUpdaterProps> = ({
  device,
  currentUser,
  onStatusUpdate,
  onClose,
  compact = false,
  financialInfo,
  deviceCosts,
  repairParts = [],
  repairPartsLoading = false
}) => {
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<DeviceStatus | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showDiagnosticChecklist, setShowDiagnosticChecklist] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Spare parts state
  const [showSparePartsSelector, setShowSparePartsSelector] = useState(false);
  const [pendingPartsSelection, setPendingPartsSelection] = useState<DeviceStatus | null>(null);
  
  // SMS modal state
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);

  // Swahili message templates for different device statuses
  const getSwahiliMessage = (status: DeviceStatus, customerName: string, deviceName: string): string => {
    const templates = {
      'assigned': `Hujambo ${customerName}! Kifaa chako ${deviceName} kimepewa technician. Tutakujulisha mwendelezo wa ukarabati. - LATS CHANCE`,
      'diagnosis-started': `Hujambo ${customerName}! Kifaa chako ${deviceName} kimeanza diagnosis. Technician anachunguza tatizo. Tutakujulisha matokeo. - LATS CHANCE`,
      'awaiting-parts': `Hujambo ${customerName}! Kifaa chako ${deviceName} kinahitaji spare parts. Tunasubiri parts kufika, tutakujulisha. - LATS CHANCE`,
      'in-repair': `Hujambo ${customerName}! Kifaa chako ${deviceName} kinakarabatiwa. Technician anafanya kazi, tutakujulisha mwendelezo. - LATS CHANCE`,
      'repair-complete': `Hujambo ${customerName}! Kifaa chako ${deviceName} kimekarabatiwa! Unaweza kuja kukichukua. - LATS CHANCE`,
      'reassembled-testing': `Hujambo ${customerName}! Kifaa chako ${deviceName} kimekarabatiwa na kinajaribiwa. Karibu kukichukua. - LATS CHANCE`,
      'returned-to-customer-care': `Hujambo ${customerName}! Kifaa chako ${deviceName} kimekarabatiwa na kiko tayari kuchukuliwa. Karibu ofisini. - LATS CHANCE`,
      'done': `Asante ${customerName}! Kifaa chako ${deviceName} kimechukuliwa. Karibu tena! - LATS CHANCE`,
      'failed': `Hujambo ${customerName}. Kuna tatizo na kifaa chako ${deviceName}. Tunaomba uje ofisini kujadili. - LATS CHANCE`
    };
    
    return templates[status] || `Hujambo ${customerName}! Kuna update kuhusu kifaa chako ${deviceName}. - LATS CHANCE`;
  };

  // Force re-render when device status changes to ensure UI updates immediately
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [device.status, device.updatedAt]);

  // Note: Repair parts are loaded by the parent component (DeviceRepairDetailModal)
  // to avoid duplicate API calls. The parent passes the data through props.

  const statusTransitions: StatusTransition[] = [
    // Universal "Receive Spare Parts" button - shows for any status when there are pending parts
    {
      from: 'assigned',
      to: 'parts-arrived',
      label: 'Receive Spare Parts',
      description: 'Mark all requested parts as received and ready for repair',
      icon: <Package className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin'],
      priority: 1, // Highest priority - show first
      validation: (device) => {
        // Debug logging
        console.log('🔍 [Receive Spare Parts] Validation check:', {
          deviceStatus: device.status,
          repairPartsLength: repairParts.length,
          repairParts: repairParts.map(p => ({ id: p.id, status: p.status, name: p.lats_spare_parts?.name }))
        });
        
        // Only show this button if there are parts to receive
        if (repairParts.length === 0) {
          console.log('❌ [Receive Spare Parts] No repair parts found');
          return { valid: false, message: 'No parts have been requested yet.' };
        }
        
        const pendingParts = repairParts.filter(part => 
          part.status === 'needed' || part.status === 'ordered'
        );
        
        console.log('🔍 [Receive Spare Parts] Pending parts:', pendingParts.length, pendingParts.map(p => ({ id: p.id, status: p.status })));
        
        if (pendingParts.length === 0) {
          console.log('❌ [Receive Spare Parts] No pending parts found');
          return { valid: false, message: 'All parts have already been received.' };
        }
        
        console.log('✅ [Receive Spare Parts] Button should show');
        return { valid: true };
      }
    },
    {
      from: 'diagnosis-started',
      to: 'parts-arrived',
      label: 'Receive Spare Parts',
      description: 'Mark all requested parts as received and ready for repair',
      icon: <Package className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin'],
      priority: 1, // Highest priority - show first
      validation: (device) => {
        // Only show this button if there are parts to receive
        if (repairParts.length === 0) {
          return { valid: false, message: 'No parts have been requested yet.' };
        }
        
        const pendingParts = repairParts.filter(part => 
          part.status === 'needed' || part.status === 'ordered'
        );
        
        if (pendingParts.length === 0) {
          return { valid: false, message: 'All parts have already been received.' };
        }
        
        return { valid: true };
      }
    },
    {
      from: 'in-repair',
      to: 'parts-arrived',
      label: 'Receive Spare Parts',
      description: 'Mark all requested parts as received and ready for repair',
      icon: <Package className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin'],
      priority: 1, // Highest priority - show first
      validation: (device) => {
        // Only show this button if there are parts to receive
        if (repairParts.length === 0) {
          return { valid: false, message: 'No parts have been requested yet.' };
        }
        
        const pendingParts = repairParts.filter(part => 
          part.status === 'needed' || part.status === 'ordered'
        );
        
        if (pendingParts.length === 0) {
          return { valid: false, message: 'All parts have already been received.' };
        }
        
        return { valid: true };
      }
    },
    {
      from: 'assigned',
      to: 'diagnosis-started',
      label: 'Start Diagnosis',
      description: 'Begin comprehensive diagnostic process',
      icon: <Stethoscope className="w-4 h-4" />,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin']
    },
    {
      from: 'diagnosis-started',
      to: 'awaiting-parts',
      label: 'Awaiting Parts',
      description: 'Parts needed for repair - will trigger spare parts selection',
      icon: <Package className="w-4 h-4" />,
      color: 'bg-orange-600 hover:bg-orange-700',
      requiresNotes: true,
      allowedRoles: ['technician', 'admin'],
      validation: (device) => {
        // Check if device has remarks OR if we're adding notes inline
        if (!device.remarks || device.remarks.length === 0) {
          return { valid: true }; // Allow inline notes to satisfy validation
        }
        return { valid: true };
      }
    },
    {
      from: 'diagnosis-started',
      to: 'in-repair',
      label: 'Start Repair',
      description: 'Begin repair work',
      icon: <Wrench className="w-4 h-4" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin']
    },
    {
      from: 'awaiting-parts',
      to: 'parts-arrived',
      label: 'Receive Spare Parts',
      description: 'Mark all requested parts as received and ready for repair',
      icon: <Package className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin'],
      priority: 1, // High priority - show before other buttons
      validation: (device) => {
        // Only show this button if there are parts to receive
        if (repairParts.length === 0) {
          return { valid: false, message: 'No parts have been requested yet.' };
        }
        
        const pendingParts = repairParts.filter(part => 
          part.status === 'needed' || part.status === 'ordered'
        );
        
        if (pendingParts.length === 0) {
          return { valid: false, message: 'All parts have already been received.' };
        }
        
        return { valid: true };
      }
    },
    {
      from: 'diagnosis-started',
      to: 'parts-arrived',
      label: 'Receive Spare Parts',
      description: 'Mark all requested parts as received and ready for repair',
      icon: <Package className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin'],
      priority: 1, // High priority - show before other buttons
      validation: (device) => {
        // Only show this button if there are parts to receive
        if (repairParts.length === 0) {
          return { valid: false, message: 'No parts have been requested yet.' };
        }
        
        const pendingParts = repairParts.filter(part => 
          part.status === 'needed' || part.status === 'ordered'
        );
        
        if (pendingParts.length === 0) {
          return { valid: false, message: 'All parts have already been received.' };
        }
        
        return { valid: true };
      }
    },
    {
      from: 'awaiting-parts',
      to: 'in-repair',
      label: 'Start Repair (Parts Available)',
      description: 'Begin repair with available spare parts',
      icon: <Wrench className="w-4 h-4" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin'],
      validation: (device) => {
        // If no parts are requested, allow the transition
        if (repairParts.length === 0) {
          return { valid: true };
        }
        
        // If parts are requested, they MUST be received before repair can start
        const pendingParts = repairParts.filter(part => 
          part.status === 'needed' || part.status === 'ordered'
        );
        
        if (pendingParts.length > 0) {
          return { 
            valid: false, 
            message: `Cannot start repair. ${pendingParts.length} parts are still pending. Please mark parts as received first using the "Parts Received" button.` 
          };
        }
        
        // Check if at least some parts are received
        const receivedParts = repairParts.filter(part => 
          part.status === 'received' || part.status === 'used'
        );
        
        if (receivedParts.length === 0) {
          return { 
            valid: false, 
            message: `No parts have been received yet. Please use the "Parts Received" button to mark parts as received before starting repair.` 
          };
        }
        
        return { valid: true };
      }
    },
    {
      from: 'parts-arrived',
      to: 'in-repair',
      label: 'Start Repair',
      description: 'Begin repair work with received parts',
      icon: <Wrench className="w-4 h-4" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin']
    },
    {
      from: 'in-repair',
      to: 'reassembled-testing',
      label: 'Start Testing',
      description: 'Repair completed, begin comprehensive testing',
      icon: <TestTube className="w-4 h-4" />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      requiresNotes: true,
      allowedRoles: ['technician', 'admin']
    },
    {
      from: 'in-repair',
      to: 'failed',
      label: 'Mark Failed',
      description: 'Repair cannot be completed',
      icon: <XCircle className="w-4 h-4" />,
      color: 'bg-red-600 hover:bg-red-700',
      requiresNotes: true,
      allowedRoles: ['technician', 'admin']
    },
    {
      from: 'reassembled-testing',
      to: 'repair-complete',
      label: 'Testing Passed',
      description: 'All tests completed successfully, device ready for customer',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresNotes: true,
      allowedRoles: ['technician', 'admin']
    },
    {
      from: 'reassembled-testing',
      to: 'in-repair',
      label: 'Back to Repair',
      description: 'Testing failed, return to repair',
      icon: <Wrench className="w-4 h-4" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      requiresNotes: true,
      allowedRoles: ['technician', 'admin']
    },
    {
      from: 'repair-complete',
      to: 'returned-to-customer-care',
      label: 'Send to Customer Care',
      description: 'Testing complete, send device back to customer care for pickup',
      icon: <UserCheck className="w-4 h-4" />,
      color: 'bg-teal-600 hover:bg-teal-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin'],
      // REMOVED: Payment validation - Repair payment functionality removed
    },
    {
      from: 'repair-complete',
      to: 'returned-to-customer-care',
      label: 'Give to Customer',
      description: 'Device ready for customer pickup',
      icon: <UserCheck className="w-4 h-4" />,
      color: 'bg-teal-600 hover:bg-teal-700',
      requiresNotes: false,
      allowedRoles: ['admin', 'customer-care'],
      // REMOVED: Payment validation - Repair payment functionality removed
    },
    {
      from: 'returned-to-customer-care',
      to: 'done',
      label: 'Mark Done',
      description: 'Customer picked up device',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresNotes: false,
      allowedRoles: ['admin', 'customer-care'],
      // REMOVED: Payment validation - Repair payment functionality removed
    },
    {
      from: 'failed',
      to: 'returned-to-customer-care',
      label: 'Send to Customer Care',
      description: 'Send failed device to customer care for customer notification',
      icon: <UserCheck className="w-4 h-4" />,
      color: 'bg-teal-600 hover:bg-teal-700',
      requiresNotes: true,
      allowedRoles: ['technician', 'admin']
    },
    {
      from: 'failed',
      to: 'done',
      label: 'Return to Customer',
      description: 'Mark failed device as done (customer notified)',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresNotes: true,
      allowedRoles: ['admin', 'customer-care']
    },
    // Send SMS to Customer - Available for customer care on any status
    {
      from: 'assigned',
      to: 'assigned', // Same status, just triggers SMS
      label: 'Send SMS to Customer',
      description: 'Send status update SMS to customer',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      requiresNotes: false,
      allowedRoles: ['customer-care', 'admin'],
      priority: 2, // High priority but after receive parts
      validation: (device) => {
        // Only show if device has a customer with phone number
        if (!device.customerId) {
          return { valid: false, message: 'No customer assigned to this device.' };
        }
        return { valid: true };
      }
    },
    {
      from: 'diagnosis-started',
      to: 'diagnosis-started',
      label: 'Send SMS to Customer',
      description: 'Send status update SMS to customer',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      requiresNotes: false,
      allowedRoles: ['customer-care', 'admin'],
      priority: 2,
      validation: (device) => {
        if (!device.customerId) {
          return { valid: false, message: 'No customer assigned to this device.' };
        }
        return { valid: true };
      }
    },
    {
      from: 'awaiting-parts',
      to: 'awaiting-parts',
      label: 'Send SMS to Customer',
      description: 'Send status update SMS to customer',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      requiresNotes: false,
      allowedRoles: ['customer-care', 'admin'],
      priority: 2,
      validation: (device) => {
        if (!device.customerId) {
          return { valid: false, message: 'No customer assigned to this device.' };
        }
        return { valid: true };
      }
    },
    {
      from: 'in-repair',
      to: 'in-repair',
      label: 'Send SMS to Customer',
      description: 'Send status update SMS to customer',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      requiresNotes: false,
      allowedRoles: ['customer-care', 'admin'],
      priority: 2,
      validation: (device) => {
        if (!device.customerId) {
          return { valid: false, message: 'No customer assigned to this device.' };
        }
        return { valid: true };
      }
    },
    {
      from: 'repair-complete',
      to: 'repair-complete',
      label: 'Send SMS to Customer',
      description: 'Send status update SMS to customer',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      requiresNotes: false,
      allowedRoles: ['customer-care', 'admin'],
      priority: 2,
      validation: (device) => {
        if (!device.customerId) {
          return { valid: false, message: 'No customer assigned to this device.' };
        }
        return { valid: true };
      }
    }
  ];

  const getAvailableTransitions = useMemo((): StatusTransition[] => {
    console.log('🔍 [RepairStatusUpdater] Getting available transitions:', {
      deviceStatus: device.status,
      userRole: currentUser.role,
      deviceAssignedTo: device.assignedTo,
      repairPartsLength: repairParts.length
    });
    
    const available = statusTransitions.filter(transition => {
      console.log(`🔍 [RepairStatusUpdater] Checking transition: ${transition.from} -> ${transition.to} (${transition.label})`);
      
      // Check if transition is from current status
      if (transition.from !== device.status) {
        console.log(`❌ [RepairStatusUpdater] Status mismatch: ${transition.from} !== ${device.status}`);
        return false;
      }
      
      // Check if user role is allowed
      if (!transition.allowedRoles.includes(currentUser.role)) {
        console.log(`❌ [RepairStatusUpdater] Role not allowed: ${currentUser.role} not in ${transition.allowedRoles.join(', ')}`);
        return false;
      }
      
      // Check if user is assigned technician (for technician role)
      if (currentUser.role === 'technician' && device.assignedTo !== currentUser.id) {
        console.log(`❌ [RepairStatusUpdater] Technician not assigned: ${device.assignedTo} !== ${currentUser.id}`);
        return false;
      }
      
      // Check validation if it exists
      if (transition.validation) {
        const validation = transition.validation(device);
        if (!validation.valid) {
          console.log(`❌ [RepairStatusUpdater] Validation failed: ${validation.message}`);
          return false;
        }
      }
      
      console.log(`✅ [RepairStatusUpdater] Transition valid: ${transition.label}`);
      return true;
    });
    
    console.log('🔍 [RepairStatusUpdater] Available transitions:', available.map(t => t.label));
    
    // Sort by priority (lower number = higher priority, undefined = lowest priority)
    const sorted = available.sort((a, b) => {
      const priorityA = a.priority ?? 999;
      const priorityB = b.priority ?? 999;
      return priorityA - priorityB;
    });
    
    console.log('🔍 [RepairStatusUpdater] Sorted transitions:', sorted.map(t => `${t.label} (priority: ${t.priority ?? 999})`));
    
    return sorted;
  }, [device.status, device.assignedTo, currentUser.role, device.id, device.updatedAt, forceUpdate, repairParts]);

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;

    const transition = statusTransitions.find(t => t.to === selectedStatus);
    if (!transition) {
      console.error('[RepairStatusUpdater] No transition found for status:', selectedStatus);
      toast.error('Invalid status transition');
      return;
    }

    // Validate transition
    if (transition.validation) {
      const validation = transition.validation(device);
      if (!validation.valid) {
        toast.error(validation.message || 'Validation failed');
        return;
      }
    }

    // Check if notes are required
    if (transition.requiresNotes && !notes.trim()) {
      toast.error('Notes are required for this status change');
      return;
    }

    // Check if this transition requires spare parts selection
    if (selectedStatus === 'awaiting-parts' && device.status === 'diagnosis-started') {
      setPendingPartsSelection(selectedStatus);
      setShowSparePartsSelector(true);
      return;
    }

    // Check if already in target status
    if (device.status === selectedStatus) {
      toast.info(`Device is already in "${transition.label}" status`);
      setSelectedStatus(null);
      setNotes('');
      return;
    }

    // Set loading state for better UX
    setIsUpdating(true);
    setUpdatingStatus(selectedStatus);
    
    try {
      await onStatusUpdate(device.id, selectedStatus, notes.trim() || undefined);
      // Success feedback is handled by the parent component
      setSelectedStatus(null);
      setNotes('');
      onClose?.();
    } catch (error) {
      console.error('[RepairStatusUpdater] Status update error:', error);
      // Error feedback is handled by the parent component
    } finally {
      setIsUpdating(false);
      setUpdatingStatus(null);
    }
  };

  // Handle testing completion and suggest next steps
  const handleTestingComplete = async (status: DeviceStatus, notes: string) => {
    try {
      await onStatusUpdate(device.id, status, notes);
      
      // If testing passed, show suggestion to send to customer care
      if (status === 'repair-complete') {
        toast.success('Testing completed successfully! You can now send the device to customer care.', {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error updating testing status:', error);
      toast.error('Failed to update testing status');
    }
  };

  // Handle marking parts as received
  const handlePartsReceived = async () => {
    if (repairParts.length === 0) {
      toast.error('No parts to mark as received');
      return;
    }

    try {
      // Update all pending parts to 'received' status
      const pendingParts = repairParts.filter(part => 
        part.status === 'needed' || part.status === 'ordered'
      );

      if (pendingParts.length === 0) {
        toast.info('All parts have already been received');
        return;
      }

      // Update parts status in database
      const updatePromises = pendingParts.map(part => 
        supabase
          .from('repair_parts')
          .update({ status: 'received' })
          .eq('id', part.id)
      );

      await Promise.all(updatePromises);

      toast.success(`Marked ${pendingParts.length} parts as received`);
      
      // Update device status to parts-arrived
      await onStatusUpdate(device.id, 'parts-arrived', `Marked ${pendingParts.length} parts as received`);
      
    } catch (error) {
      console.error('Error marking parts as received:', error);
      toast.error('Failed to mark parts as received');
    }
  };

  // Handle receiving spare parts (for technicians)
  const handleReceiveSpareParts = async () => {
    if (repairParts.length === 0) {
      toast.error('No parts to receive');
      return;
    }

    try {
      // Update all pending parts to 'received' status
      const pendingParts = repairParts.filter(part => 
        part.status === 'needed' || part.status === 'ordered'
      );

      if (pendingParts.length === 0) {
        toast.info('All parts have already been received');
        return;
      }

      // Update parts status in database
      const updatePromises = pendingParts.map(part => 
        supabase
          .from('repair_parts')
          .update({ status: 'received' })
          .eq('id', part.id)
      );

      await Promise.all(updatePromises);

      toast.success(`Received ${pendingParts.length} spare parts successfully`);
      
      // Update device status to parts-arrived
      await onStatusUpdate(device.id, 'parts-arrived', `Received ${pendingParts.length} spare parts`);
      
    } catch (error) {
      console.error('Error receiving spare parts:', error);
      toast.error('Failed to receive spare parts');
    }
  };

  // Handle opening SMS modal
  const handleOpenSMSModal = () => {
    // Get customer name and device name for the message
    const customerName = device.customerName || 'Mteja';
    const deviceName = `${device.brand} ${device.model}` || 'kifaa chako';
    
    // Generate Swahili message based on current status
    const message = getSwahiliMessage(device.status, customerName, deviceName);
    setSmsMessage(message);
    setShowSMSModal(true);
  };

  // Handle sending SMS
  const handleSendSMS = async (type: 'sms' | 'whatsapp') => {
    if (!smsMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSmsLoading(true);
    try {
      // Import SMS service
      const { default: smsService } = await import('../../../services/smsService');
      
      // Get customer phone number
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('phone')
        .eq('id', device.customerId)
        .single();

      if (customerError || !customerData?.phone) {
        toast.error('Customer phone number not found');
        return;
      }

      // Send SMS or WhatsApp based on type
      if (type === 'sms') {
        const result = await smsService.sendSMS(customerData.phone, smsMessage);
        if (result.success) {
          toast.success('SMS sent successfully');
        } else {
          toast.error(`SMS failed: ${result.error}`);
        }
      } else {
        // For WhatsApp, we'll use the same SMS service but with WhatsApp endpoint
        // This would need to be configured in your SMS service
        const result = await smsService.sendSMS(customerData.phone, smsMessage, { whatsapp: true });
        if (result.success) {
          toast.success('WhatsApp message sent successfully');
        } else {
          toast.error(`WhatsApp failed: ${result.error}`);
        }
      }

      setShowSMSModal(false);
      setSmsMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSmsLoading(false);
    }
  };

  // Handle spare parts selection
  const handleSparePartsSelected = async (selectedParts: any[]) => {
    if (!pendingPartsSelection) {
      console.error('[RepairStatusUpdater] No pending parts selection found');
      return;
    }
    
    if (!selectedParts || selectedParts.length === 0) {
      toast.error('No parts selected. Please select at least one spare part.');
      return;
    }
    
    try {
      console.log('[RepairStatusUpdater] Creating repair parts:', { 
        deviceId: device.id, 
        partsCount: selectedParts.length,
        targetStatus: pendingPartsSelection 
      });
      
      // Create repair parts requests
      const repairPartsData = selectedParts.map(part => ({
        device_id: device.id,
        spare_part_id: part.spare_part_id,
        quantity_needed: part.quantity,
        cost_per_unit: part.cost_per_unit,
        notes: part.notes || `Requested for ${device.brand} ${device.model} repair`
      }));

      const response = await createRepairParts(repairPartsData);
      
      if (response.ok) {
        toast.success(`Successfully requested ${selectedParts.length} spare parts`);
        
        // Now update the device status
        await onStatusUpdate(device.id, pendingPartsSelection, `Requested ${selectedParts.length} spare parts`);
        
        // Note: Repair parts list will be refreshed by the parent component
        
        // Reset state
        setPendingPartsSelection(null);
        setShowSparePartsSelector(false);
        setSelectedStatus(null);
        setNotes('');
        onClose?.();
      } else {
        console.error('[RepairStatusUpdater] Failed to create repair parts:', response.message);
        toast.error(response.message || 'Failed to request spare parts');
      }
    } catch (error) {
      console.error('[RepairStatusUpdater] Error requesting spare parts:', error);
      toast.error('Failed to request spare parts. Please try again.');
    }
  };

  const availableTransitions = getAvailableTransitions;

  if (compact) {
    return (
      <div className="relative space-y-3">
        {/* Minimal corner loading indicator */}
        {isUpdating && (
          <div className="absolute -top-1 -right-1 z-10">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin bg-white shadow-sm"></div>
          </div>
        )}
        
        {availableTransitions.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No status updates available
            <div className="text-xs mt-1">
              Status: {device.status} | Role: {currentUser.role}
            </div>
          </div>
        ) : (
          availableTransitions.map((transition) => (
            <div key={transition.to} className="space-y-2">
              {/* Status Update Button */}
              <GlassButton
                onClick={async () => {
                  if (isUpdating || updatingStatus) return;
                  
                  // Check if already in target status FIRST
                  if (device.status === transition.to) {
                    toast.info(`Device is already in "${transition.label}" status`);
                    return;
                  }

                  // Check if this transition requires spare parts selection
                  if (transition.to === 'awaiting-parts' && device.status === 'diagnosis-started') {
                    setPendingPartsSelection(transition.to);
                    setShowSparePartsSelector(true);
                    return;
                  }

                  // Check if this is the "Receive Spare Parts" action
                  if (transition.to === 'parts-arrived' && device.status === 'awaiting-parts') {
                    await handleReceiveSpareParts();
                    return;
                  }

                  // Check if this is a testing completion action
                  if ((transition.to === 'repair-complete' || transition.to === 'in-repair') && 
                      device.status === 'reassembled-testing') {
                    // For testing actions, we need notes
                    if (transition.requiresNotes) {
                      setSelectedStatus(transition.to);
                      setNotes('');
                      return;
                    }
                  }

                  // Validate transition
                  if (transition.validation) {
                    const validation = transition.validation(device);
                    if (!validation.valid) {
                      toast.error(validation.message || 'Validation failed');
                      return;
                    }
                  }

                  // Check if notes are required
                  if (transition.requiresNotes) {
                    // Show inline notes input instead of popup
                    setSelectedStatus(transition.to);
                    setNotes('');
                    return;
                  }

                  // No notes required, update immediately in background
                  setIsUpdating(true);
                  setUpdatingStatus(transition.to);
                  try {
                    await onStatusUpdate(device.id, transition.to);
                    // Success feedback is handled by the parent component
                  } catch (error) {
                    console.error('Status update error:', error);
                    // Error feedback is handled by the parent component
                  } finally {
                    setIsUpdating(false);
                    setUpdatingStatus(null);
                  }
                }}
                className={`w-full justify-start ${transition.color} text-white py-4 ${updatingStatus === transition.to ? 'opacity-75 pointer-events-none' : ''}`}
                size="lg"
                disabled={updatingStatus === transition.to}
              >
                {updatingStatus === transition.to ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2">Updating...</span>
                  </>
                ) : (
                  <>
                    {transition.icon}
                    <span className="ml-2">{transition.label}</span>
                  </>
                )}
              </GlassButton>

              {/* Inline Notes Input - Only show for selected status that requires notes */}
              {selectedStatus === transition.to && transition.requiresNotes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <label className="block text-sm font-medium text-blue-900">
                    Notes Required *
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      transition.to === 'repair-complete' 
                        ? 'Describe test results and confirm device is working properly...'
                        : transition.to === 'in-repair' && device.status === 'reassembled-testing'
                        ? 'Describe what issues were found during testing...'
                        : `Add notes for "${transition.label}"...`
                    }
                    className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!notes.trim()) {
                          toast.error('Notes are required for this status change');
                          return;
                        }
                        
                        // Check if already in target status
                        if (device.status === transition.to) {
                          toast.info(`Device is already in ${transition.label} status`);
                          setSelectedStatus(null);
                          setNotes('');
                          return;
                        }

                        // Close modal immediately for instant feedback
                        setSelectedStatus(null);
                        setNotes('');
                        
                        // Update status in background (optimistic update)
                        setIsUpdating(true);
                        setUpdatingStatus(transition.to);
                        try {
                          // Use special handler for testing completion
                          if ((transition.to === 'repair-complete' || transition.to === 'in-repair') && 
                              device.status === 'reassembled-testing') {
                            await handleTestingComplete(transition.to, notes.trim());
                          } else {
                            await onStatusUpdate(device.id, transition.to, notes.trim());
                          }
                          // Success feedback is handled by the parent component
                        } catch (error) {
                          console.error('Status update error:', error);
                          // Error feedback is handled by the parent component
                        } finally {
                          setIsUpdating(false);
                          setUpdatingStatus(null);
                        }
                      }}
                      disabled={updatingStatus === transition.to || !notes.trim()}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
                    >
                      {updatingStatus === transition.to ? 'Syncing...' : 'Update Status'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStatus(null);
                        setNotes('');
                      }}
                      className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
          <div className="flex items-center gap-2">
            {/* Minimal corner loading indicator */}
            {isUpdating && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {availableTransitions.length === 0 ? (
          <div className="text-center py-8">
            <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No status updates available</p>
            <p className="text-sm text-gray-500">
              You may not have permission or the device is in a final state
            </p>
          </div>
        ) : (
          <>
            {/* Available Transitions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Available Actions</h4>
              <div className="grid grid-cols-1 gap-2">
                {availableTransitions.map((transition) => (
                  <button
                    key={transition.to}
                    onClick={() => {
                      if (transition.to === 'diagnosis-started') {
                        setShowDiagnosticChecklist(true);
                      } else {
                        setSelectedStatus(transition.to);
                      }
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedStatus === transition.to
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${transition.color.replace('hover:', '')}`}>
                        <div className="text-white">
                          {transition.icon}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">
                          {transition.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {transition.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Input */}
            {selectedStatus && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes {statusTransitions.find(t => t.to === selectedStatus)?.requiresNotes && '*'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this status change..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            )}

            {/* Action Buttons */}
            {selectedStatus && (
              <div className="flex gap-3 pt-4">
                <GlassButton
                  onClick={handleStatusUpdate}
                  disabled={isUpdating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdating ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span className="ml-2">Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span className="ml-2">Update Status</span>
                    </>
                  )}
                </GlassButton>
                <GlassButton
                  onClick={() => {
                    setSelectedStatus(null);
                    setNotes('');
                  }}
                  variant="outline"
                >
                  Cancel
                </GlassButton>
              </div>
            )}
          </>
        )}
      </div>

      {/* Diagnostic Checklist Modal */}
      <DiagnosticChecklistModal
        isOpen={showDiagnosticChecklist}
        onClose={() => setShowDiagnosticChecklist(false)}
        deviceId={device.id}
        deviceModel={device.model}
        issueDescription={device.issueDescription}
        onChecklistComplete={async (results: any) => {
          // Update device status to diagnosis-started after checklist completion
          await onStatusUpdate(device.id, 'diagnosis-started', 'Diagnostic checklist completed');
          setShowDiagnosticChecklist(false);
        }}
      />

      {/* Spare Parts Selector Modal */}
      {/* <SparePartsSelector
        device={device}
        isOpen={showSparePartsSelector}
        onClose={() => {
          setShowSparePartsSelector(false);
          setPendingPartsSelection(null);
          setSelectedStatus(null);
          setNotes('');
        }}
        onPartsSelected={handleSparePartsSelected}
      /> */}
    </GlassCard>
  );
};

export default RepairStatusUpdater;

