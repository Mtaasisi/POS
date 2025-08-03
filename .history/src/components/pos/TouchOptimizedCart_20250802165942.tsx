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
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cart</h2>
            <p className="text-lg text-gray-600">{cart.length} items</p>
          </div>
        </div>
        
        {cart.length > 0 && (
          <TouchOptimizedButton
            onClick={onClearCart}
            variant="danger"
            size="md"
            icon={Trash2}
          >
            Clear
          </TouchOptimizedButton>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-6">
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-28 h-28 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <ShoppingCart className="w-14 h-14 text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold text-2xl">Cart is empty</p>
            <p className="text-lg text-gray-500 mt-3">Add products to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {cart.map((item) => {
              const stockStatus = item.is_external_product ? null : getStockStatus(item.variant?.available_quantity || 0);
              
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200"
                >
                  {/* Item Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900 text-lg truncate">{item.name}</h4>
                        {item.is_external_product && (
                          <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                            External
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(item.unit_price)}
                      </div>
                      
                      {stockStatus && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${stockStatus.bg} ${stockStatus.color} mt-2`}>
                          {stockStatus.icon}
                          {stockStatus.status}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <TouchOptimizedButton
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        variant="secondary"
                        size="md"
                        icon={Minus}
                        className="w-16 h-16 rounded-full"
                      >
                        -
                      </TouchOptimizedButton>
                      
                      <div className="text-center min-w-[80px]">
                        <div className="text-3xl font-bold text-gray-900">{item.quantity}</div>
                        <div className="text-sm text-gray-500">Qty</div>
                      </div>
                      
                      <TouchOptimizedButton
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        variant="secondary"
                        size="md"
                        icon={Plus}
                        className="w-16 h-16 rounded-full"
                      >
                        +
                      </TouchOptimizedButton>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(item.item_total)}
                      </div>
                      <div className="text-lg text-gray-500">
                        {formatCurrency(item.unit_price)} each
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="mt-4 flex justify-end">
                    <TouchOptimizedButton
                      onClick={() => onRemove(item.id)}
                      variant="danger"
                      size="md"
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
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-semibold text-gray-900">Subtotal:</span>
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          
          <div className="flex items-center gap-3 text-lg text-gray-600">
            <DollarSign className="w-6 h-6" />
            <span>{cart.length} items in cart</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TouchOptimizedCart; 