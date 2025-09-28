import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useInventoryStore } from '../../lats/stores/useInventoryStore';
import { SparePart } from '../../lats/types/spareParts';
import { Device } from '../../../types';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import { 
  Search, Package, Plus, Minus, CheckCircle, AlertTriangle, 
  DollarSign, Hash, Eye, Filter, X, ShoppingCart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

interface SparePartsSelectorProps {
  device: Device;
  onPartsSelected: (parts: SelectedPart[]) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface SelectedPart {
  spare_part_id: string;
  name: string;
  part_number: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  notes?: string;
}

const SparePartsSelector: React.FC<SparePartsSelectorProps> = ({
  device,
  onPartsSelected,
  onClose,
  isOpen
}) => {
  const { 
    spareParts, 
    categories,
    isLoading, 
    loadSpareParts,
    loadCategories 
  } = useInventoryStore();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [showSelectedParts, setShowSelectedParts] = useState(false);
  const { currentUser } = useAuth();
  
  const isAdmin = currentUser?.role === 'admin';

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSpareParts();
      loadCategories();
    }
  }, [isOpen, loadSpareParts, loadCategories]);

  // Filter spare parts based on search and category
  const filteredSpareParts = spareParts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || part.category_id === selectedCategory;
    const hasStock = part.quantity > 0;
    const isActive = part.is_active;
    
    return matchesSearch && matchesCategory && hasStock && isActive;
  });

  // Add part to selection
  const handleAddPart = (sparePart: SparePart) => {
    const existingPart = selectedParts.find(p => p.spare_part_id === sparePart.id);
    
    if (existingPart) {
      // Increase quantity if part already selected
      setSelectedParts(prev => 
        prev.map(p => 
          p.spare_part_id === sparePart.id 
            ? { 
                ...p, 
                quantity: Math.min(p.quantity + 1, sparePart.quantity),
                total_cost: Math.min(p.quantity + 1, sparePart.quantity) * p.cost_per_unit
              }
            : p
        )
      );
    } else {
      // Add new part
      const newPart: SelectedPart = {
        spare_part_id: sparePart.id,
        name: sparePart.name,
        part_number: sparePart.part_number,
        quantity: 1,
        cost_per_unit: sparePart.selling_price,
        total_cost: sparePart.selling_price,
        notes: ''
      };
      setSelectedParts(prev => [...prev, newPart]);
    }
    
    toast.success('Part added to selection');
  };

  // Update part quantity
  const handleUpdateQuantity = (sparePartId: string, newQuantity: number) => {
    const sparePart = spareParts.find(p => p.id === sparePartId);
    if (!sparePart) return;

    const quantity = Math.max(1, Math.min(newQuantity, sparePart.quantity));
    
    setSelectedParts(prev => 
      prev.map(p => 
        p.spare_part_id === sparePartId 
          ? { 
              ...p, 
              quantity,
              total_cost: quantity * p.cost_per_unit
            }
          : p
      )
    );
  };

  // Remove part from selection
  const handleRemovePart = (sparePartId: string) => {
    setSelectedParts(prev => prev.filter(p => p.spare_part_id !== sparePartId));
    toast.success('Part removed from selection');
  };

  // Update part notes
  const handleUpdateNotes = (sparePartId: string, notes: string) => {
    setSelectedParts(prev => 
      prev.map(p => 
        p.spare_part_id === sparePartId 
          ? { ...p, notes }
          : p
      )
    );
  };

  // Calculate totals
  const totalCost = selectedParts.reduce((sum, part) => sum + part.total_cost, 0);
  const totalParts = selectedParts.reduce((sum, part) => sum + part.quantity, 0);

  // Handle final selection
  const handleConfirmSelection = () => {
    if (selectedParts.length === 0) {
      toast.error('Please select at least one part');
      return;
    }
    
    onPartsSelected(selectedParts);
    onClose();
  };

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
                <h2 className="text-2xl font-bold">Select Spare Parts</h2>
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
          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Spare Parts
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <GlassInput
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, part number, or brand..."
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
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </GlassSelect>
            </div>
          </div>

          {/* Selected Parts Summary */}
          {selectedParts.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Selected Parts ({selectedParts.length})</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Total: {totalParts} parts{isAdmin && ` • ${totalCost.toLocaleString()} TZS`}
                  </div>
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSelectedParts(!showSelectedParts)}
                  >
                    {showSelectedParts ? 'Hide' : 'Show'} Details
                  </GlassButton>
                </div>
              </div>

              {showSelectedParts && (
                <div className="space-y-3">
                  {selectedParts.map((part) => {
                    const sparePart = spareParts.find(p => p.id === part.spare_part_id);
                    return (
                      <div key={part.spare_part_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{part.name}</div>
                          <div className="text-sm text-gray-600">
                            {part.part_number} • {part.cost_per_unit.toLocaleString()} TZS each
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(part.spare_part_id, part.quantity - 1)}
                              className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-medium">{part.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(part.spare_part_id, part.quantity + 1)}
                              className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300"
                              disabled={sparePart && part.quantity >= sparePart.quantity}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-medium">{part.total_cost.toLocaleString()} TZS</div>
                            <div className="text-xs text-gray-500">
                              Max: {sparePart?.quantity || 0}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleRemovePart(part.spare_part_id)}
                            className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          )}

          {/* Spare Parts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpareParts.map((sparePart) => {
              const isSelected = selectedParts.some(p => p.spare_part_id === sparePart.id);
              const selectedQuantity = selectedParts.find(p => p.spare_part_id === sparePart.id)?.quantity || 0;
              
              return (
                <GlassCard key={sparePart.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{sparePart.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">#{sparePart.part_number}</p>
                      {sparePart.brand && (
                        <p className="text-xs text-gray-500 mb-2">Brand: {sparePart.brand}</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">{sparePart.selling_price.toLocaleString()} TZS</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className={`font-medium ${
                        sparePart.quantity > 10 ? 'text-green-600' :
                        sparePart.quantity > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {sparePart.quantity} available
                      </span>
                    </div>
                    {selectedQuantity > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Selected:</span>
                        <span className="font-medium text-blue-600">{selectedQuantity}</span>
                      </div>
                    )}
                  </div>

                  <GlassButton
                    onClick={() => handleAddPart(sparePart)}
                    disabled={sparePart.quantity === 0}
                    className="w-full"
                    variant={isSelected ? "outline" : "primary"}
                  >
                    {isSelected ? (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add More
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Selection
                      </>
                    )}
                  </GlassButton>
                </GlassCard>
              );
            })}
          </div>

          {filteredSpareParts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No spare parts found</h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or check if parts are in stock
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedParts.length > 0 && (
              <>
                {selectedParts.length} parts selected{isAdmin && ` • ${totalCost.toLocaleString()} TZS`}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <GlassButton variant="outline" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleConfirmSelection}
              disabled={selectedParts.length === 0}
            >
              Confirm Selection ({selectedParts.length})
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SparePartsSelector;
