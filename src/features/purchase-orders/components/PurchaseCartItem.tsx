// PurchaseCartItem component - Enhanced cart item for purchase orders (based on POS design)
import React, { useState } from 'react';
import { 
  Package, Minus, Plus, XCircle, ChevronDown, ChevronUp, 
  Coins, Truck, Calendar, Hash, Tag, AlertTriangle 
} from 'lucide-react';
import { SimpleImageDisplay } from '../../../components/SimpleImageDisplay';
import { ProductImage } from '../../../lib/robustImageService';
import { formatMoney, Currency } from '../lib/utils';
import { useGeneralSettingsUI } from '../../../hooks/useGeneralSettingsUI';

interface PurchaseCartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantName?: string;
  sku: string;
  costPrice: number;
  quantity: number;
  totalPrice: number;
  currentStock?: number;
  category?: string;
  images?: string[];
}

interface PurchaseCartItemProps {
  item: PurchaseCartItem;
  index: number;
  currency: Currency;
  isLatest?: boolean;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateCostPrice: (itemId: string, costPrice: number) => void;
  onRemove: (itemId: string) => void;
}

const PurchaseCartItem: React.FC<PurchaseCartItemProps> = ({
  item,
  index,
  currency,
  isLatest = false,
  onUpdateQuantity,
  onUpdateCostPrice,
  onRemove
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempCostPrice, setTempCostPrice] = useState(item.costPrice.toString());

  // Get general settings with error handling
  let generalSettings;
  try {
    generalSettings = useGeneralSettingsUI();
  } catch (error) {
    console.warn('GeneralSettings hook not available:', error);
    generalSettings = { show_product_images: true, enable_animations: true };
  }

  // Convert product images to new format
  const convertToProductImages = (imageUrls: string[]): ProductImage[] => {
    if (!imageUrls || imageUrls.length === 0) {
      return [];
    }
    
    return imageUrls.map((imageUrl, index) => ({
      id: `temp-${item.productId}-${index}`,
      url: imageUrl,
      thumbnailUrl: imageUrl,
      fileName: `product-image-${index + 1}`,
      fileSize: 0,
      isPrimary: index === 0,
      uploadedAt: new Date().toISOString()
    }));
  };

  const productImages = convertToProductImages(item.images || []);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, item.quantity + delta);
    onUpdateQuantity(item.id, newQuantity);
  };

  const handleSaveCostPrice = () => {
    const newPrice = parseFloat(tempCostPrice);
    if (!isNaN(newPrice) && newPrice > 0) {
      onUpdateCostPrice(item.id, newPrice);
    }
    setIsEditingPrice(false);
  };

  const handleCancelPriceEdit = () => {
    setTempCostPrice(item.costPrice.toString());
    setIsEditingPrice(false);
  };

  // Calculate stock status for visual indicators
  const getStockStatus = () => {
    const stock = item.currentStock || 0;
    if (stock === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-50' };
    if (stock <= 5) return { status: 'low', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const stockStatus = getStockStatus();

  return (
    <div className={`bg-white border-2 rounded-xl ${generalSettings?.enable_animations ? 'transition-all duration-300' : ''} ${
      isExpanded 
        ? 'border-orange-300 shadow-lg' 
        : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
    } ${isLatest ? 'ring-2 ring-orange-200 ring-opacity-50' : ''}`}>
      
      {/* Minimized Header - Always visible */}
      <div 
        className="p-4 cursor-pointer"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Product Image/Avatar */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden">
              {generalSettings?.show_product_images && productImages.length > 0 ? (
                <SimpleImageDisplay
                  images={productImages}
                  productName={item.name}
                  size="lg"
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-lg font-bold text-white">
                  {item.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate text-lg leading-tight">
                {item.name}
              </div>
              {item.variantName && item.variantName !== 'Default' && (
                <div className="text-sm text-gray-600">{item.variantName}</div>
              )}
              <div className="text-lg text-orange-600 mt-1 font-bold">
                {formatMoney(item.totalPrice, currency)}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Quantity Badge */}
            <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
              {item.quantity}×
            </div>

            {/* Expand/Collapse Button */}
            <button
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Remove Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Remove from cart"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content - Show when clicked */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-gradient-to-br from-orange-50/30 to-amber-50/30">
          <div className="space-y-4 pt-4">
            
            {/* Product Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">SKU:</span>
                  <span className="font-medium">{item.sku}</span>
                </div>
                {item.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{item.category}</span>
                  </div>
                )}

              </div>

              <div className="space-y-2">
                <div className={`flex items-center gap-2 ${stockStatus.color}`}>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-gray-600">Current Stock:</span>
                  <span className={`font-medium px-2 py-1 rounded ${stockStatus.bg} ${stockStatus.color}`}>
                    {item.currentStock || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Unit Cost:</span>
                  <span className="font-medium">{formatMoney(item.costPrice, currency)}</span>
                </div>
              </div>
            </div>

            {/* Cost Price Editor */}
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Cost Price</span>
                {!isEditingPrice && (
                  <button
                    onClick={() => setIsEditingPrice(true)}
                    className="text-xs text-orange-600 hover:text-orange-700"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingPrice ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={tempCostPrice}
                      onChange={(e) => setTempCostPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    onClick={handleSaveCostPrice}
                    className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelPriceEdit}
                    className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="text-lg font-bold text-orange-600">
                  {formatMoney(item.costPrice, currency)}
                </div>
              )}
            </div>

            {/* Quantity Controls - Enhanced */}
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
              <span className="text-sm font-medium text-gray-700">Order Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={item.quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center border-2 border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4 text-orange-600" />
                </button>
                <span className="w-12 text-center font-bold text-lg text-gray-900">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-8 h-8 flex items-center justify-center border-2 border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-orange-600" />
                </button>
              </div>
            </div>

            {/* Purchase Order Specific Info */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-orange-600 font-medium">Total Cost:</span>
                  <div className="text-lg font-bold text-orange-700">
                    {formatMoney(item.totalPrice, currency)}
                  </div>
                </div>
                <div>
                  <span className="text-orange-600 font-medium">Needed:</span>
                  <div className="text-sm text-gray-700">
                    {item.quantity} units to stock
                  </div>
                </div>
              </div>
              
              {(item.currentStock || 0) === 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Out of stock - Reorder needed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseCartItem;
