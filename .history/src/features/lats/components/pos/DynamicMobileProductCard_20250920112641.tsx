import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Package, Plus, Minus, Loader2 } from 'lucide-react';
import { ProductSearchResult } from '../../types/pos';
import { ProductImage } from '../../../../lib/robustImageService';
import { toast } from 'react-hot-toast';
import { RESPONSIVE_OPTIMIZATIONS } from '../../../shared/constants/theme';

interface DynamicMobileProductCardProps {
  product: ProductSearchResult;
  onAddToCart: (product: ProductSearchResult, variant?: any, quantity?: number) => void;
  isVisible?: boolean;
  priority?: boolean;
}

const DynamicMobileProductCard: React.FC<DynamicMobileProductCardProps> = ({
  product,
  onAddToCart,
  isVisible = true,
  priority = false
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);
  const [isLoaded, setIsLoaded] = useState(priority);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isTextLoaded, setIsTextLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the card comes into view
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isLoaded]);

  // Progressive loading of content
  useEffect(() => {
    if (!isLoaded) return;

    // Load image first
    const imageTimer = setTimeout(() => {
      setIsImageLoaded(true);
    }, 100);

    // Load text content after image
    const textTimer = setTimeout(() => {
      setIsTextLoaded(true);
    }, 200);

    return () => {
      clearTimeout(imageTimer);
      clearTimeout(textTimer);
    };
  }, [isLoaded]);

  const handleAddToCart = useCallback(() => {
    onAddToCart(product, selectedVariant, quantity);
    toast.success(`${quantity}x ${product.name} added to cart`);
  }, [product, selectedVariant, quantity, onAddToCart]);

  const formatPrice = useCallback((price: number) => {
    return price.toLocaleString() + ' TSH';
  }, []);

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className={`${RESPONSIVE_OPTIMIZATIONS.productCard.imageHeight.mobile} ${RESPONSIVE_OPTIMIZATIONS.productCard.imageHeight.tablet} ${RESPONSIVE_OPTIMIZATIONS.productCard.imageHeight.desktop} ${RESPONSIVE_OPTIMIZATIONS.productCard.imageHeight.hd} bg-gray-200`}></div>
      
      {/* Content skeleton */}
      <div className={`${RESPONSIVE_OPTIMIZATIONS.productCard.padding.mobile} ${RESPONSIVE_OPTIMIZATIONS.productCard.padding.tablet} ${RESPONSIVE_OPTIMIZATIONS.productCard.padding.desktop} ${RESPONSIVE_OPTIMIZATIONS.productCard.padding.hd} space-y-2`}>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  // Show skeleton while loading
  if (!isLoaded) {
    return (
      <div ref={cardRef}>
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div 
      ref={cardRef}
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300"
      style={{
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(10px)'
      }}
    >
      {/* Product Image */}
      <div className={`relative ${RESPONSIVE_OPTIMIZATIONS.productCard.imageHeight.mobile} ${RESPONSIVE_OPTIMIZATIONS.productCard.imageHeight.tablet} ${RESPONSIVE_OPTIMIZATIONS.productCard.imageHeight.desktop} ${RESPONSIVE_OPTIMIZATIONS.productCard.imageHeight.hd} bg-gray-50`}>
        {isImageLoaded ? (
          <ProductImage
            src={product.thumbnail_url}
            alt={product.name}
            className="w-full h-full object-cover transition-opacity duration-300"
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Package size={32} className="text-gray-400" />
              </div>
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Loader2 size={24} className="text-gray-400 animate-spin" />
          </div>
        )}
        
        {/* Stock Badge */}
        {isTextLoaded && product.stock_quantity !== undefined && (
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium transition-opacity duration-300 ${
            product.stock_quantity > 10 
              ? 'bg-green-100 text-green-700' 
              : product.stock_quantity > 0 
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
          }`}>
            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={`${RESPONSIVE_OPTIMIZATIONS.productCard.padding.mobile} ${RESPONSIVE_OPTIMIZATIONS.productCard.padding.tablet} ${RESPONSIVE_OPTIMIZATIONS.productCard.padding.desktop} ${RESPONSIVE_OPTIMIZATIONS.productCard.padding.hd}`}>
        {isTextLoaded ? (
          <>
            <h3 className={`font-semibold text-gray-900 ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.title.mobile} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.title.tablet} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.title.desktop} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.title.hd} mb-1 line-clamp-2`}>
              {product.name}
            </h3>
            
            {product.sku && (
              <p className={`${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.sku.mobile} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.sku.tablet} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.sku.desktop} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.sku.hd} text-gray-500 mb-2`}>SKU: {product.sku}</p>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 1 && (
              <div className="mb-2">
                <select
                  value={selectedVariant?.id || ''}
                  onChange={(e) => {
                    const variant = product.variants?.find(v => v.id === e.target.value);
                    setSelectedVariant(variant);
                  }}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1"
                >
                  {product.variants.map(variant => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name} - {formatPrice(variant.price)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center justify-between mb-3">
              <span className={`font-bold text-green-600 ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.price.mobile} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.price.tablet} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.price.desktop} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.price.hd}`}>
                {formatPrice(selectedVariant?.price || product.price)}
              </span>
              
              {/* Quantity Selector */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className={`w-full ${RESPONSIVE_OPTIMIZATIONS.buttonSizes.mobile} ${RESPONSIVE_OPTIMIZATIONS.buttonSizes.tablet} ${RESPONSIVE_OPTIMIZATIONS.buttonSizes.desktop} ${RESPONSIVE_OPTIMIZATIONS.buttonSizes.hd} bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.button.mobile} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.button.tablet} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.button.desktop} ${RESPONSIVE_OPTIMIZATIONS.productCard.textSize.button.hd}`}
            >
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicMobileProductCard;
