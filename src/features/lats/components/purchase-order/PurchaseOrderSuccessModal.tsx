import React from 'react';
import { 
  CheckCircle, 
  Eye, 
  Edit, 
  Download, 
  Share2, 
  ArrowRight, 
  Printer, 
  MessageSquare,
  Truck,
  FileText,
  Copy,
  Plus
} from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { PurchaseOrder } from '../../types/inventory';

interface PurchaseOrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
  onViewOrder: () => void;
  onEditOrder: () => void;
  onPrintOrder: () => void;
  onSendToSupplier: () => void;
  onDownloadPDF: () => void;
  onCopyOrderNumber: () => void;
  onShareOrder: () => void;
  onGoToOrders: () => void;
  onCreateAnother: () => void;
}

const PurchaseOrderSuccessModal: React.FC<PurchaseOrderSuccessModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onViewOrder,
  onEditOrder,
  onPrintOrder,
  onSendToSupplier,
  onDownloadPDF,
  onCopyOrderNumber,
  onShareOrder,
  onGoToOrders,
  onCreateAnother
}) => {
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = async (action: () => void | Promise<void>, actionName: string) => {
    setIsLoading(actionName);
    try {
      await action();
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="po-success-modal-title"
      style={{ backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle size={32} className="text-green-100" />
            <div>
              <h2 id="po-success-modal-title" className="text-xl font-bold">
                Purchase Order Created!
              </h2>
              <p className="text-green-100 mt-1">
                PO #{purchaseOrder.orderNumber} has been successfully created
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Order Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Order Number</p>
                <p className="font-mono font-semibold text-gray-900">{purchaseOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className="font-semibold text-gray-900">{formatCurrency(purchaseOrder.totalAmount)}</p>
              </div>
              <div>
                <p className="text-gray-600">Items</p>
                <p className="font-semibold text-gray-900">{purchaseOrder.items.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <CheckCircle size={12} className="mr-1" />
                  {purchaseOrder.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Primary Actions</h3>
              
              <GlassButton
                onClick={() => handleAction(onViewOrder, 'view')}
                icon={<Eye size={16} />}
                className="w-full justify-start bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                disabled={isLoading !== null}
              >
                {isLoading === 'view' ? 'Loading...' : 'View Order'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onEditOrder, 'edit')}
                icon={<Edit size={16} />}
                className="w-full justify-start bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                disabled={isLoading !== null}
              >
                {isLoading === 'edit' ? 'Loading...' : 'Edit Order'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onPrintOrder, 'print')}
                icon={<Printer size={16} />}
                className="w-full justify-start bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                disabled={isLoading !== null}
              >
                {isLoading === 'print' ? 'Printing...' : 'Print Order'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onSendToSupplier, 'send')}
                icon={<MessageSquare size={16} />}
                className="w-full justify-start bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                disabled={isLoading !== null}
              >
                {isLoading === 'send' ? 'Sending...' : 'Send to Supplier'}
              </GlassButton>
            </div>

            {/* Secondary Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Additional Actions</h3>
              
              <GlassButton
                onClick={() => handleAction(onDownloadPDF, 'download')}
                icon={<Download size={16} />}
                variant="secondary"
                className="w-full justify-start"
                disabled={isLoading !== null}
              >
                {isLoading === 'download' ? 'Downloading...' : 'Download PDF'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onCopyOrderNumber, 'copy')}
                icon={<Copy size={16} />}
                variant="secondary"
                className="w-full justify-start"
                disabled={isLoading !== null}
              >
                {isLoading === 'copy' ? 'Copied!' : 'Copy Order Number'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onShareOrder, 'share')}
                icon={<Share2 size={16} />}
                variant="secondary"
                className="w-full justify-start"
                disabled={isLoading !== null}
              >
                {isLoading === 'share' ? 'Sharing...' : 'Share Order'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onGoToOrders, 'orders')}
                icon={<FileText size={16} />}
                variant="secondary"
                className="w-full justify-start"
                disabled={isLoading !== null}
              >
                {isLoading === 'orders' ? 'Loading...' : 'View All Orders'}
              </GlassButton>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <GlassButton
                onClick={() => handleAction(onCreateAnother, 'create')}
                icon={<Plus size={16} />}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                disabled={isLoading !== null}
              >
                {isLoading === 'create' ? 'Creating...' : 'Create Another PO'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(() => window.open(`/lats/purchase-orders/${purchaseOrder.id}`, '_blank'), 'open')}
                icon={<ArrowRight size={16} />}
                variant="outline"
                className="border-gray-300 hover:border-gray-400"
                disabled={isLoading !== null}
              >
                Open in New Tab
              </GlassButton>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <GlassButton
            onClick={onClose}
            variant="secondary"
            className="text-sm"
          >
            Close
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderSuccessModal;
