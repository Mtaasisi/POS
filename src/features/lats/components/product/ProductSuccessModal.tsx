import React from 'react';
import { CheckCircle, Copy, Edit, Plus, Eye, Download, Share2, ArrowRight } from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';

interface ProductSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onViewProduct: () => void;
  onEditProduct: () => void;
  onDuplicateProduct: () => void;
  onCreateAnother: () => void;
  onCopyProductLink: () => void;
  onDownloadDetails: () => void;
  onShareProduct: () => void;
  onGoToInventory: () => void;
}

const ProductSuccessModal: React.FC<ProductSuccessModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  onViewProduct,
  onEditProduct,
  onDuplicateProduct,
  onCreateAnother,
  onCopyProductLink,
  onDownloadDetails,
  onShareProduct,
  onGoToInventory
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

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-success-modal-title"
      style={{ backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle size={32} className="text-green-100" />
            <div>
              <h2 id="product-success-modal-title" className="text-xl font-bold">
                Product Created Successfully!
              </h2>
              <p className="text-green-100 mt-1">
                "{productName}" has been added to your inventory
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Primary Actions</h3>
              
              <GlassButton
                onClick={() => handleAction(onViewProduct, 'view')}
                icon={<Eye size={16} />}
                className="w-full justify-start bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                disabled={isLoading !== null}
              >
                {isLoading === 'view' ? 'Loading...' : 'View Product Details'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onEditProduct, 'edit')}
                icon={<Edit size={16} />}
                className="w-full justify-start bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                disabled={isLoading !== null}
              >
                {isLoading === 'edit' ? 'Loading...' : 'Edit This Product'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onDuplicateProduct, 'duplicate')}
                icon={<Copy size={16} />}
                className="w-full justify-start bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                disabled={isLoading !== null}
              >
                {isLoading === 'duplicate' ? 'Loading...' : 'Duplicate Product'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onCreateAnother, 'create')}
                icon={<Plus size={16} />}
                className="w-full justify-start bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                disabled={isLoading !== null}
              >
                {isLoading === 'create' ? 'Loading...' : 'Create Another Product'}
              </GlassButton>
            </div>

            {/* Secondary Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Additional Actions</h3>
              
              <GlassButton
                onClick={() => handleAction(onCopyProductLink, 'copy')}
                icon={<Copy size={16} />}
                variant="secondary"
                className="w-full justify-start"
                disabled={isLoading !== null}
              >
                {isLoading === 'copy' ? 'Copying...' : 'Copy Product Link'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onDownloadDetails, 'download')}
                icon={<Download size={16} />}
                variant="secondary"
                className="w-full justify-start"
                disabled={isLoading !== null}
              >
                {isLoading === 'download' ? 'Downloading...' : 'Download Product Details'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onShareProduct, 'share')}
                icon={<Share2 size={16} />}
                variant="secondary"
                className="w-full justify-start"
                disabled={isLoading !== null}
              >
                {isLoading === 'share' ? 'Sharing...' : 'Share Product'}
              </GlassButton>
              
              <GlassButton
                onClick={() => handleAction(onGoToInventory, 'inventory')}
                icon={<ArrowRight size={16} />}
                variant="secondary"
                className="w-full justify-start"
                disabled={isLoading !== null}
              >
                {isLoading === 'inventory' ? 'Loading...' : 'Go to Inventory'}
              </GlassButton>
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Product ID</p>
                <p className="font-mono text-sm text-gray-900">{productId}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Status</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle size={12} className="mr-1" />
                  Active
                </span>
              </div>
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

export default ProductSuccessModal;
