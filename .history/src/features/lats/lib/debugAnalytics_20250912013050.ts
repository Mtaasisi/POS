import { supabase } from '../../../../lib/supabaseClient';

/**
 * Debug script to check why total value is showing as $0.00
 */
export class DebugAnalytics {
  static async checkDatabaseData() {
    console.log('🔍 Debug Analytics: Checking database data...');
    
    try {
      // Check products
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select(`
          id,
          name,
          is_active,
          total_quantity,
          total_value,
          created_at
        `)
        .limit(10);

      if (productsError) {
        console.error('❌ Error fetching products:', productsError);
        return;
      }

      console.log('📦 Products found:', products?.length || 0);
      products?.forEach((product, index) => {
        console.log(`   Product ${index + 1}:`, {
          id: product.id,
          name: product.name,
          isActive: product.is_active,
          totalQuantity: product.total_quantity,
          totalValue: product.total_value,
          createdAt: product.created_at
        });
      });

      // Check variants
      const { data: variants, error: variantsError } = await supabase
        .from('lats_product_variants')
        .select(`
          id,
          product_id,
          name,
          quantity,
          cost_price,
          selling_price,
          created_at
        `)
        .limit(10);

      if (variantsError) {
        console.error('❌ Error fetching variants:', variantsError);
        return;
      }

      console.log('🏷️ Variants found:', variants?.length || 0);
      variants?.forEach((variant, index) => {
        console.log(`   Variant ${index + 1}:`, {
          id: variant.id,
          productId: variant.product_id,
          name: variant.name,
          quantity: variant.quantity,
          costPrice: variant.cost_price,
          sellingPrice: variant.selling_price,
          createdAt: variant.created_at
        });
      });

      // Check if there are any variants with cost prices and quantities
      const variantsWithValue = variants?.filter(v => 
        (v.cost_price || 0) > 0 && (v.quantity || 0) > 0
      );

      console.log('💰 Variants with value (cost_price > 0 AND quantity > 0):', variantsWithValue?.length || 0);
      
      if (variantsWithValue && variantsWithValue.length > 0) {
        const totalValue = variantsWithValue.reduce((sum, variant) => {
          const value = (variant.cost_price || 0) * (variant.quantity || 0);
          console.log(`   Variant ${variant.name}: $${variant.cost_price} × ${variant.quantity} = $${value}`);
          return sum + value;
        }, 0);
        console.log('💵 Total calculated value:', totalValue);
      } else {
        console.log('⚠️ No variants found with both cost price and quantity!');
        console.log('💡 This is why total value is $0.00');
      }

      // Check categories
      const { count: categoriesCount } = await supabase
        .from('lats_categories')
        .select('id', { count: 'exact', head: true });



      // Check suppliers
      const { count: suppliersCount } = await supabase
        .from('lats_suppliers')
        .select('id', { count: 'exact', head: true });

      console.log('📊 Summary:');
      console.log(`   Products: ${products?.length || 0}`);
      console.log(`   Variants: ${variants?.length || 0}`);
      console.log(`   Categories: ${categoriesCount || 0}`);

      console.log(`   Suppliers: ${suppliersCount || 0}`);

    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  }

  /**
   * Add some test data to verify the analytics work
   */
  static async addTestData() {
    // Note: Test data generation removed - use real data instead
    console.log('⚠️ Test data generation is no longer available. Use real product and sales data instead.');
  }

  /**
   * Run full debug analysis
   */
  static async runFullDebug() {
    console.log('🚀 Starting full analytics debug...');
    console.log('=' .repeat(50));
    
    await this.checkDatabaseData();
    
    console.log('=' .repeat(50));
    console.log('⚠️ Test data generation is no longer available. Use real data instead.');
    
    console.log('=' .repeat(50));
    console.log('✅ Debug complete!');
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).debugAnalytics = DebugAnalytics;
}
