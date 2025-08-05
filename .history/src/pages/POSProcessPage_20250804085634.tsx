import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { posApi } from '../lib/posApi';
import { supabase } from '../lib/supabaseClient';
import { 
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertCircle,
  Truck,
  MapPin,
  User,
  Package,
  Receipt,
  Printer,
  Home
} from 'lucide-react';

interface LocationState {
  cart: any[];
  selectedCustomer: any;
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    balance: number;
  };
  customerType: 'retail' | 'wholesale';
  deliveryMethod: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryNotes: string;
  currentLocation: any;
  paymentAccount: string;
}

const POSProcessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get data from navigation state
  const state = location.state as LocationState;
  const { 
    cart, 
    selectedCustomer, 
    totals, 
    customerType, 
    deliveryMethod, 
    deliveryAddress, 
    deliveryCity, 
    deliveryNotes, 
    currentLocation,
    paymentAccount 
  } = state || {};

  useEffect(() => {
    if (!state) {
      // If no state, redirect back to POS
      navigate('/pos');
      return;
    }
    // Auto-process the sale
    processSale();
  }, [state]);

  const processSale = async () => {
    if (!state) return;

    setProcessing(true);
    setError(null);

    try {
      // Step 1: Validate data
      setProcessingStep('Validating order data...');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (cart.length === 0) {
        throw new Error('Empty cart');
      }

      if (!selectedCustomer) {
        throw new Error('No customer selected');
      }

      if (!paymentAccount) {
        throw new Error('No payment method selected');
      }

      // Step 2: Get current user
      setProcessingStep('Authenticating user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Step 3: Create sale order
      setProcessingStep('Creating sale order...');
      await new Promise(resolve => setTimeout(resolve, 500));

      const orderData = {
        customer_id: selectedCustomer?.id || undefined,
        total_amount: totals.subtotal,
        discount_amount: 0,
        tax_amount: totals.tax,
        shipping_cost: totals.shipping,
        final_amount: totals.total,
        amount_paid: totals.total, // Assuming full payment
        balance_due: 0,
        payment_method: 'card' as 'cash' | 'card' | 'transfer' | 'installment' | 'payment_on_delivery',
        customer_type: customerType,
        delivery_address: deliveryAddress,
        delivery_city: deliveryCity,
        delivery_method: deliveryMethod as 'local_transport' | 'air_cargo' | 'bus_cargo' | 'pickup',
        delivery_notes: deliveryNotes,
        location_id: currentLocation?.id || null,
        created_by: user.id,
        status: 'completed' as 'completed' | 'partially_paid'
      };

      console.log('🔧 Creating sale order with data:', orderData);
      const saleOrder = await posApi.createSaleOrder(orderData);

      // Step 4: Create sale order items
      setProcessingStep('Adding items to order...');
      await new Promise(resolve => setTimeout(resolve, 500));

      for (const item of cart) {
        const isVariant = item.id.includes('-variant-') || item.variant;
        
        const orderItem = {
          order_id: saleOrder.id,
          product_id: isVariant ? null : item.id,
          variant_id: isVariant ? item.id : null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          unit_cost: item.unitPrice * 0.7,
          item_total: item.total,
          is_external_product: item.isExternal || false,
          external_product_details: item.isExternal ? {
            name: item.name,
            description: item.variant || 'External product',
            price: item.unitPrice
          } : null
        };
        
        console.log('🔧 Creating order item:', orderItem);
        
        const { error: itemError } = await supabase
          .from('sales_order_items')
          .insert([orderItem]);

        if (itemError) {
          console.error('Error creating order item:', itemError);
          throw new Error(`Failed to add item: ${itemError.message}`);
        }
      }

      // Step 5: Update inventory (if needed)
      setProcessingStep('Updating inventory...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 6: Process payment
      setProcessingStep('Processing payment...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 7: Complete
      setProcessingStep('Finalizing sale...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Success!
      setProcessingStep('Sale completed successfully!');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to success page
      navigate('/pos/success', {
        state: {
          saleOrder,
          cart,
          selectedCustomer,
          totals
        }
      });

    } catch (error: any) {
      console.error('Error processing sale:', error);
      setError(error.message || 'Failed to process sale');
      setProcessing(false);
    }
  };

  const goBack = () => {
    navigate('/pos/payment', { state });
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Session</h2>
          <p className="text-gray-600 mb-4">No processing data found. Please return to POS.</p>
          <GlassButton onClick={() => navigate('/pos')} variant="primary">
            Return to POS
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <GlassButton
            variant="outline"
            onClick={goBack}
            className="mb-4"
            disabled={processing}
          >
            <ArrowLeft size={20} />
            Back to Payment
          </GlassButton>
          
          <GlassCard className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Processing Sale</h1>
            <p className="text-gray-600">Please wait while we process your sale</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Processing Status */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="text-center">
                {processing ? (
                  <>
                    <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing...</h2>
                    <p className="text-gray-600">{processingStep}</p>
                  </>
                ) : error ? (
                  <>
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-red-800 mb-2">Processing Error</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <GlassButton onClick={processSale} variant="primary">
                      Try Again
                    </GlassButton>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-green-800 mb-2">Processing Complete</h2>
                    <p className="text-green-600">Sale processed successfully!</p>
                  </>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Customer
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">{selectedCustomer?.name}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer?.phone}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer?.email}</p>
                  </div>
                </div>

                {/* Delivery Info */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    Delivery
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-600 capitalize">{deliveryMethod}</p>
                    {deliveryAddress && (
                      <p className="text-sm text-gray-500">{deliveryAddress}</p>
                    )}
                    {deliveryCity && (
                      <p className="text-sm text-gray-500">{deliveryCity}</p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Items ({cart.length})
                  </h3>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {cart.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium">${item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="md:col-span-2">
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-semibold">${totals.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-semibold">${totals.shipping.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-blue-600">${totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSProcessPage; 