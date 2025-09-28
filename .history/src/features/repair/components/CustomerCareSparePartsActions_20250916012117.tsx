import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Package, 
  AlertTriangle, 
  MessageSquare,
  User,
  Clock
} from 'lucide-react';
import { RepairPart } from '../services/repairPartsApi';
import { acceptSpareParts, rejectSpareParts } from '../services/repairPartsApi';
import { toast } from 'react-hot-toast';

interface CustomerCareSparePartsActionsProps {
  repairParts: RepairPart[];
  onPartsUpdate: (parts: RepairPart[]) => void;
  currentUser: any;
}

const CustomerCareSparePartsActions: React.FC<CustomerCareSparePartsActionsProps> = ({
  repairParts,
  onPartsUpdate,
  currentUser
}) => {
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Filter parts that can be accepted (needed or ordered status)
  const actionableParts = repairParts.filter(part => 
    part.status === 'needed' || part.status === 'ordered'
  );

  const handleSelectPart = (partId: string) => {
    setSelectedParts(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  const handleSelectAll = () => {
    if (selectedParts.length === actionableParts.length) {
      setSelectedParts([]);
    } else {
      setSelectedParts(actionableParts.map(part => part.id));
    }
  };

  const handleAcceptParts = async () => {
    if (selectedParts.length === 0) {
      toast.error('Please select parts to accept');
      return;
    }

    setLoading(true);
    try {
      const result = await acceptSpareParts(selectedParts);
      if (result.ok && result.data) {
        // Update the parts in the parent component
        const updatedParts = repairParts.map(part => {
          if (selectedParts.includes(part.id)) {
            return { ...part, status: 'accepted' as const };
          }
          return part;
        });
        onPartsUpdate(updatedParts);
        
        toast.success(result.message);
        setSelectedParts([]);
      } else {
        toast.error(result.message || 'Failed to accept parts');
      }
    } catch (error) {
      console.error('Error accepting parts:', error);
      toast.error('Failed to accept parts');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectParts = async () => {
    if (selectedParts.length === 0) {
      toast.error('Please select parts to reject');
      return;
    }

    setLoading(true);
    try {
      const result = await rejectSpareParts(selectedParts, rejectReason);
      if (result.ok && result.data) {
        // Update the parts in the parent component
        const updatedParts = repairParts.map(part => {
          if (selectedParts.includes(part.id)) {
            return { 
              ...part, 
              status: 'needed' as const,
              notes: rejectReason ? `Rejected by customer care: ${rejectReason}` : part.notes
            };
          }
          return part;
        });
        onPartsUpdate(updatedParts);
        
        toast.success(result.message);
        setSelectedParts([]);
        setShowRejectModal(false);
        setRejectReason('');
      } else {
        toast.error(result.message || 'Failed to reject parts');
      }
    } catch (error) {
      console.error('Error rejecting parts:', error);
      toast.error('Failed to reject parts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'needed': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'ordered': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'received': return <Package className="h-4 w-4 text-green-500" />;
      case 'used': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default: return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'needed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ordered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'received': return 'bg-green-100 text-green-800 border-green-200';
      case 'used': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (actionableParts.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">All spare parts have been processed</span>
        </div>
        <p className="text-blue-600 text-sm mt-1">
          No parts are currently pending customer care approval.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-semibold">Customer Care Actions</h3>
              <p className="text-purple-100 text-sm">
                {actionableParts.length} parts pending approval
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-sm"
            >
              {selectedParts.length === actionableParts.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
      </div>

      {/* Parts List */}
      <div className="max-h-64 overflow-y-auto">
        {actionableParts.map((part) => (
          <div
            key={part.id}
            className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
              selectedParts.includes(part.id) ? 'bg-blue-50 border-blue-200' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedParts.includes(part.id)}
                onChange={() => handleSelectPart(part.id)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(part.status)}
                  <h4 className="font-medium text-gray-900">
                    {part.spare_part?.name || 'Unknown Part'}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(part.status)}`}>
                    {part.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Part Number: {part.spare_part?.part_number || 'N/A'}</div>
                  <div>Quantity: {part.quantity_needed}</div>
                  <div>Cost: ${part.cost_per_unit?.toFixed(2) || '0.00'} each</div>
                  {part.notes && (
                    <div className="flex items-start gap-1">
                      <MessageSquare className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{part.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {selectedParts.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedParts.length} part{selectedParts.length > 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={handleAcceptParts}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Spare Parts
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting {selectedParts.length} part{selectedParts.length > 1 ? 's' : ''}:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason (optional)..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectParts}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Rejecting...' : 'Reject Parts'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCareSparePartsActions;
