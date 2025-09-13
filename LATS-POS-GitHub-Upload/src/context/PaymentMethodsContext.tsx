import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { financeAccountService, FinanceAccount } from '../lib/financeAccountService';
import { toast } from 'react-hot-toast';

interface PaymentMethodsContextType {
  paymentMethods: FinanceAccount[];
  loading: boolean;
  error: string | null;
  refreshPaymentMethods: () => Promise<void>;
  getPaymentMethodById: (id: string) => FinanceAccount | undefined;
  getPaymentMethodsByType: (type: string) => FinanceAccount[];
}

const PaymentMethodsContext = createContext<PaymentMethodsContextType | undefined>(undefined);

export const usePaymentMethodsContext = () => {
  const context = useContext(PaymentMethodsContext);
  if (!context) {
    throw new Error('usePaymentMethodsContext must be used within a PaymentMethodsProvider');
  }
  return context;
};

interface PaymentMethodsProviderProps {
  children: React.ReactNode;
}

export const PaymentMethodsProvider: React.FC<PaymentMethodsProviderProps> = ({ children }) => {
  const [paymentMethods, setPaymentMethods] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDisabled, setSubscriptionDisabled] = useState(false);

  const refreshPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const methods = await financeAccountService.getPaymentMethods();
      setPaymentMethods(methods);
      console.log('🔄 Payment methods refreshed:', methods.length);
    } catch (err: any) {
      const errorMessage = err?.message?.includes('ERR_CONNECTION_CLOSED') || 
                          err?.message?.includes('Failed to fetch') 
                          ? 'Connection issue. Using cached data.' 
                          : 'Failed to fetch payment methods';
      
      setError(errorMessage);
      console.error('Error refreshing payment methods:', err);
      
      // Don't clear existing methods on connection errors
      if (!err?.message?.includes('ERR_CONNECTION_CLOSED') && 
          !err?.message?.includes('Failed to fetch')) {
        setPaymentMethods([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentMethodById = useCallback((id: string) => {
    return paymentMethods.find(method => method.id === id);
  }, [paymentMethods]);

  const getPaymentMethodsByType = useCallback((type: string) => {
    return paymentMethods.filter(method => method.type === type);
  }, [paymentMethods]);

  // Initial load
  useEffect(() => {
    refreshPaymentMethods();
  }, [refreshPaymentMethods]);

  // Set up real-time subscription to finance_accounts table with improved error handling
  useEffect(() => {
    let channel: any;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3; // Allow more attempts but with better backoff
    const baseReconnectDelay = 5000; // Start with 5 seconds
    let isSubscribed = false;
    let isConnecting = false;
    let lastConnectionAttempt = 0;
    const connectionCooldown = 3000; // Reduced to 3 seconds
    let refreshTimeout: NodeJS.Timeout;

    const setupSubscription = () => {
      // Skip if subscription is disabled
      if (subscriptionDisabled) {
        console.log('⏳ Payment methods: Subscription disabled, skipping setup');
        return;
      }

      // Prevent rapid reconnection attempts
      const now = Date.now();
      if (isConnecting || (now - lastConnectionAttempt < connectionCooldown)) {
        console.log('⏳ Payment methods: Connection cooldown active, skipping setup');
        return;
      }

      try {
        isConnecting = true;
        lastConnectionAttempt = now;

        // Clean up existing subscription first
        if (channel) {
          try {
            channel.unsubscribe();
          } catch (unsubError) {
            console.warn('Warning during channel unsubscribe:', unsubError);
          }
        }

        channel = financeAccountService.supabase
          .channel('payment_methods_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'finance_accounts',
              filter: 'is_payment_method=eq.true'
            },
            (payload) => {
              console.log('🔄 Payment methods changed:', payload.eventType);
              // Debounce the refresh to prevent excessive calls
              clearTimeout(refreshTimeout);
              refreshTimeout = setTimeout(() => {
                refreshPaymentMethods();
              }, 2000); // Reduced debounce time to 2 seconds
            }
          )
          .subscribe((status) => {
            console.log('📡 Payment methods subscription status:', status);
            isConnecting = false;
            
            if (status === 'SUBSCRIBED') {
              reconnectAttempts = 0; // Reset attempts on successful connection
              isSubscribed = true;
              console.log('✅ Payment methods subscription established successfully');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              isSubscribed = false;
              console.warn(`⚠️ Payment methods subscription ${status.toLowerCase()}`);
              
              // Only attempt reconnection if we haven't exceeded max attempts
              if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const delay = Math.min(baseReconnectDelay * Math.pow(1.5, reconnectAttempts - 1), 30000); // Cap at 30 seconds
                console.log(`🔄 Attempting reconnection ${reconnectAttempts}/${maxReconnectAttempts} in ${delay/1000}s...`);
                
                setTimeout(() => {
                  if (!isSubscribed && !isConnecting) {
                    setupSubscription();
                  }
                }, delay);
              } else {
                console.error('❌ Max reconnection attempts reached, disabling payment methods subscription');
                setSubscriptionDisabled(true);
                // Still allow manual refresh
                toast.error('Payment methods subscription disabled. Data will refresh manually.');
              }
            }
          });
      } catch (error) {
        console.error('❌ Error setting up payment methods subscription:', error);
        isSubscribed = false;
        isConnecting = false;
        
        // Retry after delay with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(baseReconnectDelay * Math.pow(1.5, reconnectAttempts - 1), 30000);
          setTimeout(() => {
            if (!isSubscribed && !isConnecting) {
              setupSubscription();
            }
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached, disabling payment methods subscription');
          setSubscriptionDisabled(true);
        }
      }
    };

    // Initial setup with delay to prevent immediate connection
    const initialTimeout = setTimeout(() => {
      setupSubscription();
    }, 2000); // Increased initial delay

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(reconnectTimeout);
      clearTimeout(refreshTimeout);
      isSubscribed = false;
      isConnecting = false;
      if (channel) {
        try {
          channel.unsubscribe();
        } catch (error) {
          console.warn('Warning during cleanup unsubscribe:', error);
        }
      }
    };
  }, [refreshPaymentMethods, subscriptionDisabled]);

  const value: PaymentMethodsContextType = {
    paymentMethods,
    loading,
    error,
    refreshPaymentMethods,
    getPaymentMethodById,
    getPaymentMethodsByType
  };

  return (
    <PaymentMethodsContext.Provider value={value}>
      {children}
    </PaymentMethodsContext.Provider>
  );
};
