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

import { getActiveCategories, Category } from '../../../lib/categoryApi';
import { specificationCategories, getSpecificationsByCategory, getSpecificationsByType, getTypeDisplayName, SpecificationItem } from '../../../data/specificationCategories';

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
  const [categories, setCategories] = useState<Category[]>([]);

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
  const [selectedSpecCategory, setSelectedSpecCategory] = useState<string>('laptop');

  // Product specifications modal state
  const [showProductSpecificationsModal, setShowProductSpecificationsModal] = useState(false);
  const [showProductCustomInput, setShowProductCustomInput] = useState(false);
  const [productCustomAttributeInput, setProductCustomAttributeInput] = useState('');
  const [selectedProductSpecCategory, setSelectedProductSpecCategory] = useState<string>('laptop');

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

  // Function to create a variant from current form data
  const createVariantFromFormData = (): ProductVariant => {
    return {
      name: 'Variant 1',
      sku: `${formData.sku}-V01`,
      costPrice: formData.costPrice,
      price: formData.price,
      stockQuantity: formData.stockQuantity,
      minStockLevel: formData.minStockLevel,
      specification: formData.specification,
      attributes: {
        specification: formData.specification || null
      }
    };
  };

  // Handle variants toggle - automatically create variant from form data
  const handleUseVariantsToggle = (enabled: boolean) => {
    setUseVariants(enabled);
    
    if (enabled && variants.length === 0) {
      // Create a variant from current form data
      const autoVariant = createVariantFromFormData();
      setVariants([autoVariant]);
      setShowVariants(true);
    } else if (!enabled) {
      // Clear variants when disabling
      setVariants([]);
      setShowVariants(false);
    }
  };

  // Update the first variant when form data changes (if variants are enabled)
  useEffect(() => {
    if (useVariants && variants.length > 0) {
      const updatedVariant = createVariantFromFormData();
      setVariants(prev => prev.map((variant, index) => 
        index === 0 ? { ...variant, ...updatedVariant } : variant
      ));
    }
  }, [formData.costPrice, formData.price, formData.stockQuantity, formData.minStockLevel, formData.specification, useVariants]);

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
        const [categoriesData, locationsData] = await Promise.all([
          getActiveCategories(),
          storeLocationApi.getAll()
        ]);

        setCategories(categoriesData || []);
        setStoreLocations(locationsData || []);

        // Try to load draft after data is loaded
        loadDraft();
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load form data');
      }
    };

    loadData();
  }, [loadDraft]);

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
      // Create a dynamic schema based on whether variants are used
      const dynamicSchema = useVariants 
        ? productFormSchema.omit({ 
            price: true, 
            costPrice: true, 
            stockQuantity: true, 
            minStockLevel: true,
            specification: true
          })
        : productFormSchema;

      dynamicSchema.parse({
        ...formData,
        images: formData.images,
        variants: useVariants ? variants : []
      });

      // Additional validation for variants when using variants
      if (useVariants) {
        if (variants.length === 0) {
          errors.variants = 'At least one variant is required when using variants';
        } else {
          variants.forEach((variant, index) => {
            if (!variant.name || variant.name.trim() === '') {
              errors[`variant_${index}_name`] = 'Variant name is required';
            }
            if (variant.price < 0) {
              errors[`variant_${index}_price`] = 'Variant price must be 0 or greater';
            }
            if (variant.costPrice < 0) {
              errors[`variant_${index}_costPrice`] = 'Variant cost price must be 0 or greater';
            }
            if (variant.stockQuantity < 0) {
              errors[`variant_${index}_stockQuantity`] = 'Variant stock quantity must be 0 or greater';
            }
            if (variant.minStockLevel < 0) {
              errors[`variant_${index}_minStockLevel`] = 'Variant min stock level must be 0 or greater';
            }
          });
        }
      }
      
      setCurrentErrors(errors);
      return Object.keys(errors).length === 0;
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
  const addAttributeToVariant = (variantIndex: number, attributeName: string, defaultValue: string = '') => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes, [attributeName]: defaultValue };
    updateVariant(variantIndex, 'attributes', newAttributes);
  };

  // Update specification value for a variant
  const updateVariantSpecification = (variantIndex: number, specKey: string, value: string | boolean) => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes, [specKey]: value };
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
  const addAttributeToProduct = (attributeName: string, defaultValue: string = '') => {
    const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
    const newSpecs = { ...currentSpecs, [attributeName]: defaultValue };
    setFormData(prev => ({ ...prev, specification: JSON.stringify(newSpecs) }));
  };

  // Update product specification value
  const updateProductSpecification = (specKey: string, value: string | boolean) => {
    const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
    const newSpecs = { ...currentSpecs, [specKey]: value };
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
              useVariants={useVariants}
              onGenerateSKU={generateAutoSKU}
            />



            {/* Pricing and Stock Form - Only show when not using variants */}
            {!useVariants && (
              <PricingAndStockForm
                formData={formData}
                setFormData={setFormData}
                currentErrors={currentErrors}
              />
            )}

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
              setUseVariants={handleUseVariantsToggle}
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
          className="fixed inset-0 bg-gradient-to-br from-blue-50/80 to-indigo-100/80 flex items-center justify-center z-50 p-3"
          role="dialog"
          aria-modal="true"
          aria-labelledby="variant-specifications-modal-title"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-5xl w-full max-h-[90vh] overflow-hidden mx-auto animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 id="variant-specifications-modal-title" className="text-xl font-bold">
                      Variant Specifications
                    </h2>
                    <p className="text-blue-100 text-sm">
                      {variants[currentVariantIndex]?.name || `Variant ${currentVariantIndex + 1}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVariantSpecificationsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                  aria-label="Close modal"
                >
                  <X size={20} className="text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {specificationCategories.map((category) => {
                  const IconComponent = category.icon;
                  const isSelected = selectedSpecCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedSpecCategory(category.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        isSelected
                          ? `bg-gradient-to-r from-${category.color}-500 to-${category.color}-600 text-white shadow-lg shadow-${category.color}-500/25 transform scale-105`
                          : 'bg-white/70 text-gray-700 border border-gray-200/50 hover:bg-white hover:shadow-md hover:scale-105'
                      }`}
                    >
                      <IconComponent size={16} />
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <div className="space-y-6">
                {/* Specifications Grid - Grouped by Type */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                      <Plus size={20} className="text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {specificationCategories.find(cat => cat.id === selectedSpecCategory)?.name} Specifications
                    </h3>
                  </div>
                  
                  {Object.entries(getSpecificationsByType(selectedSpecCategory)).map(([type, specs]) => {
                    if (specs.length === 0) return null;
                    
                    return (
                      <div key={type} className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full border border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">
                              {getTypeDisplayName(type)}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {specs.length}
                            </span>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {specs.map((spec) => {
                            const IconComponent = spec.icon;
                            const currentValue = variants[currentVariantIndex]?.attributes?.[spec.key] || '';
                            const isBoolean = spec.type === 'boolean';
                            
                            return (
                              <div key={spec.key} className="group">
                                <div className="bg-white rounded-2xl border border-gray-200/50 p-4 hover:shadow-lg hover:border-blue-300/50 transition-all duration-200 hover:-translate-y-1">
                                  <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors duration-200">
                                      <IconComponent size={16} className="text-gray-600 group-hover:text-blue-600" />
                                    </div>
                                    <span className="flex-1">{spec.name}</span>
                                    {spec.unit && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{spec.unit}</span>}
                                  </label>
                                  
                                  {isBoolean ? (
                                    <button
                                      type="button"
                                      onClick={() => updateVariantSpecification(currentVariantIndex, spec.key, !currentValue)}
                                      className={`w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                                        currentValue
                                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800 shadow-lg shadow-green-100'
                                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                                      }`}
                                    >
                                      <div className="flex items-center justify-center">
                                        <div className={`p-2 rounded-full transition-all duration-200 ${
                                          currentValue ? 'bg-green-500' : 'bg-gray-300'
                                        }`}>
                                          <Check size={16} className="text-white" />
                                        </div>
                                      </div>
                                    </button>
                                  ) : spec.type === 'select' && spec.options ? (
                                    <div className="relative">
                                      <select
                                        value={currentValue as string}
                                        onChange={(e) => updateVariantSpecification(currentVariantIndex, spec.key, e.target.value)}
                                        className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm bg-white hover:border-gray-300 transition-colors duration-200 appearance-none"
                                      >
                                        <option value="">Choose {spec.name}</option>
                                        {spec.options.map((option) => (
                                          <option key={option} value={option}>{option}</option>
                                        ))}
                                      </select>
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type={spec.type === 'number' ? 'number' : 'text'}
                                        value={currentValue as string}
                                        onChange={(e) => updateVariantSpecification(currentVariantIndex, spec.key, e.target.value)}
                                        placeholder={spec.placeholder || `Enter ${spec.name.toLowerCase()}`}
                                        className="w-full py-3 px-4 pr-10 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm bg-white hover:border-gray-300 transition-colors duration-200"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        spellCheck={false}
                                      />
                                      {currentValue && (
                                        <button
                                          type="button"
                                          onClick={() => updateVariantSpecification(currentVariantIndex, spec.key, '')}
                                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                                          title="Clear value"
                                        >
                                          <X size={14} />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Specification */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Plus size={16} className="text-gray-600" />
                    Custom
                  </h3>
                  
                  {showCustomInput === currentVariantIndex ? (
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customAttributeInput}
                          onChange={(e) => setCustomAttributeInput(e.target.value)}
                          placeholder="Enter custom spec name..."
                          className="flex-1 py-1.5 px-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none text-xs"
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
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                        >
                          Add
                        </button>
                        <button 
                          type="button" 
                          onClick={cancelCustomAttribute} 
                          className="px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => { setShowCustomInput(currentVariantIndex); setCustomAttributeInput(''); }} 
                      className="flex items-center gap-2 p-2 bg-white border border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors w-full"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">Add Custom</span>
                    </button>
                  )}
                </div>

                {/* Current Specifications Summary */}
                {variants[currentVariantIndex]?.attributes && Object.keys(variants[currentVariantIndex].attributes).length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Check size={16} className="text-green-600" />
                      Current
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {Object.keys(variants[currentVariantIndex].attributes).length}
                      </span>
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {Object.entries(variants[currentVariantIndex].attributes).map(([key, value]) => (
                        <div key={key} className="bg-green-50 border border-green-200 rounded-md p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-green-800 capitalize truncate">
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div className="text-xs text-green-600 truncate">
                                {String(value) || 'Not set'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttributeFromVariant(currentVariantIndex, key)}
                              className="ml-1 text-red-500 hover:text-red-700 flex-shrink-0"
                              title="Remove specification"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 rounded-b-xl">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-600">
                  {variants[currentVariantIndex]?.attributes && Object.keys(variants[currentVariantIndex].attributes).length > 0 
                    ? `${Object.keys(variants[currentVariantIndex].attributes).length} spec${Object.keys(variants[currentVariantIndex].attributes).length !== 1 ? 's' : ''} added`
                    : 'No specs added yet'
                  }
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVariantSpecificationsModal(false)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVariantSpecificationsModal(false);
                      toast.success('Variant specifications saved successfully!');
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
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
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-2"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-specifications-modal-title"
          style={{ backdropFilter: 'blur(2px)' }}
        >
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[85vh] overflow-hidden mx-auto">
            {/* Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 id="product-specifications-modal-title" className="text-lg font-semibold text-gray-900">
                      Product Specs
                    </h2>
                    <p className="text-gray-600 text-xs mt-1">
                      Add product specifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProductSpecificationsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
              <div className="flex gap-1 overflow-x-auto">
                {specificationCategories.map((category) => {
                  const IconComponent = category.icon;
                  const isSelected = selectedProductSpecCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedProductSpecCategory(category.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                        isSelected
                          ? `bg-${category.color}-100 text-${category.color}-700 border border-${category.color}-300`
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent size={14} />
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
              <div className="space-y-4">
                {/* Specifications Grid - Grouped by Type */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Plus size={16} className="text-blue-600" />
                    {specificationCategories.find(cat => cat.id === selectedProductSpecCategory)?.name}
                  </h3>
                  
                  {Object.entries(getSpecificationsByType(selectedProductSpecCategory)).map(([type, specs]) => {
                    if (specs.length === 0) return null;
                    
                    return (
                      <div key={type} className="mb-6">
                        <h4 className="text-xs font-medium text-gray-800 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {getTypeDisplayName(type)}
                          </span>
                          <span className="text-xs text-gray-500">({specs.length})</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {specs.map((spec) => {
                            const IconComponent = spec.icon;
                            const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
                            const currentValue = currentSpecs[spec.key] || '';
                            const isBoolean = spec.type === 'boolean';
                            
                            return (
                              <div key={spec.key} className="relative">
                                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                  <IconComponent size={12} className="text-gray-500" />
                                  {spec.name}
                                  {spec.unit && <span className="text-xs text-gray-500">({spec.unit})</span>}
                                </label>
                                
                                {isBoolean ? (
                                  <button
                                    type="button"
                                    onClick={() => updateProductSpecification(spec.key, !currentValue)}
                                    className={`w-full p-2 border rounded-md transition-all ${
                                      currentValue
                                        ? 'bg-green-50 border-green-300 text-green-800'
                                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center">
                                      <Check size={14} className={currentValue ? 'text-green-600' : 'text-gray-400'} />
                                    </div>
                                  </button>
                                ) : spec.type === 'select' && spec.options ? (
                                  <select
                                    value={currentValue as string}
                                    onChange={(e) => updateProductSpecification(spec.key, e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none text-xs"
                                  >
                                    <option value="">Select</option>
                                    {spec.options.map((option) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="relative">
                                    <input
                                      type={spec.type === 'number' ? 'number' : 'text'}
                                      value={currentValue as string}
                                      onChange={(e) => updateProductSpecification(spec.key, e.target.value)}
                                      placeholder={spec.placeholder || `Enter ${spec.name.toLowerCase()}`}
                                      className="w-full py-1.5 px-2 pr-6 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none text-xs"
                                      autoComplete="off"
                                      autoCorrect="off"
                                      spellCheck={false}
                                    />
                                    {currentValue && (
                                      <button
                                        type="button"
                                        onClick={() => updateProductSpecification(spec.key, '')}
                                        className="absolute right-1 top-1.5 text-red-500 hover:text-red-700"
                                        title="Clear value"
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Specification */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Plus size={16} className="text-gray-600" />
                    Custom
                  </h3>
                  
                  {showProductCustomInput ? (
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={productCustomAttributeInput}
                          onChange={(e) => setProductCustomAttributeInput(e.target.value)}
                          placeholder="Enter custom spec name..."
                          className="flex-1 py-1.5 px-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none text-xs"
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
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                        >
                          Add
                        </button>
                        <button 
                          type="button" 
                          onClick={cancelProductCustomAttribute} 
                          className="px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => { setShowProductCustomInput(true); setProductCustomAttributeInput(''); }} 
                      className="flex items-center gap-2 p-2 bg-white border border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors w-full"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">Add Custom</span>
                    </button>
                  )}
                </div>

                {/* Current Specifications Summary */}
                {(() => {
                  const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
                  const hasSpecs = Object.keys(currentSpecs).length > 0;
                  
                  return hasSpecs ? (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Check size={16} className="text-green-600" />
                        Current
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                          {Object.keys(currentSpecs).length}
                        </span>
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {Object.entries(currentSpecs).map(([key, value]) => (
                          <div key={key} className="bg-green-50 border border-green-200 rounded-md p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-green-800 capitalize truncate">
                                  {key.replace(/_/g, ' ')}
                                </div>
                                <div className="text-xs text-green-600 truncate">
                                  {String(value) || 'Not set'}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttributeFromProduct(key)}
                                className="ml-1 text-red-500 hover:text-red-700 flex-shrink-0"
                                title="Remove specification"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No Specifications Added</h3>
                      <p className="text-gray-500 text-xs">
                        Click the buttons above to add specifications for this product.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-600">
                  {(() => {
                    const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
                    return Object.keys(currentSpecs).length > 0 
                      ? `${Object.keys(currentSpecs).length} spec${Object.keys(currentSpecs).length !== 1 ? 's' : ''} added`
                      : 'No specs added yet';
                  })()}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductSpecificationsModal(false)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductSpecificationsModal(false);
                      toast.success('Product specifications saved successfully!');
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
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
