import React from 'react';
import { CartItem } from '../../types';
import TouchOptimizedButton from '../ui/TouchOptimizedButton';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface TouchOptimizedCartProps {
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
  onClearCart: () => void;
}

const TouchOptimizedCart: React.FC<TouchOptimizedCartProps> = ({
  cart,
  onUpdateQuantity,
  onRemove,
  onClearCart
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

  const subtotal = cart.reduce((sum, item) => sum + item.item_total, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Cart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cart</h2>
            <p className="text-sm text-gray-600">{cart.length} items</p>
          </div>
        </div>
        
        {cart.length > 0 && (
          <TouchOptimizedButton
            onClick={onClearCart}
            variant="danger"
            size="sm"
            icon={Trash2}
          >
            Clear
          </TouchOptimizedButton>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold text-lg">Cart is empty</p>
            <p className="text-sm text-gray-500 mt-2">Add products to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => {
              const stockStatus = item.is_external_product ? null : getStockStatus(item.variant?.available_quantity || 0);
              
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200"
                >
                  {/* Item Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-base truncate">{item.name}</h4>
                        {item.is_external_product && (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            External
                          </span>
                        )}
                      </div>
                      
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(item.unit_price)}
                      </div>
                      
                      {stockStatus && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color} mt-1`}>
                          {stockStatus.icon}
                          {stockStatus.status}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TouchOptimizedButton
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        variant="secondary"
                        size="sm"
                        icon={Minus}
                        className="w-12 h-12 rounded-full"
                      >
                        -
                      </TouchOptimizedButton>
                      
                      <div className="text-center min-w-[60px]">
                        <div className="text-2xl font-bold text-gray-900">{item.quantity}</div>
                        <div className="text-xs text-gray-500">Qty</div>
                      </div>
                      
                      <TouchOptimizedButton
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        variant="secondary"
                        size="sm"
                        icon={Plus}
                        className="w-12 h-12 rounded-full"
                      >
                        +
                      </TouchOptimizedButton>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(item.item_total)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(item.unit_price)} each
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="mt-3 flex justify-end">
                    <TouchOptimizedButton
                      onClick={() => onRemove(item.id)}
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                    >
                      Remove
                    </TouchOptimizedButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>{cart.length} items in cart</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TouchOptimizedCart; 