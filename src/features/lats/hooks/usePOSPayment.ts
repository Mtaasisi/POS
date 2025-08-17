import { useState, useCallback } from 'react';

export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'zenopay' | 'bank_transfer';

interface PaymentData {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  customerPhone?: string;
  customerEmail?: string;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message: string;
  error?: string;
}

export const usePOSPayment = () => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [lastPaymentResult, setLastPaymentResult] = useState<PaymentResult | null>(null);

  // Process payment
  const processPayment = useCallback(async (
    amount: number,
    method: PaymentMethod,
    customerData?: { phone?: string; email?: string }
  ): Promise<PaymentResult> => {
    setIsProcessingPayment(true);
    setLastPaymentResult(null);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate transaction reference
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Simulate different payment method processing
      let success = true;
      let message = 'Payment processed successfully';
      let error: string | undefined;

      switch (method) {
        case 'cash':
          message = `Cash payment of ${amount.toLocaleString()} TZS received`;
          break;
        
        case 'mpesa':
          if (customerData?.phone) {
            message = `M-Pesa payment of ${amount.toLocaleString()} TZS from ${customerData.phone}`;
          } else {
            success = false;
            error = 'Phone number required for M-Pesa payment';
          }
          break;
        
        case 'card':
          message = `Card payment of ${amount.toLocaleString()} TZS processed`;
          break;
        
        case 'zenopay':
          message = `ZenoPay payment of ${amount.toLocaleString()} TZS processed`;
          break;
        
        case 'bank_transfer':
          message = `Bank transfer of ${amount.toLocaleString()} TZS initiated`;
          break;
        
        default:
          success = false;
          error = 'Invalid payment method';
      }

      const result: PaymentResult = {
        success,
        transactionId: success ? transactionId : undefined,
        message,
        error
      };

      setLastPaymentResult(result);
      setPaymentData({
        method,
        amount,
        reference: transactionId,
        customerPhone: customerData?.phone,
        customerEmail: customerData?.email
      });

      return result;

    } catch (err) {
      const result: PaymentResult = {
        success: false,
        message: 'Payment processing failed',
        error: err instanceof Error ? err.message : 'Unknown error'
      };
      
      setLastPaymentResult(result);
      return result;
    } finally {
      setIsProcessingPayment(false);
    }
  }, []);

  // Reset payment state
  const resetPayment = useCallback(() => {
    setIsProcessingPayment(false);
    setSelectedPaymentMethod(null);
    setPaymentData(null);
    setLastPaymentResult(null);
  }, []);

  // Validate payment method
  const validatePaymentMethod = useCallback((method: PaymentMethod, amount: number, customerData?: any): string | null => {
    switch (method) {
      case 'mpesa':
        if (!customerData?.phone) {
          return 'Phone number is required for M-Pesa payment';
        }
        if (amount < 100) {
          return 'M-Pesa minimum amount is 100 TZS';
        }
        break;
      
      case 'card':
        if (amount < 50) {
          return 'Card minimum amount is 50 TZS';
        }
        break;
      
      case 'zenopay':
        if (amount < 100) {
          return 'ZenoPay minimum amount is 100 TZS';
        }
        break;
      
      case 'cash':
        if (amount <= 0) {
          return 'Invalid cash amount';
        }
        break;
    }
    
    return null;
  }, []);

  // Get payment method display info
  const getPaymentMethodInfo = useCallback((method: PaymentMethod) => {
    const methods = {
      cash: { name: 'Cash', icon: '💵', color: 'text-green-600' },
      mpesa: { name: 'M-Pesa', icon: '📱', color: 'text-green-500' },
      card: { name: 'Card', icon: '💳', color: 'text-blue-600' },
      zenopay: { name: 'ZenoPay', icon: '🔗', color: 'text-purple-600' },
      bank_transfer: { name: 'Bank Transfer', icon: '🏦', color: 'text-gray-600' }
    };
    
    return methods[method] || { name: 'Unknown', icon: '❓', color: 'text-gray-600' };
  }, []);

  return {
    // State
    isProcessingPayment,
    selectedPaymentMethod,
    paymentData,
    lastPaymentResult,
    
    // Actions
    setSelectedPaymentMethod,
    processPayment,
    resetPayment,
    validatePaymentMethod,
    getPaymentMethodInfo
  };
};
