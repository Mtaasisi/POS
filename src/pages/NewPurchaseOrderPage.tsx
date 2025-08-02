import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSuppliers, getProducts, type Supplier, type Product, type ProductVariant } from '../lib/inventoryApi';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import ProductSelector from '../components/ui/ProductSelector';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Building, 
  Calendar,
  DollarSign,
  Package,
  Hash,
  User,
  FileText,
  Calculator
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface POItem {
  id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

const NewPurchaseOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: '',
    payment_terms: ''
  });

  const [items, setItems] = useState<POItem[]>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suppliersData, productsData] = await Promise.all([
        getSuppliers(),
        getProducts()
      ]);
      setSuppliers(suppliersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load suppliers and products');
    }
  };

  const addItem = () => {
    // Add empty item
    const newItem: Partial<POItem> = {
      id: Date.now().toString(),
      quantity: 1,
      unit_cost: 0,
      total_cost: 0
    };
    setItems([...items, newItem as POItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof POItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate total cost when quantity or unit cost changes
        if (field === 'quantity' || field === 'unit_cost') {
          updatedItem.total_cost = updatedItem.quantity * updatedItem.unit_cost;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const updateItemProduct = (id: string, selection: { product: Product; variant: ProductVariant } | null) => {
    if (!selection) return;
    
    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          product: selection.product,
          variant: selection.variant,
          unit_cost: selection.variant.cost_price,
          total_cost: item.quantity * selection.variant.cost_price
        };
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_cost, 0);
    const tax = subtotal * 0.18; // 18% VAT
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (items.some(item => !item.product || !item.variant)) {
      toast.error('Please select products for all items');
      return;
    }

    setLoading(true);
    try {
      // Here you would create the purchase order
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Purchase order created successfully!');
      navigate('/inventory/purchase-orders');
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      toast.error(error.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <GlassButton
          onClick={() => navigate('/inventory/purchase-orders')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back
        </GlassButton>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Purchase Order</h1>
          <p className="text-gray-600">Create a new purchase order for inventory restocking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <GlassCard className="mb-6">
          {/* Order Information */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Order Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier *
                </label>
                <div className="relative">
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    required
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    required
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Delivery Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="e.g., Net 30, COD"
                  />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                placeholder="Add any notes for this purchase order"
                rows={3}
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                Order Items ({items.length})
              </h3>
              <GlassButton
                type="button"
                onClick={addItem}
                className="flex items-center gap-2"
              >
                <Plus size={20} />
                Add Item
              </GlassButton>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                    {items.length > 0 && (
                      <GlassButton
                        type="button"
                        onClick={() => removeItem(item.id)}
                        variant="danger"
                        className="flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Remove
                      </GlassButton>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product *
                      </label>
                      <ProductSelector
                        value={item.product && item.variant ? { product: item.product, variant: item.variant } : null}
                        onChange={(selection) => updateItemProduct(item.id, selection)}
                        placeholder="Search and select product..."
                        allowNewProduct={true}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Cost (TZS) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_cost || ''}
                        onChange={(e) => updateItem(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Item Summary */}
                  {item.product && item.variant && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900">{item.product.name} - {item.variant.variant_name}</p>
                          <p className="text-sm text-blue-700">SKU: {item.variant.sku}</p>
                          <p className="text-sm text-blue-700">Current Stock: {item.variant.quantity_in_stock}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-900">
                            Total: {(item.total_cost || 0).toLocaleString('en-TZ', {
                              style: 'currency',
                              currency: 'TZS',
                              minimumFractionDigits: 0
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No items added yet</p>
                  <GlassButton
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add First Item
                  </GlassButton>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator size={20} className="text-blue-600" />
                Order Summary
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{subtotal.toLocaleString('en-TZ', {
                    style: 'currency',
                    currency: 'TZS',
                    minimumFractionDigits: 0
                  })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (18%):</span>
                  <span className="font-medium">{tax.toLocaleString('en-TZ', {
                    style: 'currency',
                    currency: 'TZS',
                    minimumFractionDigits: 0
                  })}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-blue-600">{total.toLocaleString('en-TZ', {
                    style: 'currency',
                    currency: 'TZS',
                    minimumFractionDigits: 0
                  })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 mt-6">
            <GlassButton
              type="button"
              onClick={() => navigate('/inventory/purchase-orders')}
              variant="secondary"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              disabled={loading || items.length === 0}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save size={20} />
              )}
              {loading ? 'Creating...' : 'Create Purchase Order'}
            </GlassButton>
          </div>
        </GlassCard>
      </form>
    </div>
  );
};

export default NewPurchaseOrderPage;