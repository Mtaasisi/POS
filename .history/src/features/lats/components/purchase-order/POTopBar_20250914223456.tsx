// POTopBar component - Purchase Order Top Bar (equivalent to POSTopBar but for purchase orders)
import React from 'react';
import {
  ShoppingBag, FileText, Plus, Package, RefreshCw, CheckCircle, 
  Trash2, DollarSign, Truck, Coins, Building
} from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { formatMoney, Currency } from '../../lib/purchaseOrderUtils';

interface POTopBarProps {
  cartItemsCount: number;
  totalAmount: number;
  currency: Currency;
  productsCount: number;
  suppliersCount: number;
  onCreatePurchaseOrder: () => void;
  onClearCart: () => void;
  onAddSupplier?: () => void;
  onAddProduct?: () => void;
  onViewPurchaseOrders?: () => void;
  isCreatingPO: boolean;
  hasSelectedSupplier: boolean;
}

const POTopBar: React.FC<POTopBarProps> = ({
  cartItemsCount,
  totalAmount,
  currency,
  productsCount,
  suppliersCount,
  onCreatePurchaseOrder,
  onClearCart,
  onAddSupplier,
  onAddProduct,
  onViewPurchaseOrders,
  isCreatingPO,
  hasSelectedSupplier
}) => {

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg border-b border-orange-300">
      <div className="px-4 sm:px-6 py-4">
        {/* Stats and Actions Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
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



      </div>
    </div>
  );
};

export default POTopBar;
