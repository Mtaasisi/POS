import React, { useState } from 'react';
import { Layers, Plus, Trash2, Package, QrCode, RefreshCw, DollarSign, Move } from 'lucide-react';

interface ProductVariant {
  name: string;
  sku: string;
  barcode: string;
  costPrice: number;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  specification?: string;
  attributes?: Record<string, any>;
}

interface ProductVariantsSectionProps {
  variants: ProductVariant[];
  setVariants: React.Dispatch<React.SetStateAction<ProductVariant[]>>;
  useVariants: boolean;
  setUseVariants: React.Dispatch<React.SetStateAction<boolean>>;
  showVariants: boolean;
  setShowVariants: React.Dispatch<React.SetStateAction<boolean>>;
  isReorderingVariants: boolean;
  setIsReorderingVariants: React.Dispatch<React.SetStateAction<boolean>>;
  draggedVariantIndex: number | null;
  setDraggedVariantIndex: React.Dispatch<React.SetStateAction<number | null>>;
  onVariantSpecificationsClick: (index: number) => void;
  baseSku: string;
}

const ProductVariantsSection: React.FC<ProductVariantsSectionProps> = ({
  variants,
  setVariants,
  useVariants,
  setUseVariants,
  showVariants,
  setShowVariants,
  isReorderingVariants,
  setIsReorderingVariants,
  draggedVariantIndex,
  setDraggedVariantIndex,
  onVariantSpecificationsClick,
  baseSku
}) => {
  const [variantPriceFocus, setVariantPriceFocus] = useState<Record<string, boolean>>({});

  const addVariant = () => {
    const newVariant: ProductVariant = {
      name: `Variant ${variants.length + 1}`,
      sku: generateVariantSKU(variants.length + 1),
      barcode: '',
      costPrice: 0,
      price: 0,
      stockQuantity: 0,
      minStockLevel: 0,
      specification: '',
      attributes: {}
    };
    newVariant.barcode = newVariant.sku;
    setVariants(prev => [...prev, newVariant]);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const generateVariantSKU = (variantNumber: number) => {
    return `${baseSku}-V${variantNumber.toString().padStart(2, '0')}`;
  };

  const autoGenerateAllSKUs = () => {
    setVariants(prev => prev.map((variant, index) => {
      const newSKU = generateVariantSKU(index + 1);
      return {
        ...variant,
        sku: newSKU,
        barcode: newSKU
      };
    }));
  };

  const formatNumber = (value: number | string): string => {
    if (!value && value !== 0) return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString();
  };

  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handleVariantPriceChange = (index: number, field: 'costPrice' | 'price', value: string) => {
    const numericValue = parseNumber(value);
    updateVariant(index, field, numericValue);
  };

  const handleVariantPriceFocus = (index: number, field: string) => {
    setVariantPriceFocus(prev => ({ ...prev, [`${index}-${field}`]: true }));
  };

  const handleVariantPriceBlur = (index: number, field: string) => {
    setVariantPriceFocus(prev => ({ ...prev, [`${index}-${field}`]: false }));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedVariantIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedVariantIndex === null || draggedVariantIndex === dropIndex) {
      return;
    }

    setVariants(prev => {
      const newVariants = [...prev];
      const draggedItem = newVariants[draggedVariantIndex];
      
      // Remove the dragged item
      newVariants.splice(draggedVariantIndex, 1);
      
      // Insert at new position
      newVariants.splice(dropIndex, 0, draggedItem);
      
      return newVariants;
    });
    
    setDraggedVariantIndex(null);
  };

  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Layers size={20} className="text-green-600" />
          Product Variants
        </h3>
        
        <div className="flex items-center gap-3">
          {useVariants && variants.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsReorderingVariants(!isReorderingVariants)}
                className={`text-xs px-3 py-1 rounded ${
                  isReorderingVariants 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Toggle reorder mode"
              >
                <Move size={14} className="inline mr-1" />
                {isReorderingVariants ? 'Done' : 'Reorder'}
              </button>
              
              <button
                type="button"
                onClick={autoGenerateAllSKUs}
                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                title="Auto-generate all variant SKUs/Barcodes"
              >
                Auto-generate SKUs/Barcodes
              </button>
            </>
          )}
          
          <button
            type="button"
            role="switch"
            aria-checked={useVariants}
            onClick={() => {
              setUseVariants(prev => {
                const next = !prev;
                if (next) {
                  if (variants.length === 0) {
                    addVariant();
                  }
                  setShowVariants(true);
                } else {
                  setShowVariants(false);
                }
                return next;
              });
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              useVariants ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            aria-label="Toggle variants"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                useVariants ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      {useVariants && showVariants && (
        <div className="space-y-4">
          {/* Add Variant Button */}
          <button
            type="button"
            onClick={addVariant}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Plus size={20} />
            Add New Variant
          </button>

          {/* Variants List */}
          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                draggable={isReorderingVariants}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => setDraggedVariantIndex(null)}
                style={{ cursor: isReorderingVariants ? 'grabbing' : 'grab' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isReorderingVariants && (
                      <div className="w-6 h-6 flex items-center justify-center text-gray-400">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6h8v2H8V6zm0 5h8v2H8v-2zm0 5h8v2H8v-2z"/>
                        </svg>
                      </div>
                    )}
                    <h4 className="font-medium text-gray-900">
                      {variant.name || `Variant ${index + 1}`}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isReorderingVariants && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        aria-label="Remove variant"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors border-gray-300 focus:border-blue-500"
                        placeholder="Variant name"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                  </div>
                  
                  {/* SKU/Barcode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SKU/Barcode</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => {
                          const newValue = e.target.value.toUpperCase();
                          updateVariant(index, 'sku', newValue);
                          updateVariant(index, 'barcode', newValue);
                        }}
                        className="w-full py-3 pl-12 pr-12 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors border-gray-300 focus:border-blue-500"
                        placeholder="Auto-generated"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <button
                        type="button"
                        onClick={() => {
                          const newSKU = generateVariantSKU(index + 1);
                          updateVariant(index, 'sku', newSKU);
                          updateVariant(index, 'barcode', newSKU);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Regenerate SKU/Barcode"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      SKU and barcode are automatically synchronized
                    </div>
                  </div>
                </div>



                {/* Specifications Button */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => onVariantSpecificationsClick(index)}
                    className="group w-full bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors duration-200">
                          <Layers className="w-4 h-4 text-white" />
                        </div>
                        
                        <div className="text-left">
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                            Specifications
                          </h4>
                          <p className="text-xs text-gray-600">
                            {variant.attributes && Object.keys(variant.attributes).length > 0 
                              ? `${Object.keys(variant.attributes).length} configured`
                              : 'Add specifications'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                          <div className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md">
                            {Object.keys(variant.attributes).length}
                          </div>
                        )}
                        
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>
                   
                {/* Pricing and Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {/* Cost Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors border-gray-300 focus:border-blue-500"
                        placeholder="0"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        value={!variant.costPrice || variant.costPrice === 0 ? '' : formatNumber(variant.costPrice)}
                        onChange={(e) => handleVariantPriceChange(index, 'costPrice', e.target.value)}
                        onFocus={() => handleVariantPriceFocus(index, 'costPrice')}
                        onBlur={() => handleVariantPriceBlur(index, 'costPrice')}
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors border-gray-300 focus:border-blue-500"
                        placeholder="0"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        value={!variant.price || variant.price === 0 ? '' : formatNumber(variant.price)}
                        onChange={(e) => handleVariantPriceChange(index, 'price', e.target.value)}
                        onFocus={() => handleVariantPriceFocus(index, 'price')}
                        onBlur={() => handleVariantPriceBlur(index, 'price')}
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                  </div>
                  
                  {/* Stock Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <div className="relative">
                      <div className="w-full py-3 px-3 pr-20 pl-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-900">
                          {variant.stockQuantity || 0}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => updateVariant(index, 'stockQuantity', Math.max(0, (variant.stockQuantity || 0) - 1))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Decrease stock quantity"
                      >
                        −
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => updateVariant(index, 'stockQuantity', (variant.stockQuantity || 0) + 1)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Increase stock quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Min Stock Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Stock Level *
                    </label>
                    <div className="relative">
                      <div className="w-full py-3 px-3 pr-20 pl-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-900">
                          {variant.minStockLevel || 0}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => updateVariant(index, 'minStockLevel', Math.max(0, (variant.minStockLevel || 0) - 1))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Decrease minimum stock level"
                      >
                        −
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => updateVariant(index, 'minStockLevel', (variant.minStockLevel || 0) + 1)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Increase minimum stock level"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profit Margin Display */}
                {variant.price > 0 && variant.costPrice > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Profit Margin:</span>
                      <span className="font-semibold text-blue-600">
                        TZS {(variant.price - variant.costPrice).toLocaleString()} 
                        ({(((variant.price - variant.costPrice) / variant.price) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!useVariants && (
        <div className="text-center py-8 text-gray-500">
          <Layers size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Product Variants Disabled</p>
          <p className="text-sm">
            Enable variants to create different versions of this product (e.g., different colors, sizes, or configurations)
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductVariantsSection;
