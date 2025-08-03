import React from 'react';
import { Product, ProductVariant, CustomerType } from '../../types';
import TouchOptimizedButton from '../ui/TouchOptimizedButton';
import {
  Package,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Hash
} from 'lucide-react';

interface QuickProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, variant: ProductVariant) => void;
  customerType: CustomerType;
  maxProducts?: number;
}

const QuickProductGrid: React.FC<QuickProductGridProps> = ({
  products,
  onAddToCart,
  customerType,
  maxProducts = 12
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

  const handleProductSelect = async (product: Product) => {
    // Select the first available variant or the first variant
    const variant = product.variants?.[0];
    if (variant) {
      onAddToCart(product, variant);
    }
  };

  const displayedProducts = products.slice(0, maxProducts);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Products</h3>
        <p className="text-sm text-gray-600">Tap to add to cart</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedProducts.map((product) => {
          const variant = product.variants?.[0];
          const stockStatus = variant ? getStockStatus(variant.available_quantity || 0) : null;
          const price = variant?.retail_price || 0;

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 active:scale-95 transition-all duration-200 cursor-pointer hover:shadow-xl min-h-[160px]"
              onClick={() => handleProductSelect(product)}
            >
              <div className="text-center">
                {/* Product Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <Package className="w-8 h-8 text-white" />
                </div>

                {/* Product Name */}
                <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">
                  {product.name}
                </h4>

                {/* Price */}
                <div className="text-lg font-bold text-green-600 mb-2">
                  {formatCurrency(price)}
                </div>

                {/* Stock Status */}
                {stockStatus && (
                  <div className={`flex items-center justify-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                    {stockStatus.icon}
                    {stockStatus.status}
                  </div>
                )}

                {/* SKU */}
                {variant?.sku && (
                  <div className="text-xs text-gray-500 mt-2">
                    SKU: {variant.sku}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 font-semibold text-lg">No products available</p>
          <p className="text-sm text-gray-500 mt-2">Search for products to add them here</p>
        </div>
      )}

      {products.length > maxProducts && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Showing {maxProducts} of {products.length} products
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickProductGrid; 