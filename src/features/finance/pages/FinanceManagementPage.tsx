import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { useNavigationHistory } from '../../../hooks/useNavigationHistory';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Plus, 
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Download,
  Search,
  Smartphone,
  Receipt,
  Wrench,
  Tag,
  Calendar
} from 'lucide-react';
import { usePayments } from '../../../context/PaymentsContext';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../lib/customerApi';
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

interface Expense {
  id: string;
  title: string;
  account_id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: 'cash' | 'card' | 'transfer';
  status: 'pending' | 'approved' | 'rejected';
  receipt_url?: string;
  created_at: string;
}

const FinanceManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { handleBackClick } = useNavigationHistory();
  const { 
    payments, 
    loading: paymentsLoading, 
    refreshPayments,
    getTotalRevenue,
    getRevenueBySource
  } = usePayments();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  // Expense state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    account_id: '',
    category: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash' as 'cash' | 'card' | 'transfer',
    status: 'pending' as 'pending' | 'approved' | 'rejected'
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await loadExpenses();
      } catch (error) {
        console.error('Error loading finance data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('Error loading expenses:', error);
      } else {
        setExpenses(data || []);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title || !expenseForm.category || !expenseForm.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    const amount = parseFloat(expenseForm.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('finance_expenses')
        .insert([{
          title: expenseForm.title,
          account_id: expenseForm.account_id || null,
          category: expenseForm.category,
          amount: amount,
          description: expenseForm.description,
          expense_date: expenseForm.expense_date,
          payment_method: expenseForm.payment_method,
          status: expenseForm.status,
          receipt_url: null,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      await loadExpenses();
      setShowAddExpense(false);
      setExpenseForm({
        title: '',
        account_id: '',
        category: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        status: 'pending'
      });
      toast.success('Expense added successfully');
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast.error(error.message || 'Failed to add expense');
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterMethod !== 'all' && p.method !== filterMethod) return false;
    if (filterStart && new Date(p.payment_date) < new Date(filterStart)) return false;
    if (filterEnd && new Date(p.payment_date) > new Date(filterEnd)) return false;
    return true;
  });

  // Get revenue breakdown by source
  const revenueBySource = getRevenueBySource();

  // Chart data preparation
  const getPaymentMethodData = () => {
    const methodCounts = payments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methodCounts).map(([method, count]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: count,
      color: getPaymentMethodColor(method)
    }));
  };

  const getPaymentStatusData = () => {
    const statusCounts = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: getStatusColor(status)
    }));
  };

  const getPaymentSourceData = () => {
    const sourceData = [
      { name: 'Device Payments', value: revenueBySource.devicePayments, color: '#3B82F6' },
      { name: 'Repair Payments', value: revenueBySource.repairPayments, color: '#F59E0B' }
    ];
    return sourceData.filter(item => item.value > 0);
  };

  const getPaymentMethodColor = (method: string): string => {
    switch (method) {
      case 'cash': return '#10B981';
      case 'card': return '#3B82F6';
      case 'transfer': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading || paymentsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
        <div className="text-blue-700 font-semibold">Loading finance data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="flex items-center gap-3">
              <DollarSign size={24} className="text-green-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Finance Management</h1>
                <p className="text-xs text-gray-500">Manage accounts, payments & financial overview</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <GlassButton
              variant="primary"
              onClick={() => navigate('/payments-accounts')}
              className="text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              <Wallet size={16} />
              Manage Accounts
            </GlassButton>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'summary', label: 'Summary', icon: TrendingUp },
          { id: 'payments', label: 'Payments', icon: CreditCard },
          { id: 'expenses', label: 'Expenses', icon: Receipt }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Revenue Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(getTotalRevenue())}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Device Payments</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(revenueBySource.devicePayments)}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </GlassCard>



            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Repair Payments</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(revenueBySource.repairPayments)}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wrench className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Source Distribution */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Source</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={getPaymentSourceData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  >
                    {getPaymentSourceData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Payment Method Distribution */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={getPaymentMethodData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => value} />
                  <Bar dataKey="value" fill="#8884d8" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>

          {/* Basic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed Payments</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {payments.filter(p => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Payments</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {payments.filter(p => p.status === 'pending').length}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Failed Payments</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {payments.filter(p => p.status === 'failed').length}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Filters */}
          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)} 
                className="text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              
              <select 
                value={filterMethod} 
                onChange={e => setFilterMethod(e.target.value)} 
                className="text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
              </select>
              
              <input 
                type="date" 
                value={filterStart} 
                onChange={e => setFilterStart(e.target.value)} 
                className="text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white"
                placeholder="Start Date"
              />
              
              <input 
                type="date" 
                value={filterEnd} 
                onChange={e => setFilterEnd(e.target.value)} 
                className="text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white"
                placeholder="End Date"
              />

              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterMethod('all');
                  setFilterStart('');
                  setFilterEnd('');
                }}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                Clear Filters
              </button>
            </div>
          </GlassCard>

          {/* Payments List */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Payments ({filteredPayments.length})
              </h3>
              <div className="flex items-center gap-2">
                <GlassButton
                  variant="secondary"
                  onClick={() => {/* Export functionality */}}
                  className="text-sm"
                >
                  <Download size={16} />
                  Export
                </GlassButton>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Customer</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Method</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{payment.customer_name || 'Unknown'}</p>
                          {payment.device_name && (
                            <p className="text-xs text-gray-500">{payment.device_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 capitalize">{payment.method}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 ${
                          payment.status === 'completed' ? 'text-green-600' :
                          payment.status === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {payment.status === 'completed' ? <CheckCircle size={16} /> :
                           payment.status === 'pending' ? <Clock size={16} /> :
                           <XCircle size={16} />}
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => {/* Show payment details */}}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Expenses Management</h2>
            <GlassButton onClick={() => setShowAddExpense(true)}>
              <Plus size={16} />
              Add Expense
            </GlassButton>
          </div>
          
          <div className="space-y-4">
            {expenses.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                <p className="text-gray-500 mb-4">Add your first expense to get started</p>
                <GlassButton onClick={() => setShowAddExpense(true)}>
                  <Plus size={16} />
                  Add First Expense
                </GlassButton>
              </GlassCard>
            ) : (
              expenses.map((expense) => (
                <GlassCard key={expense.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{expense.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                          expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {expense.status === 'approved' ? '✅ Approved' :
                           expense.status === 'pending' ? '⏳ Pending' :
                           '❌ Rejected'}
                        </span>
                      </div>
                      
                      {expense.description && (
                        <p className="text-gray-600 text-sm mb-3">{expense.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Tag size={16} />
                          <span>{expense.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} />
                          <span className="capitalize">{expense.payment_method}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-red-600 mb-2">{formatCurrency(expense.amount)}</p>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Receipt size={20} />
              Add New Expense
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={e => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="Expense title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={e => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  rows={3}
                  placeholder="Expense description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={expenseForm.category}
                  onChange={e => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g., Office Supplies"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={e => setExpenseForm(prev => ({ ...prev, expense_date: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={expenseForm.payment_method}
                  onChange={e => setExpenseForm(prev => ({ ...prev, payment_method: e.target.value as 'cash' | 'card' | 'transfer' }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="transfer">🏦 Transfer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={expenseForm.status}
                  onChange={e => setExpenseForm(prev => ({ ...prev, status: e.target.value as 'pending' | 'approved' | 'rejected' }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setShowAddExpense(false);
                  setExpenseForm({
                    title: '',
                    account_id: '',
                    category: '',
                    amount: '',
                    description: '',
                    expense_date: new Date().toISOString().split('T')[0],
                    payment_method: 'cash',
                    status: 'pending'
                  });
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleAddExpense}
              >
                Add Expense
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManagementPage; 