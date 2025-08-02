import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  recordSparePartUsage, 
  getSparePartUsage,
  updateSparePartStock,
  SparePart,
  SparePartUsage
} from '../lib/inventoryApi';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { 
  X, 
  Save, 
  Package, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  User,
  FileText,
  TrendingDown,
  BarChart3,
  Calendar,
  Hash
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SparePartUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePart | null;
  deviceId?: string;
  deviceInfo?: {
    brand: string;
    model: string;
    customer_name: string;
  };
}

const SparePartUsageModal: React.FC<SparePartUsageModalProps> = ({
  isOpen,
  onClose,
  sparePart,
  deviceId,
  deviceInfo
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usageHistory, setUsageHistory] = useState<SparePartUsage[]>([]);
  const [formData, setFormData] = useState({
    quantity_used: 1,
    notes: '',
    device_id: deviceId || ''
  });

  useEffect(() => {
    if (isOpen && sparePart) {
      loadUsageHistory();
    }
  }, [isOpen, sparePart]);

  const loadUsageHistory = async () => {
    if (!sparePart) return;
    
    setLoading(true);
    try {
      const history = await getSparePartUsage(sparePart.id);
      setUsageHistory(history);
    } catch (error) {
      console.error('Error loading usage history:', error);
      toast.error('Failed to load usage history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sparePart || !currentUser) return;

    if (formData.quantity_used > sparePart.stock_quantity) {
      toast.error('Cannot use more parts than available in stock');
      return;
    }

    setLoading(true);
    try {
      // Record the usage
      await recordSparePartUsage({
        spare_part_id: sparePart.id,
        device_id: formData.device_id || null,
        quantity_used: formData.quantity_used,
        used_by: currentUser.name || currentUser.username,
        notes: formData.notes
      });

      // Update stock quantity
      await updateSparePartStock(sparePart.id, formData.quantity_used, 'subtract');

      toast.success('Part usage recorded successfully');
      onClose();
    } catch (error) {
      console.error('Error recording usage:', error);
      toast.error('Failed to record usage');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !sparePart) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Record Part Usage
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Track usage of {sparePart.name}
                </p>
              </div>
            </div>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </GlassButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Form */}
            <div className="space-y-6">
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Record Usage</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Track part consumption</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity Used *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={sparePart.stock_quantity}
                        value={formData.quantity_used}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          quantity_used: parseInt(e.target.value) || 1 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">
                        / {sparePart.stock_quantity} available
                      </span>
                    </div>
                  </div>

                  {deviceInfo && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-blue-800 dark:text-blue-200">Device Information</span>
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p><strong>Device:</strong> {deviceInfo.brand} {deviceInfo.model}</p>
                        <p><strong>Customer:</strong> {deviceInfo.customer_name}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional notes about the usage..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <GlassButton
                      type="submit"
                      disabled={loading || formData.quantity_used > sparePart.stock_quantity}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {loading ? 'Recording...' : 'Record Usage'}
                    </GlassButton>
                    
                    <GlassButton
                      type="button"
                      variant="outline"
                      onClick={onClose}
                    >
                      Cancel
                    </GlassButton>
                  </div>
                </form>
              </GlassCard>

              {/* Part Information */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Part Details</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current information</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{sparePart.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{sparePart.category}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Brand:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{sparePart.brand || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                    <span className="font-medium text-gray-900 dark:text-white">${sparePart.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Stock:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {sparePart.stock_quantity}
                      </span>
                      {sparePart.stock_quantity === 0 ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : sparePart.stock_quantity <= sparePart.min_stock_level ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Usage History */}
            <div className="space-y-6">
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Usage History</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Recent usage records</p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : usageHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No usage history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {usageHistory.map((usage) => (
                      <div
                        key={usage.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {usage.quantity_used} used
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(usage.used_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{usage.used_by}</span>
                          </div>
                          
                          {usage.device && (
                            <div className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              <span>{usage.device.brand} {usage.device.model}</span>
                            </div>
                          )}
                        </div>
                        
                        {usage.notes && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                            <div className="flex items-center gap-1 mb-1">
                              <FileText className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">Notes:</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{usage.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SparePartUsageModal; 