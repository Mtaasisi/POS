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

          {/* Content will be added in next chunks */}
          <div className="p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">Content will be added in next chunks...</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default SparePartsDetailModal;
