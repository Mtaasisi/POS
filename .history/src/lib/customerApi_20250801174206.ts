import { supabase } from './supabaseClient';
import { cacheSetAll, cacheGetAll } from './offlineCache';
import { Customer } from '../types';

// Function to normalize color tag values
function normalizeColorTag(colorTag: string): 'normal' | 'vip' | 'complainer' | 'purchased' {
  if (!colorTag) return 'normal';
  
  const normalized = colorTag.trim().toLowerCase();
  
  // Map common variations to valid values
  const colorMap: { [key: string]: 'normal' | 'vip' | 'complainer' | 'purchased' } = {
    'normal': 'normal',
    'vip': 'vip',
    'complainer': 'complainer',
    'purchased': 'purchased',
    'not normal': 'normal', // Map "not normal" to "normal"
    'new': 'normal',
    'regular': 'normal',
    'standard': 'normal',
    'basic': 'normal',
    'premium': 'vip',
    'important': 'vip',
    'priority': 'vip',
    'problem': 'complainer',
    'issue': 'complainer',
    'buyer': 'purchased',
    'customer': 'purchased',
    'buying': 'purchased'
  };
  
  return colorMap[normalized] || 'normal';
}

// Utility for formatting currency
export function formatCurrency(amount: number) {
  return 'Tsh ' + Number(amount).toLocaleString('en-TZ', { maximumFractionDigits: 0 });
}

export async function fetchAllCustomers() {
  if (navigator.onLine) {
    try {
      console.log('🔍 Fetching customers from database...');
      
      // First, let's get a simple count to see how many customers exist
      const { count, error: countError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Error counting customers:', countError);
        throw countError;
      }
      
      console.log(`📊 Total customers in database: ${count}`);
      
      // Fetch customers with all related data in a single query
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at
        `)
        .limit(1000); // Add explicit limit to see if this helps
      
      if (customersError) {
        console.error('❌ Error fetching customers:', customersError);
        throw customersError;
      }
      
      console.log(`✅ Fetched ${customers.length} customers from database`);
      
      if (customers.length < count) {
        console.warn(`⚠️ Warning: Fetched ${customers.length} customers but database has ${count} total`);
        console.warn('This might be due to a default limit or complex join issues');
      }
      
      // Transform the data to match our frontend types
      const customersWithData = customers.map(customer => {
        // Transform customer notes
        const transformedNotes = (customer.customer_notes || []).map((note: any) => ({
          id: note.id,
          content: note.content,
          createdBy: note.created_by,
          createdAt: note.created_at
        }));

        // Transform customer payments
        const transformedPayments = (customer.customer_payments || []).map((payment: any) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          deviceId: payment.device_id,
          deviceName: undefined, // We'll need to fetch device info separately if needed
          date: payment.payment_date,
          type: payment.payment_type,
          status: payment.status,
          createdBy: payment.created_by,
          createdAt: payment.created_at
        }));

        // Transform promo messages
        const transformedPromoHistory = (customer.promo_messages || []).map((promo: any) => ({
          id: promo.id,
          title: promo.title,
          content: promo.content,
          sentVia: promo.sent_via,
          sentAt: promo.sent_at,
          status: promo.status
        }));

        // Transform devices
        const transformedDevices = (customer.devices || []).map((device: any) => ({
          id: device.id,
          customerId: device.customer_id,
          brand: device.brand,
          model: device.model,
          serialNumber: device.serial_number,
          issueDescription: device.issue_description,
          status: device.status,
          assignedTo: device.assigned_to,
          estimatedHours: device.estimated_hours,
          expectedReturnDate: device.expected_return_date,
          warrantyStart: device.warranty_start,
          warrantyEnd: device.warranty_end,
          warrantyStatus: device.warranty_status,
          repairCount: device.repair_count,
          lastReturnDate: device.last_return_date,
          createdAt: device.created_at,
          updatedAt: device.updated_at
        }));

        // Return customer with all related data
        return {
          ...fromDbCustomer(customer),
          notes: transformedNotes,
          payments: transformedPayments,
          promoHistory: transformedPromoHistory,
          devices: transformedDevices
        };
      });

      console.log(`✅ Successfully processed ${customersWithData.length} customers`);
      await cacheSetAll('customers', customersWithData);
      return customersWithData;
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      // Fallback to cached data if available
      const cachedData = await cacheGetAll('customers');
      if (cachedData.length > 0) {
        console.log(`📦 Using cached data: ${cachedData.length} customers`);
        return cachedData;
      }
      throw error;
    }
  } else {
    console.log('📱 Offline mode - using cached data');
    return await cacheGetAll('customers');
  }
}

export async function fetchAllCustomersSimple() {
  if (navigator.onLine) {
    try {
      console.log('🔍 Fetching customers (simple query)...');
      
      // Simple query without complex joins
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at')
        .limit(1000);
      
      if (customersError) {
        console.error('❌ Error fetching customers (simple):', customersError);
        throw customersError;
      }
      
      console.log(`✅ Fetched ${customers.length} customers (simple query)`);
      
      // Transform the data to match our frontend types
      const customersWithData = customers.map(customer => {
        return {
          ...fromDbCustomer(customer),
          notes: [],
          payments: [],
          promoHistory: [],
          devices: []
        };
      });

      return customersWithData;
    } catch (error) {
      console.error('❌ Error fetching customers (simple):', error);
      throw error;
    }
  } else {
    return await cacheGetAll('customers');
  }
}

export async function fetchCustomerById(customerId: string) {
  if (navigator.onLine) {
    try {
      // Fetch single customer with all related data
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          customer_notes(*),
          customer_payments(
            *,
            devices(brand, model)
          ),
          promo_messages(*),
          devices(*)
        `)
        .eq('id', customerId)
        .single();
      
      if (customersError) throw customersError;
      if (!customers) throw new Error('Customer not found');
      
      // Transform the data to match our frontend types
      const transformedNotes = (customers.customer_notes || []).map((note: any) => ({
        id: note.id,
        content: note.content,
        createdBy: note.created_by,
        createdAt: note.created_at
      }));

      const transformedPayments = (customers.customer_payments || []).map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        deviceId: payment.device_id,
        deviceName: payment.devices 
          ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
          : undefined,
        date: payment.payment_date,
        type: payment.payment_type,
        status: payment.status,
        createdBy: payment.created_by,
        createdAt: payment.created_at
      }));

      const transformedPromoHistory = (customers.promo_messages || []).map((promo: any) => ({
        id: promo.id,
        title: promo.title,
        content: promo.content,
        sentVia: promo.sent_via,
        sentAt: promo.sent_at,
        status: promo.status
      }));

      const transformedDevices = (customers.devices || []).map((device: any) => ({
        id: device.id,
        customerId: device.customer_id,
        brand: device.brand,
        model: device.model,
        serialNumber: device.serial_number,
        issueDescription: device.issue_description,
        status: device.status,
        assignedTo: device.assigned_to,
        estimatedHours: device.estimated_hours,
        expectedReturnDate: device.expected_return_date,
        warrantyStart: device.warranty_start,
        warrantyEnd: device.warranty_end,
        warrantyStatus: device.warranty_status,
        repairCount: device.repair_count,
        lastReturnDate: device.last_return_date,
        createdAt: device.created_at,
        updatedAt: device.updated_at
      }));

      // Return customer with all related data
      return {
        ...fromDbCustomer(customers),
        notes: transformedNotes,
        payments: transformedPayments,
        promoHistory: transformedPromoHistory,
        devices: transformedDevices
      };
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  } else {
    // Fallback to cached data
    const cachedData = await cacheGetAll('customers');
    return cachedData.find(customer => customer.id === customerId);
  }
}

function toDbCustomer(customer: any) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    gender: customer.gender,
    city: customer.city,
    location_description: customer.locationDescription || null,
    national_id: customer.nationalId || null,
    joined_date: customer.joinedDate,
    loyalty_level: customer.loyaltyLevel,
    color_tag: normalizeColorTag(customer.colorTag),
    referred_by: customer.referredBy,
    referrals: customer.referrals,
    total_spent: customer.totalSpent,
    points: customer.points,
    last_visit: customer.lastVisit,
    is_active: customer.isActive,
    // Additional fields
    whatsapp: customer.whatsapp,
    referral_source: customer.referralSource,
    birth_month: customer.birthMonth,
    birth_day: customer.birthDay,
    initial_notes: customer.initialNotes,
    created_at: customer.created_at || new Date().toISOString(),
    updated_at: customer.updated_at || new Date().toISOString(),
  };
}

function fromDbCustomer(db: any) {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    phone: db.phone,
    gender: db.gender,
    city: db.city,
    locationDescription: db.location_description,
    nationalId: db.national_id,
    joinedDate: db.joined_date,
    loyaltyLevel: db.loyalty_level,
    colorTag: db.color_tag,
    referredBy: db.referred_by,
    referrals: db.referrals || [],
    totalSpent: db.total_spent || 0,
    points: db.points || 0,
    lastVisit: db.last_visit,
    isActive: db.is_active,
    // Additional fields from database
    whatsapp: db.whatsapp,
    referralSource: db.referral_source,
    birthMonth: db.birth_month,
    birthDay: db.birth_day,
    initialNotes: db.initial_notes,
    // Initialize empty arrays for related data
    notes: [],
    promoHistory: [],
    payments: [],
    devices: [],
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

export async function addCustomerToDb(customer: Omit<Customer, 'promoHistory' | 'payments' | 'devices'>) {
  // Give new customers 10 points for registration
  const initialPoints = (typeof customer.points === 'number' ? customer.points : 0) + 10;
  // Map the customer data to match the database schema exactly
  // Include all form fields in the database save
  const dbCustomer = {
    id: customer.id,
    name: customer.name,
    email: customer.email || null,
    phone: customer.phone,
    gender: customer.gender || null,
    city: customer.city || null,
    location_description: null,
    national_id: null,
    joined_date: customer.joinedDate,
    loyalty_level: customer.loyaltyLevel,
    color_tag: normalizeColorTag(customer.colorTag),
    referred_by: customer.referredBy || null,
    total_spent: customer.totalSpent,
    points: initialPoints,
    last_visit: customer.lastVisit,
    is_active: customer.isActive,
    // Additional form fields
    whatsapp: customer.whatsapp || null,
    birth_month: customer.birthMonth || null,
    birth_day: customer.birthDay || null,
    referral_source: customer.referralSource || null,
    initial_notes: customer.initialNotes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  console.log('Sending customer data to database:', dbCustomer);
  
  const { error } = await supabase.from('customers').insert([dbCustomer]);
  if (error) {
    console.error('Database error:', error);
    throw error;
  }
  
  // Add note about initial points
  try {
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData?.user?.id;
    
    await supabase.from('customer_notes').insert({
      id: crypto.randomUUID(),
      content: `Added 10 initial loyalty points for new customer registration`,
      created_by: currentUserId || 'system',
      created_at: new Date().toISOString(),
      customer_id: dbCustomer.id
    });
  } catch (noteError) {
    console.warn('Could not add initial points note:', noteError);
  }
  
  return fromDbCustomer(dbCustomer);
}

export async function updateCustomerInDb(customerId: string, updates: Partial<Customer>) {
  // Only include fields that are actually being updated
  const dbUpdates: any = {};
  
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.city !== undefined) dbUpdates.city = updates.city;
  if (updates.joinedDate !== undefined) dbUpdates.joined_date = updates.joinedDate;
  if (updates.loyaltyLevel !== undefined) dbUpdates.loyalty_level = updates.loyaltyLevel;
  if (updates.colorTag !== undefined) dbUpdates.color_tag = normalizeColorTag(updates.colorTag);
  if (updates.referredBy !== undefined) dbUpdates.referred_by = updates.referredBy;
  if (updates.totalSpent !== undefined) dbUpdates.total_spent = updates.totalSpent;
  if (updates.points !== undefined) dbUpdates.points = updates.points;
  if (updates.lastVisit !== undefined) dbUpdates.last_visit = updates.lastVisit;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp;
  if (updates.referralSource !== undefined) dbUpdates.referral_source = updates.referralSource;
  if (updates.birthMonth !== undefined) dbUpdates.birth_month = updates.birthMonth;
  if (updates.birthDay !== undefined) dbUpdates.birth_day = updates.birthDay;
  if (updates.initialNotes !== undefined) dbUpdates.initial_notes = updates.initialNotes;
  
  // Always update the updated_at timestamp
  dbUpdates.updated_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('customers')
    .update(dbUpdates)
    .eq('id', customerId)
    .select();
  if (error) throw error;
  return data && data[0] ? fromDbCustomer(data[0]) : null;
}

export async function deleteCustomerFromDb(customerId: string) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);
  if (error) throw error;
  return true;
} 

// Add missing createCustomer export for backward compatibility
export const createCustomer = addCustomerToDb;

/**
 * Check in a customer (log visit, update last_visit, set active, award points)
 * Returns { success: boolean, message: string }
 */
export async function checkInCustomer(customerId: string, staffId: string): Promise<{ success: boolean; message: string }> {
  // Insert into customer_checkins
  const { error } = await supabase
    .from('customer_checkins')
    .insert({ customer_id: customerId, staff_id: staffId });
  if (error) {
    if (error.code === '23505') {
      // Unique violation: already checked in today
      return { success: false, message: 'Customer already checked in today.' };
    }
    return { success: false, message: error.message };
  }
  // Update customer last_visit and is_active
  await supabase
    .from('customers')
    .update({ last_visit: new Date().toISOString(), is_active: true })
    .eq('id', customerId);
  // Award 5 points to customer (safe increment)
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('points')
    .eq('id', customerId)
    .single();
  if (!customerError && customer && typeof customer.points === 'number') {
    await supabase
      .from('customers')
      .update({ points: customer.points + 5 })
      .eq('id', customerId);
    
    // Add note about check-in points
    try {
      await supabase.from('customer_notes').insert({
        id: crypto.randomUUID(),
        content: `Added 5 loyalty points for customer check-in`,
        created_by: staffId,
        created_at: new Date().toISOString(),
        customer_id: customerId
      });
    } catch (noteError) {
      console.warn('Could not add check-in points note:', noteError);
    }
  }
  // Award 20 points to staff (safe increment)
  const { data: staff, error: staffError } = await supabase
    .from('auth_users')
    .select('points')
    .eq('id', staffId)
    .single();
  if (!staffError && staff && typeof staff.points === 'number') {
    await supabase
      .from('auth_users')
      .update({ points: staff.points + 20 })
      .eq('id', staffId);
  }
  return { success: true, message: 'Check-in successful. 20 points awarded to staff, 5 points to customer.' };
} 