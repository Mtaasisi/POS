import React, { useState, useEffect } from 'react';
import { X, Clock, User, Package, Trash2, Download, AlertCircle } from 'lucide-react';
import { draftService, POSDraft } from '../../lib/draftService';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';

interface DraftManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: (draft: POSDraft) => void;
  currentDraftId?: string;
}

const DraftManagementModal: React.FC<DraftManagementModalProps> = ({
  isOpen,
  onClose,
  onLoadDraft,
  currentDraftId
}) => {
  const [drafts, setDrafts] = useState<POSDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<POSDraft | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDrafts();
    }
  }, [isOpen]);

  const loadDrafts = () => {
    setLoading(true);
    try {
      const allDrafts = draftService.getAllDrafts();
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDraft = (draft: POSDraft) => {
    setSelectedDraft(draft);
  };

  const confirmLoadDraft = () => {
    if (selectedDraft) {
      onLoadDraft(selectedDraft);
      onClose();
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      const success = draftService.deleteDraft(draftId);
      if (success) {
        loadDrafts();
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalItems = (cartItems: any[]) => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getTotalValue = (cartItems: any[]) => {
    return cartItems.reduce((total, item) => {
      const price = item.price || item.variants?.[0]?.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800">Saved Drafts</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No saved drafts found</p>
              <p className="text-gray-400 text-sm mt-2">
                Your cart will be automatically saved as a draft when you close the page
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className={`p-4 border rounded-lg transition-all cursor-pointer ${
                    selectedDraft?.id === draft.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${currentDraftId === draft.id ? 'ring-2 ring-green-500' : ''}`}
                  onClick={() => handleLoadDraft(draft)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">
                          {formatDate(draft.updatedAt)}
                        </span>
                        {currentDraftId === draft.id && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span>{getTotalItems(draft.cartItems)} items</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Total:</span>
                          <span className="font-semibold">
                            KES {getTotalValue(draft.cartItems).toLocaleString()}
                          </span>
                        </div>

                        {draft.customer && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>{draft.customer.name}</span>
                          </div>
                        )}
                      </div>

                      {draft.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{draft.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <GlassButton
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDraft(draft.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </GlassButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDraft && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">
                  Load this draft?
                </span>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                This will replace your current cart with the selected draft.
              </p>
              <div className="flex gap-3">
                <GlassButton
                  onClick={confirmLoadDraft}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Load Draft
                </GlassButton>
                <GlassButton
                  variant="outline"
                  onClick={() => setSelectedDraft(null)}
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved</span>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all drafts?')) {
                    draftService.clearAllDrafts();
                    loadDrafts();
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default DraftManagementModal;
