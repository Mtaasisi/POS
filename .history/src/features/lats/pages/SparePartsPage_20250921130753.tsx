import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import LATSQuickActions from '../components/ui/LATSQuickActions';
import { 
  Package, Search, Plus, Grid, List, Filter, SortAsc, Download, Upload,
  AlertCircle, Edit, Eye, Trash2, Star, Tag, DollarSign, TrendingUp, 
  Activity, BarChart3, Settings, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Users, Crown, Calendar, RotateCcw, RefreshCw as RefreshCwIcon,
  Wrench, Tool, AlertTriangle, Minus, Plus as PlusIcon, History, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import spare parts forms
import SparePartForm from '../components/inventory/SparePartForm';
import SparePartUsageModal from '../components/inventory/SparePartUsageModal';
import SparePartsDetailModal from '../components/spare-parts/SparePartsDetailModal';

// Import database functionality
import { useInventoryStore } from '../stores/useInventoryStore';
import { format } from '../lib/format';
import { SparePart, SparePartUsage } from '../types/spareParts';
import { SimpleImageDisplay } from '../../../components/SimpleImageDisplay';

const SparePartsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Database state management
  const { 
    spareParts, 
    sparePartUsage,
    categories,
    isLoading,
    error,
    loadSpareParts,
    loadSparePartUsage,
    loadCategories,
    createSparePart,
    createOrUpdateSparePart,
    updateSparePart,
    deleteSparePart,
    useSparePart
  } = useInventoryStore();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'cost' | 'selling'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedSpareParts, setSelectedSpareParts] = useState<string[]>([]);

  // Form state
  const [showSparePartForm, setShowSparePartForm] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState<SparePart | null>(null);
  const [selectedSparePartForUsage, setSelectedSparePartForUsage] = useState<SparePart | null>(null);
  const [selectedSparePartForDetail, setSelectedSparePartForDetail] = useState<SparePart | null>(null);

  // Load data on component mount
  useEffect(() => {
    console.log('🔍 [SparePartsPage] Component mounted, loading data...');
    loadSpareParts();
    loadSparePartUsage();
    loadCategories();
  }, [loadSpareParts, loadSparePartUsage, loadCategories]);

  // Debug spare parts data
  useEffect(() => {
    console.log('🔍 [SparePartsPage] Spare parts data changed:', {
      sparePartsCount: spareParts.length,
      isLoading,
      error,
      spareParts: spareParts.slice(0, 3) // Log first 3 for debugging
    });
  }, [spareParts, isLoading, error]);

  // Filter and sort spare parts
  const filteredSpareParts = React.useMemo(() => {
    const filtered = spareParts.filter(part => {
      const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || part.category_id === selectedCategory;
      
      let matchesStock = true;
      switch (stockFilter) {
        case 'in-stock':
          matchesStock = part.quantity > part.min_quantity;
          break;
        case 'low-stock':
          matchesStock = part.quantity <= part.min_quantity && part.quantity > 0;
          break;
        case 'out-of-stock':
          matchesStock = part.quantity === 0;
          break;
      }
      
      return matchesSearch && matchesCategory && matchesStock;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'cost':
          aValue = a.cost_price;
          bValue = b.cost_price;
          break;
        case 'selling':
          aValue = a.selling_price;
          bValue = b.selling_price;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [spareParts, searchTerm, selectedCategory, stockFilter, sortBy, sortOrder]);

  // Transform form data - keep camelCase format since API handles conversion
  const transformSparePartData = (formData: any) => {
    // Keep the original camelCase format since the API functions handle the conversion
    const transformedData: any = {
      name: formData.name,
      partNumber: formData.partNumber,
      categoryId: formData.categoryId,
      brand: formData.brand,
      supplierId: formData.supplierId,
      condition: formData.condition,
      description: formData.description,
      costPrice: formData.costPrice,
      sellingPrice: formData.sellingPrice,
      quantity: formData.quantity,
      minQuantity: formData.minQuantity,
      location: formData.location,
      compatibleDevices: formData.compatibleDevices
    };

    // Optional fields - only add if they exist and have values
    if (formData.storageRoomId) {
      transformedData.storageRoomId = formData.storageRoomId;
    }
    
    if (formData.shelfId) {
      transformedData.shelfId = formData.shelfId;
    }

    if (formData.images && formData.images.length > 0) {
      console.log('🔍 [SparePartsPage] Processing images for save:', formData.images);
      
      // Keep the full image objects for proper thumbnail handling
      // The API will extract URLs for the images array and use full objects for spare_part_images table
      transformedData.images = formData.images;
      console.log('✅ [SparePartsPage] Keeping full image objects for proper thumbnail handling:', formData.images);
    }

    if (formData.partType) {
      transformedData.partType = formData.partType;
    }
    
    if (formData.primaryDeviceType) {
      transformedData.primaryDeviceType = formData.primaryDeviceType;
    }
    
    if (formData.searchTags) {
      transformedData.searchTags = formData.searchTags;
    }

    // Handle variants data
    if (formData.useVariants !== undefined) {
      transformedData.useVariants = formData.useVariants;
    }
    
    if (formData.variants && formData.variants.length > 0) {
      transformedData.variants = formData.variants;
    }
    
    return transformedData;
  };

  // Handle spare part creation/editing
  const handleSaveSparePart = async (data: any) => {
    try {
      const transformedData = transformSparePartData(data);
      console.log('🔍 [SparePartsPage] Saving spare part with data:', transformedData);
      
      if (editingSparePart) {
        const response = await updateSparePart(editingSparePart.id, transformedData);
        
        if (response.ok) {
          toast.success('Spare part updated successfully');
          setShowSparePartForm(false);
          setEditingSparePart(null);
          await loadSpareParts(); // Refresh the list
        } else {
          toast.error(response.message || 'Failed to update spare part');
        }
      } else {
        console.log('🔍 [SparePartsPage] Calling createOrUpdateSparePart with data:', transformedData);
        const response = await createOrUpdateSparePart(transformedData);
        
        if (response.ok) {
          toast.success('Spare part created successfully');
          setShowSparePartForm(false);
          await loadSpareParts(); // Refresh the list
        } else {
          toast.error(response.message || 'Failed to create spare part');
        }
      }
    } catch (error: any) {
      console.error('Error saving spare part:', error);
      toast.error('An unexpected error occurred while saving the spare part');
    }
  };

  // Handle spare part deletion
  const handleDeleteSparePart = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this spare part?')) {
      try {
        const response = await deleteSparePart(id);
        if (response.ok) {
          toast.success('Spare part deleted successfully');
          await loadSpareParts(); // Refresh the list
        } else {
          toast.error(response.message || 'Failed to delete spare part');
        }
      } catch (error) {
        toast.error('An error occurred');
      }
    }
  };

  // Handle spare part usage
  const handleUseSparePart = async (quantity: number, reason: string, notes?: string) => {
    if (!selectedSparePartForUsage) return;
    
    try {
      const response = await useSparePart(selectedSparePartForUsage.id, quantity, reason, notes);
      if (response.ok) {
        toast.success('Spare part usage recorded successfully');
        setShowUsageModal(false);
        setSelectedSparePartForUsage(null);
        await loadSpareParts(); // Refresh the list
        await loadSparePartUsage(); // Refresh usage history
      } else {
        toast.error(response.message || 'Failed to record spare part usage');
      }
    } catch (error) {
      console.error('Error recording spare part usage:', error);
      toast.error('An unexpected error occurred while recording usage');
    }
  };

  // Handle opening detail modal
  const handleOpenDetailModal = (sparePart: SparePart) => {
    setSelectedSparePartForDetail(sparePart);
    setShowDetailModal(true);
  };

  // Handle closing detail modal
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSparePartForDetail(null);
  };

  // Handle editing from detail modal
  const handleEditFromDetailModal = (sparePart: SparePart) => {
    setEditingSparePart(sparePart);
    setShowDetailModal(false);
    setShowSparePartForm(true);
  };

  // Handle deleting from detail modal
  const handleDeleteFromDetailModal = async (id: string) => {
    await handleDeleteSparePart(id);
    setShowDetailModal(false);
    setSelectedSparePartForDetail(null);
  };

  // Handle using spare part from detail modal
  const handleUseFromDetailModal = async (quantity: number, reason: string, notes?: string) => {
    if (!selectedSparePartForDetail) return;
    
    try {
      const response = await useSparePart(selectedSparePartForDetail.id, quantity, reason, notes);
      if (response.ok) {
        toast.success('Spare part usage recorded successfully');
        await loadSpareParts(); // Refresh the list
        await loadSparePartUsage(); // Refresh usage history
      } else {
        toast.error(response.message || 'Failed to record spare part usage');
      }
    } catch (error) {
      console.error('Error recording spare part usage:', error);
      toast.error('An unexpected error occurred while recording usage');
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  // Get stock status
  const getStockStatus = (part: SparePart) => {
    if (part.quantity === 0) return { status: 'out-of-stock', color: 'text-red-500', bg: 'bg-red-100' };
    if (part.quantity <= part.min_quantity) return { status: 'low-stock', color: 'text-yellow-500', bg: 'bg-yellow-100' };
    return { status: 'in-stock', color: 'text-green-500', bg: 'bg-green-100' };
  };


  return (
    <div className="min-h-screen">
      
      <div className="max-w-6xl mx-auto p-3">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="text-blue-600 w-5 h-5" />
              Spare Parts
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage inventory, track usage, monitor stock
            </p>
          </div>
          
          <div className="flex gap-2">
            <GlassButton
              onClick={() => {
                setEditingSparePart(null);
                setShowSparePartForm(true);
              }}
              className="flex items-center gap-1 text-sm px-3 py-2"
            >
              <Plus className="w-3 h-3" />
              Add Part
            </GlassButton>
          </div>
        </div>



        {/* Filters and Search */}
        <GlassCard className="mb-4 p-3">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <SearchBar
                onSearch={setSearchTerm}
                placeholder="Search parts..."
                className="w-full"
                suggestions={spareParts.map(sp => sp.name)}
                searchKey="spare_parts_search"
              />
            </div>

            {/* Category Filter */}
            <GlassSelect
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(category => ({
                  value: category.id,
                  label: category.name
                }))
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Category"
              className="min-w-[120px]"
            />

            {/* Stock Filter */}
            <GlassSelect
              options={[
                { value: 'all', label: 'All Stock' },
                { value: 'in-stock', label: 'In Stock' },
                { value: 'low-stock', label: 'Low Stock' },
                { value: 'out-of-stock', label: 'Out of Stock' }
              ]}
              value={stockFilter}
              onChange={setStockFilter}
              placeholder="Stock"
              className="min-w-[100px]"
            />

            {/* Sort */}
            <div className="flex gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="quantity">Qty</option>
                <option value="cost">Cost</option>
                <option value="selling">Price</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                <SortAsc className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={async () => {
                console.log('🔄 Manual refresh triggered');
                await loadSpareParts();
                toast.success('Data refreshed successfully');
              }}
              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* View Mode */}
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Grid className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <List className="w-3 h-3" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center gap-2 text-red-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Loading parts...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Spare Parts Grid/List */}
            {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSpareParts.map((part) => {
              const stockStatus = getStockStatus(part);
              return (
                <GlassCard key={part.id} className="hover:shadow-lg transition-shadow">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{part.name}</h3>
                        <p className="text-sm text-gray-500">{part.part_number}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status.replace('-', ' ')}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="mb-3">
                      <SimpleImageDisplay
                        images={part.images ? part.images.map((url, index) => ({
                          id: `spare-part-${part.id}-${index}`,
                          url: url,
                          thumbnailUrl: url,
                          fileName: `spare-part-${index + 1}`,
                          fileSize: 0,
                          isPrimary: index === 0,
                          uploadedAt: part.created_at || new Date().toISOString()
                        })) : []}
                        productName={part.name}
                        size="lg"
                        className="w-full h-32"
                        onClick={() => handleOpenDetailModal(part)}
                      />
                    </div>

                    {/* Description */}
                    {part.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{part.description}</p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium">{getCategoryName(part.category_id)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Quantity:</span>
                        <span className={`font-medium ${part.quantity <= part.min_quantity ? 'text-red-600' : 'text-green-600'}`}>
                          {part.quantity} / {part.min_quantity} min
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Cost:</span>
                        <span className="font-medium">{format.currency(part.cost_price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Selling:</span>
                        <span className="font-medium">{format.currency(part.selling_price)}</span>
                      </div>
                      {part.location && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Location:</span>
                          <span className="font-medium">{part.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <GlassButton
                        size="sm"
                        onClick={() => handleOpenDetailModal(part)}
                        className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </GlassButton>
                      <GlassButton
                        size="sm"
                        onClick={() => {
                          setSelectedSparePartForUsage(part);
                          setShowUsageModal(true);
                        }}
                        disabled={part.quantity === 0}
                      >
                        <Minus className="w-3 h-3" />
                      </GlassButton>
                      <GlassButton
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSparePart(part);
                          setShowSparePartForm(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </GlassButton>
                      <GlassButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSparePart(part.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ) : (
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Image</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Part Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Cost</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Selling</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpareParts.map((part) => {
                    const stockStatus = getStockStatus(part);
                      return (
                        <tr key={part.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <SimpleImageDisplay
                              images={part.images ? part.images.map((url, index) => ({
                                id: `spare-part-${part.id}-${index}`,
                                url: url,
                                thumbnailUrl: url,
                                fileName: `spare-part-${index + 1}`,
                                fileSize: 0,
                                isPrimary: index === 0,
                                uploadedAt: part.created_at || new Date().toISOString()
                              })) : []}
                              productName={part.name}
                              size="md"
                              className="flex-shrink-0"
                              onClick={() => handleOpenDetailModal(part)}
                            />
                          </td>
                          <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{part.name}</div>
                            {part.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{part.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{part.part_number}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{getCategoryName(part.category_id)}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${part.quantity <= part.min_quantity ? 'text-red-600' : 'text-green-600'}`}>
                            {part.quantity}
                          </span>
                          <div className="text-xs text-gray-500">min: {part.min_quantity}</div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">{format.currency(part.cost_price)}</td>
                        <td className="py-3 px-4 text-sm font-medium">{format.currency(part.selling_price)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{part.location || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                            {stockStatus.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <GlassButton
                              size="sm"
                              onClick={() => handleOpenDetailModal(part)}
                              className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Eye className="w-3 h-3" />
                            </GlassButton>
                            <GlassButton
                              size="sm"
                              onClick={() => {
                                setSelectedSparePartForUsage(part);
                                setShowUsageModal(true);
                              }}
                              disabled={part.quantity === 0}
                            >
                              <Minus className="w-3 h-3" />
                            </GlassButton>
                            <GlassButton
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSparePart(part);
                                setShowSparePartForm(true);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </GlassButton>
                            <GlassButton
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSparePart(part.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </GlassButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

            {/* Empty State */}
            {filteredSpareParts.length === 0 && (
          <GlassCard className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No spare parts found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' || stockFilter !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Get started by adding your first spare part'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && stockFilter === 'all' && (
              <GlassButton
                onClick={() => {
                  setEditingSparePart(null);
                  setShowSparePartForm(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Spare Part
              </GlassButton>
            )}
          </GlassCard>
            )}
          </>
        )}
      </div>

      {/* Spare Part Form Modal */}
      {showSparePartForm && (
        <SparePartForm
          sparePart={editingSparePart}
          onSave={handleSaveSparePart}
          onCancel={() => {
            setShowSparePartForm(false);
            setEditingSparePart(null);
          }}
        />
      )}

      {/* Usage Modal */}
      {showUsageModal && selectedSparePartForUsage && (
        <SparePartUsageModal
          sparePart={selectedSparePartForUsage}
          onUse={handleUseSparePart}
          onCancel={() => {
            setShowUsageModal(false);
            setSelectedSparePartForUsage(null);
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSparePartForDetail && (
        <SparePartsDetailModal
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
          sparePart={selectedSparePartForDetail}
          currency={{ code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', flag: '🇹🇿' }}
          onEdit={handleEditFromDetailModal}
          onDelete={handleDeleteFromDetailModal}
          onUse={handleUseFromDetailModal}
        />
      )}
    </div>
  );
};

export default SparePartsPage;
