// Smart search service for LATS module
import { supabase } from '../../../lib/supabaseClient';
import { Product, ProductVariant } from '../types/inventory';

export interface SearchResult {
  product: Product;
  relevance: number;
  matchType: 'exact' | 'fuzzy' | 'category';
  matchedField: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'sku';
  relevance: number;
}

export class SmartSearchService {
  private static instance: SmartSearchService;
  private searchCache = new Map<string, SearchResult[]>();
  private suggestionCache = new Map<string, SearchSuggestion[]>();

  static getInstance(): SmartSearchService {
    if (!SmartSearchService.instance) {
      SmartSearchService.instance = new SmartSearchService();
    }
    return SmartSearchService.instance;
  }

  // Fuzzy string matching using Levenshtein distance
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Smart product search with multiple matching strategies
  async searchProducts(query: string, limit: number = 20): Promise<SearchResult[]> {
    const cacheKey = `${query.toLowerCase()}-${limit}`;
    
    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return [];

    // Limit query length to prevent performance issues with extremely long barcodes
    if (trimmedQuery.length > 100) {
      console.warn('Search query too long, truncating:', trimmedQuery.length);
      return [];
    }

    const results: SearchResult[] = [];

    try {
      // 1. Exact matches (highest priority)
      const exactMatches = await this.searchExactMatches(trimmedQuery);
      results.push(...exactMatches.map(result => ({ ...result, relevance: 1.0 })));

      // 2. Full-text search
      const fullTextResults = await this.searchFullText(trimmedQuery, limit);
      results.push(...fullTextResults.map(result => ({ ...result, relevance: 0.8 })));

      // 3. Fuzzy matches for remaining slots
      if (results.length < limit) {
        const fuzzyResults = await this.searchFuzzy(trimmedQuery, limit - results.length);
        results.push(...fuzzyResults);
      }

      // 4. Category and brand matches
      if (results.length < limit) {
        const categoryBrandResults = await this.searchCategoryBrand(trimmedQuery, limit - results.length);
        results.push(...categoryBrandResults);
      }

      // Sort by relevance and remove duplicates
      const uniqueResults = this.removeDuplicates(results);
      const sortedResults = uniqueResults
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);

      // Cache results
      this.searchCache.set(cacheKey, sortedResults);
      
      // Clear cache after 5 minutes
      setTimeout(() => this.searchCache.delete(cacheKey), 5 * 60 * 1000);

      return sortedResults;
    } catch (error) {
      console.error('Error in smart search:', error);
      return [];
    }
  }

  private async searchExactMatches(query: string): Promise<SearchResult[]> {
    // Use proper Supabase query methods instead of string interpolation
    // This prevents 400 errors with long barcodes or special characters
    
    // First, search by product name
    const { data: nameMatches, error: nameError } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_product_variants(id, sku, barcode, selling_price, quantity, name),
        lats_categories(name)
      `)
      .eq('name', query)
      .eq('is_active', true);

    if (nameError) {
      console.error('Error searching by name:', nameError);
    }

    // Search by variant SKU
    const { data: skuMatches, error: skuError } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_product_variants(id, sku, barcode, selling_price, quantity, name),
        lats_categories(name)
      `)
      .eq('is_active', true);

    if (skuError) {
      console.error('Error searching by SKU:', skuError);
    }

    // Filter SKU matches manually to avoid complex joins
    const skuFilteredMatches = skuMatches?.filter(product => 
      product.lats_product_variants?.some(variant => variant.sku === query)
    ) || [];



    // Combine all matches and remove duplicates
    const allMatches = [
      ...(nameMatches || []),
      ...skuFilteredMatches
    ];

    // Remove duplicates based on product ID
    const uniqueMatches = allMatches.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    );

    return uniqueMatches.map(product => ({
      product,
      relevance: 1.0,
      matchType: 'exact' as const,
      matchedField: 'name'
    }));
  }

  private async searchFullText(query: string, limit: number): Promise<SearchResult[]> {
    const { data, error } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_product_variants(id, sku, barcode, selling_price, quantity, name),
        lats_categories(name)
      `)
      .textSearch('name', query, {
        type: 'websearch',
        config: 'english'
      })
      .eq('is_active', true)
      .limit(limit);

    if (error) throw error;

    return (data || []).map(product => ({
      product,
      relevance: 0.8,
      matchType: 'fuzzy' as const,
      matchedField: 'name'
    }));
  }

  private async searchFuzzy(query: string, limit: number): Promise<SearchResult[]> {
    // Get all products and apply fuzzy matching
    const { data, error } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_product_variants(id, sku, barcode, selling_price, quantity, name),
        lats_categories(name)
      `)
      .eq('is_active', true)
      .limit(100); // Get more candidates for fuzzy matching

    if (error) throw error;

    const fuzzyResults: SearchResult[] = [];

    for (const product of data || []) {
      const nameSimilarity = this.calculateSimilarity(query, product.name.toLowerCase());
      const skuSimilarity = product.lats_product_variants?.some(v => 
        this.calculateSimilarity(query, v.sku?.toLowerCase() || '') > 0.7
      ) ? 0.9 : 0;


      const maxSimilarity = Math.max(nameSimilarity, skuSimilarity, barcodeSimilarity);
      
      if (maxSimilarity > 0.6) {
        fuzzyResults.push({
          product,
          relevance: maxSimilarity,
          matchType: 'fuzzy' as const,
          matchedField: maxSimilarity === nameSimilarity ? 'name' : 
                       'sku'
        });
      }
    }

    return fuzzyResults
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  private async searchCategoryBrand(query: string, limit: number): Promise<SearchResult[]> {
    const { data, error } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_product_variants(id, sku, barcode, selling_price, quantity, name),
        lats_categories(name)
      `)
      .or(`lats_categories.name.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(limit);

    if (error) throw error;

    return (data || []).map(product => ({
      product,
      relevance: 0.6,
      matchType: product.lats_categories?.name?.toLowerCase().includes(query) ? 'category' as const : 'fuzzy' as const,
      matchedField: product.lats_categories?.name?.toLowerCase().includes(query) ? 'category' : 'name'
    }));
  }

  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.product.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Get search suggestions based on popular searches
  async getSearchSuggestions(query: string, limit: number = 5): Promise<SearchSuggestion[]> {
    const cacheKey = `suggestions-${query.toLowerCase()}`;
    
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    const suggestions: SearchSuggestion[] = [];
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) return [];

    try {
      // Product name suggestions
      const { data: products } = await supabase
        .from('lats_products')
        .select('name')
        .ilike('name', `%${trimmedQuery}%`)
        .eq('is_active', true)
        .limit(limit);

      suggestions.push(...(products || []).map(p => ({
        text: p.name,
        type: 'product' as const,
        relevance: 1.0
      })));

      // Category suggestions
      const { data: categories } = await supabase
        .from('lats_categories')
        .select('name')
        .ilike('name', `%${trimmedQuery}%`)
        .limit(limit);

      suggestions.push(...(categories || []).map(c => ({
        text: c.name,
        type: 'category' as const,
        relevance: 0.8
      })));

      // SKU suggestions
      const { data: variants } = await supabase
        .from('lats_product_variants')
        .select('sku')
        .ilike('sku', `%${trimmedQuery}%`)
        .limit(limit);

      suggestions.push(...(variants || []).map(v => ({
        text: v.sku,
        type: 'sku' as const,
        relevance: 0.9
      })));

      const sortedSuggestions = suggestions
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);

      this.suggestionCache.set(cacheKey, sortedSuggestions);
      setTimeout(() => this.suggestionCache.delete(cacheKey), 5 * 60 * 1000);

      return sortedSuggestions;
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Clear all caches
  clearCache(): void {
    this.searchCache.clear();
    this.suggestionCache.clear();
  }
}

export const smartSearchService = SmartSearchService.getInstance();
