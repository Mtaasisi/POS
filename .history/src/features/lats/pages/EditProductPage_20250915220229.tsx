import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
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

import { validateProductData } from '../lib/databaseDiagnostics';

// Extracted components
import ProductInformationForm from '../components/product/ProductInformationForm';
import PricingAndStockForm from '../components/product/PricingAndStockForm';
import ProductImagesSection from '../components/product/ProductImagesSection';
import ProductVariantsSection from '../components/product/ProductVariantsSection';
import StorageLocationForm from '../components/product/StorageLocationForm';

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
  // Allow empty objects (for new images) or objects with either image_url or url
  return Object.keys(data).length === 0 || data.image_url || data.url;
}, {
  message: "Either image_url or url must be provided for non-empty image objects"
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
  sku: z.string().min(1, 'SKU must be provided').max(50, 'SKU must be less than 50 characters'),

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

// Context wrapper component to ensure AuthProvider is available
const EditProductPageWithAuth: React.FC = () => {
  try {
    const { currentUser } = useAuth();
    
    // If we can access useAuth without error, render the main component
    return <EditProductPageContent />;
  } catch (error) {
    // If AuthProvider is not available, show a loading state
    console.warn('AuthProvider not available, showing loading state:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }
};

// Main component content
const EditProductPageContent: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);

  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [currentErrors, setCurrentErrors] = useState<Record<string, string>>({});

  // Generate a temporary product ID for image uploads
  const [tempProductId] = useState(`temp-product-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // Initial form data
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: null,

    condition: '',
    description: '',
    specification: '', // Ensure this is always a string
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 2, // Set default min stock level to 2 pcs like AddProductPage
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
  const [originallyHadVariants, setOriginallyHadVariants] = useState(false); // Remember original intent
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
  const [originalProductName, setOriginalProductName] = useState<string>('');

  const { currentUser } = useAuth();

  // Generate auto SKU using utility function
  const generateAutoSKU = () => {
    return generateSKU();
  };

  // Update specification value for a variant
  const updateVariantSpecification = (variantIndex: number, specKey: string, value: string | boolean) => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes, [specKey]: value };
    updateVariant(variantIndex, 'attributes', newAttributes);
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
    
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load form data');
      }
    };

    loadData();
  }, []);

  // Load product data when productId changes
  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  // Check if product name exists
  const checkProductName = async (name: string) => {
    if (!name.trim()) {
      setNameExists(false);
      return;
    }

    // Don't check if the name hasn't changed from the original
    if (originalProductName && name.trim() === originalProductName.trim()) {
      setNameExists(false);
      return;
    }

    setIsCheckingName(true);
    try {
      const { data, error } = await supabase!
        .from('lats_products')
        .select('id')
        .ilike('name', `%${name.trim()}%`)
        .neq('id', productId) // Exclude current product when editing
        .limit(1);

      if (error) throw error;
      
      setNameExists(data && data.length > 0);
    } catch (error) {
      console.error('Error checking product name:', error);
    } finally {
      setIsCheckingName(false);
    }
  };



  // Ensure variants are always shown for products with original variants
  useEffect(() => {
    if (useVariants || originallyHadVariants) {
      setShowVariants(true);
    }
  }, [useVariants, originallyHadVariants]);

  // Handle name check with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name) {
        checkProductName(formData.name);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  const loadProductData = async () => {
    if (!productId) return;
    
    try {
      // First try to get product with images
      let { data: product, error } = await supabase!
        .from('lats_products')
        .select(`
          *,
          variants:lats_product_variants(*)
        `)
        .eq('id', productId)
        .single();

      if (error) {
        throw error;
      }
      
      if (product) {
        // Store the original product name for comparison
        setOriginalProductName(product.name || '');

        // Debug: Log the product data being loaded
        console.log('🔍 Loading product data:', {
          id: product.id,
          name: product.name,
          sku: product.sku,
          originalSku: product.sku
        });
        
        setFormData({
          name: product.name || '',
          description: product.description || '',
          specification: (() => {
            try {
              if (product.specification) {
                // If it's already a string, validate it's JSON
                if (typeof product.specification === 'string') {
                  JSON.parse(product.specification);
                  return product.specification;
                }
                // If it's an object, stringify it
                if (typeof product.specification === 'object') {
                  return JSON.stringify(product.specification);
                }
              }
              return '';
            } catch {
              // If JSON parsing fails, return empty string
              return '';
            }
          })(),
          sku: product.sku || '',
          categoryId: product.category_id || null,
      
          condition: product.condition || '',
          
          price: product.selling_price || 0,
          costPrice: product.cost_price || 0,
          stockQuantity: product.stock_quantity || 0,
          minStockLevel: product.min_stock_level || 0,
          storageRoomId: product.storage_room_id || '',
          shelfId: product.store_shelf_id || '',
          images: (() => {
            // Handle images from product_images table (array of objects)
            if (Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'object') {
              return product.images;
            }
            // Handle images from lats_products.images column (array of strings)
            if (Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'string') {
              return product.images.map((url: string, index: number) => ({
                id: `fallback-${index}`,
                url: url,
                fileName: `image-${index + 1}`,
                isPrimary: index === 0
              }));
            }
            return [];
          })(),
          metadata: product.attributes || {},
          variants: []
        });
        
        // Debug: Log the form data after setting
        console.log('🔍 Form data set with SKU:', product.sku || '');
        
        // Determine if product originally had variants
        const hadVariantsOriginally = (
          // Check metadata first (most reliable)
          product.metadata?.useVariants === true ||
          // Check if product was designed for variants by looking for:
          // 1. Multiple variants, OR
          // 2. Any variant with meaningful data, OR 
          // 3. A has_variants flag if it exists in the product
          product.has_variants === true || 
          (product.variants && product.variants.length > 1) ||
          (product.variants && product.variants.some((variant: any) => 
            variant.name || 
            (variant.sku && variant.sku !== product.sku) ||
            (variant.attributes && Object.keys(variant.attributes).length > 0)
          ))
        );
        
        setOriginallyHadVariants(hadVariantsOriginally);
        // Only log in development mode to reduce console noise
        if (import.meta.env.MODE === 'development') {
          console.log('🔍 Product variant analysis:', {
            productId: product.id,
            variantCount: product.variants?.length || 0,
            hadVariantsOriginally,
            hasVariantsFlag: product.has_variants,
            metadataUseVariants: product.metadata?.useVariants,
            originalAttributes: product.attributes
          });
        }
        
        // Load variants if they exist
        if (product.variants && product.variants.length > 0) {
          const processedVariants = product.variants.map((variant: any) => ({
            name: variant.name || '',
            sku: variant.sku || '',
            costPrice: variant.cost_price || 0,
            price: variant.selling_price || 0,
            stockQuantity: variant.quantity || 0,
            minStockLevel: variant.min_quantity || 0,
            specification: variant.attributes?.specification || '',
            attributes: variant.attributes || {}
          }));
          
          setVariants(processedVariants);
          
          // Respect the original intention - if product originally had variants, keep them enabled
          setUseVariants(hadVariantsOriginally);
          setShowVariants(hadVariantsOriginally);
        } else {
          // No variants in database
          setOriginallyHadVariants(false);
          setUseVariants(false);
          setShowVariants(false);
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product data');
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    try {
      // Filter out invalid image objects
      const validImages = formData.images.filter(img => {
        // Keep images that have either image_url or url, or are completely empty objects
        return Object.keys(img).length === 0 || img.image_url || img.url;
      });
      
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
      
      const dataToValidate = {
        ...formData,
        images: validImages,
        variants: useVariants ? variants : []
      };
      
      console.log('Validating form data:', dataToValidate);
      
      dynamicSchema.parse(dataToValidate);

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
        console.log('Validation errors:', error.issues);
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
      }
      
      console.log('Setting current errors:', errors);
      setCurrentErrors(errors);
      return false;
    }
  };

  // Submit form
  const handleSubmit = async () => {
    setHasSubmitted(true);
    
    if (!validateForm()) {
      console.log('Form validation failed. Current errors:', currentErrors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Only check for name conflicts if the name has actually changed
    if (nameExists && formData.name.trim() !== originalProductName.trim()) {
      toast.error('Another product with a similar name already exists');
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

      // Prepare comprehensive product data with only fields that exist in the database
      const productData: any = {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.categoryId || null,

        condition: formData.condition || 'new',
        total_quantity: totalQuantity,
        total_value: totalValue,
        storage_room_id: formData.storageRoomId || null,
        store_shelf_id: formData.shelfId || null,
        images: formData.images || [],
        tags: [],
        attributes: formData.metadata || {}
      };

      // Only add fields that exist in the database schema
      if (formData.specification) {
        productData.specification = formData.specification;
      }
      if (formData.sku) {
        productData.sku = formData.sku;
      }
      if (formData.costPrice !== undefined) {
        productData.cost_price = formData.costPrice;
      }
      if (formData.price !== undefined) {
        productData.selling_price = formData.price;
      }
      if (formData.stockQuantity !== undefined) {
        productData.stock_quantity = formData.stockQuantity;
      }
      if (formData.minStockLevel !== undefined) {
        productData.min_stock_level = formData.minStockLevel;
      }

      // Fallback: If validation fails, try with only basic fields
      const basicProductData = {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.categoryId || null,
        images: formData.images || [],
        tags: [],
        attributes: formData.metadata || {}
      };

      console.log('Product data being updated:', productData);
      console.log('Product data keys:', Object.keys(productData));

      // Validate the product data against the database schema
      const validation = await validateProductData(productData);
      if (!validation.valid) {
        console.error('❌ Product data validation failed:', validation.errors);
        toast.error(`Database schema mismatch: ${validation.errors.join(', ')}`);
        return;
      }

      let { data: updatedProduct, error } = await retryWithBackoff(async () => {
        return await supabase!
          .from('lats_products')
          .update(productData)
          .eq('id', productId)
          .select()
          .single();
      });

      // If the full update fails, try with basic fields only
      if (error) {
        console.log('❌ Full update failed, trying with basic fields only:', error);
        console.log('Basic product data:', basicProductData);
        
        const basicResult = await retryWithBackoff(async () => {
          return await supabase!
            .from('lats_products')
            .update(basicProductData)
            .eq('id', productId)
            .select()
            .single();
        });
        
        if (basicResult.error) {
          throw basicResult.error;
        }
        
        updatedProduct = basicResult.data;
        console.log('✅ Basic update succeeded');
      }

      // Save images to product_images table if we have images
      if (formData.images && formData.images.length > 0 && updatedProduct) {
        console.log('Saving images to product_images table:', formData.images);
        
        // First delete existing images for this product
        const { error: deleteImagesError } = await supabase!
          .from('product_images')
          .delete()
          .eq('product_id', productId);

        if (deleteImagesError) {
          console.error('Error deleting existing images:', deleteImagesError);
        }
        
        const imageData = formData.images.map((image, index) => ({
          product_id: updatedProduct.id,
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
          toast.error('Product updated but failed to save images');
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
          console.log('Updating temporary image records for product:', updatedProduct.id);
          
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

      // If using variants, update them
      if (useVariants && variants.length > 0 && updatedProduct) {
        // First delete existing variants
        const { error: deleteError } = await supabase!
          .from('lats_product_variants')
          .delete()
          .eq('product_id', productId);

        if (deleteError) {
          console.error('Error deleting existing variants:', deleteError);
        }

        // Then insert new variants
        const variantData = variants.map(variant => ({
          product_id: productId,
          sku: variant.sku,
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

        const { error: variantError } = await retryWithBackoff(async () => {
          return await supabase!
            .from('lats_product_variants')
            .insert(variantData);
        });

        if (variantError) {
          console.error('Error updating variants:', variantError);
          toast.error('Product updated but failed to update variants');
        }
      }

      toast.success('Product updated successfully!');
      navigate('/lats/unified-inventory');
      
    } catch (error) {
      console.error('Error updating product:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error('Failed to update product. Please try again.');
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

  // Remove attribute from a variant
  const removeAttributeFromVariant = (variantIndex: number, attributeName: string) => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes };
    delete newAttributes[attributeName];
    updateVariant(variantIndex, 'attributes', newAttributes);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
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

  // Handle custom product attribute submission
  const handleProductCustomAttributeSubmit = () => {
    if (productCustomAttributeInput.trim()) {
      const cleanName = productCustomAttributeInput.trim().toLowerCase().replace(/\s+/g, '_');
      addAttributeToProduct(cleanName);
      setShowProductCustomInput(false);
      setProductCustomAttributeInput('');
    }
  };

  // Cancel custom product attribute input
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
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/lats/unified-inventory" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600">Update product information and details</p>
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
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>

            {/* Variant Specifications Modal */}
      {showVariantSpecificationsModal && currentVariantIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-2"
          role="dialog"
          aria-modal="true"
          aria-labelledby="variant-specifications-modal-title"
        >
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[85vh] overflow-hidden mx-auto">
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  <div>
                    <h2 id="variant-specifications-modal-title" className="text-lg font-semibold">
                      Variant Specs
                    </h2>
                    <p className="text-blue-100 text-xs">
                      {variants[currentVariantIndex]?.name || `Variant ${currentVariantIndex + 1}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVariantSpecificationsModal(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
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
                  const isSelected = selectedSpecCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedSpecCategory(category.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        isSelected
                          ? `bg-${category.color}-500 text-white`
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
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
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
              <div className="space-y-4">
                {/* Specifications Grid - Grouped by Type */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Plus size={16} className="text-blue-600" />
                    {specificationCategories.find(cat => cat.id === selectedSpecCategory)?.name}
                  </h3>
                  
                  {Object.entries(getSpecificationsByType(selectedSpecCategory)).map(([type, specs]) => {
                    if (specs.length === 0) return null;
                    
                    return (
                      <div key={type} className="mb-4">
                        <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {getTypeDisplayName(type)}
                          </span>
                          <span className="text-xs text-gray-500">({specs.length})</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {specs.map((spec) => {
                            const IconComponent = spec.icon;
                            const currentValue = variants[currentVariantIndex]?.attributes?.[spec.key] || '';
                            const isBoolean = spec.type === 'boolean';
                            
                            return (
                              <div key={spec.key} className="bg-white border border-gray-200 rounded-lg p-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                                  <IconComponent size={12} className="text-gray-500" />
                                  {spec.name}
                                  {spec.unit && <span className="text-xs text-gray-500">({spec.unit})</span>}
                                </label>
                                
                                {isBoolean ? (
                                  <button
                                    type="button"
                                    onClick={() => updateVariantSpecification(currentVariantIndex, spec.key, !currentValue)}
                                    className={`w-full p-2 border rounded-lg transition-colors ${
                                      currentValue
                                        ? 'bg-green-50 border-green-300 text-green-800'
                                        : 'bg-white border-gray-300 text-gray-600 hover:border-blue-500 hover:bg-blue-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center">
                                      <Check size={14} className={currentValue ? 'text-green-600' : 'text-gray-400'} />
                                    </div>
                                  </button>
                                ) : spec.type === 'select' && spec.options ? (
                                  <select
                                    value={currentValue as string}
                                    onChange={(e) => updateVariantSpecification(currentVariantIndex, spec.key, e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xs"
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
                                      onChange={(e) => updateVariantSpecification(currentVariantIndex, spec.key, e.target.value)}
                                      placeholder={spec.placeholder || `Enter ${spec.name.toLowerCase()}`}
                                      className="w-full py-1.5 px-2 pr-6 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xs"
                                      autoComplete="off"
                                      autoCorrect="off"
                                      spellCheck={false}
                                    />
                                    {currentValue && (
                                      <button
                                        type="button"
                                        onClick={() => updateVariantSpecification(currentVariantIndex, spec.key, '')}
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
                  
                  {showCustomInput === currentVariantIndex ? (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customAttributeInput}
                          onChange={(e) => setCustomAttributeInput(e.target.value)}
                          placeholder="Enter custom spec name..."
                          className="flex-1 py-1.5 px-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xs"
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
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                        >
                          Add
                        </button>
                        <button 
                          type="button" 
                          onClick={cancelCustomAttribute} 
                          className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => { setShowCustomInput(currentVariantIndex); setCustomAttributeInput(''); }} 
                      className="flex items-center gap-2 p-2 bg-white border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors w-full"
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
                        <div key={key} className="bg-green-50 border border-green-200 rounded-lg p-2">
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
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
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
                    className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVariantSpecificationsModal(false);
                      toast.success('Variant specifications saved successfully!');
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
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
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-2"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-specifications-modal-title"
        >
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[85vh] overflow-hidden mx-auto">
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <div>
                    <h2 id="product-specifications-modal-title" className="text-lg font-semibold">
                      Product Specs
                    </h2>
                    <p className="text-blue-100 text-xs">
                      Add product specifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProductSpecificationsModal(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
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
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        isSelected
                          ? `bg-${category.color}-500 text-white`
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
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
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
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
                      <div key={type} className="mb-4">
                        <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {getTypeDisplayName(type)}
                          </span>
                          <span className="text-xs text-gray-500">({specs.length})</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {specs.map((spec) => {
                            const IconComponent = spec.icon;
                            const currentSpecs = formData.specification ? JSON.parse(formData.specification) : {};
                            const currentValue = currentSpecs[spec.key] || '';
                            const isBoolean = spec.type === 'boolean';
                            
                            return (
                              <div key={spec.key} className="bg-white border border-gray-200 rounded-lg p-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                                  <IconComponent size={12} className="text-gray-500" />
                                  {spec.name}
                                  {spec.unit && <span className="text-xs text-gray-500">({spec.unit})</span>}
                                </label>
                                
                                {isBoolean ? (
                                  <button
                                    type="button"
                                    onClick={() => updateProductSpecification(spec.key, !currentValue)}
                                    className={`w-full p-2 border rounded-lg transition-colors ${
                                      currentValue
                                        ? 'bg-green-50 border-green-300 text-green-800'
                                        : 'bg-white border-gray-300 text-gray-600 hover:border-blue-500 hover:bg-blue-50'
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
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xs"
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
                                      className="w-full py-1.5 px-2 pr-6 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xs"
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
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={productCustomAttributeInput}
                          onChange={(e) => setProductCustomAttributeInput(e.target.value)}
                          placeholder="Enter custom spec name..."
                          className="flex-1 py-1.5 px-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xs"
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
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                        >
                          Add
                        </button>
                        <button 
                          type="button" 
                          onClick={cancelProductCustomAttribute} 
                          className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => { setShowProductCustomInput(true); setProductCustomAttributeInput(''); }} 
                      className="flex items-center gap-2 p-2 bg-white border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors w-full"
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
                          <div key={key} className="bg-green-50 border border-green-200 rounded-lg p-2">
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
                    className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductSpecificationsModal(false);
                      toast.success('Product specifications saved successfully!');
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProductPageWithAuth;
