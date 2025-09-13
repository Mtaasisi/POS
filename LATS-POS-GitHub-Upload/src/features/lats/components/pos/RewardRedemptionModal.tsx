import React, { useState, useEffect } from 'react';
import { X, Gift, Star, CheckCircle, AlertCircle, RefreshCw, Clock, Award } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  customerLoyaltyService, 
  LoyaltyCustomer, 
  LoyaltyReward 
} from '../../../../lib/customerLoyaltyService';
import { toast } from 'react-hot-toast';

interface RewardRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: LoyaltyCustomer | null;
  onRedemptionComplete?: () => void;
}

const RewardRedemptionModal: React.FC<RewardRedemptionModalProps> = ({ 
  isOpen, 
  onClose, 
  customer, 
  onRedemptionComplete 
}) => {
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [redemptionHistory, setRedemptionHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadRewards();
      loadRedemptionHistory();
    }
  }, [isOpen]);

  const loadRewards = async () => {
    try {
      setLoadingRewards(true);
      const rewardsData = await customerLoyaltyService.getRewards();
      setRewards(rewardsData);
    } catch (error) {
      console.error('Error loading rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoadingRewards(false);
    }
  };

  const loadRedemptionHistory = async () => {
    if (!customer) return;
    
    try {
      const history = await customerLoyaltyService.getRedemptionHistory(customer.id);
      setRedemptionHistory(history);
    } catch (error) {
      console.error('Error loading redemption history:', error);
    }
  };

  const handleRedemption = async () => {
    if (!customer || !selectedReward) {
      toast.error('Please select a reward to redeem');
      return;
    }

    if (customer.points < selectedReward.pointsRequired) {
      toast.error('Insufficient points for this reward');
      return;
    }

    try {
      setRedemptionLoading(true);
      
      await customerLoyaltyService.redeemReward(customer.id, selectedReward.id);
      
      toast.success(`Reward "${selectedReward.name}" redeemed successfully!`);
      setSelectedReward(null);
      
      // Reload data
      await loadRedemptionHistory();
      onRedemptionComplete?.();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Failed to redeem reward');
    } finally {
      setRedemptionLoading(false);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'discount': return <Gift className="w-5 h-5 text-green-600" />;
      case 'free_item': return <Award className="w-5 h-5 text-purple-600" />;
      case 'cashback': return <Star className="w-5 h-5 text-yellow-600" />;
      default: return <Gift className="w-5 h-5 text-blue-600" />;
    }
  };

  const getRewardColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'discount': return 'border-green-200 bg-green-50';
      case 'free_item': return 'border-purple-200 bg-purple-50';
      case 'cashback': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
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

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <GlassCard className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Redeem Rewards</h2>
                <p className="text-sm text-gray-600">{customer.name} - {customer.points} points available</p>
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
            {/* Available Rewards */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Available Rewards</h3>
                <button
                  onClick={loadRewards}
                  disabled={loadingRewards}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingRewards ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingRewards ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading rewards...</span>
                </div>
              ) : rewards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No rewards available</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {rewards.map((reward) => {
                    const canRedeem = customer.points >= reward.pointsRequired;
                    const isSelected = selectedReward?.id === reward.id;
                    
                    return (
                      <div
                        key={reward.id}
                        onClick={() => canRedeem && setSelectedReward(reward)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-300 bg-purple-50 ring-2 ring-purple-200'
                            : canRedeem
                            ? 'border-gray-200 hover:border-purple-200 hover:bg-purple-50'
                            : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {getRewardIcon(reward.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900">{reward.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm font-medium text-purple-600">
                                {reward.pointsRequired} points
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                reward.type === 'discount' ? 'bg-green-100 text-green-800' :
                                reward.type === 'free_item' ? 'bg-purple-100 text-purple-800' :
                                reward.type === 'cashback' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {reward.type}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {!canRedeem && (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Redemption Details & History */}
            <div className="space-y-6">
              {/* Selected Reward Details */}
              {selectedReward && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Reward</h3>
                  
                  <div className={`p-4 rounded-lg border ${getRewardColor(selectedReward.type)}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {getRewardIcon(selectedReward.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{selectedReward.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{selectedReward.description}</p>
                        
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Points Required:</span>
                            <span className="text-sm font-semibold text-purple-600">
                              {selectedReward.pointsRequired}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Your Points:</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {customer.points}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Remaining Points:</span>
                            <span className="text-sm font-semibold text-green-600">
                              {customer.points - selectedReward.pointsRequired}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <GlassButton
                    onClick={handleRedemption}
                    disabled={redemptionLoading || customer.points < selectedReward.pointsRequired}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                  >
                    {redemptionLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Gift className="w-4 h-4 mr-2" />
                    )}
                    Redeem Reward
                  </GlassButton>
                </div>
              )}

              {/* Redemption History */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Redemption History</h3>
                
                {redemptionHistory.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No redemption history</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {redemptionHistory.map((redemption, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <Gift className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {redemption.rewardName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(redemption.redeemedAt)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="text-sm font-semibold text-red-600">
                            -{redemption.pointsUsed}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Points Summary */}
          <div className="mt-6 bg-purple-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Current Points</p>
                <p className="text-xl font-bold text-purple-600">{customer.points}</p>
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
                <p className="text-sm text-gray-600">Total Redemptions</p>
                <p className="text-xl font-bold text-gray-900">{redemptionHistory.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Rewards</p>
                <p className="text-xl font-bold text-green-600">
                  {rewards.filter(r => customer.points >= r.pointsRequired).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default RewardRedemptionModal;
