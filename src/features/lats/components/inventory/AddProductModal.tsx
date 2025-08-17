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
import BrandSuggestionInput from '../../../shared/components/ui/BrandSuggestionInput';
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
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
              <p className="text-sm text-gray-500">Create a new product in your inventory</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Debug Authentication Status - Only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertIcon className="w-4 h-4 text-yellow-600" />
              <span className="font-semibold text-yellow-800 text-sm">Debug: Authentication Status</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-yellow-700">
              <div>User: {currentUser ? currentUser.email : 'None'}</div>
              <div>Network: {navigator.onLine ? '🟢 Online' : '🔴 Offline'}</div>
              <div>Session: {currentUser ? '🟢 Active' : '🔴 Inactive'}</div>
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">
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
            className="p-6 space-y-8"
          >
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-3 h-3 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>
              
              <div className="space-y-6">
                {/* Product Name - Full Width */}
                <div>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className={`block mb-2 font-medium text-sm ${errors.name ? 'text-red-600' : 'text-gray-700'}`}>
                          Product Name *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            className={`w-full py-3 pl-10 pr-4 bg-white border rounded-lg focus:outline-none text-sm transition-all duration-200 ${
                              errors.name ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 
                              nameExists ? 'border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200' :
                              'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                            placeholder="Enter product name"
                            value={field.value}
                            onChange={field.onChange}
                            aria-describedby={errors.name ? 'name-error' : nameExists ? 'name-exists' : undefined}
                          />
                          <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          {isCheckingName && (
                            <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={16} />
                          )}
                          {nameExists && !isCheckingName && (
                            <AlertIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500" size={16} />
                          )}
                        </div>
                        {errors.name && (
                          <div id="name-error" className="text-red-500 text-sm mt-2 flex items-center gap-2">
                            <AlertIcon size={14} />
                            {errors.name.message}
                          </div>
                        )}
                        {nameExists && !isCheckingName && (
                          <div id="name-exists" className="text-orange-600 text-sm mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertIcon size={14} />
                              <span className="font-medium">A product with this name already exists</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const currentName = getValues('name');
                                const suggestedName = `${currentName} (${Date.now().toString().slice(-4)})`;
                                setValue('name', suggestedName);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm underline font-medium"
                            >
                              Suggest alternative name
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Category, Brand, Condition Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className={`block mb-2 font-medium text-sm ${errors.categoryId ? 'text-red-600' : 'text-gray-700'}`}>
                          Category *
                        </label>
                        <select
                          className={`w-full py-3 px-3 bg-white border rounded-lg focus:outline-none text-sm transition-all duration-200 ${
                            errors.categoryId ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                          value={field.value}
                          onChange={field.onChange}
                          aria-describedby={errors.categoryId ? 'category-error' : undefined}
                        >
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        {errors.categoryId && (
                          <div id="category-error" className="text-red-500 text-sm mt-2 flex items-center gap-2">
                            <AlertIcon size={14} />
                            {errors.categoryId.message}
                          </div>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="brandId"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block mb-2 font-medium text-sm text-gray-700">Brand</label>
                        <select
                          className="w-full py-3 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm transition-all duration-200"
                          value={field.value}
                          onChange={field.onChange}
                          disabled={brandsLoading}
                        >
                          <option value="">{brandsLoading ? 'Loading brands...' : 'Select brand'}</option>
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
                        <label className={`block mb-2 font-medium text-sm ${errors.condition ? 'text-red-600' : 'text-gray-700'}`}>
                          Condition *
                        </label>
                        <select
                          className={`w-full py-3 px-3 bg-white border rounded-lg focus:outline-none text-sm transition-all duration-200 ${
                            errors.condition ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                          value={field.value}
                          onChange={field.onChange}
                          aria-describedby={errors.condition ? 'condition-error' : undefined}
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
                        {errors.condition && (
                          <div id="condition-error" className="text-red-500 text-sm mt-2 flex items-center gap-2">
                            <AlertIcon size={14} />
                            {errors.condition.message}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Store Shelf and Supplier Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="storeShelf"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block mb-2 font-medium text-sm text-gray-700">Store Shelf</label>
                        <input
                          type="text"
                          className="w-full py-3 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm transition-all duration-200"
                          placeholder="e.g., A1, B2, Shelf 3"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </div>
                    )}
                  />

                  <Controller
                    name="supplierId"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block mb-2 font-medium text-sm text-gray-700">Supplier</label>
                        <select
                          className="w-full py-3 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm transition-all duration-200"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="">Select supplier</option>
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

                {/* SKU & Barcode - Hidden when variants are enabled */}
                {!showVariants && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                      <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center">
                        <QrCode className="w-2.5 h-2.5 text-green-600" />
                      </div>
                      <h4 className="text-base font-semibold text-gray-900">SKU & Barcode</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name="sku"
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className={`block mb-2 font-medium text-sm ${errors.sku ? 'text-red-600' : 'text-gray-700'}`}>
                              SKU/Barcode *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                className={`w-full py-3 pl-10 pr-3 bg-white border rounded-lg focus:outline-none text-sm transition-all duration-200 ${
                                  errors.sku ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                }`}
                                placeholder="Enter SKU, barcode, serial number, or IMEI"
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  setValue('barcode', e.target.value);
                                }}
                                onClick={() => {
                                  if (field.value) {
                                    clearSKUAndBarcode();
                                  }
                                }}
                                aria-describedby={errors.sku ? 'sku-error' : 'sku-help'}
                              />
                              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                            <p id="sku-help" className="text-xs text-gray-500 mt-2">
                              Auto-generated from product name and category. Click to clear and enter manually.
                            </p>
                            {errors.sku && (
                              <div id="sku-error" className="text-red-500 text-sm mt-2 flex items-center gap-2">
                                <AlertIcon size={14} />
                                {errors.sku.message}
                              </div>
                            )}
                          </div>
                        )}
                      />

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
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <div className="w-5 h-5 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-2.5 h-2.5 text-purple-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900">Description</h4>
                  </div>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block mb-2 font-medium text-sm text-gray-700">Product Description</label>
                        <textarea
                          className="w-full py-3 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none text-sm transition-all duration-200"
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
            </div>

            {/* Pricing & Stock Section - Hidden when variants are enabled */}
            {!showVariants && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-3 h-3 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Pricing & Stock</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className={`block mb-2 font-medium text-sm ${errors.price ? 'text-red-600' : 'text-gray-700'}`}>
                          Selling Price *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            className={`w-full py-3 pl-10 pr-3 bg-white border rounded-lg focus:outline-none text-sm transition-all duration-200 ${
                              errors.price ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                            placeholder="0.00"
                            value={field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            aria-describedby={errors.price ? 'price-error' : undefined}
                          />
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                        {errors.price && (
                          <div id="price-error" className="text-red-500 text-sm mt-2 flex items-center gap-2">
                            <AlertIcon size={14} />
                            {errors.price.message}
                          </div>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="costPrice"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className={`block mb-2 font-medium text-sm ${errors.costPrice ? 'text-red-600' : 'text-gray-700'}`}>
                          Cost Price *
                        </label>
                        <div className="relative">
                          <PriceInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="0"
                            className={`w-full py-3 pl-10 pr-3 bg-white border rounded-lg focus:outline-none text-sm transition-all duration-200 ${
                              errors.costPrice ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                          />
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                        {errors.costPrice && (
                          <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                            <AlertIcon size={14} />
                            {errors.costPrice.message}
                          </div>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="stockQuantity"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className={`block mb-2 font-medium text-sm ${errors.stockQuantity ? 'text-red-600' : 'text-gray-700'}`}>
                          Stock Quantity *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            className={`w-full py-3 pl-10 pr-16 bg-white border rounded-lg focus:outline-none text-sm transition-all duration-200 ${
                              errors.stockQuantity ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                            placeholder="0"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            min="0"
                            aria-describedby={errors.stockQuantity ? 'stock-error' : undefined}
                          />
                          <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => field.onChange(Math.max(0, (field.value || 0) - 1))}
                              className="w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xs font-bold transition-colors"
                              aria-label="Decrease stock quantity"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange((field.value || 0) + 1)}
                              className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold transition-colors"
                              aria-label="Increase stock quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {errors.stockQuantity && (
                          <div id="stock-error" className="text-red-500 text-sm mt-2 flex items-center gap-2">
                            <AlertIcon size={14} />
                            {errors.stockQuantity.message}
                          </div>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="minStockLevel"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className={`block mb-2 font-medium text-sm ${errors.minStockLevel ? 'text-red-600' : 'text-gray-700'}`}>
                          Min Stock Level *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            className={`w-full py-3 px-3 pr-16 bg-white border rounded-lg focus:outline-none text-sm transition-all duration-200 ${
                              errors.minStockLevel ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                            placeholder="5"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            min="0"
                            aria-describedby={errors.minStockLevel ? 'min-stock-error' : undefined}
                          />
                          
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => field.onChange(Math.max(0, (field.value || 0) - 1))}
                              className="w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xs font-bold transition-colors"
                              aria-label="Decrease minimum stock level"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange((field.value || 0) + 1)}
                              className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold transition-colors"
                              aria-label="Increase minimum stock level"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {errors.minStockLevel && (
                          <div id="min-stock-error" className="text-red-500 text-sm mt-2 flex items-center gap-2">
                            <AlertIcon size={14} />
                            {errors.minStockLevel.message}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Product Images Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-3 h-3 text-pink-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    Product Images
                  </label>
                  
                  <ImageUpload
                    productId={tempProductId}
                    userId={currentUser?.id || ''}
                    onUploadComplete={(images) => {
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
                    onUploadError={(error) => {
                      toast.error(`Upload failed: ${error}`);
                    }}
                    maxFiles={5}
                  />
                  
                  <ImageGallery
                    productId={tempProductId}
                    onImagesChange={(images) => {
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

            {/* Product Variants Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Layers className="w-3 h-3 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!showVariants) {
                      if (variants.length === 0) {
                        addVariant();
                      }
                    }
                    setShowVariants(!showVariants);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm"
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
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Plus size={16} />
                      Add Variant
                    </button>
                  </div>
                  
                  {variants.map((variant, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 text-sm">Variant {index + 1}</h4>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            aria-label="Remove variant"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Variant Name</label>
                          <input
                            type="text"
                            value={variant.name}
                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-sm"
                            placeholder="e.g., Red, Large, etc."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Variant SKU</label>
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-sm"
                            placeholder="e.g., PROD-RED-L"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                          <input
                            type="number"
                            value={variant.stockQuantity}
                            onChange={(e) => updateVariant(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-sm"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Status Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Product Status</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Active</label>
                        <p className="text-sm text-gray-500 mt-1">Product will be visible to customers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                          field.value ? 'bg-blue-600' : 'bg-gray-300'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                            field.value ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </div>
                      </label>
                    </div>
                  )}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="submit"
            disabled={!isDirty || nameExists || isSubmitting}
            onClick={() => {
              console.log('🔘 Submit button clicked');
              console.log('🔍 Button state:', {
                isDirty,
                nameExists,
                isSubmitting,
                disabled: !isDirty
              });
              handleSubmit(handleFormSubmit)();
            }}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating...
              </div>
            ) : (
              'Create Product'
            )}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
