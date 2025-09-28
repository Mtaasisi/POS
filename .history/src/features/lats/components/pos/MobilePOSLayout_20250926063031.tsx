import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Scan, 
  User, 
  Settings, 
  Package,
  CreditCard,
  Receipt,
  Home,
  History,
  Plus,
  Minus,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MobilePOSLayoutProps {
  // Cart data
  cartItems: any[];
  cartTotal: number;
  cartItemCount: number;
  
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  // Actions
  onProcessPayment: () => void;
  onClearCart: () => void;
  onScanBarcode: () => void;
  onAddCustomer: () => void;
  onViewReceipts: () => void;
  onToggleSettings: () => void;
  
  // Children
  children: React.ReactNode;
  
  // States
  isProcessingPayment: boolean;
  hasSelectedCustomer: boolean;
}

const MobilePOSLayout: React.FC<MobilePOSLayoutProps> = ({
  cartItems,
  cartTotal,
  cartItemCount,
  searchQuery,
  onSearchChange,
  onProcessPayment,
  onClearCart,
  onScanBarcode,
  onAddCustomer,
  onViewReceipts,
  onToggleSettings,
  children,
  isProcessingPayment,
  hasSelectedCustomer
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'cart' | 'customers' | 'settings'>('products');
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [showSearchSheet, setShowSearchSheet] = useState(false);

  // Customer Care Bottom Navigation
  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb shadow-lg z-50">
      <div className="flex items-center justify-around py-2">
        {/* Products Tab */}
        <button
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-200 touch-target ${
            activeTab === 'products' 
              ? 'bg-blue-100 text-blue-700 shadow-sm' 
              : 'text-gray-600 active:bg-blue-50'
          }`}
        >
          <Package size={20} className="mb-1" />
          <span className="text-xs font-semibold">Products</span>
        </button>

        {/* Cart Tab */}
        <button
          onClick={() => {
            setActiveTab('cart');
            setShowCartSheet(true);
          }}
          className={`flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-200 relative touch-target ${
            activeTab === 'cart' 
              ? 'bg-green-100 text-green-700 shadow-sm' 
              : 'text-gray-600 active:bg-green-50'
          }`}
        >
          <div className="relative">
            <ShoppingCart size={20} className="mb-1" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold">Cart</span>
        </button>

        {/* Customers Tab */}
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-200 touch-target ${
            activeTab === 'customers' 
              ? 'bg-purple-100 text-purple-700 shadow-sm' 
              : 'text-gray-600 active:bg-purple-50'
          }`}
        >
          <User size={20} className="mb-1" />
          <span className="text-xs font-semibold">Customers</span>
        </button>

        {/* Quick Actions Tab */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-200 touch-target ${
            activeTab === 'settings' 
              ? 'bg-gray-100 text-gray-700 shadow-sm' 
              : 'text-gray-600 active:bg-gray-50'
          }`}
        >
          <Settings size={20} className="mb-1" />
          <span className="text-xs font-semibold">Tools</span>
        </button>
      </div>
    </div>
  );

  // Customer Care Optimized Top Bar
  const TopBar = () => (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 safe-area-pt">
      <div className="px-3 py-2">
        {/* Main Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Customer Care POS</h1>
            <p className="text-xs text-gray-600">Daily Operations</p>
          </div>

          {/* Current Time */}
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {new Date().toLocaleTimeString('en-TZ', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-TZ', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center justify-between">
          {/* Left Side - Essential Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setShowSearchSheet(true)}
              className="flex items-center gap-1 px-2 py-2 bg-blue-50 text-blue-700 rounded-lg active:bg-blue-100 transition-colors touch-target"
            >
              <Search size={14} />
              <span className="text-xs font-medium">Search</span>
            </button>

            {/* Scan */}
            <button
              onClick={onScanBarcode}
              className="flex items-center gap-1 px-2 py-2 bg-green-50 text-green-700 rounded-lg active:bg-green-100 transition-colors touch-target"
            >
              <Scan size={14} />
              <span className="text-xs font-medium">Scan</span>
            </button>
          </div>

          {/* Right Side - Cart Status */}
          <div className="flex items-center gap-1">
            {cartItemCount > 0 ? (
              <button
                onClick={() => setShowCartSheet(true)}
                className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg active:bg-green-600 transition-colors shadow-sm touch-target"
              >
                <ShoppingCart size={14} />
                <span className="text-xs font-medium">
                  {cartItemCount} • {cartTotal.toLocaleString()} TSH
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1 px-2 py-2 bg-gray-100 text-gray-600 rounded-lg">
                <ShoppingCart size={14} />
                <span className="text-xs">Empty Cart</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Customer Care Search Sheet
  const SearchSheet = () => (
    showSearchSheet && (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowSearchSheet(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Search Products</h2>
            <div className="w-10" />
          </div>
          
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products, categories, or scan barcode..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                autoFocus
              />
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {/* Search Results */}
          <div className="space-y-3">
            {children}
          </div>
        </div>
      </div>
    )
  );

  // Customer Care Cart Sheet
  const CartSheet = () => (
    showCartSheet && (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowCartSheet(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Shopping Cart</h2>
            <button
              onClick={onClearCart}
              className="text-red-500 text-sm font-semibold hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          </div>
          
          {/* Cart Summary */}
          <div className="px-4 pb-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-green-700">Total Items:</span>
                  <span className="ml-2 font-bold text-green-800">{cartItemCount}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-green-700">Total Amount:</span>
                  <span className="ml-2 font-bold text-green-800">{cartTotal.toLocaleString()} TSH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {/* Cart Items */}
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-center bg-gray-50 rounded-xl p-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.price.toLocaleString()} TSH each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 rounded-full hover:bg-gray-200">
                      <Minus size={16} />
                    </button>
                    <span className="px-3 py-1 bg-white rounded-lg font-medium">{item.quantity}</span>
                    <button className="p-1 rounded-full hover:bg-gray-200">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Cart Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-gray-900">Grand Total:</span>
                <span className="text-2xl font-bold text-green-600">{cartTotal.toLocaleString()} TSH</span>
              </div>
              <button
                onClick={onProcessPayment}
                disabled={isProcessingPayment || !hasSelectedCustomer}
                className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 disabled:bg-gray-400 transition-colors text-lg shadow-lg"
                title={!hasSelectedCustomer ? "Please select a customer first" : isProcessingPayment ? "Processing payment..." : "Process payment"}
              >
                {isProcessingPayment ? 'Processing Payment...' : '💳 Process Payment'}
              </button>
              
              {hasSelectedCustomer && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <User size={16} />
                    <span className="text-sm font-medium">Customer Selected</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col mobile-container">
      <TopBar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'products' && (
          <div className="h-full overflow-y-auto p-3 mobile-scroll">
            {children}
          </div>
        )}
        
        {activeTab === 'customers' && (
          <div className="h-full overflow-y-auto p-3 mobile-scroll">
            <div className="space-y-3">
              <button
                onClick={onAddCustomer}
                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl active:bg-blue-600 transition-colors flex items-center justify-center gap-2 touch-button"
              >
                <Plus size={18} />
                Add Customer
              </button>
              
              <div className="bg-white rounded-xl p-3 mobile-card">
                <h3 className="font-semibold mb-2">Recent Customers</h3>
                <p className="text-gray-500 text-sm">Customer management features coming soon...</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto p-3 mobile-scroll">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Customer Care Tools</h3>
              
              <button
                onClick={onToggleSettings}
                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl active:bg-blue-600 transition-colors flex items-center justify-center gap-2 touch-button"
              >
                <Settings size={18} />
                POS Settings
              </button>
              
              <button
                onClick={onViewReceipts}
                className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl active:bg-green-600 transition-colors flex items-center justify-center gap-2 touch-button"
              >
                <Receipt size={18} />
                View Receipts
              </button>

              <div className="mt-4 p-3 bg-gray-50 rounded-xl mobile-card">
                <h4 className="font-semibold text-gray-900 mb-2">Quick Info</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Current Time:</span>
                    <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cart Items:</span>
                    <span className="font-medium">{cartItemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cart Total:</span>
                    <span className="font-medium">{cartTotal.toLocaleString()} TSH</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <BottomNavigation />
      <SearchSheet />
      <CartSheet />
    </div>
  );
};

export default MobilePOSLayout;
