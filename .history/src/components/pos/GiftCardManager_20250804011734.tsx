import React, { useState, useEffect } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { 
  Gift, 
  CreditCard, 
  Plus, 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  History, 
  Copy, 
  Printer, 
  Download,
  BarChart3,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  Package,
  FileText,
  Settings,
  Star,
  Award,
  Heart,
  Crown,
  Zap,
  Sparkles,
  Calculator
} from 'lucide-react';
import { posApi, GiftCard, GiftCardTransaction, GiftCardTemplate, GiftCardCategory, GiftCardAnalytics, BulkGiftCardRequest } from '../../lib/posApi';

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
  const [activeTab, setActiveTab] = useState<'redeem' | 'purchase' | 'bulk' | 'templates' | 'analytics' | 'search' | 'history'>('redeem');
  const [cardNumber, setCardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentGiftCard, setCurrentGiftCard] = useState<GiftCard | null>(null);
  const [transactions, setTransactions] = useState<GiftCardTransaction[]>([]);
  const [templates, setTemplates] = useState<GiftCardTemplate[]>([]);
  const [categories, setCategories] = useState<GiftCardCategory[]>([]);
  const [analytics, setAnalytics] = useState<GiftCardAnalytics | null>(null);
  const [searchResults, setSearchResults] = useState<GiftCard[]>([]);
  const [bulkRequest, setBulkRequest] = useState<BulkGiftCardRequest>({
    quantity: 10,
    amount: 1000,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadCategories();
      loadAnalytics();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const templatesData = await posApi.getGiftCardTemplates();
      setTemplates(templatesData);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await posApi.getGiftCardCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await posApi.getGiftCardAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

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
              setSuccess(`Successfully redeemed Tsh${redeemAmount.toLocaleString()}`);
      
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
      const newGiftCard = await posApi.purchaseGiftCard(amount, undefined, selectedTemplate);
      setPurchaseAmount('');
      setSelectedTemplate('');
      setSuccess(`Gift card created! Card number: ${newGiftCard.card_number}`);
      
      // Call parent callback
      onGiftCardPurchase?.(amount);
      
      // Refresh analytics
      loadAnalytics();
    } catch (err) {
      console.error('Error purchasing gift card:', err);
      setError('Failed to create gift card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkRequest.amount || bulkRequest.quantity <= 0) {
      setError('Please enter valid amount and quantity');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const giftCards = await posApi.createBulkGiftCards(bulkRequest);
      setSuccess(`Successfully created ${giftCards.length} gift cards!`);
      
      // Export to CSV
      const csvData = await posApi.exportGiftCardsToCSV(giftCards.map(card => card.id));
      downloadCSV(csvData, `gift_cards_${new Date().toISOString().split('T')[0]}.csv`);
      
      // Refresh analytics
      loadAnalytics();
    } catch (err) {
      console.error('Error creating bulk gift cards:', err);
      setError('Failed to create bulk gift cards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await posApi.searchGiftCards({
        cardNumber: cardNumber || undefined,
        amountRange: { min: 0, max: 100000 },
        status: 'active'
      });
      setSearchResults(results);
      setSuccess(`Found ${results.length} gift cards`);
    } catch (err) {
      console.error('Error searching gift cards:', err);
      setError('Failed to search gift cards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  const downloadCSV = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printGiftCard = (giftCard: GiftCard) => {
    const printContent = `
      GIFT CARD RECEIPT
      =================
      Card Number: ${giftCard.card_number}
              Initial Amount: Tsh${giftCard.initial_amount.toLocaleString()}
        Current Balance: Tsh${giftCard.current_balance.toLocaleString()}
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

  const getTemplateIcon = (design: string) => {
    switch (design) {
      case 'birthday': return '🎂';
      case 'holiday': return '🎄';
      case 'premium': return '💎';
      case 'celebration': return '🎉';
      default: return '🎁';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-6xl w-full mx-4">
        <GlassCard className="bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Gift size={24} className="text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Enhanced Gift Card Management</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            {[
              { id: 'redeem', label: 'Redeem', icon: Gift },
              { id: 'purchase', label: 'Purchase', icon: Plus },
              { id: 'templates', label: 'Templates', icon: Star },
              { id: 'bulk', label: 'Bulk Create', icon: Package },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'search', label: 'Search', icon: Search },
              { id: 'history', label: 'History', icon: History }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
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
                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gift Card Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.icon} {template.name}
                      </option>
                    ))}
                  </select>
                </div>

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

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Star size={48} className="text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Gift Card Templates</h3>
                <p className="text-gray-600">Choose from our beautiful gift card designs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <GlassCard
                    key={template.id}
                    className="hover:shadow-lg transition-all cursor-pointer group"
                    style={{ borderColor: template.color }}
                  >
                    <div className="text-center p-6">
                      <div className="text-4xl mb-4">{template.icon}</div>
                      <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">Available Amounts:</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {template.amounts.map((amount) => (
                            <span
                              key={amount}
                              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                            >
                              ₦{amount.toLocaleString()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <GlassButton
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setActiveTab('purchase');
                        }}
                      >
                        Use Template
                      </GlassButton>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Create Tab */}
          {activeTab === 'bulk' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Package size={48} className="text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Bulk Gift Card Creation</h3>
                <p className="text-gray-600">Create multiple gift cards at once</p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={bulkRequest.quantity}
                    onChange={(e) => setBulkRequest(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount per Card
                  </label>
                  <input
                    type="number"
                    value={bulkRequest.amount}
                    onChange={(e) => setBulkRequest(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={bulkRequest.notes}
                    onChange={(e) => setBulkRequest(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add notes about this batch..."
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator size={16} className="text-blue-600" />
                    <span className="font-medium text-blue-900">Summary</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Total Value: ₦{(bulkRequest.quantity * bulkRequest.amount).toLocaleString()}
                  </p>
                </div>

                <GlassButton
                  onClick={handleBulkCreate}
                  disabled={loading || bulkRequest.quantity <= 0 || bulkRequest.amount <= 0}
                  className="w-full"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Package size={20} />}
                  Create {bulkRequest.quantity} Gift Cards
                </GlassButton>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <BarChart3 size={48} className="text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Gift Card Analytics</h3>
                <p className="text-gray-600">Comprehensive insights into gift card performance</p>
              </div>

              {analytics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <CreditCard size={24} className="text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-600">Total Cards</p>
                    <p className="text-2xl font-bold text-blue-700">{analytics.totalCards}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <DollarSign size={24} className="text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-600">Total Value</p>
                    <p className="text-2xl font-bold text-green-700">₦{analytics.totalValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <Gift size={24} className="text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-purple-600">Redeemed Value</p>
                    <p className="text-2xl font-bold text-purple-700">₦{analytics.redeemedValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <TrendingUp size={24} className="text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-orange-600">Redemption Rate</p>
                    <p className="text-2xl font-bold text-orange-700">{analytics.redemptionRate.toFixed(1)}%</p>
                  </div>
                </div>
              )}

              {/* Popular Amounts */}
              {analytics && analytics.popularAmounts.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Popular Gift Card Amounts</h4>
                  <div className="space-y-2">
                    {analytics.popularAmounts.slice(0, 5).map((item) => (
                      <div key={item.amount} className="flex items-center justify-between">
                        <span className="text-gray-700">₦{item.amount.toLocaleString()}</span>
                        <span className="font-medium text-purple-600">{item.count} cards</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Search size={48} className="text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Advanced Gift Card Search</h3>
                <p className="text-gray-600">Find gift cards with advanced filters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="Search by card number..."
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <GlassButton
                onClick={handleAdvancedSearch}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                Search Gift Cards
              </GlassButton>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Search Results ({searchResults.length})</h4>
                  {searchResults.map((card) => (
                    <div key={card.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{card.card_number}</p>
                        <p className="text-sm text-gray-600">₦{card.initial_amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Balance</p>
                        <p className="font-medium text-purple-600">₦{card.current_balance.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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