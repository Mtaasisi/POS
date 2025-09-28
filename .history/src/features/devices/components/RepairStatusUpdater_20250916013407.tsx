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
  Info,
  CreditCard
} from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import DiagnosisModal from './DiagnosisModal';
import SparePartsSelector from '../../repair/components/SparePartsSelector';
import { createRepairPart, createRepairParts, getRepairParts, RepairPart } from '../../repair/services/repairPartsApi';
import { toast } from 'react-hot-toast';

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
  validation?: (device: Device) => { valid: boolean; message?: string };
}

const RepairStatusUpdater: React.FC<RepairStatusUpdaterProps> = ({
  device,
  currentUser,
  onStatusUpdate,
  onClose,
  compact = false,
  financialInfo,
  deviceCosts
}) => {
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Spare parts state
  const [repairParts, setRepairParts] = useState<RepairPart[]>([]);
  const [repairPartsLoading, setRepairPartsLoading] = useState(false);
  const [showSparePartsSelector, setShowSparePartsSelector] = useState(false);
  const [pendingPartsSelection, setPendingPartsSelection] = useState<DeviceStatus | null>(null);

  // Force re-render when device status changes to ensure UI updates immediately
  useEffect(() => {
    console.log('[RepairStatusUpdater] Device status or updatedAt changed, forcing re-render:', {
      status: device.status,
      updatedAt: device.updatedAt,
      timestamp: new Date().toISOString()
    });
    setForceUpdate(prev => prev + 1);
  }, [device.status, device.updatedAt]);

  // Load repair parts when component mounts
  useEffect(() => {
    loadRepairParts();
  }, [device.id]);

  const loadRepairParts = async () => {
    setRepairPartsLoading(true);
    try {
      const response = await getRepairParts(device.id);
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

  const statusTransitions: StatusTransition[] = [
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
      description: 'Begin repair work with available parts',
      icon: <Wrench className="w-4 h-4" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin'],
      validation: (device) => {
        // Check if there are any repair parts with 'received' or 'used' status
        const hasAvailableParts = repairParts.some(part => 
          part.status === 'received' || part.status === 'used'
        );
        
        if (!hasAvailableParts) {
          return { 
            valid: false, 
            message: 'No spare parts are available. Please add spare parts or wait for parts to be received before starting repair.' 
          };
        }
        
        return { valid: true };
      }
    },
    {
      from: 'awaiting-parts',
      to: 'parts-arrived',
      label: 'Parts Arrived',
      description: 'All requested parts have been accepted and arrived',
      icon: <Package className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresNotes: false,
      allowedRoles: ['technician', 'admin', 'customer-care']
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
        // Check if there are any repair parts with 'received' or 'used' status
        const hasAvailableParts = repairParts.some(part => 
          part.status === 'received' || part.status === 'used'
        );
        
        if (!hasAvailableParts && repairParts.length > 0) {
          return { 
            valid: false, 
            message: 'No parts have been received yet. Please wait for parts to arrive or mark them as received.' 
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
      label: 'Complete Repair',
      description: 'Repair done, start testing',
      icon: <TestTube className="w-4 h-4" />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      requiresNotes: false,
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
      label: 'Repair Complete',
      description: 'Testing passed, repair complete',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresNotes: false,
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
      to: 'process-payments',
      label: 'Process Payments',
      description: 'Process outstanding payments before handover',
      icon: <CreditCard className="w-4 h-4" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      requiresNotes: false,
      allowedRoles: ['admin', 'customer-care']
    },
    {
      from: 'process-payments',
      to: 'returned-to-customer-care',
      label: 'Give to Customer',
      description: 'All payments completed, device ready for customer pickup',
      icon: <UserCheck className="w-4 h-4" />,
      color: 'bg-teal-600 hover:bg-teal-700',
      requiresNotes: false,
      allowedRoles: ['admin', 'customer-care'],
      validation: (device) => {
        if (!financialInfo || !deviceCosts) {
          return { valid: false, message: 'Financial information not available' };
        }
        
        const totalRepairCost = deviceCosts.repairCost || 0;
        const totalPaid = financialInfo.totalPaid || 0;
        const totalPending = financialInfo.totalPending || 0;
        
        if (totalPending > 0) {
          return { valid: false, message: `Cannot give device to customer. ${totalPending} pending payments must be completed first.` };
        }
        
        if (totalRepairCost > 0 && totalPaid < totalRepairCost) {
          return { valid: false, message: `Cannot give device to customer. Repair cost (${totalRepairCost}) not fully paid. Amount due: ${totalRepairCost - totalPaid}` };
        }
        
        return { valid: true };
      }
    },
    {
      from: 'returned-to-customer-care',
      to: 'done',
      label: 'Mark Done',
      description: 'Customer picked up device',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresNotes: false,
      allowedRoles: ['admin', 'customer-care']
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
    }
  ];

  const getAvailableTransitions = useMemo((): StatusTransition[] => {
    // Debug logging
    console.log('[RepairStatusUpdater] Device prop received:', {
      id: device.id,
      status: device.status,
      assignedTo: device.assignedTo,
      updatedAt: device.updatedAt,
      timestamp: new Date().toISOString()
    });
    
    const available = statusTransitions.filter(transition => {
      // Check if transition is from current status
      if (transition.from !== device.status) return false;
      
      // Check if user role is allowed
      if (!transition.allowedRoles.includes(currentUser.role)) return false;
      
      // Check if user is assigned technician (for technician role)
      if (currentUser.role === 'technician' && device.assignedTo !== currentUser.id) {
        return false;
      }
      
      return true;
    });
    
    console.log('[RepairStatusUpdater] Available transitions for status', device.status, ':', available.map(t => t.label));
    
    return available;
  }, [device.status, device.assignedTo, currentUser.role, device.id, device.updatedAt, forceUpdate]);

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;

    const transition = statusTransitions.find(t => t.to === selectedStatus);
    if (!transition) return;

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

    // Don't set loading state - optimistic updates provide immediate feedback
    try {
      await onStatusUpdate(device.id, selectedStatus, notes.trim() || undefined);
      // Success feedback is handled by optimistic updates
      setSelectedStatus(null);
      setNotes('');
      onClose?.();
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Status update error:', error);
    }
  };

  // Handle spare parts selection
  const handleSparePartsSelected = async (selectedParts: any[]) => {
    if (!pendingPartsSelection) return;
    
    try {
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
        await onStatusUpdate(device.id, pendingPartsSelection, notes);
        
        // Refresh repair parts list
        await loadRepairParts();
        
        // Reset state
        setPendingPartsSelection(null);
        setShowSparePartsSelector(false);
        setSelectedStatus(null);
        setNotes('');
        onClose?.();
      } else {
        toast.error(response.message || 'Failed to request spare parts');
      }
    } catch (error) {
      console.error('Error requesting spare parts:', error);
      toast.error('Failed to request spare parts');
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
                  if (isUpdating) return;
                  
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

                  // Check if already in target status
                  if (device.status === transition.to) {
                    toast.info(`Device is already in ${transition.label} status`);
                    return;
                  }

                  // No notes required, update immediately in background
                  setIsUpdating(true);
                  try {
                    await onStatusUpdate(device.id, transition.to);
                    toast.success('Status updated successfully');
                  } catch (error) {
                    toast.error('Failed to update status');
                    console.error('Status update error:', error);
                  } finally {
                    setIsUpdating(false);
                  }
                }}
                className={`w-full justify-start ${transition.color} text-white py-4 ${isUpdating ? 'opacity-75 pointer-events-none' : ''}`}
                size="lg"
                disabled={isUpdating}
              >
                {isUpdating ? (
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
                    placeholder={`Add notes for "${transition.label}"...`}
                    className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    rows={2}
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
                        
                        // Show success toast immediately
                        toast.success('Status updated successfully');
                        
                        // Update status in background (optimistic update)
                        setIsUpdating(true);
                        try {
                          await onStatusUpdate(device.id, transition.to, notes.trim());
                        } catch (error) {
                          toast.error('Failed to update status');
                          console.error('Status update error:', error);
                        } finally {
                          setIsUpdating(false);
                        }
                      }}
                      disabled={isUpdating || !notes.trim()}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
                    >
                      {isUpdating ? 'Syncing...' : 'Update Status'}
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
                        setShowDiagnosisModal(true);
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

      {/* Diagnosis Modal */}
      <DiagnosisModal
        device={device}
        isOpen={showDiagnosisModal}
        onClose={() => setShowDiagnosisModal(false)}
        onStatusUpdate={onStatusUpdate}
      />

      {/* Spare Parts Selector Modal */}
      <SparePartsSelector
        device={device}
        isOpen={showSparePartsSelector}
        onClose={() => {
          setShowSparePartsSelector(false);
          setPendingPartsSelection(null);
        }}
        onPartsSelected={handleSparePartsSelected}
      />
    </GlassCard>
  );
};

export default RepairStatusUpdater;

