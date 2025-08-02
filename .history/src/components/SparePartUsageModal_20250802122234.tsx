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
  Hash,
  Zap,
  Target,
  DollarSign,
  Tag,
  Building
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

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100', icon: <AlertTriangle className="w-4 h-4" /> };
    if (quantity <= minLevel) return { status: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <AlertTriangle className="w-4 h-4" /> };
    return { status: 'In Stock', color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircle className="w-4 h-4" /> };
  };

  if (!isOpen || !sparePart) return null;

  const stockStatus = getStockStatus(sparePart.stock_quantity, sparePart.min_stock_level);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <GlassCard className="w-full max-w-5xl max-h-[95vh] overflow-hidden bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Record Part Usage</h2>
              <p className="text-gray-600 flex items-center gap-2">
                <span className="font-medium text-blue-600">{sparePart.name}</span>
                <span className="text-gray-400">•</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                  {stockStatus.status}
                </span>
              </p>
            </div>
          </div>
          <GlassButton
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </GlassButton>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Form Section */}
            <div className="xl:col-span-2 space-y-6">
              {/* Usage Form */}
              <GlassCard className="p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 border border-blue-200/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Record Usage</h3>
                    <p className="text-gray-600">Track part consumption and update inventory</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Quantity Input */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-medium"
                        placeholder="Enter quantity"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-sm text-gray-500">
                        <span>of</span>
                        <span className="font-bold text-blue-600">{sparePart.stock_quantity}</span>
                        <span>available</span>
                      </div>
                    </div>
                  </div>

                  {/* Device Information */}
                  {deviceInfo && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-semibold text-blue-800">Device Information</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">
                            <span className="font-medium">{deviceInfo.brand} {deviceInfo.model}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">
                            <span className="font-medium">{deviceInfo.customer_name}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                      placeholder="Additional notes about the usage..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 pt-4">
                    <GlassButton
                      type="submit"
                      disabled={loading || formData.quantity_used > sparePart.stock_quantity}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Recording...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="w-5 h-5" />
                          <span>Record Usage</span>
                        </div>
                      )}
                    </GlassButton>
                    
                    <GlassButton
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
                    >
                      Cancel
                    </GlassButton>
                  </div>
                </form>
              </GlassCard>

              {/* Usage History */}
              <GlassCard className="p-6 bg-gradient-to-br from-orange-50/50 to-red-50/50 border border-orange-200/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Usage History</h3>
                    <p className="text-gray-600">Recent usage records and patterns</p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-600 border-t-transparent"></div>
                  </div>
                ) : usageHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No usage history yet</p>
                    <p className="text-sm text-gray-500 mt-1">Usage records will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {usageHistory.map((usage) => (
                      <div
                        key={usage.id}
                        className="p-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Hash className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-bold text-lg text-gray-900">
                                {usage.quantity_used}
                              </span>
                              <span className="text-gray-600 ml-1">units used</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(usage.used_at)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{usage.used_by}</span>
                          </div>
                          
                          {usage.device && (
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              <span className="font-medium">{usage.device.brand} {usage.device.model}</span>
                            </div>
                          )}
                        </div>
                        
                        {usage.notes && (
                          <div className="p-3 bg-gray-50/80 rounded-lg border-l-4 border-blue-500">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">Notes</span>
                            </div>
                            <p className="text-gray-700 text-sm">{usage.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Part Information Sidebar */}
            <div className="space-y-6">
              <GlassCard className="p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-purple-200/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Part Details</h3>
                    <p className="text-gray-600">Current information</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                    <div className="flex items-center gap-3 mb-3">
                      <Tag className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-gray-900">Basic Info</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Name:</span>
                        <span className="font-semibold text-gray-900">{sparePart.name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Category:</span>
                        <span className="font-semibold text-gray-900 capitalize">{sparePart.category}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Brand:</span>
                        <span className="font-semibold text-gray-900">{sparePart.brand || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                    <div className="flex items-center gap-3 mb-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-900">Pricing</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Unit Price:</span>
                        <span className="font-bold text-green-600 text-lg">${sparePart.price.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Value:</span>
                        <span className="font-bold text-gray-900">${(sparePart.price * sparePart.stock_quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">Stock Status</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Stock:</span>
                        <span className="font-bold text-gray-900 text-lg">{sparePart.stock_quantity}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Min Level:</span>
                        <span className="font-semibold text-gray-900">{sparePart.min_stock_level}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <div className="flex items-center gap-2">
                          {stockStatus.icon}
                          <span className={`font-semibold ${stockStatus.color}`}>{stockStatus.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SparePartUsageModal; 