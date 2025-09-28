import React, { useState } from 'react';
import { X, RotateCcw, User, Smartphone, Calendar, Package, DollarSign, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import Modal from '../../shared/components/ui/Modal';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassBadge from '../../shared/components/ui/GlassBadge';
import { CustomerReturn } from '../../../lib/customerApi/returns';
import { formatCurrency } from '../../../lib/customerApi';
import { toast } from 'react-hot-toast';

type ReturnStatus = 'under-return-review' | 'return-accepted' | 'return-rejected' | 'return-resolved' | 'return-refunded' | 'return-exchanged';

interface ReturnDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnItem: CustomerReturn;
  onStatusUpdate: (returnId: string, status: ReturnStatus, resolution?: string) => void;
}

const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({
  isOpen,
  onClose,
  returnItem,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus>(returnItem.status);
  const [resolution, setResolution] = useState(returnItem.resolution || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status: ReturnStatus) => {
    switch (status) {
      case 'return-resolved':
      case 'return-refunded':
      case 'return-exchanged':
        return 'bg-green-100 text-green-800';
      case 'return-accepted':
        return 'bg-blue-100 text-blue-800';
      case 'return-rejected':
        return 'bg-red-100 text-red-800';
      case 'under-return-review':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: ReturnStatus) => {
    switch (status) {
      case 'return-resolved':
      case 'return-refunded':
      case 'return-exchanged':
        return <CheckCircle className="w-4 h-4" />;
      case 'return-accepted':
        return <Clock className="w-4 h-4" />;
      case 'return-rejected':
        return <XCircle className="w-4 h-4" />;
      case 'under-return-review':
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusUpdate = async () => {
    if (selectedStatus === returnItem.status && resolution === returnItem.resolution) {
      toast('No changes to update');
      return;
    }

    setIsUpdating(true);
    try {
      await onStatusUpdate(returnItem.id, selectedStatus, resolution);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions = [
    { value: 'under-return-review', label: 'Under Review', icon: <Clock className="w-4 h-4" /> },
    { value: 'return-accepted', label: 'Accepted', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'return-rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
    { value: 'return-resolved', label: 'Resolved', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'return-refunded', label: 'Refunded', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'return-exchanged', label: 'Exchanged', icon: <RotateCcw className="w-4 h-4" /> }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Return Details</h2>
              <p className="text-gray-600">Return ID: {returnItem.id.slice(0, 8)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{returnItem.customers?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-gray-900">{returnItem.customers?.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{returnItem.customers?.email || 'N/A'}</p>
              </div>
            </div>
          </GlassCard>

          {/* Device Information */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Device Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Brand</label>
                <p className="text-gray-900">{returnItem.manual_device_brand || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Model</label>
                <p className="text-gray-900">{returnItem.manual_device_model || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Serial Number</label>
                <p className="text-gray-900">{returnItem.manual_device_serial || 'N/A'}</p>
              </div>
              {returnItem.purchase_date && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Purchase Date</label>
                  <p className="text-gray-900">{formatDate(returnItem.purchase_date)}</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Return Information */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Return Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Return Type</label>
                <p className="text-gray-900 capitalize">{returnItem.return_type || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Reason</label>
                <p className="text-gray-900">{returnItem.reason || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Return Date</label>
                <p className="text-gray-900">{formatDate(returnItem.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Current Status</label>
                <GlassBadge className={`${getStatusColor(returnItem.status)} flex items-center gap-1 w-fit`}>
                  {getStatusIcon(returnItem.status)}
                  {returnItem.status.replace('return-', '')}
                </GlassBadge>
              </div>
            </div>
          </GlassCard>

          {/* Financial Information */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Information
            </h3>
            <div className="space-y-3">
              {returnItem.refund_amount && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Refund Amount</label>
                  <p className="text-gray-900 text-lg font-semibold">
                    {formatCurrency(returnItem.refund_amount)}
                  </p>
                </div>
              )}
              {returnItem.restocking_fee && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Restocking Fee</label>
                  <p className="text-gray-900">{formatCurrency(returnItem.restocking_fee)}</p>
                </div>
              )}
              {returnItem.refund_method && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Refund Method</label>
                  <p className="text-gray-900 capitalize">{returnItem.refund_method.replace('-', ' ')}</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Additional Information */}
        {(returnItem.customer_reported_issue || returnItem.staff_observed_issue || returnItem.condition_description) && (
          <GlassCard className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Additional Information
            </h3>
            <div className="space-y-4">
              {returnItem.customer_reported_issue && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer Reported Issue</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {returnItem.customer_reported_issue}
                  </p>
                </div>
              )}
              {returnItem.staff_observed_issue && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Staff Observed Issue</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {returnItem.staff_observed_issue}
                  </p>
                </div>
              )}
              {returnItem.condition_description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Condition Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {returnItem.condition_description}
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Status Update Section */}
        {returnItem.status === 'under-return-review' && (
          <GlassCard className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStatus(option.value as ReturnStatus)}
                      className={`p-3 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                        selectedStatus === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.icon}
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter resolution notes..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <GlassButton
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleStatusUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Resolution Display */}
        {returnItem.resolution && (
          <GlassCard className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution</h3>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
              {returnItem.resolution}
            </p>
          </GlassCard>
        )}
      </div>
    </Modal>
  );
};

export default ReturnDetailModal;

