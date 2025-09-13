import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { 
  Receipt, X, DollarSign, Clock, CheckCircle, XCircle, 
  User, Phone, Mail, MapPin, CreditCard, Smartphone, 
  Building, Calendar, FileText, Printer, Download,
  AlertCircle, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import PaymentMethodIcon from '../../../components/PaymentMethodIcon';
import { toast } from 'react-hot-toast';
import { 
  paymentTrackingService,
  PaymentTransaction,
  SoldItem
} from '../../../lib/paymentTrackingService';

interface PaymentDetailsViewerProps {
  transactionId: string;
  onClose?: () => void;
  isModal?: boolean;
}

const PaymentDetailsViewer: React.FC<PaymentDetailsViewerProps> = ({ 
  transactionId, 
  onClose, 
  isModal = false 
}) => {
  const { currentUser } = useAuth();
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [soldItems, setSoldItems] = useState<SoldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSoldItems, setLoadingSoldItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transaction details
  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all transactions and find the one with matching ID
      const allTransactions = await paymentTrackingService.fetchPaymentTransactions();
      const foundTransaction = allTransactions.find(t => t.transactionId === transactionId);
      
      if (!foundTransaction) {
        setError(`Transaction ${transactionId} not found`);
        return;
      }
      
      setTransaction(foundTransaction);
      
      // Fetch sold items for this transaction
      if (foundTransaction.id) {
        setLoadingSoldItems(true);
        try {
          const items = await paymentTrackingService.fetchSoldItems(
            foundTransaction.id, 
            foundTransaction.source
          );
          setSoldItems(items);
        } catch (itemError) {
          console.warn('Could not fetch sold items:', itemError);
          setSoldItems([]);
        } finally {
          setLoadingSoldItems(false);
        }
      }
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      setError('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactionId) {
      fetchTransactionDetails();
    }
  }, [transactionId]);

  // Format currency following user preference (no trailing zeros, show full numbers)
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'pending':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'failed':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    return <PaymentMethodIcon type={method.toLowerCase().replace(/\s+/g, '_')} name={method} size="sm" />;
  };

  // Handle payment actions
  const handlePaymentAction = async (action: 'confirm' | 'reject') => {
    if (!transaction) return;
    
    try {
      const newStatus = action === 'confirm' ? 'completed' : 'failed';
      const success = await paymentTrackingService.updatePaymentStatus(
        transaction.id, 
        newStatus, 
        transaction.source,
        currentUser?.id
      );
      
      if (success) {
        toast.success(`Payment ${action} successful`);
        await fetchTransactionDetails(); // Refresh data
      } else {
        toast.error(`Failed to ${action} payment`);
      }
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error);
      toast.error(`Error ${action}ing payment`);
    }
  };

  // Print transaction details
  const handlePrint = () => {
    if (!transaction) return;
    
    const printContent = `
Transaction Details
===================
Transaction ID: ${transaction.transactionId}
Customer: ${transaction.customerName}
Amount: ${formatMoney(transaction.amount)}
Method: ${transaction.method}
Status: ${transaction.status}
Date: ${new Date(transaction.timestamp).toLocaleString()}
Reference: ${transaction.reference}
${transaction.deviceName ? `Device: ${transaction.deviceName}` : ''}
${transaction.customerPhone ? `Phone: ${transaction.customerPhone}` : ''}
${transaction.customerEmail ? `Email: ${transaction.customerEmail}` : ''}
${soldItems.length > 0 ? `
Items:
${soldItems.map(item => `- ${item.name} x${item.quantity} = ${formatMoney(item.totalPrice)}`).join('\n')}
` : ''}
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Transaction ${transaction.transactionId}</title></head>
          <body style="font-family: monospace; font-size: 12px; line-height: 1.4;">
            <pre>${printContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Export transaction data
  const handleExport = () => {
    if (!transaction) return;
    
    const exportData = {
      transactionId: transaction.transactionId,
      customerName: transaction.customerName,
      amount: transaction.amount,
      method: transaction.method,
      status: transaction.status,
      date: transaction.timestamp,
      reference: transaction.reference,
      deviceName: transaction.deviceName,
      customerPhone: transaction.customerPhone,
      customerEmail: transaction.customerEmail,
      soldItems: soldItems
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaction-${transaction.transactionId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Transaction not found'}</p>
          <GlassButton onClick={fetchTransactionDetails} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </GlassButton>
        </div>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Receipt className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Transaction {transaction.transactionId}
            </h2>
            <p className="text-base text-gray-600">Complete payment information</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Transaction Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Amount Card */}
        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-green-700">Transaction Amount</span>
          </div>
          <div className="text-3xl font-bold text-green-900 mb-2">{formatMoney(transaction.amount)}</div>
          <div className="text-sm text-green-600">
            {soldItems.length > 0 ? `${soldItems.length} item(s)` : 'Service payment'}
          </div>
        </div>

        {/* Status Card */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            {getStatusIcon(transaction.status)}
            <span className="text-sm font-medium text-blue-700">Payment Status</span>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 text-lg font-semibold rounded-full border ${getStatusColor(transaction.status)}`}>
            {getStatusIcon(transaction.status)}
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </div>
        </div>

        {/* Method Card */}
        <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            {getPaymentMethodIcon(transaction.method)}
            <span className="text-sm font-medium text-purple-700">
              {transaction.metadata?.paymentMethod?.type === 'multiple' ? 'Payment Methods' : 'Payment Method'}
            </span>
          </div>
          <div className="text-xl font-bold text-purple-900">
            {transaction.metadata?.paymentMethod?.type === 'multiple' 
              ? `${transaction.metadata.paymentMethod.details?.payments?.length || 0} Methods`
              : transaction.method
            }
          </div>
          <div className="text-sm text-purple-600">
            {transaction.metadata?.paymentMethod?.type === 'multiple' ? 'Multiple payments' : 'Payment processed'}
          </div>
        </div>
      </div>

      {/* Payment Breakdown Section - Show detailed multiple payment information */}
      {transaction.metadata?.paymentMethod?.type === 'multiple' && transaction.metadata.paymentMethod.details?.payments && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Breakdown
          </h3>
          <div className="space-y-3">
            {transaction.metadata.paymentMethod.details.payments.map((payment: any, index: number) => (
              <div key={index} className="bg-white rounded-lg border border-blue-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {getPaymentMethodIcon(payment.method)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 capitalize">{payment.method}</div>
                    <div className="text-sm text-gray-600">
                      {payment.accountId && `Account: ${payment.accountId.slice(0, 8)}...`}
                      {payment.reference && ` • Ref: ${payment.reference}`}
                    </div>
                    {payment.notes && (
                      <div className="text-xs text-gray-500 mt-1">{payment.notes}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-900">{formatMoney(payment.amount)}</div>
                  <div className="text-xs text-gray-500">
                    {payment.timestamp && new Date(payment.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t border-blue-200 pt-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-blue-900">Total Paid:</span>
                <span className="text-xl font-bold text-blue-900">
                  {formatMoney(transaction.metadata.paymentMethod.details.totalPaid || transaction.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Customer Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Name</span>
              <span className="text-sm text-gray-900">{transaction.customerName}</span>
            </div>
            {transaction.customerPhone && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Phone
                </span>
                <span className="text-sm text-gray-900">{transaction.customerPhone}</span>
              </div>
            )}
            {transaction.customerEmail && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </span>
                <span className="text-sm text-gray-900">{transaction.customerEmail}</span>
              </div>
            )}
            {transaction.customerAddress && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Address
                </span>
                <span className="text-sm text-gray-900">{transaction.customerAddress}</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Transaction Information */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Transaction Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Reference</span>
              <span className="text-sm text-gray-900 font-mono">{transaction.reference}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Date & Time</span>
              <span className="text-sm text-gray-900">{new Date(transaction.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Source</span>
              <span className="text-sm text-gray-900 capitalize">{transaction.source.replace('_', ' ')}</span>
            </div>
            {transaction.deviceName && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Device</span>
                <span className="text-sm text-gray-900">📱 {transaction.deviceName}</span>
              </div>
            )}
            {transaction.fees > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Transaction Fees</span>
                <span className="text-sm text-gray-900">{formatMoney(transaction.fees)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-600">Cashier</span>
              <span className="text-sm text-gray-900">{transaction.cashier}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Sold Items */}
      {soldItems.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Items/Services
            {loadingSoldItems && <RefreshCw className="w-4 h-4 animate-spin" />}
          </h3>
          <div className="space-y-3">
            {soldItems.map((item, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatMoney(item.totalPrice)}</div>
                    <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Unit Price: {formatMoney(item.unitPrice)}</span>
                  <span>Type: {item.type}</span>
                </div>
                {item.notes && (
                  <div className="mt-2 text-sm text-gray-600 italic">
                    Note: {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        {transaction.status === 'pending' && (
          <>
            <GlassButton
              onClick={() => handlePaymentAction('confirm')}
              className="flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Confirm Payment
            </GlassButton>
            <GlassButton
              onClick={() => handlePaymentAction('reject')}
              className="flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-red-500 to-rose-600 text-white flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Reject Payment
            </GlassButton>
          </>
        )}
        <GlassButton
          onClick={handlePrint}
          className="flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Print Details
        </GlassButton>
        <GlassButton
          onClick={handleExport}
          className="flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-purple-500 to-violet-600 text-white flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export Data
        </GlassButton>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
        <GlassCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
          {content}
        </GlassCard>
      </div>
    );
  }

  return (
    <GlassCard className="p-8">
      {content}
    </GlassCard>
  );
};

export default PaymentDetailsViewer;
