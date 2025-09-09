import React, { useState, useEffect } from 'react';
import { useRepairPayments } from '../../../hooks/useRepairPayments';
import { RepairPayment } from '../../../lib/repairPaymentService';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Building,
  Calendar,
  User,
  Smartphone as DeviceIcon,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '../../../lib/customerApi';

interface RepairPaymentListProps {
  customerId: string;
  customerName: string;
  onAddPayment?: () => void;
  className?: string;
}

const RepairPaymentList: React.FC<RepairPaymentListProps> = ({
  customerId,
  customerName,
  onAddPayment,
  className = ''
}) => {
  const { getCustomerRepairPayments, loading, error } = useRepairPayments();
  const [payments, setPayments] = useState<RepairPayment[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Load repair payments
  const loadPayments = async () => {
    const customerPayments = await getCustomerRepairPayments(customerId);
    setPayments(customerPayments);
  };

  useEffect(() => {
    loadPayments();
  }, [customerId]);

  // Get payment method icon
  const getPaymentMethodIcon = (methodType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'cash': <DollarSign className="w-4 h-4 text-green-600" />,
      'card': <CreditCard className="w-4 h-4 text-blue-600" />,
      'mobile_money': <Smartphone className="w-4 h-4 text-purple-600" />,
      'bank': <Building className="w-4 h-4 text-gray-600" />,
      'bank_transfer': <Building className="w-4 h-4 text-gray-600" />,
      'credit_card': <CreditCard className="w-4 h-4 text-blue-600" />,
      'savings': <Building className="w-4 h-4 text-gray-600" />,
      'investment': <Building className="w-4 h-4 text-gray-600" />
    };
    return iconMap[methodType] || <DollarSign className="w-4 h-4" />;
  };

  // Get payment status icon
  const getPaymentStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'completed': <CheckCircle className="w-4 h-4 text-green-600" />,
      'pending': <Clock className="w-4 h-4 text-yellow-600" />,
      'failed': <AlertCircle className="w-4 h-4 text-red-600" />,
      'refunded': <ArrowUpRight className="w-4 h-4 text-blue-600" />
    };
    return iconMap[status] || <Clock className="w-4 h-4 text-gray-600" />;
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'completed': 'text-green-600 bg-green-50',
      'pending': 'text-yellow-600 bg-yellow-50',
      'failed': 'text-red-600 bg-red-50',
      'refunded': 'text-blue-600 bg-blue-50'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-50';
  };

  // Format payment date
  const formatPaymentDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total payments
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedPayments = payments.filter(p => p.status === 'completed');
  const pendingPayments = payments.filter(p => p.status === 'pending');

  // Display payments (limit to 5 if not showing all)
  const displayPayments = showAll ? payments : payments.slice(0, 5);

  if (loading && payments.length === 0) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading repair payments...</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Repair Payments
          </h3>
          <p className="text-sm text-gray-600">
            {payments.length} payment{payments.length !== 1 ? 's' : ''} • {formatCurrency(totalAmount)} total
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <GlassButton
            onClick={loadPayments}
            variant="ghost"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </GlassButton>
          {onAddPayment && (
            <GlassButton
              onClick={onAddPayment}
              variant="primary"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Payment
            </GlassButton>
          )}
        </div>
      </div>

      {/* Payment Statistics */}
      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedPayments.length}</div>
            <div className="text-xs text-green-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
            <div className="text-xs text-yellow-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
            <div className="text-xs text-blue-600">Total</div>
          </div>
        </div>
      )}

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No repair payments found</p>
          <p className="text-sm text-gray-400">Repair payments will appear here when processed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayPayments.map((payment) => (
            <div
              key={payment.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getPaymentMethodIcon(payment.method)}
                  <div>
                    <div className="font-medium text-gray-800">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {payment.method} • {payment.payment_account_name}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                    <div className="flex items-center space-x-1">
                      {getPaymentStatusIcon(payment.status)}
                      <span className="capitalize">{payment.status}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {formatPaymentDate(payment.payment_date)}
                    </div>
                    {payment.device_name && (
                      <div className="text-xs text-gray-500 flex items-center">
                        <DeviceIcon className="w-3 h-3 mr-1" />
                        {payment.device_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {(payment.reference || payment.notes) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {payment.reference && (
                    <div className="text-xs text-gray-500 mb-1">
                      Ref: {payment.reference}
                    </div>
                  )}
                  {payment.notes && (
                    <div className="text-xs text-gray-600">
                      {payment.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Show More/Less Button */}
      {payments.length > 5 && (
        <div className="mt-4 text-center">
          <GlassButton
            onClick={() => setShowAll(!showAll)}
            variant="ghost"
            size="sm"
          >
            {showAll ? 'Show Less' : `Show ${payments.length - 5} More`}
          </GlassButton>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default RepairPaymentList;
