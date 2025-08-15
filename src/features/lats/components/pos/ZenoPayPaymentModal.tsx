import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { GlassCard, GlassButton, GlassBadge } from '../../ui';
import { CartItem, Sale } from '../../types/pos';

interface ZenoPayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (sale: Sale) => void;
  cartItems: CartItem[];
  total: number;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface ZenoPayOrder {
  order_id: string;
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string;
  amount: number;
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  reference?: string;
  created_at?: string;
  updated_at?: string;
}

const ZenoPayPaymentModal: React.FC<ZenoPayPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  cartItems,
  total,
  customer
}) => {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<ZenoPayOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Validate customer data
  const isCustomerValid = customer && customer.email && customer.phone;

  // Create ZenoPay order
  const createZenoPayOrder = async () => {
    if (!isCustomerValid) {
      setError('Customer information is required for mobile money payment');
      return;
    }

    setIsCreatingOrder(true);
    setError(null);
    setStatusMessage('Creating payment order...');

    try {
      const orderData = {
        buyer_email: customer!.email,
        buyer_name: customer!.name,
        buyer_phone: customer!.phone,
        amount: total,
        metadata: {
          cart_items: cartItems.map(item => ({
            product_id: item.productId,
            variant_id: item.variantId,
            product_name: item.productName,
            variant_name: item.variantName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice
          })),
          customer_id: customer!.id,
          pos_session_id: `pos_${Date.now()}`,
          order_type: 'pos_sale'
        }
      };

      const response = await fetch('/zenopay-create-order.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        setCurrentOrder({
          order_id: result.order_id,
          buyer_email: customer!.email,
          buyer_name: customer!.name,
          buyer_phone: customer!.phone,
          amount: total,
          payment_status: 'PENDING'
        });
        setStatusMessage('Payment order created successfully. Waiting for customer to complete payment...');
        startStatusPolling(result.order_id);
      } else {
        throw new Error(result.error || 'Failed to create payment order');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment order';
      setError(errorMessage);
      setStatusMessage('');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Check payment status
  const checkPaymentStatus = async (orderId: string) => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch(`/zenopay-check-status.php?order_id=${orderId}`);
      const result = await response.json();

      if (result.success && result.orders.length > 0) {
        const order = result.orders[0];
        setCurrentOrder(order);

        if (order.payment_status === 'COMPLETED') {
          setStatusMessage('Payment completed successfully!');
          // Create sale record and complete the transaction
          await completeSale(order);
        } else if (order.payment_status === 'FAILED') {
          setError('Payment failed. Please try again.');
          setStatusMessage('');
        } else if (order.payment_status === 'CANCELLED') {
          setError('Payment was cancelled by the customer.');
          setStatusMessage('');
        } else {
          setStatusMessage('Payment is still pending. Please wait...');
        }
      } else {
        throw new Error(result.error || 'Failed to check payment status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check payment status';
      setError(errorMessage);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Start polling for status updates
  const startStatusPolling = (orderId: string) => {
    const pollInterval = setInterval(async () => {
      await checkPaymentStatus(orderId);
      
      // Stop polling if payment is completed or failed
      if (currentOrder?.payment_status === 'COMPLETED' || 
          currentOrder?.payment_status === 'FAILED' || 
          currentOrder?.payment_status === 'CANCELLED') {
        clearInterval(pollInterval);
      }
    }, 5000); // Check every 5 seconds

    // Cleanup interval after 10 minutes (120 checks)
    setTimeout(() => {
      clearInterval(pollInterval);
      if (currentOrder?.payment_status === 'PENDING') {
        setError('Payment timeout. Please try again.');
        setStatusMessage('');
      }
    }, 600000);
  };

  // Complete the sale
  const completeSale = async (order: ZenoPayOrder) => {
    try {
      const sale: Sale = {
        id: `sale_${Date.now()}`,
        saleNumber: `SALE-${Date.now().toString().slice(-6)}`,
        items: cartItems.map(item => ({
          id: `item_${Date.now()}_${item.id}`,
          saleId: `sale_${Date.now()}`,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          costPrice: 0, // TODO: Get from product data
          profit: item.totalPrice // TODO: Calculate actual profit
        })),
        subtotal: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
        tax: 0, // TODO: Calculate tax
        discount: 0,
        total: total,
        paymentMethod: {
          type: 'mobile_money',
          details: {
            mobileProvider: 'ZenoPay',
            reference: order.reference
          },
          amount: total
        },
        paymentStatus: 'completed',
        customerId: customer?.id,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        soldBy: 'POS User', // TODO: Get from auth context
        soldAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      onPaymentComplete(sale);
      onClose();
    } catch (err) {
      setError('Failed to complete sale. Please contact support.');
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentOrder(null);
      setError(null);
      setStatusMessage('');
      setIsCreatingOrder(false);
      setIsCheckingStatus(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Mobile Money Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Details */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Amount:</span>
            <span className="text-2xl font-bold text-green-600">
              {total.toLocaleString('en-US', { style: 'currency', currency: 'TZS' })}
            </span>
          </div>

          {customer && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Customer:</div>
              <div className="font-medium">{customer.name}</div>
              <div className="text-sm text-gray-500">{customer.phone}</div>
            </div>
          )}

          {/* Payment Status */}
          {currentOrder && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GlassBadge variant="primary" size="sm">
                  Order: {currentOrder.order_id.slice(-8)}
                </GlassBadge>
                <GlassBadge 
                  variant={
                    currentOrder.payment_status === 'COMPLETED' ? 'success' :
                    currentOrder.payment_status === 'FAILED' ? 'error' :
                    currentOrder.payment_status === 'CANCELLED' ? 'error' : 'warning'
                  } 
                  size="sm"
                >
                  {currentOrder.payment_status}
                </GlassBadge>
              </div>
              {currentOrder.reference && (
                <div className="text-sm text-gray-600">
                  Reference: {currentOrder.reference}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Messages */}
        {statusMessage && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-blue-800">{statusMessage}</span>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {!currentOrder && (
            <GlassButton
              onClick={createZenoPayOrder}
              disabled={!isCustomerValid || isCreatingOrder}
              className="w-full"
              size="lg"
            >
              {isCreatingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Payment Order...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with Mobile Money
                </>
              )}
            </GlassButton>
          )}

          {currentOrder?.payment_status === 'PENDING' && (
            <GlassButton
              onClick={() => checkPaymentStatus(currentOrder.order_id)}
              disabled={isCheckingStatus}
              variant="outline"
              className="w-full"
            >
              {isCheckingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Checking Status...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check Payment Status
                </>
              )}
            </GlassButton>
          )}

          <GlassButton
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Cancel
          </GlassButton>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div className="font-medium mb-1">Instructions:</div>
            <ul className="space-y-1 text-xs">
              <li>• Customer will receive a payment prompt on their phone</li>
              <li>• Payment will be processed through ZenoPay</li>
              <li>• Status will update automatically</li>
              <li>• Sale will complete once payment is confirmed</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ZenoPayPaymentModal;

