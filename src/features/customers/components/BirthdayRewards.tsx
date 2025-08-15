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
        {/* Available Rewards */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available Birthday Rewards
          </h3>
          <div className="space-y-3">
            {birthdayRewards.map((reward) => {
              const IconComponent = reward.icon;
              return (
                <div
                  key={reward.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reward.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{reward.name}</h4>
                    <p className="text-sm text-gray-600">{reward.description}</p>
                  </div>
                  <div className="text-sm font-semibold text-gray-700">
                    {typeof reward.value === 'number' ? `${reward.value}%` : reward.value}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Customer Rewards */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Apply Rewards to Birthday Customers
          </h3>
          <div className="space-y-4">
            {todaysBirthdays.map((customer) => (
              <div
                key={customer.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-pink-700 font-semibold">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{customer.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{customer.phone}</span>
                      {customer.loyaltyLevel && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.loyaltyLevel === 'platinum' ? 'bg-purple-100 text-purple-700' :
                          customer.loyaltyLevel === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                          customer.loyaltyLevel === 'silver' ? 'bg-gray-100 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {customer.loyaltyLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reward Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Birthday Reward:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {birthdayRewards.map((reward) => {
                      const IconComponent = reward.icon;
                      const isSelected = selectedRewards[customer.id] === reward.id;
                      
                      return (
                        <label
                          key={reward.id}
                          className={`
                            flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors
                            ${isSelected 
                              ? 'border-pink-500 bg-pink-50' 
                              : 'border-gray-200 hover:bg-gray-50'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name={`reward-${customer.id}`}
                            value={reward.id}
                            checked={isSelected}
                            onChange={() => handleSelectReward(customer.id, reward.id)}
                            className="text-pink-600"
                          />
                          <IconComponent className="w-4 h-4" />
                          <span className="text-sm font-medium">{reward.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Apply Button */}
                <div className="mt-3">
                  <GlassButton
                    onClick={() => handleApplyReward(customer.id)}
                    disabled={!selectedRewards[customer.id]}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Apply Birthday Reward
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Birthday Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassButton
            onClick={() => {/* TODO: Send birthday SMS */}}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Birthday SMS
          </GlassButton>
          
          <GlassButton
            onClick={() => {/* TODO: Send birthday WhatsApp */}}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Send Birthday WhatsApp
          </GlassButton>
          
          <GlassButton
            onClick={() => {/* TODO: Apply all rewards */}}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            <Gift className="w-4 h-4 mr-2" />
            Apply All Rewards
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default BirthdayRewards;
