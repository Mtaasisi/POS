import React from 'react';
import { CartItem as CartItemType } from '../../types';
import GlassButton from '../ui/GlassButton';
import {
  Package,
  Tag,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Hash,
  Star,
  Crown,
  Shield,
  Gift,
  Award
} from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
}

const CartItemComponent: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100', icon: <AlertCircle className="w-4 h-4" /> };
    if (quantity <= 5) return { status: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Clock className="w-4 h-4" /> };
    return { status: 'In Stock', color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircle className="w-4 h-4" /> };
  };

  const getCustomerTypeIcon = () => {
    if (item.is_external_product) return <Gift className="w-4 h-4 text-purple-600" />;
    if (item.variant?.product?.category?.name === 'Premium') return <Crown className="w-4 h-4 text-yellow-600" />;
    if (item.variant?.product?.category?.name === 'Accessories') return <Shield className="w-4 h-4 text-blue-600" />;
    return <Package className="w-4 h-4 text-gray-600" />;
  };

  const stockStatus = item.is_external_product ? null : getStockStatus(item.variant?.available_quantity || 0);

  return (
    <div className="p-4 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-start gap-4">
        {/* Product Icon & Info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            {getCustomerTypeIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
              {item.is_external_product && (
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                  External
                </span>
              )}
            </div>
            
            {item.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm">
              {!item.is_external_product && item.variant && (
                <>
                  <div className="flex items-center gap-1">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{item.variant.sku}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Stock:</span>
                    <span className="font-medium">{item.variant.available_quantity}</span>
                  </div>
                  
                  {stockStatus && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                      {stockStatus.icon}
                      {stockStatus.status}
                    </div>
                  )}
                </>
              )}
              
              {item.is_external_product && (
                <div className="flex items-center gap-1">
                  <Gift className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-600 font-medium">External Product</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price & Quantity Controls */}
        <div className="flex items-center gap-4">
          {/* Price Display */}
          <div className="text-right">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-bold text-green-600 text-lg">
                {formatCurrency(item.unit_price)}
              </span>
            </div>
            <p className="text-sm text-gray-500">per unit</p>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <GlassButton
              size="sm"
              variant="outline"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="p-2 border-gray-300 hover:border-red-300 text-gray-600 hover:text-red-600"
            >
              <Minus className="w-4 h-4" />
            </GlassButton>
            
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-lg min-w-[3rem] text-center">
                {item.quantity}
              </span>
              <span className="text-sm text-gray-500">qty</span>
            </div>
            
            <GlassButton
              size="sm"
              variant="outline"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={!item.is_external_product && item.variant && item.quantity >= item.variant.available_quantity}
              className="p-2 border-gray-300 hover:border-green-300 text-gray-600 hover:text-green-600"
            >
              <Plus className="w-4 h-4" />
            </GlassButton>
          </div>

          {/* Total Price */}
          <div className="text-right min-w-[8rem]">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-blue-600 text-xl">
                {formatCurrency(item.item_total)}
              </span>
            </div>
            <p className="text-sm text-gray-500">total</p>
          </div>

          {/* Remove Button */}
          <GlassButton
            size="sm"
            variant="outline"
            onClick={() => onRemove(item.id)}
            className="p-2 border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </GlassButton>
        </div>
      </div>

      {/* Additional Info Row */}
      <div className="mt-4 pt-4 border-t border-gray-200/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {item.variant && (
              <>
                <div className="flex items-center gap-1">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(item.unit_cost)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Margin:</span>
                  <span className={`font-medium ${item.unit_price > item.unit_cost ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(item.unit_price - item.unit_cost)}
                  </span>
                </div>
              </>
            )}
            
            {item.is_external_product && (
              <div className="flex items-center gap-1">
                <Gift className="w-4 h-4 text-purple-600" />
                <span className="text-purple-600 font-medium">External Product - No Inventory Impact</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {item.variant?.product?.category && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                {item.variant.product.category.name}
              </span>
            )}
            
            {item.variant?.product?.brand && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {item.variant.product.brand}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemComponent; 