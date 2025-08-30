// Main customer API file - now much smaller and more manageable
// This file serves as the main entry point for customer-related API functions

// Core functions
export {
  formatCurrency,
  fetchAllCustomers,
  fetchAllCustomersSimple,
  fetchCustomerById,
  addCustomerToDb,
  updateCustomerInDb,
  createCustomer
} from './customerApi/core';

// Appointment functions
export {
  fetchAllAppointments,
  fetchCustomerAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStats,
  searchAppointments,
  type Appointment,
  type CreateAppointmentData,
  type UpdateAppointmentData
} from './customerApi/appointments';

// Revenue functions
export {
  fetchCustomerRevenue,
  getCustomerRevenueSummary,
  addCustomerRevenue,
  getAllCustomersRevenueSummary,
  getRevenueByDateRange,
  getTopCustomersByRevenue,
  type CustomerRevenue,
  type CustomerRevenueSummary
} from './customerApi/revenue';

// Search functions
export {
  searchCustomers,
  searchCustomersFast,
  searchCustomersBackground,
  clearSearchCache,
  getSearchCacheStats,
  getBackgroundSearchManager
} from './customerApi/search';

// Additional functions that were in the original file
import { supabase } from './supabaseClient';
import { Customer } from '../types';

// Function to normalize color tag values (moved here for backward compatibility)
function normalizeColorTag(colorTag: string): 'new' | 'vip' | 'complainer' | 'purchased' {
  if (!colorTag) return 'new';
  
  const normalized = colorTag.trim().toLowerCase();
  
  const colorMap: { [key: string]: 'new' | 'vip' | 'complainer' | 'purchased' } = {
    'normal': 'new',
    'vip': 'vip',
    'complainer': 'complainer',
    'purchased': 'purchased',
    'not normal': 'new',
    'new': 'new',
    'regular': 'new',
    'standard': 'new',
    'basic': 'new',
    'premium': 'vip',
    'important': 'vip',
    'priority': 'vip',
    'problem': 'complainer',
    'issue': 'complainer',
    'buyer': 'purchased',
    'customer': 'purchased',
    'buying': 'purchased'
  };
  
  return colorMap[normalized] || 'new';
}

// Pagination function
export async function fetchCustomersPaginated(page: number = 1, pageSize: number = 50) {
  try {
    console.log(`📄 Fetching customers page ${page} with size ${pageSize}`);
    
    const offset = (page - 1) * pageSize;
    
    const { data, error, count } = await supabase
      .from('customers')
      .select(`
        *,
        customer_notes(*),
        customer_payments(*),
        devices(*),
        promo_messages(*)
      `, { count: 'exact' })
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching paginated customers:', error);
      throw error;
    }
    
    if (data) {
      const processedCustomers = data.map(customer => ({
        ...customer,
        colorTag: normalizeColorTag(customer.colorTag || 'new'),
        customerNotes: customer.customer_notes || [],
        customerPayments: customer.customer_payments || [],
        devices: customer.devices || [],
        promoHistory: customer.promo_messages || []
      }));
      
      return {
        customers: processedCustomers,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }
    
    return {
      customers: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    };
    
  } catch (error) {
    console.error('❌ Error fetching paginated customers:', error);
    throw error;
  }
}

// Load customer details function
export async function loadCustomerDetails(customerId: string) {
  try {
    console.log(`🔍 Loading detailed customer data: ${customerId}`);
    
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        customer_notes(*),
        customer_payments(*),
        devices(*),
        promo_messages(*)
      `)
      .eq('id', customerId)
      .single();
    
    if (error) {
      console.error('❌ Error loading customer details:', error);
      throw error;
    }
    
    if (data) {
      const processedCustomer = {
        ...data,
        colorTag: normalizeColorTag(data.colorTag || 'new'),
        customerNotes: data.customer_notes || [],
        customerPayments: data.customer_payments || [],
        devices: data.devices || [],
        promoHistory: data.promo_messages || []
      };
      
      console.log(`✅ Customer details loaded: ${processedCustomer.name}`);
      return processedCustomer;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error loading customer details:', error);
    throw error;
  }
}

// Delete customer function
export async function deleteCustomerFromDb(customerId: string) {
  try {
    console.log(`🗑️ Deleting customer: ${customerId}`);
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);
    
    if (error) {
      console.error('❌ Error deleting customer:', error);
      throw error;
    }
    
    console.log('✅ Customer deleted successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    throw error;
  }
}

// Check in customer function
export async function checkInCustomer(customerId: string, staffId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`📝 Checking in customer: ${customerId} by staff: ${staffId}`);
    
    const { error } = await supabase
      .from('customer_checkins')
      .insert([{
        customer_id: customerId,
        staff_id: staffId,
        checkin_time: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('❌ Error checking in customer:', error);
      return { success: false, message: 'Failed to check in customer' };
    }
    
    console.log('✅ Customer checked in successfully');
    return { success: true, message: 'Customer checked in successfully' };
    
  } catch (error) {
    console.error('❌ Error checking in customer:', error);
    return { success: false, message: 'Failed to check in customer' };
  }
}

// Test customer access function
export async function testCustomerAccess(customerId?: string) {
  try {
    console.log('🔍 Testing customer access...');
    
    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Customer access test failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ Customer access test passed');
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Customer access test failed:', error);
    return { success: false, error };
  }
}

// Test customer query function
export async function testCustomerQuery() {
  try {
    console.log('🔍 Testing basic customer query...');
    
    const { data: simpleData, error: simpleError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError);
      return { success: false, error: simpleError, type: 'simple' };
    }
    
    console.log('✅ Simple query succeeded:', simpleData);
    
    return { success: true, type: 'all' };
    
  } catch (error) {
    console.error('❌ Test query failed:', error);
    return { success: false, error, type: 'exception' };
  }
}