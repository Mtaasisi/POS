import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, TrendingDown, ExternalLink, ShoppingCart } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { dashboardService, InventoryAlert } from '../../../../services/dashboardService';
import { useAuth } from '../../../../context/AuthContext';

interface InventoryWidgetProps {
  className?: string;
}

export const InventoryWidget: React.FC<InventoryWidgetProps> = ({ className }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [stats, setStats] = useState({
    lowStock: 0,
    critical: 0,
    total: 0,
    value: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setIsLoading(true);
      const [inventoryAlerts, dashboardStats] = await Promise.all([
        dashboardService.getInventoryAlerts(4),
        dashboardService.getDashboardStats(currentUser?.id || '')
      ]);
      
      setAlerts(inventoryAlerts);
      setStats({
        lowStock: dashboardStats.lowStockItems,
        critical: dashboardStats.criticalStockAlerts,
        total: dashboardStats.totalProducts,
        value: dashboardStats.inventoryValue
      });
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertColor = (alertLevel: string) => {
    switch (alertLevel) {
      case 'out-of-stock': return 'text-red-600 bg-red-100 border-red-200';
      case 'critical': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getAlertIcon = (alertLevel: string) => {
    switch (alertLevel) {
      case 'out-of-stock': return <AlertTriangle size={12} className="text-red-600" />;
      case 'critical': return <TrendingDown size={12} className="text-orange-600" />;
      default: return <Package size={12} className="text-yellow-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg">
            <Package className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Inventory Status</h3>
            <p className="text-sm text-gray-600">
              {stats.total} products • {formatCurrency(stats.value)} value
            </p>
          </div>
        </div>
        
        {(stats.lowStock > 0 || stats.critical > 0) && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <AlertTriangle size={12} />
            {stats.lowStock + stats.critical}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <p className="text-lg font-bold text-red-700">{stats.critical}</p>
          <p className="text-xs text-red-600">Critical</p>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <p className="text-lg font-bold text-orange-700">{stats.lowStock}</p>
          <p className="text-xs text-orange-600">Low Stock</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-700">{formatLargeNumber(stats.value)}</p>
          <p className="text-xs text-green-600">Value</p>
        </div>
      </div>

      {/* Inventory Alerts */}
      <div className="space-y-2 h-48 overflow-y-auto">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className={`p-3 bg-white rounded-lg border ${getAlertColor(alert.alertLevel)}`}>
              <div className="flex items-center gap-2">
                {getAlertIcon(alert.alertLevel)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {alert.productName}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600">
                      {alert.category}
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {alert.currentStock}/{alert.minimumStock} units
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <Package className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">All stock levels normal</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <GlassButton
          onClick={() => navigate('/lats/unified-inventory')}
          variant="ghost"
          size="sm"
          className="flex-1"
          icon={<ExternalLink size={14} />}
        >
          Manage Stock
        </GlassButton>
        <GlassButton
          onClick={() => navigate('/lats/purchase-orders')}
          variant="ghost"
          size="sm"
          icon={<ShoppingCart size={14} />}
        >
          Reorder
        </GlassButton>
      </div>
    </GlassCard>
  );
};
