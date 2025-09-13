import React from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import { 
  Package, BarChart3, TrendingUp, TrendingDown, DollarSign, 
  AlertTriangle, CheckCircle, XCircle, Star, Users, Crown,
  Download, Database, Save
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';

interface AnalyticsTabProps {
  products: any[];
  metrics: any;
  categories: any[];
  formatMoney: (amount: number) => string;
  liveMetrics?: any;
  isLoadingLiveMetrics?: boolean;
  onRefreshLiveMetrics?: () => void;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  products,
  metrics,
  categories,
  formatMoney,
  liveMetrics,
  isLoadingLiveMetrics,
  onRefreshLiveMetrics
}) => {
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [backupProgress, setBackupProgress] = React.useState(0);
  const [backupStatus, setBackupStatus] = React.useState('');

  // Calculate additional analytics
  const analytics = React.useMemo(() => {
    const totalProducts = products?.length || 0;
    const activeProducts = products?.filter(p => p.isActive).length || 0;
    const inactiveProducts = totalProducts - activeProducts;
    const featuredProducts = products?.filter(p => p.isFeatured).length || 0;
    
    // Stock analytics
    const lowStockProducts = products?.filter(p => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      return totalStock > 0 && totalStock <= 10;
    }).length || 0;
    
    const outOfStockProducts = products?.filter(p => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      return totalStock <= 0;
    }).length || 0;
    
    const wellStockedProducts = totalProducts - lowStockProducts - outOfStockProducts;
    
    // Reorder alerts (products below minimum stock level)
    const reorderAlerts = products?.filter(p => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      const minStock = p.variants?.[0]?.minQuantity || p.minStockLevel || 0;
      return totalStock <= minStock;
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
        const sellingPrice = variant.sellingPrice || 0;
        const quantity = variant.quantity || 0;
        return variantSum + (sellingPrice * quantity);
      }, 0) || 0;
      return sum + productRetailValue;
    }, 0) || 0;
    
    const potentialProfit = retailValue - totalValue;
    const profitMargin = retailValue > 0 ? (potentialProfit / retailValue) * 100 : 0;
    
    // Category analytics
    const categoryStats = categories?.map(category => {
      const categoryProducts = products?.filter(p => p.categoryId === category.id) || [];
      const categoryValue = categoryProducts.reduce((sum, product) => {
        const mainVariant = product.variants?.[0];
        const totalStock = product.variants?.reduce((stockSum: number, variant: any) => stockSum + (variant.quantity || 0), 0) || 0;
        return sum + ((mainVariant?.sellingPrice || 0) * totalStock);
      }, 0);
      
      return {
        name: category.name,
        count: categoryProducts.length,
        value: categoryValue,
        percentage: totalProducts > 0 ? (categoryProducts.length / totalProducts) * 100 : 0
      };
    }).sort((a: any, b: any) => b.count - a.count) || [];
    
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
        'whatsapp_campaigns',
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
      {/* Database Backup Section */}
      <GlassCard className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-200 rounded-lg">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">Database Backup</h3>
              <p className="text-sm text-indigo-700">Create a complete backup of all your data</p>
            </div>
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
      </GlassCard>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-900">{analytics.totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-50/20 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {analytics.activeProducts} active, {analytics.inactiveProducts} inactive
            </span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Stock Status</p>
              <p className="text-2xl font-bold text-green-900">{analytics.wellStockedProducts}</p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {analytics.lowStockProducts} low, {analytics.outOfStockProducts} out
            </span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Retail Value</p>
              <p className="text-2xl font-bold text-purple-900">{formatMoney(analytics.retailValue)}</p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {analytics.profitMargin.toFixed(1)}% profit margin
            </span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Featured Products</p>
              <p className="text-2xl font-bold text-amber-900">{analytics.featuredProducts}</p>
            </div>
            <div className="p-3 bg-amber-50/20 rounded-full">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {analytics.totalProducts > 0 ? ((analytics.featuredProducts / analytics.totalProducts) * 100).toFixed(1) : 0}% of total
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Financial Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Overview</h3>
            {liveMetrics && (
              <div className="flex items-center gap-2">
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
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Cost Value:</span>
              <span className="font-semibold">{formatMoney(analytics.totalValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Retail Value:</span>
              <span className="font-semibold">{formatMoney(analytics.retailValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Potential Profit:</span>
              <span className={`font-semibold ${analytics.potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(analytics.potentialProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Profit Margin:</span>
              <span className={`font-semibold ${analytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Distribution</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Well Stocked:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-600">{analytics.wellStockedProducts}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProducts > 0 ? (analytics.wellStockedProducts / analytics.totalProducts) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Low Stock:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-yellow-600">{analytics.lowStockProducts}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProducts > 0 ? (analytics.lowStockProducts / analytics.totalProducts) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Out of Stock:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-red-600">{analytics.outOfStockProducts}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProducts > 0 ? (analytics.outOfStockProducts / analytics.totalProducts) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Category Analytics */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
        <div className="space-y-3">
          {analytics.categoryStats.slice(0, 5).map((category, index) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">{category.name}</span>
                  <div className="text-sm text-gray-500">{category.count} products</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatMoney(category.value)}</div>
                <div className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900">Top Insights</h3>
          </div>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• {analytics.categoryStats[0]?.name || 'No category'} is your largest category</li>
            <li>• {analytics.profitMargin.toFixed(1)}% average profit margin</li>
            <li>• {analytics.featuredProducts} products are featured</li>
            <li>• {analytics.totalProducts} total products in inventory</li>
          </ul>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-orange-900">Stock Alerts</h3>
          </div>
          <ul className="space-y-2 text-sm text-orange-800">
            <li>• {analytics.lowStockProducts} products need restocking</li>
            <li>• {analytics.outOfStockProducts} products are out of stock</li>
            <li>• {analytics.reorderAlerts} reorder alerts active</li>
            <li>• Monitor stock levels regularly</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
};

export default AnalyticsTab;
