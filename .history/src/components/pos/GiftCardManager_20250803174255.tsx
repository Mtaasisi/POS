import React, { useState, useEffect } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { Gift, CreditCard, Plus, Search, Loader2, CheckCircle, AlertCircle, DollarSign, History, Copy, Printer } from 'lucide-react';
import { posApi, GiftCard, GiftCardTransaction } from '../../lib/posApi';

interface GiftCardManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onGiftCardRedeem?: (cardNumber: string, amount: number) => void;
  onGiftCardPurchase?: (amount: number) => void;
}

const GiftCardManager: React.FC<GiftCardManagerProps> = ({ 
  isOpen, 
  onClose, 
  onGiftCardRedeem,
  onGiftCardPurchase 
}) => {
  const [activeTab, setActiveTab] = useState<'redeem' | 'purchase' | 'history'>('redeem');
  const [cardNumber, setCardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [currentGiftCard, setCurrentGiftCard] = useState<GiftCard | null>(null);
  const [transactions, setTransactions] = useState<GiftCardTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearchCard = async () => {
    if (!cardNumber.trim()) {
      setError('Please enter a card number');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentGiftCard(null);

    try {
      const giftCard = await posApi.getGiftCard(cardNumber.trim());
      if (giftCard) {
        setCurrentGiftCard(giftCard);
        // Load transactions
        const cardTransactions = await posApi.getGiftCardTransactions(giftCard.id);
        setTransactions(cardTransactions);
        setSuccess('Gift card found!');
      } else {
        setError('Gift card not found or inactive');
      }
    } catch (err) {
      console.error('Error searching gift card:', err);
      setError('Failed to search gift card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!currentGiftCard || !amount) {
      setError('Please enter an amount to redeem');
      return;
    }

    const redeemAmount = parseFloat(amount);
    if (isNaN(redeemAmount) || redeemAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (redeemAmount > currentGiftCard.current_balance) {
      setError('Insufficient balance on gift card');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedCard = await posApi.redeemGiftCard(cardNumber, redeemAmount);
      setCurrentGiftCard(updatedCard);
      setAmount('');
      setSuccess(`Successfully redeemed ₦${redeemAmount.toLocaleString()}`);
      
      // Call parent callback
      onGiftCardRedeem?.(cardNumber, redeemAmount);
      
      // Refresh transactions
      const cardTransactions = await posApi.getGiftCardTransactions(updatedCard.id);
      setTransactions(cardTransactions);
    } catch (err) {
      console.error('Error redeeming gift card:', err);
      setError('Failed to redeem gift card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newGiftCard = await posApi.purchaseGiftCard(amount);
      setPurchaseAmount('');
      setSuccess(`Gift card created! Card number: ${newGiftCard.card_number}`);
      
      // Call parent callback
      onGiftCardPurchase?.(amount);
    } catch (err) {
      console.error('Error purchasing gift card:', err);
      setError('Failed to create gift card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  const printGiftCard = (giftCard: GiftCard) => {
    const printContent = `
      GIFT CARD RECEIPT
      =================
      Card Number: ${giftCard.card_number}
      Initial Amount: ₦${giftCard.initial_amount.toLocaleString()}
      Current Balance: ₦${giftCard.current_balance.toLocaleString()}
      Issued: ${new Date(giftCard.issued_at).toLocaleDateString()}
      Status: ${giftCard.is_active ? 'Active' : 'Inactive'}
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre>${printContent}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <Plus size={16} className="text-green-600" />;
      case 'redemption': return <Gift size={16} className="text-purple-600" />;
      case 'refund': return <AlertCircle size={16} className="text-orange-600" />;
      default: return <CreditCard size={16} className="text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-4xl w-full mx-4">
        <GlassCard className="bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Gift size={24} className="text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Gift Card Management</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            {[
              { id: 'redeem', label: 'Redeem Card', icon: Gift },
              { id: 'purchase', label: 'Purchase Card', icon: Plus },
              { id: 'history', label: 'Transaction History', icon: History }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Redeem Tab */}
          {activeTab === 'redeem' && (
            <div className="space-y-6">
              {/* Search Card */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter gift card number..."
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <GlassButton
                  onClick={handleSearchCard}
                  disabled={loading || !cardNumber.trim()}
                  className="px-6"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                  Search
                </GlassButton>
              </div>

              {/* Card Details */}
              {currentGiftCard && (
                <GlassCard className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CreditCard size={24} className="text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Gift Card Details</h3>
                        <p className="text-sm text-gray-600">Card: {currentGiftCard.card_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(currentGiftCard.card_number)}
                        className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
                        title="Copy card number"
                      >
                        <Copy size={16} className="text-purple-600" />
                      </button>
                      <button
                        onClick={() => printGiftCard(currentGiftCard)}
                        className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
                        title="Print card"
                      >
                        <Printer size={16} className="text-purple-600" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Initial Amount</p>
                      <p className="font-semibold text-gray-900">₦{currentGiftCard.initial_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Balance</p>
                      <p className="font-semibold text-purple-600">₦{currentGiftCard.current_balance.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Amount to redeem..."
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <GlassButton
                      onClick={handleRedeem}
                      disabled={loading || !amount || parseFloat(amount) > currentGiftCard.current_balance}
                      className="px-6"
                    >
                      {loading ? <Loader2 size={20} className="animate-spin" /> : <Gift size={20} />}
                      Redeem
                    </GlassButton>
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {/* Purchase Tab */}
          {activeTab === 'purchase' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Gift size={48} className="text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Purchase New Gift Card</h3>
                <p className="text-gray-600">Create a new gift card for customers</p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gift Card Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      placeholder="0.00"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <GlassButton
                  onClick={handlePurchase}
                  disabled={loading || !purchaseAmount || parseFloat(purchaseAmount) <= 0}
                  className="w-full"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                  Create Gift Card
                </GlassButton>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && currentGiftCard && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Transaction History</h3>
                <p className="text-sm text-gray-600">Card: {currentGiftCard.card_number}</p>
              </div>

              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {transaction.transaction_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.transaction_type === 'purchase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'purchase' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                {transactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <History size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No transactions found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default GiftCardManager; 