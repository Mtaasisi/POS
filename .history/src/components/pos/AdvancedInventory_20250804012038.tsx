import React, { useState, useEffect } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { Package, Scan, AlertTriangle, RefreshCw, Plus, Minus, Settings, BarChart3 } from 'lucide-react';
import { getProducts, searchProducts, Product, ProductVariant } from '../../lib/inventoryApi';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category?: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  cost: number;
  sellingPrice: number;
  supplier?: string;
  lastRestocked?: Date;
  autoReorder: boolean;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';
  product?: Product;
  variant?: ProductVariant;
}

interface AdvancedInventoryProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSelect?: (item: InventoryItem) => void;
}

const AdvancedInventory: React.FC<AdvancedInventoryProps> = ({ 
  isOpen, 
  onClose, 
  onItemSelect 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Load inventory data on component mount
  useEffect(() => {
    if (isOpen) {
      loadInventoryData();
    }
  }, [isOpen]);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const products = await getProducts();
      
      // Transform products and variants into inventory items
      const items: InventoryItem[] = [];
      
      products.forEach(product => {
        if (product.variants && product.variants.length > 0) {
          // Create inventory items for each variant
          product.variants.forEach(variant => {
            const status = getStockStatus(variant.available_quantity, product.minimum_stock_level, product.maximum_stock_level);
            
            items.push({
              id: variant.id,
              name: `${product.name} - ${variant.variant_name}`,
              sku: variant.sku,
              barcode: product.barcode,
              category: product.category?.name,
              currentStock: variant.available_quantity,
              minStock: product.minimum_stock_level,
              maxStock: product.maximum_stock_level,
              reorderPoint: product.reorder_point,
              cost: variant.cost_price,
              sellingPrice: variant.selling_price,
              supplier: product.supplier?.name,
              lastRestocked: new Date(variant.updated_at),
              autoReorder: true, // Default to true for now
              status,
              product,
              variant
            });
          });
        } else {
          // Create inventory item for product without variants
          const status = getStockStatus(0, product.minimum_stock_level, product.maximum_stock_level);
          
          items.push({
            id: product.id,
            name: product.name,
            sku: product.product_code || `PROD-${product.id}`,
            barcode: product.barcode,
            category: product.category?.name,
            currentStock: 0,
            minStock: product.minimum_stock_level,
            maxStock: product.maximum_stock_level,
            reorderPoint: product.reorder_point,
            cost: 0, // No cost info for products without variants
            sellingPrice: 0, // No selling price for products without variants
            supplier: product.supplier?.name,
            lastRestocked: new Date(product.updated_at),
            autoReorder: true,
            status,
            product
          });
        }
      });
      
      setInventoryItems(items);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))];
      setCategories(['all', ...uniqueCategories]);
      
    } catch (error) {
      console.error('Error loading inventory data:', error);
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (currentStock: number, minStock: number, maxStock: number): 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked' => {
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock <= minStock) return 'low_stock';
    if (currentStock >= maxStock * 0.9) return 'overstocked';
    return 'in_stock';
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.barcode && item.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesLowStock = !showLowStockOnly || item.status === 'low_stock' || item.status === 'out_of_stock';
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'overstocked':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockPercentage = (item: InventoryItem) => {
    if (item.maxStock === 0) return 0;
    return (item.currentStock / item.maxStock) * 100;
  };

  const simulateBarcodeScan = () => {
    setScanning(true);
    setTimeout(() => {
      const randomItem = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
      const barcode = randomItem.barcode || randomItem.sku;
      setScannedCode(barcode);
      setScanning(false);
      setShowScanner(false);
      // Auto-search for the scanned item
      setSearchQuery(barcode);
    }, 2000);
  };

  const handleReorder = (item: InventoryItem) => {
    // Simulate reorder process
    console.log(`Reordering ${item.name} from ${item.supplier}`);
    // Add notification here
  };

  const handleItemSelect = (item: InventoryItem) => {
    if (onItemSelect) {
      onItemSelect(item);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-6xl w-full mx-4">
        <GlassCard className="bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Advanced Inventory Management</h2>
            </div>
            <div className="flex items-center gap-2">
              <GlassButton
                variant="outline"
                size="sm"
                onClick={loadInventoryData}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </GlassButton>
              <GlassButton
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                <BarChart3 size={16} />
              </GlassButton>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name, SKU, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>

            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            >
              {showLowStockOnly ? 'Hide Low Stock' : 'Show Low Stock Only'}
            </GlassButton>

            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => setShowScanner(!showScanner)}
            >
              <Scan size={16} />
              Scan
            </GlassButton>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading inventory data...</span>
            </div>
          )}

          {/* Inventory Items */}
          {!loading && (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {filteredItems.map((item) => (
                <GlassCard
                  key={item.id}
                  className={`hover:shadow-lg transition-all cursor-pointer group ${
                    onItemSelect ? 'hover:border-blue-300' : ''
                  }`}
                  onClick={() => onItemSelect && handleItemSelect(item)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">SKU: {item.sku}</p>
                      {item.barcode && (
                        <p className="text-xs text-gray-500">Barcode: {item.barcode}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-medium">{item.currentStock} / {item.maxStock}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.status === 'out_of_stock' ? 'bg-red-500' :
                          item.status === 'low_stock' ? 'bg-yellow-500' :
                          item.status === 'overstocked' ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(getStockPercentage(item), 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cost:</span>
                                              <span className="font-medium">Tsh{item.cost.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                                              <span className="font-medium text-blue-600">Tsh{item.sellingPrice.toLocaleString()}</span>
                    </div>

                    {item.category && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{item.category}</span>
                      </div>
                    )}

                    {item.supplier && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Supplier:</span>
                        <span className="font-medium">{item.supplier}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <GlassButton 
                      variant="primary" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorder(item);
                      }}
                    >
                      <Plus size={14} />
                      Reorder
                    </GlassButton>
                    
                    {item.status === 'low_stock' && (
                      <AlertTriangle size={16} className="text-yellow-500" />
                    )}
                    {item.status === 'out_of_stock' && (
                      <AlertTriangle size={16} className="text-red-500" />
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* No Items Found */}
          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or check if products are available.</p>
            </div>
          )}

          {/* Inventory Summary */}
          {!loading && inventoryItems.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">In Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800 mt-1">
                    {inventoryItems.filter(item => item.status === 'in_stock').length}
                  </p>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-700">Low Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-800 mt-1">
                    {inventoryItems.filter(item => item.status === 'low_stock').length}
                  </p>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-700">Out of Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-red-800 mt-1">
                    {inventoryItems.filter(item => item.status === 'out_of_stock').length}
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-700">Overstocked</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-800 mt-1">
                    {inventoryItems.filter(item => item.status === 'overstocked').length}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-xl font-bold text-gray-900">{inventoryItems.length}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-xl font-bold text-gray-900">
                    Tsh{inventoryItems.reduce((sum, item) => sum + (item.cost * item.currentStock), 0).toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-xl font-bold text-gray-900">{categories.length - 1}</p>
                </div>
              </div>
            </div>
          )}

          {/* Barcode Scanner Modal */}
          {showScanner && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Barcode Scanner</h3>
                {scanning ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Scanning barcode...</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Scan size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Position barcode in front of camera</p>
                    <GlassButton onClick={simulateBarcodeScan}>
                      Simulate Scan
                    </GlassButton>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <GlassButton variant="outline" onClick={() => setShowScanner(false)} className="flex-1">
                    Cancel
                  </GlassButton>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default AdvancedInventory; 