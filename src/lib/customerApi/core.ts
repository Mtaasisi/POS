import { supabase } from '../supabaseClient';
import { Customer } from '../types';

// Configuration constants to prevent resource exhaustion
const BATCH_SIZE = 50; // Maximum customers per batch
const REQUEST_DELAY = 100; // Delay between batches in milliseconds
const MAX_CONCURRENT_REQUESTS = 10; // Maximum concurrent requests
const MAX_RETRIES = 3; // Maximum retry attempts for failed requests
const RETRY_DELAY = 1000; // Delay between retries in milliseconds

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

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

// Utility for formatting currency with abbreviated notation for large numbers
export function formatCurrency(amount: number) {
  if (amount >= 1000000) {
    // For millions
    const millions = amount / 1000000;
    if (millions >= 10) {
      // For 10M+, show as whole number
      return `Tsh ${Math.floor(millions)}M`;
    } else {
      // For 1M-9.9M, show with one decimal place (no trailing .0)
      const formatted = millions.toFixed(1);
      return `Tsh ${formatted.replace(/\.0$/, '')}M`;
    }
  } else if (amount >= 1000) {
    // For thousands
    const thousands = amount / 1000;
    if (thousands >= 10) {
      // For 10K+, show as whole number
      return `Tsh ${Math.floor(thousands)}K`;
    } else {
      // For 1K-9.9K, show with one decimal place (no trailing .0)
      const formatted = thousands.toFixed(1);
      return `Tsh ${formatted.replace(/\.0$/, '')}K`;
    }
  } else {
    // For numbers less than 1000, use regular formatting without trailing zeros
    const formatted = Number(amount).toLocaleString('en-TZ', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
    return 'Tsh ' + formatted.replace(/\.00$/, '').replace(/\.0$/, '');
  }
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
      const { count, error: countError } = await retryRequest(async () => {
        const result = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        
        if (result.error) {
          throw result.error;
        }
        return result;
      });
      
      if (countError) {
        console.error('❌ Error counting customers:', countError);
        throw countError;
      }
      
      console.log(`📊 Total customers in database: ${count}`);
      
      // Use pagination to fetch customers in batches to avoid overwhelming the browser
      const pageSize = BATCH_SIZE; // Use configured batch size
      const totalPages = Math.ceil((count || 0) / pageSize);
      const allCustomers = [];
      
      console.log(`📄 Fetching ${totalPages} pages of customers with batch size ${pageSize}...`);
      
      // Fetch customers page by page with controlled concurrency
      for (let page = 1; page <= totalPages; page++) {
        console.log(`📄 Fetching page ${page}/${totalPages}...`);
        
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await retryRequest(async () => {
          const result = await supabase
            .from('customers')
            .select(`
              *,
              customer_notes(*),
              customer_payments(*),
              devices(*),
              promo_messages(*)
            `)
            .range(from, to)
            .order('created_at', { ascending: false });
          
          if (result.error) {
            throw result.error;
          }
          return result;
        });
        
        if (pageError) {
          console.error(`❌ Error fetching page ${page}:`, pageError);
          throw pageError;
        }
        
        if (pageData) {
          // Process and normalize the data
          const processedCustomers = pageData.map(customer => ({
            ...customer,
            colorTag: normalizeColorTag(customer.colorTag || 'new'),
            customerNotes: customer.customer_notes || [],
            customerPayments: customer.customer_payments || [],
            devices: customer.devices || [],
            promoHistory: customer.promo_messages || []
          }));
          
          allCustomers.push(...processedCustomers);
          console.log(`✅ Page ${page} fetched: ${pageData.length} customers`);
        }
        
        // Add delay between requests to prevent overwhelming the server
        if (page < totalPages) {
          await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
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
      
      const { data, error } = await retryRequest(async () => {
        const result = await supabase
          .from('customers')
          .select(`
            id,
            name,
            phone,
            email,
            colorTag,
            points,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false });
        
        if (result.error) {
          throw result.error;
        }
        return result;
      });
      
      if (error) {
        console.error('❌ Error fetching customers (simple):', error);
        throw error;
      }
      
      if (data) {
        // Process and normalize the data
        const processedCustomers = data.map(customer => ({
          ...customer,
          colorTag: normalizeColorTag(customer.colorTag || 'new')
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
      console.error('❌ Error fetching customer by ID:', error);
      throw error;
    }
    
    if (data) {
      // Process and normalize the data
      const processedCustomer = {
        ...data,
        colorTag: normalizeColorTag(data.colorTag || 'new'),
        customerNotes: data.customer_notes || [],
        customerPayments: data.customer_payments || [],
        devices: data.devices || [],
        promoHistory: data.promo_messages || []
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
    
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        ...customer,
        colorTag: normalizeColorTag(customer.colorTag || 'new')
      }])
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
    
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        colorTag: updates.colorTag ? normalizeColorTag(updates.colorTag) : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating customer:', error);
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
