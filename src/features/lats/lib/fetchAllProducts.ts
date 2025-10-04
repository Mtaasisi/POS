import { supabase } from '../../../lib/supabaseClient';
import { Product, ApiResponse } from '../types/inventory';

/**
 * Fetch all products from the database without pagination limits
 * This function retrieves all products with their complete data including
 * categories, suppliers, and variants
 */
export const fetchAllProducts = async (): Promise<ApiResponse<Product[]>> => {
  console.log('🔄 [fetchAllProducts] Starting to fetch all products...');
  
  try {
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ [fetchAllProducts] Authentication error:', authError?.message || 'User not authenticated');
      return { 
        ok: false, 
        message: 'Authentication required. Please log in to access products.' 
      };
    }

    console.log('✅ [fetchAllProducts] User authenticated:', user.email);

    // Health check - verify table exists
    try {
      const { error: healthCheckError } = await supabase
        .from('lats_products')
        .select('id')
        .limit(1);
      
      if (healthCheckError) {
        console.error('❌ [fetchAllProducts] Health check failed:', healthCheckError);
        return {
          ok: false,
          message: 'Database table not accessible. Please check your database configuration.'
        };
      }
    } catch (healthCheckError) {
      console.error('❌ [fetchAllProducts] Health check exception:', healthCheckError);
      return {
        ok: false,
        message: 'Database connection failed. Please check your internet connection.'
      };
    }

    console.log('🔍 [fetchAllProducts] Executing comprehensive products query...');
    const startTime = performance.now();
    
    // Fetch all products with complete data including categories, suppliers, and variants
    const { data, error, count } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_categories(
          id, name, description, color, icon, parent_id, is_active, 
          sort_order, metadata, created_at, updated_at
        ),
        lats_suppliers(
          id, name, code, contact_person, email, phone, address, city, 
          country, currency, payment_terms, lead_time_days, is_active, 
          metadata, created_at, updated_at
        ),
        lats_product_variants(
          id, sku, name, barcode, cost_price, selling_price, quantity, 
          min_quantity, max_quantity, weight, dimensions, attributes, 
          is_primary, condition, created_at, updated_at
        )
      `)
      .eq('is_active', true) // Only fetch active products
      .order('created_at', { ascending: false }); // Order by newest first

    const endTime = performance.now();
    console.log(`✅ [fetchAllProducts] Query completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`📊 [fetchAllProducts] Retrieved ${data?.length || 0} products`);

    if (error) {
      console.error('❌ [fetchAllProducts] Database error:', error);
      return {
        ok: false,
        message: `Database error: ${error.message}`
      };
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ [fetchAllProducts] No products found in database');
      return {
        ok: true,
        data: [],
        message: 'No products found in database'
      };
    }

    // Process and clean the data
    const processedProducts: Product[] = data.map((product: any) => {
      // Calculate total quantity from variants
      const totalQuantity = product.lats_product_variants?.reduce(
        (sum: number, variant: any) => sum + (variant.quantity || 0), 
        0
      ) || 0;

      // Calculate total value from variants
      const totalValue = product.lats_product_variants?.reduce(
        (sum: number, variant: any) => sum + ((variant.cost_price || 0) * (variant.quantity || 0)), 
        0
      ) || 0;

      // Get main variant for primary pricing
      const mainVariant = product.lats_product_variants?.[0];

      return {
        id: product.id,
        name: product.name,
        sku: product.sku || mainVariant?.sku || 'N/A',
        description: product.description || product.short_description,
        categoryId: product.category_id,
        category: product.lats_categories ? {
          id: product.lats_categories.id,
          name: product.lats_categories.name,
          description: product.lats_categories.description,
          color: product.lats_categories.color,
          icon: product.lats_categories.icon,
          parent_id: product.lats_categories.parent_id,
          isActive: product.lats_categories.is_active,
          sortOrder: product.lats_categories.sort_order || 0,
          metadata: product.lats_categories.metadata || {},
          createdAt: product.lats_categories.created_at,
          updatedAt: product.lats_categories.updated_at
        } : undefined,
        supplierId: product.supplier_id,
        supplier: product.lats_suppliers ? {
          id: product.lats_suppliers.id,
          name: product.lats_suppliers.name,
          code: product.lats_suppliers.code,
          contactPerson: product.lats_suppliers.contact_person,
          email: product.lats_suppliers.email,
          phone: product.lats_suppliers.phone,
          address: product.lats_suppliers.address,
          city: product.lats_suppliers.city,
          country: product.lats_suppliers.country,
          currency: product.lats_suppliers.currency,
          paymentTerms: product.lats_suppliers.payment_terms,
          leadTimeDays: product.lats_suppliers.lead_time_days || 7,
          isActive: product.lats_suppliers.is_active,
          metadata: product.lats_suppliers.metadata || {},
          createdAt: product.lats_suppliers.created_at,
          updatedAt: product.lats_suppliers.updated_at
        } : undefined,
        condition: product.condition || 'new',
        internalNotes: product.internal_notes,
        price: mainVariant?.selling_price || product.price || 0,
        costPrice: mainVariant?.cost_price || product.cost_price || 0,
        stockQuantity: totalQuantity,
        minStockLevel: mainVariant?.min_quantity || product.min_stock_level || 0,
        status: product.status || 'active',
        isActive: product.is_active,
        isFeatured: product.is_featured || false,
        totalQuantity: totalQuantity,
        totalValue: totalValue,
        images: product.images || [],
        variants: product.lats_product_variants?.map((variant: any) => ({
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          barcode: variant.barcode,
          price: variant.selling_price || variant.price || 0,
          costPrice: variant.cost_price || 0,
          stockQuantity: variant.quantity || 0,
          minStockLevel: variant.min_quantity || 0,
          quantity: variant.quantity || 0,
          minQuantity: variant.min_quantity || 0,
          sellingPrice: variant.selling_price || variant.price || 0,
          condition: variant.condition,
          isPrimary: variant.is_primary || false,
          attributes: variant.attributes || {},
          images: variant.images || []
        })) || [],
        attributes: product.attributes || {},
        metadata: product.metadata || {},
        weight: product.weight,
        length: product.length,
        width: product.width,
        height: product.height,
        shippingClass: product.shipping_class,
        requiresSpecialHandling: product.requires_special_handling,
        shippingStatus: product.shipping_status,
        trackingNumber: product.tracking_number,
        expectedDelivery: product.expected_delivery,
        shippingAgent: product.shipping_agent,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        // Multi-currency fields
        usdPrice: product.usd_price,
        eurPrice: product.eur_price,
        exchangeRate: product.exchange_rate,
        baseCurrency: product.base_currency,
        // Purchase order fields
        lastOrderDate: product.last_order_date,
        lastOrderQuantity: product.last_order_quantity,
        pendingQuantity: product.pending_quantity,
        orderStatus: product.order_status,
        // Storage fields
        storageRoomName: product.storage_room_name,
        shelfName: product.shelf_name,
        storeLocationName: product.store_location_name,
        isRefrigerated: product.is_refrigerated,
        requiresLadder: product.requires_ladder
      };
    });

    console.log('✅ [fetchAllProducts] Successfully processed products:', {
      totalProducts: processedProducts.length,
      productsWithCategories: processedProducts.filter(p => p.category).length,
      productsWithSuppliers: processedProducts.filter(p => p.supplier).length,
      productsWithVariants: processedProducts.filter(p => p.variants && p.variants.length > 0).length,
      totalStockValue: processedProducts.reduce((sum, p) => sum + p.totalValue, 0)
    });

    return {
      ok: true,
      data: processedProducts,
      message: `Successfully fetched ${processedProducts.length} products`
    };

  } catch (error) {
    console.error('💥 [fetchAllProducts] Exception:', error);
    return {
      ok: false,
      message: 'Failed to fetch products. Please try again.'
    };
  }
};

/**
 * Fetch all products with a simple count for quick overview
 */
export const fetchAllProductsCount = async (): Promise<ApiResponse<{ count: number; activeCount: number }>> => {
  console.log('🔄 [fetchAllProductsCount] Getting product counts...');
  
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { 
        ok: false, 
        message: 'Authentication required.' 
      };
    }

    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('lats_products')
      .select('*', { count: 'exact', head: true });

    // Get active count
    const { count: activeCount, error: activeError } = await supabase
      .from('lats_products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (totalError || activeError) {
      console.error('❌ [fetchAllProductsCount] Count error:', totalError || activeError);
      return {
        ok: false,
        message: 'Failed to get product counts'
      };
    }

    return {
      ok: true,
      data: {
        count: totalCount || 0,
        activeCount: activeCount || 0
      }
    };

  } catch (error) {
    console.error('💥 [fetchAllProductsCount] Exception:', error);
    return {
      ok: false,
      message: 'Failed to get product counts'
    };
  }
};

/**
 * Fetch products by category
 */
export const fetchProductsByCategory = async (categoryId: string): Promise<ApiResponse<Product[]>> => {
  console.log('🔄 [fetchProductsByCategory] Fetching products for category:', categoryId);
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { 
        ok: false, 
        message: 'Authentication required.' 
      };
    }

    const { data, error } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_categories(*),
        lats_suppliers(*),
        lats_product_variants(*)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [fetchProductsByCategory] Error:', error);
      return {
        ok: false,
        message: `Failed to fetch products for category: ${error.message}`
      };
    }

    // Process data similar to fetchAllProducts
    const processedProducts: Product[] = data?.map((product: any) => {
      const totalQuantity = product.lats_product_variants?.reduce(
        (sum: number, variant: any) => sum + (variant.quantity || 0), 
        0
      ) || 0;

      const mainVariant = product.lats_product_variants?.[0];

      return {
        id: product.id,
        name: product.name,
        sku: product.sku || mainVariant?.sku || 'N/A',
        description: product.description || product.short_description,
        categoryId: product.category_id,
        category: product.lats_categories ? {
          id: product.lats_categories.id,
          name: product.lats_categories.name,
          description: product.lats_categories.description,
          color: product.lats_categories.color,
          icon: product.lats_categories.icon,
          parent_id: product.lats_categories.parent_id,
          isActive: product.lats_categories.is_active,
          sortOrder: product.lats_categories.sort_order || 0,
          metadata: product.lats_categories.metadata || {},
          createdAt: product.lats_categories.created_at,
          updatedAt: product.lats_categories.updated_at
        } : undefined,
        supplierId: product.supplier_id,
        supplier: product.lats_suppliers ? {
          id: product.lats_suppliers.id,
          name: product.lats_suppliers.name,
          code: product.lats_suppliers.code,
          contactPerson: product.lats_suppliers.contact_person,
          email: product.lats_suppliers.email,
          phone: product.lats_suppliers.phone,
          address: product.lats_suppliers.address,
          city: product.lats_suppliers.city,
          country: product.lats_suppliers.country,
          currency: product.lats_suppliers.currency,
          paymentTerms: product.lats_suppliers.payment_terms,
          leadTimeDays: product.lats_suppliers.lead_time_days || 7,
          isActive: product.lats_suppliers.is_active,
          metadata: product.lats_suppliers.metadata || {},
          createdAt: product.lats_suppliers.created_at,
          updatedAt: product.lats_suppliers.updated_at
        } : undefined,
        condition: product.condition || 'new',
        internalNotes: product.internal_notes,
        price: mainVariant?.selling_price || product.price || 0,
        costPrice: mainVariant?.cost_price || product.cost_price || 0,
        stockQuantity: totalQuantity,
        minStockLevel: mainVariant?.min_quantity || product.min_stock_level || 0,
        status: product.status || 'active',
        isActive: product.is_active,
        isFeatured: product.is_featured || false,
        totalQuantity: totalQuantity,
        images: product.images || [],
        variants: product.lats_product_variants?.map((variant: any) => ({
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          barcode: variant.barcode,
          price: variant.selling_price || variant.price || 0,
          costPrice: variant.cost_price || 0,
          stockQuantity: variant.quantity || 0,
          minStockLevel: variant.min_quantity || 0,
          quantity: variant.quantity || 0,
          minQuantity: variant.min_quantity || 0,
          sellingPrice: variant.selling_price || variant.price || 0,
          condition: variant.condition,
          isPrimary: variant.is_primary || false,
          attributes: variant.attributes || {},
          images: variant.images || []
        })) || [],
        attributes: product.attributes || {},
        metadata: product.metadata || {},
        createdAt: product.created_at,
        updatedAt: product.updated_at
      };
    }) || [];

    return {
      ok: true,
      data: processedProducts,
      message: `Successfully fetched ${processedProducts.length} products for category`
    };

  } catch (error) {
    console.error('💥 [fetchProductsByCategory] Exception:', error);
    return {
      ok: false,
      message: 'Failed to fetch products for category'
    };
  }
};