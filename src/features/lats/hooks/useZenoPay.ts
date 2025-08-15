import { useState, useCallback } from 'react';
import { CartItem, Sale } from '../types/pos';

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

interface ZenoPayCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface CreateOrderData {
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string;
  amount: number;
  metadata?: Record<string, any>;
}

interface UseZenoPayReturn {
  // State
  isLoading: boolean;
  error: string | null;
  currentOrder: ZenoPayOrder | null;
  
  // Actions
  createOrder: (data: CreateOrderData) => Promise<ZenoPayOrder | null>;
  checkOrderStatus: (orderId: string) => Promise<ZenoPayOrder | null>;
  processPayment: (cartItems: CartItem[], total: number, customer: ZenoPayCustomer) => Promise<Sale | null>;
  clearError: () => void;
  resetOrder: () => void;
}

export const useZenoPay = (): UseZenoPayReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<ZenoPayOrder | null>(null);

  // Create a new payment order
  const createOrder = useCallback(async (data: CreateOrderData): Promise<ZenoPayOrder | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/zenopay-create-order.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        const order: ZenoPayOrder = {
          order_id: result.order_id,
          buyer_email: data.buyer_email,
          buyer_name: data.buyer_name,
          buyer_phone: data.buyer_phone,
          amount: data.amount,
          payment_status: 'PENDING'
        };
        
        setCurrentOrder(order);
        return order;
      } else {
        throw new Error(result.error || 'Failed to create payment order');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment order';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check order status
  const checkOrderStatus = useCallback(async (orderId: string): Promise<ZenoPayOrder | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/zenopay-check-status.php?order_id=${orderId}`);
      const result = await response.json();

      if (result.success && result.orders.length > 0) {
        const order = result.orders[0];
        setCurrentOrder(order);
        return order;
      } else {
        throw new Error(result.error || 'Failed to check payment status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check payment status';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Process complete payment flow
  const processPayment = useCallback(async (
    cartItems: CartItem[], 
    total: number, 
    customer: ZenoPayCustomer
  ): Promise<Sale | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Create order
      const orderData = {
        buyer_email: customer.email,
        buyer_name: customer.name,
        buyer_phone: customer.phone,
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
          customer_id: customer.id,
          pos_session_id: `pos_${Date.now()}`,
          order_type: 'pos_sale'
        }
      };

      const order = await createOrder(orderData);
      if (!order) {
        throw new Error('Failed to create payment order');
      }

      // Poll for status updates
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes with 5-second intervals
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const updatedOrder = await checkOrderStatus(order.order_id);
        if (!updatedOrder) {
          throw new Error('Failed to check payment status');
        }

        if (updatedOrder.payment_status === 'COMPLETED') {
          // Create sale record
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
                reference: updatedOrder.reference
              },
              amount: total
            },
            paymentStatus: 'completed',
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            soldBy: 'POS User', // TODO: Get from auth context
            soldAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };

          return sale;
        } else if (updatedOrder.payment_status === 'FAILED') {
          throw new Error('Payment failed. Please try again.');
        } else if (updatedOrder.payment_status === 'CANCELLED') {
          throw new Error('Payment was cancelled by the customer.');
        }

        attempts++;
      }

      throw new Error('Payment timeout. Please try again.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [createOrder, checkOrderStatus]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset order state
  const resetOrder = useCallback(() => {
    setCurrentOrder(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    currentOrder,
    createOrder,
    checkOrderStatus,
    processPayment,
    clearError,
    resetOrder
  };
};

