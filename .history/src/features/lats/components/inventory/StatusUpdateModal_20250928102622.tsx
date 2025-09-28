import React, { useState } from 'react';
import { X, CheckCircle, Package, Clock, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    serial_number?: string;
    product?: { name: string };
    status: string;
  };
  onStatusUpdate: (itemId: string, newStatus: string, reason?: string) => Promise<void>;
  isUpdating?: boolean;
}

const statusOptions = [
  {
    value: 'available',
    label: 'Available',
    description: 'Item is ready for sale',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    value: 'sold',
    label: 'Sold',
    description: 'Item has been sold to a customer',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    value: 'reserved',
    label: 'Reserved',
    description: 'Item is reserved for a customer',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  {
    value: 'damaged',
    label: 'Damaged',
    description: 'Item is damaged and not sellable',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    value: 'warranty',
    label: 'Warranty',
    description: 'Item is under warranty claim',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    value: 'returned',
    label: 'Returned',
    description: 'Item has been returned by customer',
    icon: RotateCcw,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
];

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  onClose,
  item,
  onStatusUpdate,
  isUpdating = false
}) => {
  const [selectedStatus, setSelectedStatus] = useState(item?.status || 'available');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) {
      toast.error('No item selected');
      return;
    }
    
    if (selectedStatus === item.status) {
      toast.info('Status is already set to this value');
      return;
    }

    setIsSubmitting(true);
    try {
      await onStatusUpdate(item.id, selectedStatus, reason || undefined);
      toast.success('Status updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  const selectedOption = statusOptions.find(option => option.value === selectedStatus);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Update Item Status</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
              disabled={isSubmitting}
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

          {/* Status Selection */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select New Status
              </label>
              <div className="grid grid-cols-1 gap-3">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedStatus === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedStatus(option.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? `${option.borderColor} ${option.bgColor}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? option.color : 'text-gray-400'}`} />
                        <div>
                          <div className={`font-medium ${isSelected ? option.color : 'text-gray-900'}`}>
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {option.description}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-green-600 ml-auto mt-0.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for status change..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedStatus === item.status}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Update Status
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
