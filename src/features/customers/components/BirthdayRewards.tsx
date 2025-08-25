import React, { useState } from 'react';
import { Gift, Star, Percent, Crown, Award, Plus, Minus, MessageSquare, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Customer } from '../../../types';

interface BirthdayRewardsProps {
  todaysBirthdays: Customer[];
  onApplyReward?: (customerId: string, rewardType: string) => void;
}

const BirthdayRewards: React.FC<BirthdayRewardsProps> = ({
  todaysBirthdays,
  onApplyReward
}) => {
  const [selectedRewards, setSelectedRewards] = useState<{ [key: string]: string }>({});

  const birthdayRewards = [
    {
      id: 'discount_20',
      name: '20% Birthday Discount',
      description: '20% off on any service or product',
      icon: Percent,
      color: 'bg-green-100 text-green-700',
      value: 20
    },
    {
      id: 'free_diagnosis',
      name: 'Free Device Diagnosis',
      description: 'Complimentary device health check',
      icon: Star,
      color: 'bg-blue-100 text-blue-700',
      value: 'Free'
    },
    {
      id: 'double_points',
      name: 'Double Loyalty Points',
      description: 'Earn 2x points on all purchases',
      icon: Crown,
      color: 'bg-purple-100 text-purple-700',
      value: '2x'
    },
    {
      id: 'priority_service',
      name: 'Priority Service',
      description: 'Skip the queue for faster service',
      icon: Award,
      color: 'bg-orange-100 text-orange-700',
      value: 'Priority'
    }
  ];

  const handleSelectReward = (customerId: string, rewardId: string) => {
    setSelectedRewards(prev => ({
      ...prev,
      [customerId]: prev[customerId] === rewardId ? '' : rewardId
    }));
  };

  const handleApplyReward = (customerId: string) => {
    const rewardId = selectedRewards[customerId];
    if (rewardId) {
      onApplyReward?.(customerId, rewardId);
      toast.success('Birthday reward applied successfully!');
    }
  };

  if (todaysBirthdays.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-6 h-6 text-pink-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Birthday Rewards & Special Offers
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {todaysBirthdays.map((customer) => (
          <GlassCard key={customer.id} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{customer.name}</h3>
                <p className="text-sm text-gray-600">🎉 Birthday Today!</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <select
                value={selectedRewards[customer.id] || ''}
                onChange={(e) => setSelectedRewards(prev => ({
                  ...prev,
                  [customer.id]: e.target.value
                }))}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select a birthday reward...</option>
                {birthdayRewards.map((reward) => (
                  <option key={reward.id} value={reward.id}>
                    {reward.name}
                  </option>
                ))}
              </select>
              
              <div className="flex gap-2">
                <GlassButton
                  onClick={() => handleApplyReward(customer.id)}
                  disabled={!selectedRewards[customer.id]}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Apply Reward
                </GlassButton>
                
                <GlassButton
                  onClick={() => toast.success('Birthday message sent!')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Send Wishes
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default BirthdayRewards;
