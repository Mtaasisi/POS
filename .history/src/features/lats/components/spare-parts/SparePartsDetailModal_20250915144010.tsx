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
  
  const dataProvider = getLatsProvider();

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
        </GlassCard>
      </div>
    </div>
  );
};

export default SparePartsDetailModal;
