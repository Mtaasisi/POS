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
import { trackCustomerActivity, reactivateCustomer } from './customerStatusService';

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
        id, name, email, phone, created_at
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
        // Map database fields to application interface
        joined_date: customer.created_at,
        colorTag: normalizeColorTag(customer.color_tag || 'new'),
        customerNotes: [],
        customerPayments: [],
        devices: [],
        promoHistory: []
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
        id,
        name,
        phone,
        email,
        gender,
        city,
        color_tag,
        loyalty_level,
        points,
        total_spent,
        last_visit,
        is_active,
        referral_source,
        birth_month,
        birth_day,
        total_returns,
        profile_image,
        whatsapp,
        whatsapp_opt_out,
        notes,
        referrals,
        customer_tag,
        created_at,
        updated_at,
        created_by,
        last_purchase_date,
        total_purchases,
        birthday,
        referred_by,
        total_calls,
        total_call_duration_minutes,
        incoming_calls,
        outgoing_calls,
        missed_calls,
        avg_call_duration_minutes,
        first_call_date,
        last_call_date,
        call_loyalty_level
      `)
      .eq('id', customerId)
      .single();
    
    if (error) {
      console.error('❌ Error loading customer details:', error);
      throw error;
    }
    
    if (data) {
      const processedCustomer = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        gender: data.gender || 'other',
        city: data.city || '',
        colorTag: normalizeColorTag(data.color_tag || 'new'),
        loyaltyLevel: data.loyalty_level || 'bronze',
        points: data.points || 0,
        totalSpent: data.total_spent || 0,
        lastVisit: data.last_visit || data.created_at,
        isActive: data.is_active !== false, // Default to true if null
        referralSource: data.referral_source,
        birthMonth: data.birth_month,
        birthDay: data.birth_day,
        totalReturns: data.total_returns || 0,
        profileImage: data.profile_image,
        whatsapp: data.whatsapp,
        whatsappOptOut: data.whatsapp_opt_out || false,
        notes: data.notes ? (typeof data.notes === 'string' ? 
          (() => {
            try { return JSON.parse(data.notes); } 
            catch { return []; }
          })() : data.notes) : [],
        referrals: data.referrals ? (typeof data.referrals === 'string' ? 
          (() => {
            try { return JSON.parse(data.referrals); } 
            catch { return []; }
          })() : data.referrals) : [],
        customerTag: data.customer_tag,
        joinedDate: data.created_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        lastPurchaseDate: data.last_purchase_date,
        totalPurchases: data.total_purchases || 0,
        birthday: data.birthday,
        referredBy: data.referred_by,
        // Call analytics fields
        totalCalls: data.total_calls || 0,
        totalCallDurationMinutes: data.total_call_duration_minutes || 0,
        incomingCalls: data.incoming_calls || 0,
        outgoingCalls: data.outgoing_calls || 0,
        missedCalls: data.missed_calls || 0,
        avgCallDurationMinutes: data.avg_call_duration_minutes || 0,
        firstCallDate: data.first_call_date || '',
        lastCallDate: data.last_call_date || '',
        callLoyaltyLevel: data.call_loyalty_level || 'Basic',
        // Additional fields for interface compatibility
        customerNotes: [],
        customerPayments: [],
        devices: [],
        promoHistory: []
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
    
    // First, check if customer is inactive and reactivate them
    try {
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('is_active, name')
        .eq('id', customerId)
        .single();

      if (!fetchError && customer && !customer.is_active) {
        console.log(`🔄 Customer ${customer.name} is inactive, reactivating...`);
        await reactivateCustomer(customerId);
        console.log(`✅ Customer ${customer.name} reactivated automatically`);
      }
    } catch (reactivationError) {
      console.warn('⚠️ Failed to check/reactivate customer status:', reactivationError);
      // Continue with check-in even if reactivation fails
    }
    
    // Record the check-in
    const { error } = await supabase
      .from('customer_checkins')
      .insert([{
        customer_id: customerId,
        staff_id: staffId,
        checkin_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('❌ Error checking in customer:', error);
      return { success: false, message: 'Failed to check in customer' };
    }
    
    // Track customer activity for the check-in
    try {
      await trackCustomerActivity(customerId, 'checkin');
      console.log('📊 Check-in activity tracked successfully');
    } catch (activityError) {
      console.warn('⚠️ Failed to track check-in activity:', activityError);
      // Don't fail the check-in if activity tracking fails
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