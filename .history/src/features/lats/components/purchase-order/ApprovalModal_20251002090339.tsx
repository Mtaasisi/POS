import React, { useState } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  CheckCircle, XCircle, Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: any;
  onApprove: (notes: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onSubmitForApproval: (notes: string) => Promise<void>;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onApprove,
  onReject,
  onSubmitForApproval
}) => {
  const [action, setAction] = useState<'submit' | 'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !purchaseOrder) return null;

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error('Please provide notes for this action');
      return;
    }

    setIsProcessing(true);
    try {
      if (action === 'submit') {
        await onSubmitForApproval(notes);
        toast.success('Purchase order sent to supplier');
      } else if (action === 'approve') {
        await onApprove(notes);
        toast.success('Purchase order approved');
      } else if (action === 'reject') {
        await onReject(notes);
        toast.success('Purchase order rejected');
      }
      onClose();
      setNotes('');
      setAction(null);
    } catch (error) {
      toast.error('Failed to process approval action');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusInfo = () => {
    switch (purchaseOrder.status) {
      case 'sent':
        return {
          title: 'Purchase Order Sent',
          description: 'This purchase order has been sent to the supplier',
          action: null,
          icon: <CheckCircle className="w-6 h-6 text-blue-500" />,
          buttonText: 'Sent to Supplier',
          buttonColor: 'bg-blue-500 cursor-not-allowed'
        };
      case 'received':
        return {
          title: 'Purchase Order Received',
          description: 'This purchase order has been received from the supplier',
          action: null,
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          buttonText: 'Received',
          buttonColor: 'bg-green-500 cursor-not-allowed'
        };
      default:
        // For any other status (like draft), allow sending
        return {
          title: 'Send to Supplier',
          description: 'Send this purchase order to the supplier',
          action: 'submit',
          icon: <Shield className="w-6 h-6 text-blue-500" />,
          buttonText: 'Send to Supplier',
          buttonColor: 'bg-blue-500 hover:bg-blue-600'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <GlassCard className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {statusInfo?.icon}
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {statusInfo?.title || 'Purchase Order Approval'}
                </h2>
                <p className="text-gray-300 text-sm">
                  {statusInfo?.description || 'Manage purchase order approval'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Purchase Order Info */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Order Number</label>
                <p className="text-white font-medium">{purchaseOrder.orderNumber}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Total Amount</label>
                <p className="text-white font-medium">
                  {purchaseOrder.currency} {purchaseOrder.totalAmount?.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Supplier</label>
                <p className="text-white font-medium">{purchaseOrder.supplier?.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Status</label>
                <p className="text-white font-medium capitalize">{purchaseOrder.status}</p>
              </div>
            </div>
          </div>

          {/* Approval Actions */}
          {purchaseOrder.status === 'draft' && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="text-white">Send to Supplier</span>
              </div>
              <p className="text-gray-300 text-sm">
                This will send the purchase order to the supplier and mark it as 'sent'. 
                Once sent, you can mark it as 'received' when items arrive.
              </p>
            </div>
          )}

          {/* Notes Input */}
          {action && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {action === 'submit' && 'Submission Notes'}
                {action === 'approve' && 'Approval Notes'}
                {action === 'reject' && 'Rejection Reason'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  action === 'submit' 
                    ? 'Add notes about why this purchase order is needed...'
                    : action === 'approve'
                    ? 'Add approval notes...'
                    : 'Explain why this purchase order is being rejected...'
                }
                className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                rows={4}
                required
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <GlassButton
              onClick={onClose}
              variant="secondary"
              disabled={isProcessing}
            >
              Cancel
            </GlassButton>
            {action && (
              <GlassButton
                onClick={handleSubmit}
                disabled={isProcessing || !notes.trim()}
                className={`
                  ${action === 'approve' ? 'bg-green-500 hover:bg-green-600' : ''}
                  ${action === 'reject' ? 'bg-red-500 hover:bg-red-600' : ''}
                  ${action === 'submit' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                `}
              >
                {isProcessing ? 'Processing...' : 
                  action === 'approve' ? 'Approve' :
                  action === 'reject' ? 'Reject' :
                  'Submit for Approval'
                }
              </GlassButton>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ApprovalModal;
