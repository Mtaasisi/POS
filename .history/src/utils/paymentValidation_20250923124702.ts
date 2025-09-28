import { supabase } from '../lib/supabaseClient';

export interface PaymentValidationResult {
  valid: boolean;
  message?: string;
  totalCost: number;
  totalPaid: number;
  totalPending: number;
  sparePartsCost: number;
  repairCost: number;
  amountDue: number;
}

export interface DevicePaymentInfo {
  repairCost: number;
  sparePartsCost: number;
  totalPaid: number;
  totalPending: number;
  payments: Array<{
    id: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    payment_type: 'payment' | 'deposit' | 'refund';
    method: string;
    payment_date: string;
  }>;
}

/**
 * Get comprehensive payment information for a device including spare parts costs
 */
export const getDevicePaymentInfo = async (deviceId: string): Promise<DevicePaymentInfo> => {
  try {
    // Get device repair cost and pricing information
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('repair_cost, repair_price, deposit_amount')
      .eq('id', deviceId)
      .single();

    if (deviceError) {
      console.error('Error fetching device repair cost:', deviceError);
    }

    // Get spare parts costs - include all parts regardless of status for payment calculation
    const { data: repairParts, error: partsError } = await supabase
      .from('repair_parts')
      .select('total_cost, status')
      .eq('device_id', deviceId);

    if (partsError) {
      console.error('Error fetching repair parts:', partsError);
    }

    // Calculate spare parts cost - include all parts that are needed, received, or used
    const sparePartsCost = repairParts
      ?.filter(part => ['needed', 'received', 'used'].includes(part.status))
      .reduce((total, part) => total + (part.total_cost || 0), 0) || 0;

    // Get all payments for this device
    const { data: payments, error: paymentsError } = await supabase
      .from('customer_payments')
      .select('id, amount, status, payment_type, method, payment_date')
      .eq('device_id', deviceId)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }

    const totalPaid = payments
      ?.filter(payment => payment.status === 'completed')
      .reduce((total, payment) => total + payment.amount, 0) || 0;

    const totalPending = payments
      ?.filter(payment => payment.status === 'pending')
      .reduce((total, payment) => total + payment.amount, 0) || 0;

    const repairCost = device?.repair_cost || 0;
    const totalCost = repairCost + sparePartsCost;

    return {
      repairCost,
      sparePartsCost,
      totalPaid,
      totalPending,
      payments: payments || []
    };
  } catch (error) {
    console.error('Error getting device payment info:', error);
    return {
      repairCost: 0,
      sparePartsCost: 0,
      totalPaid: 0,
      totalPending: 0,
      payments: []
    };
  }
};

/**
 * Validate if device can be given to customer (all payments must be completed)
 */
export const validateDeviceHandover = async (deviceId: string): Promise<PaymentValidationResult> => {
  try {
    const paymentInfo = await getDevicePaymentInfo(deviceId);
    
    const { repairCost, sparePartsCost, totalPaid, totalPending } = paymentInfo;
    const totalCost = repairCost + sparePartsCost;
    const amountDue = totalCost - totalPaid;

    // If no costs are set, allow handover
    if (totalCost === 0) {
      return {
        valid: true,
        totalCost: 0,
        totalPaid: 0,
        totalPending: 0,
        sparePartsCost: 0,
        repairCost: 0,
        amountDue: 0
      };
    }

    // Check for pending payments
    if (totalPending > 0) {
      return {
        valid: false,
        message: `Cannot give device to customer. ${formatCurrency(totalPending)} in pending payments must be completed first.`,
        totalCost,
        totalPaid,
        totalPending,
        sparePartsCost,
        repairCost,
        amountDue
      };
    }

    // Check if all costs are paid
    if (totalPaid < totalCost) {
      const breakdown = [];
      if (repairCost > 0) breakdown.push(`Repair: ${formatCurrency(repairCost)}`);
      if (sparePartsCost > 0) breakdown.push(`Parts: ${formatCurrency(sparePartsCost)}`);
      
      return {
        valid: false,
        message: `Cannot give device to customer. Total cost (${formatCurrency(totalCost)}) not fully paid. Amount due: ${formatCurrency(amountDue)}. Breakdown: ${breakdown.join(', ')}`,
        totalCost,
        totalPaid,
        totalPending,
        sparePartsCost,
        repairCost,
        amountDue
      };
    }

    return {
      valid: true,
      totalCost,
      totalPaid,
      totalPending,
      sparePartsCost,
      repairCost,
      amountDue
    };
  } catch (error) {
    console.error('Error validating device handover:', error);
    return {
      valid: false,
      message: 'Error validating payments. Please try again.',
      totalCost: 0,
      totalPaid: 0,
      totalPending: 0,
      sparePartsCost: 0,
      repairCost: 0,
      amountDue: 0
    };
  }
};

/**
 * Create pending payment records for repair cost and spare parts
 */
export const createPendingPayments = async (deviceId: string, customerId: string): Promise<boolean> => {
  try {
    const paymentInfo = await getDevicePaymentInfo(deviceId);
    const paymentsToCreate = [];

    // Create pending payment for repair cost if it exists and no payment record exists
    if (paymentInfo.repairCost > 0) {
      const hasRepairPayment = paymentInfo.payments.some(p => 
        p.payment_type === 'payment' && p.status === 'pending'
      );
      
      if (!hasRepairPayment) {
        paymentsToCreate.push({
          customer_id: customerId,
          device_id: deviceId,
          amount: paymentInfo.repairCost,
          method: 'cash',
          payment_type: 'payment',
          status: 'pending',
          payment_date: new Date().toISOString(),
          notes: 'Repair cost payment'
        });
      }
    }

    // Create pending payment for spare parts if they exist and no payment record exists
    if (paymentInfo.sparePartsCost > 0) {
      const hasPartsPayment = paymentInfo.payments.some(p => 
        p.payment_type === 'payment' && p.notes?.includes('spare parts')
      );
      
      if (!hasPartsPayment) {
        paymentsToCreate.push({
          customer_id: customerId,
          device_id: deviceId,
          amount: paymentInfo.sparePartsCost,
          method: 'cash',
          payment_type: 'payment',
          status: 'pending',
          payment_date: new Date().toISOString(),
          notes: 'Spare parts cost payment'
        });
      }
    }

    // Insert pending payments if any were created
    if (paymentsToCreate.length > 0) {
      const { error } = await supabase
        .from('customer_payments')
        .insert(paymentsToCreate);

      if (error) {
        console.error('Error creating pending payments:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error creating pending payments:', error);
    return false;
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Get payment summary for display
 */
export const getPaymentSummary = (paymentInfo: DevicePaymentInfo): string => {
  const { repairCost, sparePartsCost, totalPaid, totalPending } = paymentInfo;
  const totalCost = repairCost + sparePartsCost;
  const amountDue = totalCost - totalPaid;

  const parts = [];
  if (repairCost > 0) parts.push(`Repair: ${formatCurrency(repairCost)}`);
  if (sparePartsCost > 0) parts.push(`Parts: ${formatCurrency(sparePartsCost)}`);
  
  let summary = `Total: ${formatCurrency(totalCost)}`;
  if (parts.length > 0) {
    summary += ` (${parts.join(', ')})`;
  }
  
  summary += ` | Paid: ${formatCurrency(totalPaid)}`;
  
  if (totalPending > 0) {
    summary += ` | Pending: ${formatCurrency(totalPending)}`;
  }
  
  if (amountDue > 0) {
    summary += ` | Due: ${formatCurrency(amountDue)}`;
  }

  return summary;
};
