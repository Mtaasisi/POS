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
import SparePartsSelector from './SparePartsSelector';
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
  status: 'needed' | 'ordered' | 'received' | 'used';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Repair Parts Management</h2>
                <p className="text-blue-100">
                  {device.brand} {device.model} - {device.serialNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{partsNeeded}</div>
                  <div className="text-sm text-gray-600">Needed</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{partsReceived}</div>
                  <div className="text-sm text-gray-600">Received</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{partsUsed}</div>
                  <div className="text-sm text-gray-600">Used</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {totalCost.toLocaleString()} TZS
                  </div>
                  <div className="text-sm text-gray-600">Total Cost</div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Add Part Section */}
          {!showAddPart ? (
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Repair Parts</h3>
              <div className="flex items-center gap-3">
                <GlassButton
                  variant="outline"
                  onClick={() => setShowSparePartsSelector(true)}
                  className="flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Select from Inventory
                </GlassButton>
                <GlassButton
                  onClick={() => setShowAddPart(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Part
                </GlassButton>
              </div>
            </div>
          ) : (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add New Part</h3>
                <button
                  onClick={() => setShowAddPart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Spare Parts
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <GlassInput
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or part number..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <GlassSelect
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {/* Add category options here */}
                  </GlassSelect>
                </div>
              </div>

              {/* Spare Parts List */}
              {searchTerm && (
                <div className="mt-4 max-h-60 overflow-y-auto border rounded-lg">
                  {filteredSpareParts.map((part) => (
                    <div
                      key={part.id}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedSparePart?.id === part.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedSparePart(part)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{part.name}</div>
                          <div className="text-sm text-gray-600">
                            {part.part_number} • Stock: {part.quantity} • 
                            {part.selling_price.toLocaleString()} TZS
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {part.selling_price.toLocaleString()} TZS
                          </div>
                          <div className="text-xs text-gray-500">
                            {part.quantity} in stock
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedSparePart && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity Needed
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuantityNeeded(Math.max(1, quantityNeeded - 1))}
                          className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <GlassInput
                          type="number"
                          value={quantityNeeded}
                          onChange={(e) => setQuantityNeeded(parseInt(e.target.value) || 1)}
                          className="w-20 text-center"
                          min="1"
                          max={selectedSparePart.quantity}
                        />
                        <button
                          onClick={() => setQuantityNeeded(Math.min(selectedSparePart.quantity, quantityNeeded + 1))}
                          className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Max: {selectedSparePart.quantity} available
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <GlassInput
                        value={partNotes}
                        onChange={(e) => setPartNotes(e.target.value)}
                        placeholder="Optional notes..."
                      />
                    </div>

                    <div className="flex items-end">
                      <GlassButton
                        onClick={handleAddPart}
                        className="w-full"
                        disabled={quantityNeeded > selectedSparePart.quantity}
                      >
                        Add to Repair
                      </GlassButton>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {/* Repair Parts List */}
          <div className="space-y-4">
            {repairParts.map((part) => (
              <GlassCard key={part.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-medium">{part.name}</div>
                      <span className="text-sm text-gray-500">#{part.part_number}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        part.status === 'needed' ? 'bg-orange-100 text-orange-800' :
                        part.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                        part.status === 'received' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {part.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Quantity: {part.quantity_needed} • 
                      Cost: {part.cost_per_unit.toLocaleString()} TZS each • 
                      Total: {part.total_cost.toLocaleString()} TZS
                    </div>
                    {part.notes && (
                      <div className="text-sm text-gray-500 mt-1">
                        Notes: {part.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {part.status === 'needed' && (
                      <GlassButton
                        size="sm"
                        onClick={() => handleUpdatePartStatus(part.id, 'ordered')}
                      >
                        Mark Ordered
                      </GlassButton>
                    )}
                    {part.status === 'ordered' && (
                      <GlassButton
                        size="sm"
                        onClick={() => handleUpdatePartStatus(part.id, 'received')}
                      >
                        Mark Received
                      </GlassButton>
                    )}
                    {part.status === 'received' && (
                      <GlassButton
                        size="sm"
                        onClick={() => handleUseSparePart(part)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Use Part'}
                      </GlassButton>
                    )}
                    <button
                      onClick={() => handleRemovePart(part.id)}
                      className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
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
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total: {repairParts.length} parts • {totalCost.toLocaleString()} TZS
          </div>
          <div className="flex items-center gap-3">
            <GlassButton variant="outline" onClick={onClose}>
              Close
            </GlassButton>
            <GlassButton
              onClick={() => {
                onPartsUpdate?.(repairParts);
                onClose();
              }}
              disabled={repairParts.length === 0}
            >
              Save Parts
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
