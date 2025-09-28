import { supabase } from '../supabaseClient';

export interface CustomerReturn {
  id: string;
  device_id?: string;
  manual_device_brand?: string;
  manual_device_model?: string;
  manual_device_serial?: string;
  customer_id: string;
  reason: string;
  intake_checklist?: any;
  status: 'under-return-review' | 'return-accepted' | 'return-rejected' | 'return-resolved' | 'return-refunded' | 'return-exchanged';
  attachments?: any;
  resolution?: string;
  staff_signature?: string;
  customer_signature?: string;
  created_at: string;
  updated_at: string;
  purchase_date?: string;
  return_type?: 'refund' | 'exchange' | 'store-credit';
  branch?: string;
  staff_name?: string;
  contact_confirmed: boolean;
  accessories?: any;
  condition_description?: string;
  customer_reported_issue?: string;
  staff_observed_issue?: string;
  customer_satisfaction?: number;
  preferred_contact?: string;
  return_auth_number?: string;
  return_method?: string;
  return_shipping_fee?: string;
  expected_pickup_date?: string;
  geo_location?: any;
  policy_acknowledged: boolean;
  device_locked?: string;
  privacy_wiped: boolean;
  internal_notes?: string;
  escalation_required: boolean;
  additional_docs?: any;
  refund_amount?: number;
  exchange_device_id?: string;
  restocking_fee?: number;
  refund_method?: 'cash' | 'card' | 'transfer' | 'store-credit';
  user_ip?: string;
  user_location?: string;
}

// Fetch returns for a specific customer
export async function fetchCustomerReturns(customerId: string): Promise<CustomerReturn[]> {
  try {
    console.log(`🔄 Fetching returns for customer: ${customerId}`);
    
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching customer returns:', error);
      throw error;
    }
    
    console.log(`✅ Fetched ${data?.length || 0} returns for customer`);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching customer returns:', error);
    return [];
  }
}

// Create a new return
export async function createCustomerReturn(returnData: Partial<CustomerReturn>): Promise<CustomerReturn | null> {
  try {
    console.log('🔄 Creating new return...');
    
    const { data, error } = await supabase
      .from('returns')
      .insert([returnData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating return:', error);
      throw error;
    }
    
    console.log('✅ Return created successfully');
    return data;
  } catch (error) {
    console.error('❌ Error creating return:', error);
    return null;
  }
}

// Update return status
export async function updateReturnStatus(returnId: string, status: CustomerReturn['status'], resolution?: string): Promise<boolean> {
  try {
    console.log(`🔄 Updating return status: ${returnId} to ${status}`);
    
    const updateData: any = { status };
    if (resolution) {
      updateData.resolution = resolution;
    }
    
    const { error } = await supabase
      .from('returns')
      .update(updateData)
      .eq('id', returnId);
    
    if (error) {
      console.error('❌ Error updating return status:', error);
      throw error;
    }
    
    console.log('✅ Return status updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating return status:', error);
    return false;
  }
}

// Get return statistics for a customer
export async function getCustomerReturnStats(customerId: string) {
  try {
    const returns = await fetchCustomerReturns(customerId);
    
    const stats = {
      total: returns.length,
      pending: returns.filter(r => r.status === 'under-return-review').length,
      accepted: returns.filter(r => r.status === 'return-accepted').length,
      resolved: returns.filter(r => r.status === 'return-resolved').length,
      refunded: returns.filter(r => r.status === 'return-refunded').length,
      exchanged: returns.filter(r => r.status === 'return-exchanged').length,
      rejected: returns.filter(r => r.status === 'return-rejected').length,
      totalRefundAmount: returns
        .filter(r => r.refund_amount)
        .reduce((sum, r) => sum + (r.refund_amount || 0), 0)
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting return stats:', error);
    return {
      total: 0,
      pending: 0,
      accepted: 0,
      resolved: 0,
      refunded: 0,
      exchanged: 0,
      rejected: 0,
      totalRefundAmount: 0
    };
  }
}
