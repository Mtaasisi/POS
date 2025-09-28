import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, QrCode, Smartphone, Wifi, AlertCircle, CheckCircle } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassBadge from '../../../shared/components/ui/GlassBadge';
import SearchBar from '../../../shared/components/ui/SearchBar';
import Modal from '../../../shared/components/ui/Modal';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../../lib/supabaseClient';

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
}

interface SerialNumberManagerProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

const SerialNumberManager: React.FC<SerialNumberManagerProps> = ({
  productId,
  productName,
  isOpen,
  onClose
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
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

  useEffect(() => {
    if (isOpen && productId) {
      loadItems();
    }
  }, [isOpen, productId]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading inventory items:', error);
        toast.error('Failed to load inventory items');
        return;
      }

      setItems(data || []);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      if (!newItem.serial_number) {
        toast.error('Serial number is required');
        return;
      }

      const { error } = await supabase
        .from('inventory_items')
        .insert([{
          product_id: productId,
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
      loadItems();
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast.error('Failed to add inventory item');
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
      loadItems();
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
      loadItems();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast.error('Failed to delete inventory item');
    }
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

  const filteredItems = items.filter(item => {
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Serial Number Manager</h2>
            <p className="text-gray-600">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
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
          <GlassButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Item
          </GlassButton>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading inventory items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No inventory items found</p>
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
                          <p>Cost: ${item.cost_price}</p>
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

        {/* Add Item Modal */}
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
                      Cost Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.cost_price}
                      onChange={(e) => setNewItem(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.selling_price}
                      onChange={(e) => setNewItem(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
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
                      Cost Price
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
                      Selling Price
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
    </Modal>
  );
};

export default SerialNumberManager;
