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
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid()) {
      return this.cache!.data;
    }

    // If already loading, return the existing promise
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start new loading process
    this.loadingPromise = this.fetchCategoriesFromDatabase();
    
    try {
      const categories = await this.loadingPromise;
      return categories;
    } finally {
      this.loadingPromise = null;
    }
  }

  private async fetchCategoriesFromDatabase(): Promise<Category[]> {
    const startTime = performance.now();

    try {
      // Ensure we use proper Supabase syntax - no custom parameters
      const query = supabase
        .from('lats_categories')
        .select('*')
        .order('name');

      console.log('🔍 [CategoryService] Executing categories query with proper syntax');
      
      const { data, error } = await query;

      if (error) {
        console.error('❌ Categories fetch error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      const categories = data || [];
      const endTime = performance.now();
      
      console.log(`✅ [CategoryService] Categories fetched successfully in ${(endTime - startTime).toFixed(2)}ms, count: ${categories.length}`);

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
    return allCategories.filter(category => category.isActive !== false && category.is_active !== false);
  }

  async getActiveCategoriesExcludingSpare(forceRefresh = false): Promise<Category[]> {
    const allCategories = await this.getCategories(forceRefresh);
    
    // More precise spare part category identification
    const sparePartKeywords = [
      'spare', 'parts', 'repair', 'replacement', 'component'
    ];
    
    // Specific spare part patterns (these suggest parts, not full products)
    const sparePartPatterns = [
      'screen replacement', 'battery replacement', 'charging port', 'logic board',
      'motherboard', 'circuit board', 'flex cable', 'ribbon cable', 'charging cable',
      'home button', 'power button', 'volume button', 'camera module', 'speaker module',
      'microphone module', 'antenna module', 'vibration motor', 'charging dock',
      'connector port', 'headphone jack', 'sim tray', 'battery connector'
    ];
    
    const filteredCategories = allCategories.filter(category => {
      // Check if category is active
      if (category.isActive === false || category.is_active === false) return false;
      
      const categoryName = category.name.toLowerCase();
      const categoryDesc = (category.description || '').toLowerCase();
      
      // Check for explicit spare part keywords
      const hasSparePartKeyword = sparePartKeywords.some(keyword =>
        categoryName.includes(keyword) || categoryDesc.includes(keyword)
      );
      
      // Check for specific spare part patterns
      const hasSparePartPattern = sparePartPatterns.some(pattern =>
        categoryName.includes(pattern) || categoryDesc.includes(pattern)
      );
      
      // Check if explicitly named as spare part or component
      const isExplicitSparePart = categoryName.includes('spare') ||
                                 categoryName.includes(' part') ||
                                 categoryName.includes('parts') ||
                                 (categoryName.includes('component') && !categoryName.includes('software'));
      
      // Return categories that are NOT spare parts
      return !(hasSparePartKeyword || hasSparePartPattern || isExplicitSparePart);
    });
    
    
    return filteredCategories;
  }

    async getSparePartCategories(forceRefresh = false): Promise<Category[]> {
    const allCategories = await this.getCategories(forceRefresh);
    
    // Filter for spare part categories
    // Look for categories that are likely spare parts based on name patterns
    const sparePartKeywords = [
      'spare', 'parts', 'components', 'accessories', 'repair', 'replacement',
      'screen', 'battery', 'charger', 'cable', 'adapter', 'connector',
      'button', 'speaker', 'microphone', 'camera', 'lens', 'antenna',
      'circuit', 'board', 'chip', 'processor', 'memory', 'storage',
      'keyboard', 'touchpad', 'hinge', 'case', 'cover', 'protector'
    ];
    
    const filteredCategories = allCategories.filter(category => {
      // Check if category is active
      if (category.isActive === false || category.is_active === false) return false;
      
      const categoryName = category.name.toLowerCase();
      const categoryDesc = (category.description || '').toLowerCase();
      
      // Check if category name or description contains spare part keywords
      const hasSparePartKeyword = sparePartKeywords.some(keyword =>
        categoryName.includes(keyword) || categoryDesc.includes(keyword)
      );
      
      // Also check if it's a subcategory (has parentId) which might indicate it's a specific part type
      const isSubcategory = category.parentId && category.parentId.trim() !== '';
      
      // Check if the category name suggests it's a spare part
      const isSparePartByName = categoryName.includes('spare') ||
                               categoryName.includes('part') ||
                               categoryName.includes('component') ||
                               categoryName.includes('accessory');
      
      return hasSparePartKeyword || isSubcategory || isSparePartByName;
    });
    
    return filteredCategories;
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
    this.clearCache();
  }

  // Force refresh categories (clears cache and fetches fresh)
  async forceRefresh(): Promise<Category[]> {
    this.clearCache();
    return await this.getCategories(true);
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
