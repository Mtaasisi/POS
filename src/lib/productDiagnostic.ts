import { supabase } from './supabaseClient';

export class ProductDiagnostic {
  static async findProduct(productName: string) {
    console.log(`🔍 Searching for product: "${productName}"`);
    
    try {
      // Search for the product by name (case-insensitive)
      const { data: products, error } = await supabase
        .from('lats_products')
        .select(`
          id,
          name,
          description,
          category_id,
          supplier_id,
          is_active,
          total_quantity,
          created_at,
          updated_at,
          lats_categories(id, name),
          lats_suppliers(id, name)
        `)
        .ilike('name', `%${productName}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error searching for product:', error);
        return { success: false, error: error.message };
      }

      if (!products || products.length === 0) {
        console.log(`❌ No products found matching "${productName}"`);
        return { success: false, message: 'Product not found' };
      }

      console.log(`✅ Found ${products.length} product(s) matching "${productName}":`);
      products.forEach((product, index) => {
        console.log(`\n📦 Product ${index + 1}:`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Name: ${product.name}`);
        console.log(`   Description: ${product.description || 'N/A'}`);
        console.log(`   Category: ${product.lats_categories?.name || 'N/A'} (ID: ${product.category_id})`);
        console.log(`   Supplier: ${product.lats_suppliers?.name || 'N/A'} (ID: ${product.supplier_id})`);
        console.log(`   Active: ${product.is_active ? '✅ Yes' : '❌ No'}`);
        console.log(`   Total Quantity: ${product.total_quantity || 0}`);
        console.log(`   Created: ${new Date(product.created_at).toLocaleString()}`);
        console.log(`   Updated: ${new Date(product.updated_at).toLocaleString()}`);
      });

      return { success: true, products };
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      return { success: false, error: error.message };
    }
  }

  static async checkProductVariants(productId: string) {
    console.log(`🔍 Checking variants for product ID: ${productId}`);
    
    try {
      const { data: variants, error } = await supabase
        .from('lats_product_variants')
        .select(`
          id,
          name,
          sku,
          quantity,
          selling_price,
          cost_price,
          is_active,
          created_at
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching variants:', error);
        return { success: false, error: error.message };
      }

      if (!variants || variants.length === 0) {
        console.log('❌ No variants found for this product');
        return { success: false, message: 'No variants found' };
      }

      console.log(`✅ Found ${variants.length} variant(s):`);
      variants.forEach((variant, index) => {
        console.log(`\n🔧 Variant ${index + 1}:`);
        console.log(`   ID: ${variant.id}`);
        console.log(`   Name: ${variant.name}`);
        console.log(`   SKU: ${variant.sku}`);
        console.log(`   Quantity: ${variant.quantity || 0}`);
        console.log(`   Selling Price: TZS ${variant.selling_price || 0}`);
        console.log(`   Cost Price: TZS ${variant.cost_price || 0}`);
        console.log(`   Active: ${variant.is_active ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${new Date(variant.created_at).toLocaleString()}`);
      });

      return { success: true, variants };
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      return { success: false, error: error.message };
    }
  }

  static async checkInventoryFilters() {
    console.log('🔍 Checking current inventory filters and settings...');
    
    try {
      // Check if there are any active filters that might hide products
      const { data: products, error } = await supabase
        .from('lats_products')
        .select('id, name, is_active, total_quantity')
        .order('name');

      if (error) {
        console.error('❌ Error fetching products:', error);
        return { success: false, error: error.message };
      }

      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => p.is_active).length || 0;
      const inactiveProducts = products?.filter(p => !p.is_active).length || 0;
      const productsWithStock = products?.filter(p => (p.total_quantity || 0) > 0).length || 0;
      const outOfStockProducts = products?.filter(p => (p.total_quantity || 0) <= 0).length || 0;

      console.log('\n📊 Inventory Summary:');
      console.log(`   Total Products: ${totalProducts}`);
      console.log(`   Active Products: ${activeProducts}`);
      console.log(`   Inactive Products: ${inactiveProducts}`);
      console.log(`   Products with Stock: ${productsWithStock}`);
      console.log(`   Out of Stock Products: ${outOfStockProducts}`);

      // Check for recent products (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentProducts = products?.filter(p => 
        new Date(p.created_at) > yesterday
      ) || [];

      console.log(`\n🆕 Recent Products (last 24h): ${recentProducts.length}`);
      recentProducts.forEach(product => {
        console.log(`   - ${product.name} (${product.is_active ? 'Active' : 'Inactive'})`);
      });

      return { 
        success: true, 
        summary: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          withStock: productsWithStock,
          outOfStock: outOfStockProducts,
          recent: recentProducts.length
        }
      };
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      return { success: false, error: error.message };
    }
  }

  static async runFullDiagnostic(productName: string) {
    console.log('🚀 Running full product diagnostic...\n');
    
    // Step 1: Find the product
    const productResult = await this.findProduct(productName);
    if (!productResult.success) {
      return productResult;
    }

    const products = productResult.products;
    if (products && products.length > 0) {
      // Step 2: Check variants for the first matching product
      const variantResult = await this.checkProductVariants(products[0].id);
      
      // Step 3: Check inventory filters
      const filterResult = await this.checkInventoryFilters();

      return {
        success: true,
        product: products[0],
        variants: variantResult.success ? variantResult.variants : [],
        inventorySummary: filterResult.success ? filterResult.summary : null
      };
    }

    return { success: false, message: 'Product not found' };
  }
}
