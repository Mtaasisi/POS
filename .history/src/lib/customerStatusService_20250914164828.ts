import { supabase } from './supabaseClient';

export interface CustomerStatusInfo {
  id: string;
  name: string;
  isActive: boolean;
  memberSince: string;
  lastVisit: string;
  daysSinceActivity: number;
  statusReason: string;
}

export interface InactiveCustomer {
  id: string;
  name: string;
  phone: string;
  lastActivityDate: string;
  daysInactive: number;
  createdAt: string;
}

/**
 * Updates customer activity and reactivates them if they were inactive
 */
export async function updateCustomerActivity(customerId: string): Promise<void> {
  try {
    console.log(`🔄 Updating activity for customer: ${customerId}`);
    
    const { error } = await supabase.rpc('update_customer_activity', {
      customer_id: customerId
    });

    if (error) {
      console.error('❌ Error updating customer activity:', error);
      throw error;
    }

    console.log('✅ Customer activity updated successfully');
  } catch (error) {
    console.error('❌ Failed to update customer activity:', error);
    throw error;
  }
}

/**
 * Tracks customer activity from various sources (purchases, visits, etc.)
 */
export async function trackCustomerActivity(
  customerId: string, 
  activityType: string = 'general'
): Promise<void> {
  try {
    console.log(`📊 Tracking ${activityType} activity for customer: ${customerId}`);
    
    const { error } = await supabase.rpc('track_customer_activity', {
      customer_id: customerId,
      activity_type: activityType
    });

    if (error) {
      console.error('❌ Error tracking customer activity:', error);
      throw error;
    }

    console.log('✅ Customer activity tracked successfully');
  } catch (error) {
    console.error('❌ Failed to track customer activity:', error);
    throw error;
  }
}

/**
 * Automatically deactivates customers with no activity for 2+ months
 */
export async function deactivateInactiveCustomers(): Promise<number> {
  try {
    console.log('🔄 Checking for inactive customers to deactivate...');
    
    const { data: affectedCount, error } = await supabase.rpc('deactivate_inactive_customers');

    if (error) {
      console.error('❌ Error deactivating inactive customers:', error);
      throw error;
    }

    console.log(`✅ Deactivated ${affectedCount} inactive customers`);
    return affectedCount;
  } catch (error) {
    console.error('❌ Failed to deactivate inactive customers:', error);
    throw error;
  }
}

/**
 * Gets comprehensive customer status information
 */
export async function getCustomerStatus(customerId: string): Promise<CustomerStatusInfo | null> {
  try {
    console.log(`📊 Getting status for customer: ${customerId}`);
    
    const { data, error } = await supabase.rpc('get_customer_status', {
      customer_id: customerId
    });

    if (error) {
      console.error('❌ Error getting customer status:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No customer found with ID:', customerId);
      return null;
    }

    const status = data[0];
    return {
      id: status.id,
      name: status.name,
      isActive: status.is_active,
      memberSince: status.member_since,
      lastVisit: status.last_visit,
      daysSinceActivity: status.days_since_activity,
      statusReason: status.status_reason
    };
  } catch (error) {
    console.error('❌ Failed to get customer status:', error);
    throw error;
  }
}

/**
 * Gets list of inactive customers
 */
export async function getInactiveCustomers(): Promise<InactiveCustomer[]> {
  try {
    console.log('📊 Getting list of inactive customers...');
    
    const { data, error } = await supabase.rpc('get_inactive_customers');

    if (error) {
      console.error('❌ Error getting inactive customers:', error);
      throw error;
    }

    return data.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      lastActivityDate: customer.last_activity_date,
      daysInactive: customer.days_inactive,
      createdAt: customer.created_at
    }));
  } catch (error) {
    console.error('❌ Failed to get inactive customers:', error);
    throw error;
  }
}

/**
 * Reactivates a customer manually
 */
export async function reactivateCustomer(customerId: string): Promise<void> {
  try {
    console.log(`🔄 Reactivating customer: ${customerId}`);
    
    const { error } = await supabase
      .from('customers')
      .update({ 
        is_active: true,
        last_activity_date: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (error) {
      console.error('❌ Error reactivating customer:', error);
      throw error;
    }

    console.log('✅ Customer reactivated successfully');
  } catch (error) {
    console.error('❌ Failed to reactivate customer:', error);
    throw error;
  }
}

/**
 * Deactivates a customer manually
 */
export async function deactivateCustomer(customerId: string): Promise<void> {
  try {
    console.log(`🔄 Deactivating customer: ${customerId}`);
    
    const { error } = await supabase
      .from('customers')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (error) {
      console.error('❌ Error deactivating customer:', error);
      throw error;
    }

    console.log('✅ Customer deactivated successfully');
  } catch (error) {
    console.error('❌ Failed to deactivate customer:', error);
    throw error;
  }
}

/**
 * Updates customer activity when they make a purchase
 */
export async function trackPurchaseActivity(customerId: string, amount: number): Promise<void> {
  try {
    await trackCustomerActivity(customerId, 'purchase');
    console.log(`💰 Tracked purchase activity for customer ${customerId}: ${amount} TSH`);
  } catch (error) {
    console.error('❌ Failed to track purchase activity:', error);
    throw error;
  }
}

/**
 * Updates customer activity when they visit the store
 */
export async function trackVisitActivity(customerId: string): Promise<void> {
  try {
    await trackCustomerActivity(customerId, 'visit');
    console.log(`🏪 Tracked visit activity for customer ${customerId}`);
  } catch (error) {
    console.error('❌ Failed to track visit activity:', error);
    throw error;
  }
}

/**
 * Checks in a customer and automatically reactivates them if inactive
 */
export async function checkInCustomerWithReactivation(customerId: string, staffId: string): Promise<{ success: boolean; message: string; wasReactivated?: boolean }> {
  try {
    console.log(`📝 Checking in customer with auto-reactivation: ${customerId}`);
    
    // Check current customer status
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('is_active, name')
      .eq('id', customerId)
      .single();

    let wasReactivated = false;

    if (!fetchError && customer && !customer.is_active) {
      console.log(`🔄 Customer ${customer.name} is inactive, reactivating...`);
      await reactivateCustomer(customerId);
      console.log(`✅ Customer ${customer.name} reactivated automatically`);
      wasReactivated = true;
    }

    // Record the check-in
    const { error: checkinError } = await supabase
      .from('customer_checkins')
      .insert([{
        customer_id: customerId,
        staff_id: staffId,
        checkin_at: new Date().toISOString()
      }]);

    if (checkinError) {
      console.error('❌ Error recording check-in:', checkinError);
      return { success: false, message: 'Failed to record check-in' };
    }

    // Track customer activity for the check-in
    await trackCustomerActivity(customerId, 'checkin');
    
    const message = wasReactivated 
      ? 'Customer checked in and reactivated successfully!' 
      : 'Customer checked in successfully!';
    
    console.log('✅ Customer check-in completed successfully');
    return { success: true, message, wasReactivated };
    
  } catch (error) {
    console.error('❌ Failed to check in customer with reactivation:', error);
    return { success: false, message: 'Failed to check in customer' };
  }
}

/**
 * Updates customer activity when they have a repair/service
 */
export async function trackServiceActivity(customerId: string): Promise<void> {
  try {
    await trackCustomerActivity(customerId, 'service');
    console.log(`🔧 Tracked service activity for customer ${customerId}`);
  } catch (error) {
    console.error('❌ Failed to track service activity:', error);
    throw error;
  }
}

/**
 * Updates customer activity when they communicate (SMS, WhatsApp)
 */
export async function trackCommunicationActivity(customerId: string): Promise<void> {
  try {
    await trackCustomerActivity(customerId, 'communication');
    console.log(`💬 Tracked communication activity for customer ${customerId}`);
  } catch (error) {
    console.error('❌ Failed to track communication activity:', error);
    throw error;
  }
}

/**
 * Runs the automatic customer status management (should be called periodically)
 */
export async function runCustomerStatusManagement(): Promise<{
  deactivatedCount: number;
  processedAt: string;
}> {
  try {
    console.log('🔄 Running customer status management...');
    
    const deactivatedCount = await deactivateInactiveCustomers();
    
    return {
      deactivatedCount,
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to run customer status management:', error);
    throw error;
  }
}
