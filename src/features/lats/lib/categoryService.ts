import { supabase } from '../../../lib/supabaseClient';
import { Category } from '../types/inventory';

interface CategoryCache {
  data: Category[];
  timestamp: number;
  expiresAt: number;
}

class CategoryService {
  private static instance: CategoryService;
  private cache: CategoryCache | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private loadingPromise: Promise<Category[]> | null = null;

  private constructor() {}

  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() < this.cache.expiresAt;
  }

  private clearCache(): void {
    this.cache = null;
  }

  async getCategories(forceRefresh = false): Promise<Category[]> {
    console.log('📂 Categories: getCategories called, forceRefresh:', forceRefresh);
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid()) {
      console.log('📂 Categories: Using cached data, count:', this.cache!.data.length);
      return this.cache!.data;
    }

    // If already loading, return the existing promise
    if (this.loadingPromise) {
      console.log('📂 Categories: Waiting for existing request');
      return this.loadingPromise;
    }

    // Start new loading process
    console.log('📂 Categories: Starting new fetch from database');
    this.loadingPromise = this.fetchCategoriesFromDatabase();
    
    try {
      const categories = await this.loadingPromise;
      console.log('📂 Categories: Fetch completed, count:', categories.length);
      return categories;
    } finally {
      this.loadingPromise = null;
    }
  }

  private async fetchCategoriesFromDatabase(): Promise<Category[]> {
    console.log('📂 Categories: Fetching from database...');
    const startTime = performance.now();

    try {
      const { data, error } = await supabase
        .from('lats_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Categories fetch error:', error);
        throw error;
      }

      const categories = data || [];
      const endTime = performance.now();
      
      console.log(`✅ Categories: Fetched ${categories.length} categories in ${(endTime - startTime).toFixed(2)}ms`);

      // Update cache
      this.cache = {
        data: categories,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      };

      return categories;
    } catch (error) {
      console.error('❌ Categories fetch exception:', error);
      throw error;
    }
  }

  async getActiveCategories(forceRefresh = false): Promise<Category[]> {
    const allCategories = await this.getCategories(forceRefresh);
    return allCategories.filter(category => category.is_active !== false);
  }

  async getCategoryById(id: string, forceRefresh = false): Promise<Category | null> {
    const categories = await this.getCategories(forceRefresh);
    return categories.find(cat => cat.id === id) || null;
  }

  async searchCategories(query: string, forceRefresh = false): Promise<Category[]> {
    const categories = await this.getCategories(forceRefresh);
    const searchTerm = query.toLowerCase();
    
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm) ||
      (category.description && category.description.toLowerCase().includes(searchTerm))
    );
  }

  // Invalidate cache when categories are modified
  invalidateCache(): void {
    console.log('📂 Categories: Cache invalidated');
    this.clearCache();
  }

  // Get categories for specific product IDs (optimized for product pages)
  async getCategoriesForProducts(productIds: string[], forceRefresh = false): Promise<Category[]> {
    if (productIds.length === 0) return [];

    const categories = await this.getCategories(forceRefresh);
    
    // This would be more efficient with a direct query, but for now we'll filter
    // In the future, we could optimize this with a direct database query
    const categoryIds = new Set<string>();
    
    // This is a placeholder - in a real implementation, you'd query products to get their category_ids
    // For now, we'll return all categories since we don't have the product-category mapping here
    return categories;
  }

  // Get category statistics
  async getCategoryStats(forceRefresh = false): Promise<{
    total: number;
    active: number;
    inactive: number;
    withDescription: number;
    uniqueColors: number;
  }> {
    const categories = await this.getCategories(forceRefresh);
    
    const active = categories.filter(c => c.is_active !== false).length;
    const withDescription = categories.filter(c => c.description && c.description.trim()).length;
    const uniqueColors = new Set(categories.map(c => c.color).filter(Boolean)).size;

    return {
      total: categories.length,
      active,
      inactive: categories.length - active,
      withDescription,
      uniqueColors
    };
  }
}

export const categoryService = CategoryService.getInstance();
export default categoryService;
