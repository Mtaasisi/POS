// PurchaseOrderDraftModal component - For managing purchase order drafts
import React, { useState } from 'react';
import {
  Archive, Save, Trash2, Clock, FileText, Edit, Eye,
  Plus, Search, Calendar, DollarSign, Truck, XCircle
} from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';

interface PurchaseCartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantName?: string;
  sku: string;
  costPrice: number;
  quantity: number;
  totalPrice: number;
}

interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  phone?: string;
  email?: string;
  country?: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

interface PurchaseOrderDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: PurchaseCartItem[];
  supplier: Supplier | null;
  currency: Currency;
  expectedDelivery: string;
  paymentTerms: string;
  notes: string;
}

const PurchaseOrderDraftModal: React.FC<PurchaseOrderDraftModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  supplier,
  currency,
  expectedDelivery,
  paymentTerms,
  notes
}) => {
  const [draftName, setDraftName] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Mock draft data - in real app, this would come from a store or API
  const [savedDrafts] = useState([
    {
      id: '1',
      name: 'Office Supplies Order',
      supplier: 'Stationery Plus Ltd',
      itemCount: 5,
      totalAmount: 45000,
      currency: 'TZS',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T14:45:00Z'
    },
    {
      id: '2',
      name: 'IT Equipment Purchase',
      supplier: 'Tech Solutions Co',
      itemCount: 3,
      totalAmount: 180000,
      currency: 'USD',
      createdAt: '2024-01-14T09:15:00Z',
      updatedAt: '2024-01-14T16:20:00Z'
    }
  ]);

  const handleSaveDraft = async () => {
    if (!draftName.trim()) {
      alert('Please enter a draft name');
      return;
    }

    if (cartItems.length === 0) {
      alert('Cannot save empty draft');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Save draft to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      alert('Draft saved successfully!');
      onClose();
    } catch (error) {
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatMoney = (amount: number, currencyCode = 'TZS') => {
    if (currencyCode === 'TZS') {
      return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount).replace(/\.00$/, '').replace(/\.0$/, '');
    }
    
    return `$${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Archive className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Purchase Order Drafts</h2>
                <p className="text-gray-600">Save and manage purchase order drafts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Save Current Draft */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Current Draft</h3>
                
                {cartItems.length > 0 ? (
                  <div className="space-y-4">
                    {/* Current Draft Summary */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Items:</span>
                          <span className="font-medium">{cartItems.length} products</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Supplier:</span>
                          <span className="font-medium">{supplier?.name || 'Not selected'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total:</span>
                          <span className="font-semibold text-orange-600">{formatMoney(subtotal, currency.code)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Currency:</span>
                          <span className="font-medium">{currency.flag} {currency.code}</span>
                        </div>
                        {expectedDelivery && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Expected:</span>
                            <span className="font-medium">{formatDate(expectedDelivery)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Draft Name Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Draft Name *
                      </label>
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        placeholder="Enter a name for this draft..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {/* Draft Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        placeholder="Add any notes about this draft..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={3}
                      />
                    </div>

                    {/* Save Button */}
                    <GlassButton
                      onClick={handleSaveDraft}
                      disabled={isSaving || !draftName.trim()}
                      icon={<Save size={18} />}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white"
                    >
                      {isSaving ? 'Saving...' : 'Save Draft'}
                    </GlassButton>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No items in cart to save</p>
                    <p className="text-sm text-gray-500">Add products to create a draft</p>
                  </div>
                )}
              </div>
            </div>

            {/* Saved Drafts */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Saved Drafts</h3>
                
                {savedDrafts.length > 0 ? (
                  <div className="space-y-3">
                    {savedDrafts.map((draft) => (
                      <div 
                        key={draft.id}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-lg hover:border-orange-300 transition-all duration-200 bg-white"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{draft.name}</h4>
                            <p className="text-sm text-gray-600">{draft.supplier}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-orange-600">
                              {formatMoney(draft.totalAmount, draft.currency)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {draft.itemCount} items
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Created: {formatDate(draft.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Edit className="w-3 h-3" />
                            <span>Updated: {formatTime(draft.updatedAt)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              // TODO: Load draft
                              alert('Load draft functionality coming soon!');
                            }}
                            className="flex-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                          >
                            Load Draft
                          </button>
                          <button
                            onClick={() => {
                              // TODO: View draft details
                              alert('View draft details coming soon!');
                            }}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this draft?')) {
                                // TODO: Delete draft
                                alert('Delete draft functionality coming soon!');
                              }
                            }}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No drafts saved</p>
                    <p className="text-sm text-gray-500">Save your first draft to see it here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Drafts are automatically saved locally and synced to your account
            </div>
            <GlassButton
              onClick={onClose}
              variant="secondary"
            >
              Close
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default PurchaseOrderDraftModal;