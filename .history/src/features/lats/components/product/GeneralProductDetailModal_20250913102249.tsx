import React, { useState, useEffect } from 'react';
import { X, Package, Edit } from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Product } from '../../types/inventory';
import { format } from '../../lib/format';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { useInventoryStore } from '../../stores/useInventoryStore';
import EnhancedStockAdjustModal from '../inventory/EnhancedStockAdjustModal';

interface GeneralProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onEdit?: (product: Product) => void;
}

const GeneralProductDetailModal: React.FC<GeneralProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onEdit
}) => {
  const { } = useAuth();
  const { adjustStock, getProduct } = useInventoryStore();
  const [currentProduct, setCurrentProduct] = useState(product);
  
  // Stock adjustment state
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  // Update current product when prop changes
  useEffect(() => {
    setCurrentProduct(product);
  }, [product]);

  // Get primary variant
  const primaryVariant = currentProduct.variants?.[0];

  // Handle stock adjustment
  const handleStockAdjustment = async (productId: string, variantId: string, quantity: number, reason: string) => {
    try {
      setIsAdjustingStock(true);
      await adjustStock(productId, variantId, quantity, reason);
      
      // Refresh product data
      const updatedProduct = await getProduct(productId);
      if (updatedProduct && updatedProduct.data) {
        setCurrentProduct(updatedProduct.data);
      }
      
      toast.success('Stock adjusted successfully');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    } finally {
      setIsAdjustingStock(false);
    }
  };

  const closeStockAdjustment = () => {
    setShowStockAdjustment(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentProduct.name}</h2>
              <p className="text-sm text-gray-500">{primaryVariant?.sku || 'No SKU'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Basic Product Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium">{currentProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">SKU:</span>
                    <span className="text-sm font-medium">{primaryVariant?.sku || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="text-sm font-medium">
                      {typeof currentProduct.category === 'string' ? currentProduct.category : currentProduct.category?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Brand:</span>
                    <span className="text-sm font-medium">N/A</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Stock Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Stock:</span>
                    <span className="text-sm font-medium">
                      {currentProduct.variants?.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="text-sm font-medium">
                      {primaryVariant?.price ? format.money(primaryVariant.price) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Variants */}
            {currentProduct.variants && currentProduct.variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Variants</h3>
                <div className="space-y-2">
                  {currentProduct.variants.map((variant, index) => (
                    <div key={variant.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{variant.name || `Variant ${index + 1}`}</span>
                        {variant.sku && <span className="text-sm text-gray-500 ml-2">({variant.sku})</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">Stock: {variant.stockQuantity || 0}</span>
                        <span className="text-sm font-medium">
                          {variant.price ? format.money(variant.price) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <GlassButton
                onClick={() => setShowStockAdjustment(true)}
                icon={<Edit className="w-4 h-4" />}
              >
                Adjust Stock
              </GlassButton>
              {onEdit && (
                <GlassButton
                  onClick={() => onEdit(currentProduct)}
                  icon={<Edit className="w-4 h-4" />}
                  variant="secondary"
                >
                  Edit Product
                </GlassButton>
              )}
            </div>
          </div>
        </div>

        {/* Stock Adjustment Modal */}
        {showStockAdjustment && (
          <EnhancedStockAdjustModal
            product={currentProduct}
            isOpen={showStockAdjustment}
            onClose={closeStockAdjustment}
            onSubmit={async (data) => {
              const { variant, ...adjustmentData } = data;
              let quantity = adjustmentData.quantity;
              
              // Calculate the actual quantity change based on adjustment type
              if (adjustmentData.adjustmentType === 'out') {
                quantity = -quantity; // Negative for stock out
              } else if (adjustmentData.adjustmentType === 'set') {
                quantity = quantity - (variant.stockQuantity || 0); // Difference for set
              }
              
              await handleStockAdjustment(currentProduct.id, variant.id, quantity, adjustmentData.reason);
            }}
            loading={isAdjustingStock}
          />
        )}
      </div>
    </div>
  );
};

export default GeneralProductDetailModal;
