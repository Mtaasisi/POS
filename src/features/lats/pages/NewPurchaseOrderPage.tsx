import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import PriceInput from '../../../shared/components/ui/PriceInput';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { 
  Package, Search, Plus, Minus, Save, X, AlertCircle, 
  FileText, ShoppingCart, Clock, CheckSquare, XSquare, Send, Truck,
  DollarSign, Calendar, FilePlus, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../stores/useInventoryStore';
import { PurchaseOrderFormData, PurchaseOrderItemFormData, Product, Supplier } from '../types/inventory';

const NewPurchaseOrderPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Database state management
  const { 
    products,
    suppliers,
    isLoading,
    error,
    loadProducts,
    loadSuppliers,
    createPurchaseOrder
  } = useInventoryStore();

  // Form state
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplierId: '',
    expectedDelivery: '',
    notes: '',
    items: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadProducts({ page: 1, limit: 50 });
    loadSuppliers();
  }, [loadProducts, loadSuppliers]);

  // Filter products based on search
  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [searchQuery, products]);

  // Handle form field changes
  const handleFieldChange = (field: keyof PurchaseOrderFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add item to purchase order
  const addItem = (product: Product) => {
    const existingItem = formData.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update quantity if item already exists
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }));
    } else {
      // Add new item
      const newItem: PurchaseOrderItemFormData = {
        productId: product.id,
        variantId: product.variants?.[0]?.id || '',
        quantity: 1,
        costPrice: product.variants?.[0]?.costPrice || 0,
        notes: ''
      };
      
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
    
    setShowProductSearch(false);
    setSearchQuery('');
  };

  // Update item
  const updateItem = (index: number, field: keyof PurchaseOrderItemFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Remove item
  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Calculate total
  const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId) {
      toast.error('Please select a supplier');
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const response = await createPurchaseOrder(formData);
    if (response.ok) {
      toast.success('Purchase order created successfully');
      navigate('/lats/purchase-orders');
    } else {
      toast.error(response.message || 'Failed to create purchase order');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  const getProductById = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const getVariantById = (productId: string, variantId: string) => {
    const product = getProductById(productId);
    return product?.variants?.find(v => v.id === variantId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <div className="container mx-auto px-4 py-6">
        <LATSBreadcrumb 
          items={[
            { label: 'LATS', href: '/lats' },
            { label: 'Purchase Orders', href: '/lats/purchase-orders' },
            { label: 'New Purchase Order', href: '/lats/purchase-orders/new' }
          ]} 
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">New Purchase Order</h1>
            <p className="text-gray-600">Create a new purchase order for inventory</p>
          </div>
          
          <div className="flex gap-2">
            <GlassButton
              onClick={() => navigate('/lats/purchase-orders')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </GlassButton>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Details */}
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Supplier */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier *
                      </label>
                      <select
                        value={formData.supplierId}
                        onChange={(e) => handleFieldChange('supplierId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a supplier</option>
                        {suppliers?.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Expected Delivery */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Delivery
                      </label>
                      <input
                        type="date"
                        value={formData.expectedDelivery}
                        onChange={(e) => handleFieldChange('expectedDelivery', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any additional notes..."
                    />
                  </div>
                </div>
              </GlassCard>

              {/* Items */}
              <GlassCard>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Order Items</h2>
                    <GlassButton
                      type="button"
                      onClick={() => setShowProductSearch(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </GlassButton>
                  </div>

                  {formData.items.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No items added yet</p>
                      <p className="text-sm text-gray-500">Click "Add Item" to start building your order</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.items.map((item, index) => {
                        const product = getProductById(item.productId);
                        const variant = getVariantById(item.productId, item.variantId);
                        
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">{product?.name}</h3>
                                <p className="text-sm text-gray-500">{product?.sku}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              {/* Variant */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Variant
                                </label>
                                <select
                                  value={item.variantId}
                                  onChange={(e) => updateItem(index, 'variantId', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  {product?.variants?.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.name} - {formatCurrency(v.costPrice)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Quantity */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Quantity
                                </label>
                                <div className="flex items-center border border-gray-300 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                                    className="px-3 py-2 hover:bg-gray-50"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                    className="flex-1 px-3 py-2 text-center border-0 focus:ring-0"
                                    min="1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                                    className="px-3 py-2 hover:bg-gray-50"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Cost Price */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Cost Price
                                </label>
                                <PriceInput
                                  value={item.costPrice}
                                  onChange={(value) => updateItem(index, 'costPrice', value)}
                                  placeholder="0"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              {/* Total */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Total
                                </label>
                                <div className="px-3 py-2 bg-gray-50 rounded-lg text-right font-medium">
                                  {formatCurrency(item.quantity * item.costPrice)}
                                </div>
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="mt-3">
                              <input
                                type="text"
                                value={item.notes}
                                onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                placeholder="Item notes (optional)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span>{formData.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span>{formData.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total Amount:</span>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Actions */}
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
                  
                  <div className="space-y-3">
                    <GlassButton
                      type="submit"
                      disabled={isLoading || formData.items.length === 0}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Creating...' : 'Create Purchase Order'}
                    </GlassButton>
                    
                    <GlassButton
                      type="button"
                      onClick={() => navigate('/lats/purchase-orders')}
                      variant="outline"
                      className="w-full"
                    >
                      Cancel
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </form>

        {/* Product Search Modal */}
        {showProductSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Add Product</h2>
                  <button
                    onClick={() => {
                      setShowProductSearch(false);
                      setSearchQuery('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-96">
                {filteredProducts.length === 0 && searchQuery ? (
                  <div className="p-6 text-center text-gray-500">
                    No products found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addItem(product)}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-500">{product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(product.variants?.[0]?.costPrice || 0)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {product.variants?.length || 0} variants
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewPurchaseOrderPage;
