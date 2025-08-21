import { supabase } from '../../../../lib/supabaseClient';
import { latsEventBus } from './eventBus';
import { LatsDataProvider } from './provider';
import { 
  Category, Brand, Supplier, Product, ProductVariant, StockMovement,
  PurchaseOrder, SparePart, SparePartUsage,
  CategoryFormData, BrandFormData, SupplierFormData, ProductFormData,
  ApiResponse, PaginatedResponse
} from '../../types/inventory';
import { 
  Cart, Sale, CartItem, ProcessSaleData, ProductSearchResult,
  InsufficientStockError, POSSettings
} from '../../types/pos';

/**
 * Generate a simple SVG placeholder image as a data URL
 */
function generateSimplePlaceholder(text: string = 'Image', width: number = 300, height: number = 300): string {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#F3F4F6"/>
      <text x="${width / 2}" y="${height / 2}" font-family="Arial, sans-serif" font-size="16" fill="#6B6B6B" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Check if a URL is from an unreliable service
 */
function isUnreliableUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return true;
  
  const unreliableDomains = [
    'via.placeholder.com',
    'placehold.it',
    'placehold.co',
    'dummyimage.com',
    'picsum.photos',
    'lorempixel.com',
    'loremflickr.com'
  ];
  
  return unreliableDomains.some(domain => url.toLowerCase().includes(domain));
}

/**
 * Replace all placeholder images with local SVG placeholders
 */
function replacePlaceholderImages(images: string[]): string[] {
  if (!Array.isArray(images)) return [];
  
  return images.map(imageUrl => {
    // Check if it's a placeholder service URL
    if (isUnreliableUrl(imageUrl)) {
      console.log('🔄 Replacing placeholder image:', imageUrl);
      return generateSimplePlaceholder('Product Image', 400, 400);
    }
    return imageUrl;
  });
}

// Add request throttling utility at the top of the file
class RequestThrottler {
  private static instance: RequestThrottler;
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private maxConcurrent = 2; // Limit concurrent requests
  private delayBetweenRequests = 500; // 500ms between requests

  static getInstance(): RequestThrottler {
    if (!RequestThrottler.instance) {
      RequestThrottler.instance = new RequestThrottler();
    }
    return RequestThrottler.instance;
  }

  async execute<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxConcurrent);
      await Promise.all(batch.map(request => request()));
    }
    
    this.processing = false;
  }
}

// Supabase Data Provider
class SupabaseDataProvider implements LatsDataProvider {
  
  // Categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      // Categories have public read access, so no authentication check needed for reading

      const { data, error } = await supabase
        .from('lats_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Database error:', error);
        if (error.code === 'PGRST116') {
          return { 
            ok: false, 
            message: 'Row Level Security (RLS) policy violation. Please ensure you are properly authenticated.' 
          };
        }
        throw error;
      }
      return { ok: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { ok: false, message: 'Failed to fetch categories' };
    }
  }

  async createCategory(data: CategoryFormData): Promise<ApiResponse<Category>> {
    try {
      const { data: category, error } = await supabase
        .from('lats_categories')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      latsEventBus.emit('lats:category.created', category);
      return { ok: true, data: category };
    } catch (error) {
      console.error('Error creating category:', error);
      return { ok: false, message: 'Failed to create category' };
    }
  }

  async updateCategory(id: string, data: CategoryFormData): Promise<ApiResponse<Category>> {
    try {
      const { data: category, error } = await supabase
        .from('lats_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      latsEventBus.emit('lats:category.updated', category);
      return { ok: true, data: category };
    } catch (error) {
      console.error('Error updating category:', error);
      return { ok: false, message: 'Failed to update category' };
    }
  }

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('lats_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      latsEventBus.emit('lats:category.deleted', { id });
      return { ok: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { ok: false, message: 'Failed to delete category' };
    }
  }

  // Brands
  async getBrands(): Promise<ApiResponse<Brand[]>> {
    try {
      // Brands have public read access, so no authentication check needed for reading
      const { data, error } = await supabase
        .from('lats_brands')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Database error:', error);
        if (error.code === 'PGRST116') {
          return { 
            ok: false, 
            message: 'Row Level Security (RLS) policy violation. Please ensure you are properly authenticated.' 
          };
        }
        throw error;
      }
      return { ok: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching brands:', error);
      return { ok: false, message: 'Failed to fetch brands' };
    }
  }

  async createBrand(data: BrandFormData): Promise<ApiResponse<Brand>> {
    try {
      const { data: brand, error } = await supabase
        .from('lats_brands')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      latsEventBus.emit('lats:brand.created', brand);
      return { ok: true, data: brand };
    } catch (error) {
      console.error('Error creating brand:', error);
      return { ok: false, message: 'Failed to create brand' };
    }
  }

  async updateBrand(id: string, data: BrandFormData): Promise<ApiResponse<Brand>> {
    try {
      const { data: brand, error } = await supabase
        .from('lats_brands')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      latsEventBus.emit('lats:brand.updated', brand);
      return { ok: true, data: brand };
    } catch (error) {
      console.error('Error updating brand:', error);
      return { ok: false, message: 'Failed to update brand' };
    }
  }

  async deleteBrand(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('lats_brands')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      latsEventBus.emit('lats:brand.deleted', { id });
      return { ok: true };
    } catch (error) {
      console.error('Error deleting brand:', error);
      return { ok: false, message: 'Failed to delete brand' };
    }
  }

  // Suppliers
  async getSuppliers(): Promise<ApiResponse<Supplier[]>> {
    try {
      // Optimized supplier fetch with better error handling and performance
      const startTime = performance.now();

      const { data, error } = await supabase
        .from('lats_suppliers')
        .select(`
          id, 
          name, 
          contact_person, 
          email, 
          phone, 
          address, 
          website, 
          notes, 
          company_name,
          description,
          phone2,
          whatsapp,
          instagram,
          wechat_id,
          city,
          country,
          payment_account_type,
          mobile_money_account,
          bank_account_number,
          bank_name,
          created_at, 
          updated_at
        `)
        .order('name')
        .limit(500); // Reduced limit for better performance

      const fetchTime = performance.now() - startTime;
      console.log(`🏢 Supplier fetch completed in ${fetchTime.toFixed(2)}ms`);

      if (error) {
        console.error('❌ Database error:', error);
        if (error.code === 'PGRST116') {
          return { 
            ok: false, 
            message: 'Row Level Security (RLS) policy violation. Please ensure you are properly authenticated.' 
          };
        }
        throw error;
      }

      // Optimized data processing - only process if data exists
      const suppliers = (data || []).map(supplier => ({
        ...supplier,
        // Only convert to string if value exists to reduce processing
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        website: supplier.website || '',
        notes: supplier.notes || '',
        company_name: supplier.company_name || '',
        description: supplier.description || '',
        phone2: supplier.phone2 || '',
        whatsapp: supplier.whatsapp || '',
        instagram: supplier.instagram || '',
        wechat_id: supplier.wechat_id || '',
        city: supplier.city || '',
        country: supplier.country || '',
        payment_account_type: supplier.payment_account_type || '',
        mobile_money_account: supplier.mobile_money_account || '',
        bank_account_number: supplier.bank_account_number || '',
        bank_name: supplier.bank_name || ''
      }));

      return { ok: true, data: suppliers };
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return { ok: false, message: 'Failed to fetch suppliers' };
    }
  }

  async createSupplier(data: SupplierFormData): Promise<ApiResponse<Supplier>> {
    try {
      const { data: supplier, error } = await supabase
        .from('lats_suppliers')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      latsEventBus.emit('lats:supplier.created', supplier);
      return { ok: true, data: supplier };
    } catch (error) {
      console.error('Error creating supplier:', error);
      return { ok: false, message: 'Failed to create supplier' };
    }
  }

  async updateSupplier(id: string, data: SupplierFormData): Promise<ApiResponse<Supplier>> {
    try {
      const { data: supplier, error } = await supabase
        .from('lats_suppliers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      latsEventBus.emit('lats:supplier.updated', supplier);
      return { ok: true, data: supplier };
    } catch (error) {
      console.error('Error updating supplier:', error);
      return { ok: false, message: 'Failed to update supplier' };
    }
  }

  async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('lats_suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      latsEventBus.emit('lats:supplier.deleted', { id });
      return { ok: true };
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return { ok: false, message: 'Failed to delete supplier' };
    }
  }

  // Add paginated supplier fetch for better performance
  async getSuppliersPaginated(page: number = 1, limit: number = 50): Promise<ApiResponse<{suppliers: Supplier[], total: number}>> {
    try {
      const startTime = performance.now();
      const offset = (page - 1) * limit;

      // Get total count first
      const { count, error: countError } = await supabase
        .from('lats_suppliers')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ Count error:', countError);
        throw countError;
      }

      // Get paginated data
      const { data, error } = await supabase
        .from('lats_suppliers')
        .select(`
          id, 
          name, 
          contact_person, 
          email, 
          phone, 
          address, 
          website, 
          notes, 
          company_name,
          description,
          phone2,
          whatsapp,
          instagram,
          wechat_id,
          city,
          country,
          payment_account_type,
          mobile_money_account,
          bank_account_number,
          bank_name,
          created_at, 
          updated_at
        `)
        .order('name')
        .range(offset, offset + limit - 1);

      const fetchTime = performance.now() - startTime;
      console.log(`🏢 Paginated supplier fetch (page ${page}, limit ${limit}) completed in ${fetchTime.toFixed(2)}ms`);

      if (error) {
        console.error('❌ Database error:', error);
        if (error.code === 'PGRST116') {
          return { 
            ok: false, 
            message: 'Row Level Security (RLS) policy violation. Please ensure you are properly authenticated.' 
          };
        }
        throw error;
      }

      // Optimized data processing
      const suppliers = (data || []).map(supplier => ({
        ...supplier,
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        website: supplier.website || '',
        notes: supplier.notes || '',
        company_name: supplier.company_name || '',
        description: supplier.description || '',
        phone2: supplier.phone2 || '',
        whatsapp: supplier.whatsapp || '',
        instagram: supplier.instagram || '',
        wechat_id: supplier.wechat_id || '',
        city: supplier.city || '',
        country: supplier.country || '',
        payment_account_type: supplier.payment_account_type || '',
        mobile_money_account: supplier.mobile_money_account || '',
        bank_account_number: supplier.bank_account_number || '',
        bank_name: supplier.bank_name || ''
      }));

      return { 
        ok: true, 
        data: { 
          suppliers, 
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        } 
      };
    } catch (error) {
      console.error('Error fetching paginated suppliers:', error);
      return { ok: false, message: 'Failed to fetch suppliers' };
    }
  }

  // Products
  async getProducts(filters?: any): Promise<ApiResponse<PaginatedResponse<Product>>> {
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Authentication error:', authError?.message || 'User not authenticated');
        return { 
          ok: false, 
          message: 'Authentication required. Please log in to access products.' 
        };
      }

      console.log('✅ User authenticated:', user.email);
      console.log('🔧 Filters received:', filters);

      // Quick health check - verify table exists
      try {
        const { error: healthCheckError } = await supabase
          .from('lats_products')
          .select('id')
          .limit(1);
        
        if (healthCheckError) {
          console.error('❌ Health check failed:', healthCheckError);
          return {
            ok: false,
            message: 'Database table not accessible. Please check your database configuration.'
          };
        }
      } catch (healthError) {
        console.error('❌ Health check exception:', healthError);
        return {
          ok: false,
          message: 'Database connection failed. Please check your network connection.'
        };
      }

      // Extract pagination parameters
      const page = filters?.page || 1;
      const limit = Math.min(filters?.limit || 50, 100); // Max 100 items per page
      const offset = (page - 1) * limit;

      // Build the select query with optimized structure
              let query = supabase
          .from('lats_products')
          .select(`
            id,
            name,
            description,
            category_id,
            brand_id,
            supplier_id,
            images,
            is_active,
            total_quantity,
            total_value,
            condition,
            store_shelf,
            attributes,
            created_at,
            updated_at,
            lats_categories(name, description, color),
            lats_brands(name, logo, website, description),
            lats_suppliers(name, contact_person, email, phone, address, website, notes),
            lats_product_variants(id, product_id, name, sku, cost_price, selling_price, quantity)
          `, { count: 'exact' })
          .order('name');

      // Apply filters with proper validation
      if (filters?.categoryId) {
        if (typeof filters.categoryId === 'object') {
          console.error('❌ getProducts: Object passed as categoryId:', filters.categoryId);
          return { 
            ok: false, 
            message: 'Invalid category ID format. Expected string, received object.' 
          };
        }
        query = query.eq('category_id', String(filters.categoryId).trim());
      }
      if (filters?.brandId) {
        if (typeof filters.brandId === 'object') {
          console.error('❌ getProducts: Object passed as brandId:', filters.brandId);
          return { 
            ok: false, 
            message: 'Invalid brand ID format. Expected string, received object.' 
          };
        }
        query = query.eq('brand_id', String(filters.brandId).trim());
      }
      if (filters?.supplierId) {
        if (typeof filters.supplierId === 'object') {
          console.error('❌ getProducts: Object passed as supplierId:', filters.supplierId);
          return { 
            ok: false, 
            message: 'Invalid supplier ID format. Expected string, received object.' 
          };
        }
        query = query.eq('supplier_id', String(filters.supplierId).trim());
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      console.log('🔍 Executing optimized products query...');
      const startTime = performance.now();
      
      const { data, error, count } = await query;

      const endTime = performance.now();
      console.log(`✅ Products query completed in ${(endTime - startTime).toFixed(2)}ms`);

      if (error) {
        console.error('❌ Database error:', error);
        console.error('❌ Error details:', error.details);
        console.error('❌ Error hint:', error.hint);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error code:', error.code);
        
        if (error.code === 'PGRST116') {
          return { 
            ok: false, 
            message: 'Row Level Security (RLS) policy violation. Please ensure you are properly authenticated.' 
          };
        }
        
        // Try fallback query without joins if the main query fails
        console.log('🔄 Trying fallback query without joins...');
        try {
          const fallbackQuery = supabase
            .from('lats_products')
            .select('id, name, category_id, brand_id, supplier_id, tags, is_active, total_quantity, total_value, condition, store_shelf, internal_notes, created_at, updated_at', { count: 'exact' })
            .order('name')
            .range(offset, offset + limit - 1);

          const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery;
          
          if (fallbackError) {
            console.error('❌ Fallback query also failed:', fallbackError);
            throw fallbackError;
          }
          
          console.log('✅ Fallback query successful, processing data without joins...');
          
          // Process data without joins
          const transformedProducts = (fallbackData || []).map((product: any) => ({
            id: product.id,
            name: product.name,
            shortDescription: '',
            sku: '', // SKU is not in the main products table
            barcode: '', // Barcode is not in the main products table
            categoryId: product.category_id,
            brandId: product.brand_id,
            supplierId: product.supplier_id,
            images: replacePlaceholderImages([]),
            isActive: product.is_active ?? true,
            totalQuantity: product.total_quantity || 0,
            totalValue: product.total_value || 0,
            // Price information (will be 0 for fallback since no variants loaded)
            price: 0,
            costPrice: 0,
            priceRange: '0',
            variants: [],
            condition: product.condition || 'new',
            internalNotes: '',
            attributes: product.attributes || {},
            category: undefined,
            brand: undefined,
            supplier: undefined,
            createdAt: product.created_at,
            updatedAt: product.updated_at
          }));

          return {
            ok: true,
            data: {
              data: transformedProducts,
              total: fallbackCount || 0,
              page: page,
              limit: limit,
              totalPages: Math.ceil((fallbackCount || 0) / limit)
            }
          };
          
        } catch (fallbackError) {
          console.error('❌ Both main and fallback queries failed');
          throw error; // Throw the original error
        }
      }

      console.log('✅ Products query successful, processing data...');
      console.log('📊 Raw data count:', data?.length || 0);

      // Fetch images and variants for products in batches to avoid large queries
      const productIds = (data || []).map((product: any) => product.id);
      let productImages: any[] = [];
      let productVariants: any[] = [];
      
      // Limit the number of products to process to avoid overwhelming the database
      const maxProductsToProcess = 50;
      const limitedProductIds = productIds.slice(0, maxProductsToProcess);
      
      if (limitedProductIds.length > 0) {
        console.log(`📦 Processing ${limitedProductIds.length} products (limited from ${productIds.length} total)`);
        try {
          // Fetch images in batches of 10 to reduce number of requests (increased from 5)
          const batchSize = 10;
          const throttler = RequestThrottler.getInstance();
          
          for (let i = 0; i < limitedProductIds.length; i += batchSize) {
            const batch = limitedProductIds.slice(i, i + batchSize);
            
            try {
              // Fetch images with throttling
              const batchImages = await throttler.execute(async () => {
                const { data: images, error: batchError } = await supabase
                  .from('product_images')
                  .select('product_id, image_url, is_primary')
                  .in('product_id', batch)
                  .order('is_primary', { ascending: false })
                  .order('created_at', { ascending: true });

                if (batchError) {
                  console.error('❌ Error fetching product images batch:', batchError);
                  return [];
                }
                return images || [];
              });
              
              productImages.push(...batchImages);
              
              // Fetch variants (for price information) with throttling and retry logic
              const batchVariants = await throttler.execute(async () => {
                let variantsError: any = null;
                const maxRetries = 3;
                
                for (let retry = 0; retry < maxRetries; retry++) {
                  try {
                    const { data: variants, error: error } = await supabase
                      .from('lats_product_variants')
                      .select('id, product_id, name, sku, cost_price, selling_price, quantity')
                      .in('product_id', batch)
                      .order('selling_price', { ascending: true });

                    if (error) {
                      variantsError = error;
                      console.warn(`⚠️ Variant batch query attempt ${retry + 1} failed:`, error);
                      console.warn(`⚠️ Error code: ${error.code}, Message: ${error.message}`);
                      
                      // If it's a resource error and we have more retries, wait before retrying
                      if (retry < maxRetries - 1) {
                        const delay = Math.pow(2, retry) * 2000; // Exponential backoff: 2s, 4s, 8s
                        console.log(`⏳ Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                      }
                    } else {
                      console.log(`✅ Variant batch query succeeded on attempt ${retry + 1}`);
                      return variants || [];
                    }
                  } catch (retryError) {
                    variantsError = retryError;
                    console.error(`❌ Exception in variant batch query attempt ${retry + 1}:`, retryError);
                    
                    if (retry < maxRetries - 1) {
                      const delay = Math.pow(2, retry) * 2000;
                      console.log(`⏳ Waiting ${delay}ms before retry...`);
                      await new Promise(resolve => setTimeout(resolve, delay));
                    }
                  }
                }

                // If all batch queries fail, try individual queries as fallback
                console.log('🔄 Attempting individual variant queries as fallback...');
                const individualVariants: any[] = [];
                for (const productId of batch) {
                  try {
                    const { data: singleVariants, error: singleError } = await supabase
                      .from('lats_product_variants')
                      .select('id, product_id, name, sku, cost_price, selling_price, quantity')
                      .eq('product_id', productId)
                      .order('selling_price', { ascending: true });
                    
                    if (!singleError && singleVariants) {
                      individualVariants.push(...singleVariants);
                    }
                  } catch (singleQueryError) {
                    console.error(`❌ Error fetching variants for product ${productId}:`, singleQueryError);
                  }
                }
                return individualVariants;
              });
              
              productVariants.push(...batchVariants);
            } catch (batchError) {
              console.error('❌ Error in batch processing:', batchError);
            }
          }
          console.log('📸 Fetched images for', productImages.length, 'products');
          console.log('💰 Fetched variants for', productVariants.length, 'products');
        } catch (error) {
          console.error('❌ Exception fetching product data:', error);
          // Continue processing even if batch fetching fails
          console.log('🔄 Continuing with empty variant and image data...');
        }
      } else {
        console.log('📦 No products to process for variants and images');
      }

      // Transform the data to match the expected format
      const transformedProducts = (data || []).map((product: any) => {
        // Group images by product
        const productImageList = productImages
          .filter((img: any) => img.product_id === product.id)
          .map((img: any) => img.image_url);

        // Get variants for this product (from the main query or batch fetch)
        const productVariantList = product.lats_product_variants || productVariants.filter(v => v.product_id === product.id) || [];

        // Get price information from variants
        const lowestPrice = productVariantList.length > 0 
          ? Math.min(...productVariantList.map((v: any) => v.selling_price || 0))
          : 0;
        const highestPrice = productVariantList.length > 0
          ? Math.max(...productVariantList.map((v: any) => v.selling_price || 0))
          : 0;
        const priceRange = lowestPrice === highestPrice 
          ? lowestPrice 
          : `${lowestPrice} - ${highestPrice}`;

        return {
          id: product.id,
          name: product.name,
          shortDescription: '',
          sku: product.sku || '',
          barcode: product.barcode,
          categoryId: product.category_id,
          brandId: product.brand_id,
          supplierId: product.supplier_id,
          images: replacePlaceholderImages(productImageList.length > 0 ? productImageList : []),
                      isActive: product.is_active ?? true,
          totalQuantity: product.total_quantity || 0,
          totalValue: product.total_value || 0,
          // Add price information from variants
          price: lowestPrice,
          costPrice: productVariantList.length > 0 
            ? Math.min(...productVariantList.map((v: any) => v.cost_price || 0))
            : 0,
          priceRange: priceRange,
          condition: product.condition || 'new',
          internalNotes: '',
          attributes: product.attributes || {},
          category: product.lats_categories ? {
            id: product.lats_categories.id,
            name: product.lats_categories.name,
            description: product.lats_categories.description,
            color: product.lats_categories.color,
            createdAt: product.lats_categories.created_at,
            updatedAt: product.lats_categories.updated_at
          } : undefined,
          brand: product.lats_brands ? {
            id: product.lats_brands.id,
            name: product.lats_brands.name,
            logo: product.lats_brands.logo,
            website: product.lats_brands.website,
            description: product.lats_brands.description,
            createdAt: product.lats_brands.created_at,
            updatedAt: product.lats_brands.updated_at
          } : undefined,
          supplier: product.lats_suppliers ? {
            id: product.lats_suppliers.id,
            name: product.lats_suppliers.name,
            contactPerson: product.lats_suppliers.contact_person,
            email: product.lats_suppliers.email,
            phone: product.lats_suppliers.phone,
            address: product.lats_suppliers.address,
            website: product.lats_suppliers.website,
            notes: product.lats_suppliers.notes,
            createdAt: product.lats_suppliers.created_at,
            updatedAt: product.lats_suppliers.updated_at
          } : undefined,
          // Include variants with simplified data structure
          variants: productVariantList.map((variant: any) => ({
            id: variant.id,
            productId: variant.product_id,
            sku: variant.sku,
            name: variant.name,
            attributes: variant.attributes || {},
            costPrice: variant.cost_price || 0,
            sellingPrice: variant.selling_price || 0,
            quantity: variant.quantity || 0,
            min_quantity: variant.min_quantity || 0,
            max_quantity: variant.max_quantity || null,
            barcode: variant.barcode || null,
            weight: variant.weight || null,
            dimensions: variant.dimensions || null,
            createdAt: variant.created_at || new Date().toISOString(),
            updatedAt: variant.updated_at || new Date().toISOString()
          })),
          createdAt: product.created_at,
          updatedAt: product.updated_at
        };
      });

      console.log(`✅ Successfully processed ${transformedProducts.length} products`);

      return {
        ok: true,
        data: {
          data: transformedProducts,
          total: count || 0,
          page: page,
          limit: limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('💥 Exception in getProducts:', error);
      return { 
        ok: false, 
        message: 'Failed to load products. Please try again.' 
      };
    }
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      // Validate and sanitize the ID parameter
      if (!id) {
        console.error('❌ getProduct: No ID provided');
        return { 
          ok: false, 
          message: 'Product ID is required' 
        };
      }

      console.log('🔍 Fetching product with full data:', id);

      // Get the product with basic info - fetch ALL available fields
      const { data: product, error: productError } = await supabase
        .from('lats_products')
        .select(`
          *,
          lats_categories(id, name, description, color, created_at, updated_at),
          lats_brands(id, name, logo, website, description, created_at, updated_at),
          lats_suppliers(id, name, contact_person, email, phone, address, website, notes, created_at, updated_at)
        `)
        .eq('id', id)
        .single();

      if (productError) {
        console.error('❌ Error fetching product:', productError);
        return { ok: false, message: 'Product not found' };
      }

      // Get product variants
      const { data: variants, error: variantsError } = await supabase
        .from('lats_product_variants')
        .select('*')
        .eq('product_id', id);

      if (variantsError) {
        console.error('❌ Error fetching product variants:', variantsError);
      }

      // Get product images
      const { data: images, error: imagesError } = await supabase
        .from('product_images')
        .select('image_url, is_primary')
        .eq('product_id', id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (imagesError) {
        console.error('❌ Error fetching product images:', imagesError);
      }

      const transformedProduct: Product = {
        id: product.id,
        name: product.name,
        shortDescription: '',
        sku: variants && variants.length > 0 ? variants[0].sku : '', // Get SKU from first variant
        barcode: variants && variants.length > 0 ? variants[0].barcode : '', // Get barcode from first variant
        categoryId: product.category_id,
        brandId: product.brand_id,
        supplierId: product.supplier_id,
        images: (images || []).map(img => img.image_url),
                    isActive: product.is_active ?? true,
        totalQuantity: product.total_quantity || 0,
        totalValue: product.total_value || 0,
        // Add price information from variants
        price: variants && variants.length > 0 
          ? Math.min(...variants.map((v: any) => v.selling_price || 0))
          : 0,
        costPrice: variants && variants.length > 0
          ? Math.min(...variants.map((v: any) => v.cost_price || 0))
          : 0,
        priceRange: variants && variants.length > 0
          ? (() => {
              const prices = variants.map((v: any) => v.selling_price || 0);
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              return min === max ? min.toString() : `${min} - ${max}`;
            })()
          : '0',
        condition: product.condition || 'new',
        internalNotes: '',
        attributes: product.attributes || {},
        debutDate: product.debut_date,
        debutNotes: product.debut_notes,
        debutFeatures: product.debut_features || [],
        metadata: product.metadata || {},
        category: product.lats_categories ? {
          id: product.lats_categories.id,
          name: product.lats_categories.name,
          description: product.lats_categories.description,
          color: product.lats_categories.color,
          createdAt: product.lats_categories.created_at,
          updatedAt: product.lats_categories.updated_at
        } : undefined,
        brand: product.lats_brands ? {
          id: product.lats_brands.id,
          name: product.lats_brands.name,
          logo: product.lats_brands.logo,
          website: product.lats_brands.website,
          description: product.lats_brands.description,
          createdAt: product.lats_brands.created_at,
          updatedAt: product.lats_brands.updated_at
        } : undefined,
        supplier: product.lats_suppliers ? {
          id: product.lats_suppliers.id,
          name: product.lats_suppliers.name,
          contactPerson: product.lats_suppliers.contact_person,
          email: product.lats_suppliers.email,
          phone: product.lats_suppliers.phone,
          address: product.lats_suppliers.address,
          website: product.lats_suppliers.website,
          notes: product.lats_suppliers.notes,
          createdAt: product.lats_suppliers.created_at,
          updatedAt: product.lats_suppliers.updated_at
        } : undefined,
        variants: (variants || []).map((variant: any) => ({
          id: variant.id,
          productId: variant.product_id,
          sku: variant.sku,
          name: variant.name,
          attributes: variant.attributes || {},
          costPrice: variant.cost_price || 0,
          sellingPrice: variant.selling_price || 0,
          quantity: variant.quantity || 0,
          min_quantity: variant.min_quantity || 0,
          max_quantity: variant.max_quantity,
          barcode: variant.barcode || null,
          weight: variant.weight || null,
          dimensions: variant.dimensions || null,
          createdAt: variant.created_at,
          updatedAt: variant.updated_at
        })),
        createdAt: product.created_at,
        updatedAt: product.updated_at
      };

      console.log('✅ Product fetched successfully:', {
        id: transformedProduct.id,
        name: transformedProduct.name,
        variantsCount: transformedProduct.variants?.length || 0,
        hasCategory: !!transformedProduct.category,
        hasBrand: !!transformedProduct.brand,
        hasSupplier: !!transformedProduct.supplier,
        totalQuantity: transformedProduct.totalQuantity,
        totalValue: transformedProduct.totalValue,
        
        condition: transformedProduct.condition,
        storeShelf: transformedProduct.storeShelf,
        debutDate: transformedProduct.debutDate,
        debutNotes: transformedProduct.debutNotes,
        debutFeatures: transformedProduct.debutFeatures?.length || 0
      });

      return { ok: true, data: transformedProduct };
    } catch (error) {
      console.error('💥 Exception in getProduct:', error);
      return { ok: false, message: 'Failed to get product' };
    }
  }

  // New function to load product variants separately
  async getProductVariants(productId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data: variants, error } = await supabase
        .from('lats_product_variants')
        .select('id, product_id, name, sku, cost_price, selling_price, quantity')
        .eq('product_id', productId)
        .order('name');

      if (error) {
        console.error('❌ Error fetching product variants:', error);
        return { ok: false, message: 'Failed to fetch product variants' };
      }

      const transformedVariants = (variants || []).map((variant: any) => ({
        id: variant.id,
        productId: variant.product_id,
        sku: variant.sku,
        name: variant.name,
        attributes: variant.attributes || {},
        costPrice: variant.cost_price || 0,
        sellingPrice: variant.selling_price || 0,
        quantity: variant.quantity || 0,
        min_quantity: variant.min_quantity || 0,
        max_quantity: variant.max_quantity || null,
        barcode: variant.barcode || null,
        weight: variant.weight || null,
        dimensions: variant.dimensions || null,
        createdAt: variant.created_at || new Date().toISOString(),
        updatedAt: variant.updated_at || new Date().toISOString()
      }));

      return { ok: true, data: transformedVariants };
    } catch (error) {
      console.error('💥 Exception in getProductVariants:', error);
      return { ok: false, message: 'Failed to get product variants' };
    }
  }

  async createProduct(data: ProductFormData): Promise<ApiResponse<Product>> {
    console.log('🔄 [DEBUG] SupabaseProvider.createProduct called');
    console.log('📦 [DEBUG] Create data:', JSON.stringify(data, null, 2));
    
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Authentication error:', authError?.message || 'User not authenticated');
        return { 
          ok: false, 
          message: 'Authentication required. Please log in to create products.' 
        };
      }

      console.log('✅ User authenticated:', user.email);
      console.log('🚀 [DEBUG] Creating main product...');
      
      // Validate and filter UUID fields
      const isValidUUID = (uuid: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };
      
      // Check for duplicate SKUs before creating product
      if (data.variants && data.variants.length > 0) {
        // Compute the actual SKUs that will be inserted (must mirror insert logic below)
        const plannedSkus = data.variants.map((variant: any, index: number) => {
          const provided = (variant.sku && `${variant.sku}`.trim()) || '';
          if (provided) return provided;
          if (data.sku) return `${data.sku}-${index + 1}`;
          return '';
        }).filter((sku: string) => sku && sku.trim() !== '');

        if (plannedSkus.length > 0) {
          console.log('🔍 [DEBUG] Checking for duplicate SKUs (planned):', plannedSkus);

          // Check for duplicates within the current product variants
          const duplicateSkus = plannedSkus.filter((sku: string, index: number) => plannedSkus.indexOf(sku) !== index);
          if (duplicateSkus.length > 0) {
            const uniqueDuplicates = [...new Set(duplicateSkus)];
            console.warn('⚠️ [DEBUG] Duplicate SKUs within product variants:', uniqueDuplicates);
            return {
              ok: false,
              message: `Duplicate SKUs found within this product: ${uniqueDuplicates.join(', ')}. Each variant must have a unique SKU.`
            };
          }

          // Check for duplicates in existing database variants
          const { data: existingVariants, error: checkError } = await supabase
            .from('lats_product_variants')
            .select('sku')
            .in('sku', plannedSkus);

          if (checkError) {
            console.error('❌ [DEBUG] Error checking for duplicate SKUs:', checkError);
            return { ok: false, message: 'Failed to check for duplicate SKUs' };
          }

          if (existingVariants && existingVariants.length > 0) {
            const duplicateList = existingVariants.map((v: any) => v.sku).join(', ');
            console.warn('⚠️ [DEBUG] Duplicate SKUs found in database:', duplicateList);
            return {
              ok: false,
              message: `The following SKUs already exist: ${duplicateList}. Please use unique SKUs for each product variant.`
            };
          }
        }
      }
      
      // Prepare main product create data with only fields that exist in the database
      const mainProductCreateData: any = {
        name: data.name,
        is_active: Boolean(data.isActive),
        // Add fields that already exist in database schema
        tags: data.tags || [],
        images: data.images || [],
        // Add new fields from the migration
        condition: data.condition || 'new',
        // Add internal notes field - removed as it doesn't exist in schema
        // Add attributes field for product-level specifications
        attributes: data.attributes || {}
      };
      
      // Only add category_id if it's a valid UUID
      if (data.categoryId && isValidUUID(data.categoryId)) {
        mainProductCreateData.category_id = data.categoryId;
      } else if (data.categoryId) {
        console.warn('⚠️ [DEBUG] Invalid category ID format:', data.categoryId);
        return { ok: false, message: 'Invalid category ID format. Please select a valid category.' };
      }
      
      // Only add brand_id if it's a valid UUID
      if (data.brandId && isValidUUID(data.brandId)) {
        mainProductCreateData.brand_id = data.brandId;
      } else if (data.brandId) {
        console.warn('⚠️ [DEBUG] Invalid brand ID format:', data.brandId);
        // Don't fail for invalid brand ID, just skip it
      }
      
      // Only add supplier_id if it's a valid UUID
      if (data.supplierId && isValidUUID(data.supplierId)) {
        mainProductCreateData.supplier_id = data.supplierId;
      } else if (data.supplierId) {
        console.warn('⚠️ [DEBUG] Invalid supplier ID format:', data.supplierId);
        // Don't fail for invalid supplier ID, just skip it
      }
      
      console.log('📦 [DEBUG] Main product create data:', mainProductCreateData);
      
      // Check if a product with this name already exists
      const { data: existingProduct, error: checkError } = await supabase
        .from('lats_products')
        .select('id, name')
        .eq('name', data.name)
        .maybeSingle();
      
      if (checkError) {
        console.error('❌ [DEBUG] Error checking for existing product:', checkError);
        // Continue with product creation even if the check fails
      }
      
      if (existingProduct) {
        console.warn('⚠️ [DEBUG] Product with this name already exists:', existingProduct);
        return { ok: false, message: 'A product with this name already exists. Please use a different name.' };
      }
      
      // Create main product
      const { data: product, error: productError } = await supabase
        .from('lats_products')
        .insert([mainProductCreateData])
        .select()
        .single();

      if (productError) {
        console.error('❌ [DEBUG] Error creating main product:', productError);
        console.error('❌ [DEBUG] Error details:', productError.details);
        console.error('❌ [DEBUG] Error hint:', productError.hint);
        console.error('❌ [DEBUG] Error message:', productError.message);
        
        // Handle specific error cases
        if (productError.code === '23505') {
          // Check if it's a name constraint violation
          if (productError.message && productError.message.includes('name')) {
            return { ok: false, message: 'A product with this name already exists. Please use a different name.' };
          }
          // Check if it's a different unique constraint
          return { ok: false, message: 'A product with these details already exists. Please check your input and try again.' };
        }
        
        // Handle HTTP 409 Conflict error
        if (productError.code === '409' || productError.message?.includes('Conflict') || productError.status === 409) {
          return { ok: false, message: 'A product with this name already exists. Please use a different name.' };
        }
        
        // Handle any other unique constraint violations
        if (productError.message && (productError.message.includes('duplicate') || productError.message.includes('already exists'))) {
          return { ok: false, message: 'A product with this name already exists. Please use a different name.' };
        }
        
        throw productError;
      }

      console.log('✅ [DEBUG] Main product created successfully:', product);

      // Create variants
      if (data.variants && data.variants.length > 0) {
        console.log('🔄 [DEBUG] Creating variants:', data.variants.length);
        console.log('📦 [DEBUG] Variants data:', JSON.stringify(data.variants, null, 2));
        
        const variants = data.variants.map((variant, index) => {
          console.log('📦 [DEBUG] Processing variant:', JSON.stringify(variant, null, 2));
          
          const computedSku = (() => {
            const provided = (variant.sku && `${variant.sku}`.trim()) || '';
            if (provided) return provided;
            const base = (data.sku && `${data.sku}`.trim()) || '';
            if (base) return `${base}-${index + 1}`;
            // Fallback to guaranteed-unique SKU using product id
            const pid = (product.id || '').toString().slice(0, 8);
            return `AUTO-${pid}-${index + 1}`;
          })();

          const variantData = {
            product_id: product.id,
            sku: computedSku,
            name: variant.name || `Variant ${index + 1}`,
            cost_price: variant.costPrice || variant.cost_price || 0,
            selling_price: variant.price || variant.sellingPrice || variant.selling_price || 0,
            quantity: variant.stockQuantity || variant.quantity || 0,
            min_quantity: variant.minStockLevel || variant.minQuantity || variant.min_quantity || 0,
            barcode: variant.barcode || null,
            weight: variant.weight || null,
            dimensions: variant.dimensions || null,
            attributes: variant.attributes || {}
          };
          
          console.log('📦 [DEBUG] Variant data to insert:', variantData);
          return variantData;
        });

        // Check authentication again before creating variants
        const { data: { user: variantUser }, error: variantAuthError } = await supabase.auth.getUser();
        
        if (variantAuthError || !variantUser) {
          console.error('❌ [DEBUG] Authentication error when creating variants:', variantAuthError?.message || 'User not authenticated');
          return { 
            ok: false, 
            message: 'Authentication required for creating product variants. Please log in and try again.' 
          };
        }

        console.log('✅ [DEBUG] User authenticated for variant creation:', variantUser.email);
        console.log('📦 [DEBUG] Final variants to insert:', JSON.stringify(variants, null, 2));

        const { error: variantError } = await supabase
          .from('lats_product_variants')
          .insert(variants);

        if (variantError) {
          console.error('❌ [DEBUG] Error creating variants:', variantError);
          console.error('❌ [DEBUG] Error details:', variantError.details);
          console.error('❌ [DEBUG] Error hint:', variantError.hint);
          console.error('❌ [DEBUG] Error message:', variantError.message);
          
          // Roll back main product if variants fail to insert
          try {
            console.warn('↩️ [DEBUG] Rolling back created product due to variant error');
            await supabase.from('lats_products').delete().eq('id', product.id);
          } catch (rollbackError) {
            console.error('❌ [DEBUG] Failed to roll back product:', rollbackError);
          }
          
          // Handle RLS policy violation
          if (variantError.code === '42501' && variantError.message.includes('row-level security policy')) {
            console.error('❌ [DEBUG] RLS policy violation for variants. This might be a database configuration issue.');
            return { 
              ok: false, 
              message: 'Unable to create product variants due to security policy restrictions. Please contact your administrator.' 
            };
          }
          
          // Handle specific error cases for variants
          if (variantError.code === '23505' || variantError.code === '409') {
            // Try to identify which SKU is duplicate
            const duplicateSkuMatch = variantError.message.match(/Key \(sku\)=\(([^)]+)\) already exists/);
            if (duplicateSkuMatch) {
              const duplicateSku = duplicateSkuMatch[1];
              return { ok: false, message: `SKU "${duplicateSku}" already exists. Please use a unique SKU.` };
            }
            return { ok: false, message: 'One or more SKUs already exist. Please use unique SKUs for each variant.' };
          }
          
          throw variantError;
        }
        
        console.log('✅ [DEBUG] Variants created successfully');
      }

      latsEventBus.emit('lats:product.created', product);
      return { ok: true, data: product };
    } catch (error) {
      console.error('❌ [DEBUG] Error creating product:', error);
      return { ok: false, message: 'Failed to create product' };
    }
  }

  async updateProduct(id: string, data: ProductFormData): Promise<ApiResponse<Product>> {
    console.log('🔄 [DEBUG] SupabaseProvider.updateProduct called');
    console.log('📋 [DEBUG] Product ID:', id);
    console.log('📦 [DEBUG] Update data:', data);
    
    try {
      console.log('🚀 [DEBUG] Updating main product...');
      
      // Prepare main product update data with proper type handling
      // Only include fields that exist in the lats_products table
      const mainProductUpdateData = {
        name: data.name,

        category_id: data.categoryId,
        brand_id: data.brandId || null,
        supplier_id: data.supplierId || null,
        images: data.images || [],
        tags: data.tags || [],
        is_active: Boolean(data.isActive),
        // Add new fields from the migration
        condition: data.condition || 'new',
        // Add attributes field for product-level specifications
        attributes: data.attributes || {}
      };
      
      console.log('📦 [DEBUG] Main product update data:', mainProductUpdateData);
      
      // Update main product
      const { data: product, error } = await supabase
        .from('lats_products')
        .update(mainProductUpdateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [DEBUG] Error updating main product:', error);
        console.error('❌ [DEBUG] Error details:', error.details);
        console.error('❌ [DEBUG] Error hint:', error.hint);
        console.error('❌ [DEBUG] Error message:', error.message);
        throw error;
      }

      console.log('✅ [DEBUG] Main product updated successfully:', product);

      // Update variants
      if (data.variants && data.variants.length > 0) {
        console.log('🔄 [DEBUG] Processing variants:', data.variants.length);
        
        for (let i = 0; i < data.variants.length; i++) {
          const variant = data.variants[i];
          console.log(`🔄 [DEBUG] Processing variant ${i + 1}/${data.variants.length}:`, variant);
          
          if ((variant as any).id) {
            console.log('🔄 [DEBUG] Updating existing variant:', (variant as any).id);
            
            // Prepare update data with proper type handling
            const updateData = {
              sku: variant.sku || '',
              name: variant.name || '',
              barcode: variant.barcode || null,
              selling_price: Number(variant.price) || 0, // Use price from form data
              cost_price: Number(variant.costPrice) || 0,
              quantity: Number(variant.stockQuantity) || 0,
              min_quantity: Number(variant.minStockLevel) || 0,
              weight: variant.weight ? Number(variant.weight) : null,
              dimensions: variant.dimensions || null,
              attributes: variant.attributes || {}
            };
            
            console.log('📦 [DEBUG] Update data being sent:', JSON.stringify(updateData, null, 2));
            console.log('📦 [DEBUG] Variant ID:', (variant as any).id);
            console.log('📦 [DEBUG] Variant original data:', variant);
            
            // Update existing variant
            const { error: variantError } = await supabase
              .from('lats_product_variants')
              .update(updateData)
              .eq('id', (variant as any).id);

            if (variantError) {
              console.error('❌ [DEBUG] Error updating variant:', variantError);
              console.error('❌ [DEBUG] Error details:', variantError.details);
              console.error('❌ [DEBUG] Error hint:', variantError.hint);
              console.error('❌ [DEBUG] Error message:', variantError.message);
            } else {
              console.log('✅ [DEBUG] Variant updated successfully');
            }
          } else {
            console.log('🔄 [DEBUG] Creating new variant');
            
            // Prepare insert data with proper type handling
            const insertData = {
              product_id: id,
              sku: variant.sku || '',
              name: variant.name || '',
              barcode: variant.barcode || null,
              selling_price: Number(variant.price) || 0, // Use price from form data
              cost_price: Number(variant.costPrice) || 0,
              quantity: Number(variant.stockQuantity) || 0,
              min_quantity: Number(variant.minStockLevel) || 0,
              weight: variant.weight ? Number(variant.weight) : null,
              dimensions: variant.dimensions || null,
              attributes: variant.attributes || {}
            };
            
            console.log('📦 [DEBUG] Insert data being sent:', JSON.stringify(insertData, null, 2));
            console.log('📦 [DEBUG] Variant original data:', variant);
            
            // Create new variant
            const { error: variantError } = await supabase
              .from('lats_product_variants')
              .insert(insertData);

            if (variantError) {
              console.error('❌ [DEBUG] Error creating variant:', variantError);
              console.error('❌ [DEBUG] Error details:', variantError.details);
              console.error('❌ [DEBUG] Error hint:', variantError.hint);
              console.error('❌ [DEBUG] Error message:', variantError.message);
            } else {
              console.log('✅ [DEBUG] New variant created successfully');
            }
          }
        }
      } else {
        console.log('⚠️ [DEBUG] No variants to process');
      }
      
      console.log('📡 [DEBUG] Emitting product updated event');
      latsEventBus.emit('lats:product.updated', product);
      
      console.log('✅ [DEBUG] Product update completed successfully');
      return { ok: true, data: product };
    } catch (error) {
      console.error('💥 [DEBUG] Exception in updateProduct:', error);
      return { ok: false, message: 'Failed to update product' };
    }
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    try {
      // First, delete all variants except one to work around the trigger
      const { data: variants, error: variantsError } = await supabase
        .from('lats_product_variants')
        .select('id')
        .eq('product_id', id);

      if (variantsError) throw variantsError;

      if (variants && variants.length > 1) {
        // Delete all variants except the first one
        const variantsToDelete = variants.slice(1).map(v => v.id);
        const { error: deleteVariantsError } = await supabase
          .from('lats_product_variants')
          .delete()
          .in('id', variantsToDelete);

        if (deleteVariantsError) throw deleteVariantsError;
      }

      // Now delete the product (this will cascade to delete the remaining variant)
      const { error } = await supabase
        .from('lats_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      latsEventBus.emit('lats:product.deleted', { id });
      return { ok: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { ok: false, message: 'Failed to delete product' };
    }
  }

  async searchProducts(query: string): Promise<ApiResponse<ProductSearchResult[]>> {
    try {
      const { data, error } = await supabase
        .from('lats_products')
        .select(`
          *,
          lats_categories(name),
          lats_brands(name),
          lats_product_variants(*)
        `)
        .or(`name.ilike.%${query}%`)
        .eq('is_active', true);

      if (error) throw error;

      // Fetch images for all products in parallel
      const productsWithImages = await Promise.all((data || []).map(async (product: any) => {
        // Get product images from the product_images table
        const { data: images, error: imagesError } = await supabase
          .from('product_images')
          .select('image_url, thumbnail_url, is_primary')
          .eq('product_id', product.id)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: true });

        if (imagesError) {
          console.error('Error fetching images for product:', product.id, imagesError);
        }

        // Extract image URLs, prioritizing primary images first
        const imageUrls = (images || []).map(img => img.image_url || img.thumbnail_url).filter(Boolean);

        return {
          id: product.id,
          name: product.name,

          categoryId: product.category_id,
          categoryName: product.lats_categories?.name || '',
          brandId: product.brand_id,
          brandName: product.lats_brands?.name,
          variants: (product.lats_product_variants || []).map((variant: any) => ({
            id: variant.id,
            sku: variant.sku,
            name: variant.name,
            attributes: variant.attributes,
            sellingPrice: variant.selling_price,
            quantity: variant.quantity,
            barcode: variant.barcode
          })),
          images: imageUrls,
          tags: []
        };
      }));

      return { ok: true, data: productsWithImages };
    } catch (error) {
      console.error('Error searching products:', error);
      return { ok: false, message: 'Failed to search products' };
    }
  }

  // Stock Management
  async adjustStock(
    productId: string,
    variantId: string,
    quantity: number,
    reason: string,
    reference?: string
  ): Promise<ApiResponse<StockMovement>> {
    try {
      // Get current stock
      const { data: variant, error: variantError } = await supabase
        .from('lats_product_variants')
        .select('quantity')
        .eq('id', variantId)
        .single();

      if (variantError) throw variantError;

      const previousQuantity = variant.quantity;
      const newQuantity = Math.max(0, previousQuantity + quantity);

      // Update stock
      const { error: updateError } = await supabase
        .from('lats_product_variants')
        .update({ quantity: newQuantity })
        .eq('id', variantId);

      if (updateError) throw updateError;

      // Create stock movement record
      const { data: movement, error: movementError } = await supabase
        .from('lats_stock_movements')
        .insert([{
          product_id: productId,
          variant_id: variantId,
          type: quantity > 0 ? 'in' : 'out',
          quantity: Math.abs(quantity),
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason,
          reference,
          created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
        }])
        .select()
        .single();

      if (movementError) throw movementError;

      latsEventBus.emit('lats:stock.updated', { productId, variantId, quantity: newQuantity });
      return { ok: true, data: movement };
    } catch (error) {
      console.error('Error adjusting stock:', error);
      return { ok: false, message: 'Failed to adjust stock' };
    }
  }

  // Sales Data
  async getSaleItems(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('lats_sale_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (error) {
      console.error('Error getting sale items:', error);
      return { ok: false, message: 'Failed to get sale items', data: [] };
    }
  }

  async getProductSales(productId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('lats_sale_items')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (error) {
      console.error('Error getting product sales:', error);
      return { ok: false, message: 'Failed to get product sales', data: [] };
    }
  }

  async getStockMovements(productId?: string): Promise<ApiResponse<StockMovement[]>> {
    try {
      let query = supabase
        .from('lats_stock_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      return { ok: false, message: 'Failed to fetch stock movements' };
    }
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<ApiResponse<PurchaseOrder[]>> {
    try {
      // Fetch purchase orders without joins to avoid foreign key issues
      const { data: orders, error: ordersError } = await supabase
        .from('lats_purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      
      // Fetch suppliers separately
      const { data: suppliers, error: suppliersError } = await supabase
        .from('lats_suppliers')
        .select('id, name');

      if (suppliersError) {
        console.warn('Warning: Could not fetch suppliers:', suppliersError.message);
      }

      // Fetch purchase order items separately
      const { data: items, error: itemsError } = await supabase
        .from('lats_purchase_order_items')
        .select('*');

      if (itemsError) {
        console.warn('Warning: Could not fetch purchase order items:', itemsError.message);
      }

      // Create lookup maps
      const suppliersMap = new Map((suppliers || []).map(s => [s.id, s]));
      const itemsMap = new Map();
      (items || []).forEach(item => {
        if (!itemsMap.has(item.purchase_order_id)) {
          itemsMap.set(item.purchase_order_id, []);
        }
        itemsMap.get(item.purchase_order_id).push(item);
      });
      
      // Transform snake_case to camelCase
      const transformedData = (orders || []).map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        supplierName: suppliersMap.get(order.supplier_id)?.name || 'Unknown Supplier',
        status: order.status,
        totalAmount: order.total_amount || 0,
        expectedDelivery: order.expected_delivery,
        notes: order.notes,
        createdBy: order.created_by,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: (itemsMap.get(order.id) || []).map((item: any) => ({
          id: item.id,
          purchaseOrderId: item.purchase_order_id,
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity,
          costPrice: item.cost_price,
          totalPrice: item.total_price,
          receivedQuantity: item.received_quantity || 0,
          notes: item.notes
        }))
      }));
      
      return { ok: true, data: transformedData };
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return { ok: false, message: 'Failed to fetch purchase orders' };
    }
  }

  async getPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      // Fetch purchase order without joins to avoid foreign key issues
      const { data: order, error: orderError } = await supabase
        .from('lats_purchase_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      
      // Fetch supplier separately
      const { data: supplier, error: supplierError } = await supabase
        .from('lats_suppliers')
        .select('id, name')
        .eq('id', order.supplier_id)
        .single();

      if (supplierError) {
        console.warn('Warning: Could not fetch supplier:', supplierError.message);
      }

      // Fetch purchase order items separately
      const { data: items, error: itemsError } = await supabase
        .from('lats_purchase_order_items')
        .select('*')
        .eq('purchase_order_id', id);

      if (itemsError) {
        console.warn('Warning: Could not fetch purchase order items:', itemsError.message);
      }
      
      // Transform snake_case to camelCase
      const transformedData = {
        id: order.id,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        supplierName: supplier?.name || 'Unknown Supplier',
        status: order.status,
        totalAmount: order.total_amount || 0,
        expectedDelivery: order.expected_delivery,
        notes: order.notes,
        createdBy: order.created_by,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: (items || []).map((item: any) => ({
          id: item.id,
          purchaseOrderId: item.purchase_order_id,
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity,
          costPrice: item.cost_price,
          totalPrice: item.total_price,
          receivedQuantity: item.received_quantity || 0,
          notes: item.notes
        }))
      };
      
      return { ok: true, data: transformedData };
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      return { ok: false, message: 'Failed to fetch purchase order' };
    }
  }

  async createPurchaseOrder(data: PurchaseOrderFormData): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const { data: order, error } = await supabase
        .from('lats_purchase_orders')
        .insert([{
          supplier_id: data.supplierId,
          expected_delivery: data.expectedDelivery,
          notes: data.notes,
          status: 'draft',
          created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Transform snake_case to camelCase
      const transformedData = {
        id: order.id,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        status: order.status,
        totalAmount: order.total_amount || 0,
        expectedDelivery: order.expected_delivery,
        notes: order.notes,
        createdBy: order.created_by,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: []
      };
      
      latsEventBus.emit('lats:purchase-order.created', transformedData);
      return { ok: true, data: transformedData };
    } catch (error) {
      console.error('Error creating purchase order:', error);
      return { ok: false, message: 'Failed to create purchase order' };
    }
  }

  async updatePurchaseOrder(id: string, data: Partial<PurchaseOrderFormData>): Promise<ApiResponse<PurchaseOrder>> {
    try {
      // Transform camelCase to snake_case for database
      const dbData: any = {};
      if (data.supplierId !== undefined) dbData.supplier_id = data.supplierId;
      if (data.expectedDelivery !== undefined) dbData.expected_delivery = data.expectedDelivery;
      if (data.notes !== undefined) dbData.notes = data.notes;
      
      const { data: order, error } = await supabase
        .from('lats_purchase_orders')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Transform snake_case to camelCase
      const transformedData = {
        id: order.id,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        status: order.status,
        totalAmount: order.total_amount || 0,
        expectedDelivery: order.expected_delivery,
        notes: order.notes,
        createdBy: order.created_by,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: []
      };
      
      latsEventBus.emit('lats:purchase-order.updated', transformedData);
      return { ok: true, data: transformedData };
    } catch (error) {
      console.error('Error updating purchase order:', error);
      return { ok: false, message: 'Failed to update purchase order' };
    }
  }

  async receivePurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const { data: order, error } = await supabase
        .from('lats_purchase_orders')
        .update({ status: 'received' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Transform snake_case to camelCase
      const transformedData = {
        id: order.id,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        status: order.status,
        totalAmount: order.total_amount || 0,
        expectedDelivery: order.expected_delivery,
        notes: order.notes,
        createdBy: order.created_by,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: []
      };
      
      latsEventBus.emit('lats:purchase-order.received', transformedData);
      return { ok: true, data: transformedData };
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      return { ok: false, message: 'Failed to receive purchase order' };
    }
  }

  async deletePurchaseOrder(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('lats_purchase_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      latsEventBus.emit('lats:purchase-order.deleted', { id });
      return { ok: true };
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      return { ok: false, message: 'Failed to delete purchase order' };
    }
  }

  // Spare Parts
  async getSpareParts(): Promise<ApiResponse<SparePart[]>> {
    try {
      const { data, error } = await supabase
        .from('lats_spare_parts')
        .select('*')
        .order('name');

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      return { ok: false, message: 'Failed to fetch spare parts' };
    }
  }

  async getSparePart(id: string): Promise<ApiResponse<SparePart>> {
    try {
      const { data, error } = await supabase
        .from('lats_spare_parts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { ok: true, data };
    } catch (error) {
      console.error('Error fetching spare part:', error);
      return { ok: false, message: 'Failed to fetch spare part' };
    }
  }

  async createSparePart(data: any): Promise<ApiResponse<SparePart>> {
    try {
      const { data: sparePart, error } = await supabase
        .from('lats_spare_parts')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      latsEventBus.emit('lats:spare-part.created', sparePart);
      return { ok: true, data: sparePart };
    } catch (error) {
      console.error('Error creating spare part:', error);
      return { ok: false, message: 'Failed to create spare part' };
    }
  }

  async updateSparePart(id: string, data: any): Promise<ApiResponse<SparePart>> {
    try {
      const { data: sparePart, error } = await supabase
        .from('lats_spare_parts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      latsEventBus.emit('lats:spare-part.updated', sparePart);
      return { ok: true, data: sparePart };
    } catch (error) {
      console.error('Error updating spare part:', error);
      return { ok: false, message: 'Failed to update spare part' };
    }
  }

  async deleteSparePart(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('lats_spare_parts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      latsEventBus.emit('lats:spare-part.deleted', { id });
      return { ok: true };
    } catch (error) {
      console.error('Error deleting spare part:', error);
      return { ok: false, message: 'Failed to delete spare part' };
    }
  }

  async useSparePart(data: {
    spare_part_id: string;
    quantity: number;
    reason: string;
    notes?: string;
    used_by?: string;
  }): Promise<ApiResponse<SparePartUsage>> {
    try {
      // Start a transaction
      const { data: sparePart, error: fetchError } = await supabase
        .from('lats_spare_parts')
        .select('quantity')
        .eq('id', data.spare_part_id)
        .single();

      if (fetchError) throw fetchError;

      if (sparePart.quantity < data.quantity) {
        return { ok: false, message: 'Insufficient stock' };
      }

      // Insert usage record
      const { data: usage, error: usageError } = await supabase
        .from('lats_spare_part_usage')
        .insert([data])
        .select()
        .single();

      if (usageError) throw usageError;

      // Update spare part quantity
      const { error: updateError } = await supabase
        .from('lats_spare_parts')
        .update({ 
          quantity: sparePart.quantity - data.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.spare_part_id);

      if (updateError) throw updateError;
      
      latsEventBus.emit('lats:spare-part.used', usage);
      return { ok: true, data: usage };
    } catch (error) {
      console.error('Error using spare part:', error);
      return { ok: false, message: 'Failed to use spare part' };
    }
  }

  async getSparePartUsage(): Promise<ApiResponse<SparePartUsage[]>> {
    try {
      const { data, error } = await supabase
        .from('lats_spare_part_usage')
        .select('*')
        .order('used_at', { ascending: false });

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching spare part usage:', error);
      return { ok: false, message: 'Failed to fetch spare part usage' };
    }
  }

  // POS
  async getCart(): Promise<ApiResponse<Cart>> {
    try {
      const { data, error } = await supabase
        .from('lats_cart')
        .select(`
          *,
          lats_cart_items(*)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return { ok: true, data: data || null };
    } catch (error) {
      console.error('Error fetching cart:', error);
      return { ok: false, message: 'Failed to fetch cart' };
    }
  }

  async addToCart(data: any): Promise<ApiResponse<Cart>> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Get or create cart
      let { data: cart, error: cartError } = await supabase
        .from('lats_cart')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (cartError && cartError.code === 'PGRST116') {
        // Create new cart
        const { data: newCart, error: createError } = await supabase
          .from('lats_cart')
          .insert([{ user_id: userId }])
          .select()
          .single();

        if (createError) throw createError;
        cart = newCart;
      } else if (cartError) {
        throw cartError;
      }

      // Get product and variant to get the price
      const { data: product, error: productError } = await supabase
        .from('lats_products')
        .select(`
          *,
          lats_product_variants!inner(*)
        `)
        .eq('id', data.productId)
        .eq('lats_product_variants.id', data.variantId)
        .single();

      if (productError) throw productError;

      const variant = product.lats_product_variants[0];
      if (!variant) throw new Error('Variant not found');

      // Add item to cart
      const { error: itemError } = await supabase
        .from('lats_cart_items')
        .insert([{
          cart_id: cart.id,
          product_id: data.productId,
          variant_id: data.variantId,
          quantity: data.quantity,
          price: variant.selling_price
        }]);

      if (itemError) throw itemError;

      return { ok: true, data: cart };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { ok: false, message: 'Failed to add to cart' };
    }
  }

  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<Cart>> {
    try {
      const { error } = await supabase
        .from('lats_cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;

      return await this.getCart();
    } catch (error) {
      console.error('Error updating cart item:', error);
      return { ok: false, message: 'Failed to update cart item' };
    }
  }

  async removeFromCart(itemId: string): Promise<ApiResponse<Cart>> {
    try {
      const { error } = await supabase
        .from('lats_cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      return await this.getCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { ok: false, message: 'Failed to remove from cart' };
    }
  }

  async clearCart(): Promise<ApiResponse<Cart>> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('lats_cart_items')
        .delete()
        .eq('cart_id', (await this.getCart()).data?.id);

      if (error) throw error;

      return await this.getCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { ok: false, message: 'Failed to clear cart' };
    }
  }

  async processSale(data: ProcessSaleData): Promise<ApiResponse<Sale | InsufficientStockError>> {
    try {
      // Check stock availability
      for (const item of data.items) {
        const { data: variant, error } = await supabase
          .from('lats_product_variants')
          .select('quantity')
          .eq('id', item.variantId)
          .single();

        if (error) throw error;

        if (variant.quantity < item.quantity) {
          return {
            ok: false,
            code: 'INSUFFICIENT_STOCK',
            data: {
              productId: item.productId,
              variantId: item.variantId,
              requestedQuantity: item.quantity,
              availableQuantity: variant.quantity
            }
          };
        }
      }

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('lats_sales')
        .insert([{
          customer_id: data.customerId,
          total_amount: data.totalAmount,
          payment_method: data.paymentMethod,
          created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items and update stock
      for (const item of data.items) {
        // Create sale item
        await supabase
          .from('lats_sale_items')
          .insert([{
            sale_id: sale.id,
            product_id: item.productId,
            variant_id: item.variantId,
            quantity: item.quantity,
            price: item.price
          }]);

        // Update stock
        await this.adjustStock(item.productId, item.variantId, -item.quantity, 'Sale', sale.id);
      }

      // Clear cart
      await this.clearCart();

      return { ok: true, data: sale };
    } catch (error) {
      console.error('Error processing sale:', error);
      return { ok: false, message: 'Failed to process sale' };
    }
  }

  async getSales(): Promise<ApiResponse<Sale[]>> {
    try {
      const { data, error } = await supabase
        .from('lats_sales')
        .select(`
          *,
          lats_sale_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching sales:', error);
      return { ok: false, message: 'Failed to fetch sales' };
    }
  }

  async getSale(id: string): Promise<ApiResponse<Sale>> {
    try {
      const { data, error } = await supabase
        .from('lats_sales')
        .select(`
          *,
          lats_sale_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { ok: true, data };
    } catch (error) {
      console.error('Error fetching sale:', error);
      return { ok: false, message: 'Failed to fetch sale' };
    }
  }

  async getPOSSettings(): Promise<ApiResponse<POSSettings>> {
    try {
      const { data, error } = await supabase
        .from('lats_pos_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return { ok: true, data: data || null };
    } catch (error) {
      console.error('Error fetching POS settings:', error);
      return { ok: false, message: 'Failed to fetch POS settings' };
    }
  }

  async updatePOSSettings(settings: Partial<POSSettings>): Promise<ApiResponse<POSSettings>> {
    try {
      const { data, error } = await supabase
        .from('lats_pos_settings')
        .upsert([settings])
        .select()
        .single();

      if (error) throw error;
      return { ok: true, data };
    } catch (error) {
      console.error('Error updating POS settings:', error);
      return { ok: false, message: 'Failed to update POS settings' };
    }
  }

  // Analytics
  async getInventoryStats(): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .rpc('get_inventory_stats');

      if (error) throw error;
      return { ok: true, data };
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      return { ok: false, message: 'Failed to fetch inventory stats' };
    }
  }

  async getSalesStats(): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .rpc('get_sales_stats');

      if (error) throw error;
      return { ok: true, data };
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      return { ok: false, message: 'Failed to fetch sales stats' };
    }
  }

  async getLowStockItems(): Promise<ApiResponse<Product[]>> {
    try {
      const { data, error } = await supabase
        .from('lats_products')
        .select(`
          *,
          lats_product_variants(*)
        `)
        .lt('total_quantity', 10);

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return { ok: false, message: 'Failed to fetch low stock items' };
    }
  }
}

export default new SupabaseDataProvider();
