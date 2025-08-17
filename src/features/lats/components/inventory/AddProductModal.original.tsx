import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { ImageUpload } from '../../../../components/ImageUpload';
import { ImageGallery } from '../../../../components/ImageGallery';
import { ImageUploadService } from '../../../../lib/imageUpload';
import { EnhancedImageUploadService } from '../../../../lib/enhancedImageUpload';
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

import ModelSuggestionInput from '../../../shared/components/ui/ModelSuggestionInput';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../context/AuthContext';
import { retryWithBackoff } from '../../../../lib/supabaseClient';
import { getActiveBrands, Brand } from '../../../../lib/brandApi';

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
  condition: z.string().min(1, 'Product condition is required'),
  storeShelf: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  costPrice: z.number().min(0, 'Cost price must be 0 or greater'),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater'),
  minStockLevel: z.number().min(0, 'Minimum stock level must be 0 or greater'),
  maxStockLevel: z.number().min(0, 'Maximum stock level must be 0 or greater').optional(),
  weight: z.number().min(0, 'Weight must be 0 or greater').optional(),
  isActive: z.boolean().default(true),
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
    brands: storeBrands, 
    suppliers,
    createProduct,
    loadCategories,
    loadBrands,
    loadSuppliers,
    isLoading: storeLoading
  } = useInventoryStore();

  // Local state for brands to ensure they load properly
  const [localBrands, setLocalBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [variants, setVariants] = useState<any[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const { currentUser, refreshSession } = useAuth();
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
      condition: 'new',
      storeShelf: '',
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      maxStockLevel: 100,
      weight: 0,
      isActive: true,
      tags: [],
      images: [],
      metadata: {}
    }
  });

  // Watch specific form values for completion calculation
  const [name, sku, categoryId, condition, price, costPrice, stockQuantity, minStockLevel] = watch(['name', 'sku', 'categoryId', 'condition', 'price', 'costPrice', 'stockQuantity', 'minStockLevel']);
  
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
      condition ? 1 : 0,
      price >= 0 ? 1 : 0,
      costPrice >= 0 ? 1 : 0,
      stockQuantity >= 0 ? 1 : 0,
      minStockLevel >= 0 ? 1 : 0
    ];
    const percentage = Math.round((requiredFields.reduce((a, b) => a + b, 0) / requiredFields.length) * 100);
    setCompletionPercentage(percentage);
  }, [name, sku, categoryId, condition, price, costPrice, stockQuantity, minStockLevel]);

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadBrands();
      loadSuppliers();
      loadLocalBrands();
    }
  }, [isOpen, loadCategories, loadBrands, loadSuppliers]);

  // Load brands directly using brandApi
  const loadLocalBrands = async () => {
    setBrandsLoading(true);
    try {
      const brandsData = await getActiveBrands();
      setLocalBrands(brandsData);
      console.log('✅ Local brands loaded:', brandsData.length);
    } catch (error) {
      console.error('❌ Error loading local brands:', error);
      toast.error('Failed to load brands');
    } finally {
      setBrandsLoading(false);
    }
  };

  // Check for duplicate names
  const checkDuplicateName = async (productName: string) => {
    if (!productName || productName.trim().length < 3) {
      setNameExists(false);
      return;
    }

    setIsCheckingName(true);
    try {
      if (!currentUser) return;

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
      // Check network connectivity first
      if (!navigator.onLine) {
        console.log('📴 Network is offline');
        toast.error('No internet connection. Please check your network and try again.');
        return;
      }
      
      // Enhanced authentication check with session refresh
      console.log('🔐 Checking authentication status...');
      console.log('🔍 Current user from context:', currentUser);
      
      // Try to refresh the session first with retry mechanism
      let session, sessionError;
      try {
        const result = await retryWithBackoff(async () => {
          return await supabase.auth.getSession();
        });
        session = result.data.session;
        sessionError = result.error;
      } catch (error) {
        console.error('❌ Session check failed after retries:', error);
        sessionError = error;
      }
      
      console.log('🔍 Session check result:', { session: !!session, error: sessionError });
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        toast.error('Session error. Please try logging in again.');
        return;
      }
      
      // If no session, try to refresh
      if (!session) {
        console.log('🔄 No active session, attempting to refresh...');
        const refreshSuccess = await refreshSession();
        
        if (!refreshSuccess) {
          console.log('❌ Session refresh failed');
          toast.error('Authentication required. Please log in to create products.');
          return;
        }
        
        console.log('✅ Session refreshed successfully');
      }
      
      // Final authentication check
      if (!currentUser) {
        console.log('❌ No current user in context');
        toast.error('Authentication required. Please log in to create products.');
        return;
      }
      
      console.log('✅ Authentication verified for user:', currentUser.email);
      
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
        condition: data.condition,
        storeShelf: data.storeShelf || '',
        images: [], // Images will be uploaded after product creation
        tags: data.tags || [],
        isActive: data.isActive,
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
            // Try both services to ensure we catch all development mode images
            const updateResult = await ImageUploadService.updateProductImages(tempProductId, actualProductId);
            const enhancedUpdateResult = await EnhancedImageUploadService.updateProductImages(tempProductId, actualProductId);
            
            // Consider it successful if either service succeeds
            const success = updateResult.success || enhancedUpdateResult.success;
            const error = updateResult.error || enhancedUpdateResult.error;
            
            if (success) {
              console.log('✅ Successfully updated product images');
            } else {
              console.error('❌ Failed to update product images:', error);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Simple Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Product</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simple Form */}
        <div className="p-6">
          <form 
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            {/* Essential Fields */}
            <div className="space-y-4">
              {/* Product Name */}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block mb-1 font-medium text-sm text-gray-700">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-300' : nameExists ? 'border-orange-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., iPhone 15 Pro"
                      value={field.value}
                      onChange={field.onChange}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                    )}
                    {nameExists && !isCheckingName && (
                      <p className="text-orange-600 text-xs mt-1">Product name already exists</p>
                    )}
                  </div>
                )}
              />

              {/* Category */}
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block mb-1 font-medium text-sm text-gray-700">
                      Category *
                    </label>
                    <select
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.categoryId ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Price and Stock */}
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block mb-1 font-medium text-sm text-gray-700">
                        Price *
                      </label>
                      <input
                        type="number"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.price ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                      {errors.price && (
                        <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="stockQuantity"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block mb-1 font-medium text-sm text-gray-700">
                        Stock *
                      </label>
                      <input
                        type="number"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.stockQuantity ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="0"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        min="0"
                      />
                      {errors.stockQuantity && (
                        <p className="text-red-500 text-xs mt-1">{errors.stockQuantity.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

                             {/* SKU - Auto-generated */}
               <Controller
                 name="sku"
                 control={control}
                 render={({ field }) => (
                   <div>
                     <label className="block mb-1 font-medium text-sm text-gray-700">
                       SKU (Auto-generated)
                     </label>
                     <input
                       type="text"
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                       placeholder="Will be auto-generated"
                       value={field.value}
                       onChange={field.onChange}
                       readOnly
                     />
                     <p className="text-xs text-gray-500 mt-1">Based on product name and category</p>
                   </div>
                 )}
               />

               {/* Hidden barcode field */}
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

                              {/* Optional Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="brandId"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block mb-1 font-medium text-sm text-gray-700">Brand</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={field.value}
                          onChange={field.onChange}
                          disabled={brandsLoading}
                        >
                          <option value="">{brandsLoading ? 'Loading...' : 'Select brand'}</option>
                          {localBrands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  />

                  <Controller
                    name="condition"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block mb-1 font-medium text-sm text-gray-700">Condition</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="new">New</option>
                          <option value="like_new">Like New</option>
                          <option value="excellent">Excellent</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                          <option value="refurbished">Refurbished</option>
                          <option value="used">Used</option>
                        </select>
                      </div>
                    )}
                  />
                </div>

                {/* Description */}
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block mb-1 font-medium text-sm text-gray-700">Description</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Brief product description..."
                        rows={3}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                  )}
                />
              </div>
          </form>
        </div>

        {/* Simple Form Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={!isDirty || nameExists || isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
