import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../../shared/components/ui/Modal';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { toast } from 'react-hot-toast';
import { 
  Package, Tag, DollarSign, Hash, FileText, Layers, 
  AlertTriangle as AlertIcon, Eye, Edit, MessageCircle, 
  Users, Star, UserPlus, Save, X, Camera,
  Upload, Image as ImageIcon, Trash2, CheckCircle, RefreshCw, Plus
} from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { ImageUpload } from '../../../../components/ImageUpload';
import { ImageGallery } from '../../../../components/ImageGallery';
import { ImageUploadService } from '../../../../lib/imageUpload';
import { supabase } from '../../../../lib/supabaseClient';

  // Validation schema for product form - using AddProductModal as base
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
    images: z.array(z.string()).default([]),
    metadata: z.record(z.string()).optional(),
    variants: z.array(z.any()).optional().default([])
  });

type ProductFormData = z.infer<typeof productFormSchema>;

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
  const [productImages, setProductImages] = useState<string[]>([]);
  const [originalProduct, setOriginalProduct] = useState<any>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [variants, setVariants] = useState<any[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset
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

  // Calculate form completion percentage - using AddProductModal logic
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
  }, [isOpen]);

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
          images: product.images || [],
          metadata: product.metadata || {},
          variants: product.variants || []
        });

        // Load product images from Supabase
        await loadProductImages();
        
        // Set variants
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

  // Load product images from Supabase
  const loadProductImages = async () => {
    try {
      const images = await ImageUploadService.getProductImages(productId);
      const imageUrls = images.map(img => img.url);
      setProductImages(imageUrls);
    } catch (error) {
      console.error('Failed to load product images:', error);
      setProductImages([]);
    }
  };

  // Remove image from local state
  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleFormSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      // Transform form data to match LATS ProductFormData structure - using AddProductModal as base
      const formData = {
        name: data.name,
        description: data.description || '',
        sku: data.sku,
        barcode: data.barcode || '',
        categoryId: data.categoryId,
        brandId: data.brandId || '',
        supplierId: data.supplierId || '',
        images: productImages.map((image, index) => ({
          image_url: image,
          thumbnail_url: image,
          file_name: `product_image_${index + 1}.jpg`,
          file_size: 0,
          is_primary: index === 0
        })),
        tags: data.tags || [],
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        isDigital: data.isDigital,
        requiresShipping: data.requiresShipping,
        taxRate: data.taxRate,
        // Use normalized variants like AddProductModal
        variants: variants.length > 0 ? variants.map(variant => ({
          id: variant.id, // Keep existing ID for updates
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
        })) : [{
          // Create a basic variant from main form data if no variants are provided (like AddProductModal)
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
        }],
        metadata: data.metadata || {}
      };

      const result = await updateProduct(productId, formData);
      
      if (result.ok) {
        toast.success('Product updated successfully!');
        onProductUpdated?.(result.data);
        onClose();
      } else {
        toast.error(result.message || 'Failed to update product');
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
        setProductImages(originalProduct?.images || []);
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setProductImages(prev => [...prev, ...newImages]);
    }
  };



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

  // Reset to original values
  const handleReset = () => {
    if (originalProduct) {
      reset({
        name: originalProduct.name || '',
        description: originalProduct.description || '',
        sku: originalProduct.sku || '',
        barcode: originalProduct.barcode || '',
        categoryId: originalProduct.categoryId || '',
        brandId: originalProduct.brandId || '',
        supplierId: originalProduct.supplierId || '',
        price: originalProduct.price || 0,
        costPrice: originalProduct.costPrice || 0,
        stockQuantity: originalProduct.stockQuantity || 0,
        minStockLevel: originalProduct.minStockLevel || 5,
        maxStockLevel: originalProduct.maxStockLevel || 100,
        weight: originalProduct.weight || 0,
        isActive: originalProduct.isActive ?? true,
        isFeatured: originalProduct.isFeatured ?? false,
        isDigital: originalProduct.isDigital ?? false,
        requiresShipping: originalProduct.requiresShipping ?? true,
        taxRate: originalProduct.taxRate || 0,
        tags: originalProduct.tags || [],
        images: originalProduct.images || [],
        metadata: originalProduct.metadata || {},
        variants: originalProduct.variants || []
      });
      setProductImages(originalProduct.images || []);
      toast.success('Form reset to original values');
    }
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
      onClose={handleCancel}
      title="Edit Product"
      maxWidth="2xl"
      maxHeight="90vh"
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-900">Form Progress</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {completionPercentage}% Complete
              </span>
              {isDirty && (
                <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  Modified
                </span>
              )}
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            {completionPercentage === 100 ? 'Ready to save' : 'Complete all required fields'}
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information Section */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={20} className="text-blue-600" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className={`block mb-2 font-medium ${errors.name ? 'text-red-600' : 'text-gray-700'}`}>
                  Product Name *
                </label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
                        errors.name ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="Enter product name"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.name && (
                  <div className="text-red-500 text-xs mt-1">{errors.name.message}</div>
                )}
              </div>

              {/* SKU */}
              <div>
                <label className={`block mb-2 font-medium ${errors.sku ? 'text-red-600' : 'text-gray-700'}`}>
                  SKU *
                </label>
                <Controller
                  name="sku"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <input
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
                          errors.sku ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="Enter SKU"
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                  )}
                />
                {errors.sku && (
                  <div className="text-red-500 text-xs mt-1">{errors.sku.message}</div>
                )}
              </div>


            </div>

            {/* Description */}
            <div className="mt-6">
              <label className={`block mb-2 font-medium ${errors.description ? 'text-red-600' : 'text-gray-700'}`}>
                Description
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <textarea
                    rows={3}
                    className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none resize-none ${
                      errors.description ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Detailed product description"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.description && (
                <div className="text-red-500 text-xs mt-1">{errors.description.message}</div>
              )}
            </div>
          </GlassCard>

          {/* Category, Brand & Supplier Section */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers size={20} className="text-green-600" />
              Classification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category */}
              <div>
                <label className={`block mb-2 font-medium ${errors.categoryId ? 'text-red-600' : 'text-gray-700'}`}>
                  Category *
                </label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <select
                      className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
                        errors.categoryId ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.categoryId && (
                  <div className="text-red-500 text-xs mt-1">{errors.categoryId.message}</div>
                )}
              </div>

              {/* Brand */}
              <div>
                <label className={`block mb-2 font-medium ${errors.brandId ? 'text-red-600' : 'text-gray-700'}`}>
                  Brand
                </label>
                <Controller
                  name="brandId"
                  control={control}
                  render={({ field }) => (
                    <select
                      className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
                        errors.brandId ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="">Select Brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.brandId && (
                  <div className="text-red-500 text-xs mt-1">{errors.brandId.message}</div>
                )}
              </div>

              {/* Supplier */}
              <div>
                <label className={`block mb-2 font-medium ${errors.supplierId ? 'text-red-600' : 'text-gray-700'}`}>
                  Supplier
                </label>
                <Controller
                  name="supplierId"
                  control={control}
                  render={({ field }) => (
                    <select
                      className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
                        errors.supplierId ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.supplierId && (
                  <div className="text-red-500 text-xs mt-1">{errors.supplierId.message}</div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Pricing & Stock Section */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-green-600" />
              Pricing & Stock
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price */}
              <div>
                <label className={`block mb-2 font-medium ${errors.price ? 'text-red-600' : 'text-gray-700'}`}>
                  Selling Price *
                </label>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <PriceInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                        className="w-full py-3 pl-8 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none"
                        error={errors.price?.message}
                      />
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    </div>
                  )}
                />
              </div>

              {/* Cost Price */}
              <div>
                <label className={`block mb-2 font-medium ${errors.costPrice ? 'text-red-600' : 'text-gray-700'}`}>
                  Cost Price *
                </label>
                <Controller
                  name="costPrice"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <PriceInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                        className="w-full py-3 pl-8 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none"
                        error={errors.costPrice?.message}
                      />
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    </div>
                  )}
                />
              </div>

              {/* Stock Quantity */}
              <div>
                <label className={`block mb-2 font-medium ${errors.stockQuantity ? 'text-red-600' : 'text-gray-700'}`}>
                  Stock Quantity *
                </label>
                <Controller
                  name="stockQuantity"
                  control={control}
                  render={({ field }) => (
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
                  )}
                />
                {errors.stockQuantity && (
                  <div className="text-red-500 text-xs mt-1">{errors.stockQuantity.message}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Min Stock Level */}
              <div>
                <label className={`block mb-2 font-medium ${errors.minStockLevel ? 'text-red-600' : 'text-gray-700'}`}>
                  Min Stock Level *
                </label>
                <Controller
                  name="minStockLevel"
                  control={control}
                  render={({ field }) => (
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
                  )}
                />
                {errors.minStockLevel && (
                  <div className="text-red-500 text-xs mt-1">{errors.minStockLevel.message}</div>
                )}
              </div>

              {/* Max Stock Level */}
              <div>
                <label className={`block mb-2 font-medium ${errors.maxStockLevel ? 'text-red-600' : 'text-gray-700'}`}>
                  Max Stock Level
                </label>
                <Controller
                  name="maxStockLevel"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min="0"
                      className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
                        errors.maxStockLevel ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="100"
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
                {errors.maxStockLevel && (
                  <div className="text-red-500 text-xs mt-1">{errors.maxStockLevel.message}</div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Product Images Section */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera size={20} className="text-purple-600" />
              Product Images
            </h3>
            
            <div className="space-y-4">
              {/* Supabase Image Upload */}
              <ImageUpload
                productId={productId}
                userId={user?.id || ''}
                onUploadComplete={(images) => {
                  // Handle new image uploads
                  console.log('New images uploaded:', images);
                  // Refresh product images
                  loadProductImages();
                }}
                onUploadError={(error) => {
                  toast.error(`Upload failed: ${error}`);
                }}
                maxFiles={5}
              />

              {/* Image Gallery */}
              <ImageGallery
                productId={productId}
                onImagesChange={(images) => {
                  const imageUrls = images.map(img => img.url);
                  setProductImages(imageUrls);
                }}
              />
            </div>
          </GlassCard>



          {/* Tags Section */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag size={20} className="text-orange-600" />
              Tags
            </h3>
            
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Product Tags
              </label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Add tags separated by commas (e.g., electronics, gadgets, premium)"
                      value={field.value.join(', ')}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                        field.onChange(tags);
                      }}
                    />
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                const newTags = field.value.filter((_, i) => i !== index);
                                field.onChange(newTags);
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              />
            </div>
          </GlassCard>

          {/* Variants Section */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package size={20} className="text-indigo-600" />
                Product Variants
              </h3>
              <button
                type="button"
                onClick={() => setShowVariants(!showVariants)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {showVariants ? 'Hide' : 'Show'} Variants
                <Eye size={16} />
              </button>
            </div>

            {showVariants && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Manage different versions of this product (e.g., sizes, colors, configurations)
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

                {/* Add New Variant Button */}
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
            )}
          </GlassCard>

          {/* Advanced Settings Toggle */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Layers size={16} />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Status */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Product Status</h4>
                  
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

                {/* Product Type */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Product Type</h4>
                  
                  <Controller
                    name="isDigital"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Digital Product</label>
                          <p className="text-xs text-gray-500">No physical shipping required</p>
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
                    name="requiresShipping"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Requires Shipping</label>
                          <p className="text-xs text-gray-500">Physical product needs shipping</p>
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
            </GlassCard>
          )}

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="flex gap-2">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={!isDirty || isSubmitting}
                size="sm"
              >
                <RefreshCw size={16} />
                Reset
              </GlassButton>
            </div>
            
            <div className="flex gap-3">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={false}
                className="min-w-[120px]"
                onClick={() => {
                  console.log('🔘 Submit button clicked');
                  console.log('📊 Form errors:', errors);
                  console.log('📊 Form isDirty:', isDirty);
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save size={16} />
                    Save Changes ({completionPercentage}%)
                  </div>
                )}
              </GlassButton>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditProductModal;
