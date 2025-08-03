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
  Building,
  Activity,
  Shield,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  RotateCcw
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
    if (quantity === 0) return { 
      status: 'Out of Stock', 
      color: 'text-red-600', 
      bg: 'bg-red-100', 
      icon: <AlertTriangle className="w-4 h-4" />,
      gradient: 'from-red-500 to-red-600'
    };
    if (quantity <= minLevel) return { 
      status: 'Low Stock', 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-100', 
      icon: <AlertTriangle className="w-4 h-4" />,
      gradient: 'from-yellow-500 to-orange-600'
    };
    return { 
      status: 'In Stock', 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      icon: <CheckCircle className="w-4 h-4" />,
      gradient: 'from-green-500 to-emerald-600'
    };
  };

  const adjustQuantity = (increment: boolean) => {
    const newQuantity = increment 
      ? Math.min(formData.quantity_used + 1, sparePart?.stock_quantity || 1)
      : Math.max(formData.quantity_used - 1, 1);
    setFormData(prev => ({ ...prev, quantity_used: newQuantity }));
  };

  if (!isOpen || !sparePart) return null;

  const stockStatus = getStockStatus(sparePart.stock_quantity, sparePart.min_stock_level);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <GlassCard className="h-full bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl">
          {/* Floating Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                  <Package className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Record Part Usage</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-blue-100 font-medium">{sparePart.name}</span>
                    <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/30 ${stockStatus.color.replace('text-', 'text-')}`}>
                      {stockStatus.status}
                    </div>
                  </div>
                </div>
              </div>
              <GlassButton
                variant="outline"
                onClick={onClose}
                className="p-3 hover:bg-white/20 rounded-xl border-white/30 text-white hover:text-white transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </GlassButton>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Main Content */}
              <div className="xl:col-span-8 space-y-6">
                {/* Quick Usage Form */}
                <GlassCard className="p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200/50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Quick Usage</h3>
                      <p className="text-gray-600">Record part consumption instantly</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Quantity Selector */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-4">
                        Quantity to Use
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white rounded-2xl border-2 border-gray-200 p-2">
                          <button
                            type="button"
                            onClick={() => adjustQuantity(false)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            disabled={formData.quantity_used <= 1}
                          >
                            <Minus className="w-5 h-5 text-gray-600" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={sparePart.stock_quantity}
                            value={formData.quantity_used}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              quantity_used: parseInt(e.target.value) || 1 
                            }))}
                            className="w-20 text-center text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => adjustQuantity(true)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            disabled={formData.quantity_used >= sparePart.stock_quantity}
                          >
                            <Plus className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>of</span>
                          <span className="font-bold text-blue-600 text-lg">{sparePart.stock_quantity}</span>
                          <span>available</span>
                        </div>
                      </div>
                    </div>

                    {/* Device Info Card */}
                    {deviceInfo && (
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50 rounded-2xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-indigo-100 rounded-xl">
                            <Building className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className="font-semibold text-indigo-800">Device Information</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl">
                            <Package className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Device</p>
                              <p className="font-semibold text-gray-900">{deviceInfo.brand} {deviceInfo.model}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl">
                            <User className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Customer</p>
                              <p className="font-semibold text-gray-900">{deviceInfo.customer_name}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                        placeholder="Add any additional notes about this usage..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 pt-4">
                      <GlassButton
                        type="submit"
                        disabled={loading || formData.quantity_used > sparePart.stock_quantity}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Recording...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Record Usage</span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </GlassButton>
                      
                      <GlassButton
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="px-6 py-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
                      >
                        Cancel
                      </GlassButton>
                    </div>
                  </form>
                </GlassCard>

                {/* Usage History */}
                <GlassCard className="p-6 bg-gradient-to-br from-orange-50/80 to-red-50/80 border border-orange-200/50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Usage History</h3>
                      <p className="text-gray-600">Recent consumption patterns</p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-600 border-t-transparent"></div>
                    </div>
                  ) : usageHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-6 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-semibold text-lg">No usage history yet</p>
                      <p className="text-sm text-gray-500 mt-2">Usage records will appear here once you start recording</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {usageHistory.map((usage, index) => (
                        <div
                          key={usage.id}
                          className="p-4 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                <Hash className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-2xl text-gray-900">
                                    {usage.quantity_used}
                                  </span>
                                  <span className="text-gray-600">units used</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatDate(usage.used_at)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs text-gray-500">#{index + 1}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
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
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-500">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-800">Notes</span>
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

              {/* Sidebar */}
              <div className="xl:col-span-4 space-y-6">
                {/* Part Overview */}
                <GlassCard className="p-6 bg-gradient-to-br from-purple-50/80 to-pink-50/80 border border-purple-200/50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Part Overview</h3>
                      <p className="text-gray-600">Current status & details</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50">
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

                    {/* Pricing */}
                    <div className="p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                      <div className="flex items-center gap-3 mb-3">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-gray-900">Pricing</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Unit Price:</span>
                          <span className="font-bold text-green-600 text-xl">${sparePart.price.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Value:</span>
                          <span className="font-bold text-gray-900">${(sparePart.price * sparePart.stock_quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className="p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                      <div className="flex items-center gap-3 mb-3">
                        <Target className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">Stock Status</span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Current Stock:</span>
                          <span className="font-bold text-gray-900 text-xl">{sparePart.stock_quantity}</span>
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

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>Stock Level</span>
                            <span>{Math.round((sparePart.stock_quantity / sparePart.min_stock_level) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`bg-gradient-to-r ${stockStatus.gradient} h-3 rounded-full transition-all duration-300`}
                              style={{ width: `${Math.min((sparePart.stock_quantity / sparePart.min_stock_level) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Quick Actions */}
                <GlassCard className="p-6 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-200/50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                      <p className="text-gray-600">Common operations</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <GlassButton
                      variant="outline"
                      className="w-full justify-start p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-300 transition-all duration-200"
                    >
                      <Activity className="w-5 h-5 mr-3 text-emerald-600" />
                      View Analytics
                    </GlassButton>
                    
                    <GlassButton
                      variant="outline"
                      className="w-full justify-start p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-300 transition-all duration-200"
                    >
                      <Shield className="w-5 h-5 mr-3 text-emerald-600" />
                      Set Alerts
                    </GlassButton>
                    
                    <GlassButton
                      variant="outline"
                      className="w-full justify-start p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-300 transition-all duration-200"
                    >
                      <RotateCcw className="w-5 h-5 mr-3 text-emerald-600" />
                      Restock History
                    </GlassButton>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default SparePartUsageModal; 