// Brand API Service
// Handles brand-related operations for spare parts

import { supabase } from '../../../lib/supabaseClient';

export interface Brand {
  name: string;
  count: number;
  lastUsed?: string;
}

export interface BrandResponse {
  data: Brand[];
  message: string;
  ok: boolean;
}

/**
 * Get all unique brands from spare parts
 */
export const getBrands = async (): Promise<BrandResponse> => {
  try {
    console.log('🔍 [DEBUG] Getting brands from spare parts...');
    
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .select('brand, updated_at')
      .not('brand', 'is', null)
      .neq('brand', '')
      .eq('is_active', true);

    if (error) {
      console.error('❌ [DEBUG] Error fetching brands:', error);
      throw error;
    }

    // Group brands and count occurrences
    const brandMap = new Map<string, { count: number; lastUsed: string }>();
    
    (data || []).forEach(item => {
      const brandName = item.brand?.trim();
      if (brandName) {
        const existing = brandMap.get(brandName);
        if (existing) {
          existing.count += 1;
          if (item.updated_at > existing.lastUsed) {
            existing.lastUsed = item.updated_at;
          }
        } else {
          brandMap.set(brandName, {
            count: 1,
            lastUsed: item.updated_at
          });
        }
      }
    });

    // Convert to array and sort by count (most used first)
    const brands: Brand[] = Array.from(brandMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        lastUsed: data.lastUsed
      }))
      .sort((a, b) => b.count - a.count);

    console.log('✅ [DEBUG] Retrieved brands:', brands.length);
    
    return {
      data: brands,
      message: 'Brands retrieved successfully',
      ok: true
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error getting brands:', error);
    return {
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch brands',
      ok: false
    };
  }
};

/**
 * Search brands by name
 */
export const searchBrands = async (searchTerm: string): Promise<BrandResponse> => {
  try {
    console.log('🔍 [DEBUG] Searching brands:', searchTerm);
    
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .select('brand, updated_at')
      .not('brand', 'is', null)
      .neq('brand', '')
      .ilike('brand', `%${searchTerm}%`)
      .eq('is_active', true);

    if (error) {
      console.error('❌ [DEBUG] Error searching brands:', error);
      throw error;
    }

    // Group brands and count occurrences
    const brandMap = new Map<string, { count: number; lastUsed: string }>();
    
    (data || []).forEach(item => {
      const brandName = item.brand?.trim();
      if (brandName) {
        const existing = brandMap.get(brandName);
        if (existing) {
          existing.count += 1;
          if (item.updated_at > existing.lastUsed) {
            existing.lastUsed = item.updated_at;
          }
        } else {
          brandMap.set(brandName, {
            count: 1,
            lastUsed: item.updated_at
          });
        }
      }
    });

    // Convert to array and sort by relevance (exact match first, then by count)
    const brands: Brand[] = Array.from(brandMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        lastUsed: data.lastUsed
      }))
      .sort((a, b) => {
        // Exact match first
        const aExact = a.name.toLowerCase() === searchTerm.toLowerCase();
        const bExact = b.name.toLowerCase() === searchTerm.toLowerCase();
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by count
        return b.count - a.count;
      });

    console.log('✅ [DEBUG] Found brands:', brands.length);
    
    return {
      data: brands,
      message: 'Brands found successfully',
      ok: true
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error searching brands:', error);
    return {
      data: [],
      message: error instanceof Error ? error.message : 'Failed to search brands',
      ok: false
    };
  }
};

/**
 * Get popular brands (most used)
 */
export const getPopularBrands = async (limit: number = 10): Promise<BrandResponse> => {
  try {
    console.log('🔍 [DEBUG] Getting popular brands...');
    
    const response = await getBrands();
    
    if (!response.ok) {
      return response;
    }

    const popularBrands = response.data.slice(0, limit);
    
    console.log('✅ [DEBUG] Retrieved popular brands:', popularBrands.length);
    
    return {
      data: popularBrands,
      message: 'Popular brands retrieved successfully',
      ok: true
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error getting popular brands:', error);
    return {
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch popular brands',
      ok: false
    };
  }
};

/**
 * Add a new brand (by creating a spare part with that brand)
 * This is a helper function to "register" a brand in the system
 */
export const addBrand = async (brandName: string): Promise<{ message: string; ok: boolean }> => {
  try {
    console.log('🔍 [DEBUG] Adding brand:', brandName);
    
    // Check if brand already exists
    const existingResponse = await searchBrands(brandName);
    if (existingResponse.ok && existingResponse.data.length > 0) {
      const exactMatch = existingResponse.data.find(b => 
        b.name.toLowerCase() === brandName.toLowerCase()
      );
      
      if (exactMatch) {
        return {
          message: 'Brand already exists',
          ok: true
        };
      }
    }
    
    // Brand doesn't exist, but we can't create it without a spare part
    // This function is mainly for validation
    return {
      message: 'Brand validated successfully',
      ok: true
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error adding brand:', error);
    return {
      message: error instanceof Error ? error.message : 'Failed to add brand',
      ok: false
    };
  }
};

/**
 * Get brand suggestions based on partial input
 */
export const getBrandSuggestions = async (input: string, limit: number = 5): Promise<string[]> => {
  try {
    if (!input || input.length < 2) {
      return [];
    }
    
    console.log('🔍 [DEBUG] Getting brand suggestions for:', input);
    
    const response = await searchBrands(input);
    
    if (!response.ok) {
      return [];
    }
    
    const suggestions = response.data
      .slice(0, limit)
      .map(brand => brand.name);
    
    console.log('✅ [DEBUG] Brand suggestions:', suggestions);
    
    return suggestions;
  } catch (error) {
    console.error('❌ [DEBUG] Error getting brand suggestions:', error);
    return [];
  }
};
