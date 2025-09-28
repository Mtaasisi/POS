// SparePartsDetailModal component - Shows full spare part details with editing capabilities
// Based on GeneralProductDetailModal design but adapted for spare parts data
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Package, Tag, Hash, DollarSign, Edit, MapPin, Calendar, 
  TrendingUp, TrendingDown, BarChart3, CheckCircle, 
  FileText, Layers, Clock, User, Truck, 
  Copy, Download, History, Store, Building,
  Info, Plus, Minus, Save, RotateCcw, Wrench, Settings, Database, Box,
  AlertTriangle, RefreshCw as RefreshCwIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { formatMoney, Currency, SUPPORTED_CURRENCIES } from '../../lib/purchaseOrderUtils';
import { SparePart, SparePartVariant } from '../../types/spareParts';
import { format } from '../../lib/format';
import { getLatsProvider } from '../../lib/data/provider';
import { UnifiedImageService } from '../../../../lib/unifiedImageService';
import { ImageUrlSanitizer } from '../../../../lib/imageUrlSanitizer';
import { getSparePartVariants, getVariantStats, getSparePartImages } from '../../lib/sparePartsApi';

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

  // Fetch images and variants when modal opens
  useEffect(() => {
    if (isOpen && sparePart?.id) {
      setSelectedImageIndex(0); // Reset image selection
      fetchSparePartImages();
      fetchVariants();
    }
  }, [isOpen, sparePart?.id]);


  // Fetch spare part images from the spare_part_images table
  const fetchSparePartImages = async () => {
    if (!sparePart?.id) return;
    
    try {
      setIsLoadingImages(true);
      console.log('🔍 [SparePartsDetailModal] Fetching spare part images from database...');
      
      // First try to get images from the spare_part_images table
      const dbImages = await getSparePartImages(sparePart.id);
      
      if (dbImages && dbImages.length > 0) {
        // Convert database images to the format expected by the image display
        const formattedImages = dbImages.map((dbImage) => {
          // Sanitize the image URL to prevent 431 errors
          const sanitizedResult = ImageUrlSanitizer.sanitizeImageUrl(dbImage.image_url, dbImage.file_name);
          
          if (sanitizedResult.isSanitized) {
            console.warn('🚨 [SparePartsDetailModal] Image URL sanitized to prevent 431 error:', {
              method: sanitizedResult.method,
              originalLength: sanitizedResult.originalLength,
              sanitizedLength: sanitizedResult.sanitizedLength
            });
          }
          
          return {
            id: dbImage.id,
            url: sanitizedResult.url,
            thumbnailUrl: dbImage.thumbnail_url ? ImageUrlSanitizer.sanitizeImageUrl(dbImage.thumbnail_url, `thumb-${dbImage.file_name}`).url : sanitizedResult.url,
            fileName: dbImage.file_name,
            fileSize: dbImage.file_size || 0,
            isPrimary: dbImage.is_primary || false,
            uploadedAt: dbImage.created_at || new Date().toISOString()
          };
        });
        
        setSparePartImages(formattedImages);
        
        console.log('✅ [SparePartsDetailModal] Images fetched from database successfully:', {
          count: formattedImages.length,
          images: formattedImages.map(img => ({ id: img.id, fileName: img.fileName, isPrimary: img.isPrimary, hasThumbnail: img.thumbnailUrl !== img.url }))
        });
      } else {
        // Fallback to images column for backward compatibility
        console.log('ℹ️ [SparePartsDetailModal] No images in database, checking images column...');
        
        if (sparePart.images && Array.isArray(sparePart.images) && sparePart.images.length > 0) {
          const formattedImages = sparePart.images.map((imageUrl, index) => {
            const sanitizedResult = ImageUrlSanitizer.sanitizeImageUrl(imageUrl, `spare-part-image-${index + 1}`);
            
            return {
              id: `spare-part-image-${index}`,
              url: sanitizedResult.url,
              thumbnailUrl: sanitizedResult.url, // No separate thumbnail in images column
              fileName: `spare-part-image-${index + 1}`,
              fileSize: 0,
              isPrimary: index === 0,
              uploadedAt: sparePart.created_at || new Date().toISOString()
            };
          });
          
          setSparePartImages(formattedImages);
          console.log('✅ [SparePartsDetailModal] Images fetched from images column:', formattedImages.length);
        } else {
          setSparePartImages([]);
          console.log('ℹ️ [SparePartsDetailModal] No images found for spare part');
        }
      }
    } catch (error) {
      console.error('❌ [SparePartsDetailModal] Error fetching images:', error);
      setSparePartImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Fetch variants for the spare part
  const fetchVariants = async () => {
    if (!sparePart?.id) return;
    
    try {
      setIsLoadingVariants(true);
      console.log('🔍 [SparePartsDetailModal] Fetching variants for spare part:', sparePart.id);
      
      // Fetch variants
      const variantsData = await getSparePartVariants(sparePart.id);
      console.log('🔍 [SparePartsDetailModal] Variants data received:', variantsData);
      setVariants(variantsData);
      
      // Fetch variant statistics
      const stats = await getVariantStats(sparePart.id);
      console.log('🔍 [SparePartsDetailModal] Variant stats received:', stats);
      setVariantStats(stats);
      
      // Log variants information
      const hasVariants = variantsData.length > 0;
      const usesVariants = sparePart.use_variants || sparePart.metadata?.useVariants || false;
      
      console.log('✅ [SparePartsDetailModal] Variants fetched successfully:', {
        variantsCount: variantsData.length,
        usesVariants,
        stats: {
          totalVariants: stats.totalVariants,
          totalValue: stats.totalValue,
          inStockVariants: stats.inStockVariants
        }
      });
    } catch (error) {
      console.error('❌ [SparePartsDetailModal] Error fetching variants:', error);
      setVariants([]);
      setVariantStats(null);
    } finally {
      setIsLoadingVariants(false);
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
  
  
  // Image state
  const [sparePartImages, setSparePartImages] = useState<any[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Variants state
  const [variants, setVariants] = useState<SparePartVariant[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [variantStats, setVariantStats] = useState<any>(null);
  
  const dataProvider = getLatsProvider();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{sparePart.name}</h2>
              <p className="text-xs text-gray-500">{sparePart.part_number || 'No Part Number'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex space-x-6 px-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <Info className="w-3 h-3" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab('variants')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'variants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                Variants
                {variants.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                    {variants.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Details
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-100px)]">
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
                      <>
                        <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                          <img
                            src={sparePartImages[selectedImageIndex]?.url || sparePartImages[0]?.url}
                            alt={sparePart.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Image Thumbnails */}
                        {sparePartImages.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {sparePartImages.map((image, index) => (
                              <button
                                key={image.id}
                                onClick={() => setSelectedImageIndex(index)}
                                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                  index === selectedImageIndex 
                                    ? 'border-blue-500' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <img
                                  src={image.url}
                                  alt={`${sparePart.name} ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </>
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


          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <div className="space-y-6">
              {/* Variants Overview */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Variants Overview</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchVariants()}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <RefreshCwIcon className="w-3 h-3" />
                      Refresh
                    </button>
                  </div>
                </div>
                
                {isLoadingVariants ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Loading variants...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Variants Summary */}
                    {variantStats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Total Variants</div>
                          <div className="text-lg font-bold text-blue-900">{variantStats.totalVariants}</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">In Stock</div>
                          <div className="text-lg font-bold text-green-900">{variantStats.inStockVariants}</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Low Stock</div>
                          <div className="text-lg font-bold text-orange-900">{variantStats.lowStockVariants}</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Total Value</div>
                          <div className="text-lg font-bold text-purple-900">
                            {formatMoney(variantStats.totalValue, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Variants List */}
                    {variants.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Variant Details</h4>
                        {variants.map((variant, index) => (
                          <div key={variant.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-gray-900">{variant.name}</span>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-mono">
                                    {variant.sku}
                                  </span>
                                  {variant.is_active ? (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                
                                {/* Variant Description */}
                                {variant.description && (
                                  <p className="text-sm text-gray-600 mb-2">{variant.description}</p>
                                )}
                                
                                {/* Variant Attributes */}
                                {variant.variant_attributes && Object.keys(variant.variant_attributes).length > 0 && (
                                  <div className="mb-3">
                                    <h5 className="text-xs font-medium text-gray-700 mb-1">Specifications:</h5>
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(variant.variant_attributes).map(([key, value]) => (
                                        <span key={key} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                          {key}: {String(value)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-500">Stock:</span>
                                    <span className="font-medium ml-1">{variant.quantity}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Min Stock:</span>
                                    <span className="font-medium ml-1">{variant.min_quantity}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Cost Price:</span>
                                    <span className="font-medium text-red-600 ml-1">
                                      {formatMoney(variant.cost_price, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Selling Price:</span>
                                    <span className="font-medium text-green-600 ml-1">
                                      {formatMoney(variant.selling_price, safeCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Stock Status Indicator */}
                              <div className="flex flex-col items-center gap-2 ml-4">
                                {variant.quantity === 0 ? (
                                  <span className="w-4 h-4 bg-red-500 rounded-full" title="Out of Stock"></span>
                                ) : variant.quantity <= variant.min_quantity ? (
                                  <span className="w-4 h-4 bg-orange-500 rounded-full" title="Low Stock"></span>
                                ) : (
                                  <span className="w-4 h-4 bg-green-500 rounded-full" title="In Stock"></span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {variant.quantity === 0 ? 'Out of Stock' : 
                                   variant.quantity <= variant.min_quantity ? 'Low Stock' : 'In Stock'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-700 mb-1">No variants found</h4>
                        <p className="text-xs text-gray-400 mb-3">
                          Variants allow you to manage different specifications, prices, and stock levels for this spare part.
                        </p>
                        <div className="text-xs text-gray-400">
                          <p>• Create variants for different qualities (Original, Compatible, Refurbished)</p>
                          <p>• Set different prices and stock levels for each variant</p>
                          <p>• Track variant-specific attributes and specifications</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
