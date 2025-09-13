// CustomerAnalytics component for LATS module
import React from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassCard from '../ui/GlassCard';
import GlassBadge from '../ui/GlassBadge';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';

interface CustomerAnalyticsData {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  newCustomersThisWeek: number;
  totalRevenue: number;
  averageOrderValue: number;
  customerRetentionRate: number;
  loyaltyProgramEnrollment: number;
  marketingConsentRate: number;
  topCustomerSegments: {
    name: string;
    count: number;
    percentage: number;
    revenue: number;
  }[];
  customerGrowth: {
    month: string;
    customers: number;
    revenue: number;
  }[];
  customerStatusDistribution: {
    status: string;
    count: number;
    percentage: number;
  }[];
}

interface CustomerAnalyticsProps {
  data: CustomerAnalyticsData;
  loading?: boolean;
  className?: string;
}

const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({
  data,
  loading = false,
  className = ''
}) => {
  // Calculate growth rate
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Get growth indicator
  const getGrowthIndicator = (rate: number) => {
    if (rate > 0) {
      return (
        <GlassBadge variant="success" size="sm">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          +{rate.toFixed(1)}%
        </GlassBadge>
      );
    } else if (rate < 0) {
      return (
        <GlassBadge variant="error" size="sm">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          {rate.toFixed(1)}%
        </GlassBadge>
      );
    }
    return (
      <GlassBadge variant="ghost" size="sm">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
        0%
      </GlassBadge>
    );
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-32 bg-lats-surface/30 rounded-lats-radius-md animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-lats-text-secondary">Total Customers</p>
              <p className="text-2xl font-bold text-lats-text">{format.number(data.totalCustomers)}</p>
              <div className="flex items-center gap-2 mt-2">
                {getGrowthIndicator(calculateGrowthRate(data.newCustomersThisMonth, data.totalCustomers - data.newCustomersThisMonth))}
              </div>
            </div>
            <div className="w-12 h-12 bg-lats-primary/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-lats-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </GlassCard>

        {/* Active Customers */}
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-lats-text-secondary">Active Customers</p>
              <p className="text-2xl font-bold text-lats-text">{format.number(data.activeCustomers)}</p>
              <div className="flex items-center gap-2 mt-2">
                <GlassBadge variant="success" size="sm">
                  {((data.activeCustomers / data.totalCustomers) * 100).toFixed(1)}% active
                </GlassBadge>
              </div>
            </div>
            <div className="w-12 h-12 bg-lats-success/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-lats-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </GlassCard>

        {/* New Customers This Month */}
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-lats-text-secondary">New This Month</p>
              <p className="text-2xl font-bold text-lats-text">{format.number(data.newCustomersThisMonth)}</p>
              <div className="flex items-center gap-2 mt-2">
                {getGrowthIndicator(calculateGrowthRate(data.newCustomersThisWeek, data.newCustomersThisMonth - data.newCustomersThisWeek))}
              </div>
            </div>
            <div className="w-12 h-12 bg-lats-warning/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-lats-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </GlassCard>

        {/* Total Revenue */}
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-lats-text-secondary">Total Revenue</p>
              <p className="text-2xl font-bold text-lats-text">{format.money(data.totalRevenue)}</p>
              <div className="flex items-center gap-2 mt-2">
                <GlassBadge variant="primary" size="sm">
                  Avg: {format.money(data.averageOrderValue)}
                </GlassBadge>
              </div>
            </div>
            <div className="w-12 h-12 bg-lats-primary/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-lats-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-lats-text mb-4">Customer Segments</h3>
          <div className="space-y-3">
            {data.topCustomerSegments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-lats-surface/30 rounded-lats-radius-md">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-lats-warning' :
                    index === 1 ? 'bg-lats-primary' :
                    index === 2 ? 'bg-lats-success' : 'bg-lats-info'
                  }`} />
                  <div>
                    <p className="font-medium text-lats-text">{segment.name}</p>
                    <p className="text-sm text-lats-text-secondary">
                      {segment.count} customers ({segment.percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-lats-text">{format.money(segment.revenue)}</p>
                  <p className="text-xs text-lats-text-secondary">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Customer Status Distribution */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-lats-text mb-4">Customer Status</h3>
          <div className="space-y-3">
            {data.customerStatusDistribution.map((status, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status.status === 'VIP' ? 'bg-lats-warning' :
                    status.status === 'Premium' ? 'bg-lats-primary' :
                    status.status === 'Regular' ? 'bg-lats-success' :
                    status.status === 'New' ? 'bg-lats-info' : 'bg-lats-error'
                  }`} />
                  <span className="text-sm text-lats-text">{status.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-lats-surface/50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status.status === 'VIP' ? 'bg-lats-warning' :
                        status.status === 'Premium' ? 'bg-lats-primary' :
                        status.status === 'Regular' ? 'bg-lats-success' :
                        status.status === 'New' ? 'bg-lats-info' : 'bg-lats-error'
                      }`}
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-lats-text min-w-[3rem]">
                    {status.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Program Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Loyalty Program */}
        <GlassCard>
          <div className="text-center">
            <div className="w-16 h-16 bg-lats-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-lats-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-lats-text">Loyalty Program</h4>
            <p className="text-3xl font-bold text-lats-text mb-2">
              {data.loyaltyProgramEnrollment}
            </p>
            <p className="text-sm text-lats-text-secondary">
              {((data.loyaltyProgramEnrollment / data.totalCustomers) * 100).toFixed(1)}% enrollment rate
            </p>
          </div>
        </GlassCard>

        {/* Marketing Consent */}
        <GlassCard>
          <div className="text-center">
            <div className="w-16 h-16 bg-lats-info/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-lats-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-lats-text">Marketing Consent</h4>
            <p className="text-3xl font-bold text-lats-text mb-2">
              {data.marketingConsentRate}
            </p>
            <p className="text-sm text-lats-text-secondary">
              {((data.marketingConsentRate / data.totalCustomers) * 100).toFixed(1)}% consent rate
            </p>
          </div>
        </GlassCard>

        {/* Retention Rate */}
        <GlassCard>
          <div className="text-center">
            <div className="w-16 h-16 bg-lats-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-lats-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-lats-text">Retention Rate</h4>
            <p className="text-3xl font-bold text-lats-text mb-2">
              {data.customerRetentionRate.toFixed(1)}%
            </p>
            <p className="text-sm text-lats-text-secondary">
              Customer retention rate
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Growth Chart */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-lats-text mb-4">Customer Growth</h3>
        <div className="space-y-3">
          {data.customerGrowth.slice(-6).map((growth, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-lats-surface/30 rounded-lats-radius-md">
              <div>
                <p className="font-medium text-lats-text">{growth.month}</p>
                <p className="text-sm text-lats-text-secondary">
                  {growth.customers} new customers
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-lats-text">{format.money(growth.revenue)}</p>
                <p className="text-xs text-lats-text-secondary">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

// Export with display name for debugging
CustomerAnalytics.displayName = 'CustomerAnalytics';

export default CustomerAnalytics;
