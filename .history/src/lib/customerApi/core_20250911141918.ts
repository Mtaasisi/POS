import { supabase } from '../supabaseClient';
import { Customer } from '../../types';

// Configuration constants to prevent resource exhaustion
const BATCH_SIZE = 50; // Maximum customers per batch
const REQUEST_DELAY = 100; // Delay between batches in milliseconds
const MAX_CONCURRENT_REQUESTS = 10; // Maximum concurrent requests
const MAX_RETRIES = 3; // Maximum retry attempts for failed requests
const RETRY_DELAY = 1000; // Delay between retries in milliseconds
const REQUEST_TIMEOUT = 30000; // Default timeout for requests in milliseconds

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

// Helper function to check if supabase is initialized
function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  return supabase;
}

// Retry wrapper function for network requests
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a network error that should be retried
      const isNetworkError = 
        error.message?.includes('QUIC_PROTOCOL_ERROR') ||
        error.message?.includes('net::ERR_QUIC_PROTOCOL_ERROR') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.code === 'NETWORK_ERROR' ||
        error.name === 'NetworkError';
      
      if (!isNetworkError || attempt === maxRetries) {
        throw error;
      }
      
      console.log(`🔄 Retry attempt ${attempt}/${maxRetries} after network error:`, error.message);
      
      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError;
}

// Timeout wrapper function to prevent hanging requests
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = REQUEST_TIMEOUT
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// Network status check function
export function checkNetworkStatus() {
  const status = {
    online: navigator.onLine,
    connectionType: 'unknown' as string,
    effectiveType: 'unknown' as string,
    downlink: 0,
    rtt: 0,
    saveData: false
  };
  
  // Check for Network Information API
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      status.connectionType = connection.effectiveType || 'unknown';
      status.effectiveType = connection.effectiveType || 'unknown';
      status.downlink = connection.downlink || 0;
      status.rtt = connection.rtt || 0;
      status.saveData = connection.saveData || false;
    }
  }
  
  return status;
}

// Connection quality indicator
export function getConnectionQuality() {
  const status = checkNetworkStatus();
  
  if (!status.online) {
    return { quality: 'offline', message: 'No internet connection' };
  }
  
  if (status.effectiveType === 'slow-2g' || status.effectiveType === '2g') {
    return { quality: 'poor', message: 'Slow connection detected' };
  }
  
  if (status.effectiveType === '3g') {
    return { quality: 'fair', message: 'Moderate connection speed' };
  }
  
  if (status.effectiveType === '4g') {
    return { quality: 'good', message: 'Good connection speed' };
  }
  
  return { quality: 'unknown', message: 'Connection quality unknown' };
}

// Function to normalize color tag values
function normalizeColorTag(colorTag: string): 'new' | 'vip' | 'complainer' | 'purchased' {
  if (!colorTag) return 'new';
  
  const normalized = colorTag.trim().toLowerCase();
  
  // Map common variations to valid values
  const colorMap: { [key: string]: 'new' | 'vip' | 'complainer' | 'purchased' } = {
    'normal': 'new',
    'vip': 'vip',
    'complainer': 'complainer',
    'purchased': 'purchased',
    'not normal': 'new', // Map "not normal" to "new"
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

// Utility for formatting currency with full numbers
export function formatCurrency(amount: number) {
  const formatted = Number(amount).toLocaleString('en-TZ', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });
  return 'Tsh ' + formatted;
}

export async function fetchAllCustomers() {
  // Check if there's already a request in progress
  const cacheKey = 'fetchAllCustomers';
  if (requestCache.has(cacheKey)) {
    console.log('🔄 Returning existing fetchAllCustomers request');
    return requestCache.get(cacheKey);
  }

  // Create new request
  const requestPromise = performFetchAllCustomers();
  requestCache.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Clean up cache after request completes (success or failure)
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, 1000); // Keep in cache for 1 second to prevent rapid re-requests
  }
}

async function performFetchAllCustomers() {
  if (navigator.onLine) {
    try {
      console.log('🔍 Fetching customers from database...');
      
      // First, let's get a simple count to see how many customers exist
      const { count, error: countError } = await withTimeout(
        retryRequest(async () => {
          const result = await checkSupabase()
            .from('customers')
            .select('*', { count: 'exact', head: true });
          
          if (result.error) {
            throw result.error;
          }
          return result;
        }),
        REQUEST_TIMEOUT
      );
      
      if (countError) {
        console.error('❌ Error counting customers:', countError);
        throw countError;
      }
      
      console.log(`📊 Total customers in database: ${count}`);
      
      // Use pagination to fetch customers in batches to avoid overwhelming the browser
      const pageSize = BATCH_SIZE; // Use configured batch size
      const totalPages = Math.ceil((count || 0) / pageSize);
      const allCustomers = [];
      
      // Prevent infinite loops by limiting maximum pages
      const maxPages = Math.min(totalPages, 100);
      
      console.log(`📄 Fetching ${maxPages} pages of customers with batch size ${pageSize}...`);
      
      // Fetch customers page by page with controlled concurrency and timeout protection
      for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Fetching page ${page}/${maxPages}...`);
        
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        try {
          const { data: pageData, error: pageError } = await withTimeout(
            retryRequest(async () => {
              const result = await checkSupabase()
                .from('customers')
                .select(`
                  id, name, email, phone, gender, city, birth_month, birth_day, total_returns, profile_image, created_at, updated_at, whatsapp, notes, is_active, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, created_by, referral_source, initial_notes, referrals, customer_tag
                `)
                .range(from, to)
                .order('created_at', { ascending: false });
              
              if (result.error) {
                throw result.error;
              }
              return result;
            }),
            REQUEST_TIMEOUT
          );
          
          if (pageError) {
            console.error(`❌ Error fetching page ${page}:`, pageError);
            throw pageError;
          }
          
          if (pageData) {
            // Process and normalize the data
            const processedCustomers = pageData.map(customer => {
              // Map snake_case database fields to camelCase interface fields
              const mappedCustomer = {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                gender: customer.gender,
                city: customer.city,
                joinedDate: customer.joined_date,
                loyaltyLevel: customer.loyalty_level,
                colorTag: normalizeColorTag(customer.color_tag || 'new'),
                referredBy: customer.referred_by,
                totalSpent: customer.total_spent,
                points: customer.points,
                lastVisit: customer.last_visit,
                isActive: customer.is_active,
                referralSource: customer.referral_source,
                birthMonth: customer.birth_month,
                birthDay: customer.birth_day,
                totalReturns: customer.total_returns,
                profileImage: customer.profile_image,
                createdAt: customer.created_at,
                updatedAt: customer.updated_at,
                createdBy: customer.created_by,
                lastPurchaseDate: customer.last_purchase_date,
                totalPurchases: customer.total_purchases,
                birthday: customer.birthday,
                whatsapp: customer.whatsapp,
                whatsappOptOut: customer.whatsapp_opt_out,
                initialNotes: customer.initial_notes,
                notes: customer.notes ? (typeof customer.notes === 'string' ? 
                  (() => {
                    try { return JSON.parse(customer.notes); } 
                    catch { return []; }
                  })() : customer.notes) : [],
                referrals: customer.referrals ? (typeof customer.referrals === 'string' ? 
                  (() => {
                    try { return JSON.parse(customer.referrals); } 
                    catch { return []; }
                  })() : customer.referrals) : [],
                customerTag: customer.customer_tag,
                // Additional fields for interface compatibility
                customerNotes: [],
                customerPayments: [],
                devices: [],
                promoHistory: []
              };
              return mappedCustomer;
            });
            
            allCustomers.push(...processedCustomers);
            console.log(`✅ Page ${page} fetched: ${pageData.length} customers`);
          }
          
          // Add delay between requests to prevent overwhelming the server
          if (page < maxPages) {
            await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
          }
          
        } catch (error) {
          console.error(`❌ Failed to fetch page ${page}:`, error);
          // Continue with partial data rather than failing completely
          console.log(`⚠️ Continuing with ${allCustomers.length} customers from ${page - 1} pages`);
          break;
        }
      }
      
      console.log(`🎉 Successfully fetched ${allCustomers.length} customers`);
      return allCustomers;
      
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      throw error;
    }
  } else {
    console.log('📱 Offline mode: Loading customers from cache...');
    // Load from cache when offline
    const cachedCustomers = await import('../offlineCache').then(m => m.cacheGetAll('customers'));
    return cachedCustomers || [];
  }
}

export async function fetchAllCustomersSimple() {
  // Check if there's already a request in progress
  const cacheKey = 'fetchAllCustomersSimple';
  if (requestCache.has(cacheKey)) {
    console.log('🔄 Returning existing fetchAllCustomersSimple request');
    return requestCache.get(cacheKey);
  }

  // Create new request
  const requestPromise = performFetchAllCustomersSimple();
  requestCache.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Clean up cache after request completes (success or failure)
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, 1000); // Keep in cache for 1 second to prevent rapid re-requests
  }
}

async function performFetchAllCustomersSimple() {
  if (navigator.onLine) {
    try {
      console.log('🔍 Fetching customers (simple) from database...');
      
      const { data, error } = await withTimeout(
        retryRequest(async () => {
          const result = await checkSupabase()
            .from('customers')
            .select(`
              id,
              name,
              phone,
              email,
              color_tag,
              points,
              created_at,
              updated_at
            `)
            .order('created_at', { ascending: false });
          
          if (result.error) {
            throw result.error;
          }
          return result;
        }),
        REQUEST_TIMEOUT
      );
      
      if (error) {
        console.error('❌ Error fetching customers (simple):', error);
        throw error;
      }
      
      if (data) {
        // Process and normalize the data
        const processedCustomers = data.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          colorTag: normalizeColorTag(customer.color_tag || 'new'),
          points: customer.points,
          createdAt: customer.created_at,
          updatedAt: customer.updated_at
        }));
        
        console.log(`✅ Successfully fetched ${processedCustomers.length} customers (simple)`);
        return processedCustomers;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Error fetching customers (simple):', error);
      throw error;
    }
  } else {
    console.log('📱 Offline mode: Loading customers from cache...');
    // Load from cache when offline
    const cachedCustomers = await import('../offlineCache').then(m => m.cacheGetAll('customers'));
    return cachedCustomers || [];
  }
}

export async function fetchCustomerById(customerId: string) {
  try {
    console.log(`🔍 Fetching customer by ID: ${customerId}`);
    
    const { data, error } = await checkSupabase()
      .from('customers')
      .select(`
        id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, birth_month, birth_day, referral_source, total_returns, profile_image, created_at, updated_at, created_by, last_purchase_date, total_purchases, birthday, whatsapp, whatsapp_opt_out, initial_notes, notes, referrals, customer_tag
      `)
      .eq('id', customerId)
      .single();
    
    if (error) {
      console.error('❌ Error fetching customer by ID:', error);
      throw error;
    }
    
    if (data) {
      // Process and normalize the data
      const processedCustomer = {
        ...data,
        colorTag: normalizeColorTag(data.color_tag || 'new'),
        customerNotes: [],
        customerPayments: [],
        devices: [],
        promoHistory: []
      };
      
      console.log(`✅ Successfully fetched customer: ${processedCustomer.name}`);
      return processedCustomer;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error fetching customer by ID:', error);
    throw error;
  }
}

export async function addCustomerToDb(customer: Omit<Customer, 'promoHistory' | 'payments' | 'devices'>) {
  try {
    console.log('➕ Adding customer to database:', customer.name);
    
    // Map camelCase fields to snake_case database fields
    const fieldMapping: Record<string, string> = {
      colorTag: 'color_tag',
      isActive: 'is_active',
      lastVisit: 'last_visit',
      joinedDate: 'joined_date',
      loyaltyLevel: 'loyalty_level',
      totalSpent: 'total_spent',
      referredBy: 'referred_by',
      referralSource: 'referral_source',
      birthMonth: 'birth_month',
      birthDay: 'birth_day',
      totalReturns: 'total_returns',
      initialNotes: 'initial_notes',
      locationDescription: 'location_description',
      nationalId: 'national_id',
      profileImage: 'profile_image',
      createdBy: 'created_by',
      loyaltyTier: 'loyalty_tier',
      loyaltyJoinDate: 'loyalty_join_date',
      loyaltyLastVisit: 'loyalty_last_visit',
      loyaltyRewardsRedeemed: 'loyalty_rewards_redeemed',
      loyaltyTotalSpent: 'loyalty_total_spent',
      isLoyaltyMember: 'is_loyalty_member'
    };
    
    // Map customer fields to database fields
    const dbCustomer: any = {};
    Object.entries(customer).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const dbFieldName = fieldMapping[key] || key;
        dbCustomer[dbFieldName] = value;
      }
    });
    
    // Normalize color tag
    if (dbCustomer.color_tag) {
      dbCustomer.color_tag = normalizeColorTag(dbCustomer.color_tag);
    }
    
    const { data, error } = await checkSupabase()
      .from('customers')
      .insert([dbCustomer])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error adding customer:', error);
      throw error;
    }
    
    console.log('✅ Customer added successfully:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error adding customer:', error);
    throw error;
  }
}

export async function updateCustomerInDb(customerId: string, updates: Partial<Customer>) {
  try {
    console.log(`🔄 Updating customer: ${customerId}`);
    
    // Map camelCase fields to snake_case database fields
    const fieldMapping: Record<string, string> = {
      colorTag: 'color_tag',
      isActive: 'is_active',
      lastVisit: 'last_visit',
      joinedDate: 'joined_date',
      loyaltyLevel: 'loyalty_level',
      totalSpent: 'total_spent',
      referredBy: 'referred_by',
      referralSource: 'referral_source',
      birthMonth: 'birth_month',
      birthDay: 'birth_day',
      totalReturns: 'total_returns',
      initialNotes: 'initial_notes',
      locationDescription: 'location_description',
      nationalId: 'national_id',
      profileImage: 'profile_image',
      createdBy: 'created_by',
      loyaltyTier: 'loyalty_tier',
      loyaltyJoinDate: 'loyalty_join_date',
      loyaltyLastVisit: 'loyalty_last_visit',
      loyaltyRewardsRedeemed: 'loyalty_rewards_redeemed',
      loyaltyTotalSpent: 'loyalty_total_spent',
      isLoyaltyMember: 'is_loyalty_member'
    };
    
    // Filter out undefined values and map field names
    const cleanUpdates: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const dbFieldName = fieldMapping[key] || key;
        cleanUpdates[dbFieldName] = value;
      }
    });
    
    // Add updated_at timestamp
    cleanUpdates.updated_at = new Date().toISOString();
    
    // Handle colorTag normalization (now mapped to color_tag)
    if (cleanUpdates.color_tag) {
      cleanUpdates.color_tag = normalizeColorTag(cleanUpdates.color_tag);
    }
    
    console.log('🔧 Clean updates:', cleanUpdates);
    
    // Validate that we're not trying to update invalid fields
    const validFields = [
      'id', 'name', 'email', 'phone', 'gender', 'city', 'joined_date', 'loyalty_level', 
      'color_tag', 'referred_by', 'total_spent', 'points', 'last_visit', 'last_purchase_date', 
      'total_purchases', 'birthday', 'is_active', 'referral_source', 'birth_month', 'birth_day', 
      'total_returns', 'profile_image', 'created_at', 'updated_at', 'created_by', 'whatsapp', 
      'whatsapp_opt_out', 'initial_notes', 'notes', 'referrals', 'customer_tag'
    ];
    
    // Filter out any invalid fields and handle data type conversions
    const validatedUpdates: any = {};
    Object.entries(cleanUpdates).forEach(([key, value]) => {
      if (validFields.includes(key)) {
        // Handle special data type conversions
        if (key === 'notes' && Array.isArray(value)) {
          // Convert CustomerNote[] to string for database storage
          validatedUpdates[key] = JSON.stringify(value);
        } else if (key === 'referrals' && Array.isArray(value)) {
          // Convert referrals array to string for database storage
          validatedUpdates[key] = JSON.stringify(value);
        } else if (key === 'points' && typeof value === 'string') {
          // Convert string points to number
          validatedUpdates[key] = parseInt(value, 10) || 0;
        } else if (key === 'total_spent' && typeof value === 'string') {
          // Convert string total_spent to number
          validatedUpdates[key] = parseFloat(value) || 0;
        } else if (key === 'total_returns' && typeof value === 'string') {
          // Convert string total_returns to number
          validatedUpdates[key] = parseInt(value, 10) || 0;
        } else if (key === 'total_purchases' && typeof value === 'string') {
          // Convert string total_purchases to number
          validatedUpdates[key] = parseInt(value, 10) || 0;
        } else if (key === 'is_active' && typeof value === 'string') {
          // Convert string boolean to actual boolean
          validatedUpdates[key] = value === 'true' || value === '1';
        } else if (key === 'whatsapp_opt_out' && typeof value === 'string') {
          // Convert string boolean to actual boolean
          validatedUpdates[key] = value === 'true' || value === '1';
        } else {
          validatedUpdates[key] = value;
        }
      } else {
        console.warn(`⚠️ Skipping invalid field: ${key}`);
      }
    });
    
    console.log('🔧 Validated updates:', validatedUpdates);
    
    const { data, error } = await checkSupabase()
      .from('customers')
      .update(validatedUpdates)
      .eq('id', customerId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating customer:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      console.error('❌ Update data that caused error:', validatedUpdates);
      throw error;
    }
    
    console.log('✅ Customer updated successfully:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    throw error;
  }
}

// Alias for backward compatibility
export const createCustomer = addCustomerToDb;

// Function to clear request cache (useful for debugging or forcing fresh requests)
export function clearRequestCache() {
  requestCache.clear();
  console.log('🧹 Request cache cleared');
}

// Function to get request cache stats
export function getRequestCacheStats() {
  return {
    size: requestCache.size,
    keys: Array.from(requestCache.keys())
  };
}
