import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { searchProducts, searchProductVariants, Product, ProductVariant } from '../../lib/inventoryApi';
import GlassButton from './GlassButton';
import Modal from './Modal';

interface ProductSelectorProps {
  value?: { product: Product; variant: ProductVariant } | null;
  onChange: (selection: { product: Product; variant: ProductVariant } | null) => void;
  placeholder?: string;
  className?: string;
  allowNewProduct?: boolean;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onChange,
  placeholder = "Search products...",
  className = '',
  allowNewProduct = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setProducts([]);
      setVariants([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);
    
    try {
      const [productsData, variantsData] = await Promise.all([
        searchProducts(query),
        searchProductVariants(query)
      ]);
      
      setProducts(productsData);
      setVariants(variantsData);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVariant = (product: Product, variant: ProductVariant) => {
    onChange({ product, variant });
    setSearchQuery(`${product.name} - ${variant.variant_name}`);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleNewProductCreated = () => {
    setShowNewProductModal(false);
    // Optionally refresh the search results
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  const displayValue = value 
    ? `${value.product.name} - ${value.variant.variant_name} (${value.variant.sku})`
    : searchQuery;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (searchQuery.length >= 2) {
              setShowDropdown(true);
            }
          }}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Products with variants */}
              {products.map(product => (
                <div key={product.id}>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-blue-500" />
                      <span className="font-medium text-gray-900">{product.name}</span>
                      {product.brand && (
                        <span className="text-sm text-gray-500">({product.brand})</span>
                      )}
                    </div>
                  </div>
                  {product.variants?.map(variant => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleSelectVariant(product, variant)}
                      className="w-full px-6 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{variant.variant_name}</div>
                          <div className="text-sm text-gray-600">
                            SKU: {variant.sku} • Stock: {variant.quantity_in_stock} • 
                            Price: {variant.selling_price.toLocaleString('en-TZ', {
                              style: 'currency',
                              currency: 'TZS',
                              minimumFractionDigits: 0
                            })}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          variant.quantity_in_stock > 10 
                            ? 'bg-green-100 text-green-800'
                            : variant.quantity_in_stock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {variant.quantity_in_stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}

              {/* Standalone variants */}
              {variants.filter(v => !products.some(p => p.id === v.product_id)).map(variant => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => variant.product && handleSelectVariant(variant.product, variant)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{variant.variant_name}</div>
                      <div className="text-sm text-gray-600">
                        SKU: {variant.sku} • Stock: {variant.quantity_in_stock}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {variant.selling_price.toLocaleString('en-TZ', {
                        style: 'currency',
                        currency: 'TZS',
                        minimumFractionDigits: 0
                      })}
                    </div>
                  </div>
                </button>
              ))}

              {/* No results */}
              {!loading && products.length === 0 && variants.length === 0 && searchQuery.length >= 2 && (
                <div className="p-4 text-center">
                  <div className="text-gray-500 mb-2">No products found for "{searchQuery}"</div>
                  {allowNewProduct && (
                    <GlassButton
                      onClick={() => setShowNewProductModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add New Product
                    </GlassButton>
                  )}
                </div>
              )}

              {/* Add new product option */}
              {allowNewProduct && (products.length > 0 || variants.length > 0) && (
                <div className="border-t border-gray-200 p-2">
                  <GlassButton
                    onClick={() => setShowNewProductModal(true)}
                    className="w-full flex items-center justify-center gap-2"
                    variant="secondary"
                  >
                    <Plus size={16} />
                    Add New Product
                  </GlassButton>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* New Product Modal */}
      {showNewProductModal && (
        <Modal
          isOpen={showNewProductModal}
          onClose={() => setShowNewProductModal(false)}
          title="Add New Product"
          maxWidth="4xl"
        >
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                This will open the new product creation form. After creating the product, 
                it will be automatically selected in the dropdown.
              </p>
              <div className="flex gap-3">
                <GlassButton
                  onClick={() => {
                    setShowNewProductModal(false);
                    // Navigate to new inventory page
                    window.open('/inventory/new', '_blank');
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Open New Product Form
                </GlassButton>
                <GlassButton
                  onClick={() => setShowNewProductModal(false)}
                  variant="secondary"
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductSelector;