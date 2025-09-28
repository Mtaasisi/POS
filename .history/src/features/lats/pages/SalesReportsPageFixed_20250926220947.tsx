import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Eye, 
  Calendar, 
  User, 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  RefreshCw,
  Lock,
  Unlock,
  FileText,
  BarChart3,
  Plus,
  Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

interface Sale {
  id: string;
  sale_number: string;
  customer_id: string;
  total_amount: number;
  payment_method: any;
  status: string;
  created_by: string;
  created_at: string;
  lats_sale_items?: any[];
}

const SalesReportsPageFixed: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [dateRange, setDateRange] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  
  // Sales data state
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Modal state
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);

  // Check if user can view profit information
  const canViewProfit = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || 
           currentUser.role === 'manager' || 
           currentUser.role === 'owner';
  }, [currentUser]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalTransactions = sales.length;
    const uniqueCustomers = new Set(sales.map(sale => sale.customer_id)).size;
    const averageOrder = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    return {
      totalSales,
      totalTransactions,
      totalCustomers: uniqueCustomers,
      averageOrder
    };
  }, [sales]);

  // Fetch user names for cashier display
  const fetchUserNames = async (userIds: string[]) => {
    if (userIds.length === 0) return {};
    
    try {
      const { data: users, error } = await supabase
        .from('auth_users')
        .select('id, name, email')
        .in('id', userIds);

      if (error) {
        console.error('Error fetching user names:', error);
        return {};
      }

      const nameMap: {[key: string]: string} = {};
      users?.forEach(user => {
        nameMap[user.id] = user.name || user.email || 'Unknown User';
      });
      
      return nameMap;
    } catch (err) {
      console.error('Error in fetchUserNames:', err);
      return {};
    }
  };

  // Test database connection and check for sales
  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 Testing database connection...');
      
      // First, check if lats_sales table exists and has any data
      const { data: tableCheck, error: tableError } = await supabase
        .from('lats_sales')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('❌ Table check failed:', tableError);
        return { success: false, error: tableError.message };
      }

      console.log('✅ Table exists, checking for sales...');
      
      // Check total count
      const { count, error: countError } = await supabase
        .from('lats_sales')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ Count check failed:', countError);
        return { success: false, error: countError.message };
      }

      console.log(`📊 Total sales in database: ${count || 0}`);
      
      return { 
        success: true, 
        totalSales: count || 0,
        message: `Found ${count || 0} sales in database`
      };
    } catch (err) {
      console.error('❌ Database test failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  // Fetch sales data with improved error handling
  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching sales for period:', selectedPeriod);

      // First test the database connection
      const dbTest = await testDatabaseConnection();
      setDebugInfo(dbTest);

      if (!dbTest.success) {
        setError(`Database connection failed: ${dbTest.error}`);
        return;
      }

      if (dbTest.totalSales === 0) {
        console.log('📊 No sales found in database');
        setSales([]);
        setError('No sales found in database. Try creating a test sale first.');
        return;
      }

      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      if (selectedPeriod === 'custom') {
        startDate.setTime(new Date(dateRange.start).getTime());
        endDate.setTime(new Date(dateRange.end).getTime());
        endDate.setHours(23, 59, 59, 999);
      } else {
        switch (selectedPeriod) {
          case '1d':
            startDate.setDate(endDate.getDate() - 1);
            break;
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
          default:
            startDate.setDate(endDate.getDate() - 7);
        }
      }

      console.log('📅 Date range:', startDate.toISOString(), 'to', endDate.toISOString());

      // Try a simple query first
      const { data: salesData, error: salesError } = await supabase
        .from('lats_sales')
        .select(`
          id,
          sale_number,
          customer_id,
          total_amount,
          payment_method,
          status,
          created_by,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (salesError) {
        console.error('❌ Error fetching sales:', salesError);
        setError(`Failed to load sales data: ${salesError.message}`);
        return;
      }

      console.log(`✅ Loaded ${salesData?.length || 0} sales from database`);

      // Filter sales by date range in JavaScript
      const filteredSales = (salesData || []).filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= startDate && saleDate <= endDate;
      });

      console.log(`📅 Filtered to ${filteredSales.length} sales for period ${selectedPeriod}`);
      setSales(filteredSales);

      // Fetch user names for cashier display
      const uniqueUserIds = [...new Set(filteredSales.map(sale => sale.created_by).filter(Boolean))];
      const validUserIds = uniqueUserIds.filter(id => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
      });
      
      if (validUserIds.length > 0) {
        const names = await fetchUserNames(validUserIds);
        setUserNames(names);
      }

    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  // Create a test sale for debugging
  const createTestSale = async () => {
    try {
      console.log('🧪 Creating test sale...');
      
      const testSaleData = {
        sale_number: `TEST-${Date.now()}`,
        customer_id: null,
        total_amount: 1000,
        payment_method: JSON.stringify({ type: 'single', method: 'Cash' }),
        status: 'completed',
        created_by: currentUser?.id || null, // Use current user ID or NULL
        notes: 'Test sale for debugging'
      };

      const { data, error } = await supabase
        .from('lats_sales')
        .insert([testSaleData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating test sale:', error);
        toast.error(`Failed to create test sale: ${error.message}`);
        return;
      }

      console.log('✅ Test sale created:', data);
      toast.success('Test sale created successfully!');
      
      // Refresh the sales data
      fetchSales();
    } catch (err) {
      console.error('Error creating test sale:', err);
      toast.error('Failed to create test sale');
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedPeriod, dateRange]);

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodDisplay = (paymentMethod: any) => {
    if (!paymentMethod) return 'Unknown';
    
    if (typeof paymentMethod === 'string') {
      try {
        const parsed = JSON.parse(paymentMethod);
        return parsed.method || parsed.type || 'Unknown';
      } catch {
        return paymentMethod;
      }
    }
    
    if (typeof paymentMethod === 'object') {
      return paymentMethod.method || paymentMethod.type || 'Unknown';
    }
    
    return 'Unknown';
  };

  const handleSaleClick = (sale: Sale) => {
    console.log('🔍 Opening sale details for:', sale.id);
    setSelectedSale(sale);
    setShowSaleModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Sales Reports"
          subtitle="Monitor and manage daily sales performance"
          icon={BarChart3}
        />

        {/* Debug Information */}
        {debugInfo && (
          <GlassCard className="p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Database Status</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Connection:</strong>
                <div className="ml-2 text-xs">
                  <div className={debugInfo.success ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.success ? '✅ Connected' : '❌ Failed'}
                  </div>
                  {debugInfo.error && <div className="text-red-600">{debugInfo.error}</div>}
                </div>
              </div>
              <div>
                <strong>Total Sales:</strong>
                <div className="ml-2 text-xs">
                  <div>{debugInfo.totalSales || 0} sales found</div>
                </div>
              </div>
              <div>
                <strong>Filtered Sales:</strong>
                <div className="ml-2 text-xs">
                  <div>{sales.length} sales for selected period</div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{formatMoney(summaryMetrics.totalSales)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalTransactions}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalCustomers}</p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Order</p>
                <p className="text-2xl font-bold text-gray-900">{formatMoney(summaryMetrics.averageOrder)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </GlassCard>
        </div>

        {/* Controls */}
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1d">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <GlassButton
              onClick={fetchSales}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </GlassButton>

            <GlassButton
              onClick={createTestSale}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Create Test Sale
            </GlassButton>
          </div>
        </GlassCard>

        {/* Sales List */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Transactions</h3>
            <p className="text-sm text-gray-500">{sales.length} transactions found</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading sales...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <GlassButton onClick={fetchSales} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </GlassButton>
                <GlassButton onClick={createTestSale} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4" />
                  Create Test Sale
                </GlassButton>
              </div>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No sales found for the selected period</p>
              <div className="flex gap-3 justify-center">
                <GlassButton onClick={() => setSelectedPeriod('90d')} className="flex items-center gap-2">
                  Try 90 Days
                </GlassButton>
                <GlassButton onClick={createTestSale} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4" />
                  Create Test Sale
                </GlassButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => handleSaleClick(sale)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900">#{sale.sale_number}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          sale.status === 'completed' ? 'bg-green-100 text-green-700' :
                          sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sale.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(sale.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {sale.customer_id ? `Customer: ${sale.customer_id.slice(0, 8)}...` : 'Walk-in'}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          {getPaymentMethodDisplay(sale.payment_method)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{formatMoney(sale.total_amount)}</p>
                      <p className="text-xs text-gray-500">
                        {sale.created_by ? (userNames[sale.created_by] || `User: ${sale.created_by.slice(0, 8)}...`) : 'System'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default SalesReportsPageFixed;
