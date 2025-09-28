import React from 'react';
import { ShoppingCart, User, XCircle, Phone, Crown, Search, Plus, Percent, DollarSign, Edit3 } from 'lucide-react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import VariantCartItem from './VariantCartItem';

interface Customer {
  id: string;
  name: string;
  phone: string;
  colorTag?: string;
  loyaltyLevel?: string;
  points: number;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  variant?: any;
  image?: string;
}

interface POSCartSectionProps {
  cartItems: CartItem[];
  selectedCustomer: Customer | null;
  onRemoveCustomer: () => void;
  onShowCustomerSearch: () => void;
  onShowCustomerDetails: (customer: Customer) => void;
  onUpdateCartItemQuantity: (itemId: string, quantity: number) => void;
  onRemoveCartItem: (itemId: string) => void;
  onApplyDiscount: (discountType: 'percentage' | 'fixed', value: number) => void;
  onProcessPayment: () => void;
  onShowDiscountModal: () => void;
  onClearDiscount: () => void;
  dynamicPricingEnabled?: boolean;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  onEditCustomer?: (customer: Customer) => void;
}

const POSCartSection: React.FC<POSCartSectionProps> = ({
  cartItems,
  selectedCustomer,
  onRemoveCustomer,
  onShowCustomerSearch,
  onShowCustomerDetails,
  onUpdateCartItemQuantity,
  onRemoveCartItem,
  onApplyDiscount,
  onProcessPayment,
  onShowDiscountModal,
  onClearDiscount,
  dynamicPricingEnabled = false,
  totalAmount,
  discountAmount,
  finalAmount,
  onEditCustomer
}) => {
  return (
    <div className="lg:w-[450px] flex-shrink-0">
      <GlassCard className="p-6 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-6 flex-shrink-0">
          <div className="p-2 bg-green-50 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Shopping Cart</h2>
            <p className="text-sm text-gray-600">{cartItems.length} items in cart</p>
          </div>
        </div>

        {/* Customer Search Section */}
        <div className="mb-6">
          {selectedCustomer ? (
            <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                      selectedCustomer.colorTag === 'vip' || selectedCustomer.loyaltyLevel === 'platinum' || selectedCustomer.loyaltyLevel === 'gold'
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                        : 'bg-gradient-to-r from-green-400 to-emerald-500'
                    }`}>
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{selectedCustomer.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {selectedCustomer.phone}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        selectedCustomer.colorTag === 'vip' || selectedCustomer.loyaltyLevel === 'platinum' || selectedCustomer.loyaltyLevel === 'gold'
                          ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200' 
                          : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200'
                      }`}>
                        {selectedCustomer.colorTag === 'vip' || selectedCustomer.loyaltyLevel === 'platinum' || selectedCustomer.loyaltyLevel === 'gold' ? 'VIP Member' : 'Active Member'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {selectedCustomer.points} points
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onShowCustomerDetails(selectedCustomer)}
                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="View customer details"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  {onEditCustomer && (
                    <button
                      onClick={() => onEditCustomer(selectedCustomer)}
                      className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                      title="Edit customer information"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={onRemoveCustomer}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={onShowCustomerSearch}
                className="w-full flex items-center justify-center gap-3 p-4 text-base border-2 border-blue-200 rounded-xl bg-white text-gray-900 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
              >
                <Search className="w-5 h-5 text-blue-500" />
                <span className="text-gray-600">Search Customer</span>
                <Plus className="w-4 h-4 text-blue-500" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cart is empty</h3>
              <p className="text-gray-600 mb-4">Add products to start a transaction</p>
            </div>
          ) : (
            <>
              {/* Dynamic Pricing Display */}
              {dynamicPricingEnabled && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-yellow-800">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Dynamic pricing is active
                  </div>
                </div>
              )}

              {/* Cart Items */}
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <VariantCartItem
                    key={item.id}
                    item={item}
                    onQuantityChange={(quantity) => onUpdateCartItemQuantity(item.id, quantity)}
                    onRemove={() => onRemoveCartItem(item.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-200 pt-4 space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">TZS {totalAmount.toLocaleString()}</span>
              </div>
              
              {/* Discount Section */}
              <div className="space-y-2">
                {discountAmount > 0 ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-green-100 rounded">
                        <Percent className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-green-800">Discount Applied</div>
                        <div className="text-xs text-green-600">-TZS {discountAmount.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={onShowDiscountModal}
                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                        title="Edit Discount"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={onClearDiscount}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                        title="Remove Discount"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={onShowDiscountModal}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 group"
                  >
                    <div className="p-1 bg-gray-100 group-hover:bg-purple-100 rounded transition-colors">
                      <Percent className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Add Discount</span>
                  </button>
                )}
              </div>
              
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span className="text-green-600">TZS {finalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Process Payment Button */}
            <button
              onClick={onProcessPayment}
              disabled={cartItems.length === 0}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Process Payment
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default POSCartSection;
