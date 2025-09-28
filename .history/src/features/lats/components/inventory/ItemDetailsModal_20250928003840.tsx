import React, { useState } from 'react';
import { X, Package, MapPin, Calendar, DollarSign, AlertTriangle, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import InventoryManagementService from '../../services/inventoryManagementService';

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    serial_number?: string;
    imei?: string;
    mac_address?: string;
    barcode?: string;
    status: string;
    location?: string;
    shelf?: string;
    bin?: string;
    purchase_date?: string;
    warranty_start?: string;
    warranty_end?: string;
    cost_price?: number;
    selling_price?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    product?: {
      name: string;
      sku: string;
    };
    variant?: {
      name: string;
      sku: string;
    };
  };
  onItemUpdate?: () => void;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
  onItemUpdate
}) => {
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(item?.status || '');
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Don't render if item is null or modal is not open
  if (!isOpen || !item) return null;

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

  const isWarrantyExpiring = item.warranty_end && 
    new Date(item.warranty_end) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not set';
    return `TZS ${amount.toLocaleString()}`;
  };

  const statusOptions = [
    { value: 'available', label: 'Available', color: 'bg-green-100 text-green-800' },
    { value: 'sold', label: 'Sold', color: 'bg-blue-100 text-blue-800' },
    { value: 'reserved', label: 'Reserved', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'damaged', label: 'Damaged', color: 'bg-red-100 text-red-800' },
    { value: 'warranty', label: 'Warranty', color: 'bg-orange-100 text-orange-800' },
    { value: 'returned', label: 'Returned', color: 'bg-purple-100 text-purple-800' }
  ];

  const handleStatusUpdate = async () => {
    if (selectedStatus === item.status) {
      toast.info('Status is already set to this value');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await InventoryManagementService.updateItemStatus({
        itemId: item.id,
        status: selectedStatus,
        reason: reason || undefined
      });

      if (response.success) {
        toast.success('Status updated successfully');
        setShowStatusUpdate(false);
        setReason('');
        onItemUpdate?.();
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Item Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Product Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Product Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Product Name</div>
                  <div className="font-medium text-gray-900">{item.product?.name || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Product SKU</div>
                  <div className="font-mono text-sm text-gray-900">{item.product?.sku || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Variant</div>
                  <div className="font-medium text-gray-900">{item.variant?.name || 'Default'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Variant SKU</div>
                  <div className="font-mono text-sm text-gray-900">{item.variant?.sku || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Serial Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Serial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Serial Number</div>
                  <div className="font-mono text-sm text-gray-900">{item.serial_number || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">IMEI</div>
                  <div className="font-mono text-sm text-gray-900">{item.imei || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">MAC Address</div>
                  <div className="font-mono text-sm text-gray-900">{item.mac_address || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Barcode</div>
                  <div className="font-mono text-sm text-gray-900">{item.barcode || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Status & Location */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Status & Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <button
                      onClick={() => setShowStatusUpdate(true)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                      title="Edit Status"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Location</div>
                  <div className="font-medium text-gray-900">{item.location || 'Not assigned'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Shelf</div>
                  <div className="font-medium text-gray-900">{item.shelf || 'Not assigned'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Bin</div>
                  <div className="font-medium text-gray-900">{item.bin || 'Not assigned'}</div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financial Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Cost Price</div>
                  <div className="font-medium text-gray-900">{formatCurrency(item.cost_price)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Selling Price</div>
                  <div className="font-medium text-gray-900">{formatCurrency(item.selling_price)}</div>
                </div>
                {item.cost_price && item.selling_price && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-600">Profit Margin</div>
                    <div className="font-medium text-gray-900">
                      {formatCurrency(item.selling_price - item.cost_price)} 
                      <span className="text-sm text-gray-600 ml-2">
                        ({((item.selling_price - item.cost_price) / item.cost_price * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warranty Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Warranty Information
                {isWarrantyExpiring && (
                  <AlertTriangle className="w-4 h-4 text-orange-500" title="Warranty expiring soon" />
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Purchase Date</div>
                  <div className="font-medium text-gray-900">{formatDate(item.purchase_date)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Warranty Start</div>
                  <div className="font-medium text-gray-900">{formatDate(item.warranty_start)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Warranty End</div>
                  <div className="font-medium text-gray-900">{formatDate(item.warranty_end)}</div>
                </div>
              </div>
              {isWarrantyExpiring && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm text-orange-800 font-medium">
                    ⚠️ Warranty expires on {formatDate(item.warranty_end)}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {item.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{item.notes}</div>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Timestamps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Created</div>
                  <div className="text-sm text-gray-900">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Last Updated</div>
                  <div className="text-sm text-gray-900">
                    {new Date(item.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
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

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
                <button
                  onClick={() => setShowStatusUpdate(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for status change..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowStatusUpdate(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={isUpdating || selectedStatus === item.status}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailsModal;
