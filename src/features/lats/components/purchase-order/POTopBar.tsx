// POTopBar component - Purchase Order Top Bar (equivalent to POSTopBar but for purchase orders)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Search, FileText, Plus, BarChart3, Settings, 
  Truck, Building, Package, Users, RefreshCw, CheckCircle, 
  Trash2, Archive, Clock, DollarSign, TrendingUp, Activity,
  Calendar, CreditCard, Globe, Coins, Scale, Target, Eye,
  Send, Clipboard, PlusCircle, Factory, Store, ArrowLeft
} from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { BackButton } from '../../../shared/components/ui/BackButton';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

interface POTopBarProps {
  cartItemsCount: number;
  totalAmount: number;
  currency: Currency;
  productsCount: number;
  suppliersCount: number;
  onCreatePurchaseOrder: () => void;
  onClearCart: () => void;
  onSearch: (query: string) => void;
  onAddSupplier?: () => void;
  onAddProduct?: () => void;
  onViewPurchaseOrders?: () => void;
  onOpenDrafts?: () => void;
  isCreatingPO: boolean;
  hasSelectedSupplier: boolean;
  draftCount: number;
}

const POTopBar: React.FC<POTopBarProps> = ({
  cartItemsCount,
  totalAmount,
  currency,
  productsCount,
  suppliersCount,
  onCreatePurchaseOrder,
  onClearCart,
  onSearch,
  onAddSupplier,
  onAddProduct,
  onViewPurchaseOrders,
  onOpenDrafts,
  isCreatingPO,
  hasSelectedSupplier,
  draftCount
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const formatMoney = (amount: number) => {
    if (currency.code === 'TZS') {
      return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount).replace(/\.00$/, '').replace(/\.0$/, '');
    }
    
    return `${currency.symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  return (
    <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 shadow-xl border-b-4 border-orange-300">
      <div className="px-4 sm:px-6 py-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Purchase Orders</h1>
                <p className="text-orange-100 text-sm sm:text-base">Create and manage supplier purchase orders</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Draft Badge */}
            {draftCount > 0 && (
              <button
                onClick={onOpenDrafts}
                className="relative p-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm text-white transition-all duration-200 hover:scale-105"
                title={`${draftCount} draft(s) available`}
              >
                <Archive className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {draftCount}
                </span>
              </button>
            )}

            {/* View Purchase Orders */}
            {onViewPurchaseOrders && (
              <GlassButton
                onClick={onViewPurchaseOrders}
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
                icon={<FileText size={18} />}
              >
                <span className="hidden sm:inline">View Orders</span>
              </GlassButton>
            )}

            {/* Settings */}
            <button
              onClick={() => {
                // TODO: Open purchase order settings
              }}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm text-white transition-all duration-200 hover:scale-105"
              title="Purchase Order Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats and Actions Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Cart Stats */}
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                {cartItemsCount} items
              </span>
              {cartItemsCount > 0 && (
                <span className="text-orange-100 text-sm">
                  • {formatMoney(totalAmount)}
                </span>
              )}
            </div>

            {/* Products Count */}
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
              <Package className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                {productsCount} products
              </span>
            </div>

            {/* Suppliers Count */}
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
              <Truck className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                {suppliersCount} suppliers
              </span>
            </div>

            {/* Currency Display */}
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
              <Coins className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                {currency.flag} {currency.code}
              </span>
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Add Product */}
            {onAddProduct && (
              <GlassButton
                onClick={onAddProduct}
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
                icon={<Plus size={18} />}
              >
                <span className="hidden sm:inline">Add Product</span>
              </GlassButton>
            )}

            {/* Add Supplier */}
            {onAddSupplier && (
              <GlassButton
                onClick={onAddSupplier}
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
                icon={<Building size={18} />}
              >
                <span className="hidden sm:inline">Add Supplier</span>
              </GlassButton>
            )}

            {/* Clear Cart */}
            {cartItemsCount > 0 && (
              <GlassButton
                onClick={onClearCart}
                variant="outline"
                className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-300/50 hover:border-red-300/70"
                icon={<Trash2 size={18} />}
              >
                <span className="hidden sm:inline">Clear</span>
              </GlassButton>
            )}

            {/* Create Purchase Order */}
            <GlassButton
              onClick={onCreatePurchaseOrder}
              disabled={!hasSelectedSupplier || cartItemsCount === 0 || isCreatingPO}
              className="bg-white text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              icon={isCreatingPO ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            >
              {isCreatingPO ? 'Creating...' : 'Create PO'}
            </GlassButton>
          </div>
        </div>

        {/* Search Bar Row */}
        <div className="mt-4">
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-300" />
            <input
              type="text"
              placeholder="Quick search products, suppliers, or purchase orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-orange-200 focus:outline-none focus:ring-4 focus:ring-white/30 focus:border-white/50 backdrop-blur-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Status Indicators */}
        {hasSelectedSupplier && cartItemsCount > 0 && (
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-orange-100">
              <CheckCircle className="w-4 h-4 text-green-300" />
              <span>Supplier selected</span>
            </div>
            <div className="flex items-center gap-2 text-orange-100">
              <CheckCircle className="w-4 h-4 text-green-300" />
              <span>{cartItemsCount} product(s) added</span>
            </div>
            <div className="flex items-center gap-2 text-orange-100">
              <DollarSign className="w-4 h-4 text-green-300" />
              <span>Total: {formatMoney(totalAmount)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POTopBar;