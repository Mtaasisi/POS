import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, MapPin, Store, X, Plus, Check, Layers, Palette, HardDrive, Zap, Cpu, Monitor, Battery, Camera, Ruler, FileText, Clock, Hand, Unplug, RotateCcw, Lightbulb, Fingerprint, ScanFace, Droplets, Wind, BatteryCharging, FastForward, PhoneCall, Expand, Radio, Navigation, Headphones, PenTool, Shield, Lock, Vibrate, Usb, Cable, Speaker, Mic } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { retryWithBackoff } from '../../../lib/supabaseClient';

import { Category } from '../../../lib/categoryApi';
import { useInventoryStore } from '../stores/useInventoryStore';

import { StoreLocation } from '../../settings/types/storeLocation';
import { storeLocationApi } from '../../settings/utils/storeLocationApi';
import { generateSKU } from '../lib/skuUtils';
import { duplicateProduct, generateProductReport, exportProductData } from '../lib/productUtils';
import { validateAndCreateDefaultVariant } from '../lib/variantUtils';

// Extracted components
import ProductInformationForm from '../components/product/ProductInformationForm';
import PricingAndStockForm from '../components/product/PricingAndStockForm';
import ProductImagesSection from '../components/product/ProductImagesSection';
import ProductVariantsSection from '../components/product/ProductVariantsSection';
import StorageLocationForm from '../components/product/StorageLocationForm';
import ProductSuccessModal from '../components/product/ProductSuccessModal';

// Import ProductVariant type
interface ProductVariant {
  name: string;
  sku: string;
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
  return data.image_url || data.url;
}, {
  message: "Either image_url or url must be provided"
});

// Validation schema for product form
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name must be provided').max(100, 'Product name must be less than 100 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
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
  sku: z.string().max(50, 'SKU must be less than 50 characters').optional(),
  categoryId: z.string().min(1, 'Category must be selected'),


  condition: z.enum(['new', 'used', 'refurbished'], {
    errorMap: () => ({ message: 'Please select a condition' })
  }),
  
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

const AddProductPageOptimized: React.FC = () => {
  const navigate = useNavigate();
  const { categories, loadCategories } = useInventoryStore();

  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [currentErrors, setCurrentErrors] = useState<Record<string, string>>({});

  // Generate a temporary product ID for image uploads
  const [tempProductId] = useState(`temp-product-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // Generate auto SKU using utility function
  const generateAutoSKU = () => {
    return generateSKU();
  };

  // Initial form data
  const [formData, setFormData] = useState({
    name: '',
    sku: generateAutoSKU(),
    categoryId: null,

    condition: '',
    description: '',
    specification: '',
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 2, // Set default min stock level to 2 pcs
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

  // Draft management
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [lastDraftSave, setLastDraftSave] = useState<Date | null>(null);
  const [draftSaveTimer, setDraftSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string>('');
  const [createdProductName, setCreatedProductName] = useState<string>('');

  const { currentUser } = useAuth();

  // Draft storage key
  const DRAFT_KEY = `product_draft_${currentUser?.id || 'anonymous'}`;

  // Success modal action handlers
  const handleViewProduct = () => {
    setShowSuccessModal(false);
    navigate(`/lats/products/${createdProductId}`);
  };

  const handleEditProduct = () => {
    setShowSuccessModal(false);
    navigate(`/lats/products/${createdProductId}/edit`);
  };

  const handleDuplicateProduct = () => {
    setShowSuccessModal(false);
    
    // Use utility function to duplicate product
    const { productData: duplicatedFormData, variants: duplicatedVariants } = duplicateProduct(formData, variants);
    
    setFormData(duplicatedFormData);
    setVariants(duplicatedVariants);
    setUseVariants(useVariants);
    navigate('/lats/add-product');
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    // Reset form completely
    setFormData({
      name: '',
      sku: generateAutoSKU(),
      categoryId: null,
  
      condition: '',
      description: '',
      specification: '',
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 2,
      storageRoomId: '',
      shelfId: '',
      images: [],
      metadata: {},
      variants: []
    });
    setVariants([]);
    setUseVariants(false);
    setShowVariants(false);
    navigate('/lats/add-product');
  };

  const handleCopyProductLink = async () => {
    try {
      const productUrl = `${window.location.origin}/lats/products/${createdProductId}`;
      await navigator.clipboard.writeText(productUrl);
      toast.success('Product link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleDownloadDetails = () => {
    // Generate comprehensive product report
    const productReport = generateProductReport(formData, variants);
    
    const blob = new Blob([productReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${createdProductName.replace(/[^a-zA-Z0-9]/g, '_')}_report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Product report downloaded!');
  };

  const handleShareProduct = async () => {
    try {
      const productUrl = `${window.location.origin}/lats/products/${createdProductId}`;
      const shareData = {
        title: `Product: ${createdProductName}`,
        text: `Check out this product: ${createdProductName}`,
        url: productUrl
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying link
        await navigator.clipboard.writeText(productUrl);
        toast.success('Product link copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to share product');
    }
  };

  const handleGoToInventory = () => {
    setShowSuccessModal(false);
    navigate('/lats/unified-inventory');
  };

  // Auto-save draft
  const saveDraft = useCallback(() => {
    try {
      const draftData = {
        formData,
        variants,
        useVariants,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      setIsDraftSaved(true);
      setLastDraftSave(new Date());
      
      // Clear success indicator after 2 seconds
      setTimeout(() => setIsDraftSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [formData, variants, useVariants, DRAFT_KEY]);

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const draftData = localStorage.getItem(DRAFT_KEY);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        setFormData(parsed.formData);
        setVariants(parsed.variants || []);
        setUseVariants(parsed.useVariants || false);
        setLastDraftSave(new Date(parsed.savedAt));
        // toast.success('Draft restored successfully!'); // Disabled popup notification
        return true;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return false;
  }, [DRAFT_KEY]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setLastDraftSave(null);
      setIsDraftSaved(false);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [DRAFT_KEY]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [locationsData] = await Promise.all([
          storeLocationApi.getAll()
        ]);

        // Load ALL categories using inventory store
        await loadCategories();

        
        setStoreLocations(locationsData || []);

        // Try to load draft after data is loaded
        loadDraft();
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load form data');
      }
    };

    loadData();
  }, [loadDraft, loadCategories]);

  // Auto-save draft when form data changes
  useEffect(() => {
    // Clear previous timer
    if (draftSaveTimer) {
      clearTimeout(draftSaveTimer);
    }

    // Set new timer to save draft after 2 seconds of inactivity
    const timer = setTimeout(() => {
      if (formData.name.trim() || formData.description.trim() || variants.length > 0) {
        saveDraft();
      }
    }, 2000);

    setDraftSaveTimer(timer);

    // Cleanup timer on unmount
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [formData, variants, useVariants, saveDraft]);

  // Load draft on page load if available
  useEffect(() => {
    const checkForDraft = async () => {
      try {
        const draftData = localStorage.getItem(DRAFT_KEY);
        if (draftData) {
          const parsed = JSON.parse(draftData);
          const draftAge = new Date().getTime() - new Date(parsed.savedAt).getTime();
          const hoursSinceDraft = draftAge / (1000 * 60 * 60);
          
          // Only restore if draft is less than 24 hours old
          if (hoursSinceDraft < 24) {
            // Auto-restore draft silently without showing popup
            loadDraft();
            // toast((t) => (
            //   <div className="flex flex-col gap-2">
            //     <span>Found a saved draft from {new Date(parsed.savedAt).toLocaleDateString()}</span>
            //     <div className="flex gap-2">
            //       <button
            //         onClick={() => {
            //           loadDraft();
            //           toast.dismiss(t.id);
            //         }}
            //         className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            //       >
            //         Restore Draft
            //       </button>
            //       <button
            //         onClick={() => {
            //           clearDraft();
            //           toast.dismiss(t.id);
            //         }}
            //         className="px-3 py-1 bg-gray-400 text-white rounded text-sm"
            //       >
            //         Discard
            //       </button>
            //     </div>
            //   </div>
            // ), { duration: 10000 });
          } else {
            // Clear old draft
            clearDraft();
          }
        }
      } catch (error) {
        console.error('Error checking for draft:', error);
      }
    };

    checkForDraft();
  }, [DRAFT_KEY, loadDraft, clearDraft]);

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
      // Calculate total quantity and value
      const totalQuantity = useVariants && variants.length > 0 
        ? variants.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0)
        : (formData.stockQuantity || 0);
      
      const totalValue = useVariants && variants.length > 0
        ? variants.reduce((sum, variant) => sum + ((variant.stockQuantity || 0) * (variant.price || 0)), 0)
        : ((formData.stockQuantity || 0) * (formData.price || 0));

      // Prepare product data WITHOUT images (images will be saved separately)
      // When using variants, don't put variant data in main product fields
      
      // Generate SKU if empty
      const finalSku = useVariants ? null : (formData.sku || generateAutoSKU());
      
      const productData = {
        name: formData.name,
        description: formData.description || null,
        specification: formData.specification || null,
        // Don't set SKU, prices, stock in main product when using variants
        sku: finalSku,
        category_id: formData.categoryId || null,


        condition: formData.condition || 'new',
        // Only set these fields if NOT using variants
        cost_price: useVariants ? 0 : (formData.costPrice || 0),
        selling_price: useVariants ? 0 : (formData.price || 0),
        stock_quantity: useVariants ? 0 : (formData.stockQuantity || 0),
        min_stock_level: useVariants ? 0 : (formData.minStockLevel || 0),
        total_quantity: totalQuantity,
        total_value: totalValue,
        storage_room_id: formData.storageRoomId || null,
        store_shelf_id: formData.shelfId || null,
        tags: [],
        attributes: formData.metadata || {},
        metadata: {
          useVariants: useVariants,
          variantCount: useVariants ? variants.length : 0,
          createdBy: currentUser?.id,
          createdAt: new Date().toISOString()
        }
      };

      console.log('🔍 DEBUG: Product data being sent:', productData);

      // Create the product first
      console.log('🔍 DEBUG: Creating product in database...');
      const { data: createdProduct, error } = await retryWithBackoff(async () => {
        return await supabase!
          .from('lats_products')
          .insert([productData])
          .select()
          .single();
      });

      if (error) {
        console.log('🔍 DEBUG: Product creation failed:', error);
        throw error;
      }

      console.log('🔍 DEBUG: Product created successfully:', createdProduct);

      // Save images to product_images table if we have images
      if (formData.images && formData.images.length > 0 && createdProduct) {
        console.log('Saving images to product_images table:', formData.images);
        
        const imageData = formData.images.map((image, index) => ({
          product_id: createdProduct.id,
          image_url: image.url || image.image_url || '',
          thumbnail_url: image.thumbnailUrl || image.thumbnail_url || image.url || image.image_url || '',
          file_name: image.fileName || image.file_name || `image_${index + 1}`,
          file_size: image.fileSize || image.file_size || 0,
          is_primary: image.isPrimary || image.is_primary || index === 0, // First image is primary
          uploaded_by: currentUser?.id
        }));

        const { error: imageError } = await retryWithBackoff(async () => {
          return await supabase!
            .from('product_images')
            .insert(imageData);
        });

        if (imageError) {
          console.error('Error saving images:', imageError);
          toast.error('Product created but failed to save images');
        } else {
          console.log('Images saved successfully to product_images table');
        }

        // If any images were uploaded with temporary product IDs, update them
        const tempImages = formData.images.filter(img => 
          img.id && img.id.startsWith('temp-') && 
          (img.url || img.image_url) && 
          !(img.url || img.image_url).startsWith('blob:')
        );

        if (tempImages.length > 0) {
          console.log('Updating temporary image records for product:', createdProduct.id);
          
          // For temporary images that were uploaded to storage, we need to update their database records
          // This is handled by the image upload services when they detect a real product ID
          try {
            // The RobustImageService should handle updating temporary image records
            // when it detects that the product ID has changed from temp to real
            console.log('Temporary images will be updated by the image service');
          } catch (updateError) {
            console.error('Error updating temporary image records:', updateError);
          }
        }
      }

      // Create variants - either the user-defined variants or a default variant
      if (createdProduct) {
        let variantsToCreate = [];
        
        if (useVariants && variants.length > 0) {
          // Create user-defined variants
          console.log('🔍 DEBUG: Creating user-defined variants for product:', createdProduct.id);
          console.log('🔍 DEBUG: Variants to create:', variants);
          
          variantsToCreate = variants.map((variant, index) => ({
            product_id: createdProduct.id,
            sku: variant.sku || `${formData.sku}-V${index + 1}`,
            name: variant.name,
            cost_price: variant.costPrice,
            selling_price: variant.price,
            quantity: variant.stockQuantity,
            min_quantity: variant.minStockLevel,
            attributes: {
              ...variant.attributes,
              specification: variant.specification || null
            }
          }));
        } else {
          // No variants provided - create a default variant automatically using utility
          console.log('🔍 DEBUG: Creating default variant for product:', createdProduct.id);
          
          const defaultVariantResult = await validateAndCreateDefaultVariant(
            createdProduct.id,
            createdProduct.name,
            {
              costPrice: formData.costPrice,
              sellingPrice: formData.price,
              quantity: formData.stockQuantity,
              minQuantity: formData.minStockLevel,
              // Don't pass sku to avoid duplicate SKU constraint violation
              // The variant will generate its own unique SKU
              attributes: {
                specification: formData.specification || null
              }
            }
          );

          if (!defaultVariantResult.success) {
            console.error('❌ Failed to create default variant:', defaultVariantResult.error);
            toast.error(`Failed to create default variant: ${defaultVariantResult.error}`);
            return;
          }
          
          console.log('✅ Default variant created successfully');
          // Skip the manual variant creation since it's already done
          variantsToCreate = [];
        }

        console.log('🔍 DEBUG: Variant data to insert:', variantsToCreate);

        // Only insert variants if there are any to insert (skip if default variant was already created)
        let createdVariants = null;
        let variantError = null;
        
        if (variantsToCreate.length > 0) {
          const result = await retryWithBackoff(async () => {
            return await supabase!
              .from('lats_product_variants')
              .insert(variantsToCreate)
              .select();
          });
          createdVariants = result.data;
          variantError = result.error;
        }

        if (variantError) {
          console.error('Error creating variants:', variantError);
          console.log('🔍 DEBUG: Variant creation failed:', variantError);
          toast.error('Product created but failed to create variants');
        } else {
          console.log('🔍 DEBUG: Variants created successfully:', createdVariants);
        }
      } else {
        console.log('🔍 DEBUG: No product created, cannot create variants');
      }

      // Store created product info for success modal
      setCreatedProductId(createdProduct.id);
      setCreatedProductName(formData.name);
      
      // Clear draft after successful submission
      clearDraft();
      
      // Show success modal instead of navigating away
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error creating product:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error('Failed to create product. Please try again.');
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

  // Update variant function
  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  // Remove attribute from a variant
  const removeAttributeFromVariant = (variantIndex: number, attributeName: string) => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes };
    delete newAttributes[attributeName];
    updateVariant(variantIndex, 'attributes', newAttributes);
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

  // Toggle feature specification (Yes/No)
  const toggleFeatureSpecification = (featureKey: string) => {
    const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
    const currentValue = currentSpecs[featureKey];
    const isEnabled = currentValue === 'Yes' || currentValue === 'true' || currentValue === true;
    
    const newValue = isEnabled ? 'No' : 'Yes';
    const newSpecs = { ...currentSpecs, [featureKey]: newValue };
    setFormData(prev => ({ ...prev, specification: JSON.stringify(newSpecs) }));
  };

  // Handle custom attribute submission for product
  const handleProductCustomAttributeSubmit = () => {
    if (productCustomAttributeInput.trim()) {
      const cleanName = productCustomAttributeInput.trim().toLowerCase().replace(/\s+/g, '_');
      addAttributeToProduct(cleanName);
      setShowProductCustomInput(false);
      setProductCustomAttributeInput('');
    }
  };

  // Cancel custom attribute input for product
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
    <div className="p-2 sm:p-4 h-full overflow-y-auto pt-4">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton to="/lats/unified-inventory" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Add Product</h1>
              <p className="text-sm text-gray-600">Create new inventory item</p>
            </div>
          </div>
          
          {/* Draft Status Indicator */}
          <div className="flex items-center gap-2">
            {isDraftSaved && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs">
                <Check className="w-3 h-3 text-green-600" />
                <span className="text-green-700 font-medium">Saved</span>
              </div>
            )}
            
            {lastDraftSave && !isDraftSaved && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-blue-700">{lastDraftSave.toLocaleTimeString()}</span>
              </div>
            )}
            
            {lastDraftSave && (
              <button
                onClick={clearDraft}
                className="px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Clear draft"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <GlassCard className="mb-3">
          <div className="space-y-4">
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
              onGenerateSku={() => setFormData(prev => ({ ...prev, sku: generateAutoSKU() }))}
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
              setImages={(images: ProductImage[]) => setFormData(prev => ({ ...prev, images }))}
              currentUser={currentUser}
              productId={tempProductId}
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
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <GlassButton
                onClick={() => navigate('/lats/unified-inventory')}
                variant="secondary"
                icon={<ArrowLeft size={16} />}
                className="flex-1 sm:flex-none text-sm py-2"
              >
                Cancel
              </GlassButton>
              
              <div className="flex-1" />
              
              <GlassButton
                onClick={handleSubmit}
                loading={isSubmitting}
                icon={<Save size={16} />}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-1 sm:flex-none text-sm py-2"
                disabled={isSubmitting || isCheckingName}
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
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
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
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
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-specifications-modal-title"
        >
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden mx-auto">
            {/* Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 id="product-specifications-modal-title" className="text-xl font-semibold text-gray-900">
                      Product Specifications
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Add product specifications
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
                  
                  {/* Basic Specifications */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Specifications</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        { name: 'Color', icon: Palette },
                        { name: 'Storage', icon: HardDrive },
                        { name: 'RAM', icon: Zap },
                        { name: 'Processor', icon: Cpu },
                        { name: 'Screen Size', icon: Monitor },
                        { name: 'Battery', icon: Battery },
                        { name: 'Camera', icon: Camera },
                        { name: 'Weight', icon: Ruler }
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
                    </div>
                  </div>

                  {/* Feature Specifications (Yes/No) */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Device Features (Click to toggle Yes/No)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {[
                        // Display Features
                        { name: 'Touch Screen', key: 'touch', icon: Hand },
                        { name: 'OLED Display', key: 'oled_display', icon: Monitor },
                        { name: 'HDR Support', key: 'hdr_support', icon: Monitor },
                        { name: 'High Refresh Rate', key: 'high_refresh_rate', icon: RotateCcw },
                        
                        // Input Features  
                        { name: 'Detachable Keyboard', key: 'detachable', icon: Unplug },
                        { name: 'Convertible (2-in-1)', key: 'convertible', icon: RotateCcw },
                        { name: 'Backlit Keyboard', key: 'backlit_keyboard', icon: Lightbulb },
                        { name: 'Stylus Support', key: 'stylus_support', icon: PenTool },
                        { name: 'Haptic Feedback', key: 'haptic_feedback', icon: Vibrate },
                        
                        // Security Features
                        { name: 'Fingerprint Scanner', key: 'fingerprint_scanner', icon: Fingerprint },
                        { name: 'Face Recognition', key: 'face_id', icon: ScanFace },
                        { name: 'Security Chip', key: 'security_chip', icon: Shield },
                        { name: 'Encryption', key: 'encryption', icon: Lock },
                        
                        // Durability Features
                        { name: 'Waterproof', key: 'waterproof', icon: Droplets },
                        { name: 'Dust Resistant', key: 'dust_resistant', icon: Wind },
                        { name: 'Drop Resistant', key: 'drop_resistant', icon: Shield },
                        { name: 'Scratch Resistant', key: 'scratch_resistant', icon: Shield },
                        
                        // Charging & Battery
                        { name: 'Wireless Charging', key: 'wireless_charging', icon: BatteryCharging },
                        { name: 'Fast Charging', key: 'fast_charging', icon: FastForward },
                        { name: 'Reverse Charging', key: 'reverse_charging', icon: BatteryCharging },
                        { name: 'Removable Battery', key: 'removable_battery', icon: Battery },
                        
                        // Connectivity
                        { name: 'Dual SIM', key: 'dual_sim', icon: PhoneCall },
                        { name: 'eSIM Support', key: 'esim_support', icon: PhoneCall },
                        { name: 'NFC', key: 'nfc', icon: Radio },
                        { name: 'GPS', key: 'gps', icon: Navigation },
                        { name: '5G Support', key: '5g_support', icon: Radio },
                        { name: 'Wi-Fi 6', key: 'wifi_6', icon: Radio },
                        
                        // Audio Features
                        { name: 'Headphone Jack', key: 'headphone_jack', icon: Headphones },
                        { name: 'Stereo Speakers', key: 'stereo_speakers', icon: Speaker },
                        { name: 'Noise Cancellation', key: 'noise_cancellation', icon: Mic },
                        
                        // Storage & Expansion
                        { name: 'Expandable Storage', key: 'expandable_storage', icon: Expand },
                        { name: 'Cloud Storage', key: 'cloud_storage', icon: Expand },
                        
                        // Ports & Connectors
                        { name: 'USB-C Port', key: 'usb_c_port', icon: Usb },
                        { name: 'Thunderbolt', key: 'thunderbolt', icon: Cable },
                        { name: 'HDMI Port', key: 'hdmi_port', icon: Cable },
                        { name: 'SD Card Slot', key: 'sd_card_slot', icon: Expand }
                      ].map((feature) => {
                        const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
                        const isEnabled = currentSpecs[feature.key] === 'Yes' || currentSpecs[feature.key] === 'true' || currentSpecs[feature.key] === true;
                        
                        return (
                          <button 
                            key={feature.key}
                            type="button" 
                            onClick={() => toggleFeatureSpecification(feature.key)}
                            className={`flex items-center gap-2 p-3 border rounded-lg transition-all duration-200 ${
                              isEnabled 
                                ? 'bg-green-50 border-green-300 text-green-800 shadow-sm' 
                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            <feature.icon className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 text-left min-w-0">
                              <div className="text-sm font-medium truncate">{feature.name}</div>
                              <div className={`text-xs ${isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                                {isEnabled ? '✓ Enabled' : 'Click to enable'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Specification */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Specification</h4>
                    <button 
                      type="button" 
                      onClick={() => { setShowProductCustomInput(true); setProductCustomAttributeInput(''); }} 
                      className="flex items-center gap-3 p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors w-full"
                    >
                      <Plus className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Add Custom Specification</span>
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
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
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

      {/* Product Success Modal */}
      <ProductSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        productId={createdProductId}
        productName={createdProductName}
        onViewProduct={handleViewProduct}
        onEditProduct={handleEditProduct}
        onDuplicateProduct={handleDuplicateProduct}
        onCreateAnother={handleCreateAnother}
        onCopyProductLink={handleCopyProductLink}
        onDownloadDetails={handleDownloadDetails}
        onShareProduct={handleShareProduct}
        onGoToInventory={handleGoToInventory}
      />
    </div>
  );
};

export default AddProductPageOptimized;
