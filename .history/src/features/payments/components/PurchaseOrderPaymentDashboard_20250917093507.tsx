import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, CreditCard, DollarSign, Building, 
  Calendar, Filter, Search, Download, Eye, Plus,
  AlertCircle, CheckCircle2, Clock, XCircle, TrendingUp,
  RefreshCw, X, Package, Truck, Users, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus
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
  const getPaymentStatusColor = (status: string) => {
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
    const unpaidOrders = purchaseOrders.filter(order => order.paymentStatus === 'unpaid').length;
    const partialOrders = purchaseOrders.filter(order => order.paymentStatus === 'partial').length;
    const paidOrders = purchaseOrders.filter(order => order.paymentStatus === 'paid').length;
    
    const totalAmount = purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalPaid = purchaseOrders.reduce((sum, order) => sum + (order.totalPaid || 0), 0);
    const totalOutstanding = totalAmount - totalPaid;
    
    return {
      totalOrders,
      unpaidOrders,
      partialOrders,
      paidOrders,
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
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search purchase orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <GlassSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="all">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </GlassSelect>
      </div>

      {/* Purchase Orders - Matching PurchaseOrderDetailPage style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => (
          <GlassCard key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">PO-{order.orderNumber}</h3>
                <p className="text-sm text-gray-600">{order.supplier?.name || 'Unknown Supplier'}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus || 'unpaid')}`}>
                  {order.paymentStatus || 'unpaid'}
                </span>
                <GlassButton
                  onClick={() => handleMakePayment(order)}
                  icon={<Plus size={14} />}
                  className="text-xs px-2 py-1"
                >
                  Pay
                </GlassButton>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">{formatMoney(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paid:</span>
                <span className="font-medium">{formatMoney(order.totalPaid || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining:</span>
                <span className="font-medium text-red-600">
                  {formatMoney(order.totalAmount - (order.totalPaid || 0))}
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Expected: {new Date(order.expectedDelivery).toLocaleDateString()}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">
                    {formatMoney(payment.amount)} - {payment.payment_method}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                  payment.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Make Payment</h3>
              <GlassButton
                onClick={() => setShowPaymentModal(false)}
                icon={<X size={16} />}
                variant="secondary"
                className="p-2"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order</label>
                <div className="p-2 bg-gray-50 rounded border">
                  PO-{selectedOrder.orderNumber} - {selectedOrder.supplier?.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Remaining: {formatMoney(selectedOrder.totalAmount - (selectedOrder.totalPaid || 0))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Account</label>
                <GlassSelect
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                >
                  <option value="">Select account</option>
                  {paymentAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {formatMoney(account.balance)}
                    </option>
                  ))}
                </GlassSelect>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <GlassButton
                onClick={() => setShowPaymentModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={processPayment}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white"
              >
                Process Payment
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderPaymentDashboard;