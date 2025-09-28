import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Lock, 
  Unlock, 
  CheckCircle, 
  X, 
  DollarSign, 
  CreditCard, 
  Smartphone,
  Banknote,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import VirtualKeyboard from '../shared/VirtualKeyboard';

interface PaymentSummary {
  method: string;
  total: number;
  count: number;
  confirmed: boolean;
}

interface DailyClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentUser: any;
}

const DailyClosingModal: React.FC<DailyClosingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  currentUser
}) => {
  const [step, setStep] = useState<'summary' | 'confirm' | 'passcode'>('summary');
  const [paymentSummaries, setPaymentSummaries] = useState<PaymentSummary[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [allConfirmed, setAllConfirmed] = useState(false);

  // Load daily sales summary
  useEffect(() => {
    if (isOpen) {
      loadDailySummary();
    }
  }, [isOpen]);

  const loadDailySummary = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
      const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();

      // Get today's sales
      const { data: sales, error } = await supabase
        .from('lats_sales')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (error) {
        console.error('Error loading sales:', error);
        toast.error('Failed to load daily sales');
        return;
      }

      // Calculate payment summaries
      const paymentMap = new Map<string, { total: number; count: number }>();
      let total = 0;
      let transactionCount = 0;

      sales?.forEach(sale => {
        if (sale.payment_method) {
          const method = sale.payment_method.name || sale.payment_method.type || 'Unknown';
          const amount = sale.total_amount || 0;
          
          if (paymentMap.has(method)) {
            const existing = paymentMap.get(method)!;
            paymentMap.set(method, {
              total: existing.total + amount,
              count: existing.count + 1
            });
          } else {
            paymentMap.set(method, { total: amount, count: 1 });
          }
          
          total += amount;
          transactionCount++;
        }
      });

      // Convert to array
      const summaries: PaymentSummary[] = Array.from(paymentMap.entries()).map(([method, data]) => ({
        method,
        total: data.total,
        count: data.count,
        confirmed: false
      }));

      setPaymentSummaries(summaries);
      setTotalSales(total);
      setTotalTransactions(transactionCount);
    } catch (error) {
      console.error('Error in loadDailySummary:', error);
      toast.error('Failed to load daily summary');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = (method: string) => {
    setPaymentSummaries(prev => 
      prev.map(p => 
        p.method === method 
          ? { ...p, confirmed: !p.confirmed }
          : p
      )
    );
  };

  const handleConfirmAll = () => {
    setPaymentSummaries(prev => 
      prev.map(p => ({ ...p, confirmed: true }))
    );
    setAllConfirmed(true);
    setStep('passcode');
  };

  const handleKeyPress = (key: string) => {
    if (passcode.length < 4) {
      setPasscode(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPasscode('');
  };

  const handleCloseDay = async () => {
    try {
      setLoading(true);
      
      // Verify passcode (you can implement your own passcode logic)
      if (passcode !== '1234') { // Default passcode - you can make this configurable
        toast.error('Invalid passcode');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const closureData = {
        date: today,
        total_sales: totalSales,
        total_transactions: totalTransactions,
        closed_at: new Date().toISOString(),
        closed_by: currentUser?.name || currentUser?.email || 'Unknown',
        closed_by_user_id: currentUser?.id,
        sales_data: {
          payment_summaries: paymentSummaries,
          confirmed_by: currentUser?.name || currentUser?.email
        }
      };

      const { error } = await supabase
        .from('daily_sales_closures')
        .upsert(closureData, { 
          onConflict: 'date',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error closing daily sales:', error);
        toast.error('Failed to close daily sales');
        return;
      }

      toast.success('Daily sales closed successfully! 🎉');
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error in handleCloseDay:', error);
      toast.error('Failed to close daily sales');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentIcon = (method: string) => {
    const methodLower = method.toLowerCase();
    if (methodLower.includes('cash')) return <Banknote className="w-5 h-5" />;
    if (methodLower.includes('card') || methodLower.includes('credit')) return <CreditCard className="w-5 h-5" />;
    if (methodLower.includes('mobile') || methodLower.includes('mpesa') || methodLower.includes('tigo')) return <Smartphone className="w-5 h-5" />;
    return <DollarSign className="w-5 h-5" />;
  };

  const getPaymentColor = (method: string) => {
    const methodLower = method.toLowerCase();
    if (methodLower.includes('cash')) return 'text-green-600 bg-green-100';
    if (methodLower.includes('card') || methodLower.includes('credit')) return 'text-blue-600 bg-blue-100';
    if (methodLower.includes('mobile') || methodLower.includes('mpesa') || methodLower.includes('tigo')) return 'text-purple-600 bg-purple-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Daily Sales Closing</h3>
              <p className="text-sm text-gray-600">
                {step === 'summary' && 'Review daily sales summary'}
                {step === 'confirm' && 'Confirm payment totals'}
                {step === 'passcode' && 'Enter passcode to close'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          )}

          {!loading && step === 'summary' && (
            <div className="space-y-6">
              {/* Daily Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Daily Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalSales.toLocaleString()} TZS
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalTransactions}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Payment Methods</h4>
                <div className="space-y-3">
                  {paymentSummaries.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPaymentColor(payment.method)}`}>
                          {getPaymentIcon(payment.method)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.method}</p>
                          <p className="text-sm text-gray-600">{payment.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {payment.total.toLocaleString()} TZS
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Continue to Confirmation
                </button>
              </div>
            </div>
          )}

          {!loading && step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-orange-800 font-medium">
                      Confirm each payment method
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      Please verify the totals for each payment method before closing the day.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Confirmations */}
              <div className="space-y-3">
                {paymentSummaries.map((payment, index) => (
                  <div key={index} className={`p-4 border rounded-lg transition-colors ${
                    payment.confirmed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPaymentColor(payment.method)}`}>
                          {getPaymentIcon(payment.method)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.method}</p>
                          <p className="text-sm text-gray-600">{payment.count} transactions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {payment.total.toLocaleString()} TZS
                          </p>
                        </div>
                        <button
                          onClick={() => handleConfirmPayment(payment.method)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            payment.confirmed
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('summary')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back to Summary
                </button>
                <button
                  onClick={handleConfirmAll}
                  disabled={!paymentSummaries.every(p => p.confirmed)}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  All Confirmed - Continue
                </button>
              </div>
            </div>
          )}

          {!loading && step === 'passcode' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">
                      All payments confirmed
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Enter passcode to complete daily closing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Passcode Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Passcode
                  </label>
                  <div className="relative">
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter 4-digit passcode"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center text-lg tracking-widest"
                      maxLength={4}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Default passcode: 1234 (can be changed in settings)
                  </p>
                </div>

                {/* Virtual Keyboard */}
                <div>
                  <VirtualKeyboard
                    onKeyPress={handleKeyPress}
                    onBackspace={handleBackspace}
                    onClear={handleClear}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back to Confirmation
                </button>
                <button
                  onClick={handleCloseDay}
                  disabled={passcode.length !== 4 || loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? 'Closing...' : 'Close Day'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DailyClosingModal;
