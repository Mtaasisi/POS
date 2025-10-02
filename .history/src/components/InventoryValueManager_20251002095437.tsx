import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface InventoryStatus {
  total_products: number;
  synced_products: number;
  products_needing_sync: number;
  total_discrepancy_value: number;
}

interface ProductDiscrepancy {
  id: string;
  name: string;
  sku: string;
  stored_value: number;
  calculated_value: number;
  discrepancy: number;
  sync_status: string;
  variant_count: number;
  total_quantity: number;
  updated_at: string;
}

const InventoryValueManager: React.FC = () => {
  const [status, setStatus] = useState<InventoryStatus | null>(null);
  const [discrepancies, setDiscrepancies] = useState<ProductDiscrepancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const loadInventoryStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get inventory monitoring data
      const { data: monitoringData, error: monitoringError } = await supabase
        .from('simple_inventory_monitoring')
        .select('*')
        .order('discrepancy', { ascending: false });

      if (monitoringError) throw monitoringError;

      // Calculate status
      const totalProducts = monitoringData?.length || 0;
      const syncedProducts = monitoringData?.filter(p => p.sync_status === 'SYNCED').length || 0;
      const productsNeedingSync = monitoringData?.filter(p => p.sync_status === 'NEEDS_SYNC').length || 0;
      const totalDiscrepancy = monitoringData?.reduce((sum, p) => sum + p.discrepancy, 0) || 0;

      setStatus({
        total_products: totalProducts,
        synced_products: syncedProducts,
        products_needing_sync: productsNeedingSync,
        total_discrepancy_value: totalDiscrepancy
      });

      setDiscrepancies(monitoringData || []);

    } catch (err) {
      console.error('Error loading inventory status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory status');
    } finally {
      setLoading(false);
    }
  };

  const runMaintenanceAudit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Run the simple sync function
      const { data: syncResult, error: syncError } = await supabase
        .rpc('simple_sync_product_values');

      if (syncError) throw syncError;

      console.log('Sync completed:', syncResult);
      setLastSync(new Date().toISOString());

      // Reload status after audit
      await loadInventoryStatus();

    } catch (err) {
      console.error('Error running maintenance audit:', err);
      setError(err instanceof Error ? err.message : 'Failed to run maintenance audit');
    } finally {
      setLoading(false);
    }
  };

  const syncAllProductValues = async () => {
    try {
      setLoading(true);
      setError(null);

      // Run the sync function
      const { data: syncResult, error: syncError } = await supabase
        .rpc('sync_all_product_values');

      if (syncError) throw syncError;

      console.log('Product values synced:', syncResult);
      setLastSync(new Date().toISOString());

      // Reload status after sync
      await loadInventoryStatus();

    } catch (err) {
      console.error('Error syncing product values:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync product values');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryStatus();
  }, []);

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔧 Inventory Value Manager</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">❌</div>
              <div>
                <h3 className="text-red-800 font-semibold">Error</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Cards */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{status.total_products}</div>
              <div className="text-sm text-blue-800">Total Products</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{status.synced_products}</div>
              <div className="text-sm text-green-800">Synced Products</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{status.products_needing_sync}</div>
              <div className="text-sm text-yellow-800">Need Sync</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(status.total_discrepancy_value)}</div>
              <div className="text-sm text-red-800">Total Discrepancy</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={runMaintenanceAudit}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Running...' : '🔍 Run Maintenance Audit'}
          </button>
          
          <button
            onClick={syncAllProductValues}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Syncing...' : '🔄 Sync All Values'}
          </button>
          
          <button
            onClick={loadInventoryStatus}
            disabled={loading}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔄 Refresh Status
          </button>
        </div>

        {lastSync && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600">
              Last sync: {new Date(lastSync).toLocaleString()}
            </div>
          </div>
        )}

        {/* Products with Discrepancies */}
        {discrepancies.filter(p => p.sync_status === 'NEEDS_SYNC').length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">
              ⚠️ Products Needing Sync ({discrepancies.filter(p => p.sync_status === 'NEEDS_SYNC').length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stored Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculated Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discrepancy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {discrepancies
                    .filter(p => p.sync_status === 'NEEDS_SYNC')
                    .slice(0, 10)
                    .map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(product.stored_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(product.calculated_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                        {formatCurrency(product.discrepancy)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.variant_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.total_quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">🔧 System Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <div className="font-semibold">✅ Auto-Sync Triggers</div>
              <div>Product values automatically update when variants change</div>
            </div>
            <div>
              <div className="font-semibold">✅ Data Validation</div>
              <div>Prevents unrealistic prices and quantities</div>
            </div>
            <div>
              <div className="font-semibold">✅ Maintenance Audit</div>
              <div>Automatically finds and fixes discrepancies</div>
            </div>
            <div>
              <div className="font-semibold">✅ Real-time Monitoring</div>
              <div>Track sync status and discrepancies</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryValueManager;
