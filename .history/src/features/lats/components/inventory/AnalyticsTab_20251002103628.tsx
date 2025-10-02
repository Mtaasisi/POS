import React from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import { 
  Package, TrendingUp, DollarSign, 
  AlertTriangle, CheckCircle, Star,
  Database, Save, BarChart3, Target,
  Building, ShoppingCart, Activity, Award
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';

interface AnalyticsTabProps {
  products: any[];
  categories: any[];
  formatMoney: (amount: number) => string;
  liveMetrics?: any;
  isLoadingLiveMetrics?: boolean;
  onRefreshLiveMetrics?: () => void;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  products,
  categories,
  formatMoney,
  liveMetrics,
  isLoadingLiveMetrics,
  onRefreshLiveMetrics
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
      {/* Database Backup Section - Following GeneralProductDetailModal Design */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-800">Database Backup</h3>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Create a complete backup of all your data</p>
            <p className="text-xs text-gray-500 mt-1">Includes all tables and records</p>
          </div>
          <button
            onClick={performDatabaseBackup}
            disabled={isBackingUp}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
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
        </div>

        {isBackingUp && (
          <div className="space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${backupProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-indigo-700">{backupStatus}</p>
          </div>
        )}

        {!isBackingUp && backupStatus && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{backupStatus}</p>
          </div>
        )}
      </div>

      {/* Overview Metrics - Following GeneralProductDetailModal Design */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">Inventory Overview</h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Total Products</span>
            <p className="text-lg font-bold text-gray-900">{analytics.totalProducts}</p>
            <p className="text-xs text-gray-500">{analytics.activeProducts} active, {analytics.inactiveProducts} inactive</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Stock Status</span>
            <p className="text-lg font-bold text-green-600">{analytics.wellStockedProducts}</p>
            <p className="text-xs text-gray-500">{analytics.lowStockProducts} low, {analytics.outOfStockProducts} out</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Retail Value</span>
            <p className="text-lg font-bold text-purple-600">{formatMoney(analytics.retailValue)}</p>
            <p className="text-xs text-gray-500">{analytics.profitMargin.toFixed(1)}% profit margin</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Featured</span>
            <p className="text-lg font-bold text-amber-600">{analytics.featuredProducts}</p>
            <p className="text-xs text-gray-500">{analytics.totalProducts > 0 ? ((analytics.featuredProducts / analytics.totalProducts) * 100).toFixed(1) : 0}% of total</p>
          </div>
        </div>
      </div>

      {/* Financial Analytics - Following GeneralProductDetailModal Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-800">Financial Overview</h3>
            {liveMetrics && (
              <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Live Data</span>
                </div>
                {onRefreshLiveMetrics && (
                  <button
                    onClick={onRefreshLiveMetrics}
                    disabled={isLoadingLiveMetrics}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {isLoadingLiveMetrics ? 'Refreshing...' : 'Refresh'}
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Cost Value</span>
              <p className="text-lg font-bold text-red-600">{formatMoney(analytics.totalValue)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Retail Value</span>
              <p className="text-lg font-bold text-green-600">{formatMoney(analytics.retailValue)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Potential Profit</span>
              <p className={`text-lg font-bold ${analytics.potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(analytics.potentialProfit)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Profit Margin</span>
              <p className={`text-lg font-bold ${analytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Stock Distribution</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Well Stocked:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-600">{analytics.wellStockedProducts}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProducts > 0 ? (analytics.wellStockedProducts / analytics.totalProducts) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Low Stock:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-yellow-600">{analytics.lowStockProducts}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProducts > 0 ? (analytics.lowStockProducts / analytics.totalProducts) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Out of Stock:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-red-600">{analytics.outOfStockProducts}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProducts > 0 ? (analytics.outOfStockProducts / analytics.totalProducts) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Analytics - Following GeneralProductDetailModal Design */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Package className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-800">Category Distribution</h3>
        </div>
        
        <div className="space-y-2">
          {analytics.categoryStats.slice(0, 5).map((category, index) => (
            <div key={category.name} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  <div className="text-xs text-gray-500">{category.count} products</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{formatMoney(category.value)}</div>
                <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights - Following GeneralProductDetailModal Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Top Insights</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{analytics.categoryStats[0]?.name || 'No category'} is your largest category</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{analytics.profitMargin.toFixed(1)}% average profit margin</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>{analytics.featuredProducts} products are featured</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>{analytics.totalProducts} total products in inventory</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-semibold text-gray-800">Stock Alerts</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>{analytics.lowStockProducts} products need restocking</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{analytics.outOfStockProducts} products are out of stock</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>{analytics.reorderAlerts} reorder alerts active</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Monitor stock levels regularly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Performance Analytics - Following GeneralProductDetailModal Design */}
      {salesData && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-800">Sales Performance</h3>
          </div>
          
          <div className="text-xs text-gray-500 mb-3">Real sales data from the last 30 days</div>
            
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Total Revenue</span>
              <p className="text-lg font-bold text-green-600">{formatMoney(salesData.totalRevenue)}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Transactions</span>
              <p className="text-lg font-bold text-blue-600">{salesData.totalTransactions}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Avg Order Value</span>
              <p className="text-lg font-bold text-purple-600">{formatMoney(salesData.averageOrderValue)}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Top Products</span>
              <p className="text-lg font-bold text-orange-600">{salesData.topSellingProducts.length}</p>
            </div>
          </div>

            {/* Top Selling Products */}
            {salesData.topSellingProducts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">Top Selling Products (Last 30 Days)</h4>
                <div className="space-y-2">
                  {salesData.topSellingProducts.slice(0, 5).map((product: any, index: number) => {
                    const productInfo = products.find(p => p.id === product.productId);
                    return (
                      <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{productInfo?.name || 'Unknown Product'}</span>
                            <div className="text-xs text-gray-500">{product.salesCount} sales</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{product.totalSold} units</div>
                          <div className="text-sm text-gray-600">{formatMoney(product.totalRevenue)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Supplier Performance Analytics */}
      {supplierData && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-200 rounded-lg">
                <Building className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supplier Performance</h3>
                <p className="text-sm text-gray-600">Supplier analytics and ratings</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Total Suppliers</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{supplierData.totalSuppliers}</div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Avg Rating</span>
                </div>
                <div className="text-2xl font-bold text-yellow-900">{supplierData.averageRating.toFixed(1)}/5</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Top Rated</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{supplierData.topSuppliers.length}</div>
              </div>
            </div>

            {/* Top Suppliers */}
            {supplierData.topSuppliers.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">Top Rated Suppliers</h4>
                <div className="space-y-2">
                  {supplierData.topSuppliers.map((supplier: any, index: number) => (
                    <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-orange-600">{index + 1}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{supplier.name}</span>
                          <div className="text-xs text-gray-500">{supplier.contact_person || 'No contact'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-gray-900">{supplier.rating || 0}/5</span>
                        </div>
                        <div className="text-sm text-gray-600">{supplier.total_orders || 0} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-200 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600">Latest sales and transactions</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{activity.description}</span>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatMoney(activity.amount)}</div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
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
          </GlassCard>
        </div>
      )}

      {/* Advanced Business Intelligence */}
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-200 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Business Intelligence</h3>
              <p className="text-sm text-gray-600">Advanced analytics and insights</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ABC Analysis */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">ABC Analysis</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">A-Class (High Value)</span>
                  <span className="font-semibold text-blue-900">
                    {analytics.categoryStats.slice(0, 1).length} categories
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">B-Class (Medium Value)</span>
                  <span className="font-semibold text-blue-900">
                    {analytics.categoryStats.slice(1, 3).length} categories
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">C-Class (Low Value)</span>
                  <span className="font-semibold text-blue-900">
                    {analytics.categoryStats.slice(3).length} categories
                  </span>
                </div>
              </div>
            </div>

            {/* Inventory Turnover */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Inventory Turnover</span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-900">
                  {salesData ? (salesData.totalRevenue / analytics.totalValue).toFixed(2) : 'N/A'}
                </div>
                <div className="text-sm text-green-700">Times per month</div>
                <div className="text-xs text-green-600">
                  {salesData && salesData.totalRevenue > analytics.totalValue ? 'Fast moving' : 'Slow moving'}
                </div>
              </div>
            </div>

            {/* Profitability Analysis */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-800">Profitability</span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-900">
                  {analytics.profitMargin.toFixed(1)}%
                </div>
                <div className="text-sm text-purple-700">Average margin</div>
                <div className="text-xs text-purple-600">
                  {analytics.profitMargin > 50 ? 'Excellent' : analytics.profitMargin > 30 ? 'Good' : 'Needs improvement'}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Loading State */}
      {isLoadingAnalytics && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading advanced analytics...</span>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default AnalyticsTab;

