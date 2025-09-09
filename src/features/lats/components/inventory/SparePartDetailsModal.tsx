// SparePartDetailsModal component - Shows full spare part details with editing capabilities
import React, { useState } from 'react';
import { 
  X, Package, Tag, Hash, DollarSign, Plus, Minus, 
  AlertTriangle, Star, CheckCircle, Camera, Barcode, TrendingUp, 
  Clock, Phone, Mail, MapPin, Wrench, Settings, Database, Archive, Box, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassBadge from '../../../shared/components/ui/GlassBadge';
import { SimpleImageDisplay } from '../../../../components/SimpleImageDisplay';
import { ProductImage } from '../../../../lib/robustImageService';
import { SparePart } from '../../types/inventory';
import { formatMoney } from '../../lib/format';

interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface SparePartDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePart;
  suppliers: Supplier[];
  categories: Category[];
  onEdit?: (sparePart: SparePart) => void;
  onDelete?: (id: string) => void;
  onUse?: (quantity: number, reason: string, notes?: string) => void;
}

const SparePartDetailsModal: React.FC<SparePartDetailsModalProps> = ({
  isOpen,
  onClose,
  sparePart,
  suppliers,
  categories,
  onEdit,
  onDelete,
  onUse
}) => {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showUsageModal, setShowUsageModal] = useState(false);

  // DEBUG: Log spare part data received
  useEffect(() => {
    if (isOpen && sparePart) {
      console.log('🔍 [SparePartDetailsModal] DEBUG - Spare part data received:', {
        id: sparePart.id,
        name: sparePart.name,
        sku: sparePart.sku,
        category: sparePart.category,
        supplier: sparePart.supplier,
        quantity: sparePart.quantity,
        costPrice: sparePart.costPrice,
        sellingPrice: sparePart.sellingPrice,
        minStockLevel: sparePart.minStockLevel,
        location: sparePart.location,
        specifications: sparePart.specifications
      });
      
      // DEBUG: Check for missing information
      const missingInfo = [];
      if (!sparePart.supplier) missingInfo.push('supplier');
      if (!sparePart.category) missingInfo.push('category');
      if (!sparePart.location) missingInfo.push('location');
      if (!sparePart.specifications) missingInfo.push('specifications');
      if (sparePart.quantity === 0) missingInfo.push('quantity');
      
      if (missingInfo.length > 0) {
        console.warn('⚠️ [SparePartDetailsModal] DEBUG - Missing information:', missingInfo);
      } else {
        console.log('✅ [SparePartDetailsModal] DEBUG - All information present');
      }
    }
  }, [isOpen, sparePart]);

  // Get related data
  const supplier = suppliers.find(s => s.id === sparePart.supplierId);
  const category = categories.find(c => c.id === sparePart.categoryId);

  // Convert spare part images to new format
  const convertToProductImages = (): ProductImage[] => {
    if (!sparePart.images || sparePart.images.length === 0) {
      return [];
    }
    
    return sparePart.images.map((imageUrl, index) => ({
      id: `temp-${sparePart.id}-${index}`,
      url: imageUrl,
      thumbnailUrl: imageUrl,
      fileName: `sparepart-image-${index + 1}`,
      fileSize: 0,
      isPrimary: index === 0,
      uploadedAt: new Date().toISOString()
    }));
  };

  const sparePartImages = convertToProductImages();

  // Get stock status
  const getStockStatus = () => {
    if (sparePart.quantity === 0) return { 
      status: 'Out of Stock', 
      color: 'text-red-600', 
      bg: 'bg-red-50', 
      border: 'border-red-200',
      icon: AlertTriangle
    };
    if (sparePart.quantity <= sparePart.minQuantity) return { 
      status: 'Low Stock', 
      color: 'text-amber-600', 
      bg: 'bg-amber-50', 
      border: 'border-amber-200',
      icon: AlertTriangle
    };
    return { 
      status: 'In Stock', 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      border: 'border-green-200',
      icon: CheckCircle
    };
  };

  const stockStatus = getStockStatus();

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, Math.min(sparePart.quantity, quantity + delta)));
  };

  const handleUseSparePart = () => {
    if (quantity > sparePart.quantity) {
      toast.error('Cannot use more than available quantity');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for usage');
      return;
    }

    if (onUse) {
      onUse(quantity, reason, notes);
      setShowUsageModal(false);
      setQuantity(1);
      setReason('');
      setNotes('');
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(sparePart);
      onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this spare part?')) {
      if (onDelete) {
        onDelete(sparePart.id);
        onClose();
      }
    }
  };

  if (!isOpen || !sparePart) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <GlassCard className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Spare Part Details</h2>
                  <p className="text-sm text-gray-600">Complete information and management options</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Spare Part Information */}
                <div className="space-y-6">
                  
                  {/* Spare Part Images */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Spare Part Images</h3>
                    {sparePartImages.length > 0 ? (
                      <SimpleImageDisplay
                        images={sparePartImages}
                        productName={sparePart.name}
                        size="xl"
                        className="w-full h-64 rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center border-2 border-dashed border-blue-300">
                        <div className="text-center">
                          <Camera className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                          <p className="text-blue-600 font-medium">No images available</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Basic Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Tag className="w-5 h-5 text-gray-500" />
                        <div>
                          <span className="text-sm text-gray-600">Spare Part Name:</span>
                          <div className="font-medium text-gray-900">{sparePart.name}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-gray-500" />
                        <div>
                          <span className="text-sm text-gray-600">Part Number:</span>
                          <div className="font-medium text-gray-900 font-mono">{sparePart.partNumber}</div>
                        </div>
                      </div>

                      {sparePart.barcode && (
                        <div className="flex items-center gap-3">
                          <Barcode className="w-5 h-5 text-gray-500" />
                          <div>
                            <span className="text-sm text-gray-600">Barcode:</span>
                            <div className="font-medium text-gray-900 font-mono">{sparePart.barcode}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-gray-500" />
                        <div>
                          <span className="text-sm text-gray-600">Category:</span>
                          <div className="font-medium text-gray-900">{category?.name || 'Uncategorized'}</div>
                        </div>
                      </div>

                      {sparePart.brand && (
                        <div className="flex items-center gap-3">
                          <Star className="w-5 h-5 text-gray-500" />
                          <div>
                            <span className="text-sm text-gray-600">Brand:</span>
                            <div className="font-medium text-gray-900">{sparePart.brand}</div>
                          </div>
                        </div>
                      )}

                      {sparePart.description && (
                        <div className="flex items-start gap-3">
                          <Database className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-sm text-gray-600">Description:</span>
                            <div className="font-medium text-gray-900 mt-1">{sparePart.description}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Management & Actions */}
                <div className="space-y-6">

                  {/* Supplier Information */}
                  {supplier && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-800">Supplier Information</h3>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {supplier.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{supplier.name}</div>
                            <div className="text-sm text-gray-600">{supplier.company_name}</div>
                            {supplier.phone && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                                <Phone className="w-3 h-3" />
                                {supplier.phone}
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                                <Mail className="w-3 h-3" />
                                {supplier.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Pricing Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Cost Price</span>
                        </div>
                        <div className="text-xl font-bold text-green-800">
                          {formatMoney(sparePart.costPrice)}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">Selling Price</span>
                        </div>
                        <div className="text-xl font-bold text-blue-800">
                          {formatMoney(sparePart.sellingPrice)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Stock Information</h3>
                    
                    <div className={`p-4 rounded-lg ${stockStatus.bg} ${stockStatus.border} border-2`}>
                      <div className="flex items-center gap-3 mb-3">
                        <stockStatus.icon className={`w-5 h-5 ${stockStatus.color}`} />
                        <div className={`font-medium ${stockStatus.color}`}>
                          {stockStatus.status}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Current Stock:</span>
                          <div className="text-lg font-bold text-gray-900">{sparePart.quantity === 0 ? '0' : sparePart.quantity} units</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Minimum Stock:</span>
                          <div className="text-lg font-bold text-gray-900">{sparePart.minQuantity} units</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Usage Actions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Quick Actions</h3>
                    
                    <div className="space-y-3">
                      <GlassButton
                        onClick={() => setShowUsageModal(true)}
                        disabled={sparePart.quantity === 0}
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        icon={<Minus size={18} />}
                      >
                        Use Spare Part
                      </GlassButton>

                      {onEdit && (
                        <GlassButton
                          onClick={handleEdit}
                          variant="outline"
                          className="w-full"
                          icon={<Settings size={18} />}
                        >
                          Edit Spare Part
                        </GlassButton>
                      )}

                      {onDelete && (
                        <GlassButton
                          onClick={handleDelete}
                          variant="outline"
                          className="w-full text-red-600 border-red-300 hover:bg-red-50"
                          icon={<X size={18} />}
                        >
                          Delete Spare Part
                        </GlassButton>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-6 px-6 pb-6">
              <GlassButton
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Close
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Usage Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Use Spare Part</h3>
                <button
                  onClick={() => setShowUsageModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity to Use</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center border-2 border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4 text-blue-600" />
                    </button>
                    <span className="w-16 text-center font-bold text-xl text-gray-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= sparePart.quantity}
                      className="w-10 h-10 flex items-center justify-center border-2 border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Available: {sparePart.quantity} units
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Usage *</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Device repair, Maintenance"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <GlassButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowUsageModal(false)}
                >
                  Cancel
                </GlassButton>
                
                <GlassButton
                  type="button"
                  onClick={handleUseSparePart}
                  disabled={!reason.trim() || quantity > sparePart.quantity}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  icon={<Minus size={18} />}
                >
                  Use Spare Part
                </GlassButton>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </>
  );
};

export default SparePartDetailsModal;
