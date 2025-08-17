import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import Modal from '../../../shared/components/ui/Modal';
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { toast } from 'react-hot-toast';
import { 
  Package, Tag, DollarSign, Hash, FileText, Layers, 
  AlertTriangle as AlertIcon, Eye, Edit, MessageCircle, 
  Users, Star, UserPlus, Save, X, Camera,
  Upload, Image as ImageIcon, Trash2, CheckCircle, RefreshCw, Plus, QrCode
} from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';

import ModelSuggestionInput from '../../../shared/components/ui/ModelSuggestionInput';
import { ImageUpload } from '../../../../components/ImageUpload';
import { ImageGallery } from '../../../../components/ImageGallery';
import { ImageUploadService } from '../../../../lib/imageUpload';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../context/AuthContext';

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
  weight: z.number().min(0, 'Weight must be 0 or greater').optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(ProductImageSchema).default([]),
  variants: z.array(z.any()).optional().default([])
});

type ProductFormData = z.infer<typeof productFormSchema>;
type ProductImage = z.infer<typeof ProductImageSchema>;

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onProductUpdated?: (product: any) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  productId,
  onProductUpdated
}) => {
  const { 
    categories, 
    brands, 
    suppliers,
    updateProduct,
    loadCategories,
    loadBrands,
    loadSuppliers,
    getProduct
  } = useInventoryStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [variants, setVariants] = useState<any[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const { currentUser } = useAuth();
  const [originalProduct, setOriginalProduct] = useState<any>(null);
  const [productImages, setProductImages] = useState<string[]>([]);

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
      weight: 0,
      tags: [],
      images: [],
      variants: []
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

  // Load product data when modal opens
  useEffect(() => {
    if (isOpen && productId) {
      loadProductData();
    }
  }, [isOpen, productId]);

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadBrands();
      loadSuppliers();
      

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
        .neq('id', productId) // Exclude current product when editing
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

  // Load product images
  const loadProductImages = async () => {
    try {
      const { data: images } = await supabase
        .from('lats_product_images')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });
      
      if (images) {
        const imageUrls = images.map(img => img.url);
        setProductImages(imageUrls);
      }
    } catch (error) {
      console.error('Failed to load product images:', error);
      setProductImages([]);
    }
  };

  // Load product data
  const loadProductData = async () => {
    setIsLoading(true);
    try {
      const result = await getProduct(productId);
      if (result && result.data) {
        const product = result.data as any; // Type assertion for now
        setOriginalProduct(product);
        
        // Set form values
        reset({
          name: product.name || '',
          description: product.description || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          categoryId: product.categoryId || '',
          brandId: product.brandId || '',
          supplierId: product.supplierId || '',
          price: product.price || 0,
          costPrice: product.costPrice || 0,
          stockQuantity: product.stockQuantity || 0,
          minStockLevel: product.minStockLevel || 5,
          weight: product.weight || 0,
          condition: product.condition || 'new',
          storeShelf: product.storeShelf || '',
          tags: product.tags || [],
          images: [], // Images will be loaded separately by ImageUpload component
          variants: product.variants || []
        });

        // Set variants - match AddProductModal structure
        if (product.variants && product.variants.length > 0) {
          setVariants(product.variants.map((variant: any) => ({
            id: variant.id || '',
            sku: variant.sku || '',
            name: variant.name || 'Variant',
            barcode: variant.barcode || '',
            price: variant.price || variant.sellingPrice || 0,
            costPrice: variant.costPrice || 0,
            stockQuantity: variant.stockQuantity || variant.quantity || 0,
            minStockLevel: variant.minStockLevel || variant.minQuantity || 5,
            weight: variant.weight || 0,
            attributes: variant.attributes || {},
            isActive: variant.isActive ?? true
          })));
        } else {
          // No variants exist - leave empty array
          setVariants([]);
        }
      } else {
        toast.error('Failed to load product data');
        onClose();
      }
    } catch (error: any) {
      toast.error(`Error loading product: ${error.message}`);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    console.log('🚀 Form submission started with data:', data);
    
    // Check for duplicate name (excluding current product)
    if (nameExists) {
      toast.error('Please choose a different product name. A product with this name already exists.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get current user for image uploads
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Authentication required. Please log in to update products.');
        return;
      }
      
      // Store images for upload after product update
      const imagesToUpload = data.images || [];
      
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
        images: data.images || [], // Include existing images from form
        tags: data.tags || [],
        condition: data.condition,
        storeShelf: data.storeShelf || '',
        variants: normalizedVariants.map(variant => ({
          id: variant.id, // Preserve existing variant IDs
          sku: variant.sku || `${data.sku}-${variant.name}`,
          name: variant.name,
          barcode: variant.barcode || '',
          price: variant.price,
          costPrice: variant.costPrice,
          stockQuantity: variant.stockQuantity,
          minStockLevel: variant.minStockLevel,
          weight: variant.weight,
          attributes: variant.attributes || {},
          isActive: variant.isActive
        })),
        metadata: data.metadata || {}
      };

      console.log('📤 About to call updateProduct with data:', formData);
      const result = await updateProduct(productId, formData);
      console.log('📥 updateProduct result:', result);
      
      if (result.ok) {
        toast.success('Product updated successfully!');
        onProductUpdated?.(result.data);
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
          toast.error(result.message || 'Failed to update product');
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

  // Automatic SKU/Barcode generation - match AddProductModal
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

  // Variant management functions - using AddProductModal logic
  const addVariant = () => {
    setVariants(prev => [...prev, {
      sku: '',
      name: `Variant ${prev.length + 1}`,
      barcode: '',
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 5,
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

  if (isLoading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Product"
        maxWidth="2xl"
        maxHeight="90vh"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="mx-auto h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading product data...</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="4xl"
      maxHeight="95vh"
    >
      <form 
        onSubmit={handleSubmit(handleFormSubmit)} 
        className="space-y-8"
      >
        {/* Modern Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
              <p className="text-gray-600">Update product information and settings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">Completion</div>
              <div className="text-lg font-bold text-blue-600">{completionPercentage}%</div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray={`${completionPercentage}, 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Basic Information - Redesigned */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Name - Full Width */}
            <div className="lg:col-span-2">
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
                        className={`w-full py-4 pl-12 pr-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200 ${
                          errors.name ? 'border-red-500 focus:border-red-600 shadow-red-100' : 
                          nameExists ? 'border-orange-500 focus:border-orange-600 shadow-orange-100' :
                          'border-gray-300 focus:border-blue-500 shadow-blue-100 focus:shadow-lg'
                        }`}
                        placeholder="Enter product name"
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                      {isCheckingName && (
                        <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={20} />
                      )}
                      {nameExists && !isCheckingName && (
                        <AlertIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                      )}
                    </div>
                    {errors.name && (
                      <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                        <AlertIcon size={16} />
                        {errors.name.message}
                      </div>
                    )}
                    {nameExists && !isCheckingName && (
                      <div className="text-orange-600 text-sm mt-2 flex items-center gap-2">
                        <AlertIcon size={16} />
                        A product with this name already exists
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
                    className={`w-full py-4 px-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200 ${
                      errors.categoryId ? 'border-red-500 focus:border-red-600 shadow-red-100' : 'border-gray-300 focus:border-blue-500 shadow-blue-100 focus:shadow-lg'
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
                    <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                      <AlertIcon size={16} />
                      {errors.categoryId.message}
                    </div>
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
                    className="w-full py-4 px-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200 border-gray-300 focus:border-blue-500 shadow-blue-100 focus:shadow-lg"
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

            {/* Supplier */}
            <Controller
              name="supplierId"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block mb-3 font-semibold text-lg text-gray-800">Supplier</label>
                  <select
                    className="w-full py-4 px-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200 border-gray-300 focus:border-blue-500 shadow-blue-100 focus:shadow-lg"
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

            {/* SKU */}
            <Controller
              name="sku"
              control={control}
              render={({ field }) => (
                <div>
                  <label className={`block mb-3 font-semibold text-lg ${errors.sku ? 'text-red-600' : 'text-gray-800'}`}>
                    SKU *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`w-full py-4 pl-12 pr-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200 ${
                        errors.sku ? 'border-red-500 focus:border-red-600 shadow-red-100' : 'border-gray-300 focus:border-blue-500 shadow-blue-100 focus:shadow-lg'
                      }`}
                      placeholder="Enter SKU"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setValue('barcode', e.target.value);
                      }}
                    />
                    <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  </div>
                  {errors.sku && (
                    <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                      <AlertIcon size={16} />
                      {errors.sku.message}
                    </div>
                  )}
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
          </div>

          {/* Description */}
          <div>
            <label className="block mb-3 font-semibold text-lg text-gray-800">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  className="w-full py-4 px-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200 border-gray-300 focus:border-blue-500 shadow-blue-100 focus:shadow-lg resize-none"
                  placeholder="Enter product description..."
                  rows={3}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Product Condition */}
          <Controller
            name="condition"
            control={control}
            render={({ field }) => (
              <div>
                <label className={`block mb-3 font-semibold text-lg ${errors.condition ? 'text-red-600' : 'text-gray-800'}`}>
                  Product Condition *
                </label>
                <select
                  className={`w-full py-4 px-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200 ${
                    errors.condition ? 'border-red-500 focus:border-red-600 shadow-red-100' : 'border-gray-300 focus:border-blue-500 shadow-blue-100 focus:shadow-lg'
                  }`}
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
                {errors.condition && (
                  <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <AlertIcon size={16} />
                    {errors.condition.message}
                  </div>
                )}
              </div>
            )}
          />

          {/* Store Shelf */}
          <Controller
            name="storeShelf"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block mb-3 font-semibold text-lg text-gray-800">Store Shelf</label>
                <input
                  type="text"
                  className="w-full py-4 px-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200 border-gray-300 focus:border-blue-500 shadow-blue-100 focus:shadow-lg"
                  placeholder="e.g., A1, B2, Shelf 3, etc."
                  value={field.value}
                  onChange={field.onChange}
                />
              </div>
            )}
          />
        </div>

        {/* Pricing & Stock */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Pricing & Stock</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Price */}
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <div>
                  <label className={`block mb-3 font-semibold text-lg ${errors.price ? 'text-red-600' : 'text-gray-800'}`}>
                    Selling Price *
                  </label>
                  <div className="relative">
                    <PriceInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className="w-full py-4 pl-12 pr-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200"
                    />
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  </div>
                  {errors.price && (
                    <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                      <AlertIcon size={16} />
                      {errors.price.message}
                    </div>
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
                      className="w-full py-4 pl-12 pr-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200"
                    />
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  </div>
                  {errors.costPrice && (
                    <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                      <AlertIcon size={16} />
                      {errors.costPrice.message}
                    </div>
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
                  <input
                    type="number"
                    min="0"
                    className="w-full py-4 px-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200"
                    placeholder="0"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                  {errors.stockQuantity && (
                    <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                      <AlertIcon size={16} />
                      {errors.stockQuantity.message}
                    </div>
                  )}
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Min Stock Level */}
            <Controller
              name="minStockLevel"
              control={control}
              render={({ field }) => (
                <div>
                  <label className={`block mb-3 font-semibold text-lg ${errors.minStockLevel ? 'text-red-600' : 'text-gray-800'}`}>
                    Min Stock Level *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full py-4 px-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200"
                    placeholder="5"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                  {errors.minStockLevel && (
                    <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                      <AlertIcon size={16} />
                      {errors.minStockLevel.message}
                    </div>
                  )}
                </div>
              )}
            />

            {/* Weight */}
            <Controller
              name="weight"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block mb-3 font-semibold text-lg text-gray-800">Weight</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full py-4 px-4 bg-white/80 backdrop-blur-md border-2 rounded-xl focus:outline-none text-lg font-medium transition-all duration-200 border-gray-300 focus:border-blue-500 shadow-blue-100 focus:shadow-lg"
                    placeholder="0"
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            />
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ImageIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Product Images</h3>
          </div>
          
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Product Images</label>
                               <ImageUpload
                     productId={productId}
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
              productId={productId}
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

        {/* Product Variants */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Product Variants</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Manage product variants (colors, sizes, etc.)
              </p>
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors duration-200"
              >
                <Plus size={16} />
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
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors duration-200"
                  >
                    <Plus size={16} />
                    Add Variant
                  </button>
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
                          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium transition-all duration-200"
                          placeholder="e.g., Red, Large, etc."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Variant SKU</label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium transition-all duration-200"
                          placeholder="e.g., PROD-RED-L"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium transition-all duration-200"
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
                          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium transition-all duration-200"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Status */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Product Status</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-2 rounded-xl shadow-md">
                  <div>
                    <label className="text-base font-medium text-gray-800">Active</label>
                    <p className="text-sm text-gray-600">Product will be visible to customers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    <div className={`w-14 h-7 rounded-full transition-colors ${
                      field.value ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        field.value ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                </div>
              )}
            />
          </div>
        </div>

        {/* Form Actions - Redesigned */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Save className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Save Changes</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <GlassButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!isDirty || nameExists}
              className="flex-1 sm:flex-none px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Updating Product...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Save className="w-5 h-5" />
                  <span>Update Product</span>
                </div>
              )}
            </GlassButton>
            
            <GlassButton
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-8 py-4 text-lg font-semibold bg-white/80 backdrop-blur-md border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </div>
            </GlassButton>
          </div>
          
          {/* Form Status */}
          <div className="mt-6 p-4 bg-white/60 backdrop-blur-md rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isDirty ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {isDirty ? 'Changes detected' : 'No changes made'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {Object.keys(errors).length > 0 ? (
                  <span className="text-red-600 font-medium">
                    {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''} found
                  </span>
                ) : (
                  <span className="text-green-600 font-medium">Form is valid</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditProductModal;
