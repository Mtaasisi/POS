import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { X, DollarSign, Calculator, CheckCircle, ArrowLeft, ArrowRight, Package } from 'lucide-react';
import { format } from '../lib/format';
import { ProductSearchResult, ProductSearchVariant } from '../types/pos';

interface VariantSelectionPageProps {
  isOpen?: boolean;
  onClose?: () => void;
  product?: ProductSearchResult;
  onSelectVariant?: (variant: ProductSearchVariant) => void;
}

const VariantSelectionPage: React.FC<VariantSelectionPageProps> = ({ 
  isOpen = false, 
  onClose, 
  product: propProduct, 
  onSelectVariant 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedVariant, setSelectedVariant] = useState<ProductSearchVariant | null>(null);

  // Get product from props or navigation state
  const product = propProduct || location.state?.product;
  
  // If no product is provided, show empty state
  if (!product) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Product Selected</h1>
            <p className="text-gray-600 mb-6">Please select a product to view its variants.</p>
            <GlassButton onClick={() => navigate('/lats/pos')}>
              Back to POS
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return 'out-of-stock';
    if (stock <= 5) return 'low';
    return 'normal';
  };

  const handleVariantSelect = (variant: ProductSearchVariant) => {
    setSelectedVariant(variant);
    console.log('Selected variant:', variant);
    
    // Automatically confirm selection
    if (onSelectVariant) {
      // If used as modal, call the callback immediately
      onSelectVariant(variant);
      onClose?.();
    } else {
      // If used as page, navigate back with the selected variant data immediately
      const returnUrl = location.state?.returnUrl || '/lats/pos';
      navigate(returnUrl, { 
        state: { 
          selectedVariant: variant,
          productName: product.name,
          action: 'addToCart',
          product: product,
          quantity: 1
        } 
      });
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleConfirm = () => {
    if (selectedVariant) {
      if (onSelectVariant) {
        // If used as modal, call the callback
        onSelectVariant(selectedVariant);
        onClose?.();
      } else {
        // If used as page, navigate back with the selected variant data
        const returnUrl = location.state?.returnUrl || '/lats/pos';
        navigate(returnUrl, { 
          state: { 
            selectedVariant: selectedVariant,
            productName: product.name,
            action: 'addToCart',
            product: product,
            quantity: 1
          } 
        });
      }
    }
  };

  // If used as modal and not open, don't render
  if (isOpen === false && onClose) {
    return null;
  }

  return (
    <div className={`${onClose ? 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4' : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4'}`}>
      <div className={`${onClose ? 'w-full max-w-2xl' : 'max-w-2xl mx-auto'}`}>
        <GlassCard className="w-full">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                {!onClose && (
                  <button
                    onClick={handleCancel}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Variant Selection</h1>
                    <p className="text-sm text-gray-600">Choose a variant for your product</p>
                  </div>
                </div>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Product Info Display */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-center border border-blue-200">
                <div className="text-sm text-blue-700 mb-2 font-medium">Product</div>
                <div className="text-2xl font-bold text-blue-900 mb-2">{product.name}</div>
                <div className="text-sm text-blue-600">
                  {product.categoryName} • {product.brandName}
                </div>
              </div>
            </div>

            {/* Variants Section */}
            <div className="mb-8">
              <div className="text-sm text-gray-600 mb-3 font-medium">Available Variants:</div>
              <div className="grid grid-cols-1 gap-3">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const variantStockStatus = getStockStatus(variant.quantity);
                  
                  return (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantSelect(variant)}
                      disabled={variantStockStatus === 'out-of-stock'}
                      className={`w-full p-4 text-left border-2 rounded-xl transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-lg' 
                          : variantStockStatus === 'out-of-stock'
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-lg text-gray-900 mb-2">{variant.name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                            <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg text-xs">{variant.sku}</span>
                            {Object.entries(variant.attributes).map(([key, value]) => (
                              <span key={key} className="text-blue-600 bg-blue-100 px-3 py-1 rounded-lg text-xs">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            variantStockStatus === 'out-of-stock' ? 'bg-red-100 text-red-700' :
                            variantStockStatus === 'low' ? 'bg-orange-100 text-orange-700' : 
                            'bg-green-100 text-green-700'
                          }`}>
                            Stock: {variant.quantity} units
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-2xl text-gray-900 mb-1">{format.money(variant.sellingPrice)}</div>
                          {variantStockStatus === 'out-of-stock' && (
                            <div className="text-xs text-red-600 font-medium">Out of Stock</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>






          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default VariantSelectionPage;
