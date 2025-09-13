import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Minus, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  customerLoyaltyService, 
  LoyaltyCustomer, 
  PointTransaction 
} from '../../../../lib/customerLoyaltyService';
import { toast } from 'react-hot-toast';

interface PointsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: LoyaltyCustomer | null;
  onPointsUpdated?: () => void;
}

const PointsManagementModal: React.FC<PointsManagementModalProps> = ({ 
  isOpen, 
  onClose, 
  customer, 
  onPointsUpdated 
}) => {
  const [loading, setLoading] = useState(false);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([]);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [operationType, setOperationType] = useState<'add' | 'subtract'>('add');
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      loadPointHistory();
    }
  }, [isOpen, customer]);

  const loadPointHistory = async () => {
    if (!customer) return;
    
    try {
      setLoadingHistory(true);
      const history = await customerLoyaltyService.getPointHistory(customer.id);
      setPointHistory(history);
    } catch (error) {
      console.error('Error loading point history:', error);
      toast.error('Failed to load point history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddPoints = async () => {
    if (!customer || !pointsToAdd || !pointsReason) {
      toast.error('Please fill in all fields');
      return;
    }

    const points = parseInt(pointsToAdd);
    if (isNaN(points) || points <= 0) {
      toast.error('Please enter a valid number of points');
      return;
    }

    try {
      setLoading(true);
      const finalPoints = operationType === 'add' ? points : -points;
      
      await customerLoyaltyService.addPoints(customer.id, finalPoints, pointsReason);
      
      toast.success(`Points ${operationType === 'add' ? 'added' : 'subtracted'} successfully`);
      setPointsToAdd('');
      setPointsReason('');
      setOperationType('add');
      
      // Reload history and notify parent
      await loadPointHistory();
      onPointsUpdated?.();
    } catch (error) {
      console.error('Error adding points:', error);
      toast.error('Failed to update points');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'purchase') return <Star className="w-4 h-4 text-green-600" />;
    if (type === 'redemption') return <Minus className="w-4 h-4 text-red-600" />;
    if (type === 'manual') return <Plus className="w-4 h-4 text-blue-600" />;
    return <Clock className="w-4 h-4 text-gray-600" />;
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <GlassCard className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Points Management</h2>
                <p className="text-sm text-gray-600">{customer.name} - {customer.points} points</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add/Subtract Points */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Points</h3>
              
              <div className="space-y-4">
                {/* Operation Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operation Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOperationType('add')}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        operationType === 'add'
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Points
                    </button>
                    <button
                      onClick={() => setOperationType('subtract')}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        operationType === 'subtract'
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Minus className="w-4 h-4 inline mr-2" />
                      Subtract Points
                    </button>
                  </div>
                </div>

                {/* Points Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Amount
                  </label>
                  <input
                    type="number"
                    value={pointsToAdd}
                    onChange={(e) => setPointsToAdd(e.target.value)}
                    placeholder="Enter points amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                    placeholder="Enter reason for points adjustment"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <GlassButton
                  onClick={handleAddPoints}
                  disabled={loading || !pointsToAdd || !pointsReason}
                  className="w-full py-3"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {operationType === 'add' ? 'Add Points' : 'Subtract Points'}
                </GlassButton>
              </div>
            </div>

            {/* Points History */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Points History</h3>
                <button
                  onClick={loadPointHistory}
                  disabled={loadingHistory}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading history...</span>
                </div>
              ) : pointHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No point history available</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-3">
                  {pointHistory.map((transaction, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.reason}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.timestamp)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-sm font-semibold ${getTransactionColor(transaction.amount)}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Customer Info Summary */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Current Points</p>
                <p className="text-xl font-bold text-blue-600">{customer.points}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Loyalty Tier</p>
                <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
                  customer.tier === 'VIP' ? 'bg-purple-100 text-purple-800' :
                  customer.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                  customer.tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {customer.tier}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-xl font-bold text-gray-900">{pointHistory.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
                  customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {customer.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default PointsManagementModal;
