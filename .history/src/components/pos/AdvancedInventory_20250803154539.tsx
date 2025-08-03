import React, { useState, useEffect } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { Package, Scan, AlertTriangle, RefreshCw, Plus, Minus, Settings, BarChart3 } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  cost: number;
  sellingPrice: number;
  supplier: string;
  lastRestocked: Date;
  autoReorder: boolean;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';
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

  // Mock inventory data - replace with real API
  const inventoryItems: InventoryItem[] = [
    {
      id: '1',
      name: 'iPhone 13 Pro Screen',
      sku: 'IP13P-SCR-001',
      barcode: '1234567890123',
      category: 'Screens',
      currentStock: 15,
      minStock: 5,
      maxStock: 50,
      reorderPoint: 10,
      cost: 25000,
      sellingPrice: 45000,
      supplier: 'TechParts Ltd',
      lastRestocked: new Date('2024-01-15'),
      autoReorder: true,
      status: 'in_stock'
    },
    {
      id: '2',
      name: 'Samsung Battery Pack',
      sku: 'SAMS-BAT-002',
      barcode: '9876543210987',
      category: 'Batteries',
      currentStock: 3,
      minStock: 8,
      maxStock: 30,
      reorderPoint: 8,
      cost: 8000,
      sellingPrice: 15000,
      supplier: 'PowerTech Inc',
      lastRestocked: new Date('2024-01-10'),
      autoReorder: true,
      status: 'low_stock'
    },
    {
      id: '3',
      name: 'MacBook Air Keyboard',
      sku: 'MBA-KBD-003',
      barcode: '4567891234567',
      category: 'Keyboards',
      currentStock: 0,
      minStock: 3,
      maxStock: 20,
      reorderPoint: 3,
      cost: 12000,
      sellingPrice: 25000,
      supplier: 'AppleParts Co',
      lastRestocked: new Date('2024-01-05'),
      autoReorder: false,
      status: 'out_of_stock'
    },
    {
      id: '4',
      name: 'AirPods Pro Case',
      sku: 'APP-CASE-004',
      barcode: '7891234567890',
      category: 'Cases',
      currentStock: 75,
      minStock: 10,
      maxStock: 100,
      reorderPoint: 15,
      cost: 5000,
      sellingPrice: 12000,
      supplier: 'CaseMakers Ltd',
      lastRestocked: new Date('2024-01-20'),
      autoReorder: true,
      status: 'overstocked'
    }
  ];

  const categories = ['all', 'Screens', 'Batteries', 'Keyboards', 'Cases', 'Tools'];

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.barcode.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
    return (item.currentStock / item.maxStock) * 100;
  };

  const simulateBarcodeScan = () => {
    setScanning(true);
    setTimeout(() => {
      const randomBarcode = inventoryItems[Math.floor(Math.random() * inventoryItems.length)].barcode;
      setScannedCode(randomBarcode);
      setScanning(false);
      setShowScanner(false);
      // Auto-search for the scanned item
      setSearchQuery(randomBarcode);
    }, 2000);
  };

  const handleReorder = (item: InventoryItem) => {
    // Simulate reorder process
    console.log(`Reordering ${item.name} from ${item.supplier}`);
    // Add notification here
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
            
            <GlassButton
              variant="outline"
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2"
            >
              <Scan size={16} />
              Scan Barcode
            </GlassButton>

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
          </div>

          {/* Barcode Scanner Modal */}
          {showScanner && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60">
              <div className="bg-white rounded-xl p-8 text-center">
                <div className="w-64 h-64 border-2 border-blue-500 rounded-lg mb-4 relative">
                  {scanning ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-pulse">
                        <Scan size={48} className="text-blue-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Scan size={48} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-lg font-medium mb-4">
                  {scanning ? 'Scanning...' : 'Position barcode in frame'}
                </p>
                <div className="flex gap-3">
                  <GlassButton
                    variant="outline"
                    onClick={() => setShowScanner(false)}
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    variant="primary"
                    onClick={simulateBarcodeScan}
                    disabled={scanning}
                  >
                    {scanning ? 'Scanning...' : 'Start Scan'}
                  </GlassButton>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Grid/List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filteredItems.map((item) => (
              <GlassCard
                key={item.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  onItemSelect ? 'hover:scale-105' : ''
                }`}
                onClick={() => onItemSelect?.(item)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.sku}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className="font-medium">{item.currentStock} / {item.maxStock}</span>
                  </div>
                  
                  {/* Stock Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        getStockPercentage(item) > 70 ? 'bg-green-500' :
                        getStockPercentage(item) > 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(getStockPercentage(item), 100)}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Cost:</span>
                      <p className="font-medium">₦{item.cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Price:</span>
                      <p className="font-medium">₦{item.sellingPrice.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReorder(item);
                    }}
                    disabled={item.status === 'overstocked'}
                  >
                    <RefreshCw size={14} />
                    Reorder
                  </GlassButton>
                  
                  {item.autoReorder && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      Auto-reorder
                    </span>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No inventory items found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-600">In Stock</p>
                <p className="text-xl font-bold text-green-700">
                  {inventoryItems.filter(item => item.status === 'in_stock').length}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm text-yellow-600">Low Stock</p>
                <p className="text-xl font-bold text-yellow-700">
                  {inventoryItems.filter(item => item.status === 'low_stock').length}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-sm text-red-600">Out of Stock</p>
                <p className="text-xl font-bold text-red-700">
                  {inventoryItems.filter(item => item.status === 'out_of_stock').length}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-600">Auto-reorder</p>
                <p className="text-xl font-bold text-blue-700">
                  {inventoryItems.filter(item => item.autoReorder).length}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdvancedInventory; 