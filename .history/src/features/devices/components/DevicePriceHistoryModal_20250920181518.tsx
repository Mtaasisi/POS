import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, TrendingUp, TrendingDown, Minus, Clock, User, 
  DollarSign, Percent, Calendar, Filter, Download, 
  RefreshCw, AlertCircle, Info, BarChart3, History
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';

interface PriceHistoryEntry {
  id: string;
  device_id: string;
  old_price: number;
  new_price: number;
  price_change: number;
  change_percentage: number;
  reason: string;
  change_type: 'manual' | 'bulk_update' | 'supplier_change' | 'market_adjustment' | 'promotion' | 'cost_update';
  source: 'system' | 'admin' | 'api' | 'import';
  metadata: any;
  updated_by: string;
  updated_at: string;
  created_at: string;
  user_name?: string;
}

interface DevicePriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  deviceName: string;
  currentPrice: number;
}

const DevicePriceHistoryModal: React.FC<DevicePriceHistoryModalProps> = ({
  isOpen,
  onClose,
  deviceId,
  deviceName,
  currentPrice
}) => {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState({
    changeType: '',
    dateRange: '30', // days
    source: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'change' | 'percentage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load price history
  const loadPriceHistory = async () => {
    if (!deviceId) return;
    
    setIsLoading(true);
    try {
      // This would be replaced with actual API call
      const mockData: PriceHistoryEntry[] = [
        {
          id: '1',
          device_id: deviceId,
          old_price: 45000,
          new_price: 50000,
          price_change: 5000,
          change_percentage: 11.11,
          reason: 'Market price adjustment',
          change_type: 'market_adjustment',
          source: 'admin',
          metadata: { device_name: deviceName },
          updated_by: 'user1',
          updated_at: '2024-01-30T10:30:00Z',
          created_at: '2024-01-30T10:30:00Z',
          user_name: 'Admin User'
        },
        {
          id: '2',
          device_id: deviceId,
          old_price: 40000,
          new_price: 45000,
          price_change: 5000,
          change_percentage: 12.5,
          reason: 'Supplier cost increase',
          change_type: 'supplier_change',
          source: 'system',
          metadata: { device_name: deviceName },
          updated_by: 'user2',
          updated_at: '2024-01-25T14:15:00Z',
          created_at: '2024-01-25T14:15:00Z',
          user_name: 'System Import'
        },
        {
          id: '3',
          device_id: deviceId,
          old_price: 45000,
          new_price: 40000,
          price_change: -5000,
          change_percentage: -11.11,
          reason: 'Promotional discount',
          change_type: 'promotion',
          source: 'admin',
          metadata: { device_name: deviceName, promotion_id: 'PROMO_001' },
          updated_by: 'user1',
          updated_at: '2024-01-20T09:45:00Z',
          created_at: '2024-01-20T09:45:00Z',
          user_name: 'Admin User'
        }
      ];
      
      setPriceHistory(mockData);
    } catch (error) {
      console.error('Error loading price history:', error);
      toast.error('Failed to load price history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPriceHistory();
    }
  }, [isOpen, deviceId]);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-600 bg-red-50 border-red-200';
    if (change < 0) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getChangeTypeColor = (type: string) => {
    const colors = {
      manual: 'bg-blue-100 text-blue-700',
      bulk_update: 'bg-purple-100 text-purple-700',
      supplier_change: 'bg-orange-100 text-orange-700',
      market_adjustment: 'bg-yellow-100 text-yellow-700',
      promotion: 'bg-green-100 text-green-700',
      cost_update: 'bg-red-100 text-red-700'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `TZS ${price.toLocaleString()}`;
  };

  const filteredHistory = priceHistory
    .filter(entry => {
      if (filter.changeType && entry.change_type !== filter.changeType) return false;
      if (filter.source && entry.source !== filter.source) return false;
      
      // Date range filter
      const entryDate = new Date(entry.created_at);
      const daysAgo = parseInt(filter.dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      
      return entryDate >= cutoffDate;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'change':
          comparison = a.price_change - b.price_change;
          break;
        case 'percentage':
          comparison = a.change_percentage - b.change_percentage;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const exportHistory = () => {
    const csvContent = [
      ['Date', 'Old Price', 'New Price', 'Change', 'Percentage', 'Reason', 'Type', 'Source', 'Updated By'],
      ...filteredHistory.map(entry => [
        formatDate(entry.created_at),
        formatPrice(entry.old_price),
        formatPrice(entry.new_price),
        formatPrice(entry.price_change),
        `${entry.change_percentage}%`,
        entry.reason,
        entry.change_type,
        entry.source,
        entry.user_name || 'Unknown'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device-price-history-${deviceName.replace(/\s+/g, '-')}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Price history exported successfully');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Price History</h2>
              <p className="text-sm text-gray-600">
                {deviceName} • Current Price: <span className="font-semibold text-blue-600">{formatPrice(currentPrice)}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={filter.changeType}
              onChange={(e) => setFilter(prev => ({ ...prev, changeType: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="manual">Manual</option>
              <option value="bulk_update">Bulk Update</option>
              <option value="supplier_change">Supplier Change</option>
              <option value="market_adjustment">Market Adjustment</option>
              <option value="promotion">Promotion</option>
              <option value="cost_update">Cost Update</option>
            </select>

            <select
              value={filter.dateRange}
              onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>

            <select
              value={filter.source}
              onChange={(e) => setFilter(prev => ({ ...prev, source: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Sources</option>
              <option value="system">System</option>
              <option value="admin">Admin</option>
              <option value="api">API</option>
              <option value="import">Import</option>
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="change">Price Change</option>
                <option value="percentage">Percentage</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            <GlassButton
              onClick={loadPriceHistory}
              variant="secondary"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </GlassButton>

            <GlassButton
              onClick={exportHistory}
              variant="secondary"
              size="sm"
            >
              <Download className="w-4 h-4" />
              Export
            </GlassButton>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading price history...</p>
              </div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Price History</h3>
              <p className="text-gray-600">No price changes found for the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((entry, index) => (
                <GlassCard key={entry.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getChangeColor(entry.price_change)}`}>
                        {getChangeIcon(entry.price_change)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-gray-900">
                            {formatPrice(entry.old_price)} → {formatPrice(entry.new_price)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChangeColor(entry.price_change)}`}>
                            {entry.price_change > 0 ? '+' : ''}{formatPrice(entry.price_change)} ({entry.change_percentage > 0 ? '+' : ''}{entry.change_percentage}%)
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{entry.reason}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(entry.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {entry.user_name || 'Unknown User'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(entry.change_type)}`}>
                        {entry.change_type.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {entry.source}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredHistory.length} of {priceHistory.length} price changes
            </div>
            <GlassButton
              onClick={onClose}
              variant="secondary"
            >
              Close
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicePriceHistoryModal;
