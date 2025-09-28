import React, { useState, useEffect } from 'react';
import { Device, DeviceStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { 
  Package, Wrench, Clock, CheckCircle, AlertTriangle, 
  Plus, Edit, Trash2, ShoppingCart, Truck, User, Activity, Info, CheckSquare, UserCheck
} from 'lucide-react';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassCard from '../../shared/components/ui/GlassCard';
import PartsManagementModal from './PartsManagementModal';
import DiagnosisModal from './DiagnosisModal';
import RepairPartsModal from '../../repair/components/RepairPartsModal';
import { toast } from 'react-hot-toast';
import { getRepairParts } from '../../repair/services/repairPartsApi';
import { validateRepairStart, hasNeededParts, allPartsReady } from '../../../utils/repairValidation';
import { validateDeviceHandover } from '../../../utils/paymentValidation';
import DiagnosticTemplateManager from '../../diagnostics/components/DiagnosticTemplateManager';

interface RepairPart {
  id: string;
  name: string;
  description: string;
  quantity: number;
  cost: number;
  status: 'ordered' | 'shipped' | 'received' | 'installed';
  supplier: string;
  estimatedArrival?: string;
  notes?: string;
}

interface RepairStatusGridProps {
  device: Device;
  currentUser: any;
  onStatusUpdate: (deviceId: string, newStatus: DeviceStatus, notes?: string) => Promise<void>;
  onPartsUpdate?: (parts: RepairPart[]) => void;
}

const RepairStatusGrid: React.FC<RepairStatusGridProps> = ({
  device,
  currentUser,
  onStatusUpdate,
  onPartsUpdate
}) => {
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);
  
  // Load repair parts when device changes
  useEffect(() => {
    if (device?.id) {
      loadRepairParts();
    }
  }, [device?.id]);

  // Track device status changes
  useEffect(() => {
    // Device status tracking
  }, [device.status]);

  const [parts, setParts] = useState<RepairPart[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);

  const [showAddPart, setShowAddPart] = useState(false);
  const [editingPart, setEditingPart] = useState<RepairPart | null>(null);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showRepairPartsModal, setShowRepairPartsModal] = useState(false);
  const [showDiagnosticTemplateManager, setShowDiagnosticTemplateManager] = useState(false);

  // Load repair parts from database
  const loadRepairParts = async () => {
    if (!device?.id) return;
    
    setPartsLoading(true);
    try {
      const response = await getRepairParts(device.id);
      if (response.ok && response.data) {
        // Transform the data to match the expected interface
        const transformedParts = response.data.map((part: any) => ({
          id: part.id,
          name: part.spare_part?.name || 'Unknown Part',
          description: part.spare_part?.description || '',
          quantity: part.quantity_needed || 0,
          cost: part.cost_per_unit || 0,
          status: part.status || 'needed',
          supplier: part.spare_part?.supplier?.name || 'Unknown',
          estimatedArrival: part.estimated_arrival || null,
          notes: part.notes || ''
        }));
        setParts(transformedParts);
      } else {
        console.warn('Error loading repair parts:', response.message);
        setParts([]);
      }
    } catch (error) {
      console.error('Error loading repair parts:', error);
      setParts([]);
    } finally {
      setPartsLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'received': return 'bg-green-100 text-green-800 border-green-200';
      case 'installed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ordered': return <Clock className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'received': return <Package className="w-4 h-4" />;
      case 'installed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleStartRepair = async () => {
    console.log('[RepairStatusGrid] handleStartRepair called for device:', device.id);
    try {
      console.log('[RepairStatusGrid] Calling onStatusUpdate with:', { deviceId: device.id, status: 'in-repair', notes: 'Parts received, starting repair work' });
      await onStatusUpdate(device.id, 'in-repair', 'Parts received, starting repair work');
      // Success feedback is handled by optimistic updates
    } catch (error) {
      console.error('[RepairStatusGrid] Error in handleStartRepair:', error);
      toast.error('Failed to update repair status');
    }
  };

  const handlePartStatusUpdate = (partId: string, newStatus: RepairPart['status']) => {
    const updatedParts = parts.map(part => 
      part.id === partId ? { ...part, status: newStatus } : part
    );
    setParts(updatedParts);
    onPartsUpdate?.(updatedParts);
    toast.success(`Part status updated to ${newStatus}`);
  };

  const handleAddPart = (newPart: RepairPart) => {
    setParts(prev => [...prev, newPart]);
    onPartsUpdate?.([...parts, newPart]);
    setShowAddPart(false);
  };

  const handleEditPart = (updatedPart: RepairPart) => {
    const updatedParts = parts.map(part => 
      part.id === updatedPart.id ? updatedPart : part
    );
    setParts(updatedParts);
    onPartsUpdate?.(updatedParts);
    setEditingPart(null);
  };

  const handleDeletePart = (partId: string) => {
    const updatedParts = parts.filter(part => part.id !== partId);
    setParts(updatedParts);
    onPartsUpdate?.(updatedParts);
    toast.success('Part removed successfully');
  };

  const canStartRepair = () => {
    return parts.some(part => part.status === 'received') && 
           parts.every(part => part.status === 'received' || part.status === 'installed');
  };

  const getTotalPartsCost = () => {
    return parts.reduce((total, part) => total + (part.cost * part.quantity), 0);
  };

  const getPartsProgress = () => {
    const totalParts = parts.length;
    const receivedParts = parts.filter(part => part.status === 'received' || part.status === 'installed').length;
    return totalParts > 0 ? Math.round((receivedParts / totalParts) * 100) : 0;
  };

  const getStatusProgress = (status: string): number => {
    const statusProgressMap: Record<string, number> = {
      'assigned': 0.1,
      'diagnosis-started': 0.2,
      'awaiting-parts': 0.3,
      'parts-arrived': 0.4,
      'in-repair': 0.6,
      'reassembled-testing': 0.8,
      'repair-complete': 0.9,
      'returned-to-customer-care': 0.95,
      'done': 1.0
    };
    return statusProgressMap[status] || 0;
  };

  if (device.status === 'awaiting-parts') {
    return (
      <div className="space-y-6">
        {/* Awaiting Parts Header */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-orange-900">Awaiting Parts</h3>
                <p className="text-orange-700">Waiting for replacement parts to arrive</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-900">{getPartsProgress()}%</div>
              <div className="text-sm text-orange-600">Parts Ready</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-orange-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getPartsProgress()}%` }}
            ></div>
          </div>

          {/* Parts Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-sm text-orange-600 mb-1">Total Parts</div>
              <div className="text-lg font-bold text-orange-900">{parts.length}</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-sm text-orange-600 mb-1">Received</div>
              <div className="text-lg font-bold text-orange-900">
                {parts.filter(p => p.status === 'received' || p.status === 'installed').length}
              </div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-sm text-orange-600 mb-1">Total Cost</div>
              <div className="text-lg font-bold text-orange-900">
                {getTotalPartsCost().toLocaleString()} TSH
              </div>
            </div>
          </div>
        </div>

        {/* Parts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parts.map((part) => (
            <GlassCard key={part.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{part.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{part.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Qty: {part.quantity}</span>
                    <span>Cost: {part.cost.toLocaleString()} TSH</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(part.status)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(part.status)}
                      {part.status}
                    </div>
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Supplier: {part.supplier}</span>
                </div>
                {part.estimatedArrival && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">ETA: {part.estimatedArrival}</span>
                  </div>
                )}
                {part.notes && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {part.notes}
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div className="flex gap-2 flex-wrap">
                {part.status === 'ordered' && (
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={() => handlePartStatusUpdate(part.id, 'shipped')}
                  >
                    <Truck className="w-4 h-4" />
                    Mark Shipped
                  </GlassButton>
                )}
                {part.status === 'shipped' && (
                  <GlassButton
                    variant="success"
                    size="sm"
                    onClick={() => handlePartStatusUpdate(part.id, 'received')}
                  >
                    <Package className="w-4 h-4" />
                    Mark Received
                  </GlassButton>
                )}
                {part.status === 'received' && (
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePartStatusUpdate(part.id, 'installed')}
                  >
                    <Wrench className="w-4 h-4" />
                    Mark Installed
                  </GlassButton>
                )}
                
                {/* Edit and Delete buttons */}
                <div className="flex gap-1 ml-auto">
                  <button
                    onClick={() => setEditingPart(part)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit part"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePart(part.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete part"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Start Repair Button */}
        {canStartRepair() && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-900">Ready to Start Repair</h3>
                  <p className="text-green-700">All required parts have been received</p>
                </div>
              </div>
              <GlassButton
                variant="success"
                size="lg"
                onClick={handleStartRepair}
                className="px-6 py-3"
              >
                <Wrench className="w-5 h-5" />
                Start Repair
              </GlassButton>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <GlassButton
            variant="outline"
            onClick={() => setShowAddPart(true)}
            className="px-6 py-3"
          >
            <Plus className="w-5 h-5" />
            Add Part
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={() => setShowRepairPartsModal(true)}
            className="px-6 py-3"
          >
            <Package className="w-5 h-5" />
            Manage Spare Parts
          </GlassButton>
        </div>

        {/* Parts Management Modal */}
        <PartsManagementModal
          isOpen={showAddPart}
          onClose={() => setShowAddPart(false)}
          onSave={handleAddPart}
        />

        <PartsManagementModal
          isOpen={!!editingPart}
          onClose={() => setEditingPart(null)}
          onSave={handleEditPart}
          editingPart={editingPart}
        />

        {/* Repair Parts Modal */}
        <RepairPartsModal
          isOpen={showRepairPartsModal}
          onClose={() => setShowRepairPartsModal(false)}
          device={device}
          onPartsUpdate={(newParts) => {
            // Convert RepairPartsModal parts to RepairPart format
            const convertedParts = newParts.map(part => ({
              id: part.id,
              name: part.name,
              description: part.notes || `Part number: ${part.part_number}`,
              quantity: part.quantity_needed,
              cost: part.cost_per_unit,
              status: part.status === 'needed' ? 'ordered' as const :
                     part.status === 'ordered' ? 'ordered' as const :
                     part.status === 'received' ? 'received' as const :
                     'installed' as const,
              supplier: 'Internal Stock',
              notes: part.notes
            }));
            setParts(convertedParts);
            onPartsUpdate?.(convertedParts);
          }}
        />
      </div>
    );
  }

  if (device.status === 'parts-arrived') {
    return (
      <div className="space-y-6">
        {/* Parts Arrived Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-900">Parts Arrived</h3>
                <p className="text-green-700">All required parts have been received and are ready for repair</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-900">100%</div>
              <div className="text-sm text-green-600">Parts Ready</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-green-200 rounded-full h-3 mb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 w-full"></div>
          </div>

          {/* Parts Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-sm text-green-600 mb-1">Total Parts</div>
              <div className="text-lg font-bold text-green-900">{parts.length}</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-sm text-green-600 mb-1">Received</div>
              <div className="text-lg font-bold text-green-900">
                {parts.filter(p => p.status === 'received' || p.status === 'installed').length}
              </div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-sm text-green-600 mb-1">Total Cost</div>
              <div className="text-lg font-bold text-green-900">
                {getTotalPartsCost().toLocaleString()} TSH
              </div>
            </div>
          </div>
        </div>

        {/* Parts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parts.map((part) => (
            <div key={part.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{part.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  part.status === 'received' ? 'bg-green-100 text-green-700' :
                  part.status === 'installed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {part.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Cost:</span> {part.cost.toLocaleString()} TSH
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Supplier:</span> {part.supplier}
                </div>
                {part.description && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Description:</span> {part.description}
                  </div>
                )}
                {part.notes && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {part.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={() => onStatusUpdate(device.id, 'in-repair')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Wrench className="w-5 h-5" />
            Start Repair
          </GlassButton>
        </div>
      </div>
    );
  }

  // For other statuses, show a grid of available actions
  const getAvailableActions = () => {
    const actions = [];
    
    if (device.status === 'assigned') {
      actions.push({
        id: 'start-diagnosis',
        title: 'Start Diagnosis',
        description: 'Begin diagnostic process',
        icon: <AlertTriangle className="w-6 h-6" />,
        color: 'bg-yellow-500',
        action: async () => {
          setShowDiagnosisModal(true);
        }
      });
    }

    if (device.status === 'diagnosis-started') {
      // Check if device has spare parts that need to be ordered
      const needsParts = hasNeededParts(parts);
      
      if (needsParts) {
        actions.push({
          id: 'awaiting-parts',
          title: 'Request Parts & Await',
          description: 'Request spare parts and wait for delivery',
          icon: <Package className="w-6 h-6" />,
          color: 'bg-orange-500',
          action: async () => {
            setUpdatingAction('awaiting-parts');
            try {
              await onStatusUpdate(device.id, 'awaiting-parts');
            } finally {
              setUpdatingAction(null);
            }
          }
        });
      } else {
        // Validate if repair can be started
        const validation = validateRepairStart(parts);
        
        if (validation.valid) {
          actions.push({
            id: 'start-repair',
            title: 'Start Repair',
            description: 'Begin repair work with available parts',
            icon: <Wrench className="w-6 h-6" />,
            color: 'bg-purple-500',
            action: async () => {
              setUpdatingAction('start-repair');
              try {
                await onStatusUpdate(device.id, 'in-repair');
              } finally {
                setUpdatingAction(null);
              }
            }
          });
        } else {
          // Show validation error as disabled action
          actions.push({
            id: 'start-repair-disabled',
            title: 'Start Repair',
            description: validation.message || 'Cannot start repair',
            icon: <Wrench className="w-6 h-6" />,
            color: 'bg-gray-400 cursor-not-allowed',
            disabled: true,
            action: async () => {
              toast.error(validation.message || 'Cannot start repair');
            }
          });
        }
      }
    }

    if (device.status === 'awaiting-parts') {
      // Check if all parts are now ready
      const partsReady = allPartsReady(parts);
      
      if (partsReady) {
        actions.push({
          id: 'parts-arrived',
          title: 'Parts Arrived',
          description: 'All parts received, ready to start repair',
          icon: <Package className="w-6 h-6" />,
          color: 'bg-green-500',
          action: async () => {
            setUpdatingAction('parts-arrived');
            try {
              await onStatusUpdate(device.id, 'parts-arrived');
            } finally {
              setUpdatingAction(null);
            }
          }
        });
      } else {
        actions.push({
          id: 'check-parts',
          title: 'Check Parts Status',
          description: 'Review spare parts delivery status',
          icon: <Package className="w-6 h-6" />,
          color: 'bg-blue-500',
          action: async () => {
            setShowRepairPartsModal(true);
          }
        });
      }
    }

    if (device.status === 'parts-arrived') {
      actions.push({
        id: 'start-repair',
        title: 'Start Repair',
        description: 'Begin repair work with all parts ready',
        icon: <Wrench className="w-6 h-6" />,
        color: 'bg-purple-500',
        action: async () => {
          setUpdatingAction('start-repair');
          try {
            await onStatusUpdate(device.id, 'in-repair');
          } finally {
            setUpdatingAction(null);
          }
        }
      });
    }

    if (device.status === 'in-repair') {
      actions.push({
        id: 'testing',
        title: 'Start Testing',
        description: 'Device reassembled, begin testing',
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'bg-indigo-500',
        action: async () => {
          setUpdatingAction('testing');
          try {
            await onStatusUpdate(device.id, 'reassembled-testing');
          } finally {
            setUpdatingAction(null);
          }
        }
      });
    }

    if (device.status === 'reassembled-testing') {
      actions.push({
        id: 'complete',
        title: 'Complete Repair',
        description: 'Repair completed successfully',
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'bg-green-500',
        action: async () => {
          setUpdatingAction('complete');
          try {
            await onStatusUpdate(device.id, 'repair-complete');
          } finally {
            setUpdatingAction(null);
          }
        }
      });
    }

    if (device.status === 'repair-complete') {
      // Skip payment processing - go directly to customer care
      actions.push({
        id: 'return-to-customer-care',
        title: 'Return to Customer Care',
        description: 'Device ready for customer pickup',
        icon: <UserCheck className="w-6 h-6" />,
        color: 'bg-teal-500',
        action: async () => {
          setUpdatingAction('return-to-customer-care');
          try {
            // Validate payments before allowing handover
            const paymentValidation = await validateDeviceHandover(device.id);
            if (!paymentValidation.valid) {
              toast.error(paymentValidation.message || 'Cannot handover device to customer');
              setUpdatingAction(null);
              return;
            }
            await onStatusUpdate(device.id, 'returned-to-customer-care');
          } finally {
            setUpdatingAction(null);
          }
        }
      });
    }


    if (device.status === 'returned-to-customer-care') {
      actions.push({
        id: 'mark-done',
        title: 'Mark as Done',
        description: 'Customer has received device',
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'bg-green-600',
        action: async () => {
          setUpdatingAction('mark-done');
          try {
            // Validate payments before allowing final handover
            const paymentValidation = await validateDeviceHandover(device.id);
            if (!paymentValidation.valid) {
              toast.error(paymentValidation.message || 'Cannot mark device as done');
              setUpdatingAction(null);
              return;
            }
            await onStatusUpdate(device.id, 'done');
          } finally {
            setUpdatingAction(null);
          }
        }
      });
    }

    // Add spare parts management action for most statuses
    if (['diagnosis-started', 'awaiting-parts', 'parts-arrived', 'in-repair'].includes(device.status)) {
      actions.push({
        id: 'manage-parts',
        title: 'Manage Spare Parts',
        description: 'Add, update, or track spare parts',
        icon: <Package className="w-6 h-6" />,
        color: 'bg-purple-500',
        action: async () => {
          setShowRepairPartsModal(true);
        }
      });
    }

    // Add repair checklist action for most statuses
    if (['diagnosis-started', 'awaiting-parts', 'in-repair'].includes(device.status)) {
      actions.push({
        id: 'repair-checklist',
        title: 'Repair Checklist',
        description: 'View and update repair checklist',
        icon: <CheckSquare className="w-6 h-6" />,
        color: 'bg-orange-500',
        action: async () => {
          // This would open the repair checklist modal
          console.log('Opening repair checklist');
        }
      });
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  // Special case for completed devices
  if (device.status === 'done') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Repair Completed! 🎉</h3>
        <p className="text-gray-600">Device has been successfully repaired and returned to customer</p>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Status:</strong> {device.status} (100% Complete)
          </p>
        </div>
      </div>
    );
  }

  if (availableActions.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Actions Available</h3>
        <p className="text-gray-600">Current status: {device.status}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Update Buttons - Top Priority */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Status Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableActions.map((action) => (
            <div key={action.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                  <div className="text-white">
                    {action.icon}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{action.title}</h4>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
              <GlassButton
                variant="primary"
                onClick={action.action}
                className="w-full"
                disabled={updatingAction !== null}
              >
                {updatingAction === action.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  action.title
                )}
              </GlassButton>
            </div>
          ))}
        </div>
      </div>

      {/* Current Status Information */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Current Status
        </h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span className="text-lg font-medium text-gray-800 capitalize">{device.status.replace('-', ' ')}</span>
          <div className="ml-auto">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {Math.round((getStatusProgress(device.status) || 0) * 100)}% Complete
            </span>
          </div>
        </div>
        {device.remarks && (
          <div className="mt-4 p-4 bg-white border border-blue-100 rounded-lg">
            <p className="text-sm text-gray-600">{device.remarks}</p>
          </div>
        )}
      </div>


      {/* Diagnosis Modal */}
      <DiagnosisModal
        device={device}
        isOpen={showDiagnosisModal}
        onClose={() => setShowDiagnosisModal(false)}
        onStatusUpdate={onStatusUpdate}
      />
    </div>
  );
};

export default RepairStatusGrid;
