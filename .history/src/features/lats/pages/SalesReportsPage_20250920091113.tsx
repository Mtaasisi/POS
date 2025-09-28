// SalesReportsPage component for LATS module - Enhanced for Customer Care
import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import PageHeader from '../components/ui/PageHeader';
import SaleDetailsModal from '../components/modals/SaleDetailsModal';
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
  BarChart3
} from 'lucide-react';
import { testDatabaseConnection } from '../../../utils/databaseTest';
import { toast } from 'react-hot-toast';



interface Sale {
  id: string;
  sale_number: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount: number;
  discount: number;
  discount_type: string;
  discount_value: number;
  tax: number;
  payment_method: any;
  status: string;
  created_by: string;
  created_at: string;
  lats_sale_items?: any[];
}

const SalesReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('1d'); // Default to today for customer care
  const [selectedReport, setSelectedReport] = useState('daily');
  const [dateRange, setDateRange] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  
  // Sales data state
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);

  // Daily closing state
  const [isDailyClosed, setIsDailyClosed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [dailyCloseTime, setDailyCloseTime] = useState<string | null>(null);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalTransactions = sales.length;
    const uniqueCustomers = new Set(sales.map(sale => sale.customer_id)).size;
    const averageOrder = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // Calculate profit (simplified - would need cost price data for accurate calculation)
    const totalProfit = sales.reduce((sum, sale) => {
      const profit = sale.lats_sale_items?.reduce((itemSum, item) => {
        return itemSum + (item.total_price - (item.cost_price || 0) * item.quantity);
      }, 0) || 0;
      return sum + profit;
    }, 0);
    
    const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';

    return {
      totalSales,
      totalTransactions,
      totalCustomers: uniqueCustomers,
      averageOrder,
      totalProfit,
      profitMargin
    };
  }, [sales]);

  // Fetch sales data
  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      if (selectedPeriod === 'custom') {
        // Use custom date range
        startDate.setTime(new Date(dateRange.start).getTime());
        endDate.setTime(new Date(dateRange.end).getTime());
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Use predefined periods
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

      // For debugging: also try without date filters to see if there are any sales at all
      if (selectedPeriod === '7d') {
        console.log('🔍 Also checking for any sales without date filter...');
        const { data: allSales, error: allSalesError } = await supabase
          .from('lats_sales')
          .select('id, sale_number, created_at')
          .limit(5);
        
        if (!allSalesError && allSales) {
          console.log('📊 Found sales in database:', allSales);
        } else {
          console.log('❌ No sales found or error:', allSalesError);
        }
      }

      console.log('🔍 Fetching sales for period:', selectedPeriod, 'from', startDate.toISOString(), 'to', endDate.toISOString());

      // Try a much simpler query first - just get all sales and filter in JavaScript
      // This avoids the complex date filter that's causing the 400 error
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
          created_at,
          lats_sale_items(
            id,
            product_id,
            variant_id,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200); // Get more sales and filter in JavaScript

      if (salesError) {
        console.error('❌ Error fetching sales:', salesError);
        setError(`Failed to load sales data: ${salesError.message}`);
        return;
      }

      console.log(`✅ Loaded ${salesData?.length || 0} total sales from database`);

      // Filter sales by date range in JavaScript (since Supabase date filters are causing issues)
      const filteredSales = (salesData || []).filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= startDate && saleDate <= endDate;
      });

      console.log(`📅 Filtered to ${filteredSales.length} sales for period ${selectedPeriod}`);
      setSales(filteredSales);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run database test first
    testDatabaseConnection().then(result => {
      console.log('🔍 Database test result:', result);
    });
    
    fetchSales();
    checkDailyCloseStatus();
  }, [selectedPeriod, dateRange]);

  // Check if today's sales are already closed
  const checkDailyCloseStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_sales_closures')
        .select('*')
        .eq('date', today)
        .single();

      if (!error && data) {
        setIsDailyClosed(true);
        setDailyCloseTime(data.closed_at);
      }
    } catch (err) {
      console.log('No previous closure found for today');
    }
  };

  // Daily closing functionality
  const handleDailyClose = async () => {
    try {
      setIsClosing(true);
      
      // Create daily closure record
      const today = new Date().toISOString().split('T')[0];
      const closureData = {
        date: today,
        total_sales: summaryMetrics.totalSales,
        total_transactions: summaryMetrics.totalTransactions,
        closed_at: new Date().toISOString(),
        closed_by: 'customer_care', // You can get this from auth context
        sales_data: sales
      };

      const { error } = await supabase
        .from('daily_sales_closures')
        .upsert(closureData);

      if (error) throw error;

      setIsDailyClosed(true);
      setDailyCloseTime(new Date().toISOString());
      setShowCloseConfirm(false);
      
      toast.success('Daily sales closed successfully! 🎉');
      
      // Export daily report
      exportDailyReport();
      
    } catch (err) {
      console.error('Error closing daily sales:', err);
      toast.error('Failed to close daily sales. Please try again.');
    } finally {
      setIsClosing(false);
    }
  };

  // Export daily report
  const exportDailyReport = () => {
    const today = new Date().toISOString().split('T')[0];
    const reportData = [
      ['Daily Sales Report', today],
      ['Generated At', new Date().toLocaleString()],
      ['Total Sales', summaryMetrics.totalSales],
      ['Total Transactions', summaryMetrics.totalTransactions],
      ['Total Customers', summaryMetrics.totalCustomers],
      ['Average Order', summaryMetrics.averageOrder],
      ['Profit Margin', summaryMetrics.profitMargin + '%'],
      [''],
      ['Transaction Details'],
      ['Sale Number', 'Customer', 'Amount', 'Payment Method', 'Time', 'Status'],
      ...sales.map(sale => [
        sale.sale_number,
        sale.customer_id ? `Customer: ${sale.customer_id.slice(0, 8)}...` : 'Walk-in',
        sale.total_amount,
        getPaymentMethodDisplay(sale.payment_method),
        formatDate(sale.created_at),
        sale.status
      ])
    ];

    const csvContent = reportData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-sales-report-${today}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Daily report exported successfully! 📊');
  };

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
        if (parsed.type === 'multiple' && parsed.details?.payments) {
          const methods = parsed.details.payments.map((payment: any) => {
            const methodName = payment.method || payment.paymentMethod || 'Unknown';
            return methodName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          });
          const uniqueMethods = [...new Set(methods)];
          return uniqueMethods.join(', ');
        }
        return parsed.method || parsed.type || 'Unknown';
      } catch {
        return paymentMethod;
      }
    }
    
    if (typeof paymentMethod === 'object') {
      if (paymentMethod.type === 'multiple' && paymentMethod.details?.payments) {
        const methods = paymentMethod.details.payments.map((payment: any) => {
          const methodName = payment.method || payment.paymentMethod || 'Unknown';
          return methodName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        });
        const uniqueMethods = [...new Set(methods)];
        return uniqueMethods.join(', ');
      }
      return paymentMethod.method || paymentMethod.type || 'Unknown';
    }
    
    return 'Unknown';
  };

  const handleSaleClick = (sale: Sale) => {
    console.log('🔍 Opening sale details for:', sale.id);
    setSelectedSale(sale);
    setShowSaleModal(true);
  };

  const fetchAllSales = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching all sales without date filter...');

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
          created_at,
          lats_sale_items(
            id,
            product_id,
            variant_id,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (salesError) {
        console.error('❌ Error fetching all sales:', salesError);
        setError(`Failed to load sales data: ${salesError.message}`);
        return;
      }

      console.log(`✅ Loaded ${salesData?.length || 0} sales (all time)`);
      setSales(salesData || []);
    } catch (err) {
      console.error('❌ Unexpected error fetching all sales:', err);
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate simple chart
  const generateChart = (data: any[], key: string, valueKey: string, color = 'blue') => {
    const maxValue = Math.max(...data.map(item => item[valueKey]));
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-24 text-sm text-gray-600 truncate">
              {item[key]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-${color}-500 h-3 rounded-full transition-all duration-300`}
                style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-20 text-sm font-medium text-gray-900 text-right">
              {formatMoney(item[valueKey])}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Generate report data based on selected report type
  const generateReportData = () => {
    switch (selectedReport) {
      case 'products':
        // Group by products
        const productData: { [key: string]: { name: string; total: number; quantity: number } } = {};
        sales.forEach(sale => {
          sale.lats_sale_items?.forEach(item => {
            const productKey = item.product_id;
            if (!productData[productKey]) {
              productData[productKey] = { name: `Product ${productKey.slice(0, 8)}...`, total: 0, quantity: 0 };
            }
            productData[productKey].total += item.total_price;
            productData[productKey].quantity += item.quantity;
          });
        });
        return Object.values(productData).sort((a, b) => b.total - a.total);

      case 'customers':
        // Group by customers
        const customerData: { [key: string]: { name: string; total: number; orders: number } } = {};
        sales.forEach(sale => {
          const customerKey = sale.customer_id || 'walk-in';
          if (!customerData[customerKey]) {
            customerData[customerKey] = { 
              name: customerKey === 'walk-in' ? 'Walk-in Customers' : `Customer ${customerKey.slice(0, 8)}...`, 
              total: 0, 
              orders: 0 
            };
          }
          customerData[customerKey].total += sale.total_amount;
          customerData[customerKey].orders += 1;
        });
        return Object.values(customerData).sort((a, b) => b.total - a.total);

      case 'payments':
        // Group by payment methods
        const paymentData: { [key: string]: { name: string; total: number; count: number } } = {};
        sales.forEach(sale => {
          const paymentMethod = getPaymentMethodDisplay(sale.payment_method);
          if (!paymentData[paymentMethod]) {
            paymentData[paymentMethod] = { name: paymentMethod, total: 0, count: 0 };
          }
          paymentData[paymentMethod].total += sale.total_amount;
          paymentData[paymentMethod].count += 1;
        });
        return Object.values(paymentData).sort((a, b) => b.total - a.total);

      default:
        return [];
    }
  };

  // Export report functionality
  const exportReport = () => {
    const reportData = generateReportData();
    const csvContent = [
      ['Report Type', selectedReport],
      ['Period', selectedPeriod],
      ['Date Range', `${dateRange.start} to ${dateRange.end}`],
      ['Generated', new Date().toLocaleString()],
      [''],
      ...(selectedReport === 'products' ? 
        [['Product', 'Total Sales', 'Quantity Sold']] :
        selectedReport === 'customers' ?
        [['Customer', 'Total Spent', 'Orders']] :
        selectedReport === 'payments' ?
        [['Payment Method', 'Total Amount', 'Transaction Count']] :
        [['Date', 'Sales', 'Transactions']]
      ),
      ...reportData.map(item => 
        selectedReport === 'products' ? 
          [item.name, item.total, item.quantity] :
          selectedReport === 'customers' ?
          [item.name, item.total, item.orders] :
          selectedReport === 'payments' ?
          [item.name, item.total, item.count] :
          [item.name, item.total]
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${selectedReport}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <PageHeader
        title="Sales Reports - Customer Care"
        subtitle="Daily sales monitoring and closing for customer care operations"
        className="mb-6"
      />

      {/* Daily Status Banner */}
      <div className="mb-6">
        {isDailyClosed ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Daily Sales Closed</h3>
                <p className="text-sm text-green-600">
                  Closed on {dailyCloseTime ? new Date(dailyCloseTime).toLocaleString() : 'Today'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Locked</span>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">Daily Sales Open</h3>
                <p className="text-sm text-orange-600">
                  Review and close today's sales when ready
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Open</span>
            </div>
          </div>
        )}
      </div>

      {/* Customer Care Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Refresh Today's Sales</h3>
              <p className="text-sm text-blue-600">Get latest sales data</p>
            </div>
          </div>
          <GlassButton
            variant="primary"
            onClick={fetchSales}
            disabled={loading}
            className="w-full mt-3"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Now'}
          </GlassButton>
        </GlassCard>

        <GlassCard className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Export Daily Report</h3>
              <p className="text-sm text-green-600">Download today's summary</p>
            </div>
          </div>
          <GlassButton
            variant="primary"
            onClick={exportDailyReport}
            className="w-full mt-3 bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </GlassButton>
        </GlassCard>

        <GlassCard className={`p-4 border-2 ${isDailyClosed ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300' : 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-300'}`}>
          <div className="flex items-center gap-3">
            {isDailyClosed ? (
              <Lock className="w-8 h-8 text-gray-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-orange-600" />
            )}
            <div>
              <h3 className={`font-semibold ${isDailyClosed ? 'text-gray-800' : 'text-orange-800'}`}>
                {isDailyClosed ? 'Daily Sales Closed' : 'Close Daily Sales'}
              </h3>
              <p className={`text-sm ${isDailyClosed ? 'text-gray-600' : 'text-orange-600'}`}>
                {isDailyClosed ? 'Sales locked for today' : 'Finalize today\'s sales'}
              </p>
            </div>
          </div>
          {!isDailyClosed && (
            <GlassButton
              variant="primary"
              onClick={() => setShowCloseConfirm(true)}
              disabled={isClosing}
              className="w-full mt-3 bg-orange-600 hover:bg-orange-700"
            >
              {isClosing ? 'Closing...' : '🔒 Close Day'}
            </GlassButton>
          )}
        </GlassCard>
      </div>

      {/* Report Controls */}
      <GlassCard className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              disabled={isDailyClosed}
            >
              <option value="daily">Daily Sales</option>
              <option value="products">Product Performance</option>
              <option value="customers">Customer Analysis</option>
              <option value="payments">Payment Methods</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              disabled={isDailyClosed}
            >
              <option value="1d">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              disabled={isDailyClosed}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              disabled={isDailyClosed}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleString()}
            {isDailyClosed && <span className="ml-2 text-green-600 font-medium">• Daily Sales Closed</span>}
          </div>
          <div className="flex space-x-2">
            <GlassButton
              variant="secondary"
              onClick={fetchSales}
              disabled={loading || isDailyClosed}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={exportReport}
              disabled={isDailyClosed}
            >
              📊 Export Report
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatMoney(summaryMetrics.totalSales)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-green-600 text-xl">💰</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Period total</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalTransactions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Total orders</span>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalCustomers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-purple-600 text-xl">👥</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Unique customers</span>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order</p>
              <p className="text-2xl font-bold text-gray-900">{formatMoney(summaryMetrics.averageOrder)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-orange-600 text-xl">📈</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Per transaction</span>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-green-600">{summaryMetrics.profitMargin}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-green-600 text-xl">📊</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Total profit: {formatMoney(summaryMetrics.totalProfit)}</span>
          </div>
        </GlassCard>
      </div>

      {/* Report Type Specific Views */}
      {selectedReport !== 'daily' && (
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                {selectedReport === 'products' ? 'Product Performance' :
                 selectedReport === 'customers' ? 'Customer Analysis' :
                 selectedReport === 'payments' ? 'Payment Methods' : 'Report'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedReport === 'products' ? 'Top performing products by sales' :
                 selectedReport === 'customers' ? 'Customer spending analysis' :
                 selectedReport === 'payments' ? 'Payment method breakdown' : 'Report data'}
              </p>
            </div>
          </div>

          {(() => {
            const reportData = generateReportData();
            if (reportData.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p>No data available for {selectedReport} report</p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {selectedReport === 'products' && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Product Sales</h4>
                    {generateChart(reportData, 'name', 'total', 'blue')}
                  </div>
                )}
                
                {selectedReport === 'customers' && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Customer Spending</h4>
                    {generateChart(reportData, 'name', 'total', 'green')}
                  </div>
                )}
                
                {selectedReport === 'payments' && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Payment Methods</h4>
                    {generateChart(reportData, 'name', 'total', 'purple')}
                  </div>
                )}
              </div>
            );
          })()}
        </GlassCard>
      )}

      {/* Sales List */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {selectedReport === 'daily' ? 'Sales Transactions' : 'Detailed Sales List'} ({sales.length})
            </h3>
            {sales.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Showing sales for {selectedPeriod === '1d' ? 'today' : 
                  selectedPeriod === '7d' ? 'last 7 days' :
                  selectedPeriod === '30d' ? 'last 30 days' :
                  selectedPeriod === '90d' ? 'last 90 days' : 
                  selectedPeriod === 'custom' ? 'custom range' : 'selected period'}
              </p>
            )}
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Loading...
            </div>
          )}
        </div>

        {error ? (
          <div className="text-center py-8">
            <div className="text-red-500 text-lg mb-2">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchSales}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <p>No sales found for {selectedPeriod === '1d' ? 'today' : 
              selectedPeriod === '7d' ? 'the last 7 days' :
              selectedPeriod === '30d' ? 'the last 30 days' :
              selectedPeriod === '90d' ? 'the last 90 days' : 'the selected period'}</p>
            <p className="text-sm mt-2">Try selecting a different time period or view all sales</p>
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={() => {
                  console.log('🔍 Loading all sales...');
                  fetchAllSales();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Show All Sales
              </button>
              <button
                onClick={() => setSelectedPeriod('90d')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Try 90 Days
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <div
                key={sale.id}
                onClick={() => handleSaleClick(sale)}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-600">#{sale.sale_number}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                          sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sale.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(sale.created_at)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {sale.customer_id ? `Customer: ${sale.customer_id.slice(0, 8)}...` : 'Walk-in Customer'}
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        {getPaymentMethodDisplay(sale.payment_method)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Cashier:</span>
                        {sale.created_by ? `User: ${sale.created_by.slice(0, 8)}...` : 'System'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      {formatMoney(sale.total_amount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {sale.lats_sale_items?.length || 0} items
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Quick Actions */}
      <div className="mt-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="text-blue-600 text-2xl mb-2">📊</div>
              <div className="font-medium text-gray-900">Export PDF</div>
              <div className="text-sm text-gray-600">Download as PDF</div>
            </button>
            <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <div className="text-green-600 text-2xl mb-2">📈</div>
              <div className="font-medium text-gray-900">Schedule Report</div>
              <div className="text-sm text-gray-600">Auto-generate reports</div>
            </button>
            <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="text-purple-600 text-2xl mb-2">📧</div>
              <div className="font-medium text-gray-900">Email Report</div>
              <div className="text-sm text-gray-600">Send via email</div>
            </button>
            <button className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
              <div className="text-orange-600 text-2xl mb-2">⚙️</div>
              <div className="font-medium text-gray-900">Report Settings</div>
              <div className="text-sm text-gray-600">Configure reports</div>
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <SaleDetailsModal
          isOpen={showSaleModal}
          onClose={() => {
            setShowSaleModal(false);
            setSelectedSale(null);
          }}
          saleId={selectedSale.id}
        />
      )}

      {/* Daily Closing Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GlassCard className="max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Close Daily Sales?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                This will finalize today's sales and lock the data. You won't be able to make changes after closing.
              </p>
              
              {/* Daily Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-medium text-gray-900 mb-2">Today's Summary:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Sales:</span>
                    <span className="font-medium">{formatMoney(summaryMetrics.totalSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transactions:</span>
                    <span className="font-medium">{summaryMetrics.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customers:</span>
                    <span className="font-medium">{summaryMetrics.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Order:</span>
                    <span className="font-medium">{formatMoney(summaryMetrics.averageOrder)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isClosing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDailyClose}
                  disabled={isClosing}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {isClosing ? 'Closing...' : 'Close Day'}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default SalesReportsPage;
