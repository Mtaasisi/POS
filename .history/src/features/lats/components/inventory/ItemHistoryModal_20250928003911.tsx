import React, { useState, useEffect } from 'react';
import { X, History, User, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import InventoryManagementService, { InventoryAuditEntry } from '../../services/inventoryManagementService';

interface ItemHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    serial_number?: string;
    product?: { name: string };
  };
}

const ItemHistoryModal: React.FC<ItemHistoryModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const [history, setHistory] = useState<InventoryAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && item.id) {
      loadHistory();
    }
  }, [isOpen, item.id]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await InventoryManagementService.getItemHistory(item.id);
      if (response.success && response.data) {
        setHistory(response.data);
      } else {
        toast.error(response.error || 'Failed to load history');
      }
    } catch (error) {
      console.error('Failed to load item history:', error);
      toast.error('Failed to load item history');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getFieldDisplayName = (fieldName: string) => {
    switch (fieldName) {
      case 'status':
        return 'Status';
      case 'location':
        return 'Location';
      case 'shelf':
        return 'Shelf';
      case 'bin':
        return 'Bin';
      default:
        return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      case 'warranty':
        return 'bg-orange-100 text-orange-800';
      case 'returned':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5" />
              Item History
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Item Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Product</div>
            <div className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</div>
            {item.serial_number && (
              <>
                <div className="text-sm text-gray-600 mt-2">Serial Number</div>
                <div className="font-mono text-sm text-gray-900">{item.serial_number}</div>
              </>
            )}
          </div>

          {/* History List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading history...</p>
                </div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No history found</p>
                <p className="text-sm text-gray-500 mt-2">Changes will appear here when the item is modified</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-medium text-gray-900">
                            {getFieldDisplayName(entry.field_name)}
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          {entry.field_name === 'status' ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.new_value || '')}`}>
                              {entry.new_value}
                            </span>
                          ) : (
                            <div className="font-medium text-gray-900">{entry.new_value || 'Not set'}</div>
                          )}
                        </div>
                        
                        {entry.old_value && (
                          <div className="text-sm text-gray-600 mb-2">
                            Changed from: <span className="font-medium">{entry.old_value}</span>
                          </div>
                        )}
                        
                        {entry.reason && (
                          <div className="text-sm text-gray-600 mb-2">
                            Reason: <span className="font-medium">{entry.reason}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {entry.changed_by}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(entry.changed_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemHistoryModal;
