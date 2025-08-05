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
  HelpCircle,
  ChevronDown
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
  const [showDeliveryNotes, setShowDeliveryNotes] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  // Tanzania regions array (same as CustomerForm)
  const tanzaniaRegions = [
    'Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Tanga', 'Morogoro', 
    'Iringa', 'Tabora', 'Kigoma', 'Mara', 'Kagera', 'Shinyanga', 'Singida', 
    'Rukwa', 'Ruvuma', 'Lindi', 'Mtwara', 'Pwani', 'Manyara', 'Geita', 
    'Simiyu', 'Katavi', 'Njombe', 'Songwe'
  ];

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

      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Side - Main Content */}
          <div className="col-span-8 space-y-6">
            {/* Delivery Method Selection */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Truck size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Delivery Method</h2>
                  <p className="text-sm text-gray-600">Choose how the customer will receive their order</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliveryMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setDeliveryMethod(method.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        deliveryMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${method.color} flex items-center justify-center`}>
                          <IconComponent size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{method.name}</h4>
                            {deliveryMethod === method.id && (
                              <Check size={16} className="text-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Delivery Address (only show if not pickup) */}
            {deliveryMethod !== 'pickup' && (
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                    <p className="text-sm text-gray-600">Enter delivery details</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Building size={14} className="inline mr-1" />
                        City
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCityModal(true)}
                        className="w-full p-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors"
                      >
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <span className={deliveryCity ? 'text-gray-900' : 'text-gray-500'}>
                          {deliveryCity || 'Select a city'}
                        </span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin size={14} className="inline mr-1" />
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter delivery address..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <Clock size={14} className="inline mr-1" />
                        Delivery Notes
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDeliveryNotes(!showDeliveryNotes)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showDeliveryNotes ? 'Hide' : 'Add Notes'}
                      </button>
                    </div>
                    {showDeliveryNotes && (
                      <textarea
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Any special delivery instructions..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                      />
                    )}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Pickup Information */}
            {deliveryMethod === 'pickup' && (
              <GlassCard className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Building size={20} className="text-blue-600" />
                    <h4 className="font-medium text-blue-900">Pickup Information</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Customer will pick up their order from the store location. 
                    No delivery address is required.
                  </p>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right Side - Order Summary & Complete Button */}
          <div className="col-span-4 space-y-6">
            {/* Order Summary */}
            <GlassCard className="bg-white/90">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt size={20} />
                  Order Summary
                </h2>
              </div>

              {/* Customer Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-gray-600" />
                  <span className="font-medium text-gray-900">Customer</span>
                </div>
                <p className="text-gray-900">{orderSummary.customer.name}</p>
                {orderSummary.customer.phone && (
                  <p className="text-sm text-gray-600">{orderSummary.customer.phone}</p>
                )}
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart size={16} className="text-gray-600" />
                  <span className="font-medium text-gray-900">Items</span>
                </div>
                <div className="space-y-2">
                  {orderSummary.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-600 ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(orderSummary.totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatCurrency(orderSummary.totals.tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatCurrency(orderSummary.totals.shipping)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(orderSummary.totals.total)}</span>
                </div>
              </div>
            </GlassCard>

            {/* Complete Order Button */}
            <GlassCard className="p-6">
              <GlassButton
                onClick={handleComplete}
                disabled={isProcessing}
                className="w-full bg-blue-500 text-white py-3 text-lg font-medium"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check size={20} />
                    Complete Order
                  </div>
                )}
              </GlassButton>

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

      {/* City Selection Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Building size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Select City</h2>
                  <p className="text-sm text-gray-600">Choose a delivery city</p>
                </div>
              </div>
              <button
                onClick={() => setShowCityModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* City List */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {tanzaniaRegions.map((region) => (
                  <button
                    key={region}
                    onClick={() => {
                      setDeliveryCity(region);
                      setShowCityModal(false);
                    }}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      deliveryCity === region
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{region}</span>
                      {deliveryCity === region && (
                        <Check size={16} className="text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCityModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCityModal(false)}
                  className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryOptionsPage; 