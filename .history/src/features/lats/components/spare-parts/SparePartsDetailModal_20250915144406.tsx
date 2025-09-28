// SparePartsDetailModal component - Shows full spare part details with editing capabilities
// Based on ProductDetailModal design but adapted for spare parts data and relationships
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Package, Tag, Hash, ShoppingCart, 
  CheckCircle, Camera, Barcode, ArrowUpDown,
  Wrench, Settings, Database, Archive, Box, Layers,
  DollarSign, TrendingUp, AlertTriangle, Star,
  Phone, Mail, MapPin, Clock, Users, Crown, Calendar,
  RotateCcw, RefreshCw, Minus, Plus as PlusIcon, History, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { SimpleImageDisplay } from '../../../../components/SimpleImageDisplay';
import { formatMoney, Currency, SUPPORTED_CURRENCIES } from '../../lib/purchaseOrderUtils';
import { SparePart } from '../../types/spareParts';
import { format } from '../../lib/format';
import { getLatsProvider } from '../../lib/data/provider';
import SparePartsRelationshipService, { SparePartWithRelations } from '../../lib/sparePartsRelationships';

interface SparePartsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePart;
  currency: Currency;
  onEdit?: (sparePart: SparePart) => void;
  onDelete?: (id: string) => void;
  onUse?: (quantity: number, reason: string, notes?: string) => void;
  onSparePartUpdated?: (updatedSparePart: SparePart) => void;
}

const SparePartsDetailModal: React.FC<SparePartsDetailModalProps> = ({
  isOpen,
  onClose,
  sparePart,
  currency,
  onEdit,
  onDelete,
  onUse,
  onSparePartUpdated
}) => {
  // DEBUG: Log spare part data received
  useEffect(() => {
    if (isOpen && sparePart) {
      console.log('🔍 [SparePartsDetailModal] DEBUG - Spare part data received:', {
        id: sparePart.id,
        name: sparePart.name,
        part_number: sparePart.part_number,
        category: sparePart.category,
        supplier: sparePart.supplier,
        cost_price: sparePart.cost_price,
        selling_price: sparePart.selling_price,
        quantity: sparePart.quantity,
        min_quantity: sparePart.min_quantity,
        location: sparePart.location,
        compatible_devices: sparePart.compatible_devices,
        condition: sparePart.condition,
        brand: sparePart.brand,
        description: sparePart.description
      });
      
      // DEBUG: Check for missing information
      const missingInfo = [];
      if (!sparePart.supplier) missingInfo.push('supplier');
      if (!sparePart.category) missingInfo.push('category');
      if (!sparePart.location) missingInfo.push('location');
      if (!sparePart.compatible_devices) missingInfo.push('compatible_devices');
      if (sparePart.quantity === 0) missingInfo.push('quantity');
      
      if (missingInfo.length > 0) {
        console.warn('⚠️ [SparePartsDetailModal] DEBUG - Missing information:', missingInfo);
      } else {
        console.log('✅ [SparePartsDetailModal] DEBUG - All information present');
      }
    }
  }, [isOpen, sparePart]);

  // State management
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Real-time stock state
  const [realTimeStock, setRealTimeStock] = useState<number>(sparePart?.quantity || 0);
  const [lastStockUpdate, setLastStockUpdate] = useState<Date | null>(null);
  
  // Relationship data state
  const [sparePartWithRelations, setSparePartWithRelations] = useState<SparePartWithRelations | null>(null);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  
  const dataProvider = getLatsProvider();
  const relationshipService = SparePartsRelationshipService.getInstance();

  // Ensure we have a valid currency, fallback to TZS if none provided
  const defaultCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'TZS') || SUPPORTED_CURRENCIES[0];
  const safeCurrency = currency || defaultCurrency;

  if (!isOpen || !sparePart || !safeCurrency) return null;

  return (
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
                  {(() => {
                    // Convert spare part images to new format - memoized to prevent unnecessary recalculations
                    const sparePartImages = useMemo(() => {
                      // For now, we'll use placeholder images since spare parts don't have images in the current schema
                      // In a real implementation, you'd fetch images from a related table or field
                      return [];
                    }, [sparePart?.id]);

                    return sparePartImages.length > 0 ? (
                      <SimpleImageDisplay
                        images={sparePartImages}
                        productName={sparePart.name}
                        size="xl"
                        className="w-[392px] h-[392px] rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center border-2 border-dashed border-blue-300">
                        <div className="text-center">
                          <Camera className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                          <p className="text-blue-600 font-medium">No images available</p>
                          <p className="text-sm text-blue-500 mt-1">Images can be added in future updates</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm">
                    <div className="space-y-4">
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
                          <div className="font-medium text-gray-900 font-mono">{sparePart.part_number}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-gray-500" />
                        <div>
                          <span className="text-sm text-gray-600">Category:</span>
                          <div className="font-medium text-gray-900">{sparePart.category?.name || 'Uncategorized'}</div>
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

                      {sparePart.condition && (
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-gray-500" />
                          <div>
                            <span className="text-sm text-gray-600">Condition:</span>
                            <div className="font-medium text-gray-900 capitalize">{sparePart.condition}</div>
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
              </div>

              {/* Right Column - Management & Actions */}
              <div className="space-y-6">
                
                {/* Supplier Information */}
                {sparePart.supplier && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Supplier Information</h3>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {sparePart.supplier.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{sparePart.supplier.name}</div>
                          {sparePart.supplier.email && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                              <Mail className="w-3 h-3" />
                              {sparePart.supplier.email}
                            </div>
                          )}
                          {sparePart.supplier.phone && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                              <Phone className="w-3 h-3" />
                              {sparePart.supplier.phone}
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
                        {formatMoney(sparePart.cost_price, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Selling Price</span>
                      </div>
                      <div className="text-xl font-bold text-blue-800">
                        {formatMoney(sparePart.selling_price, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Profit margin calculation */}
                  {sparePart.cost_price > 0 && sparePart.selling_price > 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-700">Profit Margin:</span>
                        <span className="text-amber-800 font-medium">
                          {((sparePart.selling_price - sparePart.cost_price) / sparePart.cost_price * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-amber-700">Profit per Unit:</span>
                        <span className="text-amber-800 font-medium">
                          {formatMoney(sparePart.selling_price - sparePart.cost_price, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stock Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Stock Information</h3>
                  
                  {(() => {
                    // Get stock status
                    const getStockStatus = () => {
                      if (realTimeStock === 0) return { 
                        status: 'Out of Stock', 
                        color: 'text-red-600', 
                        bg: 'bg-red-50', 
                        border: 'border-red-200',
                        icon: AlertTriangle
                      };
                      if (realTimeStock <= sparePart.min_quantity) return { 
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

                    return (
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
                            <div className="text-lg font-bold text-gray-900">
                              {realTimeStock === 0 ? '0' : realTimeStock} units
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Minimum Stock:</span>
                            <div className="text-lg font-bold text-gray-900">{sparePart.min_quantity} units</div>
                          </div>
                        </div>
                        
                        {sparePart.location && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">Location:</span>
                              <span className="text-sm font-medium text-gray-900">{sparePart.location}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Compatible Devices */}
                {sparePart.compatible_devices && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Compatible Devices</h3>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <Layers className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800 mb-2">Device Compatibility</div>
                          <div className="text-sm text-gray-600">
                            {sparePart.compatible_devices}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Quick Actions</h3>
                  
                  <div className="space-y-3">
                    <GlassButton
                      onClick={() => setShowUsageModal(true)}
                      disabled={realTimeStock === 0}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      icon={<Minus size={18} />}
                    >
                      Use Spare Part
                    </GlassButton>

                    {onEdit && (
                      <GlassButton
                        onClick={() => onEdit(sparePart)}
                        variant="outline"
                        className="w-full"
                        icon={<Settings size={18} />}
                      >
                        Edit Spare Part
                      </GlassButton>
                    )}

                    {onDelete && (
                      <GlassButton
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this spare part?')) {
                            onDelete(sparePart.id);
                            onClose();
                          }
                        }}
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
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center border-2 border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4 text-blue-600" />
                    </button>
                    <span className="w-16 text-center font-bold text-xl text-gray-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(realTimeStock, quantity + 1))}
                      disabled={quantity >= realTimeStock}
                      className="w-10 h-10 flex items-center justify-center border-2 border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Available: {realTimeStock} units
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
                  onClick={() => {
                    if (quantity > realTimeStock) {
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
                      toast.success(`Used ${quantity} units of ${sparePart.name}`);
                    }
                  }}
                  disabled={!reason.trim() || quantity > realTimeStock}
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
    </div>
  );
};

export default SparePartsDetailModal;
