import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface PaymentRow {
  id: string;
  customer_id: string;
  amount: number;
  currency: string; // Added currency field
  method: 'cash' | 'card' | 'transfer';
  device_id?: string | null;
  payment_date: string;
  payment_type: 'payment' | 'deposit' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  created_by?: string | null;
  created_at?: string | null;
  // Added fields for device and customer names
  device_name?: string;
  customer_name?: string;
  // Enhanced fields for better data identification
  source?: 'device_payment' | 'pos_sale' | 'repair_payment';
  orderId?: string;
  orderStatus?: string;
  totalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingCost?: number;
  amountPaid?: number;
  balanceDue?: number;
  customerType?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryNotes?: string;
  repairType?: string;
  diagnosis?: string;
  deviceBrand?: string;
  deviceModel?: string;
}

interface PaymentsContextType {
  payments: PaymentRow[];
  loading: boolean;
  refreshPayments: () => Promise<void>;
  // Enhanced methods for data filtering
  getPaymentsBySource: (source: 'device_payment' | 'pos_sale' | 'repair_payment') => PaymentRow[];
  getPaymentsByStatus: (status: 'completed' | 'pending' | 'failed') => PaymentRow[];
  getPaymentsByDateRange: (startDate: string, endDate: string) => PaymentRow[];
  getTotalRevenue: () => number;
  getRevenueBySource: () => {
    devicePayments: number;
    posSales: number;
    repairPayments: number;
    total: number;
  };
}

const PaymentsContext = createContext<PaymentsContextType | undefined>(undefined);

export const PaymentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    
    try {
      // Check if user is authenticated first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.warn('User not authenticated, skipping payment fetch');
        setPayments([]);
        setLoading(false);
        return;
      }
      
      // Fetch device payments (repair payments)
      const { data: devicePaymentsData, error: devicePaymentsError } = await supabase
        .from('customer_payments')
        .select(`
          *,
          devices(brand, model),
          customers(name)
        `)
        .order('payment_date', { ascending: false });
      
      if (devicePaymentsError) {
        console.error('Error fetching customer payments:', devicePaymentsError);
        // If table doesn't exist, show helpful message
        if (devicePaymentsError.message.includes('relation "public.customer_payments" does not exist')) {
          console.warn('customer_payments table does not exist. Please run the SQL migration in Supabase dashboard.');
        }
        // If it's an authentication error, show helpful message
        if (devicePaymentsError.message.includes('JWT') || devicePaymentsError.message.includes('auth')) {
          console.warn('Authentication error. Please log in again.');
        }
      }
      
      // Fetch POS sales
      const { data: posSalesData, error: posSalesError } = await supabase
        .from('lats_sales')
        .select(`
          *,
          customers(name),
          lats_sale_items(
            *,
            lats_products(name, description),
            lats_product_variants(name, sku, attributes)
          )
        `)
        .order('created_at', { ascending: false });

      let finalPosSalesData = posSalesData;
      let finalPosSalesError = posSalesError;

      if (posSalesError) {
        console.warn('Complex POS sales query failed, trying simpler query:', posSalesError.message);
        
        // Fallback to simpler query without joins
        const { data: simplePosSalesData, error: simplePosSalesError } = await supabase
          .from('lats_sales')
          .select('*')
          .order('created_at', { ascending: false });

        if (simplePosSalesError) {
          console.error('Simple POS sales query also failed:', simplePosSalesError);
          finalPosSalesData = [];
          finalPosSalesError = null;
        } else {
          finalPosSalesData = simplePosSalesData;
          finalPosSalesError = null;
          console.log(`✅ Loaded ${finalPosSalesData?.length || 0} POS sales (without joins)`);
        }
      } else {
        console.log(`✅ Loaded ${finalPosSalesData?.length || 0} POS sales`);
      }

      const allPayments: any[] = [];

      // Transform device payments
      if (!devicePaymentsError && devicePaymentsData) {
        const transformedDevicePayments = devicePaymentsData.map((payment: any) => ({
          id: payment.id,
          customer_id: payment.customer_id,
          amount: payment.amount,
          currency: payment.currency || 'TZS', // Default to TZS if not set
          method: payment.method,
          device_id: payment.device_id,
          payment_date: payment.payment_date,
          payment_type: payment.payment_type,
          status: payment.status,
          created_by: payment.created_by,
          created_at: payment.created_at,
          device_name: payment.devices 
            ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
            : undefined,
          customer_name: payment.customers?.name || undefined,
          source: 'device_payment',
          repairType: payment.repair_type,
          diagnosis: payment.diagnosis,
          deviceBrand: payment.devices?.brand,
          deviceModel: payment.devices?.model
        }));
        allPayments.push(...transformedDevicePayments);
      }

      // Transform POS sales
      if (!finalPosSalesError && finalPosSalesData) {
        const transformedPOSSales = finalPosSalesData.map((sale: any) => ({
          id: sale.id,
          customer_id: sale.customer_id,
          amount: sale.total_amount,
          currency: sale.currency || 'TZS', // Default to TZS if not set
          method: sale.payment_method,
          device_id: null,
          payment_date: sale.created_at,
          payment_type: 'payment',
          status: sale.status === 'completed' ? 'completed' : 
                  sale.status === 'pending' ? 'pending' : 'failed',
          created_by: sale.created_by,
          created_at: sale.created_at,
          device_name: undefined,
          customer_name: sale.customers?.name || undefined,
          source: 'pos_sale',
          // Enhanced POS-specific fields
          orderId: sale.id,
          orderStatus: sale.status,
          totalAmount: sale.total_amount,
          discountAmount: 0, // Not available in new schema
          taxAmount: 0, // Not available in new schema
          shippingCost: 0, // Not available in new schema
          amountPaid: sale.total_amount, // Assuming full payment for completed sales
          balanceDue: 0, // Not available in new schema
          customerType: 'retail', // Default value
          deliveryMethod: 'pickup', // Default value
          deliveryAddress: '', // Not available in new schema
          deliveryCity: '', // Not available in new schema
          deliveryNotes: '' // Not available in new schema
        }));
        allPayments.push(...transformedPOSSales);
      }

      // Sort by date (most recent first)
      allPayments.sort((a, b) => {
        const dateA = new Date(a.payment_date || a.created_at);
        const dateB = new Date(b.payment_date || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      setPayments(allPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filtering methods
  const getPaymentsBySource = (source: 'device_payment' | 'pos_sale' | 'repair_payment') => {
    return payments.filter(payment => payment.source === source);
  };

  const getPaymentsByStatus = (status: 'completed' | 'pending' | 'failed') => {
    return payments.filter(payment => payment.status === status);
  };

  const getPaymentsByDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return payments.filter(payment => {
      const paymentDate = new Date(payment.payment_date || payment.created_at);
      return paymentDate >= start && paymentDate <= end;
    });
  };

  const getTotalRevenue = () => {
    return payments
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  };

  const getRevenueBySource = () => {
    const devicePayments = getPaymentsBySource('device_payment')
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const posSales = getPaymentsBySource('pos_sale')
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const repairPayments = getPaymentsBySource('repair_payment')
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      devicePayments,
      posSales,
      repairPayments,
      total: devicePayments + posSales + repairPayments
    };
  };

  useEffect(() => {
    fetchPayments();
    
    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (event === 'SIGNED_IN' && session) {
        fetchPayments();
      } else if (event === 'SIGNED_OUT') {
        setPayments([]);
        setLoading(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <PaymentsContext.Provider value={{
      payments,
      loading,
      refreshPayments: fetchPayments,
      getPaymentsBySource,
      getPaymentsByStatus,
      getPaymentsByDateRange,
      getTotalRevenue,
      getRevenueBySource
    }}>
      {children}
    </PaymentsContext.Provider>
  );
};

export const usePayments = () => {
  const context = useContext(PaymentsContext);
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentsProvider');
  }
  return context;
}; 