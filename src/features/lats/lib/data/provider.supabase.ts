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
      // Suppliers have public read access, so no authentication check needed for reading

      const { data, error } = await supabase
        .from('lats_suppliers')
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

      // Build the select query properly - avoid using both columns and select
      let query = supabase
        .from('lats_products')
        .select(`
          *,
          lats_categories(name),
          lats_brands(name),
          lats_suppliers(name),
          lats_product_variants(*)
        `)
        .order('name');

      // Apply filters with proper validation
      if (filters?.categoryId) {
        // Validate categoryId is a string
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
        // Validate brandId is a string
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
        // Validate supplierId is a string
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

      console.log('🔍 Executing products query...');
      console.log('🔍 Query URL will be:', query.url);
      
      const { data, error, count } = await query;

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
        
        // Check for malformed query errors
        if (error.message?.includes('columns') && error.message?.includes('select')) {
          console.error('🔍 This appears to be a columns/select conflict error');
          return {
            ok: false,
            message: 'Invalid query format. Please contact support.'
          };
        }
        
        // Check for other common errors
        if (error.code === 'PGRST301') {
          return {
            ok: false,
            message: 'Invalid query parameters. Please check your filters.'
          };
        }
        
        throw error;
      }

      console.log('✅ Products query successful, processing data...');
      console.log('📊 Raw data count:', data?.length || 0);

      // Fetch images for all products
      const productIds = (data || []).map((product: any) => product.id);
      let productImages: any[] = [];
      
      if (productIds.length > 0) {
        try {
          const { data: imagesData, error: imagesError } = await supabase
            .from('product_images')
            .select('*')
            .in('product_id', productIds)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true });

          if (imagesError) {
            console.error('❌ Error fetching product images:', imagesError);
          } else {
            productImages = imagesData || [];
            console.log('📸 Fetched images for', productImages.length, 'products');
          }
        } catch (imagesError) {
          console.error('❌ Exception fetching product images:', imagesError);
        }
      }

      // Transform the data to match the expected format
      const transformedProducts = (data || []).map((product: any) => {
        // Group images by product
        const productImageList = productImages
          .filter((img: any) => img.product_id === product.id)
          .map((img: any) => img.image_url);

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          shortDescription: product.description,
          sku: product.sku || '',
          barcode: product.barcode,
          categoryId: product.category_id,
          brandId: product.brand_id,
          supplierId: product.supplier_id,
          images: productImageList.length > 0 ? productImageList : (product.images || []),
          tags: product.tags || [],
          isActive: product.is_active ?? true,
          isFeatured: product.is_featured ?? false,
          isDigital: product.is_digital ?? false,
          requiresShipping: product.requires_shipping ?? true,
          taxRate: product.tax_rate || 0,
          totalQuantity: product.total_quantity || 0,
          totalValue: product.total_value || 0,
          condition: product.condition || 'new',
          storeShelf: product.store_shelf,
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
          variants: (product.lats_product_variants || []).map((variant: any) => ({
            id: variant.id,
            productId: variant.product_id,
            sku: variant.sku,
            name: variant.name,
            attributes: variant.attributes || {},
            costPrice: variant.cost_price || 0,
            sellingPrice: variant.selling_price || 0,
            quantity: variant.quantity || 0,
            minQuantity: variant.min_quantity || 0,
            maxQuantity: variant.max_quantity,
            barcode: variant.barcode,
            weight: variant.weight,
            dimensions: variant.dimensions,
            createdAt: variant.created_at,
            updatedAt: variant.updated_at
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
          total: count || transformedProducts.length,
          page: 1,
          limit: transformedProducts.length,
          totalPages: 1
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

      // Handle case where an object might be passed instead of a string
      if (typeof id === 'object') {
        console.error('❌ getProduct: Object passed instead of string ID:', id);
        return { 
          ok: false, 
          message: 'Invalid product ID format. Expected string, received object.' 
        };
      }

      // Convert to string and trim whitespace
      const sanitizedId = String(id).trim();
      
      if (!sanitizedId) {
        console.error('❌ getProduct: Empty ID after sanitization');
        return { 
          ok: false, 
          message: 'Product ID cannot be empty' 
        };
      }

      console.log('🔍 [DEBUG] getProduct called with ID:', sanitizedId, 'Type:', typeof sanitizedId);

      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Authentication error:', authError?.message || 'User not authenticated');
        return { 
          ok: false, 
          message: 'Authentication required. Please log in to access products.' 
        };
      }

      const { data, error } = await supabase
        .from('lats_products')
        .select(`
          *,
          lats_categories(name),
          lats_brands(name),
          lats_suppliers(name),
          lats_product_variants(*)
        `)
        .eq('id', sanitizedId)
        .single();

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

      // Debug logging
      console.log('🔍 [DEBUG] Raw data from database:', data);
      console.log('🔍 [DEBUG] Variants data:', data.lats_product_variants);
      
      // Fetch product images
      let productImages: string[] = [];
      try {
        const { data: imagesData, error: imagesError } = await supabase
          .from('product_images')
          .select('image_url')
          .eq('product_id', sanitizedId)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: true });

        if (imagesError) {
          console.error('❌ Error fetching product images:', imagesError);
        } else {
          productImages = (imagesData || []).map((img: any) => img.image_url);
        }
      } catch (imagesError) {
        console.error('❌ Exception fetching product images:', imagesError);
      }
      
      const product = {
        id: data.id,
        name: data.name,
        description: data.description,
        shortDescription: data.short_description,
        sku: data.lats_product_variants?.[0]?.sku || '', // Use first variant's SKU as main product SKU
        barcode: data.lats_product_variants?.[0]?.barcode || '', // Use first variant's barcode as main product barcode
        categoryId: data.category_id,
        brandId: data.brand_id,
        supplierId: data.supplier_id,
        images: productImages, // Use fetched images
        tags: data.tags || [],
        isActive: data.is_active,
        isFeatured: data.is_featured || false,
        isDigital: data.is_digital || false,
        requiresShipping: data.requires_shipping !== false, // Default to true
        taxRate: data.tax_rate || 0.16,
        variants: (data.lats_product_variants || []).map((variant: any) => {
          console.log('🔍 [DEBUG] Processing variant:', variant);
          return {
            id: variant.id,
            productId: variant.product_id,
            sku: variant.sku,
            name: variant.name,
            attributes: variant.attributes || {},
            costPrice: variant.cost_price || 0,
            sellingPrice: variant.selling_price || 0,
            price: variant.selling_price, // Keep both for compatibility
            quantity: variant.quantity || 0,
            stockQuantity: variant.quantity || 0, // Add stockQuantity for UI compatibility
            minQuantity: variant.min_quantity,
            minStockLevel: variant.min_quantity, // Add minStockLevel for UI compatibility
            maxQuantity: variant.max_quantity,
            maxStockLevel: variant.max_quantity, // Add maxStockLevel for UI compatibility
            barcode: variant.barcode,
            weight: variant.weight,
            dimensions: variant.dimensions,
            isActive: true, // Add isActive for UI compatibility
            createdAt: variant.created_at,
            updatedAt: variant.updated_at
          };
        }),
        totalQuantity: data.total_quantity || 0,
        totalValue: data.total_value || 0,
        debutDate: data.debut_date,
        debutNotes: data.debut_notes,
        debutFeatures: data.debut_features || [],
        metadata: data.metadata || {},
        category: data.lats_categories,
        brand: data.lats_brands,
        supplier: data.lats_suppliers,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      console.log('🔍 [DEBUG] Final product object:', product);
      console.log('🔍 [DEBUG] Product variants:', product.variants);

      return { ok: true, data: product };
    } catch (error) {
      console.error('Error fetching product:', error);
      return { ok: false, message: 'Failed to fetch product' };
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
        description: data.description || null,
        is_active: Boolean(data.isActive),
        // Add fields that already exist in database schema
        tags: data.tags || [],
        images: data.images || [],
        // Add new fields from the migration
        condition: data.condition || 'new',
        store_shelf: data.storeShelf || null
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
            max_quantity: variant.maxStockLevel || variant.maxQuantity || variant.max_quantity || null,
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
        description: data.description || null,
        category_id: data.categoryId,
        brand_id: data.brandId || null,
        supplier_id: data.supplierId || null,
        images: data.images || [],
        tags: data.tags || [],
        is_active: Boolean(data.isActive),
        // Add new fields from the migration
        condition: data.condition || 'new',
        store_shelf: data.storeShelf || null
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
              max_quantity: variant.maxStockLevel ? Number(variant.maxStockLevel) : null,
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
              max_quantity: variant.maxStockLevel ? Number(variant.maxStockLevel) : null,
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
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true);

      if (error) throw error;

      const results = (data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        categoryId: product.category_id,
        categoryName: product.lats_categories?.name || '',
        brandId: product.brand_id,
        brandName: product.lats_brands?.name,
        variants: (product.lats_product_variants || []).map((variant: any) => ({
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          attributes: variant.attributes,
          price: variant.selling_price,
          quantity: variant.quantity,
          barcode: variant.barcode
        })),
        images: product.images || [],
        tags: product.tags || []
      }));

      return { ok: true, data: results };
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
      const { data, error } = await supabase
        .from('lats_purchase_orders')
        .select(`
          *,
          lats_suppliers(name),
          lats_purchase_order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform snake_case to camelCase
      const transformedData = (data || []).map(order => ({
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
        items: (order.lats_purchase_order_items || []).map((item: any) => ({
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
      const { data, error } = await supabase
        .from('lats_purchase_orders')
        .select(`
          *,
          lats_suppliers(name),
          lats_purchase_order_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform snake_case to camelCase
      const transformedData = {
        id: data.id,
        orderNumber: data.order_number,
        supplierId: data.supplier_id,
        status: data.status,
        totalAmount: data.total_amount || 0,
        expectedDelivery: data.expected_delivery,
        notes: data.notes,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        items: (data.lats_purchase_order_items || []).map((item: any) => ({
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
