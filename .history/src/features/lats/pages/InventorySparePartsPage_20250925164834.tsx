import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../../context/AuthContext'; // Unused import
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { 
  Package, Plus, Grid, List, SortAsc, AlertCircle, Edit, Eye, Trash2, 
  RefreshCw, Wrench, Minus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import spare parts forms
import SparePartAddEditForm from '../components/inventory/SparePartAddEditForm';
import SparePartFormSteps from '../components/inventory/SparePartFormSteps';
import SparePartUsageModal from '../components/inventory/SparePartUsageModal';
import SparePartDetailsModal from '../components/spare-parts/SparePartDetailsModal';

// Import database functionality
import { useInventoryStore } from '../stores/useInventoryStore';
import { format } from '../lib/format';
import { SparePart } from '../types/spareParts';
import { SimpleImageDisplay } from '../../../components/SimpleImageDisplay';

const InventorySparePartsPage: React.FC = () => {
  // const { currentUser } = useAuth(); // Unused variable
  
  // Database state management
  const { 
    spareParts, 
    categories,
    isLoading,
    error,
    loadSpareParts,
    loadCategories,
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
  
  // Bulk operations state
  const [selectedSpareParts, setSelectedSpareParts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Form state
  const [showSparePartForm, setShowSparePartForm] = useState(false);
  const [showSparePartFormSteps, setShowSparePartFormSteps] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState<SparePart | null>(null);
  const [selectedSparePartForUsage, setSelectedSparePartForUsage] = useState<SparePart | null>(null);
  const [selectedSparePartForDetail, setSelectedSparePartForDetail] = useState<SparePart | null>(null);

  // Performance optimization state
  const [dataCache, setDataCache] = useState({
    spareParts: null as any,
    categories: null as any,
    lastLoad: 0
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Optimized data loading with parallel execution and caching
  useEffect(() => {
    const loadDataOptimized = async () => {
      const now = Date.now();
      
      // Use cache if data is fresh
      if (dataCache.spareParts && dataCache.categories && (now - dataCache.lastLoad) < CACHE_DURATION) {
        console.log('📦 Using cached spare parts data');
        setIsInitialLoad(false);
        return;
      }

      console.log('🚀 Loading fresh spare parts data...');
      const startTime = performance.now();
      
      try {
        // Load data in parallel for better performance
        const [sparePartsResult, categoriesResult] = await Promise.allSettled([
          loadSpareParts(),
          loadCategories()
        ]);

        const endTime = performance.now();
        console.log(`✅ Spare parts data loaded in ${(endTime - startTime).toFixed(2)}ms`);

        // Update cache
        setDataCache({
          spareParts: sparePartsResult.status === 'fulfilled' ? sparePartsResult.value : null,
          categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value : null,
          lastLoad: now
        });

        // Handle any failures
        if (sparePartsResult.status === 'rejected') {
          console.error('❌ Failed to load spare parts:', sparePartsResult.reason);
          toast.error('Failed to load spare parts data');
        }
        if (categoriesResult.status === 'rejected') {
          console.error('❌ Failed to load categories:', categoriesResult.reason);
          toast.error('Failed to load categories data');
        }

      } catch (error) {
        console.error('💥 Critical error loading spare parts data:', error);
        toast.error('Critical error loading data. Please refresh the page.');
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadDataOptimized();
  }, [loadSpareParts, loadCategories, dataCache.lastLoad]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for spare parts updates to refresh data
  useEffect(() => {
    const handleSparePartsUpdate = (event: CustomEvent) => {
      console.log('🔄 Refreshing spare parts data due to update:', event.detail);
      loadSpareParts();
    };

    window.addEventListener('lats:spare-parts-updated', handleSparePartsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('lats:spare-parts-updated', handleSparePartsUpdate as EventListener);
    };
  }, [loadSpareParts]);

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedSpareParts.length === filteredSpareParts.length) {
      setSelectedSpareParts([]);
    } else {
      setSelectedSpareParts(filteredSpareParts.map(part => part.id));
    }
  };

  const handleSelectPart = (partId: string) => {
    setSelectedSpareParts(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedSpareParts.length === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedSpareParts.length} spare parts?`);
    if (!confirmed) return;

    try {
      const deletePromises = selectedSpareParts.map(id => deleteSparePart(id));
      await Promise.all(deletePromises);
      
      toast.success(`Successfully deleted ${selectedSpareParts.length} spare parts`);
      setSelectedSpareParts([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error deleting spare parts:', error);
      toast.error('Failed to delete some spare parts');
    }
  };

  const handleBulkExport = () => {
    const csvData = filteredSpareParts
      .filter(part => selectedSpareParts.includes(part.id))
      .map(part => ({
        name: part.name,
        partNumber: part.part_number || '',
        category: getCategoryName(part.category_id),
        quantity: part.quantity,
        minQuantity: part.min_quantity,
        costPrice: part.cost_price,
        sellingPrice: part.selling_price,
        location: part.location || '',
        description: part.description || ''
      }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spare-parts-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${csvData.length} spare parts to CSV`);
  };

  // Calculate stock alerts with reorder suggestions
  const stockAlerts = React.useMemo(() => {
    const lowStock = spareParts.filter(part => part.quantity <= part.min_quantity && part.quantity > 0);
    const outOfStock = spareParts.filter(part => part.quantity === 0);
    const reorderSuggestions = spareParts
      .filter(part => part.quantity <= part.min_quantity)
      .map(part => ({
        ...part,
        suggestedReorder: Math.max(part.min_quantity * 2, 10), // Suggest 2x min quantity or 10, whichever is higher
        urgency: part.quantity === 0 ? 'critical' : part.quantity <= part.min_quantity * 0.5 ? 'high' : 'medium'
      }));
    
    return { 
      lowStock, 
      outOfStock, 
      reorderSuggestions,
      total: lowStock.length + outOfStock.length 
    };
  }, [spareParts]);

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
      let aValue: string | number, bValue: string | number;
      
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

  // Transform form data for API
  const transformSparePartData = (formData: Record<string, unknown>) => {
    const transformedData: Record<string, unknown> = {
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

    // Add optional fields if they exist
    if (formData.storageRoomId) transformedData.storageRoomId = formData.storageRoomId;
    if (formData.shelfId) transformedData.shelfId = formData.shelfId;
    if (Array.isArray(formData.images) && formData.images.length > 0) transformedData.images = formData.images;
    if (formData.partType) transformedData.partType = formData.partType;
    if (formData.primaryDeviceType) transformedData.primaryDeviceType = formData.primaryDeviceType;
    if (formData.searchTags) transformedData.searchTags = formData.searchTags;
    if (formData.useVariants !== undefined) transformedData.useVariants = formData.useVariants;
    if (Array.isArray(formData.variants) && formData.variants.length > 0) transformedData.variants = formData.variants;
    
    return transformedData;
  };

  // Input validation function
  const validateSparePartData = (data: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Required fields
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Part name is required');
    }

    // Sanitize string inputs
    if (data.name && typeof data.name === 'string') {
      data.name = data.name.trim().substring(0, 255); // Limit length
    }

    if (data.description && typeof data.description === 'string') {
      data.description = data.description.trim().substring(0, 1000); // Limit length
    }

    // Numeric validation
    if (data.quantity !== undefined && (typeof data.quantity !== 'number' || data.quantity < 0)) {
      errors.push('Quantity must be a non-negative number');
    }

    if (data.minQuantity !== undefined && (typeof data.minQuantity !== 'number' || data.minQuantity < 0)) {
      errors.push('Minimum quantity must be a non-negative number');
    }

    if (data.costPrice !== undefined && (typeof data.costPrice !== 'number' || data.costPrice < 0)) {
      errors.push('Cost price must be a non-negative number');
    }

    if (data.sellingPrice !== undefined && (typeof data.sellingPrice !== 'number' || data.sellingPrice < 0)) {
      errors.push('Selling price must be a non-negative number');
    }

    // Business logic validation
    if (data.quantity !== undefined && data.minQuantity !== undefined && 
        typeof data.quantity === 'number' && typeof data.minQuantity === 'number' &&
        data.quantity < data.minQuantity) {
      errors.push('Current quantity cannot be less than minimum quantity');
    }

    return { isValid: errors.length === 0, errors };
  };

  // Handle spare part creation/editing with validation
  const handleSaveSparePart = async (data: Record<string, unknown>) => {
    try {
      // Validate input data
      const validation = validateSparePartData(data);
      if (!validation.isValid) {
        toast.error(`Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      const transformedData = transformSparePartData(data);
      
      if (editingSparePart) {
        const response = await updateSparePart(editingSparePart.id, transformedData);
        if (response.ok) {
          toast.success('Spare part updated successfully');
          setShowSparePartForm(false);
          setEditingSparePart(null);
          await loadSpareParts();
        } else {
          toast.error(response.message || 'Failed to update spare part');
        }
      } else {
        const response = await createOrUpdateSparePart(transformedData);
        if (response.ok) {
          // Handle different operation types
          const operationType = (response as { operationType?: string }).operationType;
          switch (operationType) {
            case 'CREATE_NEW':
              toast.success('✅ New spare part created successfully!');
              break;
            case 'UPDATE_EXISTING':
              toast.success(`⚠️ Spare part updated instead of created. A part with this part number already existed and was updated.`);
              break;
            default:
              toast.success('Spare part saved successfully');
          }
          setShowSparePartForm(false);
          await loadSpareParts();
        } else {
          // Handle different error types
          const errorType = (response as { errorType?: string }).errorType;
          const message = response.message || 'Failed to create spare part';
          
          switch (errorType) {
            case 'DUPLICATE_PART_NUMBER':
              toast.error(`❌ Part number already exists! ${message.split(':')[1] || message}`);
              break;
            case 'DUPLICATE_CONSTRAINT':
              toast.error(`❌ Duplicate data! ${message.split(':')[1] || message}`);
              break;
            case 'FOREIGN_KEY_VIOLATION':
              toast.error(`❌ Invalid selection! ${message.split(':')[1] || message}`);
              break;
            case 'CHECK_CONSTRAINT_VIOLATION':
              toast.error(`❌ Invalid data! ${message.split(':')[1] || message}`);
              break;
            case 'DATABASE_ERROR':
              toast.error(`❌ Database error! ${message.split(':')[1] || message}`);
              break;
            default:
              toast.error(message);
          }
        }
      }
    } catch (error: unknown) {
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
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const response = await useSparePart(selectedSparePartForUsage.id, quantity, reason, notes);
      if (response.ok) {
        toast.success('Spare part usage recorded successfully');
        setShowUsageModal(false);
        setSelectedSparePartForUsage(null);
        await loadSpareParts();
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
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const response = await useSparePart(selectedSparePartForDetail.id, quantity, reason, notes);
      if (response.ok) {
        toast.success('Spare part usage recorded successfully');
        await loadSpareParts();
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
            <div className="flex gap-2">
              <GlassButton
                onClick={() => {
                  setEditingSparePart(null);
                  setShowSparePartFormSteps(true);
                }}
                className="flex items-center gap-1 text-sm px-3 py-2"
              >
                <Plus className="w-3 h-3" />
                Add Part
              </GlassButton>
              <GlassButton
                onClick={() => {
                  setEditingSparePart(null);
                  setShowSparePartForm(true);
                }}
                variant="outline"
                className="flex items-center gap-1 text-sm px-3 py-2"
              >
                <Package className="w-3 h-3" />
                Advanced
              </GlassButton>
            </div>
          </div>
        </div>

        {/* Stock Alerts Banner with Reorder Suggestions */}
        {stockAlerts.total > 0 && (
          <GlassCard className="mb-4 p-4 border-l-4 border-l-yellow-500">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">Stock Alerts & Reorder Suggestions</h3>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>• {stockAlerts.outOfStock.length} parts out of stock (Critical)</p>
                    <p>• {stockAlerts.lowStock.length} parts with low stock</p>
                    <p>• {stockAlerts.reorderSuggestions.length} parts need reordering</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {stockAlerts.outOfStock.length > 0 && (
                  <GlassButton
                    size="sm"
                    onClick={() => setStockFilter('out-of-stock')}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    View Critical ({stockAlerts.outOfStock.length})
                  </GlassButton>
                )}
                {stockAlerts.lowStock.length > 0 && (
                  <GlassButton
                    size="sm"
                    onClick={() => setStockFilter('low-stock')}
                    className="bg-yellow-600 text-white hover:bg-yellow-700"
                  >
                    View Low Stock ({stockAlerts.lowStock.length})
                  </GlassButton>
                )}
                {stockAlerts.reorderSuggestions.length > 0 && (
                  <GlassButton
                    size="sm"
                    onClick={handleBulkExport}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Export Reorder List
                  </GlassButton>
                )}
              </div>
            </div>
            
            {/* Quick Reorder Suggestions */}
            {stockAlerts.reorderSuggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-yellow-200">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Quick Reorder Suggestions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {stockAlerts.reorderSuggestions.slice(0, 6).map((part) => (
                    <div key={part.id} className={`p-2 rounded text-xs ${
                      part.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                      part.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      <div className="font-medium truncate">{part.name}</div>
                      <div>Current: {part.quantity} | Suggested: {part.suggestedReorder}</div>
                    </div>
                  ))}
                </div>
                {stockAlerts.reorderSuggestions.length > 6 && (
                  <p className="text-xs text-yellow-600 mt-2">
                    +{stockAlerts.reorderSuggestions.length - 6} more parts need attention
                  </p>
                )}
              </div>
            )}
          </GlassCard>
        )}

        {/* Bulk Actions Bar */}
        {selectedSpareParts.length > 0 && (
          <GlassCard className="mb-4 p-3 bg-blue-50 border-blue-200">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800">
                  {selectedSpareParts.length} part{selectedSpareParts.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedSpareParts([])}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex gap-2">
                <GlassButton
                  size="sm"
                  onClick={handleBulkExport}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Package className="w-3 h-3 mr-1" />
                  Export CSV
                </GlassButton>
                <GlassButton
                  size="sm"
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        )}

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
              onChange={(value: string) => setStockFilter(value as 'all' | 'in-stock' | 'low-stock' | 'out-of-stock')}
              placeholder="Stock"
              className="min-w-[100px]"
            />

            {/* Sort */}
            <div className="flex gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'quantity' | 'cost' | 'selling')}
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
                await loadSpareParts();
                toast.success('Data refreshed successfully');
              }}
              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* View Mode - Auto-switch to grid on mobile */}
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="Grid View"
              >
                <Grid className="w-3 h-3" />
              </button>
              {!isMobile && (
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                  title="Table View"
                >
                  <List className="w-3 h-3" />
                </button>
              )}
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

        {/* Loading State with Skeleton */}
        {isLoading || isInitialLoad ? (
          <div className="space-y-4">
            {/* Loading Skeleton for Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <GlassCard key={index} className="animate-pulse">
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                      </div>
                      <div className="h-24 bg-gray-200 rounded mb-2"></div>
                      <div className="space-y-1 mb-3">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex gap-1">
                        <div className="h-8 bg-gray-200 rounded flex-1"></div>
                        <div className="h-8 bg-gray-200 rounded w-8"></div>
                        <div className="h-8 bg-gray-200 rounded w-8"></div>
                        <div className="h-8 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              /* Loading Skeleton for Table View */
              <GlassCard>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {Array.from({ length: 10 }).map((_, index) => (
                          <th key={index} className="text-left py-2 px-3">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 5 }).map((_, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-gray-100">
                          {Array.from({ length: 10 }).map((_, colIndex) => (
                            <td key={colIndex} className="py-2 px-3">
                              <div className="h-4 bg-gray-200 rounded w-12"></div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
          </div>
        ) : (
          <>
            {/* Spare Parts Grid/List */}
            {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSpareParts.map((part) => {
              const stockStatus = getStockStatus(part);
              const isSelected = selectedSpareParts.includes(part.id);
              return (
                <GlassCard key={part.id} className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                  <div className="p-3">
                    {/* Header with Selection */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectPart(part.id)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate text-sm">{part.name}</h3>
                          <p className="text-xs text-gray-500">{part.part_number}</p>
                        </div>
                      </div>
                      <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status.replace('-', ' ')}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="mb-2">
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
                        className="w-full h-24"
                        onClick={() => handleOpenDetailModal(part)}
                      />
                    </div>

                    {/* Description */}
                    {part.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{part.description}</p>
                    )}

                    {/* Details */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium">{getCategoryName(part.category_id)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Qty:</span>
                        <span className={`font-medium ${part.quantity <= part.min_quantity ? 'text-red-600' : 'text-green-600'}`}>
                          {part.quantity}/{part.min_quantity}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Cost:</span>
                        <span className="font-medium">{format.currency(part.cost_price)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium">{format.currency(part.selling_price)}</span>
                      </div>
                      {part.location && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Location:</span>
                          <span className="font-medium">{part.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <GlassButton
                        size="sm"
                        onClick={() => handleOpenDetailModal(part)}
                        className="flex-1 bg-blue-600 text-white hover:bg-blue-700 text-xs px-2 py-1"
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
                        className="px-2 py-1"
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
                        className="px-2 py-1"
                      >
                        <Edit className="w-3 h-3" />
                      </GlassButton>
                      <GlassButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSparePart(part.id)}
                        className="text-red-600 hover:text-red-700 px-2 py-1"
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
                      <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedSpareParts.length === filteredSpareParts.length && filteredSpareParts.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">Image</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">Name</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">Part #</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">Category</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">Qty</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">Cost</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">Price</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">Location</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpareParts.map((part) => {
                    const stockStatus = getStockStatus(part);
                    const isSelected = selectedSpareParts.includes(part.id);
                      return (
                        <tr key={part.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectPart(part.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="py-2 px-3">
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
                              size="sm"
                              className="flex-shrink-0 w-12 h-12"
                              onClick={() => handleOpenDetailModal(part)}
                            />
                          </td>
                          <td className="py-2 px-3">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{part.name}</div>
                            {part.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">{part.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-600">{part.part_number}</td>
                        <td className="py-2 px-3 text-xs text-gray-600">{getCategoryName(part.category_id)}</td>
                        <td className="py-2 px-3">
                          <span className={`font-medium text-sm ${part.quantity <= part.min_quantity ? 'text-red-600' : 'text-green-600'}`}>
                            {part.quantity}
                          </span>
                          <div className="text-xs text-gray-500">min: {part.min_quantity}</div>
                        </td>
                        <td className="py-2 px-3 text-xs font-medium">{format.currency(part.cost_price)}</td>
                        <td className="py-2 px-3 text-xs font-medium">{format.currency(part.selling_price)}</td>
                        <td className="py-2 px-3 text-xs text-gray-600">{part.location || '-'}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                            {stockStatus.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex gap-1">
                            <GlassButton
                              size="sm"
                              onClick={() => handleOpenDetailModal(part)}
                              className="bg-blue-600 text-white hover:bg-blue-700 px-2 py-1"
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
                              className="px-2 py-1"
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
                              className="px-2 py-1"
                            >
                              <Edit className="w-3 h-3" />
                            </GlassButton>
                            <GlassButton
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSparePart(part.id)}
                              className="text-red-600 hover:text-red-700 px-2 py-1"
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
          <GlassCard className="text-center py-8">
            <Package className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-2">No parts found</h3>
            <p className="text-gray-600 text-sm mb-3">
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
                className="text-sm px-3 py-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add First Part
              </GlassButton>
            )}
          </GlassCard>
        )}
          </>
        )}
      </div>

      {/* Spare Part Form Modal */}
      {showSparePartForm && (
        <SparePartAddEditForm
          sparePart={editingSparePart}
          onSave={handleSaveSparePart}
          onCancel={() => {
            setShowSparePartForm(false);
            setEditingSparePart(null);
          }}
        />
      )}

      {/* Spare Part Form Steps Modal */}
      {showSparePartFormSteps && (
        <SparePartFormSteps
          sparePart={editingSparePart}
          onSave={handleSaveSparePart}
          onCancel={() => {
            setShowSparePartFormSteps(false);
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
        <SparePartDetailsModal
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

export default InventorySparePartsPage;
