// FIXED SALE DETAILS MODAL - Simplified Query Approach
// This replaces the complex nested query with multiple simpler queries

const fetchSaleDetails = async () => {
  try {
    setLoading(true);
    setError(null);

    console.log('🔍 Fetching sale details for ID:', saleId);

    // Step 1: Get basic sale data
    const { data: saleData, error: saleError } = await supabase
      .from('lats_sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (saleError) {
      console.error('❌ Error fetching sale:', saleError);
      setError(`Failed to load sale: ${saleError.message}`);
      return;
    }

    console.log('✅ Sale data loaded:', saleData);

    // Step 2: Get customer data if customer_id exists
    let customerData = null;
    if (saleData.customer_id) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', saleData.customer_id)
        .single();

      if (customerError) {
        console.warn('⚠️ Customer data not found:', customerError);
      } else {
        customerData = customer;
        console.log('✅ Customer data loaded:', customerData);
      }
    }

    // Step 3: Get sale items
    const { data: saleItems, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select('*')
      .eq('sale_id', saleId);

    if (itemsError) {
      console.error('❌ Error fetching sale items:', itemsError);
      setError(`Failed to load sale items: ${itemsError.message}`);
      return;
    }

    console.log('✅ Sale items loaded:', saleItems);

    // Step 4: Get products for each sale item
    const productIds = saleItems?.map(item => item.product_id).filter(Boolean) || [];
    const variantIds = saleItems?.map(item => item.variant_id).filter(Boolean) || [];

    let productsData = {};
    let categoriesData = {};
    let variantsData = {};

    // Fetch products
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select('*')
        .in('id', productIds);

      if (productsError) {
        console.warn('⚠️ Products not found:', productsError);
      } else {
        productsData = products.reduce((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {});
        console.log('✅ Products loaded:', productsData);
      }
    }

    // Fetch categories for products
    const categoryIds = Object.values(productsData).map((product: any) => product.category_id).filter(Boolean);
    if (categoryIds.length > 0) {
      const { data: categories, error: categoriesError } = await supabase
        .from('lats_categories')
        .select('*')
        .in('id', categoryIds);

      if (categoriesError) {
        console.warn('⚠️ Categories not found:', categoriesError);
      } else {
        categoriesData = categories.reduce((acc, category) => {
          acc[category.id] = category;
          return acc;
        }, {});
        console.log('✅ Categories loaded:', categoriesData);
      }
    }

    // Fetch variants
    if (variantIds.length > 0) {
      const { data: variants, error: variantsError } = await supabase
        .from('lats_product_variants')
        .select('*')
        .in('id', variantIds);

      if (variantsError) {
        console.warn('⚠️ Variants not found:', variantsError);
      } else {
        variantsData = variants.reduce((acc, variant) => {
          acc[variant.id] = variant;
          return acc;
        }, {});
        console.log('✅ Variants loaded:', variantsData);
      }
    }

    // Step 5: Combine all data into the expected format
    const combinedSaleData = {
      ...saleData,
      customers: customerData,
      lats_sale_items: saleItems?.map(item => ({
        ...item,
        lats_products: item.product_id ? {
          ...productsData[item.product_id],
          lats_categories: productsData[item.product_id]?.category_id ? 
            categoriesData[productsData[item.product_id].category_id] : null
        } : null,
        lats_product_variants: item.variant_id ? {
          ...variantsData[item.variant_id],
          lats_products: variantsData[item.variant_id] ? {
            id: variantsData[item.variant_id].product_id,
            name: productsData[variantsData[item.variant_id].product_id]?.name,
            description: productsData[variantsData[item.variant_id].product_id]?.description,
            sku: variantsData[item.variant_id].sku,
            barcode: variantsData[item.variant_id].barcode
          } : null
        } : null
      })) || []
    };

    console.log('✅ Combined sale data:', combinedSaleData);
    setSale(combinedSaleData);

  } catch (err) {
    console.error('❌ Unexpected error fetching sale details:', err);
    setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
};

// ALTERNATIVE: Even simpler approach with minimal queries
const fetchSaleDetailsSimple = async () => {
  try {
    setLoading(true);
    setError(null);

    console.log('🔍 Fetching sale details (simple approach) for ID:', saleId);

    // Get sale with customer in one query (simpler join)
    const { data: saleData, error: saleError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(*)
      `)
      .eq('id', saleId)
      .single();

    if (saleError) {
      console.error('❌ Error fetching sale:', saleError);
      setError(`Failed to load sale: ${saleError.message}`);
      return;
    }

    // Get sale items with products in separate query
    const { data: saleItems, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select(`
        *,
        lats_products(*)
      `)
      .eq('sale_id', saleId);

    if (itemsError) {
      console.error('❌ Error fetching sale items:', itemsError);
      setError(`Failed to load sale items: ${itemsError.message}`);
      return;
    }

    // Get categories for products
    const productIds = saleItems?.map(item => item.product_id).filter(Boolean) || [];
    let categoriesData = {};
    
    if (productIds.length > 0) {
      const { data: categories, error: categoriesError } = await supabase
        .from('lats_categories')
        .select('*')
        .in('id', productIds.map(id => saleItems.find(item => item.product_id === id)?.lats_products?.category_id).filter(Boolean));

      if (!categoriesError && categories) {
        categoriesData = categories.reduce((acc, category) => {
          acc[category.id] = category;
          return acc;
        }, {});
      }
    }

    // Combine the data
    const combinedSaleData = {
      ...saleData,
      lats_sale_items: saleItems?.map(item => ({
        ...item,
        lats_products: item.lats_products ? {
          ...item.lats_products,
          lats_categories: item.lats_products.category_id ? 
            categoriesData[item.lats_products.category_id] : null
        } : null
      })) || []
    };

    console.log('✅ Simple sale data loaded:', combinedSaleData);
    setSale(combinedSaleData);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
};
