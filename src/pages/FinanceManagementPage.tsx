import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Filter, 
  Download,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  BarChart3,
  PiggyBank,
  Receipt,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  PieChart,
  LineChart,
  Activity,
  Target,
  Zap,
  Shield,
  Building,
  CreditCard as CreditCardIcon,
  Save,
  TrendingDown,
  ArrowUpDown,
  Calculator,
  FileText,
  Calendar,
  Search,
  Tag,
  Brain,
  Lightbulb,
  Sparkles,
  Info
} from 'lucide-react';
import { usePayments } from '../context/PaymentsContext';
import { useAuth } from '../context/AuthContext';
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
import geminiService from '../services/geminiService';

interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'mobile_money' | 'credit_card' | 'savings' | 'investment' | 'other';
  balance: number;
  account_number?: string;
  bank_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Transfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description: string;
  created_at: string;
}

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

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface FinanceSummary {
  totalRevenue: number;
  totalOutstanding: number;
  totalAccounts: number;
  monthlyRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  totalBalance: number;
  averageTransaction: number;
  totalExpenses: number;
  monthlyExpenses: number;
  pendingExpenses: number;
  approvedExpenses: number;
  netProfit: number;
  monthlyProfit: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const FinanceManagementPage: React.FC = () => {
  const { payments, loading: paymentsLoading, refreshPayments } = usePayments();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  // Account form state
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'bank' as Account['type'],
    balance: 0,
    account_number: '',
    bank_name: '',
    is_active: true
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash' as 'cash' | 'card' | 'transfer',
    account_id: '',
    customer_id: '',
    device_id: '',
    payment_type: 'payment' as 'payment' | 'deposit' | 'refund',
    notes: ''
  });

  // Filter state
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  
  // Transfer state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBalanceAdjustment, setShowBalanceAdjustment] = useState(false);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transferForm, setTransferForm] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    description: ''
  });
  
  // Balance adjustment state
  const [balanceAdjustmentForm, setBalanceAdjustmentForm] = useState({
    account_id: '',
    adjustment_type: 'add' as 'add' | 'subtract',
    amount: '',
    reason: ''
  });

  // Expense state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  
  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    account_id: '',
    category: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash' as 'cash' | 'card' | 'transfer',
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    receipt_url: ''
  });

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#3B82F6',
    icon: 'receipt',
    budget_limit: '',
    is_active: true
  });

  // Expense filter state
  const [expenseFilterCategory, setExpenseFilterCategory] = useState('all');
  const [expenseFilterStatus, setExpenseFilterStatus] = useState('all');
  const [expenseFilterAccount, setExpenseFilterAccount] = useState('all');
  const [expenseFilterStart, setExpenseFilterStart] = useState('');
  const [expenseFilterEnd, setExpenseFilterEnd] = useState('');

  // Time period filter state
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'>('month');

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<{
    loading: boolean;
    insights: string;
    suggestions: string[];
    category: string;
    riskLevel: 'low' | 'medium' | 'high';
  }>({
    loading: false,
    insights: '',
    suggestions: [],
    category: '',
    riskLevel: 'low'
  });
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    loadAccounts();
    loadTransfers();
    loadExpenses();
    loadExpenseCategories();
  }, []);

  // Helper functions for date filtering
  const getDateRange = (period: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      case 'week':
        start.setDate(now.getDate() - 7);
        return { start, end: now };
      case 'month':
        start.setMonth(now.getMonth() - 1);
        return { start, end: now };
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        return { start, end: now };
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        return { start, end: now };
      case 'all':
        return { start: new Date(0), end: now };
      default:
        return { start, end: now };
    }
  };

  const isInDateRange = (date: string, period: string) => {
    const { start, end } = getDateRange(period);
    const checkDate = new Date(date);
    return checkDate >= start && checkDate <= end;
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading accounts:', error);
        toast.error('Failed to load accounts');
      } else {
        setAccounts(data || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!accountForm.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .insert([{
          ...accountForm,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => [data, ...prev]);
      setShowAddAccount(false);
      setAccountForm({
        name: '',
        type: 'bank',
        balance: 0,
        account_number: '',
        bank_name: '',
        is_active: true
      });
      toast.success('Account added successfully');
    } catch (error: any) {
      console.error('Error adding account:', error);
      toast.error(error.message || 'Failed to add account');
    }
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount || !accountForm.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .update({
          ...accountForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAccount.id)
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? data : acc));
      setEditingAccount(null);
      setAccountForm({
        name: '',
        type: 'bank',
        balance: 0,
        account_number: '',
        bank_name: '',
        is_active: true
      });
      toast.success('Account updated successfully');
    } catch (error: any) {
      console.error('Error updating account:', error);
      toast.error(error.message || 'Failed to update account');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabase
        .from('finance_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      toast.success('Account deleted successfully');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
    }
  };

  const loadTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading transfers:', error);
      } else {
        setTransfers(data || []);
      }
    } catch (error) {
      console.error('Error loading transfers:', error);
    }
  };

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

  const loadExpenseCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_expense_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading expense categories:', error);
      } else {
        setExpenseCategories(data || []);
      }
    } catch (error) {
      console.error('Error loading expense categories:', error);
    }
  };

  // AI Analysis Functions
  const analyzeExpenseWithAI = async (description: string, amount: number, category?: string) => {
    if (!geminiApiKey) {
      toast.error('Please enter your Gemini API key first');
      return;
    }

    setAiAnalysis(prev => ({ ...prev, loading: true }));
    
    try {
      geminiService.setApiKey(geminiApiKey);
      
      const prompt = `Analyze this business expense for a device repair shop:
        Description: ${description}
        Amount: ${formatCurrency(amount)}
        Category: ${category || 'Not specified'}
        
        Please provide:
        1. Business insights about this expense
        2. Suggested category if not specified
        3. Cost optimization suggestions
        4. Risk level (low/medium/high) based on amount and type
        5. 3 actionable recommendations
        
        Format as JSON:
        {
          "insights": "business insights here",
          "suggestedCategory": "category name",
          "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
          "riskLevel": "low/medium/high",
          "recommendations": ["rec1", "rec2", "rec3"]
        }`;

      const response = await geminiService.analyzeExpense(description, amount);
      
      if (response.success) {
        try {
          const analysis = JSON.parse(response.data);
          setAiAnalysis({
            loading: false,
            insights: analysis.insights || 'No insights available',
            suggestions: analysis.suggestions || [],
            category: analysis.suggestedCategory || category || '',
            riskLevel: analysis.riskLevel || 'low'
          });
          setShowAiAnalysis(true);
        } catch (parseError) {
          // If JSON parsing fails, treat as plain text
          setAiAnalysis({
            loading: false,
            insights: response.data,
            suggestions: [],
            category: category || '',
            riskLevel: 'low'
          });
          setShowAiAnalysis(true);
        }
      } else {
        toast.error('AI analysis failed: ' + response.error);
        setAiAnalysis(prev => ({ ...prev, loading: false }));
      }
    } catch (error: any) {
      console.error('AI analysis error:', error);
      toast.error('AI analysis failed: ' + error.message);
      setAiAnalysis(prev => ({ ...prev, loading: false }));
    }
  };

  const analyzeExpenseTrends = async () => {
    if (!geminiApiKey) {
      toast.error('Please enter your Gemini API key first');
      return;
    }

    setAiAnalysis(prev => ({ ...prev, loading: true }));
    
    try {
      geminiService.setApiKey(geminiApiKey);
      
      const recentExpenses = expenses
        .filter(e => e.status === 'approved')
        .slice(0, 10)
        .map(e => `${e.title}: ${formatCurrency(e.amount)} (${e.category})`)
        .join('\n');

      const prompt = `Analyze these recent business expenses for a device repair shop:
        ${recentExpenses}
        
        Total expenses this period: ${formatCurrency(summary.totalExpenses)}
        Total revenue this period: ${formatCurrency(summary.totalRevenue)}
        
        Please provide:
        1. Overall expense trend analysis
        2. Areas of concern or opportunity
        3. Cost optimization recommendations
        4. Budget planning suggestions
        
        Format as JSON:
        {
          "insights": "trend analysis here",
          "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
          "riskLevel": "low/medium/high",
          "recommendations": ["rec1", "rec2", "rec3"]
        }`;

      const response = await geminiService.analyzeExpense('Expense trend analysis', summary.totalExpenses);
      
      if (response.success) {
        try {
          const analysis = JSON.parse(response.data);
          setAiAnalysis({
            loading: false,
            insights: analysis.insights || 'No trend insights available',
            suggestions: analysis.suggestions || [],
            category: 'Trend Analysis',
            riskLevel: analysis.riskLevel || 'low'
          });
          setShowAiAnalysis(true);
        } catch (parseError) {
          setAiAnalysis({
            loading: false,
            insights: response.data,
            suggestions: [],
            category: 'Trend Analysis',
            riskLevel: 'low'
          });
          setShowAiAnalysis(true);
        }
      } else {
        toast.error('AI trend analysis failed: ' + response.error);
        setAiAnalysis(prev => ({ ...prev, loading: false }));
      }
    } catch (error: any) {
      console.error('AI trend analysis error:', error);
      toast.error('AI trend analysis failed: ' + error.message);
      setAiAnalysis(prev => ({ ...prev, loading: false }));
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertCircle size={16} className="text-red-600" />;
      case 'medium': return <Clock size={16} className="text-yellow-600" />;
      case 'low': return <CheckCircle size={16} className="text-green-600" />;
      default: return <Info size={16} className="text-gray-600" />;
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || !paymentForm.account_id) {
      toast.error('Amount and account are required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customer_payments')
        .insert([{
          customer_id: paymentForm.customer_id,
          amount: parseFloat(paymentForm.amount),
          method: paymentForm.method,
          device_id: paymentForm.device_id || null,
          payment_date: new Date().toISOString(),
          payment_type: paymentForm.payment_type,
          status: 'completed',
          created_at: new Date().toISOString(),
          notes: paymentForm.notes
        }])
        .select()
        .single();

      if (error) throw error;

      await refreshPayments();
      setShowAddPayment(false);
      setPaymentForm({
        amount: '',
        method: 'cash',
        account_id: '',
        customer_id: '',
        device_id: '',
        payment_type: 'payment',
        notes: ''
      });
      toast.success('Payment added successfully');
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast.error(error.message || 'Failed to add payment');
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.from_account_id || !transferForm.to_account_id || !transferForm.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    if (transferForm.from_account_id === transferForm.to_account_id) {
      toast.error('Cannot transfer to the same account');
      return;
    }

    const amount = parseFloat(transferForm.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    const fromAccount = accounts.find(acc => acc.id === transferForm.from_account_id);
    if (!fromAccount || fromAccount.balance < amount) {
      toast.error('Insufficient balance in source account');
      return;
    }

    try {
      // Create transfer record
      const { data: transferData, error: transferError } = await supabase
        .from('finance_transfers')
        .insert([{
          from_account_id: transferForm.from_account_id,
          to_account_id: transferForm.to_account_id,
          amount: amount,
          description: transferForm.description,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (transferError) throw transferError;

      // Update account balances
      const { error: updateError } = await supabase
        .from('finance_accounts')
        .update({ 
          balance: fromAccount.balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', transferForm.from_account_id);

      if (updateError) throw updateError;

      const toAccount = accounts.find(acc => acc.id === transferForm.to_account_id);
      if (toAccount) {
        await supabase
          .from('finance_accounts')
          .update({ 
            balance: toAccount.balance + amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', transferForm.to_account_id);
      }

      await loadAccounts();
      await loadTransfers();
      setShowTransferModal(false);
      setTransferForm({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        description: ''
      });
      toast.success('Transfer completed successfully');
    } catch (error: any) {
      console.error('Error processing transfer:', error);
      toast.error(error.message || 'Failed to process transfer');
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!balanceAdjustmentForm.account_id || !balanceAdjustmentForm.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    const amount = parseFloat(balanceAdjustmentForm.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    const account = accounts.find(acc => acc.id === balanceAdjustmentForm.account_id);
    if (!account) {
      toast.error('Account not found');
      return;
    }

    try {
      const newBalance = balanceAdjustmentForm.adjustment_type === 'add' 
        ? account.balance + amount 
        : account.balance - amount;

      if (newBalance < 0) {
        toast.error('Insufficient balance for adjustment');
        return;
      }

      const { error } = await supabase
        .from('finance_accounts')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', balanceAdjustmentForm.account_id);

      if (error) throw error;

      await loadAccounts();
      setShowBalanceAdjustment(false);
      setBalanceAdjustmentForm({
        account_id: '',
        adjustment_type: 'add',
        amount: '',
        reason: ''
      });
      toast.success('Balance adjusted successfully');
    } catch (error: any) {
      console.error('Error adjusting balance:', error);
      toast.error(error.message || 'Failed to adjust balance');
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title || !expenseForm.account_id || !expenseForm.category || !expenseForm.amount) {
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
          account_id: expenseForm.account_id,
          category: expenseForm.category,
          amount: amount,
          description: expenseForm.description,
          expense_date: expenseForm.expense_date,
          payment_method: expenseForm.payment_method,
          status: expenseForm.status,
          receipt_url: expenseForm.receipt_url || null,
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
        status: 'pending',
        receipt_url: ''
      });
      toast.success('Expense added successfully');
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast.error(error.message || 'Failed to add expense');
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || !expenseForm.title || !expenseForm.account_id || !expenseForm.category || !expenseForm.amount) {
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
        .update({
          title: expenseForm.title,
          account_id: expenseForm.account_id,
          category: expenseForm.category,
          amount: amount,
          description: expenseForm.description,
          expense_date: expenseForm.expense_date,
          payment_method: expenseForm.payment_method,
          status: expenseForm.status,
          receipt_url: expenseForm.receipt_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingExpense.id)
        .select()
        .single();

      if (error) throw error;

      await loadExpenses();
      setEditingExpense(null);
      setExpenseForm({
        title: '',
        account_id: '',
        category: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        status: 'pending',
        receipt_url: ''
      });
      toast.success('Expense updated successfully');
    } catch (error: any) {
      console.error('Error updating expense:', error);
      toast.error(error.message || 'Failed to update expense');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      account_id: expense.account_id,
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description,
      expense_date: expense.expense_date,
      payment_method: expense.payment_method,
      status: expense.status,
      receipt_url: expense.receipt_url || ''
    });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('finance_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      await loadExpenses();
      toast.success('Expense deleted successfully');
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast.error(error.message || 'Failed to delete expense');
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('finance_expense_categories')
        .insert([{
          name: categoryForm.name,
          color: categoryForm.color,
          icon: categoryForm.icon,
          budget_limit: categoryForm.budget_limit ? parseFloat(categoryForm.budget_limit) : null,
          is_active: categoryForm.is_active,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      await loadExpenseCategories();
      setShowAddCategory(false);
      setCategoryForm({
        name: '',
        color: '#3B82F6',
        icon: 'receipt',
        budget_limit: '',
        is_active: true
      });
      toast.success('Category added successfully');
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast.error(error.message || 'Failed to add category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('finance_expense_categories')
        .update({
          name: categoryForm.name,
          color: categoryForm.color,
          icon: categoryForm.icon,
          budget_limit: categoryForm.budget_limit ? parseFloat(categoryForm.budget_limit) : null,
          is_active: categoryForm.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCategory.id)
        .select()
        .single();

      if (error) throw error;

      await loadExpenseCategories();
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        color: '#3B82F6',
        icon: 'receipt',
        budget_limit: '',
        is_active: true
      });
      toast.success('Category updated successfully');
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast.error(error.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('finance_expense_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      await loadExpenseCategories();
      toast.success('Category deleted successfully');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
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

  // Filter expenses based on filters
  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = expenseFilterCategory === 'all' || expense.category === expenseFilterCategory;
    const matchesStatus = expenseFilterStatus === 'all' || expense.status === expenseFilterStatus;
    const matchesAccount = expenseFilterAccount === 'all' || expense.account_id === expenseFilterAccount;
    
    let matchesDate = true;
    if (expenseFilterStart && expenseFilterEnd) {
      const expenseDate = new Date(expense.expense_date);
      const startDate = new Date(expenseFilterStart);
      const endDate = new Date(expenseFilterEnd);
      matchesDate = expenseDate >= startDate && expenseDate <= endDate;
    } else if (expenseFilterStart) {
      const expenseDate = new Date(expense.expense_date);
      const startDate = new Date(expenseFilterStart);
      matchesDate = expenseDate >= startDate;
    } else if (expenseFilterEnd) {
      const expenseDate = new Date(expense.expense_date);
      const endDate = new Date(expenseFilterEnd);
      matchesDate = expenseDate <= endDate;
    }
    
    return matchesCategory && matchesStatus && matchesAccount && matchesDate;
  });

  // Calculate summary with time period filter
  const summary: FinanceSummary = {
    totalRevenue: payments.filter(p => p.status === 'completed' && isInDateRange(p.payment_date, timePeriod)).reduce((sum, p) => sum + (p.amount || 0), 0),
    totalOutstanding: payments.filter(p => p.status === 'pending' && isInDateRange(p.payment_date, timePeriod)).reduce((sum, p) => sum + (p.amount || 0), 0),
    totalAccounts: accounts.length,
    monthlyRevenue: payments
      .filter(p => p.status === 'completed' && isInDateRange(p.payment_date, timePeriod))
      .reduce((sum, p) => sum + (p.amount || 0), 0),
    pendingPayments: payments.filter(p => p.status === 'pending' && isInDateRange(p.payment_date, timePeriod)).length,
    completedPayments: payments.filter(p => p.status === 'completed' && isInDateRange(p.payment_date, timePeriod)).length,
    totalBalance: accounts.reduce((sum, acc) => sum + acc.balance, 0),
    averageTransaction: payments.filter(p => p.status === 'completed' && isInDateRange(p.payment_date, timePeriod)).length > 0 ? payments.filter(p => p.status === 'completed' && isInDateRange(p.payment_date, timePeriod)).reduce((sum, p) => sum + (p.amount || 0), 0) / payments.filter(p => p.status === 'completed' && isInDateRange(p.payment_date, timePeriod)).length : 0,
    totalExpenses: expenses.filter(e => e.status === 'approved' && isInDateRange(e.expense_date, timePeriod)).reduce((sum, e) => sum + e.amount, 0),
    monthlyExpenses: expenses
      .filter(e => e.status === 'approved' && isInDateRange(e.expense_date, timePeriod))
      .reduce((sum, e) => sum + e.amount, 0),
    pendingExpenses: expenses.filter(e => e.status === 'pending' && isInDateRange(e.expense_date, timePeriod)).length,
    approvedExpenses: expenses.filter(e => e.status === 'approved' && isInDateRange(e.expense_date, timePeriod)).length,
    netProfit: (payments.filter(p => p.status === 'completed' && isInDateRange(p.payment_date, timePeriod)).reduce((sum, p) => sum + (p.amount || 0), 0)) - (expenses.filter(e => e.status === 'approved' && isInDateRange(e.expense_date, timePeriod)).reduce((sum, e) => sum + e.amount, 0)),
    monthlyProfit: (payments
      .filter(p => p.status === 'completed' && isInDateRange(p.payment_date, timePeriod))
      .reduce((sum, p) => sum + (p.amount || 0), 0)) - (expenses
      .filter(e => e.status === 'approved' && isInDateRange(e.expense_date, timePeriod))
      .reduce((sum, e) => sum + e.amount, 0))
  };

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="inline text-green-600" size={16} />;
    if (status === 'pending') return <Clock className="inline text-yellow-500" size={16} />;
    if (status === 'failed') return <XCircle className="inline text-red-600" size={16} />;
    return null;
  };

  // Chart data preparation
  const getAccountBalanceData = (): ChartData[] => {
    return accounts.map(account => ({
      name: account.name,
      value: account.balance,
      color: getAccountTypeColor(account.type)
    }));
  };

  const getPaymentMethodData = (): ChartData[] => {
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

  const getPaymentStatusData = (): ChartData[] => {
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

  const getExpenseCategoryData = (): ChartData[] => {
    console.log('🔍 getExpenseCategoryData - expenses:', expenses.length);
    console.log('🔍 getExpenseCategoryData - timePeriod:', timePeriod);
    
    const categoryTotals = expenses
      .filter(e => e.status === 'approved' && isInDateRange(e.expense_date, timePeriod))
      .reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

    const result = Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount,
      color: getCategoryColor(category)
    }));
    
    console.log('🔍 getExpenseCategoryData - result:', result);
    return result;
  };

  const getExpenseStatusData = (): ChartData[] => {
    console.log('🔍 getExpenseStatusData - expenses:', expenses.length);
    
    const statusCounts = expenses
      .filter(e => isInDateRange(e.expense_date, timePeriod))
      .reduce((acc, expense) => {
        acc[expense.status] = (acc[expense.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const result = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: getExpenseStatusColor(status)
    }));
    
    console.log('🔍 getExpenseStatusData - result:', result);
    return result;
  };

  const getMonthlyExpenseData = () => {
    console.log('🔍 getMonthlyExpenseData - expenses:', expenses.length);
    
    const monthlyData = expenses
      .filter(e => e.status === 'approved' && isInDateRange(e.expense_date, timePeriod))
      .reduce((acc, expense) => {
        const month = new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short' });
        acc[month] = (acc[month] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

    const result = Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      expenses: amount
    }));
    
    console.log('🔍 getMonthlyExpenseData - result:', result);
    return result;
  };

  const getCategoryColor = (category: string): string => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    const index = category.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getExpenseStatusColor = (status: string): string => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };



  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'quarter': return 'Last 3 Months';
      case 'year': return 'Last Year';
      case 'all': return 'All Time';
      default: return 'Last 30 Days';
    }
  };

  const getMonthlyRevenueData = () => {
    const monthlyData = payments
      .filter(p => p.status === 'completed' && isInDateRange(p.payment_date, timePeriod))
      .reduce((acc, payment) => {
        const month = new Date(payment.payment_date).toLocaleDateString('en-US', { month: 'short' });
        acc[month] = (acc[month] || 0) + (payment.amount || 0);
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      revenue: amount
    }));
  };

  const getAccountTypeColor = (type: Account['type']): string => {
    switch (type) {
      case 'bank': return '#3B82F6';
      case 'cash': return '#10B981';
      case 'mobile_money': return '#8B5CF6';
      case 'credit_card': return '#F59E0B';
      case 'savings': return '#06B6D4';
      case 'investment': return '#84CC16';
      default: return '#6B7280';
    }
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

  const accountTypeIcon = (type: Account['type']) => {
    switch (type) {
      case 'bank': return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'cash': return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'mobile_money': return <Smartphone className="w-5 h-5 text-purple-600" />;
      case 'credit_card': return <CreditCardIcon className="w-5 h-5 text-amber-600" />;
      case 'savings': return <Save className="w-5 h-5 text-cyan-600" />;
      case 'investment': return <TrendingUp className="w-5 h-5 text-lime-600" />;
      default: return <Wallet className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
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
          <div className="flex items-center gap-3">
            <DollarSign size={24} className="text-green-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Finance Management</h1>
              <p className="text-xs text-gray-500">Manage accounts, payments & financial overview</p>
            </div>
          </div>
          <div className="flex gap-2">
            <GlassButton
              variant="secondary"
              onClick={() => setShowTransferModal(true)}
              className="text-sm"
            >
              <ArrowRight size={16} />
              Transfer
            </GlassButton>
            <GlassButton
              variant="secondary"
              onClick={() => setShowBalanceAdjustment(true)}
              className="text-sm"
            >
              <Calculator size={16} />
              Adjust Balance
            </GlassButton>
            <GlassButton
              variant="secondary"
              onClick={() => setShowAddPayment(true)}
              className="text-sm"
            >
              <Plus size={16} />
              Add Payment
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={() => setShowAddAccount(true)}
              className="text-sm"
            >
              <Plus size={16} />
              Add Account
            </GlassButton>
          </div>
        </div>
      </div>

      {/* Time Period Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-blue-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Time Period</h3>
            <p className="text-xs text-gray-500">Filter data by time range</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as any)}
            className="text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'summary', label: 'Summary', icon: BarChart3 },
          { id: 'accounts', label: 'Accounts', icon: Wallet },
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
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Essential Cards - Always Show */}
            <GlassCard className="bg-gradient-to-br from-green-500/10 to-green-400/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Revenue ({getPeriodLabel(timePeriod)})</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(summary.totalRevenue)}</p>
                  <p className="text-xs text-green-600">{getPeriodLabel(timePeriod)} earnings</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-red-500/10 to-red-400/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Expenses ({getPeriodLabel(timePeriod)})</p>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(summary.totalExpenses)}</p>
                  <p className="text-xs text-red-600">{getPeriodLabel(timePeriod)} expenses</p>
                </div>
                <Receipt className="w-8 h-8 text-red-600" />
              </div>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-emerald-500/10 to-emerald-400/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Net Profit ({getPeriodLabel(timePeriod)})</p>
                  <p className="text-2xl font-bold text-emerald-900">{formatCurrency(summary.netProfit)}</p>
                  <p className="text-xs text-emerald-600">Revenue - Expenses</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-blue-500/10 to-blue-400/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Balance</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(summary.totalBalance)}</p>
                  <p className="text-xs text-blue-600">Across all accounts</p>
                </div>
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
            </GlassCard>

            {/* Additional Cards - Always Show */}
            {(
              <>
                <GlassCard className="bg-gradient-to-br from-purple-500/10 to-purple-400/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Completed Payments</p>
                      <p className="text-2xl font-bold text-purple-900">{summary.completedPayments}</p>
                      <p className="text-xs text-purple-600">{getPeriodLabel(timePeriod)}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-purple-600" />
                      </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-amber-500/10 to-amber-400/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Pending Payments</p>
                      <p className="text-2xl font-bold text-amber-900">{summary.pendingPayments}</p>
                      <p className="text-xs text-amber-600">{getPeriodLabel(timePeriod)}</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-600" />
                  </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-indigo-500/10 to-indigo-400/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-indigo-600 font-medium">Pending Expenses</p>
                      <p className="text-2xl font-bold text-indigo-900">{summary.pendingExpenses}</p>
                      <p className="text-xs text-indigo-600">Awaiting approval</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-indigo-600" />
                  </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-cyan-500/10 to-cyan-400/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-600 font-medium">Active Accounts</p>
                      <p className="text-2xl font-bold text-cyan-900">{summary.totalAccounts}</p>
                      <p className="text-xs text-cyan-600">Total accounts</p>
                    </div>
                    <Building className="w-8 h-8 text-cyan-600" />
                  </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-orange-500/10 to-orange-400/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Outstanding</p>
                      <p className="text-2xl font-bold text-orange-900">{formatCurrency(summary.totalOutstanding)}</p>
                      <p className="text-xs text-orange-600">{getPeriodLabel(timePeriod)}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-600" />
                  </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-yellow-500/10 to-yellow-400/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">Avg Transaction</p>
                      <p className="text-2xl font-bold text-yellow-900">{formatCurrency(summary.averageTransaction)}</p>
                      <p className="text-xs text-yellow-600">Per payment</p>
                    </div>
                    <Calculator className="w-8 h-8 text-yellow-600" />
                  </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-purple-500/10 to-purple-400/5 cursor-pointer hover:shadow-lg transition-shadow" onClick={analyzeExpenseTrends}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">AI Analysis</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {aiAnalysis.loading ? 'Analyzing...' : 'Get Insights'}
                      </p>
                      <p className="text-xs text-purple-600">AI-powered insights</p>
                    </div>
                    {aiAnalysis.loading ? (
                      <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                    ) : (
                      <Brain className="w-8 h-8 text-purple-600" />
                    )}
                  </div>
                </GlassCard>
              </>
            )}
          </div>

          {/* Enhanced Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Balance Distribution */}
            <GlassCard>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PieChart size={20} />
                Account Balance Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={getAccountBalanceData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    >
                      {getAccountBalanceData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Monthly Revenue vs Expenses */}
            <GlassCard>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <LineChart size={20} />
                Revenue vs Expenses ({getPeriodLabel(timePeriod)})
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={getMonthlyRevenueData().map((item, index) => ({
                    ...item,
                    expenses: getMonthlyExpenseData()[index]?.expenses || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      name="Revenue"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                      name="Expenses"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Expense Categories */}
            <GlassCard>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 size={20} />
                Expense Categories ({getPeriodLabel(timePeriod)})
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={getExpenseCategoryData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="value" fill="#EF4444">
                      {getExpenseCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Expense Status */}
            <GlassCard>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity size={20} />
                Expense Status ({getPeriodLabel(timePeriod)})
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={getExpenseStatusData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {getExpenseStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Recent Activity */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Receipt size={20} />
                Recent Payments
              </h3>
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('payments')}
                className="flex items-center gap-2"
              >
                <ArrowRight size={16} />
                View All
              </GlassButton>
            </div>
            <div className="space-y-3">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {statusIcon(payment.status)}
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-500">
                        {payment.customer_name || 'Unknown Customer'} • {payment.device_name || 'No Device'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium capitalize">{payment.method}</p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(payment.payment_date)}
                    </p>
                  </div>
                </div>
              ))}
              {payments.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Receipt size={24} className="mx-auto mb-2" />
                  <p>No payments recorded yet</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Accounts List */}
          <GlassCard>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Wallet size={20} />
              Financial Accounts
            </h3>
            
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {accountTypeIcon(account.type)}
                      <div>
                        <h4 className="font-semibold">{account.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{account.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(account.balance)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        account.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  {(account.account_number || account.bank_name) && (
                    <div className="text-sm text-gray-600 space-y-1">
                      {account.account_number && <p>Account: {account.account_number}</p>}
                      {account.bank_name && <p>Bank: {account.bank_name}</p>}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingAccount(account);
                        setAccountForm({
                          name: account.name,
                          type: account.type,
                          balance: account.balance,
                          account_number: account.account_number || '',
                          bank_name: account.bank_name || '',
                          is_active: account.is_active
                        });
                      }}
                    >
                      <Edit size={14} />
                      Edit
                    </GlassButton>
                    <GlassButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </GlassButton>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left">Account</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Balance</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b border-gray-200">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {accountTypeIcon(account.type)}
                          <div>
                            <p className="font-medium">{account.name}</p>
                            {account.account_number && (
                              <p className="text-xs text-gray-500">{account.account_number}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{account.type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 font-bold">{formatCurrency(account.balance)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          account.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <GlassButton
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingAccount(account);
                              setAccountForm({
                                name: account.name,
                                type: account.type,
                                balance: account.balance,
                                account_number: account.account_number || '',
                                bank_name: account.bank_name || '',
                                is_active: account.is_active
                              });
                            }}
                          >
                            <Edit size={14} />
                          </GlassButton>
                          <GlassButton
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteAccount(account.id)}
                          >
                            <Trash2 size={14} />
                          </GlassButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
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
              />
              
              <input 
                type="date" 
                value={filterEnd} 
                onChange={e => setFilterEnd(e.target.value)} 
                className="text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white"
              />
              
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterMethod('all');
                  setFilterStart('');
                  setFilterEnd('');
                }}
              >
                <Filter size={16} />
                Clear
              </GlassButton>
            </div>
          </GlassCard>

          {/* Payments List */}
          <GlassCard>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Payment History
            </h3>
            
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {statusIcon(payment.status)}
                      <span className="font-semibold text-lg">{formatCurrency(payment.amount)}</span>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{payment.method}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <p className="font-medium">{payment.customer_name || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Device:</span>
                      <p className="font-medium">{payment.device_name || 'No Device'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium">{formatRelativeTime(payment.payment_date)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Device</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-200">
                      <td className="px-4 py-3">{formatRelativeTime(payment.payment_date)}</td>
                      <td className="px-4 py-3 font-bold text-green-700">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 capitalize">{payment.method}</td>
                      <td className="px-4 py-3">
                        {statusIcon(payment.status)}
                        <span className="ml-1 capitalize">{payment.status}</span>
                      </td>
                      <td className="px-4 py-3">{payment.customer_name || 'Unknown'}</td>
                      <td className="px-4 py-3">{payment.device_name || 'No Device'}</td>
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
            <div className="flex gap-2">
              <GlassButton onClick={() => setShowAddCategory(true)}>
                <Plus size={16} />
                Add Category
              </GlassButton>
              <GlassButton onClick={() => setShowAddExpense(true)}>
                <Plus size={16} />
                Add Expense
              </GlassButton>
            </div>
          </div>
          
          {/* Enhanced Expense filters */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={expenseFilterCategory}
                  onChange={(e) => setExpenseFilterCategory(e.target.value)}
                  className="w-full text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="all">All Categories</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={expenseFilterStatus}
                  onChange={(e) => setExpenseFilterStatus(e.target.value)}
                  className="w-full text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="all">All Status</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <select
                  value={expenseFilterAccount}
                  onChange={(e) => setExpenseFilterAccount(e.target.value)}
                  className="w-full text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={expenseFilterStart}
                  onChange={(e) => setExpenseFilterStart(e.target.value)}
                  className="w-full text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={expenseFilterEnd}
                  onChange={(e) => setExpenseFilterEnd(e.target.value)}
                  className="w-full text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setExpenseFilterCategory('all');
                    setExpenseFilterStatus('all');
                    setExpenseFilterAccount('all');
                    setExpenseFilterStart('');
                    setExpenseFilterEnd('');
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          
          {/* AI Analysis Section */}
          <GlassCard className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-900">🤖 AI Expense Analysis</h3>
                  <p className="text-sm text-purple-700">Intelligent insights for your business decisions</p>
                </div>
              </div>
              <GlassButton 
                onClick={() => setShowAiAnalysis(!showAiAnalysis)}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3"
              >
                {showAiAnalysis ? (
                  <div className="flex items-center gap-2">
                    <XCircle size={16} />
                    <span>Hide Analysis</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} />
                    <span>Show AI Analysis</span>
                  </div>
                )}
              </GlassButton>
            </div>

            {showAiAnalysis && (
              <div className="space-y-6">
                {/* API Key Input */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Brain size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">AI Configuration</h3>
                      <p className="text-sm text-gray-600">Set up your Gemini API key for AI analysis</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔑 Gemini API Key
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="password"
                          placeholder="Enter your Gemini API key"
                          value={geminiApiKey}
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors"
                        />
                        <GlassButton 
                          onClick={analyzeExpenseTrends}
                          disabled={aiAnalysis.loading || !geminiApiKey}
                          className="bg-purple-600 hover:bg-purple-700 px-6 py-3"
                        >
                          {aiAnalysis.loading ? (
                            <div className="flex items-center gap-2">
                              <RefreshCw size={16} className="animate-spin" />
                              <span>Analyzing...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <TrendingUp size={16} />
                              <span>Analyze Trends</span>
                            </div>
                          )}
                        </GlassButton>
                      </div>
                    </div>
                    
                    {geminiApiKey && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-sm text-green-800 font-medium">API key configured successfully</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Analysis Results */}
                {aiAnalysis.insights && (
                  <div className="space-y-6">
                    {/* Header with Risk Level */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Brain size={20} className="text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">AI Analysis Results</h3>
                            <p className="text-sm text-gray-600">Intelligent insights for your business</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getRiskLevelIcon(aiAnalysis.riskLevel)}
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getRiskLevelColor(aiAnalysis.riskLevel)}`}>
                            {aiAnalysis.riskLevel.toUpperCase()} RISK
                          </span>
                        </div>
                      </div>
                      
                      {aiAnalysis.category && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
                          <Tag size={16} className="text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Suggested Category: {aiAnalysis.category}</span>
                        </div>
                      )}
                    </div>

                    {/* Main Insights Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Lightbulb size={20} className="text-yellow-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Key Insights</h4>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 leading-relaxed text-base">
                            {aiAnalysis.insights}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions Card */}
                    {aiAnalysis.suggestions.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Zap size={20} className="text-blue-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900">Actionable Recommendations</h4>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="space-y-4">
                            {aiAnalysis.suggestions.map((suggestion, index) => (
                              <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-800 font-medium leading-relaxed">{suggestion}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles size={20} className="text-green-600" />
                        Quick Actions
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button className="flex items-center gap-3 p-4 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp size={16} className="text-green-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Apply Category</p>
                            <p className="text-sm text-gray-600">Use suggested category</p>
                          </div>
                        </button>
                        <button className="flex items-center gap-3 p-4 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Save size={16} className="text-green-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Save Insights</p>
                            <p className="text-sm text-gray-600">Store for later review</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
          
          <div className="space-y-4">
            {filteredExpenses.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or add a new expense</p>
                <GlassButton onClick={() => setShowAddExpense(true)}>
                  <Plus size={16} />
                  Add First Expense
                </GlassButton>
              </GlassCard>
            ) : (
              filteredExpenses.map((expense) => (
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
                          <Wallet size={16} />
                          <span>{accounts.find(a => a.id === expense.account_id)?.name || 'Unknown Account'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-red-600 mb-2">{formatCurrency(expense.amount)}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => analyzeExpenseWithAI(expense.description || expense.title, expense.amount, expense.category)}
                          disabled={aiAnalysis.loading}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-purple-50"
                        >
                          {aiAnalysis.loading ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Brain size={14} />
                          )}
                          {aiAnalysis.loading ? ' Analyzing...' : ' AI Analysis'}
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Add/Edit Account Modal */}
      {(showAddAccount || editingAccount) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter account name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={accountForm.type}
                  onChange={e => setAccountForm(prev => ({ ...prev, type: e.target.value as Account['type'] }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="bank">🏦 Bank Account</option>
                  <option value="cash">💵 Cash Register</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="credit_card">💳 Credit Card</option>
                  <option value="savings">💰 Savings Account</option>
                  <option value="investment">📈 Investment Account</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                <input
                  type="number"
                  value={accountForm.balance}
                  onChange={e => setAccountForm(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="0.00"
                />
              </div>
              
              {accountForm.type === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountForm.account_number}
                      onChange={e => setAccountForm(prev => ({ ...prev, account_number: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter account number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={accountForm.bank_name}
                      onChange={e => setAccountForm(prev => ({ ...prev, bank_name: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter bank name"
                    />
                  </div>
                </>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={accountForm.is_active}
                  onChange={e => setAccountForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active Account
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setShowAddAccount(false);
                  setEditingAccount(null);
                  setAccountForm({
                    name: '',
                    type: 'bank',
                    balance: 0,
                    account_number: '',
                    bank_name: '',
                    is_active: true
                  });
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={editingAccount ? handleUpdateAccount : handleAddAccount}
              >
                {editingAccount ? 'Update' : 'Add'} Account
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New Payment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={e => setPaymentForm(prev => ({ ...prev, method: e.target.value as any }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <select
                  value={paymentForm.account_id}
                  onChange={e => setPaymentForm(prev => ({ ...prev, account_id: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Account</option>
                  {accounts.filter(acc => acc.is_active).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                <select
                  value={paymentForm.payment_type}
                  onChange={e => setPaymentForm(prev => ({ ...prev, payment_type: e.target.value as any }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="payment">Payment</option>
                  <option value="deposit">Deposit</option>
                  <option value="refund">Refund</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  rows={3}
                  placeholder="Add any notes about this payment"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setShowAddPayment(false);
                  setPaymentForm({
                    amount: '',
                    method: 'cash',
                    account_id: '',
                    customer_id: '',
                    device_id: '',
                    payment_type: 'payment',
                    notes: ''
                  });
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleAddPayment}
              >
                Add Payment
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ArrowRight size={20} />
              Transfer Between Accounts
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
                <select
                  value={transferForm.from_account_id}
                  onChange={e => setTransferForm(prev => ({ ...prev, from_account_id: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Source Account</option>
                  {accounts.filter(acc => acc.is_active && acc.balance > 0).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
                <select
                  value={transferForm.to_account_id}
                  onChange={e => setTransferForm(prev => ({ ...prev, to_account_id: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Destination Account</option>
                  {accounts.filter(acc => acc.is_active).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={transferForm.amount}
                  onChange={e => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={transferForm.description}
                  onChange={e => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  rows={3}
                  placeholder="Reason for transfer"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferForm({
                    from_account_id: '',
                    to_account_id: '',
                    amount: '',
                    description: ''
                  });
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleTransfer}
              >
                Process Transfer
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {showBalanceAdjustment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calculator size={20} />
              Adjust Account Balance
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <select
                  value={balanceAdjustmentForm.account_id}
                  onChange={e => setBalanceAdjustmentForm(prev => ({ ...prev, account_id: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Account</option>
                  {accounts.filter(acc => acc.is_active).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                <select
                  value={balanceAdjustmentForm.adjustment_type}
                  onChange={e => setBalanceAdjustmentForm(prev => ({ ...prev, adjustment_type: e.target.value as 'add' | 'subtract' }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="add">➕ Add to Balance</option>
                  <option value="subtract">➖ Subtract from Balance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={balanceAdjustmentForm.amount}
                  onChange={e => setBalanceAdjustmentForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <textarea
                  value={balanceAdjustmentForm.reason}
                  onChange={e => setBalanceAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  rows={3}
                  placeholder="Reason for adjustment"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setShowBalanceAdjustment(false);
                  setBalanceAdjustmentForm({
                    account_id: '',
                    adjustment_type: 'add',
                    amount: '',
                    reason: ''
                  });
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleBalanceAdjustment}
              >
                Adjust Balance
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {(showAddExpense || editingExpense) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Receipt size={20} />
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
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
                <div className="flex gap-2">
                  <textarea
                    value={expenseForm.description}
                    onChange={e => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    className="flex-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                    rows={3}
                    placeholder="Expense description"
                  />
                  <GlassButton
                    onClick={() => {
                      if (expenseForm.description && expenseForm.amount) {
                        analyzeExpenseWithAI(expenseForm.description, expenseForm.amount, expenseForm.category);
                      } else {
                        toast.error('Please enter both description and amount for AI analysis');
                      }
                    }}
                    disabled={aiAnalysis.loading || !expenseForm.description || !expenseForm.amount}
                    className="bg-purple-600 hover:bg-purple-700 self-start"
                  >
                    {aiAnalysis.loading ? <RefreshCw size={16} className="animate-spin" /> : <Brain size={16} />}
                  </GlassButton>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Category</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <select
                  value={expenseForm.account_id}
                  onChange={e => setExpenseForm(prev => ({ ...prev, account_id: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Account</option>
                  {accounts.filter(acc => acc.is_active).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
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
                  setEditingExpense(null);
                  setExpenseForm({
                    title: '',
                    description: '',
                    amount: 0,
                    category: '',
                    expense_date: new Date().toISOString().split('T')[0],
                    account_id: '',
                    payment_method: 'cash',
                    status: 'pending'
                  });
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
              >
                {editingExpense ? 'Update Expense' : 'Add Expense'}
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {(showAddCategory || editingCategory) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Tag size={20} />
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="Category name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={e => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  rows={3}
                  placeholder="Category description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={e => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setShowAddCategory(false);
                  setEditingCategory(null);
                  setCategoryForm({
                    name: '',
                    description: '',
                    color: '#6B7280'
                  });
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManagementPage; 