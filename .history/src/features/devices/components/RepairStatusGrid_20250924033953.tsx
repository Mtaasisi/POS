import React, { useState, useEffect } from 'react';
import { Device, DeviceStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { 
  Package, Wrench, Clock, CheckCircle, AlertTriangle, 
  Plus, Edit, Trash2, ShoppingCart, Truck, User, Activity, Info, CheckSquare, UserCheck, CreditCard, X, XCircle
} from 'lucide-react';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassCard from '../../shared/components/ui/GlassCard';
import PartsManagementModal from './PartsManagementModal';
import DiagnosticChecklistModal from './DiagnosticChecklistModal';
// import RepairPartsModal from '../../repair/components/RepairPartsModal';
import PaymentsPopupModal from '../../../components/PaymentsPopupModal';
import { toast } from 'react-hot-toast';
import { getRepairParts } from '../../lats/lib/sparePartsApi';
import { validateRepairStart, hasNeededParts, allPartsReady } from '../../../utils/repairValidation';
import { validateDeviceHandover, getDevicePaymentInfo } from '../../../utils/paymentValidation';
import { supabase } from '../../../lib/supabaseClient';
import { formatCurrency } from '../../../lib/customerApi';

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  
  // Handle payment completion
  const handlePaymentComplete = async (paymentData: any, totalPaid?: number) => {
    try {
      // Record the payment in customer_payments table
      const { error } = await supabase
        .from('customer_payments')
        .insert({
          customer_id: device?.customerId,
          device_id: device?.id,
          amount: totalPaid || paymentData.amount,
          method: paymentData.method || 'cash',
          payment_type: 'payment',
          status: 'completed',
          payment_date: new Date().toISOString(),
          currency: 'TZS', // Add required currency column
          payment_account_id: paymentData.paymentAccountId || null, // Add required payment_account_id
          payment_method_id: paymentData.paymentMethodId || null, // Add required payment_method_id
          reference: paymentData.reference || null, // Add reference column
          notes: `Device payment - ${device?.brand} ${device?.model}`,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast.success(`Payment of ${formatCurrency(totalPaid || paymentData.amount)} recorded successfully`);
      setShowPaymentModal(false);
      
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };
  
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
  const [showDiagnosticChecklist, setShowDiagnosticChecklist] = useState(false);
  const [showRepairPartsModal, setShowRepairPartsModal] = useState(false);

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

        {/* Repair Parts Management Modal */}
        {showRepairPartsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Manage Spare Parts
                </h2>
                <button
                  onClick={() => setShowRepairPartsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-4">
                  {/* Add New Part Button */}
                  <div className="flex justify-end">
                    <GlassButton
                      variant="primary"
                      onClick={() => setShowAddPart(true)}
                      className="px-4 py-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Part
                    </GlassButton>
                  </div>
                  
                  {/* Parts List */}
                  {parts.length > 0 ? (
                    <div className="space-y-3">
                      {parts.map((part) => (
                        <div key={part.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                <Package className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{part.name}</h4>
                                <p className="text-sm text-gray-600">{part.description}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              part.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                              part.status === 'shipped' ? 'bg-yellow-100 text-yellow-800' :
                              part.status === 'received' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {part.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div>Quantity: {part.quantity}</div>
                            <div>Cost: {formatCurrency(part.cost)}</div>
                            <div>Total: {formatCurrency(part.quantity * part.cost)}</div>
                            <div>Supplier: {part.supplier}</div>
                          </div>
                          
                          {part.notes && (
                            <div className="text-sm text-gray-500 italic mb-3">
                              Note: {part.notes}
                            </div>
                          )}
                          
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
                                <CheckCircle className="w-4 h-4" />
                                Mark Received
                              </GlassButton>
                            )}
                            {part.status === 'received' && (
                              <GlassButton
                                variant="success"
                                size="sm"
                                onClick={() => handlePartStatusUpdate(part.id, 'installed')}
                              >
                                <Wrench className="w-4 h-4" />
                                Mark Installed
                              </GlassButton>
                            )}
                            <GlassButton
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPart(part);
                                setShowAddPart(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </GlassButton>
                            <GlassButton
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeletePart(part.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </GlassButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No spare parts added</h3>
                      <p className="text-gray-500 mb-4">
                        Add spare parts needed for this repair
                      </p>
                      <GlassButton
                        variant="primary"
                        onClick={() => setShowAddPart(true)}
                        className="px-6 py-3"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Part
                      </GlassButton>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <GlassButton
                  variant="outline"
                  onClick={() => setShowRepairPartsModal(false)}
                >
                  Close
                </GlassButton>
              </div>
            </div>
          </div>
        )}
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
    
    // Role-based access control
    const isAssignedTechnician = currentUser?.role === 'technician' && device.assignedTo === currentUser.id;
    const isAdmin = currentUser?.role === 'admin';
    const isCustomerCare = currentUser?.role === 'customer-care';
    
    if (device.status === 'assigned') {
      // Only assigned technician, admin, or customer-care can start diagnosis
      if (isAssignedTechnician || isAdmin || isCustomerCare) {
      actions.push({
        id: 'start-diagnosis',
        title: 'Start Diagnosis',
        description: 'Begin diagnostic process',
        icon: <AlertTriangle className="w-6 h-6" />,
        color: 'bg-yellow-500',
        action: async () => {
          setShowDiagnosticChecklist(true);
        }
      });
      }
    }

    if (device.status === 'diagnosis-started') {
      // Only assigned technician or admin can start repair
      if (isAssignedTechnician || isAdmin) {
      // Check if device has spare parts that need to be ordered
      const needsParts = hasNeededParts(parts);
      
        if (!needsParts) {
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
    }

    if (device.status === 'awaiting-parts') {
      // Assigned technician, admin, or customer-care can manage parts
      if (isAssignedTechnician || isAdmin || isCustomerCare) {
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
    }

    if (device.status === 'parts-arrived') {
      // Only assigned technician or admin can start repair
      if (isAssignedTechnician || isAdmin) {
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
    }

    if (device.status === 'in-repair') {
      // Only assigned technician or admin can start testing
      if (isAssignedTechnician || isAdmin) {
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
    }

    if (device.status === 'reassembled-testing') {
      // Only assigned technician or admin can complete repair
      if (isAssignedTechnician || isAdmin) {
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
    }

    // REMOVED: Process Payments action - Repair payment functionality removed

    // Direct transition from repair-complete to returned-to-customer-care (payments removed)
    if (device.status === 'repair-complete') {
      // Assigned technician, admin, or customer-care can return to customer care
      if (isAssignedTechnician || isAdmin || isCustomerCare) {
      actions.push({
        id: 'return-to-customer-care',
        title: 'Return to Customer Care',
          description: 'Device ready for customer pickup',
        icon: <UserCheck className="w-6 h-6" />,
        color: 'bg-teal-500',
        action: async () => {
          setUpdatingAction('return-to-customer-care');
          try {
            await onStatusUpdate(device.id, 'returned-to-customer-care');
          } finally {
            setUpdatingAction(null);
          }
        }
      });
      }
    }

    // REMOVED: process-payments status handling - Repair payment functionality removed

    if (device.status === 'returned-to-customer-care') {
      // Only admin or customer-care can mark as done
      if (isAdmin || isCustomerCare) {
      actions.push({
        id: 'mark-done',
        title: 'Mark as Done',
        description: 'Customer has received device',
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'bg-green-600',
        action: async () => {
          setUpdatingAction('mark-done');
          try {
              // REMOVED: Payment validation - Repair payment functionality removed
            await onStatusUpdate(device.id, 'done');
          } finally {
            setUpdatingAction(null);
          }
        }
      });
    }
    }

    // Additional actions available during repair process
    // Request Parts - Available anytime during repair for technicians and admins
    if (['diagnosis-started', 'awaiting-parts', 'parts-arrived', 'in-repair', 'reassembled-testing'].includes(device.status)) {
      if (isAssignedTechnician || isAdmin) {
        actions.push({
          id: 'request-parts',
          title: 'Request Parts',
          description: 'Request additional spare parts for repair',
          icon: <Package className="w-6 h-6" />,
          color: 'bg-orange-500',
          action: async () => {
            // This will trigger the spare parts selector modal
            // The modal is handled by the parent component
            toast.info('Opening spare parts selector...');
            // Note: The actual modal opening is handled by the parent component
            // This button serves as a visual indicator and can trigger the modal
          }
        });
      }
    }

    // Mark as Failed - Available anytime during repair for technicians and admins
    if (['diagnosis-started', 'awaiting-parts', 'parts-arrived', 'in-repair', 'reassembled-testing'].includes(device.status)) {
      if (isAssignedTechnician || isAdmin) {
        actions.push({
          id: 'mark-failed',
          title: 'Mark as Failed',
          description: 'Mark repair as failed - cannot be completed',
          icon: <XCircle className="w-6 h-6" />,
          color: 'bg-red-500',
          action: async () => {
            setUpdatingAction('mark-failed');
            try {
              await onStatusUpdate(device.id, 'failed');
            } finally {
              setUpdatingAction(null);
            }
          }
        });
      }
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
      {/* Status Actions - Clean Design */}
      <div className="space-y-4">
        
        <div className="space-y-3">
          {availableActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              disabled={updatingAction !== null}
              className={`
                group relative overflow-hidden rounded-xl p-4 transition-all duration-300 w-full
                ${updatingAction !== null ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] hover:shadow-lg'}
                ${action.color === 'bg-indigo-500' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' :
                  action.color === 'bg-purple-500' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                  action.color === 'bg-green-500' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  action.color === 'bg-orange-500' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                  action.color === 'bg-blue-500' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  action.color === 'bg-red-500' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                  'bg-gradient-to-br from-slate-500 to-slate-600'}
                shadow-md hover:shadow-xl
              `}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="text-white">
                    {action.icon}
                  </div>
                </div>
                
                <div className="flex-1 text-left">
                {updatingAction === action.id ? (
                    <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-white font-semibold">Updating...</span>
                  </div>
                ) : (
                    <>
                      <h4 className="text-white font-bold text-lg mb-1">{action.title}</h4>
                      <p className="text-white/80 text-sm">{action.description}</p>
                    </>
                )}
      </div>

                {/* Arrow Icon */}
                {updatingAction !== action.id && (
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg className="w-4 h-4 text-white transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
          </div>
                )}
        </div>
            </button>
          ))}
          </div>
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
      
      {/* POS Payment Modal */}
      <PaymentsPopupModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentAmount(0);
        }}
        amount={paymentAmount}
        customerId={device?.customerId || ''}
        customerName={device?.customerName || 'Unknown Customer'}
        description={`Device payment - ${device?.brand} ${device?.model}`}
        onPaymentComplete={handlePaymentComplete}
        deviceId={device?.id}
        allowPriceEdit={true}
        paymentType="cash_in"
        title="Device Repair Payment"
      />
    </div>
  );
};

export default RepairStatusGrid;
