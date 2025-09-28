import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useInventoryStore } from '../../lats/stores/useInventoryStore';
import { SparePart } from '../../lats/types/spareParts';
import { Device } from '../../../types';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import { 
  X, Package, Search, Plus, Minus, CheckCircle, AlertTriangle, 
  Clock, DollarSign, Hash, Eye, Trash2, RefreshCw, Filter,
  ShoppingCart, Wrench, AlertCircle, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  getRepairParts, 
  createRepairPart, 
  updateRepairPart, 
  deleteRepairPart, 
  useRepairPart,
  RepairPart as ApiRepairPart 
} from '../services/repairPartsApi';
import SparePartDetailsCard from './SparePartDetailsCard';

interface RepairPart {
  id: string;
  spare_part_id: string;
  name: string;
  part_number: string;
  quantity_needed: number;
  quantity_used: number;
  cost_per_unit: number;
  total_cost: number;
  status: 'needed' | 'ordered' | 'accepted' | 'received' | 'used';
  notes?: string;
  spare_part?: SparePart;
}

interface RepairPartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device;
  onPartsUpdate?: (parts: RepairPart[]) => void;
}

const RepairPartsModal: React.FC<RepairPartsModalProps> = ({
  isOpen,
  onClose,
  device,
  onPartsUpdate
}) => {
  const { currentUser } = useAuth();
  const { 
    spareParts, 
    isLoading: sparePartsLoading, 
    loadSpareParts,
    useSparePart 
  } = useInventoryStore();

  // Local state
  const [repairParts, setRepairParts] = useState<RepairPart[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddPart, setShowAddPart] = useState(false);
  const [selectedSparePart, setSelectedSparePart] = useState<SparePart | null>(null);
  const [quantityNeeded, setQuantityNeeded] = useState(1);
  const [partNotes, setPartNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSparePartsSelector, setShowSparePartsSelector] = useState(false);

  // Load spare parts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSpareParts();
      loadRepairParts();
    }
  }, [isOpen, loadSpareParts]);

  // Load repair parts from database
  const loadRepairParts = async () => {
    setLoading(true);
    try {
      const result = await getRepairParts(device.id);
      if (result.ok && result.data) {
        // Convert API format to component format
        const convertedParts: RepairPart[] = result.data.map(apiPart => ({
          id: apiPart.id,
          spare_part_id: apiPart.spare_part_id,
          name: apiPart.spare_part?.name || 'Unknown Part',
          part_number: apiPart.spare_part?.part_number || 'N/A',
          quantity_needed: apiPart.quantity_needed,
          quantity_used: apiPart.quantity_used,
          cost_per_unit: apiPart.cost_per_unit,
          total_cost: apiPart.total_cost,
          status: apiPart.status,
          notes: apiPart.notes,
          spare_part: apiPart.spare_part
        }));
        setRepairParts(convertedParts);
      } else {
        toast.error(result.message || 'Failed to load repair parts');
      }
    } catch (error) {
      console.error('Error loading repair parts:', error);
      toast.error('Failed to load repair parts');
    } finally {
      setLoading(false);
    }
  };

  // Filter spare parts based on search and category
  const filteredSpareParts = spareParts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.part_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || part.category_id === selectedCategory;
    return matchesSearch && matchesCategory && part.is_active && part.quantity > 0;
  });

  // Add part to repair
  const handleAddPart = async () => {
    if (!selectedSparePart) return;

    setLoading(true);
    try {
      const result = await createRepairPart({
        device_id: device.id,
        spare_part_id: selectedSparePart.id,
        quantity_needed: quantityNeeded,
        cost_per_unit: selectedSparePart.selling_price,
        notes: partNotes
      });

      if (result.ok && result.data) {
        // Convert API format to component format
        const newPart: RepairPart = {
          id: result.data.id,
          spare_part_id: result.data.spare_part_id,
          name: result.data.spare_part?.name || selectedSparePart.name,
          part_number: result.data.spare_part?.part_number || selectedSparePart.part_number,
          quantity_needed: result.data.quantity_needed,
          quantity_used: result.data.quantity_used,
          cost_per_unit: result.data.cost_per_unit,
          total_cost: result.data.total_cost,
          status: result.data.status,
          notes: result.data.notes,
          spare_part: result.data.spare_part
        };

        setRepairParts(prev => [...prev, newPart]);
        setSelectedSparePart(null);
        setQuantityNeeded(1);
        setPartNotes('');
        setShowAddPart(false);
        toast.success('Part added to repair');
      } else {
        toast.error(result.message || 'Failed to add part to repair');
      }
    } catch (error) {
      console.error('Error adding part to repair:', error);
      toast.error('Failed to add part to repair');
    } finally {
      setLoading(false);
    }
  };

  // Update part status
  const handleUpdatePartStatus = async (partId: string, status: RepairPart['status']) => {
    setLoading(true);
    try {
      const result = await updateRepairPart(partId, { status });
      if (result.ok && result.data) {
        setRepairParts(prev => 
          prev.map(part => 
            part.id === partId ? { ...part, status } : part
          )
        );
        toast.success('Part status updated');
      } else {
        toast.error(result.message || 'Failed to update part status');
      }
    } catch (error) {
      console.error('Error updating part status:', error);
      toast.error('Failed to update part status');
    } finally {
      setLoading(false);
    }
  };

  // Use spare part (record usage)
  const handleUseSparePart = async (part: RepairPart) => {
    if (!part.spare_part) return;

    setLoading(true);
    try {
      const result = await useRepairPart(part.id);

      if (result.ok && result.data) {
        // Update the part in the list with the new data
        setRepairParts(prev => 
          prev.map(p => 
            p.id === part.id 
              ? {
                  ...p,
                  quantity_used: result.data!.quantity_used,
                  status: result.data!.status as RepairPart['status']
                }
              : p
          )
        );
        toast.success('Spare part usage recorded');
      } else {
        toast.error(result.message || 'Failed to record usage');
      }
    } catch (error) {
      console.error('Error using spare part:', error);
      toast.error('Failed to record spare part usage');
    } finally {
      setLoading(false);
    }
  };

  // Remove part from repair
  const handleRemovePart = async (partId: string) => {
    setLoading(true);
    try {
      const result = await deleteRepairPart(partId);
      if (result.ok) {
        setRepairParts(prev => prev.filter(part => part.id !== partId));
        toast.success('Part removed from repair');
      } else {
        toast.error(result.message || 'Failed to remove part');
      }
    } catch (error) {
      console.error('Error removing part:', error);
      toast.error('Failed to remove part');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk part selection from SparePartsSelector
  const handleBulkPartSelection = async (selectedParts: any[]) => {
    setLoading(true);
    try {
      const promises = selectedParts.map(part => 
        createRepairPart({
          device_id: device.id,
          spare_part_id: part.spare_part_id,
          quantity_needed: part.quantity,
          cost_per_unit: part.cost_per_unit,
          notes: part.notes
        })
      );

      const results = await Promise.all(promises);
      const successfulResults = results.filter(result => result.ok);
      
      if (successfulResults.length > 0) {
        // Reload repair parts to get the updated list
        await loadRepairParts();
        toast.success(`${successfulResults.length} parts added to repair`);
      }
      
      if (successfulResults.length < selectedParts.length) {
        toast.error('Some parts could not be added');
      }
    } catch (error) {
      console.error('Error adding bulk parts:', error);
      toast.error('Failed to add selected parts');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalCost = repairParts.reduce((sum, part) => sum + part.total_cost, 0);
  const partsNeeded = repairParts.filter(part => part.status === 'needed').length;
  const partsReceived = repairParts.filter(part => part.status === 'received').length;
  const partsUsed = repairParts.filter(part => part.status === 'used').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded flex items-center justify-center">
                <Package className="w-3 h-3" />
              </div>
              <div>
                <h2 className="text-base font-bold">Repair Parts</h2>
                <p className="text-blue-100 text-xs">
                  {device.brand} {device.model}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 bg-white bg-opacity-20 rounded flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-2">
            <GlassCard className="p-2">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-orange-600">{partsNeeded}</div>
                  <div className="text-xs text-gray-600">Needed</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-2">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                  <Package className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-600">{partsReceived}</div>
                  <div className="text-xs text-gray-600">Received</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-2">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-green-600">{partsUsed}</div>
                  <div className="text-xs text-gray-600">Used</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-2">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                  <DollarSign className="w-3 h-3 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-purple-600">
                    {totalCost.toLocaleString()} TZS
                  </div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Add Part Section */}
          {!showAddPart ? (
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold">Parts</h3>
              <div className="flex items-center gap-1">
                <GlassButton
                  variant="outline"
                  onClick={() => setShowSparePartsSelector(true)}
                  className="flex items-center gap-1 text-xs px-2 py-1"
                >
                  <Package className="w-3 h-3" />
                  Select
                </GlassButton>
                <GlassButton
                  onClick={() => setShowAddPart(true)}
                  className="flex items-center gap-1 text-xs px-2 py-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </GlassButton>
              </div>
            </div>
          ) : (
            <GlassCard className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Add Part</h3>
                <button
                  onClick={() => setShowAddPart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Search Parts
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <GlassInput
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or part number..."
                      className="pl-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Spare Parts List */}
              {searchTerm && (
                <div className="mt-2 max-h-32 overflow-y-auto border rounded">
                  {filteredSpareParts.map((part) => (
                    <div
                      key={part.id}
                      className={`p-1.5 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedSparePart?.id === part.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedSparePart(part)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-xs">{part.name}</div>
                          <div className="text-xs text-gray-600">
                            {part.part_number} • {part.quantity} stock
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium">
                            {part.selling_price.toLocaleString()} TZS
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedSparePart && (
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-700">Qty:</label>
                      <button
                        onClick={() => setQuantityNeeded(Math.max(1, quantityNeeded - 1))}
                        className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <GlassInput
                        type="number"
                        value={quantityNeeded}
                        onChange={(e) => setQuantityNeeded(parseInt(e.target.value) || 1)}
                        className="w-12 text-center text-xs"
                        min="1"
                        max={selectedSparePart.quantity}
                      />
                      <button
                        onClick={() => setQuantityNeeded(Math.min(selectedSparePart.quantity, quantityNeeded + 1))}
                        className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-gray-500">Max: {selectedSparePart.quantity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GlassInput
                        value={partNotes}
                        onChange={(e) => setPartNotes(e.target.value)}
                        placeholder="Notes..."
                        className="text-xs flex-1"
                      />
                      <GlassButton
                        onClick={handleAddPart}
                        className="text-xs px-3 py-1"
                        disabled={quantityNeeded > selectedSparePart.quantity}
                      >
                        Add
                      </GlassButton>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {/* Repair Parts List */}
          <div className="space-y-2">
            {repairParts.map((part) => (
              <div key={part.id} className="relative">
                <SparePartDetailsCard 
                  repairPart={part} 
                  showImages={true}
                  showVariants={true}
                  compact={true}
                />
                
                {/* Action Buttons Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {part.status === 'needed' && (
                    <GlassButton
                      size="sm"
                      onClick={() => handleUpdatePartStatus(part.id, 'ordered')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Mark Ordered
                    </GlassButton>
                  )}
                  {part.status === 'ordered' && (
                    <GlassButton
                      size="sm"
                      onClick={() => handleUpdatePartStatus(part.id, 'received')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Mark Received
                    </GlassButton>
                  )}
                  {part.status === 'accepted' && (
                    <GlassButton
                      size="sm"
                      onClick={() => handleUpdatePartStatus(part.id, 'received')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Mark Received
                    </GlassButton>
                  )}
                  {part.status === 'received' && (
                    <GlassButton
                      size="sm"
                      onClick={() => handleUseSparePart(part)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Use Part'}
                    </GlassButton>
                  )}
                  <button
                    onClick={() => handleRemovePart(part.id)}
                    className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 text-red-600"
                    title="Remove part"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {repairParts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No parts added yet</h3>
                <p className="text-gray-500 mb-4">
                  Add spare parts needed for this repair
                </p>
                <GlassButton onClick={() => setShowAddPart(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Part
                </GlassButton>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {repairParts.length} parts • {totalCost.toLocaleString()} TZS
          </div>
          <div className="flex items-center gap-1">
            <GlassButton variant="outline" onClick={onClose} className="text-xs px-2 py-1">
              Close
            </GlassButton>
            <GlassButton
              onClick={() => {
                onPartsUpdate?.(repairParts);
                onClose();
              }}
              disabled={repairParts.length === 0}
              className="text-xs px-2 py-1"
            >
              Save
            </GlassButton>
          </div>
        </div>

        {/* Spare Parts Selector */}
        <SparePartsSelector
          isOpen={showSparePartsSelector}
          onClose={() => setShowSparePartsSelector(false)}
          device={device}
          onPartsSelected={handleBulkPartSelection}
        />
      </div>
    </div>
  );
};

export default RepairPartsModal;
