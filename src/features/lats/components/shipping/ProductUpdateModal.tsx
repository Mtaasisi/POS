import React, { useState, useEffect } from 'react';
import { X, Package, Save, AlertTriangle, CheckCircle, Image, DollarSign, FileText, Upload, Camera, Layers, Plus, Trash2, Move, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { ShippingInfo, CargoBox, ShippingCargoItem } from '../../types/inventory';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { Product } from '../../types/inventory';
import { draftProductsService } from '../../services/draftProductsService';
import inventoryService from '../../services/inventoryService';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../context/AuthContext';
import { SimpleImageUpload } from '../../../../components/SimpleImageUpload';
import StorageLocationForm from '../product/StorageLocationForm';

interface ProductUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  shippingInfo: ShippingInfo;
  onProductsUpdated: (updatedProducts: Product[]) => void;
}

interface ProductUpdateData {
  id?: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  images: ProductImage[];
  variants: ProductVariant[];
  useVariants: boolean;
  storageRoomId: string;
  shelfId: string;
  isComplete: boolean;
  validationErrors: string[];
}

interface ProductImage {
  id?: string;
  image_url?: string;
  url?: string;
  thumbnail_url?: string;
  file_name?: string;
  fileName?: string;
  file_size?: number;
  fileSize?: number;
  is_primary?: boolean;
  isPrimary?: boolean;
  uploaded_by?: string;
  created_at?: string;
  uploadedAt?: string;
  mimeType?: string;
}

interface ProductVariant {
  name: string;
  sku: string;
  costPrice: number;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  specification?: string;
  attributes?: Record<string, any>;
}

const ProductUpdateModal: React.FC<ProductUpdateModalProps> = ({
  isOpen,
  onClose,
  shippingInfo,
  onProductsUpdated
}) => {
  const { getProduct, updateProduct, createProduct } = useInventoryStore();
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<ProductUpdateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(0);
  
  // Storage location state - using StorageLocationForm component
  
  // Variants state
  const [showVariants, setShowVariants] = useState(false);
  const [isReorderingVariants, setIsReorderingVariants] = useState(false);
  const [draggedVariantIndex, setDraggedVariantIndex] = useState<number | null>(null);

  // Initialize products from cargo items (draft products)
  useEffect(() => {
    if (isOpen && shippingInfo.id) {
      initializeProducts();
    }
  }, [isOpen, shippingInfo.id]);

  const initializeProducts = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 [ProductUpdateModal] ENHANCED DEBUG - Initializing products for shipping ID:', shippingInfo.id);
      
      // First, try to get draft products from the shipment
      let draftProducts = await draftProductsService.getDraftProductsForValidation(shippingInfo.id!);
      console.log('📦 [ProductUpdateModal] Found draft products:', draftProducts.length);
      
      // DEBUG: Log detailed draft products information
      console.log('🔍 [ProductUpdateModal] DEBUG - Draft products details:', draftProducts.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        supplier: product.supplier,
        totalQuantity: product.totalQuantity,
        variants: product.variants,
        price: product.price,
        costPrice: product.costPrice
      })));
      
      // If no draft products exist, try to create them from the purchase order
      if (draftProducts.length === 0) {
        console.log('⚠️ [ProductUpdateModal] No draft products found, attempting to create from purchase order...');
        
        // Get the purchase order ID from shipping info
        console.log('🔍 [ProductUpdateModal] Looking up purchase order for shipping ID:', shippingInfo.id);
        const { data: shippingData, error: shippingError } = await supabase
          .from('lats_shipping_info')
          .select('purchase_order_id')
          .eq('id', shippingInfo.id!)
          .single();
          
        console.log('🔍 [ProductUpdateModal] Shipping data lookup result:', { shippingData, shippingError });
          
        if (shippingError) {
          if (shippingError.code === 'PGRST116') {
            console.log('🔍 [ProductUpdateModal] No shipping info found for ID:', shippingInfo.id);
            toast.error('No shipping information found for this shipment. Please create shipping information first.');
            throw new Error('No shipping information found for this shipment');
          } else {
            console.error('❌ [ProductUpdateModal] Could not find purchase order for this shipment:', shippingError);
            toast.error('Could not find purchase order for this shipment. Please ensure the shipment is properly linked to a purchase order.');
            throw new Error('Could not find purchase order for this shipment');
          }
        }
        
        if (!shippingData) {
          console.error('❌ [ProductUpdateModal] No shipping data returned for ID:', shippingInfo.id);
          toast.error('No shipping data found for this shipment.');
          throw new Error('No shipping data found for this shipment');
        }
        
        console.log('✅ [ProductUpdateModal] Found purchase order ID:', shippingData.purchase_order_id);
        
        // Create draft products from purchase order
        const createResult = await draftProductsService.createDraftProductsFromPO(
          shippingData.purchase_order_id,
          shippingInfo.id!
        );
        
        if (createResult.success) {
          console.log('✅ [ProductUpdateModal] Draft products created:', createResult.message);
          toast.success(createResult.message);
          // Try to get the draft products again
          console.log('🔄 [ProductUpdateModal] Fetching draft products after creation...');
          draftProducts = await draftProductsService.getDraftProductsForValidation(shippingInfo.id!);
          console.log('📦 [ProductUpdateModal] Draft products after creation:', draftProducts.length);
        } else {
          console.error('❌ [ProductUpdateModal] Failed to create draft products:', createResult.message);
          toast.error(`Failed to create draft products: ${createResult.message}`);
          throw new Error(createResult.message);
        }
      }
      
      const productUpdates: ProductUpdateData[] = draftProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || product.name || '', // Use name as fallback for description
        price: product.price || 0,
        costPrice: product.costPrice || 0,
        stockQuantity: product.stockQuantity || 0,
        minStockLevel: product.minStockLevel || 2,
        images: product.images || [],
        variants: product.variants || [],
        useVariants: product.useVariants || false,
        storageRoomId: product.storageRoomId || '',
        shelfId: product.shelfId || '',
        isComplete: validateProductCompleteness(product),
        validationErrors: getValidationErrors(product)
      }));

      setProducts(productUpdates);
      
      // If still no products, show a message
      if (productUpdates.length === 0) {
        toast.error('No products found for this shipment. Please ensure the purchase order has items.');
      }
    } catch (error) {
      console.error('Error initializing products:', error);
      toast.error('Failed to load draft products: ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      // Set empty products array to show the empty state
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const findProductByDescription = async (description: string): Promise<Product | null> => {
    try {
      // This is a simplified search - in a real implementation, you'd have better product matching
      const response = await getProduct(description);
      return response.ok ? response.data : null;
    } catch {
      return null;
    }
  };

  const validateProductCompleteness = (product: Product): boolean => {
    return !!(
      product.name && // From PO - should always be present
      product.price > 0 && // Selling price - user sets this
      product.costPrice > 0 && // From PO - should always be present
      product.images && product.images.length > 0 // User adds images
      // Note: description is optional, not required for completion
    );
  };

  const getValidationErrors = (product: Product): string[] => {
    const errors: string[] = [];
    // Note: name, description, costPrice, and stockQuantity come from Purchase Order
    // Only validate fields that user can actually edit
    if (!product.price || product.price <= 0) errors.push('Selling price must be greater than 0');
    if (!product.images || product.images.length === 0) errors.push('At least one product image is required');
    if (!product.minStockLevel || product.minStockLevel < 0) errors.push('Minimum stock level must be 0 or greater');
    return errors;
  };

  const updateProductData = (index: number, field: keyof ProductUpdateData, value: any) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Revalidate the product
      const product = {
        name: updated[index].name,
        description: updated[index].description,
        price: updated[index].price,
        costPrice: updated[index].costPrice,
        stockQuantity: updated[index].stockQuantity,
        minStockLevel: updated[index].minStockLevel,
        images: updated[index].images,
        variants: updated[index].variants,
        useVariants: updated[index].useVariants,
        storageRoomId: updated[index].storageRoomId,
        shelfId: updated[index].shelfId
      } as Product;
      
      updated[index].isComplete = validateProductCompleteness(product);
      updated[index].validationErrors = getValidationErrors(product);
      
      return updated;
    });
  };

  // Storage location functions - handled by StorageLocationForm component

  // Variant management functions
  const addVariant = (productIndex: number) => {
    const newVariant: ProductVariant = {
      name: `Variant ${products[productIndex].variants.length + 1}`,
      sku: `SKU-${Date.now()}`,
      costPrice: 0,
      price: 0,
      stockQuantity: 0,
      minStockLevel: 2,
      attributes: {}
    };
    
    updateProductData(productIndex, 'variants', [...products[productIndex].variants, newVariant]);
  };

  const removeVariant = (productIndex: number, variantIndex: number) => {
    const updatedVariants = products[productIndex].variants.filter((_, index) => index !== variantIndex);
    updateProductData(productIndex, 'variants', updatedVariants);
  };

  const updateVariant = (productIndex: number, variantIndex: number, field: keyof ProductVariant, value: any) => {
    const updatedVariants = [...products[productIndex].variants];
    updatedVariants[variantIndex] = { ...updatedVariants[variantIndex], [field]: value };
    updateProductData(productIndex, 'variants', updatedVariants);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedProducts: Product[] = [];
      
      for (const productData of products) {
        if (productData.id) {
          // Update draft product using draft products service
          // Only update fields that user can edit (not from Purchase Order)
          // DEBUG: Log what data is being updated
          console.log('🔍 [ProductUpdateModal] DEBUG - Updating product with data:', {
            productId: productData.id,
            selling_price: productData.price,
            min_stock_level: productData.minStockLevel,
            images: productData.images,
            storage_room_id: productData.storageRoomId,
            store_shelf_id: productData.shelfId
          });

          // DEBUG: Check if selling price is being set
          if (productData.price === 0 || !productData.price) {
            console.warn('⚠️ [ProductUpdateModal] DEBUG - Selling price is 0 or not set:', {
              price: productData.price,
              productId: productData.id,
              productName: productData.name
            });
          } else {
            console.log('✅ [ProductUpdateModal] DEBUG - Selling price is set:', productData.price);
          }

          const updateResult = await draftProductsService.updateDraftProduct(productData.id, {
            // Keep PO fields as read-only: name, description, costPrice, stockQuantity
            selling_price: productData.price, // Selling price - user sets this
            min_stock_level: productData.minStockLevel, // Business rule - user sets this
            images: productData.images, // Product photos - user adds these
            storage_room_id: productData.storageRoomId, // Storage location - user sets this
            store_shelf_id: productData.shelfId // Shelf location - user sets this
          });
          
          if (updateResult.success) {
            // Validate the product with updated information
            const validationResult = await draftProductsService.validateDraftProduct(
              productData.id,
              shippingInfo.id!,
              productData.validationErrors,
              {
                costPrice: productData.costPrice,
                sellingPrice: productData.price,
                supplierId: productData.supplierId,
                categoryId: productData.categoryId,
                productName: productData.name,
                productDescription: productData.description,
                notes: `Product updated during validation - Cost: ${productData.costPrice}, Price: ${productData.price}`
              }
            );
            
            if (validationResult.success) {
              // Get the updated product
              const product = await getProduct(productData.id);
              if (product.ok && product.data) {
                updatedProducts.push(product.data);
              }
            }
          }
        }
      }
      
      // Check if all products are validated and ready for inventory
      const validationStatus = await draftProductsService.getShipmentValidationStatus(shippingInfo.id!);
      
      if (validationStatus.isReady) {
        toast.success('All products validated successfully! Moving to inventory...');
        
        // Automatically receive the shipment to inventory
        try {
          const inventoryResult = await inventoryService.receiveShipment(shippingInfo.id!);
          if (inventoryResult.success) {
            toast.success(`Shipment received into inventory! ${inventoryResult.data?.productsCreated || 0} products created, ${inventoryResult.data?.productsUpdated || 0} products updated`);
          } else {
            toast.error(`Failed to receive shipment: ${inventoryResult.error}`);
          }
        } catch (inventoryError) {
          console.error('Error receiving shipment to inventory:', inventoryError);
          toast.error('Products validated but failed to move to inventory. Please try the "Receive to Inventory" button.');
        }
      } else {
        toast.success(`Products updated. ${validationStatus.missingProducts} products still need validation.`);
      }
      
      onProductsUpdated(updatedProducts);
      onClose();
    } catch (error) {
      console.error('Error saving products:', error);
      toast.error('Failed to save product updates');
    } finally {
      setIsSaving(false);
    }
  };

  const canProceedToReadyForInventory = products.every(p => p.isComplete);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Update Product Details</h2>
                <p className="text-gray-600">Review and update product information for shipment</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading product data...</span>
            </div>
          ) : (
            <>
              {/* Product Navigation */}
              {products.length > 1 && (
                <div className="mb-6">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {products.map((product, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedProductIndex(index)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                          selectedProductIndex === index
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {product.isComplete ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <AlertTriangle size={16} className="text-yellow-500" />
                          )}
                          Product {index + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {products.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                  <p className="text-gray-600 mb-4">
                    No products were found for this shipment. This could happen if:
                  </p>
                  <ul className="text-sm text-gray-500 text-left max-w-md mx-auto mb-6">
                    <li>• The purchase order has no items</li>
                    <li>• The draft products haven't been created yet</li>
                    <li>• There was an error loading the products</li>
                  </ul>
                  <div className="flex gap-3 justify-center">
                    <GlassButton
                      onClick={initializeProducts}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw size={16} />
                      Retry Loading
                    </GlassButton>
                    <GlassButton
                      onClick={onClose}
                      variant="secondary"
                    >
                      Close
                    </GlassButton>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Troubleshooting</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      If products are still not showing, this might be because:
                    </p>
                    <ul className="text-sm text-blue-600 space-y-1 mb-3">
                      <li>• The purchase order has no items</li>
                      <li>• The database function failed to create draft products</li>
                      <li>• There's a connection issue with the database</li>
                    </ul>
                    <p className="text-xs text-blue-500">
                      Check the browser console for detailed error messages.
                    </p>
                  </div>
                </div>
              )}

              {/* Product Form */}
              {products.length > 0 && (
                <div className="space-y-6">
                  {/* Purchase Order Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Package size={20} />
                      Purchase Order Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-800">Product Name:</span>
                        <p className="text-blue-700 font-medium">{products[selectedProductIndex]?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Cost Price:</span>
                        <p className="text-blue-700 font-medium">
                          {products[selectedProductIndex]?.costPrice ? `TZS ${products[selectedProductIndex].costPrice.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Quantity Ordered:</span>
                        <p className="text-blue-700 font-medium">{products[selectedProductIndex]?.stockQuantity || 0} units</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Total Value:</span>
                        <p className="text-blue-700 font-medium">
                          {products[selectedProductIndex]?.costPrice && products[selectedProductIndex]?.stockQuantity 
                            ? `TZS ${(products[selectedProductIndex].costPrice * products[selectedProductIndex].stockQuantity).toLocaleString()}`
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    {products[selectedProductIndex]?.description && (
                      <div className="mt-3">
                        <span className="font-medium text-blue-800">Description:</span>
                        <p className="text-blue-700 text-sm mt-1">{products[selectedProductIndex].description}</p>
                      </div>
                    )}
                    <p className="text-xs text-blue-600 mt-3 flex items-center gap-1">
                      <Package size={12} />
                      This information comes from the Purchase Order and cannot be modified here.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Product Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Product Configuration</h3>
                      
                      {/* Product Configuration Fields - Only editable fields */}

                      {/* Description Field */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Description (Optional)
                        </label>
                        <textarea
                          value={products[selectedProductIndex]?.description || ''}
                          onChange={(e) => updateProductData(selectedProductIndex, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter product description (optional)"
                          rows={3}
                        />
                        <p className="text-xs text-gray-500 mt-1">Additional details about the product</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selling Price *
                          </label>
                          <input
                            type="number"
                            value={products[selectedProductIndex]?.price || 0}
                            onChange={(e) => updateProductData(selectedProductIndex, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                          <p className="text-xs text-gray-500 mt-1">Set your retail price</p>
                          
                          {/* Profit Calculator */}
                          {products[selectedProductIndex]?.price > 0 && products[selectedProductIndex]?.costPrice > 0 && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={16} className="text-green-600" />
                                <span className="text-sm font-medium text-green-800">Profit Calculator</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Cost Price:</span>
                                  <div className="font-medium text-gray-900">
                                    TZS {products[selectedProductIndex]?.costPrice?.toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Selling Price:</span>
                                  <div className="font-medium text-gray-900">
                                    TZS {products[selectedProductIndex]?.price?.toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Profit per Unit:</span>
                                  <div className="font-medium text-green-700">
                                    TZS {(products[selectedProductIndex]?.price - products[selectedProductIndex]?.costPrice)?.toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Profit Margin:</span>
                                  <div className="font-medium text-green-700">
                                    {(((products[selectedProductIndex]?.price - products[selectedProductIndex]?.costPrice) / products[selectedProductIndex]?.price) * 100)?.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                              {products[selectedProductIndex]?.stockQuantity > 0 && (
                                <div className="mt-2 pt-2 border-t border-green-200">
                                  <div className="text-sm">
                                    <span className="text-gray-600">Total Profit (All Units):</span>
                                    <div className="font-medium text-green-700">
                                      TZS {((products[selectedProductIndex]?.price - products[selectedProductIndex]?.costPrice) * products[selectedProductIndex]?.stockQuantity)?.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Min Stock Level *
                          </label>
                          <input
                            type="number"
                            value={products[selectedProductIndex]?.minStockLevel || 2}
                            onChange={(e) => updateProductData(selectedProductIndex, 'minStockLevel', parseInt(e.target.value) || 2)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="2"
                            min="0"
                          />
                          <p className="text-xs text-gray-500 mt-1">Minimum stock before reorder</p>
                        </div>
                      </div>
                    </div>

                    {/* Validation Status */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Validation Status</h3>
                      
                      <div className={`p-4 rounded-lg border-2 ${
                        products[selectedProductIndex]?.isComplete 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          {products[selectedProductIndex]?.isComplete ? (
                            <CheckCircle size={20} className="text-green-600" />
                          ) : (
                            <AlertTriangle size={20} className="text-yellow-600" />
                          )}
                          <span className={`font-medium ${
                            products[selectedProductIndex]?.isComplete ? 'text-green-800' : 'text-yellow-800'
                          }`}>
                            {products[selectedProductIndex]?.isComplete ? 'Complete' : 'Incomplete'}
                          </span>
                        </div>

                        {products[selectedProductIndex]?.validationErrors.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Missing requirements:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {products[selectedProductIndex]?.validationErrors.map((error, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Product Images */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Camera size={16} className="text-purple-600" />
                          Product Images
                        </h4>
                        <SimpleImageUpload
                          images={products[selectedProductIndex]?.images || []}
                          onImagesChange={(images) => updateProductData(selectedProductIndex, 'images', images)}
                          currentUser={currentUser}
                          productId={products[selectedProductIndex]?.id || `temp-${Date.now()}`}
                          maxImages={10}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product Variants */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Layers size={20} className="text-blue-600" />
                        Product Variants
                      </h3>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={products[selectedProductIndex]?.useVariants || false}
                            onChange={(e) => updateProductData(selectedProductIndex, 'useVariants', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Use Variants
                        </label>
                        {products[selectedProductIndex]?.useVariants && (
                          <button
                            onClick={() => addVariant(selectedProductIndex)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Plus size={14} />
                            Add Variant
                          </button>
                        )}
                      </div>
                    </div>

                    {products[selectedProductIndex]?.useVariants && (
                      <div className="space-y-3">
                        {products[selectedProductIndex]?.variants?.map((variant, variantIndex) => (
                          <div key={variantIndex} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">Variant {variantIndex + 1}</h4>
                              <button
                                onClick={() => removeVariant(selectedProductIndex, variantIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                <input
                                  type="text"
                                  value={variant.name}
                                  onChange={(e) => updateVariant(selectedProductIndex, variantIndex, 'name', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={(e) => updateVariant(selectedProductIndex, variantIndex, 'sku', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Cost Price</label>
                                <input
                                  type="number"
                                  value={variant.costPrice}
                                  onChange={(e) => updateVariant(selectedProductIndex, variantIndex, 'costPrice', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price</label>
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(selectedProductIndex, variantIndex, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  min="0"
                                  step="0.01"
                                />
                                
                                {/* Variant Profit Calculator */}
                                {variant.price > 0 && variant.costPrice > 0 && (
                                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                                    <div className="flex items-center gap-1 mb-1">
                                      <TrendingUp size={12} className="text-green-600" />
                                      <span className="font-medium text-green-800">Profit</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-gray-600">Per Unit:</span>
                                        <div className="font-medium text-green-700">
                                          TZS {(variant.price - variant.costPrice).toLocaleString()}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Margin:</span>
                                        <div className="font-medium text-green-700">
                                          {(((variant.price - variant.costPrice) / variant.price) * 100).toFixed(1)}%
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Stock Quantity</label>
                                <input
                                  type="number"
                                  value={variant.stockQuantity}
                                  onChange={(e) => updateVariant(selectedProductIndex, variantIndex, 'stockQuantity', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Min Stock Level</label>
                                <input
                                  type="number"
                                  value={variant.minStockLevel}
                                  onChange={(e) => updateVariant(selectedProductIndex, variantIndex, 'minStockLevel', parseInt(e.target.value) || 2)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Storage Location */}
                  <StorageLocationForm
                    formData={{
                      storageRoomId: products[selectedProductIndex]?.storageRoomId || '',
                      shelfId: products[selectedProductIndex]?.shelfId || ''
                    }}
                    setFormData={(updates) => {
                      if (typeof updates === 'function') {
                        const newData = updates({
                          storageRoomId: products[selectedProductIndex]?.storageRoomId || '',
                          shelfId: products[selectedProductIndex]?.shelfId || ''
                        });
                        updateProductData(selectedProductIndex, 'storageRoomId', newData.storageRoomId);
                        updateProductData(selectedProductIndex, 'shelfId', newData.shelfId);
                      } else {
                        updateProductData(selectedProductIndex, 'storageRoomId', updates.storageRoomId);
                        updateProductData(selectedProductIndex, 'shelfId', updates.shelfId);
                      }
                    }}
                    currentErrors={{}}
                  />

                  {/* Overall Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Overall Status</h4>
                        <p className="text-sm text-gray-600">
                          {products.filter(p => p.isComplete).length} of {products.length} products complete
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        canProceedToReadyForInventory
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {canProceedToReadyForInventory ? 'Ready for Inventory' : 'Needs Completion'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {products.length} products from {shippingInfo.cargoBoxes?.length || 0} cargo boxes
                </div>
                <div className="flex gap-3">
                  <GlassButton
                    onClick={onClose}
                    variant="secondary"
                    disabled={isSaving}
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    onClick={handleSave}
                    disabled={isSaving || !canProceedToReadyForInventory}
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save & Continue'}
                  </GlassButton>
                </div>
              </div>
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default ProductUpdateModal;
