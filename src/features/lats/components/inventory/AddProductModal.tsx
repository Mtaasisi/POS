import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { ImageUpload } from '../../../../components/ImageUpload';
import { ImageGallery } from '../../../../components/ImageGallery';
import { ImageUploadService } from '../../../../lib/imageUpload';
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { toast } from 'react-hot-toast';
import { 
  Package, Tag, DollarSign, Hash, FileText, Layers, 
  AlertTriangle as AlertIcon, Eye, Edit, MessageCircle, 
  Users, Star, UserPlus, Plus, X, Save, Camera,
  Upload, Image as ImageIcon, Trash2, CheckCircle,
  RefreshCw, QrCode
} from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import BrandSuggestionInput from '../../../shared/components/ui/BrandSuggestionInput';
import ModelSuggestionInput from '../../../shared/components/ui/ModelSuggestionInput';
import { supabase } from '../../../../lib/supabaseClient';

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
  // At least one of image_url or url must be present
  return data.image_url || data.url;
}, {
  message: "Either image_url or url must be provided"
});

// Validation schema for product form
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Product name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters'),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  supplierId: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  costPrice: z.number().min(0, 'Cost price must be 0 or greater'),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater'),
  minStockLevel: z.number().min(0, 'Minimum stock level must be 0 or greater'),
  maxStockLevel: z.number().min(0, 'Maximum stock level must be 0 or greater').optional(),
  weight: z.number().min(0, 'Weight must be 0 or greater').optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  taxRate: z.number().min(0, 'Tax rate must be 0 or greater').default(0),
  tags: z.array(z.string()).default([]),
  images: z.array(ProductImageSchema).default([]),
  metadata: z.record(z.string()).optional(),
  variants: z.array(z.any()).optional().default([])
});

type ProductFormData = z.infer<typeof productFormSchema>;
type ProductImage = z.infer<typeof ProductImageSchema>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (product: any) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated
}) => {
  const { 
    categories, 
    brands, 
    suppliers,
    createProduct,
    loadCategories,
    loadBrands,
    loadSuppliers,
    isLoading: storeLoading
  } = useInventoryStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [variants, setVariants] = useState<any[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tempProductId] = useState('temp-product-' + Date.now());

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue,
    getValues
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      barcode: '',
      categoryId: '',
      brandId: '',
      supplierId: '',
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      maxStockLevel: 100,
      weight: 0,
      isActive: true,
      isFeatured: false,
      isDigital: false,
      requiresShipping: true,
      taxRate: 0,
      tags: [],
      images: [],
      metadata: {}
    }
  });

  // Watch specific form values for completion calculation
  const [name, sku, categoryId, price, costPrice, stockQuantity, minStockLevel] = watch(['name', 'sku', 'categoryId', 'price', 'costPrice', 'stockQuantity', 'minStockLevel']);
  
  // Debug form state (reduced logging)
  if (Object.keys(errors).length > 0) {
    console.log('🔍 Form validation errors:', errors);
  }

  // Calculate form completion percentage
  useEffect(() => {
    const requiredFields = [
      name ? 1 : 0,
      sku ? 1 : 0,
      categoryId ? 1 : 0,
      price >= 0 ? 1 : 0,
      costPrice >= 0 ? 1 : 0,
      stockQuantity >= 0 ? 1 : 0,
      minStockLevel >= 0 ? 1 : 0
    ];
    const percentage = Math.round((requiredFields.reduce((a, b) => a + b, 0) / requiredFields.length) * 100);
    setCompletionPercentage(percentage);
  }, [name, sku, categoryId, price, costPrice, stockQuantity, minStockLevel]);

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadBrands();
      loadSuppliers();
      
      // Load current user
      const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      };
      loadUser();
    }
  }, [isOpen, loadCategories, loadBrands, loadSuppliers]);

  // Check for duplicate names
  const checkDuplicateName = async (productName: string) => {
    if (!productName || productName.trim().length < 3) {
      setNameExists(false);
      return;
    }

    setIsCheckingName(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingProduct } = await supabase
        .from('lats_products')
        .select('id, name')
        .eq('name', productName.trim())
        .maybeSingle();

      setNameExists(!!existingProduct);
    } catch (error) {
      console.error('Error checking duplicate name:', error);
      setNameExists(false);
    } finally {
      setIsCheckingName(false);
    }
  };

  // Debounced name checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (name && name.trim().length >= 3) {
        checkDuplicateName(name);
      } else {
        setNameExists(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [name]);

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    console.log('🚀 Form submission started with data:', data);
    console.log('🔍 Form errors:', errors);
    console.log('🔍 Form isDirty:', isDirty);
    console.log('🔍 Form isValid:', Object.keys(errors).length === 0);
    console.log('🔍 Form data keys:', Object.keys(data));
    console.log('🔍 Form data values:', Object.values(data));
    
    // Temporarily disable nameExists check for testing
    if (nameExists) {
      toast.error('Please choose a different product name. A product with this name already exists.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get current user for image uploads
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Authentication required. Please log in to create products.');
        return;
      }
      
      // Store images for upload after product creation
      const imagesToUpload = data.images || [];
      console.log('🔍 Debug: Form data images:', data.images);
      console.log('🔍 Debug: imagesToUpload:', imagesToUpload);
      console.log('🔍 Debug: imagesToUpload type:', typeof imagesToUpload);
      console.log('🔍 Debug: imagesToUpload length:', imagesToUpload.length);
      console.log('🔍 Debug: Form data keys:', Object.keys(data));
      console.log('🔍 Debug: Form data values:', Object.values(data));
      
      // Transform form data to match LATS ProductFormData structure
      // Handle variants - if no variants are provided, create a basic one from the main form data
      const normalizedVariants = variants.length > 0 ? variants.map((variant, idx) => {
        return {
          ...variant,
          sku: variant.sku || `${data.sku}-${variant.name || `Variant-${idx + 1}`}`,
          name: variant.name || `Variant ${idx + 1}`,
          price: variant.price || 0,
          costPrice: variant.costPrice || 0,
          stockQuantity: variant.stockQuantity || 0,
          minStockLevel: variant.minStockLevel || 5,
          maxStockLevel: variant.maxStockLevel || 100,
          weight: variant.weight || 0,
          attributes: variant.attributes || {},
          isActive: variant.isActive ?? true
        };
      }) : [{
        // Create a basic variant from main form data if no variants are provided
        sku: `${data.sku}-VARIANT`,
        name: 'Variant 1',
        barcode: '',
        price: data.price || 0,
        costPrice: data.costPrice || 0,
        stockQuantity: data.stockQuantity || 0,
        minStockLevel: data.minStockLevel || 5,
        maxStockLevel: data.maxStockLevel || 100,
        weight: data.weight || 0,
        attributes: {},
        isActive: true
      }];

      const formData = {
        name: data.name,
        description: data.description || '',
        sku: data.sku,
        barcode: data.barcode || '',
        categoryId: data.categoryId,
        brandId: data.brandId || '',
        supplierId: data.supplierId || '',
        images: [], // Images will be uploaded after product creation
        tags: data.tags || [],
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        isDigital: data.isDigital,
        requiresShipping: data.requiresShipping,
        taxRate: data.taxRate,
        // Use normalized variants
        variants: normalizedVariants.map(variant => ({
          sku: variant.sku || `${data.sku}-${variant.name}`,
          name: variant.name,
          barcode: variant.barcode || '',
          price: variant.price,
          costPrice: variant.costPrice,
          stockQuantity: variant.stockQuantity,
          minStockLevel: variant.minStockLevel,
          maxStockLevel: variant.maxStockLevel,
          weight: variant.weight,
          attributes: variant.attributes || {},
          isActive: variant.isActive
        })),
        metadata: data.metadata || {}
      };

      console.log('📤 About to call createProduct with data:', formData);
      const result = await createProduct(formData);
      console.log('📥 createProduct result:', result);
      
      if (result.ok) {
        // Upload images after product creation
        console.log('🔍 Debug: Checking if images need to be uploaded...');
        console.log('🔍 Debug: imagesToUpload.length:', imagesToUpload.length);
        console.log('🔍 Debug: imagesToUpload.length > 0:', imagesToUpload.length > 0);
        
        if (imagesToUpload.length > 0) {
          console.log('🖼️ Updating product images after product creation...');
          try {
            const actualProductId = result.data.id;
            
            console.log('✅ Product created with ID:', actualProductId);
            console.log('🔄 Updating images from temp ID to real ID:', { tempProductId, actualProductId });
            
            // Update the product images to use the real product ID
            const updateResult = await ImageUploadService.updateProductImages(tempProductId, actualProductId);
            
            if (updateResult.success) {
              console.log('✅ Successfully updated product images');
            } else {
              console.error('❌ Failed to update product images:', updateResult.error);
              toast.error('Product created but image association failed. Images may not be visible.');
            }
            
          } catch (uploadError) {
            console.error('❌ Failed to update product images:', uploadError);
            toast.error('Product created but image association failed. Images may not be visible.');
          }
        }
        
        toast.success('Product created successfully!');
        reset();
        onProductCreated?.(result.data);
        onClose();
      } else {
        // Check if it's a duplicate name error and suggest an alternative
        if (result.message && result.message.includes('name already exists')) {
          const currentName = getValues('name');
          const suggestedName = `${currentName} (${Date.now().toString().slice(-4)})`;
          toast.error(
            <div>
              <div>{result.message}</div>
              <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
                Suggested name: <strong>{suggestedName}</strong>
                <button 
                  onClick={() => setValue('name', suggestedName)}
                  style={{ 
                    marginLeft: '8px', 
                    padding: '2px 8px', 
                    background: '#3B82F6', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8em'
                  }}
                >
                  Use This
                </button>
              </div>
            </div>,
            { duration: 8000 }
          );
        } else {
          toast.error(result.message || 'Failed to create product');
        }
      }
    } catch (error: any) {
      console.error('💥 [DEBUG] Form submission error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Are you sure you want to discard your changes?')) {
        reset();
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Automatic SKU/Barcode generation
  const generateAutoSKU = () => {
    const name = getValues('name');
    const categoryId = getValues('categoryId');
    
    if (!name || !categoryId) {
      return;
    }

    // Generate SKU based on name and category
    const category = categories.find(cat => cat.id === categoryId);
    const categoryPrefix = category ? category.name.substring(0, 3).toUpperCase() : 'PROD';
    const namePrefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-4);
    
    const generatedSKU = `${categoryPrefix}-${namePrefix}-${timestamp}`;
    
    // Set both SKU and barcode to the same value
    setValue('sku', generatedSKU);
    setValue('barcode', generatedSKU);
  };

  const clearSKUAndBarcode = () => {
    setValue('sku', '');
    setValue('barcode', '');
  };

  // Auto-generate SKU when name or category changes
  useEffect(() => {
    const name = getValues('name');
    const categoryId = getValues('categoryId');
    const currentSku = getValues('sku');
    
    // Only auto-generate if both name and category are filled and SKU is empty
    if (name && categoryId && !currentSku) {
      generateAutoSKU();
    }
  }, [watch('name'), watch('categoryId')]);

  // Variant management functions
  const addVariant = () => {
    setVariants(prev => [...prev, {
      sku: '',
      name: `Variant ${prev.length + 1}`,
      barcode: '',
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      maxStockLevel: 100,
      weight: 0,
      attributes: {},
      isActive: true
    }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter((_, i) => i !== index));
    } else {
      toast.error('At least one variant is required');
    }
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <GlassCard className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
                <p className="text-sm text-gray-600">Create a new product in your inventory</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form 
            onSubmit={async (e) => {
              console.log('📝 Form submit event triggered');
              console.log('🔍 Form validation state:', {
                isValid: Object.keys(errors).length === 0,
                errors: errors,
                errorCount: Object.keys(errors).length,
                isDirty: isDirty
              });
              console.log('🔍 Detailed errors:', errors);
              try {
                await handleSubmit(handleFormSubmit)(e);
              } catch (error) {
                console.error('❌ Form submission error:', error);
              }
            }} 
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-lats-text border-b border-gray-200 pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name - Full Width */}
                <div className="md:col-span-2">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className={`block mb-3 font-semibold text-lg ${errors.name ? 'text-red-600' : 'text-gray-800'}`}>
                          Product Name *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            className={`w-full py-4 pl-12 pr-4 bg-white/40 backdrop-blur-md border-2 rounded-lg focus:outline-none text-base font-medium ${
                              errors.name ? 'border-red-500 focus:border-red-600' : 
                              nameExists ? 'border-orange-500 focus:border-orange-600' :
                              'border-gray-300 focus:border-blue-500'
                            }`}
                            placeholder="Enter product name"
                            value={field.value}
                            onChange={field.onChange}
                          />
                          <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          {isCheckingName && (
                            <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={18} />
                          )}
                          {nameExists && !isCheckingName && (
                            <AlertIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                          )}
                        </div>
                        {errors.name && (
                          <div className="text-red-500 text-xs mt-1">{errors.name.message}</div>
                        )}
                        {nameExists && !isCheckingName && (
                          <div className="text-orange-600 text-xs mt-1">
                            <div className="flex items-center gap-1 mb-1">
                              <AlertIcon size={14} />
                              A product with this name already exists
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const currentName = getValues('name');
                                const suggestedName = `${currentName} (${Date.now().toString().slice(-4)})`;
                                setValue('name', suggestedName);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              Suggest alternative name
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Category */}
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className={`block mb-3 font-semibold text-lg ${errors.categoryId ? 'text-red-600' : 'text-gray-800'}`}>
                        Category *
                      </label>
                      <select
                        className={`w-full py-4 px-4 bg-white/40 backdrop-blur-md border-2 rounded-lg focus:outline-none text-base font-medium ${
                          errors.categoryId ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.categoryId && (
                        <div className="text-red-500 text-xs mt-1">{errors.categoryId.message}</div>
                      )}
                    </div>
                  )}
                />

                {/* Brand */}
                <Controller
                  name="brandId"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block mb-3 font-semibold text-lg text-gray-800">Brand</label>
                      <select
                        className="w-full py-4 px-4 bg-white/40 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="">Select a brand</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                />

                {/* Supplier - Full Width */}
                <div className="md:col-span-2">
                  <Controller
                    name="supplierId"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block mb-3 font-semibold text-lg text-gray-800">Supplier</label>
                        <select
                          className="w-full py-4 px-4 bg-white/40 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="">Select a supplier</option>
                          {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  />
                </div>

              </div>

              {/* SKU & Barcode - Hidden when variants are enabled */}
              {!showVariants && (
                <div className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SKU */}
                    <Controller
                      name="sku"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className={`block mb-3 font-semibold text-lg ${errors.sku ? 'text-red-600' : 'text-gray-800'}`}>
                            SKU/Barcode *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              className={`w-full py-4 pl-12 pr-4 bg-white/40 backdrop-blur-md border-2 rounded-lg focus:outline-none text-base font-medium ${
                                errors.sku ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                              }`}
                              placeholder="Enter SKU, barcode, serial number, or IMEI"
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                // Also update barcode field to keep them in sync
                                setValue('barcode', e.target.value);
                              }}
                              onClick={() => {
                                // Clear field when clicked if it has auto-generated content
                                if (field.value) {
                                  clearSKUAndBarcode();
                                }
                              }}
                            />
                            <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Auto-generated from product name and category. Click to clear and enter manually.
                          </p>
                          {errors.sku && (
                            <div className="text-red-500 text-xs mt-1">{errors.sku.message}</div>
                          )}
                        </div>
                      )}
                    />

                    {/* Hidden barcode field that syncs with SKU */}
                    <Controller
                      name="barcode"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="hidden"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-lats-text border-b border-gray-200 pb-2">Description</h3>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block mb-3 font-semibold text-lg text-gray-800">Product Description</label>
                      <textarea
                        className="w-full py-4 px-4 bg-white/40 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none text-base font-medium"
                        placeholder="Enter detailed product description..."
                        rows={4}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Pricing & Stock - Hidden when variants are enabled */}
            {!showVariants && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-lats-text border-b border-gray-200 pb-2">Pricing & Stock</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Selling Price */}
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className={`block mb-3 font-semibold text-lg ${errors.price ? 'text-red-600' : 'text-gray-800'}`}>
                        Selling Price *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          className={`w-full py-4 pl-12 pr-4 bg-white/40 backdrop-blur-md border-2 rounded-lg focus:outline-none text-base font-medium ${
                            errors.price ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="0.00"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      </div>
                      {errors.price && (
                        <div className="text-red-500 text-xs mt-1">{errors.price.message}</div>
                      )}
                    </div>
                  )}
                />

                {/* Cost Price */}
                <Controller
                  name="costPrice"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className={`block mb-3 font-semibold text-lg ${errors.costPrice ? 'text-red-600' : 'text-gray-800'}`}>
                        Cost Price *
                      </label>
                      <div className="relative">
                        <PriceInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="0"
                          className={`w-full py-4 pl-12 pr-4 bg-white/40 backdrop-blur-md border-2 rounded-lg focus:outline-none text-base font-medium ${
                            errors.costPrice ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                          }`}
                        />
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      </div>
                      {errors.costPrice && (
                        <div className="text-red-500 text-xs mt-1">{errors.costPrice.message}</div>
                      )}
                    </div>
                  )}
                />

                {/* Stock Quantity */}
                <Controller
                  name="stockQuantity"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className={`block mb-3 font-semibold text-lg ${errors.stockQuantity ? 'text-red-600' : 'text-gray-800'}`}>
                        Stock Quantity *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          className={`w-full py-4 pl-12 pr-20 bg-white/40 backdrop-blur-md border-2 rounded-lg focus:outline-none text-base font-medium ${
                            errors.stockQuantity ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="0"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          min="0"
                        />
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        
                        {/* Plus and Minus buttons */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => field.onChange(Math.max(0, (field.value || 0) - 1))}
                            className="w-8 h-8 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-sm font-bold transition-colors"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange((field.value || 0) + 1)}
                            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {errors.stockQuantity && (
                        <div className="text-red-500 text-xs mt-1">{errors.stockQuantity.message}</div>
                      )}
                    </div>
                  )}
                />

                                 {/* Min Stock Level */}
                 <Controller
                   name="minStockLevel"
                   control={control}
                   render={({ field }) => (
                     <div>
                       <label className={`block mb-3 font-semibold text-lg ${errors.minStockLevel ? 'text-red-600' : 'text-gray-800'}`}>
                         Min Stock Level *
                       </label>
                                               <div className="relative">
                          <input
                            type="number"
                            className={`w-full py-4 px-4 pr-20 bg-white/40 backdrop-blur-md border-2 rounded-lg focus:outline-none text-base font-medium ${
                              errors.minStockLevel ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                            }`}
                            placeholder="5"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            min="0"
                          />
                          
                          {/* Plus and Minus buttons */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => field.onChange(Math.max(0, (field.value || 0) - 1))}
                              className="w-8 h-8 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange((field.value || 0) + 1)}
                              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                       {errors.minStockLevel && (
                         <div className="text-red-500 text-xs mt-1">{errors.minStockLevel.message}</div>
                       )}
                     </div>
                   )}
                 />


               </div>
             </div>
            )}

             {/* Product Images */}
             <div className="space-y-6">
               <h3 className="text-xl font-bold text-lats-text border-b border-gray-200 pb-2">Product Images</h3>
               
               <div className="space-y-4">
                 {/* Image Upload */}
                 <div className="space-y-4">
                   <label className="block text-sm font-medium text-gray-700">
                     Product Images
                   </label>
                   <ImageUpload
                     productId={tempProductId}
                     userId={user?.id || ''}
                     onUploadComplete={(images) => {
                       // Convert to the format expected by the form
                       const formImages = images.map(img => ({
                         id: img.id,
                         image_url: img.url,
                         thumbnail_url: img.url, // Use same URL for thumbnail
                         file_name: img.fileName,
                         file_size: img.fileSize,
                         is_primary: img.isPrimary,
                         uploaded_by: img.uploadedAt, // Use uploadedAt as uploaded_by for now
                         created_at: img.uploadedAt
                       }));
                       setValue('images', formImages);
                     }}
                     onUploadError={(error) => {
                       toast.error(`Upload failed: ${error}`);
                     }}
                     maxFiles={5}
                   />
                   
                   {/* Image Gallery */}
                   <ImageGallery
                     productId={tempProductId}
                     onImagesChange={(images) => {
                       // Convert to the format expected by the form
                       const formImages = images.map(img => ({
                         id: img.id,
                         image_url: img.url,
                         thumbnail_url: img.url,
                         file_name: img.fileName,
                         file_size: img.fileSize,
                         is_primary: img.isPrimary,
                         uploaded_by: img.uploadedAt,
                         created_at: img.uploadedAt
                       }));
                       setValue('images', formImages);
                     }}
                   />
                 </div>
               </div>
             </div>

             {/* Product Variants */}
             <div className="space-y-6">
               <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                 <h3 className="text-xl font-bold text-lats-text">Product Variants</h3>
                 <button
                   type="button"
                   onClick={() => {
                     if (!showVariants) {
                       // When showing variants, create the first variant if none exist
                       if (variants.length === 0) {
                         addVariant();
                       }
                     }
                     setShowVariants(!showVariants);
                   }}
                   className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                 >
                   <Layers size={16} />
                   {showVariants ? 'Hide' : 'Show'} Variants
                 </button>
               </div>
               
               {showVariants && (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <p className="text-sm text-gray-600">
                       Manage product variants (colors, sizes, etc.)
                     </p>
                     <GlassButton
                       type="button"
                       onClick={addVariant}
                       variant="secondary"
                       size="sm"
                     >
                       <Plus size={16} />
                       Add Variant
                     </GlassButton>
                   </div>
                   
                   {variants.map((variant, index) => (
                     <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                       <div className="flex items-center justify-between mb-3">
                         <h4 className="font-medium text-gray-900">Variant {index + 1}</h4>
                         {variants.length > 1 && (
                           <button
                             type="button"
                             onClick={() => removeVariant(index)}
                             className="text-red-500 hover:text-red-700"
                           >
                             <X size={16} />
                           </button>
                         )}
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name</label>
                           <input
                             type="text"
                             value={variant.name}
                             onChange={(e) => updateVariant(index, 'name', e.target.value)}
                             className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                             placeholder="e.g., Red, Large, etc."
                           />
                         </div>
                         
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Variant SKU</label>
                           <input
                             type="text"
                             value={variant.sku}
                             onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                             className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                             placeholder="e.g., PROD-RED-L"
                           />
                         </div>
                         
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                           <input
                             type="number"
                             value={variant.price}
                             onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                             className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                             min="0"
                             step="0.01"
                           />
                         </div>
                         
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                           <input
                             type="number"
                             value={variant.stockQuantity}
                             onChange={(e) => updateVariant(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                             className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                             min="0"
                           />
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* Product Status */}
             <div className="space-y-6">
               <h3 className="text-xl font-bold text-lats-text border-b border-gray-200 pb-2">Product Status</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Controller
                   name="isActive"
                   control={control}
                   render={({ field }) => (
                     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div>
                         <label className="text-sm font-medium text-gray-700">Active</label>
                         <p className="text-xs text-gray-500">Product will be visible to customers</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           className="sr-only"
                           checked={field.value}
                           onChange={field.onChange}
                         />
                         <div className={`w-11 h-6 rounded-full transition-colors ${
                           field.value ? 'bg-blue-600' : 'bg-gray-300'
                         }`}>
                           <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                             field.value ? 'translate-x-5' : 'translate-x-0'
                           }`} />
                         </div>
                       </label>
                     </div>
                   )}
                 />

                 <Controller
                   name="isFeatured"
                   control={control}
                   render={({ field }) => (
                     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div>
                         <label className="text-sm font-medium text-gray-700">Featured</label>
                         <p className="text-xs text-gray-500">Highlight this product</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           className="sr-only"
                           checked={field.value}
                           onChange={field.onChange}
                         />
                         <div className={`w-11 h-6 rounded-full transition-colors ${
                           field.value ? 'bg-blue-600' : 'bg-gray-300'
                         }`}>
                           <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                             field.value ? 'translate-x-5' : 'translate-x-0'
                           }`} />
                         </div>
                       </label>
                     </div>
                   )}
                 />


               </div>
             </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-lats-glass-border">
              <GlassButton
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={!isDirty || nameExists}
                className="flex-1 sm:flex-none"
                onClick={() => {
                  console.log('🔘 Submit button clicked');
                  console.log('🔍 Button state:', {
                    isDirty,
                    nameExists,
                    isSubmitting,
                    disabled: !isDirty
                  });
                }}
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </GlassButton>
              
              <GlassButton
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default AddProductModal;
