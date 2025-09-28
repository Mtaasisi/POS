import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, CreditCard, DollarSign, Building, 
  Calendar, Filter, Search, Download, Eye, Plus,
  AlertCircle, CheckCircle2, Clock, XCircle, TrendingUp,
  RefreshCw, X, Package, Truck, Users, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import { financeAccountService, FinanceAccount } from '../../../lib/financeAccountService';

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier?: {
    name: string;
    contact_person?: string;
    phone?: string;
  };
  status: string;
  currency: string;
  total_amount: number;
  total_paid?: number;
  payment_status?: 'unpaid' | 'partial' | 'paid';
  expected_delivery: string;
  created_at: string;
  updated_at: string;
}

interface PurchaseOrderPayment {
  id: string;
  purchase_order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  payment_date: string;
  reference?: string;
  notes?: string;
}

interface PurchaseOrderPaymentDashboardProps {
  onViewDetails: (payment: PurchaseOrderPayment) => void;
  onMakePayment: (purchaseOrder: PurchaseOrder) => void;
  onExport: () => void;
}

const PurchaseOrderPaymentDashboard: React.FC<PurchaseOrderPaymentDashboardProps> = ({
  onViewDetails,
  onMakePayment,
  onExport
}) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [recentPayments, setRecentPayments] = useState<PurchaseOrderPayment[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<FinanceAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string, remainingAmount?: number) => {
    // Handle overpayment case
    if (remainingAmount !== undefined && remainingAmount < 0) {
      return 'bg-orange-100 text-orange-700';
    }
    
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'partial': return 'bg-yellow-100 text-yellow-700';
      case 'unpaid': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    const totalOrders = purchaseOrders.length;
    const unpaidOrders = purchaseOrders.filter(order => {
      const remaining = order.totalAmount - (order.totalPaid || 0);
      return remaining > 0 && order.paymentStatus !== 'paid';
    }).length;
    const partialOrders = purchaseOrders.filter(order => {
      const remaining = order.totalAmount - (order.totalPaid || 0);
      return remaining > 0 && order.paymentStatus === 'partial';
    }).length;
    const paidOrders = purchaseOrders.filter(order => {
      const remaining = order.totalAmount - (order.totalPaid || 0);
      return remaining <= 0;
    }).length;
    const overpaidOrders = purchaseOrders.filter(order => {
      const remaining = order.totalAmount - (order.totalPaid || 0);
      return remaining < 0;
    }).length;
    
    const totalAmount = purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalPaid = purchaseOrders.reduce((sum, order) => sum + (order.totalPaid || 0), 0);
    const totalOutstanding = Math.max(0, totalAmount - totalPaid);
    
    return {
      totalOrders,
      unpaidOrders,
      partialOrders,
      paidOrders,
      overpaidOrders,
      totalAmount,
      totalPaid,
      totalOutstanding
    };
  }, [purchaseOrders]);

  // Fetch purchase orders
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('lats_purchase_orders')
        .select(`
          id,
          order_number,
          supplier_id,
          status,
          currency,
          total_amount,
          total_paid,
          payment_status,
          expected_delivery,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (ordersError) {
        console.error('Error fetching purchase orders:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        setPurchaseOrders([]);
        return;
      }

      // Get unique supplier IDs
      const supplierIds = [...new Set(ordersData.map(order => order.supplier_id).filter(Boolean))];
      
      // Fetch suppliers separately
      let suppliersData: any[] = [];
      if (supplierIds.length > 0) {
        const { data: suppliers, error: suppliersError } = await supabase
          .from('lats_suppliers')
          .select('id, name, contact_person, phone')
          .in('id', supplierIds);

        if (suppliersError) {
          console.warn('Error fetching suppliers:', suppliersError);
        } else {
          suppliersData = suppliers || [];
        }
      }

      // Combine orders with supplier data
      const ordersWithSuppliers = ordersData.map(order => ({
        ...order,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        supplier: suppliersData.find(s => s.id === order.supplier_id),
        totalAmount: order.total_amount,
        totalPaid: order.total_paid || 0,
        paymentStatus: order.payment_status,
        expectedDelivery: order.expected_delivery,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }));

      setPurchaseOrders(ordersWithSuppliers);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch recent payments
  const fetchRecentPayments = useCallback(async () => {
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('purchase_order_payments')
        .select(`
          id,
          purchase_order_id,
          amount,
          currency,
          payment_method,
          status,
          payment_date,
          reference,
          notes
        `)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        return;
      }

      setRecentPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }, []);

  // Fetch payment accounts
  const fetchPaymentAccounts = useCallback(async () => {
    try {
      const accounts = await financeAccountService.getPaymentMethods();
      setPaymentAccounts(accounts);
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchRecentPayments();
    fetchPaymentAccounts();
  }, [fetchPurchaseOrders, fetchRecentPayments, fetchPaymentAccounts]);

  // Filter purchase orders
  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle make payment
  const handleMakePayment = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setPaymentAmount('');
    setSelectedAccount('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  // Process payment
  const processPayment = async () => {
    if (!selectedOrder || !paymentAmount || !selectedAccount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > selectedOrder.totalAmount - (selectedOrder.totalPaid || 0)) {
      toast.error('Payment amount exceeds remaining balance');
      return;
    }

    try {
      // Call the database function to process payment
      const { data, error } = await supabase.rpc('process_purchase_order_payment', {
        purchase_order_id_param: selectedOrder.id,
        payment_account_id_param: selectedAccount,
        amount_param: amount,
        currency_param: selectedOrder.currency,
        payment_method_param: 'manual',
        payment_method_id_param: selectedAccount,
        user_id_param: (await supabase.auth.getUser()).data.user?.id,
        reference_param: `PO-${selectedOrder.orderNumber}`,
        notes_param: paymentNotes
      });

      if (error) {
        console.error('Error processing payment:', error);
        throw error;
      }

      toast.success('Payment processed successfully');
      setShowPaymentModal(false);
      await fetchPurchaseOrders();
      await fetchRecentPayments();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading purchase orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-gray-600">Manage supplier payments and track purchase orders</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              fetchPurchaseOrders();
              fetchRecentPayments();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{summaryStats.totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Value</p>
              <p className="text-2xl font-bold text-green-900">{formatMoney(summaryStats.totalAmount)}</p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Outstanding</p>
              <p className="text-2xl font-bold text-yellow-900">{formatMoney(summaryStats.totalOutstanding)}</p>
            </div>
            <div className="p-3 bg-yellow-500 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Unpaid Orders</p>
              <p className="text-2xl font-bold text-purple-900">{summaryStats.unpaidOrders}</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Overpaid Orders</p>
              <p className="text-2xl font-bold text-orange-900">{summaryStats.overpaidOrders}</p>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search purchase orders or suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <GlassSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </GlassSelect>
          </div>
        </div>
      </GlassCard>

      {/* Purchase Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        {filteredOrders.map((order) => {
          const remainingAmount = order.totalAmount - (order.totalPaid || 0);
          const paymentProgress = Math.min(((order.totalPaid || 0) / order.totalAmount) * 100, 100);
          
          return (
            <GlassCard key={order.id} className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">PO-{order.orderNumber}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {order.supplier?.name || 'Unknown Supplier'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus || 'unpaid', remainingAmount)}`}>
                    {remainingAmount < 0 ? 'overpaid' : (order.paymentStatus || 'unpaid')}
                  </span>
                  {remainingAmount > 0 && (
                    <button
                      onClick={() => handleMakePayment(order)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs font-medium"
                    >
                      <Plus size={12} />
                      Pay
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Payment Progress</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{Math.round(paymentProgress)}%</span>
                    {remainingAmount < 0 && (
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        Overpaid
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      remainingAmount < 0 
                        ? 'bg-gradient-to-r from-orange-400 to-orange-600' 
                        : paymentProgress === 100 
                          ? 'bg-gradient-to-r from-green-400 to-green-600'
                          : 'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                    style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <span className="font-semibold text-gray-900">{formatMoney(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paid</span>
                  <span className="font-medium text-green-600 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    {formatMoney(order.totalPaid || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Remaining</span>
                  <span className={`font-medium flex items-center gap-1 ${
                    remainingAmount < 0 
                      ? 'text-orange-600' 
                      : remainingAmount === 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                  }`}>
                    {remainingAmount < 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {remainingAmount < 0 ? formatMoney(Math.abs(remainingAmount)) : formatMoney(remainingAmount)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Expected: {new Date(order.expectedDelivery).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
            <button
              onClick={() => {/* TODO: Navigate to full payments view */}}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatMoney(payment.amount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {payment.payment_method} • {new Date(payment.payment_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                    payment.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {payment.status}
                  </span>
                  <button
                    onClick={() => onViewDetails(payment)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Make Payment</h3>
                  <p className="text-sm text-gray-600">Process payment for purchase order</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Purchase Order Info */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Purchase Order Details</span>
                </div>
                <div className="text-sm text-blue-800">
                  <div className="font-medium">PO-{selectedOrder.orderNumber}</div>
                  <div className="text-blue-600">{selectedOrder.supplier?.name}</div>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  />
                </div>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">{formatMoney(selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Already Paid:</span>
                    <span className="font-medium text-green-600">{formatMoney(selectedOrder.totalPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-700">Remaining:</span>
                    <span className="text-red-600">{formatMoney(selectedOrder.totalAmount - (selectedOrder.totalPaid || 0))}</span>
                  </div>
                </div>
              </div>

              {/* Payment Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Account</label>
                <GlassSelect
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full py-3"
                >
                  <option value="">Select payment account</option>
                  {paymentAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {formatMoney(account.balance)}
                    </option>
                  ))}
                </GlassSelect>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Notes</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add any notes about this payment..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderPaymentDashboard;