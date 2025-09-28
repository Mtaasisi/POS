import { supabase } from '../supabaseClient';

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

// Search cache for performance optimization
const searchCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function searchCustomers(query: string, page: number = 1, pageSize: number = 50) {
  try {
    console.log(`🔍 Searching customers: "${query}" (page ${page})`);
    
    const offset = (page - 1) * pageSize;
    
    // Create optimized search conditions
    const searchConditions = [
      `name.ilike.%${query}%`,
      `phone.ilike.%${query}%`,
      `email.ilike.%${query}%`,
      `whatsapp.ilike.%${query}%`,
      `city.ilike.%${query}%`,
      `referral_source.ilike.%${query}%`,
      `customer_tag.ilike.%${query}%`,
      `initial_notes.ilike.%${query}%`
    ];

    // Enhanced phone number search for better mobile number matching
    if (/^\d{3,}$/.test(query)) {
      // Add phone number variations for partial matching
      searchConditions.push(`phone.like.%${query}`);
      searchConditions.push(`whatsapp.like.%${query}`);
    }

    // Handle Tanzanian phone number formats with enhanced conversion
    const cleanQuery = query.replace(/[\s\-\(\)]/g, '');
    if (/^(\+255|255|0)?\d{9}$/.test(cleanQuery)) {
      const phoneVariations = [
        cleanQuery,
        cleanQuery.startsWith('+255') ? cleanQuery.substring(4) : `+255${cleanQuery}`,
        cleanQuery.startsWith('255') ? cleanQuery.substring(3) : `255${cleanQuery}`,
        cleanQuery.startsWith('0') ? cleanQuery.substring(1) : `0${cleanQuery}`
      ];
      
      phoneVariations.forEach(phone => {
        searchConditions.push(`phone.eq.${phone}`);
        searchConditions.push(`whatsapp.eq.${phone}`);
      });
    }
    
    // Enhanced phone number conversion for partial numbers (e.g., 07123 -> 2557123)
    if (/^0\d{3,}$/.test(cleanQuery)) {
      // Convert 07123 to 2557123 and search for both
      const convertedNumber = `255${cleanQuery.substring(1)}`; // Remove 0 and add 255
      const originalNumber = cleanQuery;
      
      // Search for both original and converted numbers
      searchConditions.push(`phone.ilike.%${originalNumber}%`);
      searchConditions.push(`whatsapp.ilike.%${originalNumber}%`);
      searchConditions.push(`phone.ilike.%${convertedNumber}%`);
      searchConditions.push(`whatsapp.ilike.%${convertedNumber}%`);
    }
    
    // Handle partial numbers that start with 255
    if (/^255\d{3,}$/.test(cleanQuery)) {
      // Convert 2557123 to 07123 and search for both
      const convertedNumber = `0${cleanQuery.substring(3)}`; // Remove 255 and add 0
      const originalNumber = cleanQuery;
      
      searchConditions.push(`phone.ilike.%${originalNumber}%`);
      searchConditions.push(`whatsapp.ilike.%${originalNumber}%`);
      searchConditions.push(`phone.ilike.%${convertedNumber}%`);
      searchConditions.push(`whatsapp.ilike.%${convertedNumber}%`);
    }
    
    const { data, error, count } = await supabase
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
        whatsapp,
        whatsapp_opt_out,
        initial_notes,
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
      `, { count: 'exact' })
      .or(searchConditions.join(','))
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error searching customers:', error);
      throw error;
    }
    
    if (data) {
      // Process and normalize the data
      const processedCustomers = data.map(customer => {
        // Map snake_case database fields to camelCase interface fields
        const mappedCustomer = {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          gender: customer.gender || 'other',
          city: customer.city || '',
          colorTag: normalizeColorTag(customer.color_tag || 'new'),
          loyaltyLevel: customer.loyalty_level || 'bronze',
          points: customer.points || 0,
          totalSpent: customer.total_spent || 0,
          lastVisit: customer.last_visit || customer.created_at,
          isActive: customer.is_active !== false, // Default to true if null
          referralSource: customer.referral_source,
          birthMonth: customer.birth_month,
          birthDay: customer.birth_day,
          totalReturns: 0, // Field doesn't exist in database
          profileImage: null, // Field doesn't exist in database
          whatsapp: customer.whatsapp,
          whatsappOptOut: customer.whatsapp_opt_out || false,
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
          joinedDate: customer.created_at,
          createdAt: customer.created_at,
          updatedAt: customer.updated_at,
          createdBy: customer.created_by,
          lastPurchaseDate: customer.last_purchase_date,
          totalPurchases: customer.total_purchases || 0,
          birthday: customer.birthday,
          referredBy: customer.referred_by,
          // Call analytics fields
          totalCalls: customer.total_calls || 0,
          totalCallDurationMinutes: customer.total_call_duration_minutes || 0,
          incomingCalls: customer.incoming_calls || 0,
          outgoingCalls: customer.outgoing_calls || 0,
          missedCalls: customer.missed_calls || 0,
          avgCallDurationMinutes: customer.avg_call_duration_minutes || 0,
          firstCallDate: customer.first_call_date || '',
          lastCallDate: customer.last_call_date || '',
          callLoyaltyLevel: customer.call_loyalty_level || 'Basic',
          // Additional fields for interface compatibility
          customerNotes: [],
          customerPayments: [],
          devices: [],
          promoHistory: []
        };
        return mappedCustomer;
      });
      
      console.log(`✅ Search completed: ${processedCustomers.length} results`);
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
    console.error('❌ Error searching customers:', error);
    throw error;
  }
}

export async function searchCustomersFast(query: string, page: number = 1, pageSize: number = 50) {
  try {
    console.log(`🔍 Fast search customers: "${query}" (page ${page})`);
    
    // Check cache first
    const cacheKey = `search_${query}_${page}_${pageSize}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Returning cached search results');
      return cached.data;
    }
    
    const offset = (page - 1) * pageSize;
    
    // Enhanced search query for better mobile number matching
    let searchQuery = `name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%,whatsapp.ilike.%${query}%,city.ilike.%${query}%,referral_source.ilike.%${query}%,customer_tag.ilike.%${query}%,initial_notes.ilike.%${query}%`;
    
    // Add enhanced phone number search
    if (/^\d{3,}$/.test(query)) {
      searchQuery += `,phone.like.%${query},whatsapp.like.%${query},phone.like.${query}%,whatsapp.like.${query}%`;
    }
    
    // Handle Tanzanian phone number formats with enhanced conversion
    const cleanQuery = query.replace(/[\s\-\(\)]/g, '');
    if (/^(\+255|255|0)?\d{9}$/.test(cleanQuery)) {
      const phoneVariations = [
        cleanQuery,
        cleanQuery.startsWith('+255') ? cleanQuery.substring(4) : `+255${cleanQuery}`,
        cleanQuery.startsWith('255') ? cleanQuery.substring(3) : `255${cleanQuery}`,
        cleanQuery.startsWith('0') ? cleanQuery.substring(1) : `0${cleanQuery}`
      ];
      
      phoneVariations.forEach(phone => {
        searchQuery += `,phone.eq.${phone},whatsapp.eq.${phone},phone.like.%${phone}%,whatsapp.like.%${phone}%`;
      });
    }
    
    // Enhanced phone number conversion for partial numbers (e.g., 07123 -> 2557123)
    if (/^0\d{3,}$/.test(cleanQuery)) {
      // Convert 07123 to 2557123 and search for both
      const convertedNumber = `255${cleanQuery.substring(1)}`; // Remove 0 and add 255
      const originalNumber = cleanQuery;
      
      // Search for both original and converted numbers
      searchQuery += `,phone.like.%${originalNumber}%,whatsapp.like.%${originalNumber}%`;
      searchQuery += `,phone.like.%${convertedNumber}%,whatsapp.like.%${convertedNumber}%`;
      searchQuery += `,phone.like.${originalNumber}%,whatsapp.like.${originalNumber}%`;
      searchQuery += `,phone.like.${convertedNumber}%,whatsapp.like.${convertedNumber}%`;
    }
    
    // Handle partial numbers that start with 255
    if (/^255\d{3,}$/.test(cleanQuery)) {
      // Convert 2557123 to 07123 and search for both
      const convertedNumber = `0${cleanQuery.substring(3)}`; // Remove 255 and add 0
      const originalNumber = cleanQuery;
      
      searchQuery += `,phone.like.%${originalNumber}%,whatsapp.like.%${originalNumber}%`;
      searchQuery += `,phone.like.%${convertedNumber}%,whatsapp.like.%${convertedNumber}%`;
      searchQuery += `,phone.like.${originalNumber}%,whatsapp.like.${originalNumber}%`;
      searchQuery += `,phone.like.${convertedNumber}%,whatsapp.like.${convertedNumber}%`;
    }

    const { data, error, count } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        phone,
        email,
        whatsapp,
        city,
        color_tag,
        points,
        created_at,
        updated_at
      `, { count: 'exact' })
      .or(searchQuery)
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error in fast search:', error);
      throw error;
    }
    
    if (data) {
      // Process and normalize the data
      const processedCustomers = data.map(customer => ({
        ...customer,
        colorTag: normalizeColorTag(customer.color_tag || 'new')
      }));
      
      const result = {
        customers: processedCustomers,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
      
      // Cache the result
      searchCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      console.log(`✅ Fast search completed: ${processedCustomers.length} results`);
      return result;
    }
    
    return {
      customers: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    };
    
  } catch (error) {
    console.error('❌ Error in fast search:', error);
    throw error;
  }
}

export function clearSearchCache() {
  searchCache.clear();
  console.log('🧹 Search cache cleared');
}

export function getSearchCacheStats() {
  return {
    size: searchCache.size,
    entries: Array.from(searchCache.keys())
  };
}

// Background search manager
class BackgroundSearchManager {
  private searchQueue: Array<{ query: string; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private isProcessing = false;
  private results = new Map<string, any[]>();
  public activeJobs = new Map<string, { query: string; resolve: (value: any) => void; reject: (error: any) => void }>();

  async search(query: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.searchQueue.push({ query, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.searchQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.searchQueue.length > 0) {
      const { query, resolve, reject } = this.searchQueue.shift()!;
      
      // Generate a job ID for this search
      const jobId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.activeJobs.set(jobId, { query, resolve, reject });
      
      try {
        // Check if we already have results for this query
        if (this.results.has(query)) {
          resolve(this.results.get(query)!);
          this.activeJobs.delete(jobId);
          continue;
        }
        
        // Perform the search
        const result = await searchCustomersFast(query, 1, 100);
        this.results.set(query, result.customers);
        resolve(result.customers);
        this.activeJobs.delete(jobId);
        
      } catch (error) {
        reject(error);
        this.activeJobs.delete(jobId);
      }
    }
    
    this.isProcessing = false;
  }

  cancelSearchJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (job) {
      // Resolve with a cancellation indicator instead of rejecting
      job.resolve({ cancelled: true, customers: [], totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
      this.activeJobs.delete(jobId);
      console.log(`🚫 Cancelled search job: ${jobId}`);
      return true;
    }
    return false;
  }

  clearResults() {
    this.results.clear();
    // Cancel all active jobs
    for (const [jobId, job] of this.activeJobs) {
      job.reject(new Error('Search manager cleared'));
    }
    this.activeJobs.clear();
  }
}

export const backgroundSearchManager = new BackgroundSearchManager();

export async function searchCustomersBackground(
  query: string,
  page: number = 1,
  pageSize: number = 50,
  onStatus?: (status: string) => void,
  onComplete?: (result: any) => void,
  onError?: (error: string) => void
): Promise<string> {
  try {
    console.log(`🔄 Starting background search for: "${query}"`);
    
    // Create a job ID
    const jobId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the job in the background search manager for cancellation
    const jobPromise = new Promise<any>((resolve, reject) => {
      // Store the job in the manager's active jobs
      backgroundSearchManager.activeJobs.set(jobId, { 
        query, 
        resolve: (result) => {
          // Transform the result to match what CustomersPage expects
          const transformedResult = {
            customers: result.customers || result,
            totalCount: result.total || (Array.isArray(result) ? result.length : 0),
            totalPages: result.totalPages || Math.ceil((result.total || (Array.isArray(result) ? result.length : 0)) / pageSize),
            hasNextPage: page < (result.totalPages || Math.ceil((result.total || (Array.isArray(result) ? result.length : 0)) / pageSize)),
            hasPreviousPage: page > 1
          };
          resolve(transformedResult);
        }, 
        reject 
      });
    });
    
    // Start the search in the background
    setTimeout(async () => {
      try {
        onStatus?.('processing');
        
        // Use the regular search function with pagination
        const result = await searchCustomers(query, page, pageSize);
        
        // Get the job and resolve it
        const job = backgroundSearchManager.activeJobs.get(jobId);
        if (job) {
          // Transform the result to match what CustomersPage expects
          const transformedResult = {
            customers: result.customers,
            totalCount: result.total,
            totalPages: result.totalPages,
            hasNextPage: page < result.totalPages,
            hasPreviousPage: page > 1
          };
          job.resolve(transformedResult);
          backgroundSearchManager.activeJobs.delete(jobId);
          
          onStatus?.('completed');
          onComplete?.(transformedResult);
        }
        
        console.log(`✅ Background search completed for: "${query}"`);
        
      } catch (error) {
        console.error('❌ Background search failed:', error);
        const job = backgroundSearchManager.activeJobs.get(jobId);
        if (job) {
          job.reject(error);
          backgroundSearchManager.activeJobs.delete(jobId);
        }
        onError?.(error instanceof Error ? error.message : 'Search failed');
      }
    }, 100);
    
    return jobId;
    
  } catch (error) {
    console.error('❌ Error starting background search:', error);
    throw error;
  }
}

export function getBackgroundSearchManager() {
  return backgroundSearchManager;
}

