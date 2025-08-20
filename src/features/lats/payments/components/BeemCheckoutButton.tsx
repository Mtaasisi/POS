import React, { useState } from 'react';
import { BeemPaymentProvider } from '../providers/beem';
import { BEEM_CONFIG, getBeemCredentials } from '../config/beem';
import { OrderData } from '../types';

interface BeemCheckoutButtonProps {
  orderData: OrderData;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const BeemCheckoutButton: React.FC<BeemCheckoutButtonProps> = ({
  orderData,
  onSuccess,
  onError,
  onLoading,
  className = '',
  disabled = false,
  children
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    onLoading?.(true);

    try {
      // Get Beem Africa credentials
      const credentials = {
        ...getBeemCredentials(),
        webhookUrl: `${window.location.origin}/api/beem-webhook`
      };

      const beemProvider = new BeemPaymentProvider(credentials);

      // Validate order data
      if (!orderData.amount || orderData.amount <= 0) {
        throw new Error(BEEM_CONFIG.ERROR_MESSAGES.INVALID_AMOUNT);
      }

      if (!BEEM_CONFIG.SUPPORTED_CURRENCIES.includes(orderData.currency || 'TZS')) {
        throw new Error(BEEM_CONFIG.ERROR_MESSAGES.CURRENCY_NOT_SUPPORTED);
      }

      // Create checkout session
      const result = await beemProvider.createOrder(orderData, credentials);

      if (result.success && result.raw) {
        // Redirect to Beem Africa checkout
        const checkoutUrl = (result.raw as any).data?.checkout_url;
        if (checkoutUrl) {
          beemProvider.redirectToCheckout(checkoutUrl);
          onSuccess?.(result);
        } else {
          throw new Error('Checkout URL not received from Beem Africa');
        }
      } else {
        throw new Error(result.message || 'Failed to create checkout session');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Beem checkout error:', error);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      onLoading?.(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      style={{ backgroundColor: BEEM_CONFIG.BRAND_COLOR }}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        <img 
          src={BEEM_CONFIG.LOGO_URL} 
          alt={BEEM_CONFIG.BRAND_NAME}
          className="h-4 w-4"
        />
      )}
      {children || (isLoading ? 'Processing...' : `Pay with ${BEEM_CONFIG.BRAND_NAME}`)}
    </button>
  );
};

export default BeemCheckoutButton;
