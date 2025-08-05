import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Filter, 
  Download,
  Search,
  Calendar,
  CreditCard,
  Smartphone,
  Building,
  Truck,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Zap,
  Shield,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Receipt,
  Tag,
  Star,
  TrendingDown,
  ArrowUpDown,
  Calculator,
  Calendar as CalendarIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Download as DownloadIcon,
  BarChart3 as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity as ActivityIcon,
  Target as TargetIcon,
  Zap as ZapIcon,
  Shield as ShieldIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  RefreshCw as RefreshCwIcon,
  Plus as PlusIcon,
  Edit as EditIcon,
  Trash2 as Trash2Icon,
  Eye as EyeIcon,
  FileText as FileTextIcon,
  Receipt as ReceiptIcon,
  Tag as TagIcon,
  Star as StarIcon,
  TrendingDown as TrendingDownIcon,
  ArrowUpDown as ArrowUpDownIcon,
  Calculator as CalculatorIcon
} from 'lucide-react';
import { formatCurrency } from '../lib/customerApi';
import { formatRelativeTime } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  Legend
} from 'recharts';

interface POSSale {
  id: string;
  customer_id: string;
  customer_name?: string;
  order_date: string;
  status: 'pending' | 'completed' | 'on_hold' | 'cancelled' | 'partially_paid' | 'delivered' | 'payment_on_delivery';
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  shipping_cost: number;
  final_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'installment' | 'payment_on_delivery';
  customer_type: 'retail' | 'wholesale';
  delivery_address?: string;
  delivery_city?: string;
  delivery_method?: 'local_transport' | 'air_cargo' | 'bus_cargo' | 'pickup';
  delivery_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface POSSalesSummary {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  completedSales: number;
  pendingSales: number;
  cancelledSales: number;
  todaySales: number;
  thisWeekSales: number;
  thisMonthSales: number;
}

const POSSalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<POSSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterCustomerType, setFilterCustomerType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [summary, setSummary] = useState<POSSalesSummary | null>(null);

  useEffect(() => {
    loadPOSSales();
  }, []);

  const loadPOSSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          customers(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading POS sales:', error);
        toast.error('Failed to load POS sales');
        return;
      }

      const transformedSales = (data || []).map((sale: any) => ({
        ...sale,
        customer_name: sale.customers?.name || 'Unknown Customer'
      }));

      setSales(transformedSales);
      calculateSummary(transformedSales);
    } catch (error) {
      console.error('Error loading POS sales:', error);
      toast.error('Failed to load POS sales');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (salesData: POSSale[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const summary: POSSalesSummary = {
      totalSales: salesData.length,
      totalRevenue: salesData.reduce((sum, sale) => sum + sale.final_amount, 0),
      averageOrderValue: salesData.length > 0 ? salesData.reduce((sum, sale) => sum + sale.final_amount, 0) / salesData.length : 0,
      completedSales: salesData.filter(sale => sale.status === 'completed').length,
      pendingSales: salesData.filter(sale => sale.status === 'pending').length,
      cancelledSales: salesData.filter(sale => sale.status === 'cancelled').length,
      todaySales: salesData.filter(sale => new Date(sale.order_date) >= today).length,
      thisWeekSales: salesData.filter(sale => new Date(sale.order_date) >= weekAgo).length,
      thisMonthSales: salesData.filter(sale => new Date(sale.order_date) >= monthAgo).length
    };

    setSummary(summary);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'on_hold': return 'text-orange-600 bg-orange-100';
      case 'partially_paid': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Cash className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'transfer': return <Building className="w-4 h-4" />;
      case 'installment': return <Calculator className="w-4 h-4" />;
      case 'payment_on_delivery': return <Truck className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getDeliveryMethodIcon = (method?: string) => {
    switch (method) {
      case 'local_transport': return <Truck className="w-4 h-4" />;
      case 'air_cargo': return <Package className="w-4 h-4" />;
      case 'bus_cargo': return <Building className="w-4 h-4" />;
      case 'pickup': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const filteredSales = sales.filter(sale => {
    // Status filter
    if (filterStatus !== 'all' && sale.status !== filterStatus) return false;
    
    // Payment method filter
    if (filterPaymentMethod !== 'all' && sale.payment_method !== filterPaymentMethod) return false;
    
    // Customer type filter
    if (filterCustomerType !== 'all' && sale.customer_type !== filterCustomerType) return false;
    
    // Search query
    if (searchQuery && !sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Date range filter
    if (dateRange !== 'all') {
      const saleDate = new Date(sale.order_date);
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (saleDate < today) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (saleDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          if (saleDate < monthAgo) return false;
          break;
      }
    }
    
    return true;
  });

  const getChartData = () => {
    const statusCounts = sales.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: status === 'completed' ? '#10B981' : 
             status === 'pending' ? '#F59E0B' : 
             status === 'cancelled' ? '#EF4444' : '#6B7280'
    }));
  };

  const getPaymentMethodData = () => {
    const methodCounts = sales.reduce((acc, sale) => {
      acc[sale.payment_method] = (acc[sale.payment_method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methodCounts).map(([method, count]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: count,
      color: method === 'cash' ? '#10B981' : 
             method === 'card' ? '#3B82F6' : 
             method === 'transfer' ? '#8B5CF6' : '#6B7280'
    }));
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Date', 'Status', 'Total Amount', 'Final Amount', 'Payment Method', 'Customer Type'];
    const csvContent = [
      headers.join(','),
      ...filteredSales.map(sale => [
        sale.id,
        sale.customer_name,
        sale.order_date,
        sale.status,
        sale.total_amount,
        sale.final_amount,
        sale.payment_method,
        sale.customer_type
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-sales-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('POS sales exported to CSV');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <GlassButton
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </GlassButton>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <ShoppingCart className="w-8 h-8 text-blue-600" />
                POS Sales
              </h1>
              <p className="text-gray-600 mt-1">View and manage all POS sales transactions</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <GlassButton
              onClick={exportToCSV}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </GlassButton>
            <GlassButton
              onClick={loadPOSSales}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </GlassButton>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalSales}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.averageOrderValue)}</p>
                </div>
                <Calculator className="w-8 h-8 text-purple-600" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.completedSales}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </GlassCard>
          </div>
        )}

        {/* Filters */}
        <GlassCard className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="on_hold">On Hold</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
                <option value="installment">Installment</option>
                <option value="payment_on_delivery">Payment on Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
              <select
                value={filterCustomerType}
                onChange={(e) => setFilterCustomerType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Customer</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={getChartData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {getChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={getPaymentMethodData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Sales Table */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">POS Sales ({filteredSales.length})</h3>
            <div className="text-sm text-gray-600">
              Showing {filteredSales.length} of {sales.length} sales
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sale.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                        {sale.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(sale.final_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {getPaymentMethodIcon(sale.payment_method)}
                        <span>{sale.payment_method.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="capitalize">{sale.customer_type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/pos-sales/${sale.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/pos-sales/${sale.id}/edit`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No POS sales found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {sales.length === 0 ? 'No sales data available.' : 'Try adjusting your filters.'}
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default POSSalesPage; 