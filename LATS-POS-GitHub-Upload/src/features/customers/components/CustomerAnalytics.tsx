import React from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import { TrendingUp, TrendingDown, Clock, DollarSign, Smartphone, Star, Users, Calendar, Target, Award } from 'lucide-react';
import { Customer, Device } from '../../../types';
import { PaymentRow } from '../../../context/PaymentsContext';
import { formatCurrency } from '../../../lib/customerApi';

interface CustomerAnalyticsProps {
  customer: Customer;
  devices: Device[];
  payments: PaymentRow[];
}

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({ customer, devices, payments }) => {
  // Calculate advanced metrics
  const calculateMetrics = (): AnalyticsMetric[] => {
    // Use payments for all money-related metrics
    const totalSpent = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
    const points = customer.points || 0;
    const deviceCount = devices.length;
    const activeDevices = devices.filter(d => ['assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair', 'reassembled-testing'].includes(d.status)).length;
    
    // Calculate average repair value
    const avgRepairValue = deviceCount > 0 ? totalSpent / deviceCount : 0;
    
    // Calculate customer lifetime value (CLV)
    const clv = totalSpent + (points * 0.1); // Assuming 1 point = $0.10 value
    
    // Calculate customer retention score
    let daysSinceLastVisit = 0;
    if (customer.lastVisit) {
      try {
        const lastVisitDate = new Date(customer.lastVisit);
        if (!isNaN(lastVisitDate.getTime())) {
          daysSinceLastVisit = Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      } catch (error) {
        console.warn('Invalid lastVisit date for customer:', customer.id, customer.lastVisit);
      }
    }
    const retentionScore = daysSinceLastVisit <= 30 ? 'Excellent' : 
                          daysSinceLastVisit <= 90 ? 'Good' : 
                          daysSinceLastVisit <= 180 ? 'Fair' : 'Poor';
    
    // Calculate device diversity
    const uniqueBrands = new Set(devices.map(d => d.brand)).size;
    const deviceDiversity = `${uniqueBrands} brands`;

    
    // Calculate repair frequency
    let repairFrequency = 'No repairs yet';
    if (deviceCount > 0 && customer.joinedDate) {
      try {
        const joinedDate = new Date(customer.joinedDate);
        if (!isNaN(joinedDate.getTime())) {
          const yearsSinceJoined = (Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
          const repairsPerYear = (deviceCount / Math.max(1, yearsSinceJoined)) * 12;
          repairFrequency = `${repairsPerYear.toFixed(1)} repairs/year`;
        }
      } catch (error) {
        console.warn('Invalid joinedDate for customer:', customer.id, customer.joinedDate);
      }
    }
    
    // Calculate loyalty progression
    const loyaltyLevels = { bronze: 0, silver: 100, gold: 500, platinum: 1000 };
    const currentLevel = customer.loyaltyLevel?.toLowerCase() || 'bronze';
    const nextLevel = currentLevel === 'bronze' ? 'silver' : 
                     currentLevel === 'silver' ? 'gold' : 
                     currentLevel === 'gold' ? 'platinum' : null;
    const progressToNext = nextLevel ? 
      Math.min(100, ((points - loyaltyLevels[currentLevel as keyof typeof loyaltyLevels]) / 
      (loyaltyLevels[nextLevel as keyof typeof loyaltyLevels] - loyaltyLevels[currentLevel as keyof typeof loyaltyLevels])) * 100) : 100;

    return [
      {
        label: 'Customer Lifetime Value',
        value: formatCurrency(clv),
        icon: <DollarSign size={20} />,
        color: 'text-green-600',
        trend: 'up' as const
      },
      {
        label: 'Average Repair Value',
        value: formatCurrency(avgRepairValue),
        icon: <Target size={20} />,
        color: 'text-blue-600',
        trend: 'neutral' as const
      },
      {
        label: 'Active Repairs',
        value: `${activeDevices}/${deviceCount}`,
        icon: <Smartphone size={20} />,
        color: 'text-purple-600',
        trend: activeDevices > 0 ? 'up' as const : 'neutral' as const
      },
      {
        label: 'Retention Score',
        value: retentionScore,
        icon: <Award size={20} />,
        color: retentionScore === 'Excellent' ? 'text-green-600' : 
               retentionScore === 'Good' ? 'text-blue-600' : 
               retentionScore === 'Fair' ? 'text-yellow-600' : 'text-red-600',
        trend: retentionScore === 'Excellent' || retentionScore === 'Good' ? 'up' as const : 'down' as const
      },
      {
        label: 'Device Diversity',
        value: deviceDiversity,
        icon: <Users size={20} />,
        color: 'text-indigo-600',
        trend: uniqueBrands > 1 ? 'up' as const : 'neutral' as const
      },
      {
        label: 'Repair Frequency',
        value: repairFrequency,
        icon: <Calendar size={20} />,
        color: 'text-orange-600',
        trend: 'neutral' as const
      },
      {
        label: 'Loyalty Progress',
        value: `${Math.round(progressToNext)}%`,
        icon: <Star size={20} />,
        color: 'text-amber-600',
        trend: progressToNext > 50 ? 'up' as const : 'neutral' as const
      },
      {
        label: 'Days Since Last Visit',
        value: `${daysSinceLastVisit} days`,
        icon: <Clock size={20} />,
        color: daysSinceLastVisit <= 30 ? 'text-green-600' : 
               daysSinceLastVisit <= 90 ? 'text-blue-600' : 
               daysSinceLastVisit <= 180 ? 'text-yellow-600' : 'text-red-600',
        trend: daysSinceLastVisit <= 30 ? 'up' as const : 'down' as const
      }
    ];
  };

  const metrics = calculateMetrics();

  // Calculate spending trends
  const spendingByMonth: Record<string, number> = {};
  devices.forEach(device => {
    if (device.createdAt) {
      try {
        const date = new Date(device.createdAt);
        if (!isNaN(date.getTime())) { // Check if date is valid
          const month = date.toISOString().slice(0, 7); // YYYY-MM
          spendingByMonth[month] = (spendingByMonth[month] || 0) + (device.estimatedHours || 0) * 50; // Estimate cost based on hours
        }
      } catch (error) {
        console.warn('Invalid date for device:', device.id, device.createdAt);
      }
    }
  });

  const recentMonths = Object.keys(spendingByMonth)
    .sort()
    .slice(-6)
    .map(month => {
      try {
        const date = new Date(month);
        if (!isNaN(date.getTime())) {
          return {
            month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            amount: spendingByMonth[month]
          };
        }
      } catch (error) {
        console.warn('Invalid month string:', month);
      }
      return {
        month: 'Invalid Date',
        amount: spendingByMonth[month]
      };
    })
    .filter(item => item.month !== 'Invalid Date');

  // Use payments for all money-related metrics
  const totalSpent = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Advanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <GlassCard key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div className={`${metric.color}`}>
                {metric.icon}
              </div>
              {metric.trend && (
                <div className={`${metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                  {metric.trend === 'up' && <TrendingUp size={16} />}
                  {metric.trend === 'down' && <TrendingDown size={16} />}
                </div>
              )}
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Spending Trends */}
      {recentMonths.length > 0 && (
        <GlassCard>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Spending Trends (Last 6 Months)</h3>
          <div className="space-y-3">
            {recentMonths.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{month.month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ 
                        width: `${(month.amount / Math.max(...recentMonths.map(m => m.amount))) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">${month.amount.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Customer Insights */}
      <GlassCard>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Insights</h3>
        <div className="space-y-3">
          {customer.loyaltyLevel === 'platinum' && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">VIP Customer - Platinum Level</span>
            </div>
          )}
          
          {totalSpent > 1000 && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">High-Value Customer - ${totalSpent.toFixed(0)} spent</span>
            </div>
          )}
          
          {devices.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-900">New Customer - No repair history yet</span>
            </div>
          )}
          
          {devices.length > 5 && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Frequent Customer - {devices.length} repairs</span>
            </div>
          )}
          
          {(customer.points || 0) > 500 && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-lg">
              <Star className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-gray-900">Loyalty Points Leader - {customer.points || 0} points</span>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default CustomerAnalytics; 