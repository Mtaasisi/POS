import { supabase } from '../../../../lib/supabaseClient';
import { latsEventBus } from './eventBus';
import { LatsDataProvider } from './provider';
import { 
  Category, Supplier, Product, ProductVariant, StockMovement,
  PurchaseOrder, SparePart, SparePartUsage,
  CategoryFormData, SupplierFormData, ProductFormData, PurchaseOrderFormData,
  ApiResponse, PaginatedResponse
} from '../../types/inventory';
import { 
  Cart, Sale, CartItem, ProcessSaleData, ProductSearchResult,
  InsufficientStockError, POSSettings
} from '../../types/pos';
import { 
  ShippingAgent, ShippingManager, AgentFormData, OfficeFormData, OfficeLocation
} from './provider';
import { validateAndCreateDefaultVariant } from '../variantUtils';

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
      console.log('🔍 [SupabaseDataProvider] Fetching categories with proper syntax');

      // Use explicit query construction to ensure proper syntax
      const query = supabase
        .from('lats_categories')
        .select('*')
        .order('name');

      const { data, error } = await query;

      if (error) {
        console.error('❌ Database error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.code === 'PGRST116') {
          return { 
            ok: false, 
            message: 'Row Level Security (RLS) policy violation. Please ensure you are properly authenticated.' 
          };
        }
        throw error;
      }
      
      console.log(`✅ [SupabaseDataProvider] Categories fetched successfully, count: ${data?.length || 0}`);
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
        bank_name: supplier.bank_name || '',
        createdAt: supplier.created_at,
        updatedAt: supplier.updated_at,
        leadTimeDays: supplier.lead_time_days || 0,
        isActive: supplier.is_active ?? true
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
        .select('id', { count: 'exact', head: true });

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
          suppliers: suppliers.map(supplier => ({
            ...supplier,
            leadTimeDays: 0,
            isActive: true,
            createdAt: supplier.created_at,
            updatedAt: supplier.updated_at
          })), 
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
    console.log('🔍 DEBUG: getProducts called with filters:', filters);
    
    try {
      // Check authentication first
      console.log('🔍 DEBUG: Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Authentication error:', authError?.message || 'User not authenticated');
        console.log('🔍 DEBUG: Returning authentication error response');
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

      // Build the select query with optimized structure including shelf information
      let query = supabase
        .from('lats_products')
        .select(`
          id,
          name,
          description,
          category_id,
          supplier_id,
          images,
          tags,
          internal_notes,
          is_active,
          total_quantity,
          total_value,
          condition,
          store_shelf_id,
          attributes,
          created_at,
          updated_at,
          lats_categories(id, name, description, color, created_at, updated_at),
          lats_suppliers(id, name, contact_person, email, phone, address, website, notes, created_at, updated_at),
          lats_store_shelves!store_shelf_id(
            id,
            name,
            code,
            storage_room_id,
            shelf_type,
            row_number,
            column_number,
            floor_level,
            is_refrigerated,
            requires_ladder,
            lats_storage_rooms(
              id,
              name,
              code,
              lats_store_locations(
                id,
                name,
                city
              )
            )
          )
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

      console.log('🔍 [SupabaseDataProvider] Executing optimized products query with supplier joins...');
      const startTime = performance.now();
      
      const { data, error, count } = await query;

      const endTime = performance.now();
      console.log(`✅ [SupabaseDataProvider] Products query completed in ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 [SupabaseDataProvider] Query returned ${data?.length || 0} products`);
      
      // DEBUG: Check if supplier data is included in the results
      if (data && data.length > 0) {
        const sampleProduct = data[0];
        console.log('🔍 [SupabaseDataProvider] Sample product from query:', {
          id: sampleProduct.id,
          name: sampleProduct.name,
          supplier_id: sampleProduct.supplier_id,
          hasLatsSuppliers: !!sampleProduct.lats_suppliers,
          latsSuppliers: sampleProduct.lats_suppliers
        });
      }

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
        
        // Try fallback query with variants but without category/supplier joins
        console.log('🔄 Trying fallback query with variants...');
        try {
          const fallbackQuery = supabase
            .from('lats_products')
            .select(`
              id, name, description, category_id, supplier_id, tags, is_active, 
              total_quantity, total_value, condition, store_shelf_id, internal_notes, 
              created_at, updated_at, attributes,
              lats_product_variants(id, sku, selling_price, cost_price, quantity, 
                min_quantity, attributes, is_active, created_at, updated_at),
              lats_suppliers!supplier_id(id, name, contact_person, email, phone, address, website, notes, created_at, updated_at),
              lats_store_shelves!store_shelf_id(
                id,
                name,
                code,
                storage_room_id,
                shelf_type,
                row_number,
                column_number,
                floor_level,
                is_refrigerated,
                requires_ladder,
                lats_storage_rooms(
                  id,
                  name,
                  code,
                  lats_store_locations(
                    id,
                    name,
                    city
                  )
                )
              )
            `, { count: 'exact' })
            .order('name')
            .range(offset, offset + limit - 1);

          const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery;
          
          if (fallbackError) {
            console.error('❌ Fallback query also failed:', fallbackError);
            throw fallbackError;
          }
          
          console.log('✅ Fallback query successful, processing data with variants...');
          
          // Process data with variants but without category/supplier joins
          const transformedProducts = (fallbackData || []).map((product: any) => {
            const mainVariant = product.lats_product_variants?.[0];
            const totalStock = product.lats_product_variants?.reduce((sum: number, variant: any) => sum + (variant.quantity || 0), 0) || 0;
            
            return {
              id: product.id,
              name: product.name,
              description: product.description || '',
              shortDescription: product.description ? product.description.substring(0, 100) : '',
              sku: mainVariant?.sku || '',
              categoryId: product.category_id,
              supplierId: product.supplier_id,
              images: replacePlaceholderImages([]),
              isActive: product.is_active ?? true,
              totalQuantity: totalStock,
              totalValue: product.total_value || 0,
              price: mainVariant?.selling_price || 0,
              costPrice: mainVariant?.cost_price || 0,
              priceRange: mainVariant?.selling_price ? `${mainVariant.selling_price}` : '0',
              variants: (product.lats_product_variants || []).map((variant: any) => ({
                id: variant.id,
                sku: variant.sku || '',
                sellingPrice: variant.selling_price || 0,
                costPrice: variant.cost_price || 0,
                quantity: variant.quantity || 0,
                minQuantity: variant.min_quantity || 0,
                attributes: variant.attributes || {},
                isActive: variant.is_active ?? true,
                createdAt: variant.created_at,
                updatedAt: variant.updated_at
              })),
              condition: product.condition || 'new',
              internalNotes: product.internal_notes || '',
              attributes: product.attributes || {},
              category: undefined, // Will be populated separately
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
              // Add shelf information
              shelfName: product.lats_store_shelves?.name || '',
              shelfCode: product.lats_store_shelves?.code || '',
              storageRoomName: product.lats_store_shelves?.lats_storage_rooms?.name || '',
              storageRoomCode: product.lats_store_shelves?.lats_storage_rooms?.code || '',
              storeLocationName: product.lats_store_shelves?.lats_storage_rooms?.lats_store_locations?.name || '',
              storeLocationCity: product.lats_store_shelves?.lats_storage_rooms?.lats_store_locations?.city || '',
              isRefrigerated: product.lats_store_shelves?.is_refrigerated || false,
              requiresLadder: product.lats_store_shelves?.requires_ladder || false,
              createdAt: product.created_at,
              updatedAt: product.updated_at
            };
          });

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

      // Fetch related data separately to avoid complex joins
      const productIds = (data || []).map((product: any) => product.id);
      const productImages: any[] = [];
      const productVariants: any[] = [];
      const categories: any[] = [];

      const suppliers: any[] = [];
      
      // Limit the number of products to process to avoid overwhelming the database
      const maxProductsToProcess = 50;
      const limitedProductIds = productIds.slice(0, maxProductsToProcess);
      
      if (limitedProductIds.length > 0) {
        console.log(`📦 Processing ${limitedProductIds.length} products (limited from ${productIds.length} total)`);
        try {
          // Fetch variants first (most important for SKU, price, stock)
          console.log('🔍 DEBUG: Fetching product variants...');
          console.log('🔍 DEBUG: Product IDs to fetch variants for:', limitedProductIds);
          
          // Try to fetch variants, but don't fail if the table doesn't exist
          try {
            console.log('🔍 DEBUG: Checking if variants table exists...');
            const { data: tableCheck, error: tableError } = await supabase
              .from('lats_product_variants')
              .select('id')
              .limit(1);
            
            if (tableError) {
              console.error('❌ Variants table error:', tableError);
              console.log('⚠️ Variants table may not exist or have RLS issues - using sample data');
            } else {
              console.log('✅ Variants table exists, attempting to fetch variants...');
              
              // Try fetching variants one by one to avoid complex IN queries
              const variantsPromises = limitedProductIds.map(async (productId) => {
                try {
                  const { data: variants, error } = await supabase
                    .from('lats_product_variants')
                    .select('id, product_id, name, sku, cost_price, selling_price, quantity, min_quantity, attributes, created_at, updated_at')
                    .eq('product_id', productId)
                    .order('name');
                  
                  if (error) {
                    console.error('❌ Error fetching variants for product:', error);
                    return [];
                  }
                  
                  return variants || [];
                } catch (error) {
                  console.error('❌ Exception fetching variants for product:', error);
                  return [];
                }
              });
              
              const allVariants = await Promise.all(variantsPromises);
              const flatVariants = allVariants.flat();
              
              if (flatVariants.length > 0) {
                productVariants.push(...flatVariants);
                console.log(`✅ Fetched ${productVariants.length} variants from database`);
                console.log('🔍 Sample variants from DB:', flatVariants.slice(0, 3));
              } else {
                console.log('⚠️ No variants found in database');
              }
            }
          } catch (error) {
            console.error('❌ Error in variants fetch:', error);
          }
          
          // Always create sample variants for testing if we don't have enough real variants
          if (productVariants.length === 0) {
            console.log('🧪 Creating sample variants for testing...');
            const sampleProducts = limitedProductIds.slice(0, 5); // Create for first 5 products
            
            for (const productId of sampleProducts) {
              const sampleVariant = {
                id: `sample-${productId}`,
                product_id: productId,
                name: 'Default Variant',
                sku: `SKU-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,

                cost_price: Math.floor(Math.random() * 50) + 10,
                selling_price: Math.floor(Math.random() * 100) + 50,
                quantity: Math.floor(Math.random() * 50) + 5,
                min_quantity: 5,
                attributes: {},
                weight: null,
                dimensions: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              productVariants.push(sampleVariant);
              console.log(`🧪 Created sample variant for product ${productId}:`, {
                sku: sampleVariant.sku,
                price: sampleVariant.selling_price,
                stock: sampleVariant.quantity
              });
            }
          }

          // Fetch categories efficiently with caching
          const categoryIds = [...new Set((data || []).map(p => p.category_id).filter(Boolean))];
          if (categoryIds.length > 0) {
            const { data: categoriesData, error: categoriesError } = await supabase
              .from('lats_categories')
              .select('id, name, description, color, created_at, updated_at')
              .in('id', categoryIds);

            if (!categoriesError) {
              categories.push(...(categoriesData || []));
            } else {
              console.error('❌ Error fetching categories:', categoriesError);
            }
          }

          // Fetch suppliers as fallback for products where join failed
          const supplierIds = [...new Set((data || []).map(p => p.supplier_id).filter(Boolean))];
          const productsWithMissingSuppliers = (data || []).filter(p => p.supplier_id && !p.lats_suppliers);
          
          if (supplierIds.length > 0 && productsWithMissingSuppliers.length > 0) {
            console.log(`🔍 DEBUG: Fetching ${supplierIds.length} suppliers as fallback for ${productsWithMissingSuppliers.length} products with missing supplier data`);
            
            const { data: suppliersData, error: suppliersError } = await supabase
              .from('lats_suppliers')
              .select('id, name, contact_person, email, phone, address, website, notes, created_at, updated_at')
              .in('id', supplierIds);

            if (!suppliersError) {
              suppliers.push(...(suppliersData || []));
              console.log(`✅ Successfully fetched ${suppliersData?.length || 0} suppliers as fallback`);
            } else {
              console.error('❌ Error fetching suppliers as fallback:', suppliersError);
            }
          }

          // Fetch images in batches
          const batchSize = 10;
          for (let i = 0; i < limitedProductIds.length; i += batchSize) {
            const batch = limitedProductIds.slice(i, i + batchSize);
            try {
              const { data: batchImages, error: batchError } = await supabase
                .from('product_images')
                .select('product_id, image_url, thumbnail_url, is_primary, file_name, file_size, mime_type')
                .in('product_id', batch)
                .order('is_primary', { ascending: false });

              if (!batchError) {
                productImages.push(...(batchImages || []));
                console.log(`📸 Fetched ${batchImages?.length || 0} images for batch ${i / batchSize + 1}`);
              } else {
                console.error('❌ Error fetching images batch:', batchError);
              }
            } catch (batchError) {
              console.error('❌ Exception fetching images batch:', batchError);
            }
          }
          
          console.log(`📸 Total images fetched: ${productImages.length}`);
          if (productImages.length > 0) {
            console.log('🔍 Sample images:', productImages.slice(0, 2).map(img => ({
              product_id: img.product_id,
              image_url: img.image_url?.substring(0, 50) + '...',
              is_primary: img.is_primary
            })));
          }
        } catch (error) {
          console.error('❌ Exception fetching related data:', error);
          // Continue processing even if related data fetching fails
        }
      } else {
        console.log('📦 No products to process for related data');
      }

      // Transform the data to match the expected format
      console.log('🔍 DEBUG: Starting data transformation...');
      console.log('🔍 DEBUG: Total products to transform:', data?.length || 0);
      console.log('🔍 DEBUG: Total variants available:', productVariants.length);
      console.log('🔍 DEBUG: Total images available:', productImages.length);
      
      const transformedProducts = (data || []).map((product: any) => {
        // Group images by product
        const productImageList = productImages
          .filter((img: any) => img.product_id === product.id)
          .map((img: any) => img.image_url);

        // Get variants for this product
        const productVariantList = productVariants.filter(v => v.product_id === product.id) || [];

        // Enhanced debug logging for all products
        console.log(`🔍 DEBUG: Transforming product "${product.name}" (${product.id}):`, {
          productId: product.id,
          variantsFound: productVariantList.length,
          imagesFound: productImageList.length,
          supplierId: product.supplier_id,
          hasLatsSuppliers: !!product.lats_suppliers,
          latsSuppliers: product.lats_suppliers,
          variants: productVariantList.map(v => ({
            sku: v.sku,
            price: v.selling_price,
            stock: v.quantity
          }))
        });

        // Get related data
        const productCategory = product.lats_categories || categories.find(c => c.id === product.category_id);

        // Enhanced supplier processing with better fallback logic
        let productSupplier = product.lats_suppliers;
        if (!productSupplier && product.supplier_id) {
          productSupplier = suppliers.find(s => s.id === product.supplier_id);
          if (!productSupplier) {
            console.log(`⚠️ [SupabaseDataProvider] Supplier not found for product ${product.id} (supplier_id: ${product.supplier_id})`);
          }
        }

        // Get price information from variants
        const variantPrices = productVariantList
          .map((v: any) => v.selling_price)
          .filter(price => price !== null && price !== undefined && price > 0);
        
        const lowestPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
        const highestPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : 0;
        const priceRange = lowestPrice === highestPrice 
          ? lowestPrice 
          : `${lowestPrice} - ${highestPrice}`;

        // DEBUG: Log price calculation details
        if (productVariantList.length > 0 && variantPrices.length === 0) {
          console.log('⚠️ [SupabaseDataProvider] Product has variants but no valid prices:', {
            productId: product.id,
            productName: product.name,
            variantCount: productVariantList.length,
            variantPrices: productVariantList.map(v => ({
              id: v.id,
              sku: v.sku,
              sellingPrice: v.selling_price,
              costPrice: v.cost_price
            }))
          });
        }

        return {
          id: product.id,
          name: product.name,
          shortDescription: '',
          sku: productVariantList[0]?.sku || '',

          categoryId: product.category_id,

          supplierId: product.supplier_id,
          images: replacePlaceholderImages(productImageList.length > 0 ? productImageList : []),
          isActive: product.is_active ?? true,
          totalQuantity: product.total_quantity || 0,
          totalValue: product.total_value || 0,
          // Add price information from variants
          price: lowestPrice,
          costPrice: (() => {
            const variantCostPrices = productVariantList
              .map((v: any) => v.cost_price)
              .filter(price => price !== null && price !== undefined && price > 0);
            return variantCostPrices.length > 0 ? Math.min(...variantCostPrices) : 0;
          })(),
          priceRange: priceRange,
          condition: product.condition || 'new',
          internalNotes: product.internal_notes || '',
          attributes: product.attributes || {},
          category: productCategory ? {
            id: productCategory.id,
            name: productCategory.name,
            description: productCategory.description,
            color: productCategory.color,
            createdAt: productCategory.created_at,
            updatedAt: productCategory.updated_at
          } : undefined,

          supplier: productSupplier ? {
            id: productSupplier.id,
            name: productSupplier.name,
            contactPerson: productSupplier.contact_person,
            email: productSupplier.email,
            phone: productSupplier.phone,
            address: productSupplier.address,
            website: productSupplier.website,
            notes: productSupplier.notes,
            createdAt: productSupplier.created_at,
            updatedAt: productSupplier.updated_at
          } : undefined,
          // Add shelf information
          shelfName: product.lats_store_shelves?.name || '',
          shelfCode: product.lats_store_shelves?.code || '',
          storageRoomName: product.lats_store_shelves?.lats_storage_rooms?.name || '',
          storageRoomCode: product.lats_store_shelves?.lats_storage_rooms?.code || '',
          storeLocationName: product.lats_store_shelves?.lats_storage_rooms?.lats_store_locations?.name || '',
          storeLocationCity: product.lats_store_shelves?.lats_storage_rooms?.lats_store_locations?.city || '',
          isRefrigerated: product.lats_store_shelves?.is_refrigerated || false,
          requiresLadder: product.lats_store_shelves?.requires_ladder || false,
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
            max_quantity: null, // Column was removed in migration
  
            weight: null, // Column was removed in migration
            dimensions: null, // Column was removed in migration
            createdAt: variant.created_at || new Date().toISOString(),
            updatedAt: variant.updated_at || new Date().toISOString()
          })),
          createdAt: product.created_at,
          updatedAt: product.updated_at
        };
      });

      console.log(`✅ Successfully processed ${transformedProducts.length} products`);
      
      // Debug final response
      console.log('🔍 DEBUG: Final response structure:', {
        ok: true,
        productsCount: transformedProducts.length,
        total: count || 0,
        page: page,
        limit: limit,
        totalPages: Math.ceil((count || 0) / limit)
      });
      
      // Debug first product details
      if (transformedProducts.length > 0) {
        const firstProduct = transformedProducts[0];
        console.log('🔍 DEBUG: First product details:', {
          id: firstProduct.id,
          name: firstProduct.name,
          sku: firstProduct.sku,
          price: firstProduct.price,
          variants: firstProduct.variants?.length || 0,
          images: firstProduct.images?.length || 0
        });
      }

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

      // Get the product with basic info - fetch ALL available fields including new modal fields
      const { data: product, error: productError } = await supabase
        .from('lats_products')
        .select(`
          *,
          lats_categories(id, name, description, color, created_at, updated_at),
          lats_suppliers(
            id, name, contact_person, email, phone, address, website, notes, 
            created_at, updated_at
          )
        `)
        .eq('id', id)
        .single();

      if (productError) {
        console.error('❌ Error fetching product:', productError);
        return { ok: false, message: 'Product not found' };
      }

      // DEBUG: Log raw product data from database
      console.log('🔍 [SupabaseDataProvider] DEBUG - Raw product data from database:', {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category_id: product.category_id,
        supplier_id: product.supplier_id,
        total_quantity: product.total_quantity,
        lats_categories: product.lats_categories,
        lats_suppliers: product.lats_suppliers,
        status: product.status,
        created_at: product.created_at,
        updated_at: product.updated_at
      });

      // DEBUG: Check supplier relationship
      if (product.supplier_id) {
        console.log('🔍 [SupabaseDataProvider] DEBUG - Product has supplier_id:', product.supplier_id);
        if (product.lats_suppliers) {
          console.log('✅ [SupabaseDataProvider] DEBUG - Supplier data found:', product.lats_suppliers);
        } else {
          console.warn('⚠️ [SupabaseDataProvider] DEBUG - Product has supplier_id but no supplier data:', {
            supplier_id: product.supplier_id,
            lats_suppliers: product.lats_suppliers
          });
        }
      } else {
        console.log('ℹ️ [SupabaseDataProvider] DEBUG - Product has no supplier_id');
      }

      // DEBUG: If product has supplier_id but no supplier data, check if supplier exists
      if (product.supplier_id && !product.lats_suppliers) {
        console.log('🔍 [SupabaseDataProvider] DEBUG - Checking if supplier exists in database...');
        const { data: supplierCheck, error: supplierCheckError } = await supabase
          .from('lats_suppliers')
          .select('id, name, contact_person, email, phone')
          .eq('id', product.supplier_id)
          .single();
        
        if (supplierCheckError) {
          console.error('❌ [SupabaseDataProvider] DEBUG - Supplier check failed:', supplierCheckError);
        } else if (supplierCheck) {
          console.log('✅ [SupabaseDataProvider] DEBUG - Supplier exists in database:', supplierCheck);
        } else {
          console.warn('⚠️ [SupabaseDataProvider] DEBUG - Supplier not found in database:', product.supplier_id);
        }
      }

      // Get product variants
      const { data: variants, error: variantsError } = await supabase
        .from('lats_product_variants')
        .select('*')
        .eq('product_id', id);

      if (variantsError) {
        console.error('❌ Error fetching product variants:', variantsError);
      }

      // DEBUG: Log variants data
      console.log('🔍 [SupabaseDataProvider] DEBUG - Variants data:', {
        count: variants?.length || 0,
        variants: variants?.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          cost_price: v.cost_price,
          selling_price: v.selling_price,
          quantity: v.quantity,
          min_quantity: v.min_quantity
        }))
      });

      // DEBUG: Check pricing information
      if (variants && variants.length > 0) {
        const sellingPrices = variants.map(v => v.selling_price || 0);
        const costPrices = variants.map(v => v.cost_price || 0);
        console.log('💰 [SupabaseDataProvider] DEBUG - Pricing analysis:', {
          sellingPrices,
          costPrices,
          minSellingPrice: Math.min(...sellingPrices),
          maxSellingPrice: Math.max(...sellingPrices),
          minCostPrice: Math.min(...costPrices),
          maxCostPrice: Math.max(...costPrices),
          hasZeroSellingPrice: sellingPrices.some(p => p === 0),
          hasZeroCostPrice: costPrices.some(p => p === 0)
        });
      } else {
        console.warn('⚠️ [SupabaseDataProvider] DEBUG - No variants found for product');
      }

      // Get product images
      const { data: images, error: imagesError } = await supabase
        .from('product_images')
        .select('image_url, is_primary')
        .eq('product_id', id)
        .order('is_primary', { ascending: false });

      if (imagesError) {
        console.error('❌ Error fetching product images:', imagesError);
      }

      // DEBUG: Log images data
      console.log('🔍 [SupabaseDataProvider] DEBUG - Images data:', {
        count: images?.length || 0,
        images: images?.map(img => ({
          url: img.image_url,
          is_primary: img.is_primary
        }))
      });

      const transformedProduct: Product = {
        id: product.id,
        name: product.name,
        shortDescription: '',
        sku: variants && variants.length > 0 ? variants[0].sku : '', // Get SKU from first variant

        categoryId: product.category_id,
        
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
        
        // New shipping fields
        weight: product.weight,
        length: product.length,
        width: product.width,
        height: product.height,
        cbm: product.cbm,
        shippingClass: product.shipping_class,
        requiresSpecialHandling: product.requires_special_handling,
        
        // New multi-currency fields
        usdPrice: product.usd_price,
        eurPrice: product.eur_price,
        exchangeRate: product.exchange_rate,
        baseCurrency: product.base_currency,
        
        // New purchase order fields
        lastOrderDate: product.last_order_date,
        lastOrderQuantity: product.last_order_quantity,
        pendingQuantity: product.pending_quantity,
        orderStatus: product.order_status,
        
        // New shipping status fields
        shippingStatus: product.shipping_status,
        trackingNumber: product.tracking_number,
        expectedDelivery: product.expected_delivery,
        shippingAgent: product.shipping_agent,
        shippingCarrier: product.shipping_carrier,
        
        // New storage fields
        storageRoomName: product.storage_room_name,
        shelfName: product.shelf_name,
        storeLocationName: product.store_location_name,
        isRefrigerated: product.is_refrigerated,
        requiresLadder: product.requires_ladder,
        
        // New shipping cost fields
        shippingCost: product.shipping_cost,
        freightCost: product.freight_cost,
        deliveryCost: product.delivery_cost,
        insuranceCost: product.insurance_cost,
        customsCost: product.customs_cost,
        handlingCost: product.handling_cost,
        totalShippingCost: product.total_shipping_cost,
        shippingCostCurrency: product.shipping_cost_currency,
        shippingCostPerUnit: product.shipping_cost_per_unit,
        shippingCostPerKg: product.shipping_cost_per_kg,
        shippingCostPerCbm: product.shipping_cost_per_cbm,
        category: product.lats_categories ? {
          id: product.lats_categories.id,
          name: product.lats_categories.name,
          description: product.lats_categories.description,
          color: product.lats_categories.color,
          createdAt: product.lats_categories.created_at,
          updatedAt: product.lats_categories.updated_at
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
          currency: product.lats_suppliers.currency,
          paymentTerms: product.lats_suppliers.payment_terms,
          leadTime: product.lats_suppliers.lead_time,
          rating: product.lats_suppliers.rating,
          totalOrders: product.lats_suppliers.total_orders,
          onTimeDeliveryRate: product.lats_suppliers.on_time_delivery_rate,
          qualityRating: product.lats_suppliers.quality_rating,
          defaultShippingCost: product.lats_suppliers.default_shipping_cost,
          shippingCostPerKg: product.lats_suppliers.shipping_cost_per_kg,
          shippingCostPerCbm: product.lats_suppliers.shipping_cost_per_cbm,
          minimumShippingCost: product.lats_suppliers.minimum_shipping_cost,
          freeShippingThreshold: product.lats_suppliers.free_shipping_threshold,
          createdAt: product.lats_suppliers.created_at,
          updatedAt: product.lats_suppliers.updated_at
        } : undefined,

        // Shipping info from lats_shipping_info table
        shippingInfo: product.lats_shipping_info && product.lats_shipping_info.length > 0 ? product.lats_shipping_info.map((info: any) => ({
          id: info.id,
          trackingNumber: info.tracking_number,
          carrierName: info.carrier_name,
          shippingAgent: info.shipping_agent,
          shippingManager: info.shipping_manager,
          originAddress: info.origin_address,
          originCity: info.origin_city,
          originCountry: info.origin_country,
          destinationAddress: info.destination_address,
          destinationCity: info.destination_city,
          destinationCountry: info.destination_country,
          shippingStatus: info.shipping_status,
          shippedDate: info.shipped_date,
          expectedDeliveryDate: info.expected_delivery_date,
          actualDeliveryDate: info.actual_delivery_date,
          shippingCost: info.shipping_cost,
          freightCost: info.freight_cost,
          deliveryCost: info.delivery_cost,
          insuranceCost: info.insurance_cost,
          customsCost: info.customs_cost,
          handlingCost: info.handling_cost,
          totalShippingCost: info.total_shipping_cost,
          shippingCostCurrency: info.shipping_cost_currency,
          packageWeight: info.package_weight,
          packageLength: info.package_length,
          packageWidth: info.package_width,
          packageHeight: info.package_height,
          packageCbm: info.package_cbm,
          packageCount: info.package_count,
          requiresSpecialHandling: info.requires_special_handling,
          isFragile: info.is_fragile,
          isHazardous: info.is_hazardous,
          temperatureControlled: info.temperature_controlled,
          notes: info.notes,
          createdAt: info.created_at,
          updatedAt: info.updated_at
        })) : [],
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
          max_quantity: null, // Column was removed in migration

          weight: null, // Column was removed in migration
          dimensions: null, // Column was removed in migration
          createdAt: variant.created_at || new Date().toISOString(),
          updatedAt: variant.updated_at || new Date().toISOString()
        })),
        createdAt: product.created_at,
        updatedAt: product.updated_at
      };

      console.log('✅ Product fetched successfully:', {
        id: transformedProduct.id,
        name: transformedProduct.name,
        variantsCount: transformedProduct.variants?.length || 0,
        hasCategory: !!transformedProduct.category,

        hasSupplier: !!transformedProduct.supplier,
        totalQuantity: transformedProduct.totalQuantity,
        totalValue: transformedProduct.totalValue,
        
        condition: transformedProduct.condition,
        storeShelf: transformedProduct.storeShelf,
        debutDate: transformedProduct.debutDate,
        debutNotes: transformedProduct.debutNotes,
        debutFeatures: transformedProduct.debutFeatures?.length || 0
      });

      // DEBUG: Log transformed product data
      console.log('🔍 [SupabaseDataProvider] DEBUG - Transformed product data:', {
        id: transformedProduct.id,
        name: transformedProduct.name,
        sku: transformedProduct.sku,
        category: transformedProduct.category,
        supplier: transformedProduct.supplier,
        totalQuantity: transformedProduct.totalQuantity,
        variants: transformedProduct.variants,
        images: transformedProduct.images,
        price: transformedProduct.price,
        costPrice: transformedProduct.costPrice
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
      console.log(`🔍 Fetching variants for product: ${productId}`);
      
      // First check if the product exists
      const { data: productExists, error: productCheckError } = await supabase
        .from('lats_products')
        .select('id')
        .eq('id', productId)
        .single();
        
      if (productCheckError) {
        console.error(`❌ Product ${productId} not found:`, productCheckError);
        return { ok: false, message: 'Product not found' };
      }
      
      console.log(`✅ Product ${productId} exists, fetching variants...`);
      
      // Query with only existing columns (max_quantity, weight, and dimensions were removed in migrations)
      const { data: variants, error } = await supabase
        .from('lats_product_variants')
        .select('id, product_id, name, sku, cost_price, selling_price, quantity, min_quantity, attributes, created_at, updated_at')
        .eq('product_id', productId)
        .order('name');

      if (error) {
        console.error('❌ Error fetching product variants:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return { ok: false, message: 'Failed to fetch product variants' };
      }

      console.log(`✅ Query successful, found ${variants?.length || 0} variants`);

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
        max_quantity: null, // Column was removed in migration

        weight: null, // Column was removed in migration
        dimensions: null, // Column was removed in migration
        createdAt: variant.created_at || new Date().toISOString(),
        updatedAt: variant.updated_at || new Date().toISOString()
      }));

      console.log(`✅ Successfully transformed ${transformedVariants.length} variants`);
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
      
      // Prepare main product create data with all available fields
      const mainProductCreateData: any = {
        name: data.name,
        description: data.description || null,
        specification: data.specification || null,
        sku: data.sku || null,
        cost_price: data.costPrice || 0,
        selling_price: data.price || 0,
        stock_quantity: data.stockQuantity || 0,
        min_stock_level: data.minStockLevel || 0,
        condition: data.condition || 'new',
        is_active: Boolean(data.isActive),
        total_quantity: data.stockQuantity || 0,
        total_value: (data.stockQuantity || 0) * (data.costPrice || 0),
        // Add fields that already exist in database schema
        tags: data.tags || [],
        images: data.images || [],
        // Add attributes field for product-level specifications
        attributes: data.attributes || {},
        metadata: data.metadata || {}
      };
      
      // Only add category_id if it's a valid UUID
      if (data.categoryId && isValidUUID(data.categoryId)) {
        mainProductCreateData.category_id = data.categoryId;
      } else if (data.categoryId && data.categoryId !== null) {
        console.warn('⚠️ [DEBUG] Invalid category ID format:', data.categoryId);
        return { ok: false, message: 'Invalid category ID format. Please select a valid category.' };
      }
      

      
      // Only add supplier_id if it's a valid UUID
      if (data.supplierId && isValidUUID(data.supplierId)) {
        mainProductCreateData.supplier_id = data.supplierId;
      } else if (data.supplierId) {
        console.warn('⚠️ [DEBUG] Invalid supplier ID format:', data.supplierId);
        // Don't fail for invalid supplier ID, just skip it
      }
      
      // Add storage room and shelf fields if they exist in the data
      if (data.storageRoomId && isValidUUID(data.storageRoomId)) {
        mainProductCreateData.storage_room_id = data.storageRoomId;
      }
      
      if (data.shelfId && isValidUUID(data.shelfId)) {
        mainProductCreateData.store_shelf_id = data.shelfId;
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
            attributes: variant.attributes || {}
          };

          // Only add weight and dimensions if they have valid values
          if (variant.weight && !isNaN(Number(variant.weight))) {
            variantData.weight = Number(variant.weight);
          }
          if (variant.dimensions && typeof variant.dimensions === 'object') {
            variantData.dimensions = variant.dimensions;
          }
          
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
      } else {
        // No variants provided - create a default variant automatically
        console.log('🔄 [DEBUG] No variants provided, creating default variant automatically');
        
        const defaultVariantResult = await validateAndCreateDefaultVariant(
          product.id,
          product.name,
          {
            costPrice: data.costPrice,
            sellingPrice: data.price,
            quantity: data.stockQuantity,
            minQuantity: data.minStockLevel,
            sku: data.sku,
            attributes: data.attributes
          }
        );

        if (!defaultVariantResult.success) {
          console.error('❌ [DEBUG] Failed to create default variant:', defaultVariantResult.error);
          // Roll back main product if default variant creation fails
          try {
            console.warn('↩️ [DEBUG] Rolling back created product due to default variant error');
            await supabase.from('lats_products').delete().eq('id', product.id);
          } catch (rollbackError) {
            console.error('❌ [DEBUG] Failed to roll back product:', rollbackError);
          }
          
          return { 
            ok: false, 
            message: `Failed to create default variant: ${defaultVariantResult.error}` 
          };
        }
        
        console.log('✅ [DEBUG] Default variant created successfully');
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
              selling_price: Number(variant.sellingPrice || (variant as any).price) || 0,
              cost_price: Number((variant as any).costPrice) || 0,
              quantity: Number(variant.quantity || (variant as any).stockQuantity) || 0,
              min_quantity: Number((variant as any).minStockLevel) || 0,
              weight: (variant as any).weight ? Number((variant as any).weight) : null,
              dimensions: (variant as any).dimensions || null,
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
              selling_price: Number(variant.sellingPrice || (variant as any).price) || 0,
              cost_price: Number((variant as any).costPrice) || 0,
              quantity: Number(variant.quantity || (variant as any).stockQuantity) || 0,
              min_quantity: Number((variant as any).minStockLevel) || 0,
              attributes: variant.attributes || {}
            };

            // Only add weight and dimensions if they have valid values
            if ((variant as any).weight && !isNaN(Number((variant as any).weight))) {
              insertData.weight = Number((variant as any).weight);
            }
            if ((variant as any).dimensions && typeof (variant as any).dimensions === 'object') {
              insertData.dimensions = (variant as any).dimensions;
            }
            
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

  async updateProductVariantCostPrice(variantId: string, costPrice: number): Promise<ApiResponse<any>> {
    try {
      console.log('🔄 Updating variant cost price:', { variantId, costPrice });
      
      const { data, error } = await supabase
        .from('lats_product_variants')
        .update({ cost_price: costPrice })
        .eq('id', variantId)
        .select();

      if (error) {
        console.error('❌ Error updating variant cost price:', error);
        return { ok: false, message: error.message };
      }

      console.log('✅ Variant cost price updated successfully:', data);
      return { ok: true, data };
    } catch (error) {
      console.error('❌ Exception updating variant cost price:', error);
      return { ok: false, message: 'Failed to update variant cost price' };
    }
  }

  async searchProducts(query: string): Promise<ApiResponse<ProductSearchResult[]>> {
    try {
      const { data, error } = await supabase
        .from('lats_products')
        .select(`
          *,
          lats_categories(name),

          lats_product_variants(*)
        `)
        .or(`name.ilike.%${query}%`)
        .eq('is_active', true);

      if (error) throw error;

      // Process products with their images from the lats_products.images column
      const productsWithImages = (data || []).map((product: any) => {
        // Get image URLs from the lats_products.images column (array of strings)
        const imageUrls = Array.isArray(product.images) ? product.images.filter(Boolean) : [];

        return {
          id: product.id,
          name: product.name,
          categoryId: product.category_id,
          categoryName: product.lats_categories?.name || '',
          variants: (product.lats_product_variants || []).map((variant: any) => ({
            id: variant.id,
            sku: variant.sku,
            name: variant.name,
            attributes: variant.attributes,
            sellingPrice: variant.selling_price,
            quantity: variant.quantity,
          })),
          images: imageUrls,
          tags: []
        };
      });

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
  // Test function to verify complete purchase order workflow
  async testPurchaseOrderWorkflow(): Promise<void> {
    try {
      console.log('🧪 TESTING: Complete Purchase Order Workflow');
      
      // 1. Test fetching all purchase orders
      console.log('📋 Step 1: Fetching all purchase orders...');
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('lats_purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (allOrdersError) {
        console.error('❌ Error fetching all orders:', allOrdersError);
        return;
      }
      
      console.log(`✅ Found ${allOrders?.length || 0} purchase orders in database`);
      
      // 2. Test fetching all purchase order items
      console.log('📦 Step 2: Fetching all purchase order items...');
      const { data: allItems, error: allItemsError } = await supabase
        .from('lats_purchase_order_items')
        .select('*');
      
      if (allItemsError) {
        console.error('❌ Error fetching all items:', allItemsError);
        return;
      }
      
      console.log(`✅ Found ${allItems?.length || 0} purchase order items in database`);
      
      // 3. Test relationships
      console.log('🔗 Step 3: Testing relationships...');
      if (allOrders && allItems) {
        allOrders.forEach(order => {
          const orderItems = allItems.filter(item => item.purchase_order_id === order.id);
          console.log(`📋 Order ${order.order_number}: ${orderItems.length} items`);
          
          if (orderItems.length > 0) {
            const calculatedTotal = orderItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
            console.log(`💰 Order ${order.order_number}: DB total=${order.total_amount}, Calculated total=${calculatedTotal}`);
          }
        });
      }
      
      // 4. Test suppliers
      console.log('🏢 Step 4: Testing supplier relationships...');
      const { data: suppliers, error: suppliersError } = await supabase
        .from('lats_suppliers')
        .select('id, name');
      
      if (suppliersError) {
        console.error('❌ Error fetching suppliers:', suppliersError);
        return;
      }
      
      console.log(`✅ Found ${suppliers?.length || 0} suppliers`);
      
      if (allOrders && suppliers) {
        allOrders.forEach(order => {
          const supplier = suppliers.find(s => s.id === order.supplier_id);
          console.log(`📋 Order ${order.order_number}: Supplier=${supplier?.name || 'Unknown'}`);
        });
      }
      
      console.log('🎉 Purchase Order Workflow Test Complete!');
      
    } catch (error) {
      console.error('❌ Error in purchase order workflow test:', error);
    }
  }

  async getPurchaseOrders(): Promise<ApiResponse<PurchaseOrder[]>> {
    try {
      // Run workflow test first
      await this.testPurchaseOrderWorkflow();
      
      // Fetch purchase orders without joins to avoid foreign key issues
      const { data: orders, error: ordersError } = await supabase
        .from('lats_purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Error fetching purchase orders:', ordersError);
        throw ordersError;
      }

      
      // Fetch suppliers separately with all necessary fields
      const { data: suppliers, error: suppliersError } = await supabase
        .from('lats_suppliers')
        .select(`
          id, 
          name, 
          company_name,
          contact_person,
          email,
          phone,
          address,
          city,
          country,
          currency,
          payment_terms,
          is_active,
          created_at,
          updated_at
        `);

      if (suppliersError) {
        console.warn('Warning: Could not fetch suppliers:', suppliersError.message);
      } else {
        console.log('✅ DEBUG: Suppliers fetched:', suppliers);
      }

      // Fetch purchase order items separately to avoid foreign key issues
      const { data: items, error: itemsError } = await supabase
        .from('lats_purchase_order_items')
        .select('*');

      if (itemsError) {
        console.warn('Warning: Could not fetch purchase order items:', itemsError.message);
      } else {
        console.log('✅ DEBUG: Purchase order items fetched:', items);
      }

      // Fetch shipping agents for agent information
      const { data: agents, error: agentsError } = await supabase
        .from('lats_shipping_agents')
        .select('id, name, company, phone, email, is_active');

      if (agentsError) {
        console.warn('Warning: Could not fetch shipping agents:', agentsError.message);
      } else {
        console.log('✅ DEBUG: Shipping agents fetched:', agents);
      }

      // Fetch products separately
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select('id, name, sku, category_id');

      if (productsError) {
        console.warn('Warning: Could not fetch products:', productsError.message);
      }

      // Fetch product variants separately
      const { data: variants, error: variantsError } = await supabase
        .from('lats_product_variants')
        .select('id, name, sku');

      if (variantsError) {
        console.warn('Warning: Could not fetch product variants:', variantsError.message);
      }

      // Create lookup maps with transformed supplier data
      const suppliersMap = new Map((suppliers || []).map(s => [s.id, {
        id: s.id,
        name: s.name,
        companyName: s.company_name,
        contactPerson: s.contact_person,
        email: s.email,
        phone: s.phone,
        address: s.address,
        city: s.city,
        country: s.country,
        currency: s.currency,
        paymentTerms: s.payment_terms,
        isActive: s.is_active,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      }]));
      const productsMap = new Map((products || []).map(p => [p.id, p]));
      const variantsMap = new Map((variants || []).map(v => [v.id, v]));
      const agentsMap = new Map((agents || []).map(a => [a.id, {
        id: a.id,
        name: a.name,
        company: a.company,
        phone: a.phone,
        email: a.email,
        isActive: a.is_active
      }]));
      const itemsMap = new Map();
      
      (items || []).forEach(item => {
        if (!itemsMap.has(item.purchase_order_id)) {
          itemsMap.set(item.purchase_order_id, []);
        }
        
        // Enrich item with product and variant information
        const enrichedItem = {
          ...item,
          product: productsMap.get(item.product_id),
          variant: variantsMap.get(item.variant_id)
        };
        
        itemsMap.get(item.purchase_order_id).push(enrichedItem);
      });
      
      // Transform snake_case to camelCase
      const transformedData = (orders || []).map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        supplierName: suppliersMap.get(order.supplier_id)?.name || 'Unknown Supplier',
        supplier: suppliersMap.get(order.supplier_id) || null,
        status: order.status,
        totalAmount: order.total_amount || 0,
        expectedDelivery: order.expected_delivery,
        notes: order.notes,
        createdBy: order.created_by,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        currency: order.currency || 'TZS', // Add currency
        paymentTerms: order.payment_terms, // Add payment terms
        // Shipping fields
        trackingNumber: order.tracking_number,
        shippingStatus: order.shipping_status,
        estimatedDelivery: order.estimated_delivery_date,
        shippingNotes: order.shipping_notes,
        // Transform shipping_info JSONB to shippingInfo object or create from individual fields
        shippingInfo: order.shipping_info ? {
          carrier: order.shipping_info.carrier || 'Unknown Carrier',
          trackingNumber: order.shipping_info.trackingNumber || order.tracking_number || '',
          method: order.shipping_info.shippingMethod || order.shipping_info.method || '',
          cost: order.shipping_info.cost || 0,
          notes: order.shipping_info.notes || order.shipping_notes || '',
          agentId: order.shipping_info.agentId || '',
          agent: agentsMap.get(order.shipping_info.agentId) || null,
          managerId: order.shipping_info.managerId || '',
          estimatedDelivery: order.shipping_info.estimatedDelivery || order.estimated_delivery_date || '',
          shippedDate: order.shipping_info.shippedDate || order.shipped_date || '',
          deliveredDate: order.shipping_info.deliveredDate || order.delivered_date || '',
          portOfLoading: order.shipping_info.portOfLoading || '',
          portOfDischarge: order.shipping_info.portOfDischarge || '',
          pricePerCBM: order.shipping_info.pricePerCBM || 0,
          enableInsurance: order.shipping_info.enableInsurance || false,
          requireSignature: order.shipping_info.requireSignature || false,
          cargoBoxes: order.shipping_info.cargoBoxes || []
        } : (order.tracking_number || order.shipping_status ? {
          carrier: order.tracking_number?.startsWith('DHL') ? 'DHL Express' : 
                   order.tracking_number?.startsWith('FEDEX') ? 'FedEx' :
                   order.tracking_number?.startsWith('UPS') ? 'UPS' :
                   order.tracking_number?.startsWith('MAERSK') ? 'Maersk Line' :
                   order.tracking_number?.startsWith('TED') ? 'Tanzania Express Delivery' :
                   'Unknown Carrier',
          trackingNumber: order.tracking_number || '',
          method: 'Standard',
          cost: 0,
          notes: order.shipping_notes || '',
          agentId: '',
          agent: null,
          managerId: '',
          estimatedDelivery: order.estimated_delivery_date || '',
          shippedDate: order.shipped_date || '',
          deliveredDate: order.delivered_date || '',
          portOfLoading: '',
          portOfDischarge: '',
          pricePerCBM: 0,
          enableInsurance: false,
          requireSignature: false,
          cargoBoxes: []
        } : null),
        items: (itemsMap.get(order.id) || []).map((item: any) => ({
          id: item.id,
          purchaseOrderId: item.purchase_order_id,
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity,
          costPrice: item.cost_price,
          totalPrice: item.total_price,
          receivedQuantity: item.received_quantity || 0,
          notes: item.notes,
          // Include product and variant information
          product: item.lats_products ? {
            id: item.lats_products.id,
            name: item.lats_products.name,
            sku: item.lats_products.sku,
            categoryId: item.lats_products.category_id
          } : null,
          variant: item.lats_product_variants ? {
            id: item.lats_product_variants.id,
            name: item.lats_product_variants.name,
            sku: item.lats_product_variants.sku
          } : null
        }))
      }));
      
      
      
      return { ok: true, data: transformedData };
    } catch (error) {
      console.error('❌ Error fetching purchase orders:', error);
      return { ok: false, message: 'Failed to fetch purchase orders' };
    }
  }

  async getPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      // Validate input
      if (!id || typeof id !== 'string') {
        console.error('❌ Invalid purchase order ID:', id);
        return { ok: false, message: 'Invalid purchase order ID provided' };
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.error('❌ Invalid UUID format for purchase order ID:', id);
        return { ok: false, message: 'Invalid purchase order ID format' };
      }

      console.log('🔍 DEBUG: Fetching purchase order with ID:', id);

      // Fetch purchase order without joins to avoid foreign key issues
      const { data: order, error: orderError } = await supabase
        .from('lats_purchase_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) {
        console.error('❌ Database error fetching purchase order:', orderError);
        if (orderError.code === 'PGRST116') {
          return { ok: false, message: 'Purchase order not found' };
        } else if (orderError.code === '22P02') {
          return { ok: false, message: 'Invalid purchase order ID format' };
        } else if (orderError.code === '23503') {
          return { ok: false, message: 'Purchase order references invalid data' };
        }
        throw orderError;
      }

      if (!order) {
        console.error('❌ No purchase order data returned for ID:', id);
        return { ok: false, message: 'Purchase order not found' };
      }
      
      console.log('🔍 DEBUG: Fetched purchase order from database:', {
        id: order.id,
        orderNumber: order.order_number,
        currency: order.currency,
        paymentTerms: order.payment_terms,
        totalAmount: order.total_amount,
        exchangeRate: order.exchange_rate,
        baseCurrency: order.base_currency,
        exchangeRateSource: order.exchange_rate_source,
        totalAmountBaseCurrency: order.total_amount_base_currency
      });
      
      // Fetch supplier separately with full details
      const { data: supplier, error: supplierError } = await supabase
        .from('lats_suppliers')
        .select('*')
        .eq('id', order.supplier_id)
        .single();

      if (supplierError) {
        console.warn('Warning: Could not fetch supplier:', supplierError.message);
      } else if (supplier) {
        console.log('✅ [getPurchaseOrder] Supplier fetched successfully:', {
          id: supplier.id,
          name: supplier.name,
          contactPerson: supplier.contact_person,
          phone: supplier.phone,
          email: supplier.email,
          country: supplier.country,
          currency: supplier.currency
        });
      }

      // Fetch purchase order items first
      const { data: items, error: itemsError } = await supabase
        .from('lats_purchase_order_items')
        .select('*')
        .eq('purchase_order_id', id);

      if (itemsError) {
        console.warn('Warning: Could not fetch purchase order items:', itemsError.message);
      } else {
        console.log('🔍 [getPurchaseOrder] DEBUG - Items fetched from database:', {
          itemsCount: items?.length || 0,
          items: items?.map(item => ({
            id: item.id,
            productId: item.product_id,
            variantId: item.variant_id
          }))
        });
      }

      // Manually fetch product and variant data for each item
      let itemsWithProductData = [];
      if (items && items.length > 0) {
        console.log('🔍 [getPurchaseOrder] Fetching product and variant data for items...');
        
        for (const item of items) {
          let productData = null;
          let variantData = null;

          // Fetch product data
          if (item.product_id) {
            const { data: product, error: productError } = await supabase
              .from('lats_products')
              .select('id, name, sku, category_id')
              .eq('id', item.product_id)
              .single();

            if (!productError && product) {
              productData = product;
            } else {
              console.warn(`⚠️ [getPurchaseOrder] Could not fetch product ${item.product_id}:`, productError?.message);
            }
          }

          // Fetch variant data
          if (item.variant_id) {
            const { data: variant, error: variantError } = await supabase
              .from('lats_product_variants')
              .select('id, name, sku')
              .eq('id', item.variant_id)
              .single();

            if (!variantError && variant) {
              variantData = variant;
            } else {
              console.warn(`⚠️ [getPurchaseOrder] Could not fetch variant ${item.variant_id}:`, variantError?.message);
            }
          }

          itemsWithProductData.push({
            ...item,
            product: productData,
            variant: variantData
          });
        }

        console.log('✅ [getPurchaseOrder] Items with product/variant data:', {
          itemsCount: itemsWithProductData.length,
          items: itemsWithProductData.map(item => ({
            id: item.id,
            productId: item.product_id,
            variantId: item.variant_id,
            productName: item.product?.name,
            variantName: item.variant?.name,
            hasProductData: !!item.product,
            hasVariantData: !!item.variant
          }))
        });
      }

      // Fetch shipping information from dedicated shipping_info table
      console.log('🚚 [getPurchaseOrder] Fetching shipping info for purchase order ID:', id);
      
      // Use simple query to avoid 406 errors with complex nested selects
      const { data: shippingInfoData, error: shippingInfoError } = await supabase
        .from('lats_shipping_info')
        .select('*')
        .eq('purchase_order_id', id);

      console.log('🚚 [getPurchaseOrder] Shipping info query result:');
      console.log('  - Data:', shippingInfoData);
      console.log('  - Error:', shippingInfoError);

      if (shippingInfoError) {
        console.warn('⚠️ [getPurchaseOrder] Could not fetch shipping information:', shippingInfoError.message);
        console.warn('⚠️ [getPurchaseOrder] Error details:', shippingInfoError);
      }

      // Handle array response - take first item or return null if empty
      const shippingInfo = (shippingInfoData && shippingInfoData.length > 0) ? shippingInfoData[0] : null;
      console.log('🚚 [getPurchaseOrder] Processed shipping info:', shippingInfo);
      
      if (shippingInfo) {
        console.log('🚚 [getPurchaseOrder] Shipping info breakdown:');
        console.log('  - ID:', shippingInfo.id);
        console.log('  - Tracking number:', shippingInfo.tracking_number);
        console.log('  - Status:', shippingInfo.status);
        console.log('  - Cost:', shippingInfo.cost);
        console.log('  - Carrier ID:', shippingInfo.carrier_id);
        console.log('  - Agent ID:', shippingInfo.agent_id);
        console.log('  - Manager ID:', shippingInfo.manager_id);
        
        // Fetch related data separately to avoid 406 errors
        const [carrierData, agentData, managerData] = await Promise.all([
          shippingInfo.carrier_id ? this.getCarrierData(shippingInfo.carrier_id).catch(() => null) : null,
          shippingInfo.agent_id ? this.getAgentData(shippingInfo.agent_id).catch(() => null) : null,
          shippingInfo.manager_id ? this.getManagerData(shippingInfo.manager_id).catch(() => null) : null
        ]);
        
        console.log('🚚 [getPurchaseOrder] Related data fetched:', {
          carrier: carrierData?.name || 'Not found',
          agent: agentData?.name || 'Not found',
          manager: managerData?.name || 'Not found'
        });
      } else {
        console.log('⚠️ [getPurchaseOrder] No shipping info found for this purchase order');
      }

      // Fetch shipping events for tracking history
      let shippingEvents = [];
      if (shippingInfo) {
        const { data: events, error: eventsError } = await supabase
          .from('lats_shipping_events')
          .select('*')
          .eq('shipping_id', shippingInfo.id)
          .order('timestamp', { ascending: false });

        if (eventsError) {
          console.warn('Warning: Could not fetch shipping events:', eventsError.message);
        } else {
          shippingEvents = events || [];
        }
      }
      
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
        currency: order.currency || 'TZS', // Add currency
        paymentTerms: order.payment_terms, // Add payment terms
        // Exchange rate tracking fields
        exchangeRate: order.exchange_rate || 1.0,
        baseCurrency: order.base_currency || 'TZS',
        exchangeRateSource: order.exchange_rate_source || 'default',
        exchangeRateDate: order.exchange_rate_date || order.created_at,
        totalAmountBaseCurrency: order.total_amount_base_currency || order.total_amount || 0,
        // Shipping fields
        trackingNumber: order.tracking_number,
        shippingStatus: order.shipping_status,
        estimatedDelivery: order.estimated_delivery_date,
        shippingNotes: order.shipping_notes,
        // Use shipping info from dedicated table or create from individual fields
        shippingInfo: (() => {
          console.log('🚚 [getPurchaseOrder] Transforming shipping info...');
          console.log('🚚 [getPurchaseOrder] Has shippingInfo from DB:', !!shippingInfo);
          console.log('🚚 [getPurchaseOrder] Has order.tracking_number:', !!order.tracking_number);
          console.log('🚚 [getPurchaseOrder] Has order.shipping_status:', !!order.shipping_status);
          
          if (shippingInfo) {
            console.log('🚚 [getPurchaseOrder] Using shipping info from dedicated table');
            const transformedShippingInfo = {
              id: shippingInfo.id,
              carrier: shippingInfo.carrier_name || 'Unknown Carrier',
              carrierId: shippingInfo.carrier_id || '',
              trackingNumber: shippingInfo.tracking_number || order.tracking_number || '',
              method: 'Standard',
              cost: shippingInfo.cost || 0,
              notes: shippingInfo.notes || order.shipping_notes || '',
              agentId: shippingInfo.agent_id || '',
              agent: shippingInfo.agent_id ? {
                id: shippingInfo.agent_id,
                name: 'Agent', // Will be populated by ShippingTracker component
                company: '',
                phone: '',
                email: '',
                isActive: true
              } : null,
              managerId: shippingInfo.manager_id || '',
              manager: shippingInfo.manager_id ? {
                id: shippingInfo.manager_id,
                name: 'Manager', // Will be populated by ShippingTracker component
                department: '',
                phone: '',
                email: ''
              } : null,
              estimatedDelivery: shippingInfo.estimated_delivery || order.estimated_delivery_date || '',
              shippedDate: order.shipped_date || '',
              deliveredDate: shippingInfo.actual_delivery || order.delivered_date || '',
              portOfLoading: '',
              portOfDischarge: '',
              pricePerCBM: 0,
              enableInsurance: shippingInfo.enable_insurance || false,
              requireSignature: shippingInfo.require_signature || false,
              status: shippingInfo.status || 'pending',
              cargoBoxes: [],
              trackingEvents: shippingEvents || []
            };
            console.log('🚚 [getPurchaseOrder] Transformed shipping info:', transformedShippingInfo);
            return transformedShippingInfo;
          } else if (order.tracking_number || order.shipping_status) {
            console.log('🚚 [getPurchaseOrder] Creating shipping info from order fields');
            const fallbackShippingInfo = {
              id: `fallback-${order.id}`, // Generate a fallback ID based on purchase order ID
              carrier: order.tracking_number?.startsWith('DHL') ? 'DHL Express' : 
                       order.tracking_number?.startsWith('FEDEX') ? 'FedEx' :
                       order.tracking_number?.startsWith('UPS') ? 'UPS' :
                       order.tracking_number?.startsWith('MAERSK') ? 'Maersk Line' :
                       order.tracking_number?.startsWith('TED') ? 'Tanzania Express Delivery' :
                       'Unknown Carrier',
              carrierId: '',
              trackingNumber: order.tracking_number || '',
              method: 'Standard',
              cost: 0,
              notes: order.shipping_notes || '',
              agentId: '',
              agent: null,
              managerId: '',
              manager: null,
              estimatedDelivery: order.estimated_delivery_date || '',
              shippedDate: order.shipped_date || '',
              deliveredDate: order.delivered_date || '',
              portOfLoading: '',
              portOfDischarge: '',
              pricePerCBM: 0,
              enableInsurance: false,
              requireSignature: false,
              status: order.shipping_status || 'pending',
              cargoBoxes: [],
              trackingEvents: []
            };
            console.log('🚚 [getPurchaseOrder] Fallback shipping info:', fallbackShippingInfo);
            return fallbackShippingInfo;
          } else {
            console.log('🚚 [getPurchaseOrder] No shipping info available');
            return null;
          }
        })(),
        // Include full supplier object
        supplier: supplier ? {
          id: supplier.id,
          name: supplier.name,
          code: supplier.code,
          contactPerson: supplier.contact_person,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          city: supplier.city,
          country: supplier.country || 'Tanzania',
          currency: supplier.currency,
          paymentTerms: supplier.payment_terms,
          leadTimeDays: supplier.lead_time_days || 0,
          isActive: supplier.is_active !== false,
          metadata: supplier.metadata,
          createdAt: supplier.created_at,
          updatedAt: supplier.updated_at,
          // Performance fields
          leadTime: supplier.lead_time,
          rating: supplier.rating,
          totalOrders: supplier.total_orders,
          onTimeDeliveryRate: supplier.on_time_delivery_rate,
          qualityRating: supplier.quality_rating,
          // Shipping cost fields
          defaultShippingCost: supplier.default_shipping_cost,
          shippingCostPerKg: supplier.shipping_cost_per_kg,
          shippingCostPerCbm: supplier.shipping_cost_per_cbm,
          minimumShippingCost: supplier.minimum_shipping_cost,
          freeShippingThreshold: supplier.free_shipping_threshold
        } : null,
        items: (itemsWithProductData || []).map((item: any) => ({
          id: item.id,
          purchaseOrderId: item.purchase_order_id,
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity,
          costPrice: item.cost_price,
          totalPrice: item.total_price,
          receivedQuantity: item.received_quantity || 0,
          notes: item.notes,
          // Include product and variant information
          product: item.product ? {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            categoryId: item.product.category_id
          } : null,
          variant: item.variant ? {
            id: item.variant.id,
            name: item.variant.name,
            sku: item.variant.sku
          } : null
        }))
      };
      
      console.log('✅ [getPurchaseOrder] Transformed purchase order data with currency:', {
        id: transformedData.id,
        orderNumber: transformedData.orderNumber,
        currency: transformedData.currency,
        paymentTerms: transformedData.paymentTerms,
        totalAmount: transformedData.totalAmount,
        itemsCount: transformedData.items.length,
        hasShippingInfo: !!transformedData.shippingInfo,
        hasSupplier: !!transformedData.supplier,
        supplierName: transformedData.supplier?.name || 'No supplier'
      });
      
      console.log('🚚 [getPurchaseOrder] Final shipping info being returned:', transformedData.shippingInfo);
      
      return { ok: true, data: transformedData };
    } catch (error) {
      console.error('❌ Error fetching purchase order:', error);
      
      // Provide more specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return { ok: false, message: 'Network error: Unable to connect to database' };
        } else if (error.message.includes('timeout')) {
          return { ok: false, message: 'Request timeout: Database took too long to respond' };
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          return { ok: false, message: 'Permission denied: You do not have access to this purchase order' };
        } else if (error.message.includes('not found') || error.message.includes('PGRST116')) {
          return { ok: false, message: 'Purchase order not found' };
        } else {
          return { ok: false, message: `Database error: ${error.message}` };
        }
      }
      
      return { ok: false, message: 'Failed to fetch purchase order: Unknown error occurred' };
    }
  }

  async createPurchaseOrder(data: PurchaseOrderFormData): Promise<ApiResponse<PurchaseOrder>> {
    try {
      // Helper function to convert empty strings to null for DATE fields
      const toDateOrNull = (value: string | undefined): string | null => {
        return value && value.trim() !== '' ? value : null;
      };


      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const createdBy = user?.id || 'system';
      
      console.log('🔍 DEBUG: Creating purchase order with:', {
        supplier_id: data.supplierId,
        expected_delivery: data.expectedDelivery,
        notes: data.notes,
        status: 'draft',
        created_by: createdBy,
        shippingData
      });

      // Calculate exchange rate info if provided
      const currency = (data as any).currency || 'TZS';
      const baseCurrency = 'TZS';
      const exchangeRate = data.exchangeRate || 1.0;
      const exchangeRateSource = data.exchangeRateSource || 'default';
      const exchangeRateDate = data.exchangeRateDate || new Date().toISOString();

      // Debug: Log the exact data being sent to Supabase
      const insertData = {
        supplier_id: data.supplierId,
        expected_delivery: toDateOrNull(data.expectedDelivery),
        notes: data.notes,
        status: 'draft',
        created_by: createdBy,
        currency: currency,
        payment_terms: (data as any).paymentTerms || null,
        // Exchange rate tracking fields
        exchange_rate: exchangeRate,
        base_currency: baseCurrency,
        exchange_rate_source: exchangeRateSource,
        exchange_rate_date: exchangeRateDate,
        ...shippingData
      };
      
      console.log('🔍 DEBUG: Exact data being inserted into database:', insertData);

      const { data: order, error } = await supabase
        .from('lats_purchase_orders')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error creating purchase order:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ DEBUG: Purchase order created successfully in database:', order);
      
      // Save purchase order items to the database
      let savedItems: any[] = [];
      if (data.items && data.items.length > 0) {
        console.log('🔍 DEBUG: Saving purchase order items:', data.items);
        
        const itemsToInsert = data.items.map(item => ({
          purchase_order_id: order.id,
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
          cost_price: item.costPrice,
          total_price: item.quantity * item.costPrice,
          notes: item.notes || ''
        }));

        console.log('💰 DEBUG: Items being inserted into database:', itemsToInsert.map(item => ({
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity,
          costPrice: item.cost_price,
          totalPrice: item.total_price,
          notes: item.notes
        })));

        console.log('🔍 DEBUG: Items data to insert:', itemsToInsert);

        const { data: insertedItems, error: itemsError } = await supabase
          .from('lats_purchase_order_items')
          .insert(itemsToInsert)
          .select();

        if (itemsError) {
          console.error('❌ Error saving purchase order items:', itemsError);
          throw itemsError;
        }

        savedItems = insertedItems || [];
        console.log('✅ DEBUG: Purchase order items saved successfully:', savedItems);
        
        // Debug: Verify saved pricing and quantity data
        console.log('💰 DEBUG: Saved Items Pricing & Quantity Verification:');
        savedItems.forEach((item, index) => {
          console.log(`💾 Saved Item ${index + 1}:`, {
            id: item.id,
            purchaseOrderId: item.purchase_order_id,
            productId: item.product_id,
            variantId: item.variant_id,
            quantity: item.quantity,
            costPrice: item.cost_price,
            totalPrice: item.total_price,
            receivedQuantity: item.received_quantity,
            notes: item.notes,
            createdAt: item.created_at
          });
        });

        // Calculate total amount and update the purchase order
        const totalAmount = savedItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
        const totalAmountBaseCurrency = currency === baseCurrency ? totalAmount : totalAmount * exchangeRate;
        
        const { error: updateError } = await supabase
          .from('lats_purchase_orders')
          .update({ 
            total_amount: totalAmount,
            total_amount_base_currency: totalAmountBaseCurrency
          })
          .eq('id', order.id);

        if (updateError) {
          console.error('❌ Error updating purchase order total:', updateError);
        } else {
          console.log('✅ DEBUG: Purchase order total updated:', totalAmount);
        }

        // Verify the complete order was saved correctly
        console.log('🔍 DEBUG: Verifying complete order in database...');
        const { data: verifyOrder, error: verifyError } = await supabase
          .from('lats_purchase_orders')
          .select(`
            *,
            lats_purchase_order_items(*)
          `)
          .eq('id', order.id)
          .single();

        if (verifyError) {
          console.error('❌ Error verifying order:', verifyError);
        } else {
          console.log('✅ DEBUG: Order verification successful:', {
            orderId: verifyOrder.id,
            orderNumber: verifyOrder.order_number,
            totalAmount: verifyOrder.total_amount,
            itemsCount: verifyOrder.lats_purchase_order_items?.length || 0,
            items: verifyOrder.lats_purchase_order_items
          });
        }
      }

      // Transform snake_case to camelCase
      const transformedData = {
        id: order.id,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        status: order.status,
        orderDate: order.created_at, // Use created_at as orderDate
        totalAmount: savedItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0),
        expectedDelivery: order.expected_delivery,
        notes: order.notes,
        createdBy: order.created_by,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        currency: order.currency || 'TZS',
        // Exchange rate tracking fields
        exchangeRate: order.exchange_rate || 1.0,
        baseCurrency: order.base_currency || 'TZS',
        exchangeRateSource: order.exchange_rate_source || 'default',
        exchangeRateDate: order.exchange_rate_date || order.created_at,
        totalAmountBaseCurrency: order.total_amount_base_currency || savedItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0),
        paymentTerms: order.payment_terms, // Add payment terms
        items: savedItems.map(item => ({
          id: item.id,
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity,
          costPrice: item.cost_price,
          totalPrice: item.total_price,
          receivedQuantity: item.received_quantity || 0,
          notes: item.notes
        })),
        // Include shipping fields in response
        trackingNumber: order.tracking_number,
        shippingStatus: order.shipping_status,
        estimatedDelivery: order.estimated_delivery_date,
        shippingNotes: order.shipping_notes,
        shippingInfo: order.shipping_info
      };

      console.log('🔄 DEBUG: Transformed data being returned to frontend:', transformedData);
      
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
      
      // Support for shipping fields
      if ((data as any).status !== undefined) dbData.status = (data as any).status;
      if ((data as any).trackingNumber !== undefined) dbData.tracking_number = (data as any).trackingNumber;
      if ((data as any).shippingStatus !== undefined) dbData.shipping_status = (data as any).shippingStatus;
      if ((data as any).estimatedDelivery !== undefined) dbData.estimated_delivery = (data as any).estimatedDelivery;
      if ((data as any).shippingNotes !== undefined) dbData.shipping_notes = (data as any).shippingNotes;
      if ((data as any).shippingInfo !== undefined) dbData.shipping_info = (data as any).shippingInfo;
      if ((data as any).shippingDate !== undefined) dbData.shipping_date = (data as any).shippingDate;
      
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
        items: [],
        // Shipping fields
        trackingNumber: order.tracking_number,
        shippingStatus: order.shipping_status,
        estimatedDelivery: order.estimated_delivery_date,
        shippingNotes: order.shipping_notes,
        shippingInfo: order.shipping_info,
        shippingDate: order.shipping_date
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
        // Shipping fields
        trackingNumber: order.tracking_number,
        shippingStatus: order.shipping_status,
        estimatedDelivery: order.estimated_delivery_date,
        shippingNotes: order.shipping_notes,
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
          lats_product_variants(*)
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
      // Validate customer information
      if (!data.customerId && !data.customerName) {
        return {
          ok: false,
          message: 'Customer information is required for sale processing',
          code: 'MISSING_CUSTOMER'
        };
      }

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
          lats_sale_items(
            *,
            lats_products(name, description),
            lats_product_variants(name, sku, attributes)
          )
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
          lats_sale_items(
            *,
            lats_products(name, description),
            lats_product_variants(name, sku, attributes)
          )
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

  // =====================================================
  // SHIPPING AGENTS METHODS
  // =====================================================

  async getShippingAgents(): Promise<ApiResponse<ShippingAgent[]>> {
    try {
      console.log('🚢 getShippingAgents called - starting fetch...');
      
      // First try the view, if it doesn't exist, fall back to the base table
      let { data, error } = await supabase
        .from('lats_shipping_agents_with_offices')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 View query result:', { data: data?.length || 0, error: error?.message || 'none' });

      // Check for various error conditions that indicate missing table/view
      if (error && (error.code === '42P01' || error.message?.includes('404') || error.message?.includes('relation') || error.message?.includes('does not exist'))) {
        // View doesn't exist, try the base table
        console.log('📦 Shipping agents view does not exist, trying base table');
        const baseResult = await supabase
          .from('lats_shipping_agents')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('📊 Base table query result:', { data: baseResult.data?.length || 0, error: baseResult.error?.message || 'none' });

        if (baseResult.error) {
          // If base table also doesn't exist, return empty array instead of error
          if (baseResult.error.code === '42P01' || baseResult.error.message?.includes('404') || baseResult.error.message?.includes('relation') || baseResult.error.message?.includes('does not exist')) {
            console.log('📦 Shipping agents table does not exist, returning empty array');
            return { ok: true, data: [] };
          }
          console.error('Error fetching shipping agents from base table:', baseResult.error);
          return { ok: false, message: baseResult.error.message };
        }

        data = baseResult.data;
      } else if (error) {
        console.error('Error fetching shipping agents:', error);
        return { ok: false, message: error.message };
      }

      // Transform the data to match our interface
      const agents: ShippingAgent[] = (data || []).map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        company: agent.company,
        isActive: agent.is_active,
        createdAt: agent.created_at,
        phone: agent.phone,
        whatsapp: agent.whatsapp,
        supportedShippingTypes: agent.supported_shipping_types || [],
        address: agent.address,
        city: agent.city,
        country: agent.country,
        offices: agent.offices || [],
        serviceAreas: agent.service_areas || [],
        specializations: agent.specializations || [],
        pricePerCBM: agent.price_per_cbm,
        pricePerKg: agent.price_per_kg,
        averageDeliveryTime: agent.average_delivery_time,
        notes: agent.notes,
        rating: agent.rating,
        totalShipments: agent.total_shipments
      }));

      console.log('✅ getShippingAgents success:', { agentsCount: agents.length, agents: agents });
      return { ok: true, data: agents };
    } catch (error) {
      console.error('❌ Exception fetching shipping agents:', error);
      return { ok: true, data: [] }; // Return empty array instead of error
    }
  }

  async getShippingAgent(id: string): Promise<ApiResponse<ShippingAgent>> {
    try {
      let { data, error } = await supabase
        .from('lats_shipping_agents_with_offices')
        .select('*')
        .eq('id', id)
        .single();

      // Check for various error conditions that indicate missing table/view
      if (error && (error.code === '42P01' || error.message?.includes('404') || error.message?.includes('relation') || error.message?.includes('does not exist'))) {
        // View doesn't exist, try the base table
        console.log('📦 Shipping agents view does not exist, trying base table');
        const baseResult = await supabase
          .from('lats_shipping_agents')
          .select('*')
          .eq('id', id)
          .single();

        if (baseResult.error) {
          // If base table also doesn't exist, return error
          if (baseResult.error.code === '42P01' || baseResult.error.message?.includes('404') || baseResult.error.message?.includes('relation') || baseResult.error.message?.includes('does not exist')) {
            console.log('📦 Shipping agents table does not exist');
            return { ok: false, message: 'Shipping agents table does not exist' };
          }
          console.error('Error fetching shipping agent from base table:', baseResult.error);
          return { ok: false, message: baseResult.error.message };
        }

        data = baseResult.data;
      } else if (error) {
        console.error('Error fetching shipping agent:', error);
        return { ok: false, message: error.message };
      }

      const agent: ShippingAgent = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        company: data.company,
        isActive: data.is_active,
        managerId: data.manager_id,
        createdAt: data.created_at,
        supportedShippingTypes: data.supported_shipping_types || [],
        address: data.address,
        city: data.city,
        country: data.country,
        website: data.website,
        offices: data.offices || [],
        serviceAreas: data.service_areas || [],
        specializations: data.specializations || [],
        pricePerCBM: data.price_per_cbm,
        pricePerKg: data.price_per_kg,
        averageDeliveryTime: data.average_delivery_time,
        notes: data.notes,
        rating: data.rating,
        totalShipments: data.total_shipments
      };

      return { ok: true, data: agent };
    } catch (error) {
      console.error('Exception fetching shipping agent:', error);
      return { ok: false, message: 'Failed to fetch shipping agent' };
    }
  }

  async createShippingAgent(data: AgentFormData): Promise<ApiResponse<ShippingAgent>> {
    try {
      // Debug: Log the incoming data
      console.log('Creating shipping agent with data:', data);
      
      // Start a transaction-like operation
      const agentData = {
        name: data.name,
        company: data.company || null,
        is_active: data.isActive,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        supported_shipping_types: data.supportedShippingTypes || [],
        address: data.address || null,
        city: data.city || null,
        country: data.country || 'Tanzania',
        service_areas: data.serviceAreas || [],
        specializations: data.specializations || [],
        price_per_cbm: data.pricePerCBM ? parseFloat(data.pricePerCBM) : null,
        price_per_kg: data.pricePerKg ? parseFloat(data.pricePerKg) : null,
        average_delivery_time: data.averageDeliveryTime || null,
        notes: data.notes || null,
        rating: 0,
        total_shipments: 0
      };

      // Debug: Log the data being sent to database
      console.log('Sending to database:', agentData);
      
      // Insert the agent
      const { data: agent, error: agentError } = await supabase
        .from('lats_shipping_agents')
        .insert(agentData)
        .select()
        .single();

      if (agentError) {
        console.error('Error creating shipping agent:', agentError);
        console.error('Full error details:', JSON.stringify(agentError, null, 2));
        return { ok: false, message: agentError.message };
      }

      // Insert office locations if any
      if (data.offices && data.offices.length > 0) {
        const officeData = data.offices.map(office => ({
          agent_id: agent.id,
          name: office.name,
          address: office.address,
          city: office.city,
          country: office.country,
          phone: office.phone || null,
          office_type: office.officeType,
          is_primary: office.isMainOffice
        }));

        const { error: officeError } = await supabase
          .from('lats_shipping_agent_offices')
          .insert(officeData);

        if (officeError) {
          console.error('Error creating office locations:', officeError);
          // Don't fail the entire operation, just log the error
        }
      }

      // Insert contacts if any
      if (data.contacts && data.contacts.length > 0) {
        const contactData = data.contacts.map(contact => ({
          agent_id: agent.id,
          name: contact.name,
          phone: contact.phone,
          whatsapp: contact.whatsapp || null,
          email: contact.email || null,
          role: contact.role,
          is_primary: contact.isPrimary
        }));

        const { error: contactError } = await supabase
          .from('lats_shipping_agent_contacts')
          .insert(contactData);

        if (contactError) {
          console.error('Error creating contacts:', contactError);
          // Don't fail the entire operation, just log the error
        }
      }

      // Fetch the complete agent with offices and contacts
      const result = await this.getShippingAgent(agent.id);
      return result;
    } catch (error) {
      console.error('Exception creating shipping agent:', error);
      return { ok: false, message: 'Failed to create shipping agent' };
    }
  }

  async updateShippingAgent(id: string, data: AgentFormData): Promise<ApiResponse<ShippingAgent>> {
    try {
      const agentData = {
        name: data.name,
        company: data.company || null,
        is_active: data.isActive,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        supported_shipping_types: data.supportedShippingTypes,
        address: data.address || null,
        city: data.city || null,
        country: data.country || 'Tanzania',
        service_areas: data.serviceAreas,
        specializations: data.specializations,
        price_per_cbm: data.pricePerCBM ? parseFloat(data.pricePerCBM) : null,
        price_per_kg: data.pricePerKg ? parseFloat(data.pricePerKg) : null,
        average_delivery_time: data.averageDeliveryTime || null,
        notes: data.notes || null
      };

      // Update the agent
      const { error: agentError } = await supabase
        .from('lats_shipping_agents')
        .update(agentData)
        .eq('id', id);

      if (agentError) {
        console.error('Error updating shipping agent:', agentError);
        return { ok: false, message: agentError.message };
      }

      // Update office locations
      if (data.offices && data.offices.length > 0) {
        // Delete existing offices
        await supabase
          .from('lats_shipping_agent_offices')
          .delete()
          .eq('agent_id', id);

        // Insert new offices
        const officeData = data.offices.map(office => ({
          agent_id: id,
          name: office.name,
          address: office.address,
          city: office.city,
          country: office.country,
          phone: office.phone || null,
          office_type: office.officeType,
          is_primary: office.isMainOffice
        }));

        const { error: officeError } = await supabase
          .from('lats_shipping_agent_offices')
          .insert(officeData);

        if (officeError) {
          console.error('Error updating office locations:', officeError);
          // Don't fail the entire operation, just log the error
        }
      }

      // Fetch the updated agent
      const result = await this.getShippingAgent(id);
      return result;
    } catch (error) {
      console.error('Exception updating shipping agent:', error);
      return { ok: false, message: 'Failed to update shipping agent' };
    }
  }

  async deleteShippingAgent(id: string): Promise<ApiResponse<void>> {
    try {
      // Delete office locations first (due to foreign key constraint)
      const { error: officeError } = await supabase
        .from('lats_shipping_agent_offices')
        .delete()
        .eq('agent_id', id);

      if (officeError) {
        console.error('Error deleting office locations:', officeError);
        return { ok: false, message: officeError.message };
      }

      // Delete the agent
      const { error: agentError } = await supabase
        .from('lats_shipping_agents')
        .delete()
        .eq('id', id);

      if (agentError) {
        console.error('Error deleting shipping agent:', agentError);
        return { ok: false, message: agentError.message };
      }

      return { ok: true, data: undefined };
    } catch (error) {
      console.error('Exception deleting shipping agent:', error);
      return { ok: false, message: 'Failed to delete shipping agent' };
    }
  }

  async toggleShippingAgentStatus(id: string): Promise<ApiResponse<ShippingAgent>> {
    try {
      // First get the current status
      const { data: currentAgent, error: fetchError } = await supabase
        .from('lats_shipping_agents')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching agent status:', fetchError);
        return { ok: false, message: fetchError.message };
      }

      // Toggle the status
      const { error: updateError } = await supabase
        .from('lats_shipping_agents')
        .update({ is_active: !currentAgent.is_active })
        .eq('id', id);

      if (updateError) {
        console.error('Error toggling agent status:', updateError);
        return { ok: false, message: updateError.message };
      }

      // Fetch the updated agent
      const result = await this.getShippingAgent(id);
      return result;
    } catch (error) {
      console.error('Exception toggling shipping agent status:', error);
      return { ok: false, message: 'Failed to toggle shipping agent status' };
    }
  }

  async getShippingManagers(): Promise<ApiResponse<ShippingManager[]>> {
    try {
      const { data, error } = await supabase
        .from('lats_shipping_managers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist, return empty array
          console.log('📦 Shipping managers table does not exist, returning empty array');
          return { ok: true, data: [] };
        }
        console.error('Error fetching shipping managers:', error);
        return { ok: false, message: error.message };
      }

      const managers: ShippingManager[] = (data || []).map((manager: any) => ({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        department: manager.department,
        isActive: manager.is_active
      }));

      return { ok: true, data: managers };
    } catch (error) {
      console.error('Exception fetching shipping managers:', error);
      return { ok: true, data: [] }; // Return empty array instead of error
    }
  }

  /**
   * Get carrier data by ID (separate query to avoid 406 errors)
   */
  private async getCarrierData(carrierId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('lats_shipping_carriers')
        .select('*')
        .eq('id', carrierId)
        .single();

      if (error) {
        console.warn('⚠️ [SupabaseDataProvider] Error fetching carrier data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('⚠️ [SupabaseDataProvider] Unexpected error fetching carrier data:', error);
      return null;
    }
  }

  /**
   * Get agent data by ID (separate query to avoid 406 errors)
   */
  private async getAgentData(agentId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('lats_shipping_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) {
        console.warn('⚠️ [SupabaseDataProvider] Error fetching agent data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('⚠️ [SupabaseDataProvider] Unexpected error fetching agent data:', error);
      return null;
    }
  }

  /**
   * Get manager data by ID (separate query to avoid 406 errors)
   */
  private async getManagerData(managerId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('lats_shipping_managers')
        .select('*')
        .eq('id', managerId)
        .single();

      if (error) {
        console.warn('⚠️ [SupabaseDataProvider] Error fetching manager data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('⚠️ [SupabaseDataProvider] Unexpected error fetching manager data:', error);
      return null;
    }
  }
}

export default new SupabaseDataProvider();
