import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { 
  Package, Edit, Save, X, AlertCircle, 
  FileText, ShoppingCart, Clock, CheckSquare, XSquare, Send, Truck,
  DollarSign, Calendar, Printer, Download, ArrowLeft, ArrowRight, 
  MapPin, Users, Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../stores/useInventoryStore';
import { PurchaseOrder } from '../types/inventory';
import ShippingTracker from '../components/shipping/ShippingTracker';
import ShippingAssignmentModal from '../components/shipping/ShippingAssignmentModal';

const PurchaseOrderDetailPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Database state management
  const { 
    getPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    receivePurchaseOrder,
    isLoading,
    error
  } = useInventoryStore();

  // Local state
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Shipping state
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingAgents] = useState([
    {
      id: 'agent-1',
      name: 'John Mwalimu',
      email: 'john@dhl.co.tz',
      phone: '+255 700 123 456',
      company: 'DHL Tanzania',
      isActive: true,
      managerId: 'manager-1',
      createdAt: '',
      updatedAt: ''
    }
  ]);
  const [shippingManagers] = useState([
    {
      id: 'manager-1',
      name: 'Sarah Kimaro',
      email: 'sarah.kimaro@dhl.co.tz',
      phone: '+255 700 987 654',
      department: 'Logistics Operations',
      agents: ['agent-1'],
      isActive: true,
      createdAt: '',
      updatedAt: ''
    }
  ]);
  const [shippingCarriers] = useState([
    {
      id: 'dhl-1',
      name: 'DHL Tanzania',
      code: 'DHL',
      trackingUrl: 'https://www.dhl.com/tz-en/home/tracking.html?tracking-id={tracking_number}',
      isActive: true,
      supportedServices: ['Express', 'Standard', 'Same Day'],
      contactInfo: { 
        phone: '+255 22 211 8000', 
        email: 'info@dhl.co.tz',
        website: 'https://www.dhl.com/tz-en'
      },
      createdAt: '',
      updatedAt: ''
    }
  ]);
  const [shippingSettings] = useState({
    id: 'settings-1',
    autoAssignAgents: true,
    defaultCarrierId: 'dhl-1',
    enableTracking: true,
    enableNotifications: true,
    notificationChannels: ['email', 'sms'] as ('email' | 'sms' | 'whatsapp')[],
    trackingUpdateInterval: 60,
    defaultShippingCost: 5000,
    autoUpdateStatus: true,
    requireSignature: false,
    enableInsurance: false,
    maxShippingCost: 50000,
    createdAt: '',
    updatedAt: ''
  });

  // Load purchase order on component mount
  useEffect(() => {
    if (id) {
      loadPurchaseOrder();
    }
  }, [id]);

  const loadPurchaseOrder = async () => {
    if (!id) return;
    
    setIsLoadingOrder(true);
    const response = await getPurchaseOrder(id);
    if (response.ok) {
      setPurchaseOrder(response.data);
    } else {
      toast.error(response.message || 'Failed to load purchase order');
      navigate('/lats/purchase-orders');
    }
    setIsLoadingOrder(false);
  };

  const handleSave = async () => {
    if (!purchaseOrder) return;
    
    setIsSaving(true);
    const response = await updatePurchaseOrder(purchaseOrder.id, {
      supplierId: purchaseOrder.supplierId,
      expectedDelivery: purchaseOrder.expectedDelivery,
      notes: purchaseOrder.notes,
      items: purchaseOrder.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        costPrice: item.costPrice,
        notes: item.notes
      }))
    });
    
    if (response.ok) {
      toast.success('Purchase order updated successfully');
      setIsEditing(false);
      await loadPurchaseOrder();
    } else {
      toast.error(response.message || 'Failed to update purchase order');
    }
    setIsSaving(false);
  };

  const handleReceive = async () => {
    if (!purchaseOrder) return;
    
    const response = await receivePurchaseOrder(purchaseOrder.id);
    if (response.ok) {
      toast.success('Purchase order received successfully');
      await loadPurchaseOrder();
    } else {
      toast.error(response.message || 'Failed to receive purchase order');
    }
  };

  const handleDelete = async () => {
    if (!purchaseOrder) return;
    
    if (window.confirm('Are you sure you want to delete this purchase order? This action cannot be undone.')) {
      const response = await deletePurchaseOrder(purchaseOrder.id);
      if (response.ok) {
        toast.success('Purchase order deleted successfully');
        navigate('/lats/purchase-orders');
      } else {
        toast.error(response.message || 'Failed to delete purchase order');
      }
    }
  };

  const handleAssignShipping = async (shippingData: any) => {
    // Simulate shipping assignment
    const mockShippingInfo = {
      id: 'shipping-' + Date.now(),
      purchaseOrderId: purchaseOrder!.id,
      carrierId: shippingData.carrierId,
      trackingNumber: shippingData.trackingNumber,
      agentId: shippingData.agentId,
      managerId: shippingData.managerId,
      status: 'pending' as const,
      estimatedDelivery: shippingData.estimatedDelivery,
      cost: shippingData.cost,
      notes: shippingData.notes,
      requireSignature: shippingData.requireSignature,
      enableInsurance: shippingData.enableInsurance,
      trackingEvents: [
        {
          id: 'event-1',
          shippingId: 'shipping-' + Date.now(),
          status: 'pending',
          description: 'Shipping assignment created',
          location: 'Origin',
          timestamp: new Date().toISOString(),
          notes: 'Awaiting carrier pickup'
        }
      ],
      carrier: shippingCarriers.find(c => c.id === shippingData.carrierId),
      agent: shippingAgents.find(a => a.id === shippingData.agentId),
      manager: shippingManagers.find(m => m.id === shippingData.managerId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update purchase order with shipping info
    setPurchaseOrder(prev => prev ? {
      ...prev,
      status: 'shipped' as any,
      shipping: mockShippingInfo
    } : null);

    setShowShippingModal(false);
    toast.success('Shipping assigned successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'confirmed': return 'text-indigo-600 bg-indigo-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'in_transit': return 'text-orange-600 bg-orange-100';
      case 'delivered': return 'text-emerald-600 bg-emerald-100';
      case 'received': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'confirmed': return <CheckSquare className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'in_transit': return <MapPin className="w-4 h-4" />;
      case 'delivered': return <Package className="w-4 h-4" />;
      case 'received': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchase order...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Purchase Order Not Found</h2>
            <p className="text-gray-600 mb-4">The purchase order you're looking for doesn't exist.</p>
            <GlassButton onClick={() => navigate('/lats/purchase-orders')}>
              Back to Purchase Orders
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <div className="container mx-auto px-4 py-6">
        <LATSBreadcrumb 
          items={[
            { label: 'LATS', href: '/lats' },
            { label: 'Purchase Orders', href: '/lats/purchase-orders' },
            { label: purchaseOrder.orderNumber, href: `/lats/purchase-orders/${purchaseOrder.id}` }
          ]} 
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{purchaseOrder.orderNumber}</h1>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(purchaseOrder.status)}`}>
                {getStatusIcon(purchaseOrder.status)}
                <span className="capitalize">{purchaseOrder.status}</span>
              </div>
              <span className="text-gray-500">Created {formatDate(purchaseOrder.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {purchaseOrder.status === 'draft' && (
              <>
                <GlassButton
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {isEditing ? 'Cancel Edit' : 'Edit'}
                </GlassButton>
                <GlassButton
                  onClick={handleDelete}
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                  Delete
                </GlassButton>
              </>
            )}
            
            {purchaseOrder.status === 'sent' && (
              <GlassButton
                onClick={handleReceive}
                className="flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Receive Order
              </GlassButton>
            )}
            
            <GlassButton
              onClick={() => navigate('/lats/purchase-orders')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </GlassButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Number
                    </label>
                    <p className="text-gray-900 font-medium">{purchaseOrder.orderNumber}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(purchaseOrder.status)}`}>
                      {getStatusIcon(purchaseOrder.status)}
                      <span className="capitalize">{purchaseOrder.status}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Created Date
                    </label>
                    <p className="text-gray-900">{formatDate(purchaseOrder.createdAt)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Updated
                    </label>
                    <p className="text-gray-900">{formatDate(purchaseOrder.updatedAt)}</p>
                  </div>
                  
                  {purchaseOrder.expectedDelivery && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Delivery
                      </label>
                      <p className="text-gray-900">{formatDate(purchaseOrder.expectedDelivery)}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <p className="text-gray-900 font-semibold text-lg">{formatCurrency(purchaseOrder.totalAmount)}</p>
                  </div>
                </div>
                
                {purchaseOrder.notes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{purchaseOrder.notes}</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Shipping Information */}
            {purchaseOrder.shipping && (
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Information</h2>
                  <ShippingTracker
                    shippingInfo={purchaseOrder.shipping}
                    onRefresh={() => {
                      // Refresh shipping data
                      toast.success('Shipping data refreshed');
                    }}
                    compact={true}
                  />
                </div>
              </GlassCard>
            )}

            {/* Order Items */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
                
                {purchaseOrder.items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No items in this order</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Variant</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Quantity</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Cost Price</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrder.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">Product {item.productId}</p>
                                <p className="text-sm text-gray-500">SKU: {item.productId}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-gray-900">Variant {item.variantId}</p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <p className="text-gray-900">{item.quantity}</p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <p className="text-gray-900">{formatCurrency(item.costPrice)}</p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <p className="font-medium text-gray-900">{formatCurrency(item.quantity * item.costPrice)}</p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <p className="text-gray-900">{item.receivedQuantity}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
                
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <GlassButton
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </GlassButton>
                      
                      <GlassButton
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel Edit
                      </GlassButton>
                    </>
                  ) : (
                    <>
                      {purchaseOrder.status === 'draft' && (
                        <GlassButton
                          onClick={() => setIsEditing(true)}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Order
                        </GlassButton>
                      )}
                      
                      {purchaseOrder.status === 'sent' && (
                        <>
                          <GlassButton
                            onClick={() => setShowShippingModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            <Truck className="w-4 h-4" />
                            Assign Shipping
                          </GlassButton>
                          <GlassButton
                            onClick={handleReceive}
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                          >
                            <CheckSquare className="w-4 h-4" />
                            Receive Order
                          </GlassButton>
                        </>
                      )}
                      
                      {(purchaseOrder.status === 'shipped' || purchaseOrder.status === 'in_transit' || purchaseOrder.status === 'delivered') && (
                        <GlassButton
                          onClick={() => navigate('/lats/shipping')}
                          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <MapPin className="w-4 h-4" />
                          View Shipping Hub
                        </GlassButton>
                      )}
                    </>
                  )}
                  
                  <GlassButton
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print Order
                  </GlassButton>
                  
                  <GlassButton
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </GlassButton>
                </div>
              </div>
            </GlassCard>

            {/* Order Summary */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-medium">{purchaseOrder.items.length}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Quantity:</span>
                    <span className="font-medium">
                      {purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Received Quantity:</span>
                    <span className="font-medium">
                      {purchaseOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(purchaseOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Shipping Assignment Modal */}
      {showShippingModal && purchaseOrder && (
        <ShippingAssignmentModal
          isOpen={showShippingModal}
          onClose={() => setShowShippingModal(false)}
          purchaseOrder={purchaseOrder}
          agents={shippingAgents}
          managers={shippingManagers}
          carriers={shippingCarriers}
          settings={shippingSettings}
          onAssignShipping={handleAssignShipping}
        />
      )}
    </div>
  );
};

export default PurchaseOrderDetailPage;
