import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Clock, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PurchaseOrderDraft {
  id: string;
  name: string;
  supplier?: any;
  cartItems: any[];
  currency: any;
  paymentTerms: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface PurchaseOrderDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: (draft: PurchaseOrderDraft) => void;
  onSaveDraft: (draft: Omit<PurchaseOrderDraft, 'id' | 'createdAt' | 'updatedAt'>) => void;
  currentDraft?: Partial<PurchaseOrderDraft>;
}

const PurchaseOrderDraftModal: React.FC<PurchaseOrderDraftModalProps> = ({
  isOpen,
  onClose,
  onLoadDraft,
  onSaveDraft,
  currentDraft
}) => {
  const [drafts, setDrafts] = useState<PurchaseOrderDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newDraftName, setNewDraftName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Load drafts from localStorage
  useEffect(() => {
    if (isOpen) {
      loadDrafts();
    }
  }, [isOpen]);

  const loadDrafts = () => {
    try {
      const savedDrafts = localStorage.getItem('purchase_order_drafts');
      if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts);
        setDrafts(parsedDrafts.sort((a: PurchaseOrderDraft, b: PurchaseOrderDraft) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
      toast.error('Failed to load drafts');
    }
  };

  const handleLoadDraft = (draft: PurchaseOrderDraft) => {
    onLoadDraft(draft);
    onClose();
    toast.success(`Loaded draft: ${draft.name}`);
  };

  const handleSaveDraft = () => {
    if (!newDraftName.trim()) {
      toast.error('Please enter a draft name');
      return;
    }

    if (!currentDraft || !currentDraft.supplier || !currentDraft.cartItems || currentDraft.cartItems.length === 0) {
      toast.error('No purchase order data to save');
      return;
    }

    const newDraft: PurchaseOrderDraft = {
      id: `draft_${Date.now()}`,
      name: newDraftName.trim(),
      supplier: currentDraft.supplier,
      cartItems: currentDraft.cartItems,
      currency: currentDraft.currency,
      paymentTerms: currentDraft.paymentTerms || 'net_30',
      notes: currentDraft.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const existingDrafts = JSON.parse(localStorage.getItem('purchase_order_drafts') || '[]');
      const updatedDrafts = [newDraft, ...existingDrafts];
      localStorage.setItem('purchase_order_drafts', JSON.stringify(updatedDrafts));
      
      setDrafts(updatedDrafts);
      setNewDraftName('');
      setShowSaveForm(false);
      onSaveDraft(newDraft);
      toast.success(`Draft saved: ${newDraft.name}`);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    try {
      const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
      localStorage.setItem('purchase_order_drafts', JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      toast.success('Draft deleted');
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Purchase Order Drafts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Save Current Draft */}
          <div className="mb-6">
            <button
              onClick={() => setShowSaveForm(!showSaveForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              Save Current Draft
            </button>

            {showSaveForm && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDraftName}
                    onChange={(e) => setNewDraftName(e.target.value)}
                    placeholder="Enter draft name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSaveDraft}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowSaveForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Draft List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Saved Drafts</h3>
            
            {drafts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No drafts saved yet</p>
                <p className="text-sm">Save your current purchase order as a draft to continue later</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{draft.name}</h4>
                        
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {draft.supplier && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>Supplier: {draft.supplier.name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>{draft.cartItems.length} items</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Updated: {formatDate(draft.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleLoadDraft(draft)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDraftModal;
