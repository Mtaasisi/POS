import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, CheckCircle, AlertCircle, Loader2, Phone, Edit3 } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassBadge from '../../../shared/components/ui/GlassBadge';
import GlassInput from '../../../shared/components/ui/GlassInput';
import { CartItem, Sale } from '../../types/pos';
import { ZENOPAY_CONFIG, UssdPopupService, USSD_CONFIG } from '../../config/zenopay';
import { useAuth } from '../../../../context/AuthContext';
import { validateMobileMoneyReference, getReferencePlaceholder, getReferenceHelpText } from '../../../../utils/mobileMoneyValidation';

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
  const [isTriggeringUssd, setIsTriggeringUssd] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<ZenoPayOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [ussdStatus, setUssdStatus] = useState<string>('idle');
  const [ussdPollingInterval, setUssdPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualReference, setManualReference] = useState('');

  // Auth context
  const { currentUser } = useAuth();

  // Validate customer data - only phone is required for mobile money
  const isCustomerValid = customer && customer.phone;

  // Create ZenoPay order with USSD popup
  const createZenoPayOrder = async () => {
    if (!isCustomerValid) {
      setError('Customer phone number is required for mobile money payment');
      return;
    }

    setIsCreatingOrder(true);
    setError(null);
    setStatusMessage('Creating payment order...');

    try {
      const orderData = {
        buyer_email: customer!.email || `${customer!.phone}@mobile.money`,
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
          order_type: 'pos_sale',
          payment_method: 'ussd_popup'
        }
      };

      const response = await fetch(ZENOPAY_CONFIG.getCreateOrderUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        const order = {
          order_id: result.order_id,
          buyer_email: customer!.email || `${customer!.phone}@mobile.money`,
          buyer_name: customer!.name,
          buyer_phone: customer!.phone,
          amount: total,
          payment_status: 'PENDING'
        };
        
        setCurrentOrder(order);
        setStatusMessage('Payment order created successfully. Triggering USSD popup...');
        
        // Trigger USSD popup immediately after order creation
        await triggerUssdPopup(order.order_id);
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

  // Trigger USSD popup on customer mobile
  const triggerUssdPopup = async (orderId: string) => {
    if (!customer?.phone) {
      setError('Customer phone number is required for USSD popup');
      return;
    }

    setIsTriggeringUssd(true);
    setUssdStatus('triggering');
    setStatusMessage(USSD_CONFIG.MESSAGES.INITIATING);

    try {
      console.log('[ZenoPay USSD] Triggering USSD popup for customer:', {
        phone: customer.phone,
        amount: total,
        orderId,
        customerName: customer.name
      });

      const ussdResult = await UssdPopupService.triggerUssdPopup(
        customer.phone,
        total,
        orderId,
        customer.name
      );

      if (ussdResult.success) {
        setUssdStatus('sent');
        setStatusMessage(USSD_CONFIG.MESSAGES.PENDING);
        
        console.log('[ZenoPay USSD] USSD popup triggered successfully:', ussdResult.data);
        
        // Start polling for USSD status
        startUssdStatusPolling(orderId);
      } else {
        setUssdStatus('error');
        setError(ussdResult.message);
        setStatusMessage('');
        
        console.error('[ZenoPay USSD] USSD popup trigger failed:', ussdResult);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'USSD popup error';
      setUssdStatus('error');
      setError(errorMessage);
      setStatusMessage('');
      
      console.error('[ZenoPay USSD] USSD popup error:', err);
    } finally {
      setIsTriggeringUssd(false);
    }
  };

  // Start polling for USSD status updates
  const startUssdStatusPolling = (orderId: string) => {
    console.log('[ZenoPay USSD] Starting USSD status polling for order:', orderId);
    
    const interval = setInterval(async () => {
      try {
        const statusResult = await UssdPopupService.checkUssdStatus(orderId);
        
        console.log('[ZenoPay USSD] Status check result:', statusResult);
        
        if (statusResult.success) {
          setUssdStatus(statusResult.status);
          
          if (statusResult.status === 'completed') {
            setStatusMessage(USSD_CONFIG.MESSAGES.SUCCESS);
            clearInterval(interval);
            setUssdPollingInterval(null);
            
            // Complete the sale
            await completeSale(currentOrder!);
          } else if (statusResult.status === 'failed') {
            setError(USSD_CONFIG.MESSAGES.FAILED);
            setStatusMessage('');
            clearInterval(interval);
            setUssdPollingInterval(null);
          } else if (statusResult.status === 'cancelled') {
            setError(USSD_CONFIG.MESSAGES.CANCELLED);
            setStatusMessage('');
            clearInterval(interval);
            setUssdPollingInterval(null);
          } else {
            setStatusMessage(USSD_CONFIG.MESSAGES.PENDING);
          }
        } else {
          console.warn('[ZenoPay USSD] Status check failed:', statusResult);
        }
      } catch (err) {
        console.error('[ZenoPay USSD] Status polling error:', err);
      }
    }, 5000); // Check every 5 seconds

    setUssdPollingInterval(interval);

    // Set timeout to stop polling after 5 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setUssdPollingInterval(null);
        
        if (ussdStatus === 'sent' || ussdStatus === 'pending') {
          setUssdStatus('timeout');
          setError(USSD_CONFIG.MESSAGES.TIMEOUT);
          setStatusMessage('');
          
          console.warn('[ZenoPay USSD] USSD polling timeout');
        }
      }
    }, USSD_CONFIG.POPUP_TIMEOUT);
  };

  // Check payment status (legacy method - kept for compatibility)
  const checkPaymentStatus = async (orderId: string) => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch(ZENOPAY_CONFIG.getCheckStatusUrl(orderId));
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

  // Handle manual reference entry
  const handleManualReferenceSubmit = async () => {
    if (!manualReference.trim()) {
      setError('Please enter a reference number');
      return;
    }

    const validation = validateMobileMoneyReference(manualReference, 'ZenoPay');
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    // Create a mock order with the manual reference
    const mockOrder: ZenoPayOrder = {
      order_id: `MANUAL_${Date.now()}`,
      buyer_email: customer!.email || `${customer!.phone}@mobile.money`,
      buyer_name: customer!.name,
      buyer_phone: customer!.phone,
      amount: total,
      payment_status: 'COMPLETED',
      reference: manualReference.trim()
    };

    await completeSale(mockOrder);
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
                        costPrice: 0, // Will be calculated by sale processing service
              profit: 0 // Will be calculated by sale processing service
        })),
                    subtotal: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
                        tax: cartItems.reduce((sum, item) => sum + item.totalPrice, 0) * 0.16, // 16% VAT
            discount: 0,
            total: total + (cartItems.reduce((sum, item) => sum + item.totalPrice, 0) * 0.16),
        paymentMethod: {
          type: 'mobile_money',
          details: {
            mobileProvider: 'ZenoPay',
            reference: order.reference,
            paymentMethod: 'ussd_popup'
          },
          amount: total
        },
        paymentStatus: 'completed',
        customerId: customer?.id,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        soldBy: currentUser?.name || currentUser?.email || 'POS User',
        soldAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      console.log('[ZenoPay USSD] Sale completed successfully:', sale);
      onPaymentComplete(sale);
      onClose();
    } catch (err) {
      setError('Failed to complete sale. Please contact support.');
      console.error('[ZenoPay USSD] Sale completion error:', err);
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
      setIsTriggeringUssd(false);
      setUssdStatus('idle');
      
      // Clear polling interval
      if (ussdPollingInterval) {
        clearInterval(ussdPollingInterval);
        setUssdPollingInterval(null);
      }
    }
  }, [isOpen, ussdPollingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ussdPollingInterval) {
        clearInterval(ussdPollingInterval);
      }
    };
  }, [ussdPollingInterval]);

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
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {customer.phone}
              </div>
            </div>
          )}

          {/* USSD Status */}
          {ussdStatus !== 'idle' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GlassBadge 
                  variant={
                    ussdStatus === 'completed' ? 'success' :
                    ussdStatus === 'failed' || ussdStatus === 'cancelled' || ussdStatus === 'timeout' ? 'error' :
                    ussdStatus === 'sent' ? 'primary' : 'warning'
                  } 
                  size="sm"
                >
                  USSD: {ussdStatus.toUpperCase()}
                </GlassBadge>
                {ussdStatus === 'triggering' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
              </div>
              {ussdStatus === 'sent' && (
                <div className="text-sm text-blue-700">
                  USSD popup sent to {customer?.phone}. Waiting for customer response...
                </div>
              )}
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
              disabled={!isCustomerValid || isCreatingOrder || isTriggeringUssd}
              className="w-full"
              size="lg"
            >
              {isCreatingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Payment Order...
                </>
              ) : isTriggeringUssd ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending USSD Popup...
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Pay with USSD Popup
                </>
              )}
            </GlassButton>
          )}

          {currentOrder?.payment_status === 'PENDING' && ussdStatus === 'idle' && (
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

          {ussdStatus === 'sent' && (
            <GlassButton
              onClick={() => triggerUssdPopup(currentOrder!.order_id)}
              disabled={isTriggeringUssd}
              variant="outline"
              className="w-full"
            >
              {isTriggeringUssd ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Resending USSD Popup...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Resend USSD Popup
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
            <div className="font-medium mb-1">USSD Popup Instructions:</div>
            <ul className="space-y-1 text-xs">
              <li>• Customer will receive a USSD popup on their phone ({customer?.phone})</li>
              <li>• USSD popup will show payment amount: {total.toLocaleString('en-US', { style: 'currency', currency: 'TZS' })}</li>
              <li>• Customer needs to confirm payment on their mobile device</li>
              <li>• Payment status will update automatically</li>
              <li>• Sale will complete once payment is confirmed</li>
              <li>• USSD popup will timeout after 5 minutes</li>
            </ul>
          </div>
        </div>

        {/* Debug Information (only in development) */}
        {import.meta.env.MODE === 'development' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-xs text-yellow-800">
              <div className="font-medium mb-1">Debug Info:</div>
              <div>USSD Status: {ussdStatus}</div>
              <div>Order ID: {currentOrder?.order_id || 'None'}</div>
              <div>Customer Phone: {customer?.phone || 'None'}</div>
              <div>Amount: {total}</div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ZenoPayPaymentModal;

