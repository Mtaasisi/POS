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
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Quick Products</h3>
        <p className="text-lg text-gray-600">Tap to add to cart</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayedProducts.map((product) => {
          const variant = product.variants?.[0];
          const stockStatus = variant ? getStockStatus(variant.available_quantity || 0) : null;
          const price = variant?.retail_price || 0;

          return (
            <div
              key={product.id}
              className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 active:scale-95 transition-all duration-200 cursor-pointer hover:shadow-xl min-h-[200px]"
              onClick={() => handleProductSelect(product)}
            >
              <div className="text-center">
                {/* Product Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Package className="w-10 h-10 text-white" />
                </div>

                {/* Product Name */}
                <h4 className="font-semibold text-gray-900 text-base mb-3 line-clamp-2 leading-tight">
                  {product.name}
                </h4>

                {/* Price */}
                <div className="text-xl font-bold text-green-600 mb-3">
                  {formatCurrency(price)}
                </div>

                {/* Stock Status */}
                {stockStatus && (
                  <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                    {stockStatus.icon}
                    {stockStatus.status}
                  </div>
                )}

                {/* SKU */}
                {variant?.sku && (
                  <div className="text-sm text-gray-500 mt-3">
                    SKU: {variant.sku}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-600 font-semibold text-xl">No products available</p>
          <p className="text-lg text-gray-500 mt-3">Search for products to add them here</p>
        </div>
      )}

      {products.length > maxProducts && (
        <div className="text-center mt-6">
          <p className="text-lg text-gray-500">
            Showing {maxProducts} of {products.length} products
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickProductGrid; 