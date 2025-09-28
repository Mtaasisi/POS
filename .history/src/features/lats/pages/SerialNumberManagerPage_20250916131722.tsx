import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Smartphone, 
  Wifi, 
  QrCode,
  Filter,
  Download,
  Upload,
  Eye,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import GlassBadge from '../../../features/shared/components/ui/GlassBadge';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import Modal from '../../../features/shared/components/ui/Modal';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { useInventoryStore } from '../stores/useInventoryStore';

interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  condition: string;
  price: number;
  stockQuantity: number;
  status: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  attributes: Record<string, any>;
}

interface InventoryItem {
  id: string;
  product_id: string;
  variant_id?: string;
  serial_number: string;
  imei?: string;
  mac_address?: string;
  barcode?: string;
  status: 'available' | 'reserved' | 'sold' | 'damaged' | 'returned' | 'repair' | 'warranty';
  location?: string;
  shelf?: string;
  bin?: string;
  purchase_date?: string;
  warranty_start?: string;
  warranty_end?: string;
  cost_price?: number;
  selling_price?: number;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  product?: Product;
  variant?: ProductVariant;
}

const SerialNumberManagerPage: React.FC = () => {
  const { products, loadProducts, isLoading } = useInventoryStore();
  
  // State management
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Form data
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    serial_number: '',
    imei: '',
    mac_address: '',
    barcode: '',
    status: 'available',
    location: '',
    shelf: '',
    bin: '',
    cost_price: 0,
    selling_price: 0,
    notes: ''
  });
  
  const [bulkData, setBulkData] = useState({
    serialNumbers: '',
    imeiNumbers: '',
    costPrice: 0,
    sellingPrice: 0,
    location: '',
    notes: ''
  });

  // Load products on component mount
  useEffect(() => {
    if (products.length === 0) {
      loadProducts();
    }
  }, [products.length, loadProducts]);

  // Load inventory items when product/variant changes
  useEffect(() => {
    if (selectedProduct) {
      loadInventoryItems();
    }
  }, [selectedProduct, selectedVariant]);

  const loadInventoryItems = async () => {
    if (!selectedProduct) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          product:lats_products(id, name, sku),
          variant:lats_product_variants(id, name, sku, quantity, price)
        `)
        .eq('product_id', selectedProduct.id);

      if (selectedVariant) {
        query = query.eq('variant_id', selectedVariant.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading inventory items:', error);
        toast.error('Failed to load inventory items');
        return;
      }

      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedProduct || !newItem.serial_number) {
      toast.error('Please select a product and enter a serial number');
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_items')
        .insert([{
          product_id: selectedProduct.id,
          variant_id: selectedVariant?.id || null,
          serial_number: newItem.serial_number,
          imei: newItem.imei || null,
          mac_address: newItem.mac_address || null,
          barcode: newItem.barcode || null,
          status: newItem.status || 'available',
          location: newItem.location || null,
          shelf: newItem.shelf || null,
          bin: newItem.bin || null,
          cost_price: newItem.cost_price || 0,
          selling_price: newItem.selling_price || 0,
          notes: newItem.notes || null,
          metadata: newItem.metadata || {}
        }]);

      if (error) {
        console.error('Error adding inventory item:', error);
        toast.error('Failed to add inventory item');
        return;
      }

      toast.success('Inventory item added successfully');
      setShowAddModal(false);
      resetNewItem();
      loadInventoryItems();
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast.error('Failed to add inventory item');
    }
  };

  const handleBulkAdd = async () => {
    if (!selectedProduct || !bulkData.serialNumbers.trim()) {
      toast.error('Please select a product and enter serial numbers');
      return;
    }

    try {
      const serialNumbers = bulkData.serialNumbers.split('\n').filter(s => s.trim());
      const imeiNumbers = bulkData.imeiNumbers.split('\n').filter(s => s.trim());
      
      if (serialNumbers.length === 0) {
        toast.error('Please enter at least one serial number');
        return;
      }

      const itemsToInsert = serialNumbers.map((serial, index) => ({
        product_id: selectedProduct.id,
        variant_id: selectedVariant?.id || null,
        serial_number: serial.trim(),
        imei: imeiNumbers[index]?.trim() || null,
        mac_address: null,
        barcode: null,
        status: 'available' as const,
        location: bulkData.location || null,
        shelf: null,
        bin: null,
        cost_price: bulkData.costPrice || 0,
        selling_price: bulkData.sellingPrice || 0,
        notes: bulkData.notes || null,
        metadata: {}
      }));

      const { error } = await supabase
        .from('inventory_items')
        .insert(itemsToInsert);

      if (error) {
        console.error('Error adding bulk inventory items:', error);
        toast.error('Failed to add inventory items');
        return;
      }

      toast.success(`${itemsToInsert.length} inventory items added successfully`);
      setShowBulkAddModal(false);
      resetBulkData();
      loadInventoryItems();
    } catch (error) {
      console.error('Error adding bulk inventory items:', error);
      toast.error('Failed to add inventory items');
    }
  };

  const handleUpdateItem = async (item: InventoryItem) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          serial_number: item.serial_number,
          imei: item.imei || null,
          mac_address: item.mac_address || null,
          barcode: item.barcode || null,
          status: item.status,
          location: item.location || null,
          shelf: item.shelf || null,
          bin: item.bin || null,
          cost_price: item.cost_price || 0,
          selling_price: item.selling_price || 0,
          notes: item.notes || null,
          metadata: item.metadata || {}
        })
        .eq('id', item.id);

      if (error) {
        console.error('Error updating inventory item:', error);
        toast.error('Failed to update inventory item');
        return;
      }

      toast.success('Inventory item updated successfully');
      setEditingItem(null);
      loadInventoryItems();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast.error('Failed to update inventory item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting inventory item:', error);
        toast.error('Failed to delete inventory item');
        return;
      }

      toast.success('Inventory item deleted successfully');
      loadInventoryItems();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast.error('Failed to delete inventory item');
    }
  };

  const resetNewItem = () => {
    setNewItem({
      serial_number: '',
      imei: '',
      mac_address: '',
      barcode: '',
      status: 'available',
      location: '',
      shelf: '',
      bin: '',
      cost_price: 0,
      selling_price: 0,
      notes: ''
    });
  };

  const resetBulkData = () => {
    setBulkData({
      serialNumbers: '',
      imeiNumbers: '',
      costPrice: 0,
      sellingPrice: 0,
      location: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      case 'repair':
        return 'bg-purple-100 text-purple-800';
      case 'warranty':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.mac_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'sold', label: 'Sold' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'returned', label: 'Returned' },
    { value: 'repair', label: 'Repair' },
    { value: 'warranty', label: 'Warranty' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Serial Number Manager</h1>
          </div>
          <p className="text-gray-600">Manage serial numbers, IMEI, and MAC addresses for your products</p>
        </div>

        {/* Product Selection */}
        <GlassCard className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Product & Variant</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product
              </label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value);
                  setSelectedProduct(product || null);
                  setSelectedVariant(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a product...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            
            {selectedProduct && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variant (Optional)
                </label>
                <select
                  value={selectedVariant?.id || ''}
                  onChange={(e) => {
                    // You'll need to load variants for the selected product
                    // For now, we'll set it to null
                    setSelectedVariant(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No specific variant</option>
                  {/* Variants will be loaded here */}
                </select>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Actions */}
        {selectedProduct && (
          <div className="flex gap-4 mb-6">
            <GlassButton
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddModal(true)}
            >
              Add Single Item
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => setShowBulkAddModal(true)}
            >
              Bulk Add Items
            </GlassButton>
          </div>
        )}

        {/* Filters and Search */}
        {selectedProduct && (
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by serial number, IMEI, MAC address, or barcode..."
              />
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Inventory Items List */}
        {selectedProduct && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading inventory items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No inventory items found for this product</p>
                <p className="text-sm text-gray-500 mt-1">Add some serial numbers to get started</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <GlassCard key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{item.serial_number}</h3>
                          <GlassBadge className={`${getStatusColor(item.status)} text-xs`}>
                            {item.status}
                          </GlassBadge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {item.imei && (
                            <p className="flex items-center gap-1">
                              <Smartphone className="w-3 h-3" />
                              IMEI: {item.imei}
                            </p>
                          )}
                          {item.mac_address && (
                            <p className="flex items-center gap-1">
                              <Wifi className="w-3 h-3" />
                              MAC: {item.mac_address}
                            </p>
                          )}
                          {item.location && (
                            <p>Location: {item.location}</p>
                          )}
                          {item.cost_price && (
                            <p>Cost: TSH {item.cost_price.toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        icon={<Edit className="w-4 h-4" />}
                        onClick={() => setEditingItem(item)}
                      >
                        Edit
                      </GlassButton>
                      <GlassButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        Delete
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        )}

        {/* Add Single Item Modal */}
        {showAddModal && (
          <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} size="md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Inventory Item</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    value={newItem.serial_number}
                    onChange={(e) => setNewItem(prev => ({ ...prev, serial_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter serial number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IMEI (for mobile devices)
                  </label>
                  <input
                    type="text"
                    value={newItem.imei}
                    onChange={(e) => setNewItem(prev => ({ ...prev, imei: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter IMEI"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MAC Address (for network devices)
                  </label>
                  <input
                    type="text"
                    value={newItem.mac_address}
                    onChange={(e) => setNewItem(prev => ({ ...prev, mac_address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter MAC address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={newItem.barcode}
                    onChange={(e) => setNewItem(prev => ({ ...prev, barcode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter barcode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={newItem.status}
                    onChange={(e) => setNewItem(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="damaged">Damaged</option>
                    <option value="returned">Returned</option>
                    <option value="repair">Repair</option>
                    <option value="warranty">Warranty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price (TSH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.cost_price}
                      onChange={(e) => setNewItem(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price (TSH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.selling_price}
                      onChange={(e) => setNewItem(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newItem.notes}
                    onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <GlassButton
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleAddItem}
                >
                  Add Item
                </GlassButton>
              </div>
            </div>
          </Modal>
        )}

        {/* Bulk Add Modal */}
        {showBulkAddModal && (
          <Modal isOpen={showBulkAddModal} onClose={() => setShowBulkAddModal(false)} size="lg">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Bulk Add Inventory Items</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Numbers (one per line) *
                  </label>
                  <textarea
                    value={bulkData.serialNumbers}
                    onChange={(e) => setBulkData(prev => ({ ...prev, serialNumbers: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                    placeholder="Enter serial numbers, one per line:&#10;SN001&#10;SN002&#10;SN003"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IMEI Numbers (one per line, optional)
                  </label>
                  <textarea
                    value={bulkData.imeiNumbers}
                    onChange={(e) => setBulkData(prev => ({ ...prev, imeiNumbers: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                    placeholder="Enter IMEI numbers, one per line (optional):&#10;123456789012345&#10;123456789012346&#10;123456789012347"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price (TSH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={bulkData.costPrice}
                      onChange={(e) => setBulkData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price (TSH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={bulkData.sellingPrice}
                      onChange={(e) => setBulkData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={bulkData.location}
                    onChange={(e) => setBulkData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={bulkData.notes}
                    onChange={(e) => setBulkData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <GlassButton
                  variant="secondary"
                  onClick={() => setShowBulkAddModal(false)}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleBulkAdd}
                >
                  Add Items
                </GlassButton>
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Item Modal */}
        {editingItem && (
          <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} size="md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Inventory Item</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    value={editingItem.serial_number}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, serial_number: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IMEI
                  </label>
                  <input
                    type="text"
                    value={editingItem.imei || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, imei: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MAC Address
                  </label>
                  <input
                    type="text"
                    value={editingItem.mac_address || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, mac_address: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingItem.status}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="damaged">Damaged</option>
                    <option value="returned">Returned</option>
                    <option value="repair">Repair</option>
                    <option value="warranty">Warranty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editingItem.location || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, location: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price (TSH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingItem.cost_price || 0}
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, cost_price: parseFloat(e.target.value) || 0 } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price (TSH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingItem.selling_price || 0}
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, selling_price: parseFloat(e.target.value) || 0 } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editingItem.notes || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <GlassButton
                  variant="secondary"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={() => editingItem && handleUpdateItem(editingItem)}
                >
                  Update Item
                </GlassButton>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default SerialNumberManagerPage;
