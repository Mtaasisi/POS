import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, CreditCard, DollarSign, Building, 
  Calendar, Filter, Search, Download, Eye, Plus,
  AlertCircle, CheckCircle2, Clock, XCircle, TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { purchaseOrderPaymentService, PurchaseOrderPayment } from '../../lats/lib/purchaseOrderPaymentService';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: {
    name: string;
    contactPerson?: string;
    phone?: string;
  };
  status: string;
  currency: string;
  totalAmount: number;
  totalPaid?: number;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  expectedDelivery: string;
  createdAt: string;
  updatedAt: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Fetch purchase orders with payment information
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch purchase orders without the join first
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
        
        if (!suppliersError && suppliers) {
          suppliersData = suppliers;
        }
      }

      // Create a map for quick supplier lookup
      const supplierMap = new Map(suppliersData.map(supplier => [supplier.id, supplier]));

      const formattedOrders: PurchaseOrder[] = ordersData.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        supplier: order.supplier_id ? supplierMap.get(order.supplier_id) : null,
        status: order.status,
        currency: order.currency || 'TZS',
        totalAmount: order.total_amount || 0,
        totalPaid: order.total_paid || 0,
        paymentStatus: order.payment_status || 'unpaid',
        expectedDelivery: order.expected_delivery,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }));

      setPurchaseOrders(formattedOrders);
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
      const { data, error } = await supabase
        .from('purchase_order_payments')
        .select(`
          *,
          lats_purchase_orders!inner (
            order_number,
            suppliers:supplier_id (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent payments:', error);
        return;
      }

      setRecentPayments(data || []);
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchRecentPayments();
  }, [fetchPurchaseOrders, fetchRecentPayments]);

  // Filter purchase orders based on search and status
  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate payment statistics
  const paymentStats = {
    totalOrders: purchaseOrders.length,
    unpaidOrders: purchaseOrders.filter(o => o.paymentStatus === 'unpaid').length,
    partialOrders: purchaseOrders.filter(o => o.paymentStatus === 'partial').length,
    paidOrders: purchaseOrders.filter(o => o.paymentStatus === 'paid').length,
    totalAmount: purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    totalPaid: purchaseOrders.reduce((sum, order) => sum + (order.totalPaid || 0), 0),
    totalOutstanding: purchaseOrders.reduce((sum, order) => sum + (order.totalAmount - (order.totalPaid || 0)), 0)
  };

  const formatCurrency = (amount: number, currency: string = 'TZS') => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'partial': return 'bg-orange-100 text-orange-700';
      case 'unpaid': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4" />;
      case 'partial': return <Clock className="w-4 h-4" />;
      case 'unpaid': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleMakePayment = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    onMakePayment(order);
  };

  const handleViewPaymentDetails = async (order: PurchaseOrder) => {
    try {
      const payments = await purchaseOrderPaymentService.getPurchaseOrderPayments(order.id);
      if (payments.length > 0) {
        onViewDetails(payments[0]);
      } else {
        toast.info('No payments found for this purchase order');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to load payment details');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading purchase order payments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">{paymentStats.totalOrders}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(paymentStats.totalAmount)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(paymentStats.totalPaid)}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-purple-500" />
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(paymentStats.totalOutstanding)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </GlassCard>
      </div>

      {/* Payment Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unpaid Orders</p>
              <p className="text-xl font-bold text-red-600">{paymentStats.unpaidOrders}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Partial Payments</p>
              <p className="text-xl font-bold text-orange-600">{paymentStats.partialOrders}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fully Paid</p>
              <p className="text-xl font-bold text-green-600">{paymentStats.paidOrders}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters and Search */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by order number or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
            <GlassButton
              onClick={onExport}
              icon={<Download className="w-4 h-4" />}
              variant="secondary"
            >
              Export
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Purchase Orders Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Purchase Orders</h3>
          <div className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {purchaseOrders.length} orders
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-700">Order</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Supplier</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Paid</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Expected</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium text-gray-900">{order.supplier?.name || 'Unknown'}</p>
                      {order.supplier?.contactPerson && (
                        <p className="text-xs text-gray-500">{order.supplier.contactPerson}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <p className="font-medium text-gray-900">{formatCurrency(order.totalAmount, order.currency)}</p>
                  </td>
                  <td className="py-3 px-2">
                    <p className="font-medium text-gray-900">{formatCurrency(order.totalPaid || 0, order.currency)}</p>
                    {order.totalPaid && order.totalPaid > 0 && (
                      <p className="text-xs text-gray-500">
                        {Math.round(((order.totalPaid / order.totalAmount) * 100))}% paid
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus || 'unpaid')}`}>
                      {getPaymentStatusIcon(order.paymentStatus || 'unpaid')}
                      <span className="capitalize">{order.paymentStatus || 'unpaid'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-gray-900">{formatDate(order.expectedDelivery)}</p>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {order.paymentStatus !== 'paid' && (
                        <GlassButton
                          onClick={() => handleMakePayment(order)}
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <CreditCard className="w-3 h-3 mr-1" />
                          Pay
                        </GlassButton>
                      )}
                      <GlassButton
                        onClick={() => handleViewPaymentDetails(order)}
                        size="sm"
                        variant="secondary"
                      >
                        <Eye className="w-3 h-3" />
                      </GlassButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No purchase orders found</p>
          </div>
        )}
      </GlassCard>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {payment.paymentMethod} - {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Order: {(payment as any).lats_purchase_orders?.order_number} | 
                      Supplier: {(payment as any).lats_purchase_orders?.suppliers?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{formatDate(payment.paymentDate)}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                    payment.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default PurchaseOrderPaymentDashboard;
