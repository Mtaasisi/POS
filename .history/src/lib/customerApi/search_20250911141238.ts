import { supabase } from '../supabaseClient';

// Search cache for performance optimization
const searchCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function searchCustomers(query: string, page: number = 1, pageSize: number = 50) {
  try {
    console.log(`🔍 Searching customers: "${query}" (page ${page})`);
    
    const offset = (page - 1) * pageSize;
    
    // Create search conditions
    const searchConditions = [
      { name: { ilike: `%${query}%` } },
      { phone: { ilike: `%${query}%` } },
      { email: { ilike: `%${query}%` } }
    ];
    
    const { data, error, count } = await supabase
      .from('customers')
      .select(`
        id, name, email, phone, gender, city, birth_month, birth_day, total_returns, profile_image, created_at, updated_at, last_purchase_date, total_purchases, birthday, whatsapp, whatsapp_opt_out, notes, is_active, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, created_by, referral_source, initial_notes, referrals, customer_tag
      `, { count: 'exact' })
      .or(searchConditions.map(condition => Object.entries(condition).map(([key, value]) => `${key}.${Object.keys(value)[0]}.${Object.values(value)[0]}`).join(',')).join(','))
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error searching customers:', error);
      throw error;
    }
    
    if (data) {
      // Process and normalize the data
      const processedCustomers = data.map(customer => ({
        ...customer,
        // Provide default values for missing columns
        joined_date: customer.created_at,
        loyalty_level: 'bronze',
        color_tag: 'new',
        referred_by: null,
        total_spent: 0.00,
        points: 0,
        last_visit: null,
        created_by: null,
        referral_source: null,
        initial_notes: null,
        referrals: [],
        customer_tag: null,
        colorTag: normalizeColorTag('new'),
        customerNotes: [],
        customerPayments: [],
        devices: [],
        promoHistory: []
      }));
      
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
    
    // Simplified search for better performance
    const { data, error, count } = await supabase
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
      `, { count: 'exact' })
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
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
      
      try {
        // Check if we already have results for this query
        if (this.results.has(query)) {
          resolve(this.results.get(query)!);
          continue;
        }
        
        // Perform the search
        const result = await searchCustomersFast(query, 1, 100);
        this.results.set(query, result.customers);
        resolve(result.customers);
        
      } catch (error) {
        reject(error);
      }
    }
    
    this.isProcessing = false;
  }

  clearResults() {
    this.results.clear();
  }
}

export const backgroundSearchManager = new BackgroundSearchManager();

export async function searchCustomersBackground(
  query: string,
  onProgress?: (progress: number) => void,
  onComplete?: (results: any[]) => void
): Promise<string> {
  try {
    console.log(`🔄 Starting background search for: "${query}"`);
    
    // Create a job ID
    const jobId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start the search in the background
    setTimeout(async () => {
      try {
        onProgress?.(10);
        
        const results = await backgroundSearchManager.search(query);
        
        onProgress?.(50);
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        onProgress?.(100);
        onComplete?.(results);
        
        console.log(`✅ Background search completed for: "${query}"`);
        
      } catch (error) {
        console.error('❌ Background search failed:', error);
        onComplete?.([]);
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

// Helper function for color tag normalization
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
