import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCustomers } from '../../context/CustomersContext';
import { CartItem, Customer, CustomerType, PaymentMethod, DeliveryMethod, Product, ProductVariant } from '../../types';
import { createSaleOrder, searchProductsForPOS, getProductPrice } from '../../lib/posApi';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { ShoppingCart, Users, Search, Plus, Trash2, DollarSign, CreditCard, Package, User, CheckCircle, X, Minus } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TouchPOS: React.FC = () => {
  const { currentUser } = useAuth();
  const { customers, refreshCustomers } = useCustomers();
  
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerType, setCustomerType] = useState<CustomerType>('retail');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Load customers
  useEffect(() => {
    if (customers.length === 0) {
      refreshCustomers();
    }
  }, [customers.length, refreshCustomers]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.item_total, 0);
  const finalAmount = subtotal;
  const balanceDue = finalAmount - amountPaid;

  // Search products
  const handleSearch = async (query: string) => {
    if (query.length < 2) return;
    try {
      const products = await searchProductsForPOS(query);
      setSearchResults(products);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  // Add to cart
  const addToCart = async (product: Product, variant: ProductVariant) => {
    try {
      const price = await getProductPrice(product.id, variant.id, customerType);
      const cartItem: CartItem = {
        id: `${product.id}-${variant.id}-${Date.now()}`,
        product_id: product.id,
        variant_id: variant.id,
        name: `${product.name} - ${variant.variant_name}`,
        description: product.description,
        quantity: 1,
        unit_price: price,
        unit_cost: variant.cost_price,
        item_total: price,
        is_external_product: false,
        product,
        variant
      };
      setCart(prev => [...prev, cartItem]);
      setSearchQuery('');
      setSearchResults([]);
      toast.success('Added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item');
    }
  };

  // Update quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== itemId));
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, item_total: item.unit_price * newQuantity }
        : item
    ));
  };

  // Process sale
  const processSale = async () => {
    if (!selectedCustomer || cart.length === 0) {
      toast.error('Please select customer and add items');
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        customer_id: selectedCustomer.id,
        customer_type: customerType,
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        items: cart,
        created_by: currentUser.id
      };
      await createSaleOrder(orderData);
      setCart([]);
      setSelectedCustomer(null);
      setAmountPaid(0);
      toast.success('Sale completed!');
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Failed to process sale');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">POS System</h1>
          <p className="text-xl text-gray-600">Touch-Optimized Interface</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Search & Products */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Product Search</h2>
              
              {/* Large Search Input */}
              <div className="relative mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  placeholder="Search products or scan barcode..."
                  className="w-full px-8 py-8 text-2xl border-2 border-gray-200 rounded-3xl bg-white/90 focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <Search className="w-8 h-8 text-gray-400 absolute right-8 top-1/2 transform -translate-y-1/2" />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div key={product.id} className="p-4 bg-white/90 border border-gray-200/50 rounded-2xl">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-gray-600 mb-3">{product.description}</p>
                      
                      {product.variants && product.variants.length > 0 && (
                        <div className="space-y-2">
                          {product.variants.slice(0, 3).map((variant) => (
                            <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div>
                                <span className="font-semibold text-gray-900">{variant.variant_name}</span>
                                <div className="text-sm text-gray-600">
                                  Stock: {variant.available_quantity} | Price: {formatCurrency(variant.selling_price)}
                                </div>
                              </div>
                              <GlassButton
                                onClick={() => addToCart(product, variant)}
                                disabled={variant.available_quantity === 0}
                                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold"
                              >
                                <Plus className="w-6 h-6 mr-2" />
                                Add
                              </GlassButton>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Cart */}
            <GlassCard className="p-6 mt-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h2>
              
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-2xl font-bold text-gray-600">Cart is Empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="p-4 bg-white/90 border border-gray-200/50 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                          <div className="text-lg text-gray-600">
                            {formatCurrency(item.unit_price)} per unit
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {/* Large Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <GlassButton
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-12 h-12 text-2xl font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl"
                            >
                              -
                            </GlassButton>
                            
                            <span className="text-3xl font-bold text-gray-900 min-w-[4rem] text-center">
                              {item.quantity}
                            </span>
                            
                            <GlassButton
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-12 h-12 text-2xl font-bold bg-green-500 hover:bg-green-600 text-white rounded-xl"
                            >
                              +
                            </GlassButton>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {formatCurrency(item.item_total)}
                            </div>
                          </div>
                          
                          <GlassButton
                            onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                            className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl"
                          >
                            <Trash2 className="w-6 h-6" />
                          </GlassButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right - Customer & Payment */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 sticky top-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Customer & Payment</h2>
              
              {/* Customer Selection */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Select Customer</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {customers.slice(0, 10).map((customer) => (
                    <GlassButton
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      variant={selectedCustomer?.id === customer.id ? 'default' : 'outline'}
                      className="w-full p-4 text-left"
                    >
                      <div>
                        <div className="font-bold">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.phone}</div>
                      </div>
                    </GlassButton>
                  ))}
                </div>
              </div>

              {/* Customer Type */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  <GlassButton
                    variant={customerType === 'retail' ? 'default' : 'outline'}
                    onClick={() => setCustomerType('retail')}
                    className="p-4 text-lg font-bold"
                  >
                    Retail
                  </GlassButton>
                  <GlassButton
                    variant={customerType === 'wholesale' ? 'default' : 'outline'}
                    onClick={() => setCustomerType('wholesale')}
                    className="p-4 text-lg font-bold"
                  >
                    Wholesale
                  </GlassButton>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'cash', label: 'Cash', icon: DollarSign },
                    { key: 'card', label: 'Card', icon: CreditCard }
                  ].map((method) => (
                    <GlassButton
                      key={method.key}
                      variant={paymentMethod === method.key ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod(method.key as PaymentMethod)}
                      className="p-4 text-lg font-bold"
                    >
                      <method.icon className="w-6 h-6 mr-2" />
                      {method.label}
                    </GlassButton>
                  ))}
                </div>
              </div>

              {/* Amount Paid */}
              <div className="mb-6">
                <label className="block text-xl font-bold text-gray-900 mb-4">Amount Paid</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-6 py-6 text-2xl border-2 border-gray-200 rounded-3xl bg-white/90 focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter amount..."
                />
              </div>

              {/* Order Summary */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold text-2xl">{formatCurrency(finalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Balance Due:</span>
                    <span className={`font-bold text-xl ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Process Sale Button */}
              <GlassButton
                onClick={processSale}
                disabled={loading || cart.length === 0 || !selectedCustomer}
                className="w-full p-6 text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-8 h-8 mr-3" />
                    Process Sale
                  </>
                )}
              </GlassButton>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouchPOS; 