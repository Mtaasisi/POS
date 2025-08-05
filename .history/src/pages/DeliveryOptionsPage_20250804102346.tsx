import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import DarkModeToggle from '../components/pos/DarkModeToggle';
import { SMSService } from '../services/smsService';
import { WhatsAppService } from '../services/whatsappService';
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
  ChevronDown,
  Home,
  FileText,
  Bike,
  Plane,
  Power,
  Bell,
  Wifi,
  Battery,
  Cloud,
  Activity,
  MessageSquare,
  Smartphone,
  Shield,
  Download
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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Initialize services
  const smsService = new SMSService();
  const whatsappService = new WhatsAppService();

  // Tanzania regions array (same as CustomerForm)
  const tanzaniaRegions = [
    // Dar es Salaam Areas
    'Sinza', 'Mwenge', 'Mikocheni', 'Masaki', 'Oysterbay', 'Kariakoo', 'Posta', 
    'Kinondoni', 'Magomeni', 'Tegeta', 'Mlimani City', 'Slipway', 'City Mall', 
    'Shoppers Plaza', 'Coco Beach', 'Kunduchi', 'White Sands', 'Ubungo', 
    'Makumbusho', 'Tabata', 'Kimara', 'Goba', 'Kijitonyama', 'Tandika', 
    'Buguruni', 'Ilala', 'Vingunguti', 'Kurasini', 'Mbagala', 'Temeke', 
    'Chang\'ombe', 'Segerea', 'Kigamboni', 'Ferry', 'Masaki Peninsula', 
    'Victoria', 'Msasani', 'Msimbazi Center', 'Morocco', 'Makumbusho Museum',
    // Arusha Areas
    'Njiro', 'Sakina', 'Kimandolu', 'Sanawari', 'Moshono', 'Themi', 'Ilboru', 
    'Sekei', 'Unga Limited', 'Kijenge', 'Olasiti', 'Sombetini', 'Ngarenaro', 
    'Muriet', 'Elerai', 'Lemala', 'Tengeru', 'Kisongo', 'Mateves', 'Moivo', 
    'Engutoto', 'Kaloleni', 'Olmatejoo', 'Mianzini', 'Majengo',
    // Arusha Notable Places
    'Arusha Clock Tower', 'Arusha International Conference Centre (AICC)', 
    'Maasai Market', 'Arusha Declaration Museum', 'Cultural Heritage Centre', 
    'Njiro Complex', 'Sable Square', 'Themi Living Garden', 'Arusha Airport', 
    'Meru Posta',
    // Other Major Cities
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
      name: 'Bodaboda',
      icon: Bike,
      description: 'Local motorcycle delivery',
      color: 'bg-green-500'
    },
    {
      id: 'air_cargo',
      name: 'Air Cargo',
      icon: Plane,
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
      
      // Show completion modal instead of navigating back
      setShowCompletionModal(true);
      setIsProcessing(false);
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

  // Print receipt function
  const handlePrintReceipt = () => {
    const printContent = generateReceiptContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Print warranty function
  const handlePrintWarranty = () => {
    const warrantyContent = generateWarrantyContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(warrantyContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Generate receipt content
  const generateReceiptContent = () => {
    const orderNumber = `ORD-${Date.now()}`;
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    return `
      <html>
        <head>
          <title>Sales Receipt</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white; 
            }
            .receipt { 
              border: 2px solid #000; 
              padding: 20px; 
              max-width: 400px; 
              margin: 0 auto; 
              background: white;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .divider { 
              border-top: 1px solid #000; 
              margin: 15px 0; 
            }
            .row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px; 
            }
            .footer { 
              text-align: center; 
              font-size: 12px; 
              margin-top: 20px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .items { margin: 15px 0; }
            .item { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px; 
              font-size: 14px;
            }
            .total { 
              font-weight: bold; 
              font-size: 16px; 
              border-top: 2px solid #000; 
              padding-top: 10px; 
            }
            .delivery-info {
              background: #f0f0f0;
              padding: 10px;
              margin: 10px 0;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>INAUZWA STORE</h2>
              <p>Sales Receipt</p>
              <p style="font-size: 12px;">Order: ${orderNumber}</p>
              <p style="font-size: 12px;">Date: ${currentDate} ${currentTime}</p>
            </div>
            
            <div class="row">
              <span><strong>Customer:</strong></span>
              <span>${orderSummary.customer.name}</span>
            </div>
            
            ${orderSummary.customer.phone ? `
            <div class="row">
              <span><strong>Phone:</strong></span>
              <span>${orderSummary.customer.phone}</span>
            </div>
            ` : ''}
            
            <div class="delivery-info">
              <div class="row">
                <span><strong>Delivery Method:</strong></span>
                <span>${deliveryMethod === 'pickup' ? 'Store Pickup' : 
                  deliveryMethod === 'local_transport' ? 'Bodaboda' :
                  deliveryMethod === 'air_cargo' ? 'Air Cargo' : 'Bus Cargo'}</span>
              </div>
              ${deliveryMethod !== 'pickup' ? `
              <div class="row">
                <span><strong>Address:</strong></span>
                <span>${deliveryAddress || 'N/A'}</span>
              </div>
              ${deliveryCity ? `
              <div class="row">
                <span><strong>City:</strong></span>
                <span>${deliveryCity}</span>
              </div>
              ` : ''}
              ` : ''}
            </div>
            
            <div class="divider"></div>
            
            <div class="items">
              <div style="font-weight: bold; margin-bottom: 10px;">ITEMS:</div>
              ${orderSummary.items.map(item => `
                <div class="item">
                  <span>${item.name} × ${item.quantity}</span>
                  <span>${formatCurrency(item.total)}</span>
                </div>
              `).join('')}
            </div>
            
            <div class="divider"></div>
            
            <div class="row">
              <span>Subtotal:</span>
              <span>${formatCurrency(orderSummary.totals.subtotal)}</span>
            </div>
            <div class="row">
              <span>Tax:</span>
              <span>${formatCurrency(orderSummary.totals.tax)}</span>
            </div>
            <div class="row">
              <span>Shipping:</span>
              <span>${formatCurrency(orderSummary.totals.shipping)}</span>
            </div>
            <div class="row total">
              <span>TOTAL:</span>
              <span>${formatCurrency(orderSummary.totals.total)}</span>
            </div>
            
            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>Please keep this receipt for warranty purposes.</p>
              <p>Contact: +255 XXX XXX XXX</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Generate warranty content
  const generateWarrantyContent = () => {
    const warrantyNumber = `WAR-${Date.now()}`;
    const currentDate = new Date().toLocaleDateString();
    const warrantyEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(); // 1 year
    
    return `
      <html>
        <head>
          <title>Product Warranty</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white; 
            }
            .warranty { 
              border: 2px solid #000; 
              padding: 20px; 
              max-width: 400px; 
              margin: 0 auto; 
              background: white;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .divider { 
              border-top: 1px solid #000; 
              margin: 15px 0; 
            }
            .row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px; 
            }
            .footer { 
              text-align: center; 
              font-size: 12px; 
              margin-top: 20px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .terms {
              font-size: 11px;
              margin: 15px 0;
              padding: 10px;
              background: #f9f9f9;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="warranty">
            <div class="header">
              <h2>INAUZWA STORE</h2>
              <p>Product Warranty</p>
              <p style="font-size: 12px;">Warranty #: ${warrantyNumber}</p>
            </div>
            
            <div class="row">
              <span><strong>Customer:</strong></span>
              <span>${orderSummary.customer.name}</span>
            </div>
            
            ${orderSummary.customer.phone ? `
            <div class="row">
              <span><strong>Phone:</strong></span>
              <span>${orderSummary.customer.phone}</span>
            </div>
            ` : ''}
            
            <div class="row">
              <span><strong>Purchase Date:</strong></span>
              <span>${currentDate}</span>
            </div>
            
            <div class="row">
              <span><strong>Warranty Valid Until:</strong></span>
              <span>${warrantyEndDate}</span>
            </div>
            
            <div class="divider"></div>
            
            <div style="margin: 15px 0;">
              <div style="font-weight: bold; margin-bottom: 10px;">COVERED ITEMS:</div>
              ${orderSummary.items.map(item => `
                <div class="row">
                  <span>${item.name}</span>
                  <span>1 Year Warranty</span>
                </div>
              `).join('')}
            </div>
            
            <div class="terms">
              <strong>WARRANTY TERMS:</strong><br>
              • 1-year manufacturer warranty on all products<br>
              • Covers defects in materials and workmanship<br>
              • Does not cover damage from misuse or accidents<br>
              • Original receipt required for warranty service<br>
              • Contact store for warranty claims
            </div>
            
            <div class="footer">
              <p>Keep this warranty with your receipt</p>
              <p>Contact: +255 XXX XXX XXX</p>
              <p>Store: INAUZWA STORE</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Send WhatsApp message
  const handleSendWhatsApp = async () => {
    if (!orderSummary.customer.phone) {
      setMessageStatus({
        type: 'error',
        message: 'Customer phone number not available'
      });
      return;
    }

    setIsSendingMessage(true);
    setMessageStatus({
      type: 'info',
      message: 'Sending WhatsApp message...'
    });

    try {
      const message = generateWhatsAppMessage();
      const phoneNumber = orderSummary.customer.phone;
      
      // Format phone number for WhatsApp (remove + if present, add country code if needed)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : 
                           phoneNumber.startsWith('255') ? phoneNumber : 
                           `255${phoneNumber.replace(/^0/, '')}`;
      
      const result = await whatsappService.sendMessage(
        `${formattedPhone}@c.us`, // WhatsApp chat ID format
        message,
        'text'
      );

      if (result.success) {
        setMessageStatus({
          type: 'success',
          message: 'WhatsApp message sent successfully!'
        });
      } else {
        setMessageStatus({
          type: 'error',
          message: `Failed to send WhatsApp: ${result.error}`
        });
      }
    } catch (error) {
      setMessageStatus({
        type: 'error',
        message: `Error sending WhatsApp: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Send SMS message
  const handleSendSMS = async () => {
    if (!orderSummary.customer.phone) {
      setMessageStatus({
        type: 'error',
        message: 'Customer phone number not available'
      });
      return;
    }

    setIsSendingMessage(true);
    setMessageStatus({
      type: 'info',
      message: 'Sending SMS...'
    });

    try {
      const message = generateSMSMessage();
      const result = await smsService.sendSMS(
        orderSummary.customer.phone,
        message
      );

      if (result.success) {
        setMessageStatus({
          type: 'success',
          message: 'SMS sent successfully!'
        });
      } else {
        setMessageStatus({
          type: 'error',
          message: `Failed to send SMS: ${result.error}`
        });
      }
    } catch (error) {
      setMessageStatus({
        type: 'error',
        message: `Error sending SMS: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Generate WhatsApp message content
  const generateWhatsAppMessage = () => {
    const orderNumber = `ORD-${Date.now()}`;
    const currentDate = new Date().toLocaleDateString();
    
    return `🛍️ *INAUZWA STORE - Order Confirmation*

📋 *Order Details:*
Order #: ${orderNumber}
Date: ${currentDate}
Customer: ${orderSummary.customer.name}

📦 *Items Purchased:*
${orderSummary.items.map(item => `• ${item.name} × ${item.quantity} - ${formatCurrency(item.total)}`).join('\n')}

💰 *Total: ${formatCurrency(orderSummary.totals.total)}*

🚚 *Delivery:*
Method: ${deliveryMethod === 'pickup' ? 'Store Pickup' : 
          deliveryMethod === 'local_transport' ? 'Bodaboda' :
          deliveryMethod === 'air_cargo' ? 'Air Cargo' : 'Bus Cargo'}
${deliveryMethod !== 'pickup' ? `Address: ${deliveryAddress || 'N/A'}` : ''}
${deliveryCity ? `City: ${deliveryCity}` : ''}

✅ *Warranty:*
All products come with 1-year warranty. Keep your receipt for warranty service.

📞 Contact: +255 XXX XXX XXX
🏪 Store: INAUZWA STORE

Thank you for your purchase! 🙏`;
  };

  // Generate SMS message content
  const generateSMSMessage = () => {
    const orderNumber = `ORD-${Date.now()}`;
    const currentDate = new Date().toLocaleDateString();
    
    return `INAUZWA STORE - Order Confirmation
Order: ${orderNumber}
Date: ${currentDate}
Customer: ${orderSummary.customer.name}
Total: ${formatCurrency(orderSummary.totals.total)}
Delivery: ${deliveryMethod === 'pickup' ? 'Store Pickup' : 
           deliveryMethod === 'local_transport' ? 'Bodaboda' :
           deliveryMethod === 'air_cargo' ? 'Air Cargo' : 'Bus Cargo'}
Warranty: 1 year included
Contact: +255 XXX XXX XXX
Thank you!`;
  };

  // Navigate back to POS after completion
  const handleFinishOrder = () => {
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
      
      {/* Enhanced Header - Same as POS */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Delivery Options</h1>
                <p className="text-sm text-gray-600">Configure delivery method and address</p>
              </div>
            </div>
            {/* Center - Order Summary */}
            <div className="flex-1 max-w-md mx-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Order Items</p>
                <p className="font-semibold text-gray-900">{orderSummary.items.length}</p>
              </div>
            </div>

            {/* Right Side - Icon-Only Display */}
            <div className="flex items-center gap-2">
              {/* Real-time Clock */}
              <div className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Clock size={16} className="text-blue-600" />
                <span className="text-sm font-medium">{new Date().toLocaleTimeString()}</span>
              </div>

              {/* Order Total */}
              <div className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <DollarSign size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-600">${orderSummary.totals.total.toFixed(0)}</span>
              </div>

              {/* Customer Display */}
              <div className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <User size={16} className="text-blue-600" />
                <span className="text-sm font-medium hidden sm:inline">{orderSummary.customer.name.split(' ')[0]}</span>
              </div>

              {/* Online Status */}
              <div className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <Wifi size={16} className="text-green-600" />
              </div>

              {/* Dark Mode Toggle */}
              <DarkModeToggle
                isDark={isDarkMode}
                onToggle={() => setIsDarkMode(!isDarkMode)}
              />

              {/* Back Button */}
              <GlassButton
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="p-2"
              >
                <ArrowLeft size={16} />
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
                  {/* City field - only show for non-Bodaboda delivery methods */}
                  {deliveryMethod !== 'local_transport' && (
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
                          <Home size={14} className="inline mr-1" />
                          Street Address
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Enter delivery address..."
                            className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Street Address only - for Bodaboda */}
                  {deliveryMethod === 'local_transport' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Home size={14} className="inline mr-1" />
                        Street Address
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Enter delivery address..."
                          className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      </div>
                    </div>
                  )}

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
                      <div className="relative">
                        <textarea
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          placeholder="Any special delivery instructions..."
                          className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={2}
                        />
                        <FileText className="absolute left-4 top-4 text-gray-500" size={18} />
                      </div>
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
                className="group relative p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 flex items-center gap-2"
              >
                <Check size={20} />
                <span className="font-medium">Complete Order</span>
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
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {tanzaniaRegions.map((region) => (
                  <button
                    key={region}
                    onClick={() => {
                      setDeliveryCity(region);
                      setShowCityModal(false);
                    }}
                    className={`p-3 text-left rounded-lg border-2 transition-all duration-200 ${
                      deliveryCity === region
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building size={16} className={`${
                        deliveryCity === region ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      <span className="font-medium text-sm flex-1">{region}</span>
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

      {/* Order Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Check size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Order Completed!</h2>
                  <p className="text-sm text-gray-600">Print receipt, warranty, or send to customer</p>
                </div>
              </div>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Message Status */}
              {messageStatus && (
                <div className={`mb-4 p-3 rounded-lg ${
                  messageStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                  messageStatus.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {messageStatus.type === 'success' && <Check size={16} className="text-green-600" />}
                    {messageStatus.type === 'error' && <X size={16} className="text-red-600" />}
                    {messageStatus.type === 'info' && <Clock size={16} className="text-blue-600" />}
                    <span className="text-sm font-medium">{messageStatus.message}</span>
                  </div>
                </div>
              )}

              {/* Print Options */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Printer size={20} className="text-blue-600" />
                  Print Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handlePrintReceipt}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <Receipt size={20} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Print Receipt</h4>
                        <p className="text-sm text-gray-600">Sales receipt with order details</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handlePrintWarranty}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <Shield size={20} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Print Warranty</h4>
                        <p className="text-sm text-gray-600">1-year warranty certificate</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Messaging Options */}
              {orderSummary.customer.phone && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare size={20} className="text-green-600" />
                    Send to Customer
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleSendWhatsApp}
                      disabled={isSendingMessage}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                          {isSendingMessage ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <MessageSquare size={20} className="text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Send WhatsApp</h4>
                          <p className="text-sm text-gray-600">Order confirmation via WhatsApp</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleSendSMS}
                      disabled={isSendingMessage}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                          {isSendingMessage ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Smartphone size={20} className="text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Send SMS</h4>
                          <p className="text-sm text-gray-600">Order confirmation via SMS</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <p className="font-medium">{orderSummary.customer.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Items:</span>
                    <p className="font-medium">{orderSummary.items.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <p className="font-medium">{formatCurrency(orderSummary.totals.total)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Delivery:</span>
                    <p className="font-medium">
                      {deliveryMethod === 'pickup' ? 'Store Pickup' : 
                       deliveryMethod === 'local_transport' ? 'Bodaboda' :
                       deliveryMethod === 'air_cargo' ? 'Air Cargo' : 'Bus Cargo'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleFinishOrder}
                  className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Finish Order
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