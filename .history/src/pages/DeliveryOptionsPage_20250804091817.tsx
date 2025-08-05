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
  Package as PackageIcon
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={14} className="inline mr-1" />
                      Street Address
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter delivery address..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building size={14} className="inline mr-1" />
                      City
                    </label>
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      placeholder="Enter city..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock size={14} className="inline mr-1" />
                      Delivery Notes
                    </label>
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Any special delivery instructions..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                    />
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
              <p className="text-xs text-gray-500 text-center mt-2">
                This will process the sale and return to POS
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOptionsPage; 