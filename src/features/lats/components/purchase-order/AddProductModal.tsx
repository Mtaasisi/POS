// AddProductModal component for adding products within purchase orders - SIMPLIFIED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { X, Package, DollarSign, Hash, Tag, Plus, FileText } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { generateSKU } from '../../lib/skuUtils';
import ProductDetailModal from './ProductDetailModal';
import CategoryInput from '../../../shared/components/ui/CategoryInput';
import { validateAndCreateDefaultVariant } from '../../lib/variantUtils';

// Simplified validation schema for purchase order products
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name must be provided').max(100, 'Product name must be less than 100 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  sku: z.string().min(1, 'SKU must be provided').max(50, 'SKU must be less than 50 characters'),
  categoryId: z.string().min(1, 'Category must be selected'),
  condition: z.enum(['new', 'used', 'refurbished'], {
    errorMap: () => ({ message: 'Please select a condition' })
  }),
  notes: z.string().optional()
});

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (product: any) => void;
  currency: any; // Currency type from purchase order utils
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  currency
}) => {
  const { categories, suppliers, createProduct, loadProducts, isCategoriesLoading } = useInventoryStore();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentErrors, setCurrentErrors] = useState<Record<string, string>>({});
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Product review state
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any>(null);

  // Generate auto SKU using utility function
  const generateAutoSKU = () => {
    return generateSKU();
  };

  // Simplified form data - only purchase order essentials
  const [formData, setFormData] = useState({
    name: '',
    sku: generateAutoSKU(),
    categoryId: null,
    condition: 'new' as 'new' | 'used' | 'refurbished',
    description: '',
    notes: ''
  });

  // Name checking
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameExists, setNameExists] = useState(false);

  // Auto-generate SKU when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        sku: generateAutoSKU()
      }));
    }
  }, [isOpen]);

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      
      // Load categories if they haven't been loaded yet
      if (categories.length === 0) {
        const { loadCategories } = useInventoryStore.getState();
        loadCategories().catch(error => {
          console.error('Error loading categories:', error);
        });
      }
    }
  }, [isOpen, categories.length]);


  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Check if product name exists
  const checkProductName = async (name: string) => {
    if (!name.trim()) {
      setNameExists(false);
      return;
    }

    setIsCheckingName(true);
    try {
      // This would need to be implemented based on your data provider
      // For now, we'll just set it to false
      setNameExists(false);
    } catch (error) {
      console.error('Error checking product name:', error);
    } finally {
      setIsCheckingName(false);
    }
  };

  // Handle name check with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name) {
        checkProductName(formData.name);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    try {
      // Ensure SKU is never empty before validation
      const formDataWithValidSku = {
        ...formData,
        sku: formData.sku.trim() || generateAutoSKU()
      };
      
      productFormSchema.parse(formDataWithValidSku);
      setCurrentErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
      }
      
      setCurrentErrors(errors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setCurrentErrors({});
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (nameExists) {
      toast.error('A product with this name already exists');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare simplified product data for purchase orders
      const productData = {
        name: formData.name,
        description: formData.description || null,
        sku: formData.sku.trim() || generateAutoSKU(),
        categoryId: formData.categoryId || null,
        condition: formData.condition || 'new',
        notes: formData.notes || null,
        // Purchase order specific metadata
        metadata: {
          isPurchaseOrderProduct: true,
          createdBy: currentUser?.id,
          createdAt: new Date().toISOString()
        },
        // No variants array - will be created automatically by the system
        variants: []
      };

      // Create the product using the inventory store
      const result = await createProduct(productData);

      if (result.ok && result.data) {
        toast.success('Product created successfully! Review details before adding to purchase order.');
        
        console.log('🔍 AddProductModal: Product created successfully:', result.data);
        console.log('🔍 AddProductModal: Original form SKU:', formData.sku);
        console.log('🔍 AddProductModal: Result variants:', result.data.variants);
        console.log('🔍 AddProductModal: First variant SKU:', result.data.variants?.[0]?.sku);
        
        // Convert the created product to the format expected by ProductDetailModal
        const productForReview = {
          id: result.data.id,
          name: result.data.name,
          sku: result.data.variants?.[0]?.sku || formData.sku.trim() || generateAutoSKU(),
          description: result.data.description,
          categoryName: categories.find(c => c.id === result.data.categoryId)?.name || 'Uncategorized',
          condition: result.data.condition,
          costPrice: 0, // Default cost price
          price: 0, // Default selling price
          barcode: result.data.barcode,
          specification: result.data.specification,
          attributes: result.data.attributes || {},
          images: result.data.images || [],
          // Add default variant for the modal
          variants: [{
            id: result.data.id,
            name: 'Default',
            sku: result.data.variants?.[0]?.sku || formData.sku.trim() || generateAutoSKU(),
            costPrice: 0, // Default cost price
            price: 0, // Default selling price
            quantity: 0, // New product has no stock yet
            attributes: {}
          }]
        };
        
        console.log('🔍 AddProductModal: Final productForReview SKU:', productForReview.sku);
        
        setCreatedProduct(productForReview);
        setShowProductDetails(true);
        
        // Don't close modal yet, show product details first
      } else {
        toast.error(result.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle adding to purchase order from ProductDetailModal
  const handleAddToPurchaseOrder = (product: any, variant: any, quantity: number) => {
    // Update the createdProduct with any modifications made in ProductDetailModal
    setCreatedProduct(prevProduct => ({
      ...prevProduct,
      ...product,
      costPrice: variant.costPrice || product.costPrice,
      price: variant.price || product.price
    }));
    
    onProductAdded(product);
    onClose();
  };

  if (!isOpen) return null;

  // Show product details after creation
  if (showProductDetails && createdProduct) {
    return (
              <ProductDetailModal
          isOpen={true}
          onClose={() => {
            setShowProductDetails(false);
            setCreatedProduct(null);
            // Reset form for next use
            setFormData({
              name: '',
              sku: generateAutoSKU(),
              categoryId: null,
              condition: 'new',
              description: '',
              notes: ''
            });
          }}
          product={createdProduct}
          currency={currency}
          onAddToCart={handleAddToPurchaseOrder}
          onProductUpdated={(updatedProduct) => {
            setCreatedProduct(updatedProduct);
          }}
        />
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Add Product to Purchase Order</h2>
                <p className="text-sm text-gray-600">Add a new product for your purchase order</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Product Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter product name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full py-3 pl-10 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    {isCheckingName && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  {currentErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{currentErrors.name}</p>
                  )}
                  {nameExists && (
                    <p className="mt-1 text-sm text-amber-600">⚠️ A product with this name already exists</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Auto-generated SKU"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className="w-full py-3 pl-10 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  </div>
                  {currentErrors.sku && (
                    <p className="mt-1 text-sm text-red-600">{currentErrors.sku}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <div className="relative">
                  {isDescriptionExpanded ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full py-3 pl-10 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-all duration-200 resize-none border-gray-300 focus:border-blue-500"
                      placeholder="Brief description..."
                      maxLength={200}
                      rows={3}
                      onBlur={() => setIsDescriptionExpanded(false)}
                      autoFocus
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full py-3 pl-10 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-all duration-200 border-gray-300 focus:border-blue-500"
                      placeholder="Brief description..."
                      maxLength={200}
                      onFocus={() => setIsDescriptionExpanded(true)}
                    />
                  )}

                </div>
                {currentErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{currentErrors.description}</p>
                )}
                {isDescriptionExpanded && (
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.description.length}/200 characters
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <CategoryInput
                    value={formData.categoryId}
                    onChange={(categoryId) => handleInputChange('categoryId', categoryId)}
                    categories={categories}
                    placeholder="Select a category"
                    required
                    error={currentErrors.categoryId}
                    disabled={isCategoriesLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'new', label: 'New', color: 'bg-green-500 hover:bg-green-600 border-green-500' },
                      { value: 'used', label: 'Used', color: 'bg-blue-500 hover:bg-blue-600 border-blue-500' },
                      { value: 'refurbished', label: 'Refurbished', color: 'bg-purple-500 hover:bg-purple-600 border-purple-500' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('condition', option.value)}
                        className={`py-3 px-4 rounded-lg border-2 transition-all duration-200 font-medium ${
                          formData.condition === option.value
                            ? `${option.color} text-white`
                            : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>



            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Order Notes</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                <textarea
                  placeholder="Any special requirements, delivery instructions, or notes for this order (optional)"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200">
              <GlassButton
                type="submit"
                disabled={isSubmitting || isCheckingName}
                className="w-full py-4 bg-orange-600 text-white hover:bg-orange-700 text-lg font-semibold"
                icon={isSubmitting ? undefined : <Plus size={20} />}
              >
                {isSubmitting ? 'Creating Product...' : 'Create Product & Review'}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default AddProductModal;
