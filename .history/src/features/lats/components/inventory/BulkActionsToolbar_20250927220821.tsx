import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Edit3, 
  MapPin, 
  Download,
  Trash2,
  CheckCircle,
  Package,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import InventoryManagementService from '../../services/inventoryManagementService';

interface BulkActionsToolbarProps {
  items: Array<{
    id: string;
    serial_number?: string;
    status: string;
    product?: { name: string };
  }>;
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onItemsUpdate: () => void;
  onExport: (filters?: any) => void;
  purchaseOrderId: string;
}

const statusOptions = [
  { value: 'available', label: 'Available', icon: CheckCircle, color: 'text-green-600' },
  { value: 'sold', label: 'Sold', icon: Package, color: 'text-blue-600' },
  { value: 'reserved', label: 'Reserved', icon: Clock, color: 'text-yellow-600' },
  { value: 'damaged', label: 'Damaged', icon: XCircle, color: 'text-red-600' },
  { value: 'warranty', label: 'Warranty', icon: AlertTriangle, color: 'text-orange-600' },
  { value: 'returned', label: 'Returned', icon: RotateCcw, color: 'text-purple-600' }
];

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  items,
  selectedItems,
  onSelectionChange,
  onItemsUpdate,
  onExport,
  purchaseOrderId
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [bulkReason, setBulkReason] = useState('');

  const selectedCount = selectedItems.length;
  const totalCount = items.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };

  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to update');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await InventoryManagementService.bulkUpdateItems({
        itemIds: selectedItems,
        status: newStatus,
        reason: bulkReason || undefined
      });

      if (response.success) {
        toast.success(`${response.data?.updated_count || selectedItems.length} items updated successfully`);
        onItemsUpdate();
        onSelectionChange([]);
        setBulkReason('');
        setShowStatusMenu(false);
      } else {
        toast.error(response.error || 'Failed to update items');
      }
    } catch (error) {
      console.error('Bulk status update failed:', error);
      toast.error('Failed to update items');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = () => {
    onExport();
  };

  const getSelectedItemsSummary = () => {
    if (selectedCount === 0) return null;
    
    const statusCounts = selectedItems.reduce((acc, itemId) => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        acc[item.status] = (acc[item.status] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="text-xs text-gray-600">
        {Object.entries(statusCounts).map(([status, count]) => (
          <span key={status} className="mr-2">
            {count} {status}
          </span>
        ))}
      </div>
    );
  };

  if (totalCount === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : isPartiallySelected ? (
              <div className="w-4 h-4 border-2 border-blue-600 rounded bg-blue-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-sm"></div>
              </div>
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
          
          {selectedCount > 0 && (
            <div className="text-sm text-gray-600">
              {selectedCount} of {totalCount} items selected
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Selected Items Summary */}
      {selectedCount > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900">
                {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
              </div>
              {getSelectedItemsSummary()}
            </div>
            <button
              onClick={() => onSelectionChange([])}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Bulk Actions:</span>
          
          {/* Status Update */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={isUpdating}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Edit3 className="w-4 h-4" />
              Update Status
            </button>
            
            {showStatusMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2">Select Status:</div>
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleBulkStatusUpdate(option.value)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded"
                        disabled={isUpdating}
                      >
                        <Icon className={`w-4 h-4 ${option.color}`} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Location Update */}
          <button
            onClick={() => setShowLocationMenu(!showLocationMenu)}
            disabled={isUpdating}
            className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <MapPin className="w-4 h-4" />
            Update Location
          </button>
        </div>
      )}

      {/* Bulk Reason Input */}
      {(showStatusMenu || showLocationMenu) && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <label htmlFor="bulkReason" className="block text-sm font-medium text-gray-700 mb-2">
            Reason for bulk update (optional)
          </label>
          <input
            id="bulkReason"
            type="text"
            value={bulkReason}
            onChange={(e) => setBulkReason(e.target.value)}
            placeholder="Enter reason for bulk update..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      )}

      {/* Individual Item Selection */}
      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
            <button
              onClick={() => handleSelectItem(item.id)}
              className="flex-shrink-0"
            >
              {selectedItems.includes(item.id) ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {item.product?.name || 'Unknown Product'}
              </div>
              {item.serial_number && (
                <div className="text-xs text-gray-500 font-mono truncate">
                  {item.serial_number}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.status === 'available' ? 'bg-green-100 text-green-700' :
                item.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                item.status === 'damaged' ? 'bg-red-100 text-red-700' :
                item.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
