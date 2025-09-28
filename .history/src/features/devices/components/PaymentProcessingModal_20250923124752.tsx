import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { getDevicePaymentInfo, validateDeviceHandover } from '../../../utils/paymentValidation';
import { formatCurrency } from '../../../utils/paymentValidation';

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  onPaymentComplete: () => void;
}

interface PaymentInfo {
  repairCost: number;
  sparePartsCost: number;
  totalPaid: number;
  totalPending: number;
  amountDue: number;
  payments: any[];
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  isOpen,
  onClose,
  deviceId,
  onPaymentComplete
}) => {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (isOpen && deviceId) {
      loadPaymentInfo();
    }
  }, [isOpen, deviceId]);

  const loadPaymentInfo = async () => {
    setLoading(true);
    try {
      const info = await getDevicePaymentInfo(deviceId);
      const totalCost = info.repairCost + info.sparePartsCost;
      const amountDue = totalCost - info.totalPaid;
      
      setPaymentInfo({
        ...info,
        amountDue
      });
    } catch (error) {
      console.error('Error loading payment info:', error);
      toast.error('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (paymentId: string, amount: number) => {
    setProcessingPayment(true);
    try {
      // Update payment status to completed
      const { error } = await supabase
        .from('customer_payments')
        .update({ 
          status: 'completed',
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) {
        throw error;
      }

      toast.success(`Payment of ${formatCurrency(amount)} processed successfully`);
      await loadPaymentInfo(); // Refresh payment info
      
      // Check if all payments are now complete
      const validation = await validateDeviceHandover(deviceId);
      if (validation.valid) {
        toast.success('All payments completed! Device ready for handover.');
        onPaymentComplete();
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const markAsNoPaymentRequired = async () => {
    setProcessingPayment(true);
    try {
      // Update device to indicate no payment required
      const { error } = await supabase
        .from('devices')
        .update({ 
          repair_cost: 0,
          repair_price: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', deviceId);

      if (error) {
        throw error;
      }

      toast.success('Device marked as no payment required');
      onPaymentComplete();
      
    } catch (error) {
      console.error('Error marking no payment required:', error);
      toast.error('Failed to update device');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Processing
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : paymentInfo ? (
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Payment Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Repair Cost:</span>
                    <span className="ml-2 font-medium">{formatCurrency(paymentInfo.repairCost)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Parts Cost:</span>
                    <span className="ml-2 font-medium">{formatCurrency(paymentInfo.sparePartsCost)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="ml-2 font-medium text-green-600">{formatCurrency(paymentInfo.totalPaid)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount Due:</span>
                    <span className={`ml-2 font-medium ${paymentInfo.amountDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(paymentInfo.amountDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pending Payments */}
              {paymentInfo.payments.filter(p => p.status === 'pending').length > 0 ? (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Pending Payments
                  </h3>
                  <div className="space-y-3">
                    {paymentInfo.payments
                      .filter(p => p.status === 'pending')
                      .map((payment) => (
                        <div key={payment.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{formatCurrency(payment.amount)}</p>
                              <p className="text-sm text-gray-600">{payment.notes || 'Payment'}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => processPayment(payment.id, payment.amount)}
                              disabled={processingPayment}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              {processingPayment ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Process
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  {paymentInfo.amountDue <= 0 ? (
                    <div className="text-green-600">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-semibold">All payments completed!</p>
                      <p className="text-sm">Device is ready for customer handover.</p>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-semibold">No pending payments found</p>
                      <p className="text-sm">But payment is still required.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {paymentInfo.amountDue <= 0 ? (
                  <button
                    onClick={onPaymentComplete}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Continue to Customer Care
                  </button>
                ) : (
                  <>
                    <button
                      onClick={markAsNoPaymentRequired}
                      disabled={processingPayment}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      No Payment Required
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <AlertCircle className="w-12 h-12 mx-auto mb-2" />
              <p>Failed to load payment information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessingModal;
