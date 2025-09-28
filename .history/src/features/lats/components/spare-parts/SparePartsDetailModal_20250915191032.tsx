// SparePartsDetailModal component - Shows full spare part details with editing capabilities
// Based on GeneralProductDetailModal design but adapted for spare parts data and relationships
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Package, Tag, Hash, DollarSign, Edit, Star, MapPin, Calendar, 
  TrendingUp, TrendingDown, BarChart3, CheckCircle, Battery, Monitor, Camera, 
  FileText, Layers, Clock, User, Truck, QrCode, ShoppingCart, Scale, 
  Zap, Shield, Target, Percent, Calculator, Banknote, Receipt, 
  Copy, Download, Share2, Archive, History, Store, Building,
  HardDrive, Cpu, Palette, Ruler, Hand, Unplug, Fingerprint, Radio, XCircle,
  Info, Plus, Minus, Save, RotateCcw, Wrench, Settings, Database, Box,
  AlertTriangle, Phone, Mail, ArrowUpDown, RefreshCw as RefreshCwIcon
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
import { UnifiedImageService } from '../../../../lib/unifiedImageService';
import { ImageUrlSanitizer } from '../../../../lib/imageUrlSanitizer';

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

  // Fetch relationship data and images when modal opens
  useEffect(() => {
    if (isOpen && sparePart?.id) {
      fetchSparePartRelations();
      fetchSparePartImages();
    }
  }, [isOpen, sparePart?.id]);

  // Fetch spare part with all relationships
  const fetchSparePartRelations = async () => {
    if (!sparePart?.id) return;
    
    try {
      setIsLoadingRelations(true);
      console.log('🔍 [SparePartsDetailModal] Fetching spare part relationships...');
      
      const result = await relationshipService.getSparePartWithRelations(sparePart.id, {
        include_device_compatibility: true,
        include_usage_history: true,
        include_related_parts: true,
        include_supplier_details: true,
        include_category_details: true,
        usage_history_limit: 5,
        related_parts_limit: 3
      });
      
      if (result) {
        setSparePartWithRelations(result);
        console.log('✅ [SparePartsDetailModal] Relationships fetched successfully:', {
          device_compatibilities: result.device_compatibilities?.length || 0,
          usage_history: result.usage_history?.length || 0,
          related_parts: result.related_spare_parts?.length || 0,
          supplier_details: !!result.supplier_details,
          category_details: !!result.category_details
        });
      }
    } catch (error) {
      console.error('❌ [SparePartsDetailModal] Error fetching relationships:', error);
    } finally {
      setIsLoadingRelations(false);
    }
  };

  // Fetch spare part images from the images column
  const fetchSparePartImages = async () => {
    if (!sparePart?.id) return;
    
    try {
      setIsLoadingImages(true);
      console.log('🔍 [SparePartsDetailModal] Fetching spare part images...');
      
      // Check if spare part has images in the images column
      if (sparePart.images && Array.isArray(sparePart.images) && sparePart.images.length > 0) {
        // Convert the image URLs to the format expected by SimpleImageDisplay
        const formattedImages = sparePart.images.map((imageUrl, index) => ({
          id: `spare-part-image-${index}`,
          url: imageUrl,
          thumbnailUrl: imageUrl,
          fileName: `spare-part-image-${index + 1}`,
          fileSize: 0,
          isPrimary: index === 0, // First image is primary
          uploadedAt: sparePart.created_at || new Date().toISOString()
        }));
        
        setSparePartImages(formattedImages);
        
        console.log('✅ [SparePartsDetailModal] Images fetched successfully:', {
          count: formattedImages.length,
          images: formattedImages.map(img => ({ id: img.id, fileName: img.fileName, isPrimary: img.isPrimary }))
        });
      } else {
        setSparePartImages([]);
        console.log('ℹ️ [SparePartsDetailModal] No images found for spare part');
      }
    } catch (error) {
      console.error('❌ [SparePartsDetailModal] Error fetching images:', error);
      setSparePartImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  };

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
  
  // Image state
  const [sparePartImages, setSparePartImages] = useState<any[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  
  const dataProvider = getLatsProvider();
  const relationshipService = SparePartsRelationshipService.getInstance();

  // Ensure we have a valid currency, fallback to TZS if none provided
  const defaultCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'TZS') || SUPPORTED_CURRENCIES[0];
  const safeCurrency = currency || defaultCurrency;

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !sparePart || !safeCurrency) return null;

  const daysInStock = sparePart.created_at ? Math.floor((Date.now() - new Date(sparePart.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const completeness = Math.round((
    (sparePart.name ? 20 : 0) + 
    (sparePart.description ? 15 : 0) + 
    (sparePart.brand ? 10 : 0) + 
    (sparePart.location ? 10 : 0) + 
    (sparePart.compatible_devices ? 15 : 0) + 
    (sparePart.cost_price > 0 ? 15 : 0) + 
    (sparePart.selling_price > 0 ? 15 : 0)
  ));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{sparePart.name}</h2>
              <p className="text-sm text-gray-500">{sparePart.part_number || 'No Part Number'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab('relationships')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'relationships'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Relationships
              </div>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Details & Location
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Financial Overview - Minimal Design */}
              <div className="mb-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Value</div>
                    <div className="text-lg font-bold text-emerald-900">{formatMoney(sparePart.selling_price * sparePart.quantity, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}</div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Profit</div>
                    <div className="text-lg font-bold text-blue-900">{formatMoney((sparePart.selling_price - sparePart.cost_price) * sparePart.quantity, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Margin</div>
                    <div className="text-lg font-bold text-orange-900">
                      {sparePart.cost_price > 0 ? (((sparePart.selling_price - sparePart.cost_price) / sparePart.cost_price) * 100).toFixed(1) : '0.0'}%
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Investment</div>
                    <div className="text-lg font-bold text-purple-900">{formatMoney(sparePart.cost_price * sparePart.quantity, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}</div>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Spare Part Image & Basic Info */}
                <div className="space-y-6">
                  {/* Spare Part Images */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Images</h3>
                    {isLoadingImages ? (
                      <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-gray-500">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">Loading images...</span>
                        </div>
                      </div>
                    ) : sparePartImages.length > 0 ? (
                      <SimpleImageDisplay
                        images={sparePartImages}
                        productName={sparePart.name}
                        size="xl"
                        className="w-full aspect-square rounded-xl"
                      />
                    ) : (
                      <div className="aspect-square relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-dashed border-blue-300 flex items-center justify-center">
                        <div className="text-center">
                          <Wrench className="w-16 h-16 text-blue-400 mx-auto mb-2" />
                          <p className="text-blue-600 font-medium text-sm">No images available</p>
                          <p className="text-blue-500 text-xs mt-1">Upload images to display here</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {sparePart.description && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Description</h3>
                      <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                        {sparePart.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Essential Information & Actions */}
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Info className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Basic Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Category</span>
                        <p className="text-sm font-medium text-gray-900">{sparePart.category?.name || 'Uncategorized'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                        <p className={`text-sm font-medium ${sparePart.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {sparePart.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Part ID</span>
                        <p className="text-sm font-medium text-gray-900 font-mono">{sparePart.id}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Part Number</span>
                        <p className="text-sm font-medium text-gray-900 font-mono">{sparePart.part_number}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Current Stock</span>
                        <p className="text-sm font-medium text-gray-900">{sparePart.quantity} units</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Min Stock</span>
                        <p className="text-sm font-medium text-gray-900">{sparePart.min_quantity} units</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Pricing Summary</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Selling Price</span>
                        <p className="text-lg font-bold text-green-600">{formatMoney(sparePart.selling_price, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Cost Price</span>
                        <p className="text-lg font-bold text-red-600">{formatMoney(sparePart.cost_price, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Profit/Unit</span>
                        <p className="text-lg font-bold text-blue-600">
                          {formatMoney(sparePart.selling_price - sparePart.cost_price, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Markup</span>
                        <p className="text-lg font-bold text-purple-600">
                          {sparePart.cost_price > 0 
                            ? `${(((sparePart.selling_price - sparePart.cost_price) / sparePart.cost_price) * 100).toFixed(1)}%`
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Total Value</span>
                        <p className="text-xl font-bold text-orange-600">
                          {formatMoney(sparePart.selling_price * sparePart.quantity, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Supplier Information - Minimal */}
                  {sparePart.supplier && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Building className="w-5 h-5 text-orange-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Supplier Information</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Name</span>
                          <p className="text-sm font-medium text-gray-900">{sparePart.supplier.name}</p>
                        </div>
                        {sparePart.supplier.email && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Email</span>
                            <p className="text-sm font-medium text-gray-900">{sparePart.supplier.email}</p>
                          </div>
                        )}
                        {sparePart.supplier.phone && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Phone</span>
                            <p className="text-sm font-medium text-gray-900">{sparePart.supplier.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Spare Part Status - Enhanced */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Status & Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Condition</span>
                        <p className="text-sm font-medium text-gray-900 capitalize">{sparePart.condition || 'New'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Brand</span>
                        <p className="text-sm font-medium text-gray-900">{sparePart.brand || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Stock Status</span>
                        <p className={`text-sm font-medium ${
                          sparePart.quantity === 0 ? 'text-red-600' : 
                          sparePart.quantity <= sparePart.min_quantity ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {sparePart.quantity === 0 ? 'Out of Stock' : 
                           sparePart.quantity <= sparePart.min_quantity ? 'Low Stock' : 'In Stock'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Location</span>
                        <p className="text-sm font-medium text-gray-900">{sparePart.location || 'Not Set'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Sales Performance */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Performance Metrics</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Stock Turnover</div>
                    <div className="text-lg font-bold text-green-900">
                      {daysInStock > 0 ? (sparePart.quantity / daysInStock).toFixed(2) : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Inventory Value</div>
                    <div className="text-lg font-bold text-blue-900">
                      {formatMoney(sparePart.cost_price * sparePart.quantity, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Retail Value</div>
                    <div className="text-lg font-bold text-purple-900">
                      {formatMoney(sparePart.selling_price * sparePart.quantity, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Profit Potential</div>
                    <div className="text-lg font-bold text-orange-900">
                      {formatMoney((sparePart.selling_price - sparePart.cost_price) * sparePart.quantity, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Quality & Analytics */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Data Quality & Analytics</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Data Completeness</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{completeness}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Days in Inventory</span>
                    <p className="text-sm font-medium text-gray-900">{daysInStock} days</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Created</span>
                    <p className="text-sm font-medium text-gray-900">
                      {sparePart.created_at ? new Date(sparePart.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</span>
                    <p className="text-sm font-medium text-gray-900">
                      {sparePart.updated_at ? new Date(sparePart.updated_at).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Recommendations</h3>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const recommendations = [];
                    
                    // Stock recommendations
                    if (sparePart.quantity <= sparePart.min_quantity) {
                      recommendations.push({
                        type: 'warning',
                        message: 'Stock is low and needs reordering'
                      });
                    }
                    
                    // Pricing recommendations
                    if (sparePart.cost_price > 0 && sparePart.selling_price <= sparePart.cost_price) {
                      recommendations.push({
                        type: 'error',
                        message: 'Selling price is at or below cost price - review pricing strategy'
                      });
                    }
                    
                    // Data quality recommendations
                    if (completeness < 60) {
                      recommendations.push({
                        type: 'info',
                        message: 'Spare part data is incomplete - consider adding missing information'
                      });
                    }
                    
                    if (recommendations.length === 0) {
                      recommendations.push({
                        type: 'success',
                        message: 'Spare part is in good condition with no immediate actions needed'
                      });
                    }
                    
                    return recommendations.map((rec, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        rec.type === 'error' ? 'bg-red-50 border border-red-200' :
                        rec.type === 'warning' ? 'bg-orange-50 border border-orange-200' :
                        rec.type === 'info' ? 'bg-blue-50 border border-blue-200' :
                        'bg-green-50 border border-green-200'
                      }`}>
                        <p className={`text-sm font-medium ${
                          rec.type === 'error' ? 'text-red-800' :
                          rec.type === 'warning' ? 'text-orange-800' :
                          rec.type === 'info' ? 'text-blue-800' :
                          'text-green-800'
                        }`}>
                          {rec.message}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Relationships Tab */}
          {activeTab === 'relationships' && (
            <div className="space-y-6">
              {/* Device Compatibilities */}
              {sparePartWithRelations?.device_compatibilities && sparePartWithRelations.device_compatibilities.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Verified Device Compatibilities</h3>
                  </div>
                  <div className="space-y-2">
                    {sparePartWithRelations.device_compatibilities.map((compatibility) => (
                      <div key={compatibility.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {compatibility.device_brand} {compatibility.device_model}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                              {compatibility.device_type}
                            </div>
                            {compatibility.compatibility_notes && (
                              <div className="text-xs text-gray-500 mt-1">
                                {compatibility.compatibility_notes}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {compatibility.is_verified && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" title="Verified"></div>
                            )}
                            <span className="text-xs text-gray-500">
                              {format.date(compatibility.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage History */}
              {sparePartWithRelations?.usage_history && sparePartWithRelations.usage_history.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <History className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Recent Usage History</h3>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sparePartWithRelations.usage_history.map((usage) => (
                      <div key={usage.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {usage.quantity_used} units used
                            </div>
                            <div className="text-sm text-gray-600">
                              {usage.reason}
                            </div>
                            {usage.notes && (
                              <div className="text-xs text-gray-500 mt-1">
                                {usage.notes}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {format.relativeTime(usage.created_at)}
                            </div>
                            {usage.used_by_user && (
                              <div className="text-xs text-gray-600">
                                by {usage.used_by_user.full_name || usage.used_by_user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Spare Parts */}
              {sparePartWithRelations?.related_spare_parts && sparePartWithRelations.related_spare_parts.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Package className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Related Spare Parts</h3>
                  </div>
                  <div className="space-y-2">
                    {sparePartWithRelations.related_spare_parts.map((relatedPart) => (
                      <div key={relatedPart.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {relatedPart.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {relatedPart.part_number} • {relatedPart.category?.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatMoney(relatedPart.selling_price, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {relatedPart.quantity} in stock
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading indicator for relationships */}
              {isLoadingRelations && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Loading relationship data...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Spare Part Identification */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Hash className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Spare Part Identification</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Part Number</span>
                    <p className="text-sm font-medium text-gray-900 font-mono">{sparePart.part_number}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Spare Part ID</span>
                    <p className="text-sm font-medium text-gray-900 font-mono">{sparePart.id}</p>
                  </div>
                </div>
              </div>

              {/* Storage & Location Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Storage & Location</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Location</span>
                    <p className="text-sm font-medium text-gray-900">{sparePart.location || 'Not Set'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Category</span>
                    <p className="text-sm font-medium text-gray-900">{sparePart.category?.name || 'Uncategorized'}</p>
                  </div>
                </div>
              </div>

              {/* Compatible Devices */}
              {sparePart.compatible_devices && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Compatible Devices</h3>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {sparePart.compatible_devices}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUsageModal(true)}
                disabled={sparePart.quantity === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
              >
                <Minus className="w-4 h-4" />
                Use Spare Part
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Close
              </button>
              
              {onEdit && (
                <button
                  onClick={() => onEdit(sparePart)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
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
                      <Plus className="w-4 h-4 text-blue-600" />
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
