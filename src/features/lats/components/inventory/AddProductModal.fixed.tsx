import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { 
  Package, Tag, DollarSign, Hash, FileText, Layers, 
  AlertTriangle as AlertIcon, Eye, Edit, MessageCircle, 
  Users, Star, UserPlus, Plus, X, Save, Camera,
  Upload, Image as ImageIcon, Trash2, CheckCircle,
  RefreshCw, QrCode
} from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../context/AuthContext';
import { retryWithBackoff } from '../../../../lib/supabaseClient';
import { getActiveBrands, Brand } from '../../../../lib/brandApi';

// Simplified validation schema
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
  metadata: z.record(z.string()).optional()
});

type ProductFormData = z.infer<typeof productFormSchema>;

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
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const { currentUser, refreshSession } = useAuth();

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
      metadata: {}
    }
  });

  // Watch specific form values for completion calculation
  const [name, sku, categoryId, condition, price, costPrice, stockQuantity, minStockLevel] = watch(['name', 'sku', 'categoryId', 'condition', 'price', 'costPrice', 'stockQuantity', 'minStockLevel']);
  
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
  const handleFormSubmit = async (data: ProductFormData) => {
    console.log('🚀 Form submission started with data:', data);
    
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
      
      // Transform form data to match LATS ProductFormData structure
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
        images: [], // No images for now
        tags: data.tags || [],
        isActive: data.isActive,
        variants: [{
          sku: `${data.sku}-VARIANT`,
          name: 'Default Variant',
          barcode: '',
          price: data.price || 0,
          costPrice: data.costPrice || 0,
          stockQuantity: data.stockQuantity || 0,
          minStockLevel: data.minStockLevel || 5,
          maxStockLevel: data.maxStockLevel || 100,
          weight: data.weight || 0,
          attributes: {},
          isActive: true
        }],
        metadata: data.metadata || {}
      };

      console.log('📤 About to call createProduct with data:', formData);
      const result = await createProduct(formData);
      console.log('📥 createProduct result:', result);
      
      if (result.ok) {
        toast.success('Product created successfully!');
        reset();
        onProductCreated?.(result.data);
        onClose();
      } else {
        toast.error(result.message || 'Failed to create product');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Product</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
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

              {/* SKU */}
              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block mb-1 font-medium text-sm text-gray-700">
                      SKU *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.sku ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., IPH15P-128"
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <button
                        type="button"
                        onClick={generateAutoSKU}
                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Auto
                      </button>
                      <button
                        type="button"
                        onClick={clearSKUAndBarcode}
                        className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                    {errors.sku && (
                      <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>
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
                      <option value="">Select a category</option>
                      {categories.map(category => (
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

              {/* Price */}
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block mb-1 font-medium text-sm text-gray-700">
                      Selling Price (TZS) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.price ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                    {errors.price && (
                      <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
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
                    <label className="block mb-1 font-medium text-sm text-gray-700">
                      Cost Price (TZS) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.costPrice ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                    {errors.costPrice && (
                      <p className="text-red-500 text-xs mt-1">{errors.costPrice.message}</p>
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
                    <label className="block mb-1 font-medium text-sm text-gray-700">
                      Initial Stock Quantity *
                    </label>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.stockQuantity ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                    {errors.stockQuantity && (
                      <p className="text-red-500 text-xs mt-1">{errors.stockQuantity.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || storeLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
