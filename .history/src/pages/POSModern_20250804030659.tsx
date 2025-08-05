import React, { useState } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { Search, ShoppingCart, User, CreditCard, Plus, X, Receipt, Save, RotateCcw, CheckCircle, HelpCircle } from 'lucide-react';

const POSModern: React.FC = () => {
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'products' | 'customer' | 'payment'>('products');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const products = [
    { id: '1', name: 'iPhone 13', price: 1500000, stock: 5 },
    { id: '2', name: 'Samsung Galaxy', price: 1200000, stock: 3 },
    { id: '3', name: 'MacBook Pro', price: 2500000, stock: 2 },
  ];

  const addToCart = (product: any) => {
    setCart([...cart, { ...product, quantity: 1, total: product.price }]);
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.16;
    return { subtotal, tax, total: subtotal + tax };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header with Stepper */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Modern POS System</h1>
            <GlassButton variant="outline" size="sm">
              <X size={16} />
              Exit
            </GlassButton>
          </div>

          {/* Modern Stepper */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-8">
              {[
                { key: 'products', label: 'Products', icon: ShoppingCart },
                { key: 'customer', label: 'Customer', icon: User },
                { key: 'payment', label: 'Payment', icon: CreditCard }
              ].map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.key;

                return (
                  <div key={step.key} className="flex items-center">
                    <button
                      onClick={() => setCurrentStep(step.key as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-blue-500 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="font-medium">{step.label}</span>
                    </button>
                    {index < 2 && (
                      <div className="w-8 h-0.5 mx-4 bg-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Products */}
          <div className="col-span-5 space-y-4">
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Products</h2>
                <GlassButton variant="outline" size="sm">
                  <RotateCcw size={14} />
                </GlassButton>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="🔍 Search products, scan barcode..."
                  className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Products Grid */}
              <div className="h-[calc(100vh-400px)] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product) => (
                    <GlassCard
                      key={product.id}
                      className="hover:shadow-lg transition-all cursor-pointer group p-4"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {product.name}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          {product.stock} in stock
                        </span>
                      </div>
                      
                      <p className="text-lg font-bold text-blue-600 mb-2">
                        Tsh{product.price.toLocaleString()}
                      </p>

                      <GlassButton 
                        variant="primary" 
                        size="sm" 
                        className="w-full"
                      >
                        <Plus size={14} />
                        Add to Cart
                      </GlassButton>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Center Panel - Cart */}
          <div className="col-span-4 space-y-4">
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Cart ({cart.length})
                </h2>
                <GlassButton 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCart([])}
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
                <div className="space-y-3 h-[calc(100vh-400px)] overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
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
                          <GlassButton variant="outline" size="sm">-</GlassButton>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <GlassButton variant="outline" size="sm">+</GlassButton>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Tsh{item.price.toLocaleString()}</p>
                          <p className="font-semibold text-gray-900">Tsh{item.total.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right Panel - Customer & Payment */}
          <div className="col-span-3 space-y-4">
            {/* Customer Section */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
                <GlassButton variant="outline" size="sm">
                  <User size={14} />
                </GlassButton>
              </div>

              {selectedCustomer ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User size={18} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{selectedCustomer.name}</h3>
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    </div>
                    <GlassButton variant="danger" size="sm">
                      <X size={14} />
                    </GlassButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Payment Section */}
            {selectedCustomer && cart.length > 0 && (
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
                  <span className="text-sm text-gray-500">Step 3 of 4</span>
                </div>

                <div className="space-y-4">
                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all">
                        <div className="text-center">
                          <span className="font-medium text-gray-900 text-sm block">Cash</span>
                          <p className="text-xs text-gray-500">$500,000</p>
                        </div>
                      </button>
                      <button className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all">
                        <div className="text-center">
                          <span className="font-medium text-gray-900 text-sm block">Card</span>
                          <p className="text-xs text-gray-500">$1,000,000</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>Tsh{totals.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (16%):</span>
                        <span>Tsh{totals.tax.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>Tsh{totals.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GlassButton variant="warning" size="lg" disabled={cart.length === 0}>
                <Save size={20} />
                Hold Order
              </GlassButton>
              
              <GlassButton variant="outline" size="lg" onClick={() => setCart([])} disabled={cart.length === 0}>
                <RotateCcw size={20} />
                Clear Cart
              </GlassButton>
            </div>

            <div className="flex items-center gap-3">
              <GlassButton variant="outline" size="lg" disabled={cart.length === 0}>
                <Receipt size={20} />
                Print
              </GlassButton>
              
              <GlassButton
                variant="success"
                size="lg"
                disabled={cart.length === 0 || !selectedCustomer}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Receipt size={24} />
                Process Sale
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Shortcuts Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <GlassButton
          variant="primary"
          size="lg"
          className="rounded-full shadow-lg"
          onClick={() => setShowShortcuts(true)}
        >
          <HelpCircle size={28} />
        </GlassButton>
      </div>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setShowShortcuts(false)}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <HelpCircle size={24} /> Keyboard Shortcuts
            </h2>
            <ul className="space-y-2 text-lg">
              <li><b>Ctrl+1</b>: Products tab</li>
              <li><b>Ctrl+2</b>: Customers tab</li>
              <li><b>Ctrl+3</b>: Payment tab</li>
              <li><b>Ctrl+Enter</b>: Process Sale</li>
              <li><b>Ctrl+H</b>: Hold Order</li>
              <li><b>Ctrl+C</b>: Clear Cart</li>
              <li><b>F1</b>: Show this help</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSModern; 