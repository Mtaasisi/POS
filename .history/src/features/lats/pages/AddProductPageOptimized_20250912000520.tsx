import React, { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { toast } from 'react-hot-toast';
import { Save, Plus, ArrowLeft, Settings, MapPin, Store } from 'lucide-react';
import { useInventoryStore } from '../stores/useInventoryStore';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { retryWithBackoff } from '../../../lib/supabaseClient';

import { Category } from '../../../lib/categoryApi';
import { getActiveSuppliers, Supplier } from '../../../lib/supplierApi';
import { generateSKU } from '../lib/skuUtils';

// Extracted components
import ProductInformationForm from '../components/product/ProductInformationForm';
import PricingAndStockForm from '../components/product/PricingAndStockForm';
import ProductImagesSection from '../components/product/ProductImagesSection';
import ProductVariantsSection from '../components/product/ProductVariantsSection';
import StorageLocationForm from '../components/product/StorageLocationForm';

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
  return data.image_url || data.url;
}, {
  message: "Either image_url or url must be provided"
});

// Validation schema for product form
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name must be provided').max(100, 'Product name must be less than 100 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  sku: z.string().min(1, 'SKU must be provided').max(50, 'SKU must be less than 50 characters'),

  categoryId: z.string().min(1, 'Category must be selected'),

  supplierId: z.string().optional(),
  condition: z.enum(['new', 'used', 'refurbished'], {
    errorMap: () => ({ message: 'Please select a condition' })
  }),
  
  price: z.number().min(0, 'Price must be 0 or greater'),
  costPrice: z.number().min(0, 'Cost price must be 0 or greater'),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater'),
  minStockLevel: z.number().min(0, 'Minimum stock level must be 0 or greater'),

  // Storage location fields
  storageRoomId: z.string().min(1, 'Store room must be selected'),
  shelfId: z.string().min(1, 'Shelf must be selected'),

  images: z.array(ProductImageSchema).default([]),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  variants: z.array(z.any()).optional().default([])
});

type ProductFormData = z.infer<typeof productFormSchema>;
type ProductImage = z.infer<typeof ProductImageSchema>;

const AddProductPageOptimized: React.FC = () => {
  const navigate = useNavigate();
  const { categories, loadCategories } = useInventoryStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentErrors, setCurrentErrors] = useState<Record<string, string>>({});

  // Generate auto SKU using utility function
  const generateAutoSKU = () => {
    return generateSKU();
  };

  // Initial form data
  const [formData, setFormData] = useState({
    name: '',
    sku: '',

    categoryId: null,
    supplierId: null,
    condition: '',
    description: '',
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 0,
    storageRoomId: '',
    shelfId: '',
    images: [] as ProductImage[],
    metadata: {},
    variants: [] as any[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Variants state
  const [variants, setVariants] = useState<any[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [useVariants, setUseVariants] = useState(false);
  const [isReorderingVariants, setIsReorderingVariants] = useState(false);
  const [draggedVariantIndex, setDraggedVariantIndex] = useState<number | null>(null);

  // Modals state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showVariantSpecificationsModal, setShowVariantSpecificationsModal] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [createdProduct, setCreatedProduct] = useState<any>(null);

  // Name checking
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameExists, setNameExists] = useState(false);

  const { currentUser, refreshSession } = useAuth();

  // Load data on component mount
  useEffect(() => {
      const loadData = async () => {
    try {
      const [suppliersData] = await Promise.all([
        getActiveSuppliers()
      ]);

      // Load ALL categories using inventory store
      await loadCategories();

      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load form data');
    }
  };

    loadData();
  }, [loadCategories]);

  // Check if product name exists
  const checkProductName = async (name: string) => {
    if (!name.trim()) {
      setNameExists(false);
      return;
    }

    setIsCheckingName(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .ilike('name', name.trim())
        .limit(1);

      if (error) throw error;
      
      setNameExists(data && data.length > 0);
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
      productFormSchema.parse({
        ...formData,
        images: formData.images,
        variants: useVariants ? variants : []
      });
      
      setCurrentErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0]] = err.message;
          }
        });
      }
      
      setCurrentErrors(errors);
      return false;
    }
  };

  // Submit form
  const handleSubmit = async () => {
    setHasSubmitted(true);
    
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
      const productData = {
        ...formData,
        supplier_id: formData.supplierId,
        category_id: formData.categoryId,
        cost_price: formData.costPrice,
        stock_quantity: formData.stockQuantity,
        min_stock_level: formData.minStockLevel,
        storage_room_id: formData.storageRoomId,
        store_shelf_id: formData.shelfId,
        images: formData.images,
        variants: useVariants ? variants : [],
        created_by: currentUser?.id,
        updated_by: currentUser?.id
      };

      const { data, error } = await retryWithBackoff(async () => {
        return await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
      });

      if (error) throw error;

      setCreatedProduct(data);
      setShowSummaryModal(true);
      toast.success('Product created successfully!');
      
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVariantSpecificationsClick = (index: number) => {
    setCurrentVariantIndex(index);
    setShowVariantSpecificationsModal(true);
  };

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/lats/unified-inventory" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
              <LATSBreadcrumb 
                items={[
                  { label: 'LATS', href: '/lats/dashboard' },
                  { label: 'Inventory', href: '/lats/unified-inventory' },
                  { label: 'Add Product' }
                ]}
              />
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
              onGenerateSKU={generateAutoSKU}
            />

            {/* Pricing and Stock Form */}
            <PricingAndStockForm
              formData={formData}
              setFormData={setFormData}
              currentErrors={currentErrors}
            />

            {/* Product Images Section */}
            <ProductImagesSection
              images={formData.images}
              setImages={(images) => setFormData(prev => ({ ...prev, images }))}
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
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AddProductPageOptimized;
