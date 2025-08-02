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
    const { data, error } = await supabase
      .from('customer_payments')
      .select(`
        *,
        devices(brand, model),
        customers(name)
      `)
      .order('payment_date', { ascending: false });
    
    if (!error && data) {
      // Transform the data to include device and customer names
      const transformedPayments = data.map((payment: any) => ({
        ...payment,
        device_name: payment.devices 
          ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
          : undefined,
        customer_name: payment.customers?.name || undefined
      }));
      setPayments(transformedPayments);
    } else {
      setPayments([]);
    }
    setLoading(false);
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