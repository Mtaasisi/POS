import React, { useState } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  Search, 
  ShoppingCart, 
  User, 
  CreditCard, 
  Truck, 
  Plus,
  X,
  Receipt,
  Save,
  RotateCcw,
  Scan,
  Package,
  Calculator,
  Clock,
  MapPin,
  Printer,
  DollarSign,
  Package as PackageIcon,
  Settings
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isExternal?: boolean;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  type: 'retail' | 'wholesale';
}

const POSPage: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerType, setCustomerType] = useState<'retail' | 'wholesale'>('retail');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [deliveryMethod, setDeliveryMethod] = useState<string>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryCity, setDeliveryCity] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'products' | 'customers' | 'payment'>('products');

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.16;
    const shipping = deliveryMethod === 'pickup' ? 0 : 500;
    const total = subtotal + tax + shipping;
    const balance = total - amountPaid;

    return {
      subtotal,
      tax,
      shipping,
      total,
      balance
    };
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        variant: product.variant,
        quantity: 1,
        unitPrice: product.price,
        total: product.price
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
        : item
    ));
  };

  const processSale = () => {
    console.log('Processing sale:', {
      cart,
      customer: selectedCustomer,
      paymentMethod,
      amountPaid,
      deliveryMethod,
      totals: calculateTotals()
    });
  };

  const holdOrder = () => {
    console.log('Holding order');
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaid(0);
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-sm text-gray-600">Process sales and manage transactions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Time</p>
                <p className="font-semibold text-gray-900">{new Date().toLocaleTimeString()}</p>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Cart Items</p>
                <p className="font-semibold text-gray-900">{cart.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Side - Main Content */}
          <div className="col-span-8 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products by name, SKU, or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-24 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                <GlassButton variant="outline" size="sm">
                  <Scan size={16} />
                </GlassButton>
                <GlassButton variant="secondary" size="sm">
                  <Plus size={16} />
                </GlassButton>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100/50 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'products'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Package size={16} />
                  Products
                </div>
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'customers'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <User size={16} />
                  Customers
                </div>
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'payment'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CreditCard size={16} />
                  Payment
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'products' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Sample Products */}
                  {[
                    { id: '1', name: 'iPhone 13 Pro', price: 450000, stock: 5 },
                    { id: '2', name: 'Samsung Galaxy S21', price: 380000, stock: 3 },
                    { id: '3', name: 'MacBook Air M1', price: 850000, stock: 2 },
                    { id: '4', name: 'AirPods Pro', price: 120000, stock: 8 },
                    { id: '5', name: 'iPad Air', price: 320000, stock: 4 },
                    { id: '6', name: 'Apple Watch Series 7', price: 180000, stock: 6 },
                  ].map((product) => (
                    <div
                      key={product.id}
                      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {product.stock} in stock
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">₦{product.price.toLocaleString()}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <GlassButton variant="primary" size="sm" className="flex-1">
                          <Plus size={14} />
                          Add to Cart
                        </GlassButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'customers' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCustomerType('retail')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            customerType === 'retail'
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                              : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                          }`}
                        >
                          Retail
                        </button>
                        <button
                          onClick={() => setCustomerType('wholesale')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            customerType === 'wholesale'
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                              : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                          }`}
                        >
                          Wholesale
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Customer
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search by name, phone, or email..."
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <GlassButton variant="outline">
                          <Plus size={16} />
                        </GlassButton>
                      </div>
                    </div>

                    {selectedCustomer && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                            <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                          </div>
                          <GlassButton variant="danger" size="sm">
                            <X size={14} />
                          </GlassButton>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                      <div className="space-y-3">
                        {['cash', 'card', 'transfer', 'installment', 'payment_on_delivery'].map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`w-full p-4 rounded-lg border-2 transition-all ${
                              paymentMethod === method
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">{method.replace('_', ' ')}</span>
                              {paymentMethod === method && (
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Options</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Method
                          </label>
                          <select
                            value={deliveryMethod}
                            onChange={(e) => setDeliveryMethod(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pickup">Pickup</option>
                            <option value="local_transport">Local Transport</option>
                            <option value="air_cargo">Air Cargo</option>
                            <option value="bus_cargo">Bus Cargo</option>
                          </select>
                        </div>

                        {deliveryMethod !== 'pickup' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Address
                              </label>
                              <input
                                type="text"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter delivery address"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={deliveryCity}
                                onChange={(e) => setDeliveryCity(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter city"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Notes
                          </label>
                          <textarea
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            placeholder="Any special delivery instructions..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Cart & Summary */}
          <div className="col-span-4 space-y-6">
            {/* Cart */}
            <GlassCard className="bg-white/90">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Cart ({cart.length})
                </h2>
                <GlassButton 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  <X size={16} />
                  Clear
                </GlassButton>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Your cart is empty</p>
                  <p className="text-sm">Search and add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          {item.variant && (
                            <p className="text-sm text-gray-600">{item.variant}</p>
                          )}
                        </div>
                        <GlassButton
                          variant="danger"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X size={12} />
                        </GlassButton>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GlassButton
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </GlassButton>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <GlassButton
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </GlassButton>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">₦{item.unitPrice.toLocaleString()}</p>
                          <p className="font-semibold text-gray-900">₦{item.total.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Order Summary */}
            <GlassCard className="bg-white/90">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₦{totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (16%):</span>
                  <span>₦{totals.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>₦{totals.shipping.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>₦{totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Amount Paid */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  placeholder="0.00"
                />
                <div className="mt-2 flex justify-between text-sm">
                  <span>Balance:</span>
                  <span className={totals.balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                    ₦{totals.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <GlassButton
                  variant="success"
                  size="lg"
                  className="w-full"
                  onClick={processSale}
                  disabled={cart.length === 0}
                >
                  <Receipt size={18} />
                  Process Sale
                </GlassButton>
                
                <div className="grid grid-cols-2 gap-3">
                  <GlassButton
                    variant="warning"
                    size="md"
                    onClick={holdOrder}
                    disabled={cart.length === 0}
                  >
                    <Save size={16} />
                    Hold Order
                  </GlassButton>
                  
                  <GlassButton
                    variant="outline"
                    size="md"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                  >
                    <RotateCcw size={16} />
                    Cancel
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSPage; 