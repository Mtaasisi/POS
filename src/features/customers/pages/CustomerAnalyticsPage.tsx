import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import GlassBadge from '../../../features/shared/components/ui/GlassBadge';
import GlassTabs from '../../../features/shared/components/ui/GlassTabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  customersByStatus: { status: string; count: number }[];
  customersBySource: { source: string; count: number }[];
  monthlyGrowth: { month: string; count: number }[];
  topCustomers: { name: string; points: number; totalSpent: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CustomerAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('growth');

  useEffect(() => {
    fetchCustomerAnalytics();
  }, []);

  const fetchCustomerAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch customer data
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) throw customersError;

      if (!customers) {
        setAnalytics({
          totalCustomers: 0,
          activeCustomers: 0,
          newCustomersThisMonth: 0,
          customersByStatus: [],
          customersBySource: [],
          monthlyGrowth: [],
          topCustomers: []
        });
        return;
      }

      // Calculate analytics
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const totalCustomers = customers.length;
      const activeCustomers = customers.filter(c => c.status === 'active').length;
      const newCustomersThisMonth = customers.filter(c => 
        new Date(c.created_at) >= thisMonth
      ).length;

      // Group by status
      const statusCounts = customers.reduce((acc, customer) => {
        const status = customer.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const customersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      // Group by source
      const sourceCounts = customers.reduce((acc, customer) => {
        const source = customer.source || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const customersBySource = Object.entries(sourceCounts).map(([source, count]) => ({
        source,
        count
      }));

      // Monthly growth (last 6 months)
      const monthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const count = customers.filter(c => {
          const createdDate = new Date(c.created_at);
          return createdDate >= month && createdDate <= monthEnd;
        }).length;
        
        monthlyGrowth.push({
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          count
        });
      }

      // Top customers by points
      const topCustomers = customers
        .filter(c => c.points && c.points > 0)
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 10)
        .map(c => ({
          name: c.name || 'Unknown',
          points: c.points || 0,
          totalSpent: c.total_spent || 0
        }));

      setAnalytics({
        totalCustomers,
        activeCustomers,
        newCustomersThisMonth,
        customersByStatus,
        customersBySource,
        monthlyGrowth,
        topCustomers
      });

    } catch (err) {
      console.error('Error fetching customer analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">Error loading analytics: {error}</p>
          <GlassButton onClick={fetchCustomerAnalytics}>Retry</GlassButton>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Analytics</h1>
        <p className="text-gray-600">Comprehensive insights into your customer base</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Customers</h3>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              All registered customers
            </p>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Customers</h3>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold">{analytics.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((analytics.activeCustomers / analytics.totalCustomers) * 100).toFixed(1)}% of total
            </p>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">New This Month</h3>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold">{analytics.newCustomersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              New registrations this month
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Charts */}
      <GlassTabs
        tabs={[
          { id: 'growth', label: 'Monthly Growth' },
          { id: 'status', label: 'Status Distribution' },
          { id: 'source', label: 'Source Distribution' },
          { id: 'top', label: 'Top Customers' }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div className="space-y-4">
          {/* Growth Tab */}
          {activeTab === 'growth' && (
            <GlassCard>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Customer Growth</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <GlassCard>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Customers by Status</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.customersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.customersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* Source Tab */}
          {activeTab === 'source' && (
            <GlassCard>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Customers by Source</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.customersBySource}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* Top Customers Tab */}
          {activeTab === 'top' && (
            <GlassCard>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Customers by Points</h3>
              </div>
              <div className="space-y-4">
                {analytics.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <GlassBadge>#{index + 1}</GlassBadge>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">Total spent: ${customer.totalSpent.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{customer.points} points</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </GlassTabs>
    </div>
  );
};

export default CustomerAnalyticsPage;
