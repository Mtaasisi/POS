import React, { useState } from 'react';
import { Layers, Plus, Trash2, Package, QrCode, DollarSign, Move, Check, Image as ImageIcon, Upload } from 'lucide-react';
import { specificationCategories, getSpecificationsByCategory } from '../../../../data/specificationCategories';
import { SparePartVariant } from '../../types/spareParts';

interface SparePartVariantsSectionProps {
  variants: SparePartVariant[];
  setVariants: React.Dispatch<React.SetStateAction<SparePartVariant[]>>;
  useVariants: boolean;
  setUseVariants: (enabled: boolean) => void;
  showVariants: boolean;
  setShowVariants: React.Dispatch<React.SetStateAction<boolean>>;
  isReorderingVariants: boolean;
  setIsReorderingVariants: React.Dispatch<React.SetStateAction<boolean>>;
  draggedVariantIndex: number | null;
  setDraggedVariantIndex: React.Dispatch<React.SetStateAction<number | null>>;
  onVariantSpecificationsClick: (index: number) => void;
  basePartNumber: string;
}

const SparePartVariantsSection: React.FC<SparePartVariantsSectionProps> = ({
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
  basePartNumber
}) => {
  const [variantPriceFocus, setVariantPriceFocus] = useState<Record<string, boolean>>({});

  const addVariant = () => {
    // Get the last variant to duplicate its specifications
    const lastVariant = variants.length > 0 ? variants[variants.length - 1] : null;
    
    const newVariant: SparePartVariant = {
      name: `Variant ${variants.length + 1}`,
      sku: generateVariantSKU(variants.length + 1),
      cost_price: lastVariant?.cost_price || 0,
      selling_price: lastVariant?.selling_price || 0,
      quantity: lastVariant?.quantity || 0,
      min_quantity: lastVariant?.min_quantity || 2, // Set default min stock level to 2 pcs
      // Duplicate the previous variant's attributes/specifications
      attributes: lastVariant?.attributes ? { ...lastVariant.attributes } : {}
    };
    setVariants(prev => [...prev, newVariant]);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof SparePartVariant, value: any) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const generateVariantSKU = (variantNumber: number) => {
    return `${basePartNumber}-V${variantNumber.toString().padStart(2, '0')}`;
  };

  // Import shared formatting utilities for consistency
  const formatNumber = (value: number | string): string => {
    if (!value && value !== 0) return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handleVariantPriceChange = (index: number, field: 'cost_price' | 'selling_price', value: string) => {
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

  const formatSpecificationValue = (key: string, value: string) => {
    const lowerKey = key.toLowerCase();
    const lowerValue = value.toLowerCase();
    
    // Storage related
    if (lowerKey.includes('storage') || lowerKey.includes('capacity') || lowerKey.includes('disk')) {
      if (lowerValue.includes('gb') || lowerValue.includes('gigabyte')) {
        return value;
      }
      if (lowerValue.includes('tb') || lowerValue.includes('terabyte')) {
        return value;
      }
      if (lowerValue.includes('mb') || lowerValue.includes('megabyte')) {
        return value;
      }
      // If it's just a number, assume GB
      if (/^\d+$/.test(value)) {
        return `${value} GB`;
      }
    }
    
    // RAM/Memory related
    if (lowerKey.includes('ram') || lowerKey.includes('memory') || lowerKey.includes('ddr')) {
      if (lowerValue.includes('gb') || lowerValue.includes('gigabyte')) {
        return value;
      }
      if (lowerValue.includes('mb') || lowerValue.includes('megabyte')) {
        return value;
      }
      // If it's just a number, assume GB
      if (/^\d+$/.test(value)) {
        return `${value} GB`;
      }
    }
    
    // Screen/Display related
    if (lowerKey.includes('screen') || lowerKey.includes('display') || lowerKey.includes('monitor') || lowerKey.includes('size')) {
      if (lowerValue.includes('inch') || lowerValue.includes('"') || lowerValue.includes('in')) {
        return value;
      }
      // If it's just a number, assume inches
      if (/^\d+(\.\d+)?$/.test(value)) {
        return `${value}"`;
      }
    }
    
    // Weight related
    if (lowerKey.includes('weight') || lowerKey.includes('mass')) {
      if (lowerValue.includes('kg') || lowerValue.includes('kilogram')) {
        return value;
      }
      if (lowerValue.includes('g') || lowerValue.includes('gram')) {
        return value;
      }
      if (lowerValue.includes('lb') || lowerValue.includes('pound')) {
        return value;
      }
      // If it's just a number, assume kg
      if (/^\d+(\.\d+)?$/.test(value)) {
        return `${value} kg`;
      }
    }
    
    // Battery related
    if (lowerKey.includes('battery') || lowerKey.includes('mah')) {
      if (lowerValue.includes('mah') || lowerValue.includes('milliampere')) {
        return value;
      }
      if (lowerValue.includes('wh') || lowerValue.includes('watt')) {
        return value;
      }
      // If it's just a number, assume mAh
      if (/^\d+$/.test(value)) {
        return `${value} mAh`;
      }
    }
    
    // Processor/CPU related
    if (lowerKey.includes('processor') || lowerKey.includes('cpu') || lowerKey.includes('ghz')) {
      if (lowerValue.includes('ghz') || lowerValue.includes('gigahertz')) {
        return value;
      }
      if (lowerValue.includes('mhz') || lowerValue.includes('megahertz')) {
        return value;
      }
      // If it's just a number, assume GHz
      if (/^\d+(\.\d+)?$/.test(value)) {
        return `${value} GHz`;
      }
    }
    
    // Resolution related
    if (lowerKey.includes('resolution') || lowerKey.includes('pixel') || lowerKey.includes('hd')) {
      if (lowerValue.includes('p') || lowerValue.includes('pixel')) {
        return value;
      }
      if (lowerValue.includes('x') && /^\d+x\d+$/.test(value)) {
        return value;
      }
    }
    
    // Dimensions related
    if (lowerKey.includes('dimension') || lowerKey.includes('length') || lowerKey.includes('width') || lowerKey.includes('height')) {
      if (lowerValue.includes('cm') || lowerValue.includes('centimeter')) {
        return value;
      }
      if (lowerValue.includes('mm') || lowerValue.includes('millimeter')) {
        return value;
      }
      if (lowerValue.includes('inch') || lowerValue.includes('"') || lowerValue.includes('in')) {
        return value;
      }
      // If it's just a number, assume cm
      if (/^\d+(\.\d+)?$/.test(value)) {
        return `${value} cm`;
      }
    }
    
    // Return original value if no formatting applies
    return value;
  };

  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Layers size={20} className="text-green-600" />
          Spare Part Variants
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
            </>
          )}
          
          <button
            type="button"
            role="switch"
            aria-checked={useVariants}
            onClick={() => {
              const next = !useVariants;
              setUseVariants(next);
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
                  
                  {/* SKU - Auto Generated */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SKU (Auto Generated)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={variant.sku}
                        readOnly
                        className="w-full py-3 pl-12 pr-4 bg-gray-100 border-2 rounded-lg border-gray-300 text-gray-600 cursor-not-allowed"
                        placeholder="Auto-generated"
                      />
                      <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      SKU is automatically generated for this variant
                    </div>
                  </div>
                </div>

                {/* Specifications Button */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => onVariantSpecificationsClick(index)}
                    className="group w-full bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-md border-2 border-gray-300 rounded-xl hover:border-purple-500 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-300 shadow-md group-hover:shadow-lg">
                            <Layers className="w-5 h-5 text-white" />
                          </div>
                          {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="text-left flex-1">
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-purple-900 transition-colors duration-300">
                            Specifications
                          </h4>
                          {variant.attributes && Object.keys(variant.attributes).length > 0 ? (
                            <div className="mt-1">
                              <div className="grid grid-cols-2 gap-1 max-h-12 overflow-y-auto">
                                {Object.entries(variant.attributes).slice(0, 4).map(([key, value]) => (
                                  <div key={key} className="bg-purple-50 border border-purple-200 rounded-md px-1.5 py-0.5">
                                    <div className="text-xs font-medium text-purple-800 truncate">{key}</div>
                                    <div className="text-xs text-purple-600 truncate">{formatSpecificationValue(key, String(value))}</div>
                                  </div>
                                ))}
                              </div>
                              {Object.keys(variant.attributes).length > 4 && (
                                <div className="text-xs text-purple-600 mt-0.5">
                                  +{Object.keys(variant.attributes).length - 4} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600 mt-0.5">
                              Add variant specifications
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                          <div className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-md">
                            {Object.keys(variant.attributes).length}
                          </div>
                        )}
                        
                        <div className="w-6 h-6 bg-gray-100 group-hover:bg-purple-100 rounded-lg flex items-center justify-center transition-all duration-300">
                          <svg className="w-3 h-3 text-gray-500 group-hover:text-purple-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
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
                        value={!variant.cost_price || variant.cost_price === 0 ? '' : formatNumber(variant.cost_price)}
                        onChange={(e) => {
                          // Allow typing with automatic comma formatting
                          const inputValue = e.target.value;
                          if (inputValue === '' || /^[\d,]*\.?\d*$/.test(inputValue)) {
                            handleVariantPriceChange(index, 'cost_price', inputValue);
                          }
                        }}
                        onFocus={() => handleVariantPriceFocus(index, 'cost_price')}
                        onBlur={() => handleVariantPriceBlur(index, 'cost_price')}
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
                        value={!variant.selling_price || variant.selling_price === 0 ? '' : formatNumber(variant.selling_price)}
                        onChange={(e) => {
                          // Allow typing with automatic comma formatting
                          const inputValue = e.target.value;
                          if (inputValue === '' || /^[\d,]*\.?\d*$/.test(inputValue)) {
                            handleVariantPriceChange(index, 'selling_price', inputValue);
                          }
                        }}
                        onFocus={() => handleVariantPriceFocus(index, 'selling_price')}
                        onBlur={() => handleVariantPriceBlur(index, 'selling_price')}
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
                      <input
                        type="number"
                        value={variant.quantity === 0 ? '' : variant.quantity || ''}
                        onChange={(e) => updateVariant(index, 'quantity', Math.max(0, parseInt(e.target.value) || 0))}
                        onFocus={(e) => {
                          if (variant.quantity === 0) {
                            e.target.value = '';
                          }
                        }}
                        className="w-full py-3 px-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 focus:outline-none focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                        min="0"
                        step="1"
                      />
                      
                      <button
                        type="button"
                        onClick={() => updateVariant(index, 'quantity', Math.max(0, (variant.quantity || 0) - 1))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Decrease stock quantity"
                      >
                        −
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => updateVariant(index, 'quantity', (variant.quantity || 0) + 1)}
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
                      <input
                        type="number"
                        value={variant.min_quantity === 0 ? '' : variant.min_quantity || ''}
                        onChange={(e) => updateVariant(index, 'min_quantity', Math.max(0, parseInt(e.target.value) || 0))}
                        onFocus={(e) => {
                          if (variant.min_quantity === 0) {
                            e.target.value = '';
                          }
                        }}
                        className="w-full py-3 px-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 focus:outline-none focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="2"
                        min="0"
                        step="1"
                      />
                      
                      <button
                        type="button"
                        onClick={() => updateVariant(index, 'min_quantity', Math.max(0, (variant.min_quantity || 0) - 1))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Decrease minimum stock level"
                      >
                        −
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => updateVariant(index, 'min_quantity', (variant.min_quantity || 0) + 1)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Increase minimum stock level"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Variant Button */}
          <button
            type="button"
            onClick={addVariant}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Plus size={20} />
            Add New Variant
          </button>
        </div>
      )}
    </div>
  );
};

export default SparePartVariantsSection;
