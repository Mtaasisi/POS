import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import DarkModeToggle from '../components/pos/DarkModeToggle';
import { 
  Truck, 
  MapPin, 
  Building, 
  ArrowLeft,
  Check,
  Clock,
  Package,
  Car,
  Receipt,
  User,
  ShoppingCart,
  X,
  Package as PackageIcon,
  Save,
  RotateCcw,
  Settings,
  Printer,
  DollarSign,
  Search,
  TrendingUp,
  CreditCard as CreditCardIcon,
  RotateCcw as RotateCcwIcon,
  Crown,
  Gift,
  HelpCircle
} from 'lucide-react';

interface DeliveryData {
  method: string;
  address: string;
  city: string;
  notes: string;
}

interface OrderSummary {
  customer: {
    name: string;
    phone?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
}

const DeliveryOptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Get order data from navigation state
  const orderData = location.state?.orderData as any;
  const orderSummary: OrderSummary = orderData?.summary || {
    customer: { name: 'Customer', phone: '' },
    items: [],
    totals: { subtotal: 0, tax: 0, shipping: 0, total: 0 }
  };

  const deliveryMethods = [
    {
      id: 'pickup',
      name: 'Pickup',
      icon: Building,
      description: 'Customer picks up from store',
      color: 'bg-blue-500'
    },
    {
      id: 'local_transport',
      name: 'Local Transport',
      icon: Car,
      description: 'Local delivery service',
      color: 'bg-green-500'
    },
    {
      id: 'air_cargo',
      name: 'Air Cargo',
      icon: Package,
      description: 'Fast air delivery',
      color: 'bg-purple-500'
    },
    {
      id: 'bus_cargo',
      name: 'Bus Cargo',
      icon: Truck,
      description: 'Bus transport delivery',
      color: 'bg-orange-500'
    }
  ];

  const handleBack = () => {
    navigate('/pos', { 
      state: { 
        returnToPayment: true,
        deliveryData: {
          method: deliveryMethod,
          address: deliveryAddress,
          city: deliveryCity,
          notes: deliveryNotes
        }
      }
    });
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate back to POS with completion data
      navigate('/pos', { 
        state: { 
          orderCompleted: true,
          deliveryData: {
            method: deliveryMethod,
            address: deliveryAddress,
            city: deliveryCity,
            notes: deliveryNotes
          }
        }
      });
    } catch (error) {
      console.error('Error completing order:', error);
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Delivery-specific actions
  const handlePrintDeliveryNote = () => {
    console.log('Printing delivery note...');
    // TODO: Implement delivery note printing
  };

  const handleSaveDeliveryTemplate = () => {
    console.log('Saving delivery template...');
    // TODO: Implement template saving
  };

  const handleDeliverySettings = () => {
    console.log('Opening delivery settings...');
    // TODO: Implement delivery settings
  };

  const handleDeliveryHelp = () => {
    console.log('Opening delivery help...');
    // TODO: Implement help system
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
      
      {/* Header - Same as POS */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Options</h1>
              <p className="text-sm text-gray-600">Configure delivery settings for this order</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Time</p>
                <p className="font-semibold text-gray-900">{new Date().toLocaleTimeString()}</p>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Order Items</p>
                <p className="font-semibold text-gray-900">{orderSummary.items.length}</p>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              
              {/* Customer Display */}
              <div className="flex items-center gap-2 text-sm">
                <User size={16} className="text-blue-600" />
                <span className="font-medium">{orderSummary.customer.name}</span>
              </div>
              
              <div className="w-px h-8 bg-gray-300"></div>
              
              {/* Dark Mode Toggle */}
              <DarkModeToggle
                isDark={isDarkMode}
                onToggle={() => setIsDarkMode(!isDarkMode)}
              />
              
              <GlassButton
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to POS</span>
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 pb-20">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
          {/* Left Side - Main Content */}
          <div className="col-span-8 space-y-4 overflow-y-auto">
            {/* Delivery Method Selection */}
            <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Truck size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Delivery Method</h2>
                  <p className="text-sm text-gray-600">Choose how the customer will receive their order</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {deliveryMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setDeliveryMethod(method.id)}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        deliveryMethod === method.id
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className={`w-16 h-16 rounded-full ${method.color} flex items-center justify-center shadow-lg`}>
                          <IconComponent size={28} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-1">{method.name}</h4>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                        {deliveryMethod === method.id && (
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <Check size={20} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Delivery Address (only show if not pickup) */}
            {deliveryMethod !== 'pickup' && (
              <GlassCard className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Delivery Address</h2>
                    <p className="text-sm text-gray-600">Enter delivery details</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        <MapPin size={16} className="inline mr-2" />
                        Street Address
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter delivery address..."
                        className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm transition-all"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        <Building size={16} className="inline mr-2" />
                        City
                      </label>
                      <input
                        type="text"
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        placeholder="Enter city..."
                        className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      <Clock size={16} className="inline mr-2" />
                      Delivery Notes
                    </label>
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Any special delivery instructions..."
                      className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm transition-all"
                      rows={2}
                    />
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Pickup Information */}
            {deliveryMethod === 'pickup' && (
              <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <Building size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pickup Information</h2>
                    <p className="text-sm text-gray-600">Customer pickup details</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-300 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Building size={24} className="text-blue-600" />
                    <h4 className="font-bold text-blue-900 text-xl">Store Pickup</h4>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Customer will pick up their order from the store location. 
                    No delivery address is required. Store hours and pickup instructions 
                    will be provided to the customer.
                  </p>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right Side - Order Summary & Complete Button */}
          <div className="col-span-4 space-y-4">
            {/* Order Summary */}
            <GlassCard className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Receipt size={24} className="text-purple-600" />
                  Order Summary
                </h2>
              </div>

              {/* Customer Info */}
              <div className="mb-6 p-4 bg-gradient-to-r from-white to-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <User size={20} className="text-purple-600" />
                  <span className="font-bold text-gray-900 text-lg">Customer</span>
                </div>
                <p className="text-gray-900 font-semibold text-xl">{orderSummary.customer.name}</p>
                {orderSummary.customer.phone && (
                  <p className="text-sm text-gray-600">📞 {orderSummary.customer.phone}</p>
                )}
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart size={20} className="text-purple-600" />
                  <span className="font-bold text-gray-900 text-lg">Items ({orderSummary.items.length})</span>
                </div>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {orderSummary.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-purple-100">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 text-sm">{item.name}</span>
                        <span className="text-gray-600 ml-2 text-sm">× {item.quantity}</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t-2 border-purple-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(orderSummary.totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Tax</span>
                  <span className="font-semibold">{formatCurrency(orderSummary.totals.tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Shipping</span>
                  <span className="font-semibold">{formatCurrency(orderSummary.totals.shipping)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t-2 border-purple-300 pt-3 text-purple-900">
                  <span>Total</span>
                  <span>{formatCurrency(orderSummary.totals.total)}</span>
                </div>
              </div>
            </GlassCard>

            {/* Complete Order Button */}
            <GlassCard className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
              <GlassButton
                onClick={handleComplete}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xl">Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Check size={28} />
                    <span className="text-xl">Complete Order</span>
                  </div>
                )}
              </GlassButton>
              <p className="text-sm text-gray-600 text-center mt-4 font-medium">
                This will process the sale and return to POS
              </p>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons - Same as POS */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/90 to-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-lg"></div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            {/* Left Side - Utility Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintDeliveryNote}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <Printer size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Print Delivery Note
                </span>
              </button>
              
              <button
                onClick={handleSaveDeliveryTemplate}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <Save size={18} className="text-gray-600 group-hover:text-green-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Save Template
                </span>
              </button>
              
              <button
                onClick={handleBack}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <ArrowLeft size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Back to POS
                </span>
              </button>
            </div>

            {/* Center - Primary Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleComplete}
                disabled={isProcessing}
                className="group relative p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105"
              >
                <Check size={24} />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Complete Order
                </span>
              </button>
            </div>

            {/* Right Side - Settings */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeliverySettings}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <Settings size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Delivery Settings
                </span>
              </button>
              
              <button
                onClick={handleDeliveryHelp}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <HelpCircle size={18} className="text-gray-600 group-hover:text-purple-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Help
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOptionsPage; 