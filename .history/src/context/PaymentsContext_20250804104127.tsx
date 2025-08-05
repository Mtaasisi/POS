import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface PaymentRow {
  id: string;
  customer_id: string;
  amount: number;
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
}

interface PaymentsContextType {
  payments: PaymentRow[];
  loading: boolean;
  refreshPayments: () => Promise<void>;
}

const PaymentsContext = createContext<PaymentsContextType | undefined>(undefined);

export const PaymentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    
    try {
      // Fetch regular payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('customer_payments')
        .select(`
          *,
          devices(brand, model),
          customers(name)
        `)
        .order('payment_date', { ascending: false });
      
      // Fetch POS sales
      const { data: posSalesData, error: posSalesError } = await supabase
        .from('sales_orders')
        .select(`
          *,
          customers(name)
        `)
        .order('created_at', { ascending: false });

      let allPayments: any[] = [];

      // Transform regular payments
      if (!paymentsError && paymentsData) {
        const transformedPayments = paymentsData.map((payment: any) => ({
          ...payment,
          device_name: payment.devices 
            ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
            : undefined,
          customer_name: payment.customers?.name || undefined,
          source: 'device_payment'
        }));
        allPayments.push(...transformedPayments);
      }

      // Transform POS sales
      if (!posSalesError && posSalesData) {
        const transformedPOSSales = posSalesData.map((sale: any) => ({
          id: sale.id,
          customer_id: sale.customer_id,
          amount: sale.final_amount,
          method: sale.payment_method,
          device_id: null,
          payment_date: sale.order_date,
          payment_type: 'payment',
          status: sale.status === 'completed' ? 'completed' : 
                  sale.status === 'pending' ? 'pending' : 'failed',
          created_by: sale.created_by,
          created_at: sale.created_at,
          device_name: undefined,
          customer_name: sale.customers?.name || undefined,
          source: 'pos_sale'
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
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <PaymentsContext.Provider value={{ payments, loading, refreshPayments: fetchPayments }}>
      {children}
    </PaymentsContext.Provider>
  );
};

export const usePayments = () => {
  const context = useContext(PaymentsContext);
  if (!context) throw new Error('usePayments must be used within a PaymentsProvider');
  return context;
}; 