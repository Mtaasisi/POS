import { supabase } from '../../../lib/supabaseClient';

export interface InventoryAnalytics {
  totalVariants: number;
  totalStock: number;
  totalValue: number;
  totalProducts: number;
  activeProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  categoriesCount: number;
  brandsCount: number;
  suppliersCount: number;
}

export interface SalesAnalytics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalTransactions: number;
  growthRate: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  averageCustomerValue: number;
}

export class AnalyticsService {
  /**
   * Fetch comprehensive inventory analytics
   */
  static async getInventoryAnalytics(): Promise<InventoryAnalytics> {
    try {
      console.log('🔍 Starting inventory analytics calculation...');
      
      // Get total variants count
      const { count: totalVariants, error: variantsError } = await supabase
        .from('lats_product_variants')
        .select('id', { count: 'exact', head: true });

      if (variantsError) throw variantsError;
      console.log('📊 Total variants found:', totalVariants);

      // Get total stock and value from products
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select(`
          id,
          name,
          is_active,
          total_quantity,
          total_value,
          variants:lats_product_variants(
            id,
            name,
            quantity,
            cost_price,
            selling_price
          )
        `);

      if (productsError) throw productsError;
      console.log('📦 Products found:', products?.length || 0);

      // Calculate metrics
      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => p.is_active).length || 0;
      
      // Calculate total stock from variants
      let totalStock = 0;
      let totalValue = 0;
      let lowStockItems = 0;
      let outOfStockItems = 0;

      console.log('🔍 Analytics Debug: Processing products...');
      console.log('📦 Total products found:', products?.length || 0);

      products?.forEach((product, index) => {
        console.log(`🔍 Product ${index + 1}: ${product.name || 'Unnamed Product'}`);
        console.log(`   Product ID: ${product.id}`);
        console.log(`   Is Active: ${product.is_active}`);
        console.log(`   Total Quantity: ${product.total_quantity}`);
        console.log(`   Total Value: ${product.total_value}`);
        console.log(`   Variants count: ${product.variants?.length || 0}`);
        
        const productStock = product.variants?.reduce((sum: number, variant: any) => {
          const quantity = variant.quantity || 0;
          console.log(`     Variant ${variant.name || 'Unnamed'}: ${quantity} units @ $${variant.cost_price || 0}`);
          return sum + quantity;
        }, 0) || 0;
        
        const productValue = product.variants?.reduce((sum: number, variant: any) => {
          const costPrice = variant.cost_price || 0;
          const quantity = variant.quantity || 0;
          const variantValue = costPrice * quantity;
          console.log(`     Variant value: $${costPrice} × ${quantity} = $${variantValue}`);
          return sum + variantValue;
        }, 0) || 0;

        console.log(`   Product stock: ${productStock}, Product value: $${productValue}`);

        totalStock += productStock;
        totalValue += productValue;

        // Check stock levels
        if (productStock <= 0) {
          outOfStockItems++;
        } else if (productStock <= 10) {
          lowStockItems++;
        }
      });

      console.log('📊 Analytics Debug Results:');
      console.log(`   Total Stock: ${totalStock}`);
      console.log(`   Total Value: $${totalValue}`);
      console.log(`   Low Stock Items: ${lowStockItems}`);
      console.log(`   Out of Stock Items: ${outOfStockItems}`);

      // Get counts for categories, brands, suppliers
      const { count: categoriesCount } = await supabase
        .from('lats_categories')
        .select('id', { count: 'exact', head: true });



      const { count: suppliersCount } = await supabase
        .from('lats_suppliers')
        .select('id', { count: 'exact', head: true });

      const result = {
        totalVariants: totalVariants || 0,
        totalStock,
        totalValue,
        totalProducts,
        activeProducts,
        lowStockItems,
        outOfStockItems,
        categoriesCount: categoriesCount || 0,

        suppliersCount: suppliersCount || 0
      };

      console.log('✅ Final analytics result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching inventory analytics:', error);
      return {
        totalVariants: 0,
        totalStock: 0,
        totalValue: 0,
        totalProducts: 0,
        activeProducts: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        categoriesCount: 0,

        suppliersCount: 0
      };
    }
  }

  /**
   * Fetch sales analytics
   */
  static async getSalesAnalytics(): Promise<SalesAnalytics> {
    try {
      // Get sales data from POS transactions
      const { data: sales, error } = await supabase
        .from('lats_pos_transactions')
        .select(`
          id,
          total_amount,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalTransactions = sales?.length || 0;
      const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Calculate growth rate (simplified - compare current month vs previous month)
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const currentMonthSales = sales?.filter(sale => 
        new Date(sale.created_at) >= currentMonth
      ).reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

      const previousMonthSales = sales?.filter(sale => 
        new Date(sale.created_at) >= previousMonth && new Date(sale.created_at) < currentMonth
      ).reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

      const growthRate = previousMonthSales > 0 
        ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100 
        : 0;

      return {
        totalSales: totalRevenue,
        totalRevenue,
        averageOrderValue,
        totalTransactions,
        growthRate
      };
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      return {
        totalSales: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        totalTransactions: 0,
        growthRate: 0
      };
    }
  }

  /**
   * Fetch customer analytics
   */
  static async getCustomerAnalytics(): Promise<any> {
    try {
      // Get customers data
      const { data: customers, error } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          phone,
          email,
          created_at,
          total_spent,
          last_purchase_date
        `);

      if (error) throw error;

      const totalCustomers = customers?.length || 0;
      
      // Calculate new customers (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newCustomers = customers?.filter(customer => 
        new Date(customer.created_at) >= thirtyDaysAgo
      ).length || 0;

      // Calculate active customers (purchased in last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const activeCustomers = customers?.filter(customer => 
        customer.last_purchase_date && new Date(customer.last_purchase_date) >= ninetyDaysAgo
      ).length || 0;

      // Calculate average customer value
      const totalSpent = customers?.reduce((sum, customer) => 
        sum + (customer.total_spent || 0), 0) || 0;
      const averageCustomerValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

      // Calculate customer growth (simplified)
      const customerGrowth = totalCustomers > 0 ? Math.min(25, Math.max(0, (newCustomers / totalCustomers) * 100)) : 0;

      // Get top customers from sales data
      const { data: sales, error: salesError } = await supabase
        .from('lats_sales')
        .select(`
          customer_id,
          customer_name,
          total_amount,
          created_at
        `)
        .not('customer_id', 'is', null)
        .order('total_amount', { ascending: false })
        .limit(10);

      let topCustomers: any[] = [];
      if (!salesError && sales) {
        // Group sales by customer
        const customerSales = new Map();
        sales.forEach(sale => {
          const customerId = sale.customer_id;
          if (!customerSales.has(customerId)) {
            customerSales.set(customerId, {
              name: sale.customer_name || 'Unknown Customer',
              purchases: 0,
              totalSpent: 0,
              lastPurchase: sale.created_at
            });
          }
          const customer = customerSales.get(customerId);
          customer.purchases += 1;
          customer.totalSpent += sale.total_amount || 0;
          if (new Date(sale.created_at) > new Date(customer.lastPurchase)) {
            customer.lastPurchase = sale.created_at;
          }
        });

        topCustomers = Array.from(customerSales.values())
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 5);
      }

      // Create customer segments
      const customerSegments = [
        { segment: 'VIP Customers', count: Math.round(totalCustomers * 0.1), percentage: 10, averageValue: averageCustomerValue * 3 },
        { segment: 'Regular Customers', count: Math.round(totalCustomers * 0.6), percentage: 60, averageValue: averageCustomerValue },
        { segment: 'New Customers', count: newCustomers, percentage: totalCustomers > 0 ? Math.round((newCustomers / totalCustomers) * 100) : 0, averageValue: averageCustomerValue * 0.5 }
      ];

      // Create customer activity (last 7 days)
      const customerActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayNewCustomers = customers?.filter(customer => 
          new Date(customer.created_at) >= dayStart && new Date(customer.created_at) < dayEnd
        ).length || 0;

        const dayActiveCustomers = customers?.filter(customer => 
          customer.last_purchase_date && 
          new Date(customer.last_purchase_date) >= dayStart && 
          new Date(customer.last_purchase_date) < dayEnd
        ).length || 0;

        customerActivity.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          newCustomers: dayNewCustomers,
          activeCustomers: dayActiveCustomers
        });
      }

      return {
        totalCustomers,
        newCustomers,
        activeCustomers,
        averageCustomerValue,
        customerGrowth,
        topCustomers,
        customerSegments,
        customerActivity
      };
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      return {
        totalCustomers: 0,
        newCustomers: 0,
        activeCustomers: 0,
        averageCustomerValue: 0,
        customerGrowth: 0,
        topCustomers: [],
        customerSegments: [],
        customerActivity: []
      };
    }
  }

  /**
   * Get all analytics data
   */
  static async getAllAnalytics() {
    const [inventory, sales, customers] = await Promise.all([
      this.getInventoryAnalytics(),
      this.getSalesAnalytics(),
      this.getCustomerAnalytics()
    ]);

    return {
      inventory,
      sales,
      customers
    };
  }
}
