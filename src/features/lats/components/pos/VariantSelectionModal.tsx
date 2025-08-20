import React from 'react';
import { X, Package } from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { format } from '../../lib/format';
import { ProductSearchResult, ProductSearchVariant } from '../../types/pos';

interface VariantSelectionModalProps {
  product: ProductSearchResult;
  isOpen: boolean;
  onClose: () => void;
  onSelectVariant: (variant: ProductSearchVariant) => void;
  selectedVariant: ProductSearchVariant | null;
}

const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  product,
  isOpen,
  onClose,
  onSelectVariant,
  selectedVariant
}) => {
  if (!isOpen) return null;

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return 'out-of-stock';
    if (stock <= 5) return 'low';
    return 'normal';
  };

  const getProductThumbnail = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return null;
  };

  const thumbnail = getProductThumbnail();

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-0">
      {/* Make the modal fill the entire page */}
      <div className="bg-white rounded-xl shadow-2xl w-full h-full overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                {thumbnail ? (
                  <div className="w-12 h-12 bg-white rounded-lg border border-blue-200 overflow-hidden shadow-sm">
                    <img 
                      src={thumbnail} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="w-full h-full bg-blue-100 rounded-lg flex items-center justify-center hidden">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-semibold text-blue-900">{product.name}</h1>
                  <p className="text-sm text-blue-700">Select a variant</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="w-full">
            <div className="space-y-4">
              {/* Section header */}
              <div className="text-center mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Available Variants</h2>
                <p className="text-sm text-gray-600">
                  {product.variants.length} variants available
                </p>
              </div>

              {/* Grid layout for variants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const variantStockStatus = getStockStatus(variant.quantity);
                  
                  return (
                    <div
                      key={variant.id}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-lg' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md'
                      }`}
                      onClick={() => {
                        onSelectVariant(variant);
                        onClose();
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-lg text-gray-900 mb-2">{variant.name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                            <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg text-xs">{variant.sku}</span>
                          </div>
                          
                          {/* Enhanced Specifications Display */}
                          {Object.entries(variant.attributes).length > 0 && (
                            <div className="mb-3">
                              <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Specifications:</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {Object.entries(variant.attributes).map(([key, value]) => {
                                  // Get color based on specification type
                                  const getSpecColor = (specKey: string) => {
                                    const spec = specKey.toLowerCase();
                                    if (spec.includes('ram')) return 'bg-green-100 text-green-700 border-green-200';
                                    if (spec.includes('storage') || spec.includes('memory')) return 'bg-blue-100 text-blue-700 border-blue-200';
                                    if (spec.includes('processor') || spec.includes('cpu')) return 'bg-purple-100 text-purple-700 border-purple-200';
                                    if (spec.includes('screen') || spec.includes('display')) return 'bg-orange-100 text-orange-700 border-orange-200';
                                    if (spec.includes('battery')) return 'bg-teal-100 text-teal-700 border-teal-200';
                                    if (spec.includes('camera')) return 'bg-pink-100 text-pink-700 border-pink-200';
                                    if (spec.includes('color')) return 'bg-red-100 text-red-700 border-red-200';
                                    if (spec.includes('size')) return 'bg-gray-100 text-gray-700 border-gray-200';
                                    return 'bg-indigo-100 text-indigo-700 border-indigo-200';
                                  };
                                  
                                  return (
                                    <div key={key} className={`px-3 py-2 rounded-lg border text-xs font-medium ${getSpecColor(key)}`}>
                                      <div className="font-semibold capitalize">{key.replace(/_/g, ' ')}</div>
                                      <div className="text-xs opacity-90">{value}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default VariantSelectionModal;
