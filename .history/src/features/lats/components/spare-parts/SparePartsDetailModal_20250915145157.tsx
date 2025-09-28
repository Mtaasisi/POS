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
  Info, Plus, Minus, Save, RotateCcw, Wrench, Settings, Database, Archive, Box,
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

  // Fetch relationship data when modal opens
  useEffect(() => {
    if (isOpen && sparePart?.id) {
      fetchSparePartRelations();
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
                  {/* Spare Part Image */}
                  <div className="space-y-4">
                    <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Wrench className="w-20 h-20" />
                      </div>
                    </div>
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

                {/* Device Compatibilities (from relationship data) */}
                {sparePartWithRelations?.device_compatibilities && sparePartWithRelations.device_compatibilities.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Verified Device Compatibilities</h3>
                    <div className="space-y-2">
                      {sparePartWithRelations.device_compatibilities.map((compatibility) => (
                        <div key={compatibility.id} className="p-3 bg-white rounded-lg border border-gray-200">
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
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Recent Usage History</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {sparePartWithRelations.usage_history.map((usage) => (
                        <div key={usage.id} className="p-3 bg-white rounded-lg border border-gray-200">
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
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Related Spare Parts</h3>
                    <div className="space-y-2">
                      {sparePartWithRelations.related_spare_parts.map((relatedPart) => (
                        <div key={relatedPart.id} className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
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
