import React from 'react';
import { 
  Package, TrendingUp, DollarSign, 
  CheckCircle, Star,
  Database, Save, BarChart3,
  Building, ShoppingCart, Activity,
  PieChart
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';

interface AnalyticsTabProps {
  products: any[];
  categories: any[];
  formatMoney: (amount: number) => string;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  products,
  categories,
  formatMoney
}) => {
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [backupProgress, setBackupProgress] = React.useState(0);
  const [backupStatus, setBackupStatus] = React.useState('');
  
  // Additional analytics state
  const [salesData, setSalesData] = React.useState<any>(null);
  const [supplierData, setSupplierData] = React.useState<any>(null);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = React.useState(false);

  // Load additional analytics data
  React.useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!products || products.length === 0) return;
      
      setIsLoadingAnalytics(true);
      try {
        // Fetch sales data for top selling products
        const { data: sales, error: salesError } = await supabase
          .from('lats_sales')
          .select(`
            id,
            total_amount,
            created_at,
            lats_sale_items (
              product_id,
              quantity,
              unit_price
            )
          `)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

        if (!salesError && sales && Array.isArray(sales)) {
          // Calculate product sales performance
          const productSales = new Map();
          sales.forEach((sale: any) => {
            if (sale.lats_sale_items && Array.isArray(sale.lats_sale_items)) {
              sale.lats_sale_items.forEach((item: any) => {
                if (!productSales.has(item.product_id)) {
                  productSales.set(item.product_id, {
                    productId: item.product_id,
                    totalSold: 0,
                    totalRevenue: 0,
                    salesCount: 0
                  });
                }
                const productSale = productSales.get(item.product_id);
                productSale.totalSold += item.quantity || 0;
                productSale.totalRevenue += (item.unit_price || 0) * (item.quantity || 0);
                productSale.salesCount += 1;
              });
            }
          });
          
          setSalesData({
            topSellingProducts: Array.from(productSales.values())
              .sort((a, b) => b.totalSold - a.totalSold)
              .slice(0, 10),
            totalRevenue: sales.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0),
            totalTransactions: sales.length,
            averageOrderValue: sales.length > 0 ? sales.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0) / sales.length : 0
          });
        }

        // Fetch supplier data
        const { data: suppliers, error: suppliersError } = await supabase
          .from('lats_suppliers')
          .select(`
            id,
            name,
            contact_person,
            phone,
            email,
            rating,
            total_orders,
            on_time_delivery_rate
          `)
          ;

        if (!suppliersError && suppliers && Array.isArray(suppliers)) {
          setSupplierData({
            totalSuppliers: suppliers.length,
            topSuppliers: suppliers
              .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 5),
            averageRating: suppliers.reduce((sum: number, s: any) => sum + (s.rating || 0), 0) / suppliers.length
          });
        }

        // Fetch recent activity
        const { data: recentSales, error: recentError } = await supabase
          .from('lats_sales')
          .select(`
            id,
            total_amount,
            created_at,
            customer_name,
            status
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!recentError && recentSales && Array.isArray(recentSales)) {
          setRecentActivity(recentSales.map((sale: any) => ({
            id: sale.id,
            type: 'sale',
            description: `Sale to ${sale.customer_name || 'Customer'}`,
            amount: sale.total_amount,
            date: sale.created_at,
            status: sale.status
          })));
        }

      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    loadAnalyticsData();
  }, [products]);

  // Calculate additional analytics
  const analytics = React.useMemo(() => {
    const totalProducts = products?.length || 0;
    const activeProducts = products?.filter(p => p.isActive).length || 0;
    const inactiveProducts = totalProducts - activeProducts;
    const featuredProducts = products?.filter(p => p.isFeatured).length || 0;
    
    // Stock analytics with proper thresholds
    const lowStockProducts = products?.filter(p => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      const minStock = p.variants?.[0]?.minQuantity || p.minStockLevel || 5; // Default min stock of 5
      return totalStock > 0 && totalStock <= minStock;
    }).length || 0;
    
    const outOfStockProducts = products?.filter(p => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      return totalStock <= 0;
    }).length || 0;
    
    const wellStockedProducts = products?.filter(p => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      const minStock = p.variants?.[0]?.minQuantity || p.minStockLevel || 5;
      return totalStock > minStock;
    }).length || 0;
    
    // Reorder alerts (products below minimum stock level)
    const reorderAlerts = products?.filter(p => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      const minStock = p.variants?.[0]?.minQuantity || p.minStockLevel || 5;
      return totalStock <= minStock && totalStock > 0;
    }).length || 0;
    
    // Value analytics - use ALL variants for accurate calculation
    const totalValue = products?.reduce((sum, product) => {
      const productValue = product.variants?.reduce((variantSum: number, variant: any) => {
        const costPrice = variant.costPrice || 0;
        const quantity = variant.quantity || 0;
        return variantSum + (costPrice * quantity);
      }, 0) || 0;
      return sum + productValue;
    }, 0) || 0;
    
    const retailValue = products?.reduce((sum, product) => {
      // Calculate retail value using ALL variants for consistency
      const productRetailValue = product.variants?.reduce((variantSum: number, variant: any) => {
        // Use sellingPrice if available, otherwise calculate from cost price with markup
        const sellingPrice = variant.sellingPrice || (variant.costPrice * 1.5) || 0; // 50% markup if no selling price
        const quantity = variant.quantity || 0;
        return variantSum + (sellingPrice * quantity);
      }, 0) || 0;
      return sum + productRetailValue;
    }, 0) || 0;
    
    const potentialProfit = retailValue - totalValue;
    // Calculate profit margin as (profit / cost) * 100 for more accurate representation
    const profitMargin = totalValue > 0 ? (potentialProfit / totalValue) * 100 : 0;
    
    // Category analytics - create categories from product data since we don't have explicit categories
    const categoryMap = new Map();
    
    // Group products by inferred categories based on product names
    products?.forEach(product => {
      let categoryName = 'Electronics'; // Default category
      
      // Infer category from product name
      const productName = product.name?.toLowerCase() || '';
      if (productName.includes('iphone') || productName.includes('ipad') || productName.includes('macbook')) {
        categoryName = 'iPhones';
      } else if (productName.includes('jbl') || productName.includes('speaker') || productName.includes('soundbar')) {
        categoryName = 'Bluetooth Speakers';
      } else if (productName.includes('soundbar') || productName.includes('bar')) {
        categoryName = 'Soundbars';
      } else if (productName.includes('keyboard') || productName.includes('mechanical')) {
        categoryName = 'Keyboards';
      } else if (productName.includes('cpu') || productName.includes('min') || productName.includes('desktop')) {
        categoryName = 'CPU';
      } else if (productName.includes('monitor') || productName.includes('display')) {
        categoryName = 'Monitors';
      }
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          products: [],
          count: 0,
          value: 0
        });
      }
      
      const category = categoryMap.get(categoryName);
      category.products.push(product);
      category.count += 1;
      
      // Calculate category value using retail prices
      const productValue = product.variants?.reduce((sum: number, variant: any) => {
        const sellingPrice = variant.sellingPrice || (variant.costPrice * 1.5) || 0; // 50% markup if no selling price
        const quantity = variant.quantity || 0;
        return sum + (sellingPrice * quantity);
      }, 0) || 0;
      
      category.value += productValue;
    });
    
    const categoryStats = Array.from(categoryMap.values())
      .map(category => ({
        name: category.name,
        count: category.count,
        value: category.value,
        percentage: totalProducts > 0 ? (category.count / totalProducts) * 100 : 0
      }))
      .sort((a: any, b: any) => b.value - a.value);
    
    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      lowStockProducts,
      outOfStockProducts,
      wellStockedProducts,
      reorderAlerts,
      totalValue,
      retailValue,
      potentialProfit,
      profitMargin,
      categoryStats
    };
  }, [products, categories]);

  // Database backup function
  const performDatabaseBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    setBackupStatus('Starting backup...');

    try {
      // Only backup tables that are actually used in the application
      const ACTIVE_TABLES = [
        // Core Business Tables (definitely exist)
        'customers',
        'lats_categories', 
        'lats_products',
        'lats_product_variants',
        'lats_suppliers',
        'employees',
        'appointments',
        'settings',
        'devices',
        'auth_users',
        'integrations',
        'system_settings',
        'notification_templates',
        'audit_logs',
        'product_images',
        'user_settings',
        'lats_pos_general_settings',
        'lats_pos_receipt_settings',
        'lats_pos_advanced_settings',
        'lats_purchase_orders',
        'lats_stock_movements',
        'user_daily_goals',
        
        // Financial Tables (important for business)
        'customer_payments',
        'finance_accounts',
        'finance_expenses',
        'finance_expense_categories',
        'finance_transfers',
        'gift_cards',
        'gift_card_transactions',
        'installment_payments',
        
        // Device Management Tables
        'device_attachments',
        'device_checklists',
        'device_ratings',
        'device_remarks',
        'device_transitions',
        'diagnostic_checks',
        'diagnostic_devices',
        'diagnostic_requests',
        'diagnostic_templates',
        
        // Customer Management Tables
        'customer_notes',
        'customer_checkins',
        'customer_revenue',
        'contact_history',
        'contact_methods',
        'contact_preferences',
        
        // Communication Tables
        'communication_templates',
        'email_logs',
        'chat_messages',
        
        // WhatsApp Tables (likely exist)
        'whatsapp_message_templates',
        'whatsapp_instance_settings_view',
        'whatsapp_templates',
        
        // SMS Tables (likely exist)
        'sms_logs',
        'sms_triggers',
        
        // Admin Tables
        'admin_settings',
        'admin_settings_log',
        'admin_settings_view',
        
        // Other Tables (likely exist)
        'uuid_diagnostic_log'
      ];

      setBackupStatus(`Backing up ${ACTIVE_TABLES.length} active tables...`);

      const backup: any = {
        timestamp: new Date().toISOString(),
        databaseInfo: {
          totalTables: ACTIVE_TABLES.length,
          backupType: 'UI BACKUP - ACTIVE TABLES ONLY'
        },
        tables: {},
        summary: {
          totalTables: 0,
          tablesWithData: 0,
          totalRecords: 0
        }
      };

      let totalRecords = 0;
      let tablesWithData = 0;
      let processedTables = 0;

      for (const tableName of ACTIVE_TABLES) {
        try {
          processedTables++;
          const progress = ((processedTables / ACTIVE_TABLES.length) * 100);
          setBackupProgress(progress);
          setBackupStatus(`Backing up table: ${tableName} (${processedTables}/${ACTIVE_TABLES.length})`);

          // Get all records from table using pagination
          const allRecords: any[] = [];
          let from = 0;
          const pageSize = 1000;

          while (true) {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .range(from, from + pageSize - 1);

            if (error) {
              // Table doesn't exist, skip it silently
              console.log(`⚠️ Table '${tableName}' does not exist, skipping...`);
              break;
            }

            if (!data || data.length === 0) {
              break;
            }

            allRecords.push(...data);

            if (data.length < pageSize) {
              break;
            }

            from += pageSize;
            await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
          }

          const recordCount = allRecords.length;
          backup.tables[tableName] = {
            exists: true,
            recordCount,
            data: allRecords
          };

          totalRecords += recordCount;
          if (recordCount > 0) tablesWithData++;

        } catch (error: any) {
          // Handle any other errors gracefully
          const errorMessage = error?.message || 'Unknown error';
          backup.tables[tableName] = {
            exists: true,
            error: errorMessage,
            data: null
          };
          console.log(`❌ Error backing up '${tableName}': ${errorMessage}`);
        }
      }

      // Update summary
      backup.summary.totalTables = ACTIVE_TABLES.length;
      backup.summary.tablesWithData = tablesWithData;
      backup.summary.totalRecords = totalRecords;

      // Create download
      const backupJson = JSON.stringify(backup, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupStatus(`✅ Backup completed! ${totalRecords.toLocaleString()} records backed up from ${tablesWithData} tables`);
      setBackupProgress(100);

      // Reset after 3 seconds
      setTimeout(() => {
        setIsBackingUp(false);
        setBackupProgress(0);
        setBackupStatus('');
      }, 3000);

    } catch (error: any) {
      setBackupStatus(`❌ Backup failed: ${error.message}`);
      setIsBackingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalProducts}</p>
              <p className="text-xs text-gray-500">{analytics.activeProducts} active</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Stock Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Stock Health</p>
              <p className="text-2xl font-bold text-green-600">{analytics.wellStockedProducts}</p>
              <p className="text-xs text-gray-500">{analytics.lowStockProducts} low stock</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Retail Value */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Retail Value</p>
              <p className="text-2xl font-bold text-purple-600">{formatMoney(analytics.retailValue)}</p>
              <p className="text-xs text-gray-500">{analytics.profitMargin.toFixed(1)}% margin</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Profit Potential */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Profit Potential</p>
              <p className="text-2xl font-bold text-green-600">{formatMoney(analytics.potentialProfit)}</p>
              <p className="text-xs text-gray-500">Total profit</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Charts and Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Distribution Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Stock Distribution</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Well Stocked</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{analytics.wellStockedProducts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Low Stock</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{analytics.lowStockProducts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Out of Stock</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{analytics.outOfStockProducts}</span>
            </div>
          </div>
          
          {/* Simple Progress Bar Chart */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Stock Health</span>
              <span>{analytics.totalProducts > 0 ? Math.round((analytics.wellStockedProducts / analytics.totalProducts) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${analytics.totalProducts > 0 ? (analytics.wellStockedProducts / analytics.totalProducts) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-800">Top Categories</h3>
          </div>
          
          <div className="space-y-3">
            {analytics.categoryStats.slice(0, 3).map((category, index) => (
              <div key={category.name} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatMoney(category.value)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{category.count} products</span>
                  <span>{category.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-800">Financial Overview</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cost Value</span>
              <span className="text-sm font-semibold text-red-600">{formatMoney(analytics.totalValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Retail Value</span>
              <span className="text-sm font-semibold text-green-600">{formatMoney(analytics.retailValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Profit Margin</span>
              <span className={`text-sm font-semibold ${analytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.profitMargin.toFixed(1)}%
              </span>
            </div>
            
            {/* Profit Margin Visual */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Profit Margin</span>
                <span>{analytics.profitMargin.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    analytics.profitMargin >= 50 ? 'bg-green-500' : 
                    analytics.profitMargin >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(analytics.profitMargin, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row - Sales Performance & Real-time Data */}
      {salesData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Performance Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-800">Sales Performance (30 Days)</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{formatMoney(salesData.totalRevenue)}</div>
                <div className="text-xs text-gray-500">Total Revenue</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{salesData.totalTransactions}</div>
                <div className="text-xs text-gray-500">Transactions</div>
              </div>
            </div>
            
            {/* Top Selling Products Mini Chart */}
            {salesData.topSellingProducts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700">Top Products</h4>
                {salesData.topSellingProducts.slice(0, 3).map((product: any, index: number) => {
                  const productInfo = products.find(p => p.id === product.productId);
                  return (
                    <div key={product.productId} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                        </div>
                        <span className="text-xs text-gray-700 truncate">{productInfo?.name || 'Unknown'}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-900">{product.totalSold}</div>
                        <div className="text-xs text-gray-500">units</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Supplier Performance */}
          {supplierData && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
                <Building className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-semibold text-gray-800">Supplier Performance</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{supplierData.totalSuppliers}</div>
                  <div className="text-xs text-gray-500">Suppliers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{supplierData.averageRating.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Avg Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{supplierData.topSuppliers.length}</div>
                  <div className="text-xs text-gray-500">Top Rated</div>
                </div>
              </div>
              
              {/* Top Suppliers Mini List */}
              {supplierData.topSuppliers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700">Top Suppliers</h4>
                  {supplierData.topSuppliers.slice(0, 3).map((supplier: any, index: number) => (
                    <div key={supplier.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-orange-600">{index + 1}</span>
                        </div>
                        <span className="text-xs text-gray-700 truncate">{supplier.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs font-semibold text-gray-900">{supplier.rating || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fourth Row - Compact Analytics & Database Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
            </div>
            
            <div className="space-y-2">
              {recentActivity.slice(0, 4).map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-900 truncate">{activity.description}</div>
                      <div className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-gray-900">{formatMoney(activity.amount)}</div>
                    <div className={`text-xs px-1 py-0.5 rounded-full ${
                      activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {activity.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Intelligence */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-800">Business Intelligence</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">ABC Analysis</span>
              <span className="text-xs font-semibold text-gray-900">
                {analytics.categoryStats.slice(0, 1).length}A, {analytics.categoryStats.slice(1, 3).length}B, {analytics.categoryStats.slice(3).length}C
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Inventory Turnover</span>
              <span className="text-xs font-semibold text-gray-900">
                {salesData ? (salesData.totalRevenue / analytics.totalValue).toFixed(2) : 'N/A'}x
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Profitability</span>
              <span className={`text-xs font-semibold ${analytics.profitMargin >= 50 ? 'text-green-600' : analytics.profitMargin >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                {analytics.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Database Backup */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-800">Database Backup</h3>
          </div>
          
          <div className="space-y-3">
            <p className="text-xs text-gray-600">Create a complete backup of all your data</p>
            <button
              onClick={performDatabaseBackup}
              disabled={isBackingUp}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
                isBackingUp
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
              }`}
            >
              {isBackingUp ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Backing Up...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Backup Database
                </>
              )}
            </button>

            {isBackingUp && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${backupProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-indigo-700">{backupStatus}</p>
              </div>
            )}

            {!isBackingUp && backupStatus && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700">{backupStatus}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State - Following GeneralProductDetailModal Design */}
      {isLoadingAnalytics && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-gray-600">Loading advanced analytics...</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalyticsTab;


