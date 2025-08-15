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
import BrandSuggestionInput from '../../../shared/components/ui/BrandSuggestionInput';
import ModelSuggestionInput from '../../../shared/components/ui/ModelSuggestionInput';
import { ImageUpload } from '../../../../components/ImageUpload';
import { ImageGallery } from '../../../../components/ImageGallery';
import { ImageUploadService } from '../../../../lib/imageUpload';
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
  metadata: z.record(z.string(), z.string()).optional(),
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
  const [user, setUser] = useState<any>(null);
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
      metadata: {},
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
          maxStockLevel: product.maxStockLevel || 100,
          weight: product.weight || 0,
          isActive: product.isActive ?? true,
          isFeatured: product.isFeatured ?? false,
          isDigital: product.isDigital ?? false,
          requiresShipping: product.requiresShipping ?? true,
          taxRate: product.taxRate || 0,
          tags: product.tags || [],
          images: [], // Images will be loaded separately by ImageUpload component
          metadata: product.metadata || {},
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
            maxStockLevel: variant.maxStockLevel || variant.maxQuantity || 100,
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
        images: data.images || [], // Include existing images from form
        tags: data.tags || [],
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        isDigital: data.isDigital,
        requiresShipping: data.requiresShipping,
        taxRate: data.taxRate,
        // Use normalized variants with proper ID handling
        variants: normalizedVariants.map(variant => ({
          id: variant.id, // Preserve existing variant IDs
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
      title="Edit Product"
      maxWidth="2xl"
      maxHeight="90vh"
    >
      <form 
        onSubmit={handleSubmit(handleFormSubmit)} 
        className="space-y-6"
      >
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name - Full Width */}
            <div className="md:col-span-2">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className={`block mb-2 font-medium ${errors.name ? 'text-red-600' : 'text-gray-700'}`}>
                      Product Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className={`w-full py-3 pl-10 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
                          errors.name ? 'border-red-500 focus:border-red-600' : 
                          nameExists ? 'border-orange-500 focus:border-orange-600' :
                          'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="Enter product name"
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      {isCheckingName && (
                        <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={16} />
                      )}
                      {nameExists && !isCheckingName && (
                        <AlertIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500" size={16} />
                      )}
                    </div>
                    {errors.name && (
                      <div className="text-red-500 text-xs mt-1">{errors.name.message}</div>
                    )}
                    {nameExists && !isCheckingName && (
                      <div className="text-orange-600 text-xs mt-1">
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
                  <label className={`block mb-2 font-medium ${errors.categoryId ? 'text-red-600' : 'text-gray-700'}`}>
                    Category *
                  </label>
                  <select
                    className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
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
                  <label className="block mb-2 font-medium text-gray-700">Brand</label>
                  <select
                    className="w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
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
                  <label className="block mb-2 font-medium text-gray-700">Supplier</label>
                  <select
                    className="w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
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
                  <label className={`block mb-2 font-medium ${errors.sku ? 'text-red-600' : 'text-gray-700'}`}>
                    SKU *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`w-full py-3 pl-10 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
                        errors.sku ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="Enter SKU"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setValue('barcode', e.target.value);
                      }}
                    />
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  </div>
                  {errors.sku && (
                    <div className="text-red-500 text-xs mt-1">{errors.sku.message}</div>
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
            <label className="block mb-2 font-medium text-gray-700">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  className="w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Enter product description..."
                  rows={3}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Pricing & Stock</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price */}
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <div>
                  <label className={`block mb-2 font-medium ${errors.price ? 'text-red-600' : 'text-gray-700'}`}>
                    Selling Price *
                  </label>
                  <div className="relative">
                    <PriceInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className="w-full py-3 pl-8 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none"
                    />
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
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
                  <label className={`block mb-2 font-medium ${errors.costPrice ? 'text-red-600' : 'text-gray-700'}`}>
                    Cost Price *
                  </label>
                  <div className="relative">
                    <PriceInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className="w-full py-3 pl-8 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none"
                    />
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
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
                  <label className={`block mb-2 font-medium ${errors.stockQuantity ? 'text-red-600' : 'text-gray-700'}`}>
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
                      errors.stockQuantity ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="0"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                  {errors.stockQuantity && (
                    <div className="text-red-500 text-xs mt-1">{errors.stockQuantity.message}</div>
                  )}
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Min Stock Level */}
            <Controller
              name="minStockLevel"
              control={control}
              render={({ field }) => (
                <div>
                  <label className={`block mb-2 font-medium ${errors.minStockLevel ? 'text-red-600' : 'text-gray-700'}`}>
                    Min Stock Level *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
                      errors.minStockLevel ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="5"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                  {errors.minStockLevel && (
                    <div className="text-red-500 text-xs mt-1">{errors.minStockLevel.message}</div>
                  )}
                </div>
              )}
            />

            {/* Max Stock Level */}
            <Controller
              name="maxStockLevel"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Max Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="100"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}
            />
          </div>
        </div>

        {/* Product Images */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Product Images</h3>
          
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Product Images</label>
            <ImageUpload
              productId={productId}
              userId={user?.id || ''}
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
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
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
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
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
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Product Status</h3>
          
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
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <GlassButton
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!isDirty || nameExists}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? 'Updating...' : 'Update Product'}
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
    </Modal>
  );
};

export default EditProductModal;
