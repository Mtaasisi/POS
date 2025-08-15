import React, { useState, useEffect } from 'react';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import { ArrowLeft, Star, TrendingUp, TrendingDown, Gift, History, Filter, Calendar, Award, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface PointsTransaction {
  id: string;
  customer_id: string;
  points_change: number;
  transaction_type: 'earned' | 'spent' | 'adjusted' | 'redeemed' | 'expired';
  reason: string;
  device_id: string | null;
  created_by: string;
  created_at: string;
  metadata: any;
}

interface Customer {
  id: string;
  name: string;
  points: number;
  loyalty_level: string;
  created_at: string;
}

const PointsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPointsData();
  }, []);

  const loadPointsData = async () => {
    setLoading(true);
    try {
      // Load customers with points
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, points, loyalty_level, created_at')
        .order('points', { ascending: false });

      if (customersError) throw customersError;

      // Load all points transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('points_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      setCustomers(customersData || []);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error loading points data:', error);
      toast.error('Failed to load points data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;

    // Filter by transaction type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === filterType);
    }

    // Filter by customer
    if (filterCustomer !== 'all') {
      filtered = filtered.filter(t => t.customer_id === filterCustomer);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(t => new Date(t.created_at) >= cutoffDate);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.created_by.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'spent': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'redeemed': return <Gift className="h-4 w-4 text-purple-500" />;
      case 'adjusted': return <Award className="h-4 w-4 text-blue-500" />;
      default: return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned': return 'text-green-600';
      case 'spent': return 'text-red-600';
      case 'redeemed': return 'text-purple-600';
      case 'adjusted': return 'text-blue-600';
      default: return 'text-gray-600';
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

  const getTotalPoints = () => {
    return customers.reduce((sum, customer) => sum + (customer.points || 0), 0);
  };

  const getTotalEarned = () => {
    return transactions
      .filter(t => t.transaction_type === 'earned')
      .reduce((sum, t) => sum + t.points_change, 0);
  };

  const getTotalSpent = () => {
    return transactions
      .filter(t => t.transaction_type === 'spent' || t.transaction_type === 'redeemed')
      .reduce((sum, t) => sum + Math.abs(t.points_change), 0);
  };

  const filteredTransactions = getFilteredTransactions();

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <GlassButton
          variant="secondary"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/customers')}
        >
          Back
        </GlassButton>
        <h1 className="text-3xl font-bold text-gray-900">Points Management</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Star size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalPoints().toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalEarned().toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalSpent().toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="earned">Earned</option>
            <option value="spent">Spent</option>
            <option value="redeemed">Redeemed</option>
            <option value="adjusted">Adjusted</option>
          </select>

          <select
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Customers</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.points} pts)
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm flex-1 max-w-xs"
          />
        </div>
      </GlassCard>

      {/* Points History */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History size={18} />
            Points History
          </h3>
          <span className="text-sm text-gray-500">
            {filteredTransactions.length} transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.transaction_type)}
                      <span className="text-sm font-medium capitalize">
                        {transaction.transaction_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">
                      {getCustomerName(transaction.customer_id)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                      {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700 max-w-xs truncate block">
                      {transaction.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {transaction.created_by}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(transaction.created_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transactions found matching your filters.
            </div>
          )}
        </div>
      </GlassCard>

      {/* Top Customers */}
      <GlassCard>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Customers by Points</h3>
        <div className="space-y-3">
          {customers.slice(0, 10).map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{customer.loyalty_level} Level</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{customer.points?.toLocaleString() || 0} points</p>
                <p className="text-xs text-gray-500">
                  Since {new Date(customer.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default PointsManagementPage; 