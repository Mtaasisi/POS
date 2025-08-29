import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, MapPin, Store, X, Plus, Check, Layers, Palette, HardDrive, Zap, Cpu, Monitor, Battery, Camera, Ruler, FileText, Building } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { retryWithBackoff } from '../../../lib/supabaseClient';
import { getActiveBrands, Brand } from '../../../lib/brandApi';
import { getActiveCategories, Category } from '../../../lib/categoryApi';
import { getActiveSuppliers, Supplier } from '../../../lib/supplierApi';
import { StoreLocation } from '../../settings/types/storeLocation';
import { storeLocationApi } from '../../settings/utils/storeLocationApi';

// Extracted components
import ProductInformationForm from '../components/product/ProductInformationForm';
import PricingAndStockForm from '../components/product/PricingAndStockForm';
import ProductImagesSection from '../components/product/ProductImagesSection';
import ProductVariantsSection from '../components/product/ProductVariantsSection';
import StorageLocationForm from '../components/product/StorageLocationForm';

// Import ProductVariant type
interface ProductVariant {
  name: string;
  sku: string;
  barcode: string;
  costPrice: number;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  specification?: string;
  attributes?: Record<string, any>;
}

// ProductImage interface for form validation
const ProductImageSchema = z.object({
  id: z.string().optional(),
  image_url: z.string().optional(),
  url: z.string().optional(),
  thumbnail_url: z.string().optional(),
  file_name: z.string().optional(),
  fileName: z.string().optional(),
  file_size: z.number().optional(),
  fileSize: z.number().optional(),
  is_primary: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  uploaded_by: z.string().optional(),
  created_at: z.string().optional(),
  uploadedAt: z.string().optional(),
  mimeType: z.string().optional()
}).refine((data) => {
  // Allow empty objects (for new images) or objects with either image_url or url
  return Object.keys(data).length === 0 || data.image_url || data.url;
}, {
  message: "Either image_url or url must be provided for non-empty image objects"
});

// Validation schema for product form
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name must be provided').max(100, 'Product name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  specification: z.string().max(1000, 'Specification must be less than 1000 characters').optional().refine((val) => {
    if (!val) return true; // Allow empty strings
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "Specification must be valid JSON"
  }),
  sku: z.string().min(1, 'SKU must be provided').max(50, 'SKU must be less than 50 characters'),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'Category must be selected'),

  supplierId: z.string().optional(),
  condition: z.string().min(1, 'Product condition must be selected'),
  
  price: z.number().min(0, 'Price must be 0 or greater'),
  costPrice: z.number().min(0, 'Cost price must be 0 or greater'),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater'),
  minStockLevel: z.number().min(0, 'Minimum stock level must be 0 or greater'),

  // Storage location fields
  storageRoomId: z.string().optional(),
  shelfId: z.string().optional(),

  images: z.array(ProductImageSchema).default([]),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  variants: z.array(z.any()).optional().default([])
});

type ProductImage = z.infer<typeof ProductImageSchema>;

const EditProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [currentErrors, setCurrentErrors] = useState<Record<string, string>>({});

  // Initial form data
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',

    supplierId: '',
    condition: '',
    description: '',
    specification: '', // Ensure this is always a string
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 0,
    storageRoomId: '',
    shelfId: '',
    images: [] as ProductImage[],
    metadata: {},
    variants: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Variants state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [useVariants, setUseVariants] = useState(false);
  const [isReorderingVariants, setIsReorderingVariants] = useState(false);
  const [draggedVariantIndex, setDraggedVariantIndex] = useState<number | null>(null);

  // Variant specifications modal state
  const [showVariantSpecificationsModal, setShowVariantSpecificationsModal] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState<number | null>(null);
  const [showCustomInput, setShowCustomInput] = useState<number | null>(null);
  const [customAttributeInput, setCustomAttributeInput] = useState('');

  // Product specifications modal state
  const [showProductSpecificationsModal, setShowProductSpecificationsModal] = useState(false);
  const [showProductCustomInput, setShowProductCustomInput] = useState(false);
  const [productCustomAttributeInput, setProductCustomAttributeInput] = useState('');

  // Name checking
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameExists, setNameExists] = useState(false);

  const { currentUser } = useAuth();

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, locationsData, brandsData, suppliersData] = await Promise.all([
          getActiveCategories(),
          storeLocationApi.getAll(),
          getActiveBrands(),
          getActiveSuppliers()
        ]);

        setCategories(categoriesData || []);
        setStoreLocations(locationsData || []);
        setBrands(brandsData || []);
        setSuppliers(suppliersData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load form data');
      }
    };

    loadData();
  }, []);

  // Load product data when productId changes
  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  // Check if product name exists
  const checkProductName = async (name: string) => {
    if (!name.trim()) {
      setNameExists(false);
      return;
    }

    setIsCheckingName(true);
    try {
      const { data, error } = await supabase!
        .from('lats_products')
        .select('id')
        .ilike('name', `%${name.trim()}%`)
        .neq('id', productId) // Exclude current product when editing
        .limit(1);

      if (error) throw error;
      
      setNameExists(data && data.length > 0);
    } catch (error) {
      console.error('Error checking product name:', error);
    } finally {
      setIsCheckingName(false);
    }
  };

  // Convert brand name to brand ID
  const getBrandIdFromName = (brandName: string): string | null => {
    if (!brandName || !brands.length) return null;
    const brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
    return brand?.id || null;
  };

  // Ensure variants are always shown for products with original variants
  useEffect(() => {
    if (useVariants) {
      setShowVariants(true);
    }
  }, [useVariants]);

  // Handle name check with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name) {
        checkProductName(formData.name);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  const loadProductData = async () => {
    if (!productId) return;
    
    try {
      const { data: product, error } = await supabase!
        .from('lats_products')
        .select(`
          *,
          variants:lats_product_variants(*)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      
      if (product) {

        
        setFormData({
          name: product.name || '',
          description: product.description || '',
          specification: (() => {
            try {
              if (product.specification) {
                // If it's already a string, validate it's JSON
                if (typeof product.specification === 'string') {
                  JSON.parse(product.specification);
                  return product.specification;
                }
                // If it's an object, stringify it
                if (typeof product.specification === 'object') {
                  return JSON.stringify(product.specification);
                }
              }
              return '';
            } catch {
              // If JSON parsing fails, return empty string
              return '';
            }
          })(),
          sku: product.sku || '',
          barcode: product.barcode || '',
          categoryId: product.category_id || '',
          supplierId: product.supplier_id || '',
          condition: product.condition || '',
          
          price: product.selling_price || 0,
          costPrice: product.cost_price || 0,
          stockQuantity: product.stock_quantity || 0,
          minStockLevel: product.min_stock_level || 0,
          storageRoomId: product.storage_room_id || '',
          shelfId: product.store_shelf_id || '',
          images: product.images || [],
          metadata: product.attributes || {},
          variants: []
        });
        
        // Load variants if they exist
        if (product.variants && product.variants.length > 0) {
          const processedVariants = product.variants.map((variant: any) => ({
            name: variant.name || '',
            sku: variant.sku || '',
            barcode: variant.barcode || '',
            costPrice: variant.cost_price || 0,
            price: variant.selling_price || 0,
            stockQuantity: variant.quantity || 0,
            minStockLevel: variant.min_quantity || 0,
            specification: variant.attributes?.specification || '',
            attributes: variant.attributes || {}
          }));
          setVariants(processedVariants);
          setUseVariants(true);
          setShowVariants(true);
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product data');
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    try {
      // Filter out invalid image objects
      const validImages = formData.images.filter(img => {
        // Keep images that have either image_url or url, or are completely empty objects
        return Object.keys(img).length === 0 || img.image_url || img.url;
      });
      
      const dataToValidate = {
        ...formData,
        images: validImages,
        variants: useVariants ? variants : []
      };
      
      console.log('Validating form data:', dataToValidate);
      
      productFormSchema.parse(dataToValidate);
      
      setCurrentErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('Validation errors:', error.issues);
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
      }
      
      console.log('Setting current errors:', errors);
      setCurrentErrors(errors);
      return false;
    }
  };

  // Submit form
  const handleSubmit = async () => {
    setHasSubmitted(true);
    
    if (!validateForm()) {
      console.log('Form validation failed. Current errors:', currentErrors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (nameExists) {
      toast.error('A product with this name already exists');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate total quantity and value
      const totalQuantity = useVariants && variants.length > 0 
        ? variants.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0)
        : (formData.stockQuantity || 0);
      
      const totalValue = useVariants && variants.length > 0
        ? variants.reduce((sum, variant) => sum + ((variant.stockQuantity || 0) * (variant.price || 0)), 0)
        : ((formData.stockQuantity || 0) * (formData.price || 0));

      // Prepare comprehensive product data with all fields
      const productData = {
        name: formData.name,
        description: formData.description || null,
        specification: formData.specification || null,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        category_id: formData.categoryId || null,

        supplier_id: formData.supplierId || null,
        condition: formData.condition || 'new',
        cost_price: formData.costPrice || 0,
        selling_price: formData.price || 0,
        stock_quantity: formData.stockQuantity || 0,
        min_stock_level: formData.minStockLevel || 0,
        total_quantity: totalQuantity,
        total_value: totalValue,
        storage_room_id: formData.storageRoomId || null,
        store_shelf_id: formData.shelfId || null,
        images: formData.images || [],
        tags: [],
        attributes: formData.metadata || {},
        metadata: {
          useVariants: useVariants,
          variantCount: useVariants ? variants.length : 0,
          updatedBy: currentUser?.id,
          updatedAt: new Date().toISOString()
        }
      };

      console.log('Product data being updated:', productData);

      const { data: updatedProduct, error } = await retryWithBackoff(async () => {
        return await supabase!
          .from('lats_products')
          .update(productData)
          .eq('id', productId)
          .select()
          .single();
      });

      if (error) throw error;

      // If using variants, update them
      if (useVariants && variants.length > 0 && updatedProduct) {
        // First delete existing variants
        const { error: deleteError } = await supabase!
          .from('lats_product_variants')
          .delete()
          .eq('product_id', productId);

        if (deleteError) {
          console.error('Error deleting existing variants:', deleteError);
        }

        // Then insert new variants
        const variantData = variants.map(variant => ({
          product_id: productId,
          sku: variant.sku,
          name: variant.name,
          cost_price: variant.costPrice,
          selling_price: variant.price,
          quantity: variant.stockQuantity,
          min_quantity: variant.minStockLevel,
          barcode: variant.barcode,
          attributes: {
            ...variant.attributes,
            specification: variant.specification || null
          }
        }));

        const { error: variantError } = await retryWithBackoff(async () => {
          return await supabase!
            .from('lats_product_variants')
            .insert(variantData);
        });

        if (variantError) {
          console.error('Error updating variants:', variantError);
          toast.error('Product updated but failed to update variants');
        }
      }

      toast.success('Product updated successfully!');
      navigate('/lats/unified-inventory');
      
    } catch (error) {
      console.error('Error updating product:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error('Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add attribute to a variant
  const addAttributeToVariant = (variantIndex: number, attributeName: string) => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes, [attributeName]: '' };
    updateVariant(variantIndex, 'attributes', newAttributes);
  };

  // Handle custom attribute submission
  const handleCustomAttributeSubmit = (variantIndex: number) => {
    if (customAttributeInput.trim()) {
      const cleanName = customAttributeInput.trim().toLowerCase().replace(/\s+/g, '_');
      addAttributeToVariant(variantIndex, cleanName);
      setShowCustomInput(null);
      setCustomAttributeInput('');
    }
  };

  // Cancel custom attribute input
  const cancelCustomAttribute = () => {
    setShowCustomInput(null);
    setCustomAttributeInput('');
  };

  // Remove attribute from a variant
  const removeAttributeFromVariant = (variantIndex: number, attributeName: string) => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes };
    delete newAttributes[attributeName];
    updateVariant(variantIndex, 'attributes', newAttributes);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const handleVariantSpecificationsClick = (index: number) => {
    setCurrentVariantIndex(index);
    setShowVariantSpecificationsModal(true);
  };

  const handleProductSpecificationsClick = () => {
    setShowProductSpecificationsModal(true);
  };

  // Add attribute to product
  const addAttributeToProduct = (attributeName: string) => {
    const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
    const newSpecs = { ...currentSpecs, [attributeName]: '' };
    setFormData(prev => ({ ...prev, specification: JSON.stringify(newSpecs) }));
  };

  // Handle custom product attribute submission
  const handleProductCustomAttributeSubmit = () => {
    if (productCustomAttributeInput.trim()) {
      const cleanName = productCustomAttributeInput.trim().toLowerCase().replace(/\s+/g, '_');
      addAttributeToProduct(cleanName);
      setShowProductCustomInput(false);
      setProductCustomAttributeInput('');
    }
  };

  // Cancel custom product attribute input
  const cancelProductCustomAttribute = () => {
    setShowProductCustomInput(false);
    setProductCustomAttributeInput('');
  };

  // Remove attribute from product
  const removeAttributeFromProduct = (attributeName: string) => {
    const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
    const newSpecs = { ...currentSpecs };
    delete newSpecs[attributeName];
    setFormData(prev => ({ ...prev, specification: JSON.stringify(newSpecs) }));
  };

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/lats/unified-inventory" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600">Update product information and details</p>
            </div>
          </div>
        </div>

        <GlassCard className="mb-6">
          <div className="space-y-6">
            {/* Product Information Form */}
            <ProductInformationForm
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              currentErrors={currentErrors}
              isCheckingName={isCheckingName}
              nameExists={nameExists}
              onNameCheck={checkProductName}
              onSpecificationsClick={handleProductSpecificationsClick}
            />

            {/* Supplier Selection */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building size={20} className="text-purple-600" />
                Supplier Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label 
                    htmlFor="supplier-select"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Supplier (optional)
                  </label>
                  <select
                    id="supplier-select"
                    value={formData.supplierId}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                    className="w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors border-gray-300 focus:border-blue-500"
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing and Stock Form */}
            <PricingAndStockForm
              formData={formData}
              setFormData={setFormData}
              currentErrors={currentErrors}
            />

            {/* Product Images Section */}
            <ProductImagesSection
              images={formData.images}
              setImages={(images: ProductImage[]) => setFormData(prev => ({ ...prev, images }))}
              currentUser={currentUser}
            />

            {/* Product Variants Section */}
            <ProductVariantsSection
              variants={variants}
              setVariants={setVariants}
              useVariants={useVariants}
              setUseVariants={setUseVariants}
              showVariants={showVariants}
              setShowVariants={setShowVariants}
              isReorderingVariants={isReorderingVariants}
              setIsReorderingVariants={setIsReorderingVariants}
              draggedVariantIndex={draggedVariantIndex}
              setDraggedVariantIndex={setDraggedVariantIndex}
              onVariantSpecificationsClick={handleVariantSpecificationsClick}
              baseSku={formData.sku}
            />

            {/* Storage Location Form */}
            <StorageLocationForm
              formData={formData}
              setFormData={setFormData}
              currentErrors={currentErrors}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <GlassButton
                onClick={() => navigate('/lats/unified-inventory')}
                variant="secondary"
                icon={<ArrowLeft size={18} />}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </GlassButton>
              
              <div className="flex-1" />
              
              <GlassButton
                onClick={handleSubmit}
                loading={isSubmitting}
                icon={<Save size={18} />}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-1 sm:flex-none"
                disabled={isSubmitting || isCheckingName}
              >
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Variant Specifications Modal */}
      {showVariantSpecificationsModal && currentVariantIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="variant-specifications-modal-title"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden mx-auto">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 id="variant-specifications-modal-title" className="text-xl font-semibold text-gray-900">
                      Variant Specifications
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {variants[currentVariantIndex]?.name || `Variant ${currentVariantIndex + 1}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVariantSpecificationsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Quick Add Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-blue-600" />
                    Add Specifications
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { name: 'Color', icon: Palette },
                      { name: 'Storage', icon: HardDrive },
                      { name: 'RAM', icon: Zap },
                      { name: 'Processor', icon: Cpu },
                      { name: 'Screen Size', icon: Monitor },
                      { name: 'Battery', icon: Battery },
                      { name: 'Camera', icon: Camera },
                      { name: 'Size', icon: Ruler }
                    ].map((spec) => (
                      <button 
                        key={spec.name}
                        type="button" 
                        onClick={() => addAttributeToVariant(currentVariantIndex, spec.name.toLowerCase().replace(/\s+/g, '_'))} 
                        className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <spec.icon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{spec.name}</span>
                      </button>
                    ))}
                    
                    <button 
                      type="button" 
                      onClick={() => { setShowCustomInput(currentVariantIndex); setCustomAttributeInput(''); }} 
                      className="flex items-center gap-3 p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Custom</span>
                    </button>
                  </div>
                </div>

                {/* Custom Attribute Input */}
                {showCustomInput === currentVariantIndex && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={customAttributeInput}
                        onChange={(e) => setCustomAttributeInput(e.target.value)}
                        placeholder="Enter custom specification name..."
                        className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && customAttributeInput.trim()) {
                            handleCustomAttributeSubmit(currentVariantIndex);
                          }
                        }}
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleCustomAttributeSubmit(currentVariantIndex)} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Add
                      </button>
                      <button 
                        type="button" 
                        onClick={cancelCustomAttribute} 
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Specifications List */}
                {variants[currentVariantIndex]?.attributes && Object.keys(variants[currentVariantIndex].attributes).length > 0 ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Check size={20} className="text-green-600" />
                      Current Specifications
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {Object.keys(variants[currentVariantIndex].attributes).length}
                      </span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(variants[currentVariantIndex].attributes).map(([key, value]) => (
                        <div key={key} className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                            {key.replace(/_/g, ' ')}
                          </label>
                          <input
                            type="text"
                            value={value as string}
                            onChange={(e) => {
                              const newAttributes = { ...variants[currentVariantIndex].attributes, [key]: e.target.value };
                              updateVariant(currentVariantIndex, 'attributes', newAttributes);
                            }}
                            className="w-full py-2 px-3 pr-8 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder={key.replace(/_/g, ' ')}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                          />
                          <button
                            type="button"
                            onClick={() => removeAttributeFromVariant(currentVariantIndex, key)}
                            className="absolute right-2 top-8 text-red-500 hover:text-red-700"
                            title="Remove specification"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Specifications Added</h3>
                    <p className="text-gray-500 text-sm">
                      Click the buttons above to add specifications for this variant.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {variants[currentVariantIndex]?.attributes && Object.keys(variants[currentVariantIndex].attributes).length > 0 
                    ? `${Object.keys(variants[currentVariantIndex].attributes).length} specification${Object.keys(variants[currentVariantIndex].attributes).length !== 1 ? 's' : ''} added`
                    : 'No specifications added yet'
                  }
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowVariantSpecificationsModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVariantSpecificationsModal(false);
                      toast.success('Variant specifications saved successfully!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Specifications Modal */}
      {showProductSpecificationsModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-specifications-modal-title"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden mx-auto">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 id="product-specifications-modal-title" className="text-xl font-semibold text-gray-900">
                      Product Specifications
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Add and manage product specifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProductSpecificationsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Quick Add Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-blue-600" />
                    Add Specifications
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { name: 'Color', icon: Palette },
                      { name: 'Storage', icon: HardDrive },
                      { name: 'RAM', icon: Zap },
                      { name: 'Processor', icon: Cpu },
                      { name: 'Screen Size', icon: Monitor },
                      { name: 'Battery', icon: Battery },
                      { name: 'Camera', icon: Camera },
                      { name: 'Size', icon: Ruler }
                    ].map((spec) => (
                      <button 
                        key={spec.name}
                        type="button" 
                        onClick={() => addAttributeToProduct(spec.name.toLowerCase().replace(/\s+/g, '_'))} 
                        className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <spec.icon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{spec.name}</span>
                      </button>
                    ))}
                    
                    <button 
                      type="button" 
                      onClick={() => { setShowProductCustomInput(true); setProductCustomAttributeInput(''); }} 
                      className="flex items-center gap-3 p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Custom</span>
                    </button>
                  </div>
                </div>

                {/* Custom Attribute Input */}
                {showProductCustomInput && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={productCustomAttributeInput}
                        onChange={(e) => setProductCustomAttributeInput(e.target.value)}
                        placeholder="Enter custom specification name..."
                        className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && productCustomAttributeInput.trim()) {
                            handleProductCustomAttributeSubmit();
                          }
                        }}
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <button 
                        type="button" 
                        onClick={handleProductCustomAttributeSubmit} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Add
                      </button>
                      <button 
                        type="button" 
                        onClick={cancelProductCustomAttribute} 
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Specifications List */}
                {(() => {
                  const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
                  const hasSpecs = Object.keys(currentSpecs).length > 0;
                  
                  return hasSpecs ? (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Check size={20} className="text-green-600" />
                        Current Specifications
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {Object.keys(currentSpecs).length}
                        </span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(currentSpecs).map(([key, value]) => (
                          <div key={key} className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                              {key.replace(/_/g, ' ')}
                            </label>
                            <input
                              type="text"
                              value={value as string}
                              onChange={(e) => {
                                const newSpecs = { ...currentSpecs, [key]: e.target.value };
                                setFormData(prev => ({ ...prev, specification: JSON.stringify(newSpecs) }));
                              }}
                              className="w-full py-2 px-3 pr-8 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                              placeholder={key.replace(/_/g, ' ')}
                              autoComplete="off"
                              autoCorrect="off"
                              spellCheck={false}
                            />
                            <button
                              type="button"
                              onClick={() => removeAttributeFromProduct(key)}
                              className="absolute right-2 top-8 text-red-500 hover:text-red-700"
                              title="Remove specification"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Specifications Added</h3>
                      <p className="text-gray-500 text-sm">
                        Click the buttons above to add specifications for this product.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {(() => {
                    const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
                    return Object.keys(currentSpecs).length > 0 
                      ? `${Object.keys(currentSpecs).length} specification${Object.keys(currentSpecs).length !== 1 ? 's' : ''} added`
                      : 'No specifications added yet';
                  })()}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProductSpecificationsModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductSpecificationsModal(false);
                      toast.success('Product specifications saved successfully!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProductPage;
