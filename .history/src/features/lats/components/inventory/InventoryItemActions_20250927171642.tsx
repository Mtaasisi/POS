import React from 'react';
import { 
  MoreHorizontal, 
  Edit3, 
  MapPin, 
  Eye, 
  History,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface InventoryItemActionsProps {
  item: {
    id: string;
    status: string;
    serial_number?: string;
    location?: string;
    warranty_end?: string;
  };
  onEditStatus: (item: any) => void;
  onEditLocation: (item: any) => void;
  onViewDetails: (item: any) => void;
  onViewHistory: (item: any) => void;
  compact?: boolean;
}

const InventoryItemActions: React.FC<InventoryItemActionsProps> = ({
  item,
  onEditStatus,
  onEditLocation,
  onViewDetails,
  onViewHistory,
  compact = false
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'sold':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'reserved':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'damaged':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warranty':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const isWarrantyExpiring = item.warranty_end && 
    new Date(item.warranty_end) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {getStatusIcon(item.status)}
        {isWarrantyExpiring && (
          <AlertTriangle className="w-3 h-3 text-orange-500" title="Warranty expiring soon" />
        )}
        <div className="relative group">
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </button>
          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity min-w-[140px]">
            <button
              onClick={() => onEditStatus(item)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit3 className="w-3 h-3" />
              Edit Status
            </button>
            <button
              onClick={() => onEditLocation(item)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <MapPin className="w-3 h-3" />
              Edit Location
            </button>
            <button
              onClick={() => onViewDetails(item)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye className="w-3 h-3" />
              View Details
            </button>
            <button
              onClick={() => onViewHistory(item)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <History className="w-3 h-3" />
              View History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon(item.status)}
      {isWarrantyExpiring && (
        <AlertTriangle className="w-4 h-4 text-orange-500" title="Warranty expiring soon" />
      )}
      <button
        onClick={() => onEditStatus(item)}
        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
        title="Edit Status"
      >
        <Edit3 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onEditLocation(item)}
        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
        title="Edit Location"
      >
        <MapPin className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewDetails(item)}
        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewHistory(item)}
        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
        title="View History"
      >
        <History className="w-4 h-4" />
      </button>
    </div>
  );
};

export default InventoryItemActions;
