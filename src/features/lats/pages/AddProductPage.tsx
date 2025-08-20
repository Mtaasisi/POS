import React, { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { SimpleImageUpload } from '../../../components/SimpleImageUpload';
import PriceInput from '../../../shared/components/ui/PriceInput';
import { toast } from 'react-hot-toast';
import { 
  Package, Tag, DollarSign, Hash, FileText, Layers, 
  AlertTriangle as AlertIcon, Eye, Edit, MessageCircle, 
  Users, Star, UserPlus, Plus, X, Save, Camera,
  Upload, Image as ImageIcon, Trash2, CheckCircle,
  RefreshCw, QrCode, ArrowLeft, Settings, Smartphone,
  User, Phone, Mail, MapPin, Calendar, Clock, ChevronDown,
  ChevronUp, Brain, Zap, Lightbulb, Search, Sparkles, Store,
  Check, Move, ExternalLink, Palette, HardDrive, Cpu, 
  Monitor, Battery, Ruler
} from 'lucide-react';
import { useInventoryStore } from '../stores/useInventoryStore';

import BrandInput from '../../shared/components/ui/BrandInput';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { retryWithBackoff } from '../../../lib/supabaseClient';
import { getActiveBrands, Brand } from '../../../lib/brandApi';

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
  name: z.string().min(1, 'Product name must be provided').max(100, 'Product name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  sku: z.string().min(1, 'SKU must be provided').max(50, 'SKU must be less than 50 characters'),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'Category must be selected'),
  brandId: z.string().optional(),
  supplierId: z.string().optional(),
  condition: z.string().min(1, 'Product condition must be selected'),
  storeShelf: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  costPrice: z.number().min(0, 'Cost price must be 0 or greater'),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater'),
  minStockLevel: z.number().min(0, 'Minimum stock level must be 0 or greater'),

  images: z.array(ProductImageSchema).default([]),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  variants: z.array(z.any()).optional().default([])
});

type ProductFormData = z.infer<typeof productFormSchema>;
type ProductImage = z.infer<typeof ProductImageSchema>;

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
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
  // State for variants
  const [variants, setVariants] = useState<any[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [useVariants, setUseVariants] = useState(false);
  const [hasOriginalVariants, setHasOriginalVariants] = useState(false);
  const [isReorderingVariants, setIsReorderingVariants] = useState(false);
  const [draggedVariantIndex, setDraggedVariantIndex] = useState<number | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const { currentUser, refreshSession } = useAuth();
  const [tempProductId, setTempProductId] = useState('temp-product-' + Date.now());
  const [galleryKey, setGalleryKey] = useState(0); // Add this to force ImageGallery refresh
  const hasGeneratedSKU = useRef(false); // Track if we've already generated SKU for current name/category

  // Additional state variables like NewDevicePage
  const [isLoading, setIsLoading] = useState(false);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [customAttributeInput, setCustomAttributeInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState<number | null>(null);
  // Product-level specifications (for non-variant mode)
  const [productCustomAttributeInput, setProductCustomAttributeInput] = useState('');
  const [showProductCustomInput, setShowProductCustomInput] = useState(false);

  // Internal notes visibility
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  
  // Specifications modal visibility
  const [showSpecificationsModal, setShowSpecificationsModal] = useState(false);
  // Variant specifications modal visibility
  const [showVariantSpecificationsModal, setShowVariantSpecificationsModal] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState<number | null>(null);

  // Initial form data
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brand: '',
    supplierId: '',
    condition: '',
    storeShelf: '',
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 5,
    internalNotes: '',

    images: [] as any[],
    metadata: {} as Record<string, any>,
    // product-level attributes when not using variants
    attributes: {} as Record<string, any>
  });

  // Watch specific form values for completion calculation
  const name = formData.name;
  const sku = formData.sku;
  const categoryId = formData.categoryId;
  const condition = formData.condition;
  const price = formData.price;
  const costPrice = formData.costPrice;
  const stockQuantity = formData.stockQuantity;
  const minStockLevel = formData.minStockLevel;

  // Load data on mount
  useEffect(() => {
    (async () => {
      // Run sequentially to avoid global isDataLoading guard skipping later loads
      await loadCategories();
      await loadBrands();
      await loadSuppliers();
      await loadLocalBrands();
    })();
  }, []); // Empty dependency array to run only once on mount
  // Note: Store functions are not memoized, so including them in deps would cause infinite loops

  // Load brands directly using brandApi
  const loadLocalBrands = async () => {
    setBrandsLoading(true);
    try {
      const brandsData = await getActiveBrands();
      setLocalBrands(brandsData);
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

  // Utility function to safely insert image records
  const insertImageRecordSafely = async (image: any, productId: string) => {
    try {
      // Check if image record already exists
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('id, image_url')
        .eq('product_id', productId);

      // Check if this exact image URL already exists
      const imageUrl = image.image_url || image.url;
      const imageAlreadyExists = existingImages?.some(existing => 
        existing.image_url === imageUrl
      );

      if (imageAlreadyExists) {
        return { success: true, skipped: true };
      }

      // Insert new image record
      const { error: imageError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: imageUrl,
          thumbnail_url: image.thumbnail_url || image.thumbnailUrl || imageUrl,
          file_name: image.file_name || image.fileName || 'product-image',
          file_size: image.file_size || image.fileSize || 0,
          is_primary: image.is_primary || image.isPrimary || false,
          uploaded_by: currentUser?.id || '',
          mime_type: image.mimeType || 'image/jpeg'
        })
        .select()
        .single();

      if (imageError) {
        // Handle specific error types
        if (imageError.code === '23505' || imageError.code === '409') {
          return { success: true, skipped: true };
        } else {
          console.error('❌ Image record error:', imageError.message);
          return { success: false, error: imageError.message };
        }
      } else {
        return { success: true, skipped: false };
      }
    } catch (error) {
      console.error('Exception during image insertion:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    setHasSubmitted(true);
    const { valid } = validateForm();
    if (!valid) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find brand ID from brand name
      const selectedBrand = localBrands.find(brand => brand.name === formData.brand);
      const brandId = selectedBrand?.id || null;

      // Build variants payload: use explicit variants if provided, otherwise fall back to single variant from main fields
      const variantsPayload = (useVariants && variants && variants.length > 0)
        ? variants.map((v: any, index: number) => ({
            sku: (v.sku && `${v.sku}`.trim()) || (formData.sku ? `${formData.sku}-${index + 1}` : ''),
            name: v.name || formData.name,
            barcode: v.barcode || v.sku || formData.sku, // Default to SKU if no barcode
            sellingPrice: v.price || 0,
            costPrice: v.costPrice || 0,
            quantity: v.stockQuantity || 0,
            minQuantity: v.minStockLevel || 5,
            attributes: v.attributes || {}
          }))
        : [{
            sku: formData.sku,
            name: formData.name,
            barcode: formData.barcode || formData.sku, // Default to SKU if no barcode
            sellingPrice: formData.price || 0,
            costPrice: formData.costPrice || 0,
            quantity: formData.stockQuantity || 0,
            minQuantity: formData.minStockLevel || 5,
            attributes: formData.attributes || {}
          }];

      // Create product data using the proper structure
      const productData = {
        name: formData.name,
        sku: formData.sku,
        categoryId: formData.categoryId,
        brandId: brandId,
        supplierId: formData.supplierId || null,
        storeShelf: formData.storeShelf || null,
        internalNotes: formData.internalNotes || '',
        variants: variantsPayload,
        images: formData.images || [],
        attributes: formData.attributes || {},
        isActive: true
      };

      // Use the store's createProduct function to ensure proper cache management
      const response = await createProduct(productData);
      
      if (!response.ok) {
        throw new Error(response.message || 'Failed to create product');
      }
      
      const product = response.data;

      // If we have images and this was a temporary product, we need to update the image records
      if (product && formData.images && formData.images.length > 0 && tempProductId.startsWith('temp-product-')) {
        try {
          let successCount = 0;
          let skippedCount = 0;
          let errorCount = 0;

          // Update image records to point to the new product ID
          for (const image of formData.images) {
            if (image.id && image.id.startsWith('temp-')) {
              const result = await insertImageRecordSafely(image, product.id);
              
              if (result.success) {
                if (result.skipped) {
                  skippedCount++;
                } else {
                  successCount++;
                }
              } else {
                errorCount++;
                console.error('❌ Failed to insert image record:', result.error);
              }
            }
          }
        } catch (error) {
          console.error('Error updating image records:', error);
          // Don't fail the product creation if image update fails
        }
      }

      // Show success message and summary modal
      toast.success('Product created successfully!');
      setCreatedProduct(product);
      setShowSummaryModal(true);
      
      // Force refresh the inventory data to ensure new product appears
      const { loadProducts } = useInventoryStore.getState();
      await loadProducts();

    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Automatic SKU/Barcode generation
  const generateAutoSKU = () => {
    const name = formData.name;
    const categoryId = formData.categoryId;
    
    if (!name || !categoryId) {
      return;
    }

    // Generate SKU based on name and category
    const category = categories.find(cat => cat.id === categoryId);
    const categoryPrefix = category ? category.name.substring(0, 3).toUpperCase() : 'PROD';
    const namePrefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-4);
    
    const generatedSKU = `${categoryPrefix}-${namePrefix}-${timestamp}`;
    
    // Set both SKU and barcode to the same value (they are now one field)
    setFormData(prev => ({ 
      ...prev, 
      sku: generatedSKU,
      barcode: generatedSKU 
    }));
  };

  const clearSKUAndBarcode = () => {
    setFormData(prev => ({ ...prev, sku: '', barcode: '' }));
  };

  // Auto-generate SKU when name or category changes
  useEffect(() => {
    const name = formData.name;
    const categoryId = formData.categoryId;
    const currentSku = formData.sku;
    
    // Only auto-generate if both name and category are filled and SKU is empty
    if (name && categoryId && !currentSku && !hasGeneratedSKU.current) {
      hasGeneratedSKU.current = true;
      generateAutoSKU();
    }
    
    // Reset the flag when name or category changes
    if (!name || !categoryId) {
      hasGeneratedSKU.current = false;
    }
  }, [formData.name, formData.categoryId]); // Remove formData.sku to prevent infinite loop

  // Form validation function - memoized to prevent infinite re-renders
  const validateForm = React.useCallback(() => {
    const errors: { [key: string]: boolean } = {};
    let valid = true;
    
    if (!formData.name.trim()) {
      errors.name = true;
      valid = false;
    }
    // Brand is now optional for internal use
    // if (!formData.brand.trim()) {
    //   errors.brand = true;
    //   valid = false;
    // }
    // SKU validation depends on whether variants are used
    if (useVariants) {
      if (!variants || variants.length === 0) {
        errors.variants = true;
      valid = false;
    }
    } else {
    if (!formData.sku.trim()) {
      errors.sku = true;
      valid = false;
      }
    }
    if (!formData.categoryId) {
      errors.categoryId = true;
      valid = false;
    }
    if (!formData.condition) {
      errors.condition = true;
      valid = false;
    }
    if (!formData.supplierId) {
      errors.supplierId = true;
      valid = false;
    }
    if (formData.price < 0) {
      errors.price = true;
      valid = false;
    }
    if (formData.costPrice < 0) {
      errors.costPrice = true;
      valid = false;
    }
    if (formData.stockQuantity < 0) {
      errors.stockQuantity = true;
      valid = false;
    }
    if (formData.minStockLevel < 0) {
      errors.minStockLevel = true;
      valid = false;
    }
    
    return { valid, errors };
  }, [
    formData.name,
    formData.brand,
    formData.sku,
    formData.categoryId,
    formData.condition,
    formData.supplierId,
    formData.price,
    formData.costPrice,
    formData.stockQuantity,
    formData.minStockLevel,
    useVariants,
    variants
  ]);

  // Check if form is valid for button state
  const isFormValid = React.useMemo(() => {
    const { valid } = validateForm();
    return valid;
  }, [validateForm]);

  // Get current validation errors for display - only show after submission
  const currentErrors = React.useMemo(() => {
    if (!hasSubmitted) return {};
    const { errors } = validateForm();
    return errors;
  }, [validateForm, hasSubmitted]);

  // Calculate form completion percentage
  const calculateCompletion = () => {
    const fields = [
      name,
      sku,
      categoryId,
      condition,
      price,
      costPrice,
      stockQuantity,
      minStockLevel
    ];
    
    const filledFields = fields.filter(field => {
      if (typeof field === 'string') {
        return field && field.trim().length > 0;
      }
      return field !== null && field !== undefined && field >= 0;
    });
    
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  // Variant management functions
  const addVariant = () => {
    const newVariant: any = {
      sku: '',
      name: `Variant ${variants.length + 1}`,
      barcode: '',
      price: formData.price || 0,
      costPrice: formData.costPrice || 0,
      stockQuantity: formData.stockQuantity || 0,
      minStockLevel: formData.minStockLevel || 5,
      
      attributes: {}
    };

    // Auto-generate SKU for variant
    const generatedSKU = generateVariantSKU(variants.length + 1);
    newVariant.sku = generatedSKU;
    newVariant.barcode = generatedSKU; // Sync barcode with SKU

    setVariants(prev => [...prev, newVariant]);
  };

  // Generate SKU for variants
  const generateVariantSKU = (variantNumber: number) => {
    const name = formData.name;
    const categoryId = formData.categoryId;
    
    if (!name || !categoryId) {
      return `VAR-${variantNumber.toString().padStart(2, '0')}`;
    }

    // Generate SKU based on name, category, and variant number
    const category = categories.find(cat => cat.id === categoryId);
    const categoryPrefix = category ? category.name.substring(0, 3).toUpperCase() : 'PROD';
    const namePrefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const variantSuffix = variantNumber.toString().padStart(2, '0');
    
    return `${categoryPrefix}-${namePrefix}-V${variantSuffix}`;
  };

  // Add attribute to a variant
  const addAttributeToVariant = (variantIndex: number, attributeName: string) => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes, [attributeName]: '' };
    updateVariant(variantIndex, 'attributes', newAttributes);
  };

  // Add custom attribute to a variant
  const addCustomAttributeToVariant = (variantIndex: number) => {
    setShowCustomInput(variantIndex);
    setCustomAttributeInput('');
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

  // Variant reordering functions
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedVariantIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedVariantIndex === null || draggedVariantIndex === dropIndex) return;

    const newVariants = [...variants];
    const draggedVariant = newVariants[draggedVariantIndex];
    
    // Remove the dragged item
    newVariants.splice(draggedVariantIndex, 1);
    
    // Insert at the new position
    newVariants.splice(dropIndex, 0, draggedVariant);
    
    setVariants(newVariants);
    setDraggedVariantIndex(null);
  };

  const toggleReorderMode = () => {
    setIsReorderingVariants(!isReorderingVariants);
    setDraggedVariantIndex(null);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter((_, i) => i !== index));
    } else {
      toast.error('At least one variant must be present');
    }
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  // Price field focus handlers
  const handlePriceFocus = (field: 'price' | 'costPrice') => {
    const currentValue = formData[field];
    if (currentValue === 0) {
      setFormData(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Wrapper functions for onFocus events
  const handlePriceFocusWrapper = () => handlePriceFocus('price');
  const handleCostPriceFocusWrapper = () => handlePriceFocus('costPrice');

  // Number formatting functions
  const formatNumber = (value: number | string): string => {
    if (!value || value === 0) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const parseNumber = (value: string): number => {
    if (!value) return 0;
    const cleanValue = value.replace(/,/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  };

  const handlePriceChange = (field: 'price' | 'costPrice', value: string) => {
    // Don't format while typing, only store the raw number
    const numericValue = parseNumber(value);
    setFormData(prev => ({ ...prev, [field]: numericValue }));
  };

  const handlePriceBlur = (field: 'price' | 'costPrice') => {
    const currentValue = formData[field];
    if (currentValue === null || currentValue === undefined) {
      setFormData(prev => ({ ...prev, [field]: 0 }));
    }
  };

  // Variant price field handlers
  const handleVariantPriceFocus = (index: number, field: 'price' | 'costPrice') => {
    const variant = variants[index];
    const currentValue = variant[field];
    if (currentValue === 0 || currentValue === '0') {
      updateVariant(index, field, '');
    }
  };

  const handleVariantPriceBlur = (index: number, field: 'price' | 'costPrice') => {
    const variant = variants[index];
    const currentValue = variant[field];
    if (currentValue === '' || currentValue === null || currentValue === undefined) {
      updateVariant(index, field, 0);
    }
  };

  const handleVariantPriceChange = (index: number, field: 'price' | 'costPrice', value: string) => {
    // Don't format while typing, only store the raw number
    const numericValue = parseNumber(value);
    updateVariant(index, field, numericValue);
  };

  // QR Code functions
  const generateQRCode = (productId: string, productName: string) => {
    const qrData = JSON.stringify({
      id: productId,
      name: productName,
      type: 'product'
    });
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  const printQRCode = (productId: string, productName: string) => {
    const qrUrl = generateQRCode(productId, productName);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Product QR Code - ${productName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              border: 2px solid #333;
              padding: 20px;
              margin: 20px auto;
              max-width: 300px;
              background: white;
            }
            .qr-code {
              margin: 10px 0;
            }
            .product-info {
              margin: 10px 0;
              font-size: 14px;
            }
            .product-name {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .product-id {
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .qr-container { 
                border: none; 
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="product-name">${productName}</div>
            <div class="qr-code">
              <img src="${qrUrl}" alt="QR Code" width="200" height="200">
            </div>
            <div class="product-info">
              <div class="product-id">Product ID: ${productId}</div>
              <div>Scan to view product details</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <GlassCard className="mb-6">
          {/* Unified Product Form */}
          <div className="space-y-6">
            {/* Product Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                Product Information
              </h3>
              
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brand */}
                  <div>
                    <label 
                      htmlFor="brand-input"
                      className="block mb-2 font-medium text-gray-700"
                    >
                      Brand (optional)
                    </label>
                    <BrandInput
                      value={formData.brand}
                      onChange={val => setFormData(prev => ({ ...prev, brand: val }))}
                      placeholder="Brand"
                      className="w-full"
                    />
                  </div>
                  
                  {/* Product Name & Model */}
                  <div>
                    <label 
                      htmlFor="product-name"
                      className={`block mb-2 font-medium ${currentErrors.name ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Product Name & Model *
                    </label>
                    <div className="relative">
                      <input
                        id="product-name"
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                          currentErrors.name ? 'border-red-500 focus:border-red-600' : 
                          !formData.name && hasSubmitted ? 'border-yellow-300 focus:border-yellow-500' : 
                          'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="Product name"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        aria-describedby={
                          isCheckingName ? "name-checking" :
                          nameExists ? "name-exists" :
                          !formData.name && hasSubmitted ? "name-required" : undefined
                        }
                        aria-invalid={currentErrors.name || nameExists}
                      />
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      {isCheckingName && (
                        <RefreshCw 
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" 
                          size={18}
                          aria-label="Checking product name availability"
                        />
                      )}
                      {nameExists && !isCheckingName && (
                        <AlertIcon 
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500" 
                          size={18}
                          aria-label="Product name already exists"
                        />
                      )}
                    </div>
                    
                    {/* Status messages */}
                    {isCheckingName && (
                      <div id="name-checking" className="text-blue-600 text-sm mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Checking name availability...</span>
                        </div>
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
                            const currentName = formData.name;
                            const suggestedName = `${currentName} (${Date.now().toString().slice(-4)})`;
                            setFormData(prev => ({ ...prev, name: suggestedName }));
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm underline font-medium"
                        >
                          Suggest alternative name
                        </button>
                      </div>
                    )}
                    
                    {!formData.name && !isCheckingName && !nameExists && hasSubmitted && (
                      <div id="name-required" className="text-yellow-600 text-sm mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        Product name must be provided
                      </div>
                    )}
                  </div>
                  </div>
                  


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* SKU/Barcode (Combined Field) */}
                  <div>
                    <label 
                      htmlFor="sku-input"
                      className={`block mb-2 font-medium ${(!useVariants && currentErrors.sku) ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      {useVariants ? 'Base SKU/Barcode (optional for variants)' : 'SKU/Barcode *'}
                    </label>
                    <div className="relative">
                      <input
                        id="sku-input"
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                          (!useVariants && currentErrors.sku) ? 'border-red-500 focus:border-red-600' : 
                          (!useVariants && !formData.sku && hasSubmitted) ? 'border-yellow-300 focus:border-yellow-500' : 
                          'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="SKU/Barcode"
                        value={formData.sku}
                        onChange={e => {
                          const newValue = e.target.value.toUpperCase();
                          setFormData(prev => ({ 
                            ...prev, 
                            sku: newValue,
                            barcode: newValue // Automatically sync barcode with SKU
                          }));
                        }}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        aria-describedby={!useVariants && !formData.sku && hasSubmitted ? "sku-required" : undefined}
                        aria-invalid={!useVariants && currentErrors.sku}
                      />
                      <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                    {!useVariants && !formData.sku && hasSubmitted && (
                      <div id="sku-required" className="text-yellow-600 text-sm mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        SKU/Barcode must be provided
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      SKU and barcode are automatically synchronized
                    </div>
                  </div>
                  
                  {/* Category */}
                  <div>
                    <label 
                      htmlFor="category-select"
                      className={`block mb-2 font-medium ${currentErrors.categoryId ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Category *
                    </label>
                    <select
                      id="category-select"
                      className={`w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                        currentErrors.categoryId ? 'border-red-500 focus:border-red-600' : 
                        !formData.categoryId && hasSubmitted ? 'border-yellow-300 focus:border-yellow-500' : 
                        'border-gray-300 focus:border-blue-500'
                      }`}
                      value={formData.categoryId}
                      onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                      aria-describedby={!formData.categoryId && hasSubmitted ? "category-required" : undefined}
                      aria-invalid={currentErrors.categoryId}
                    >
                      <option value="">Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {!formData.categoryId && hasSubmitted && (
                      <div id="category-required" className="text-yellow-600 text-sm mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        Category must be selected
                      </div>
                    )}
                  </div>
                  

                  
                  {/* Storage Location */}
                  <div>
                    <label htmlFor="store-shelf" className="block mb-2 font-medium text-gray-700">
                      Storage Location
                    </label>
                    <input
                      id="store-shelf"
                      type="text"
                      className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Storage location"
                      value={formData.storeShelf}
                      onChange={e => setFormData(prev => ({ ...prev, storeShelf: e.target.value }))}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                  
                  {/* Supplier */}
                  <div>
                    <label 
                      htmlFor="supplier-select" 
                      className={`block mb-2 font-medium ${currentErrors.supplierId ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Supplier *
                    </label>
                    <select
                      id="supplier-select"
                      className={`w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                        currentErrors.supplierId ? 'border-red-500 focus:border-red-600' : 
                        !formData.supplierId && hasSubmitted ? 'border-yellow-300 focus:border-yellow-500' : 
                        'border-gray-300 focus:border-blue-500'
                      }`}
                      value={formData.supplierId}
                      onChange={e => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                      aria-describedby={!formData.supplierId && hasSubmitted ? "supplier-required" : undefined}
                      aria-invalid={currentErrors.supplierId}
                    >
                      <option value="">Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    {!formData.supplierId && hasSubmitted && (
                      <div id="supplier-required" className="text-yellow-600 text-sm mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        Supplier must be selected for returns/warranty tracking
                      </div>
                    )}
                    
                    {/* Supplier Contact Info Display */}
                    {formData.supplierId && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-800">
                          <div className="font-medium mb-1">Contact Information:</div>
                          {(() => {
                            const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
                            if (selectedSupplier) {
                              return (
                                <div className="space-y-1 text-xs">
                                  {selectedSupplier.phone && (
                                    <div>📞 Phone: {selectedSupplier.phone}</div>
                                  )}
                                  {selectedSupplier.email && (
                                    <div>✉️ Email: {selectedSupplier.email}</div>
                                  )}
                                  {selectedSupplier.address && (
                                    <div>📍 Address: {selectedSupplier.address}</div>
                                  )}
                                  {!selectedSupplier.phone && !selectedSupplier.email && !selectedSupplier.address && (
                                    <div className="text-blue-600">No contact information available</div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>



                {/* Condition Buttons */}
                <div>
                  <label className={`block mb-3 font-medium ${currentErrors.condition ? 'text-red-600' : 'text-gray-700'}`}>
                    Condition *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, condition: 'new' }))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.condition === 'new'
                          ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                      }`}
                      aria-pressed={formData.condition === 'new'}
                      aria-describedby={!formData.condition && hasSubmitted ? "condition-required" : undefined}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        formData.condition === 'new'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="font-medium">New</span>
                      {formData.condition === 'new' && (
                        <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, condition: 'used' }))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.condition === 'used'
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                      aria-pressed={formData.condition === 'used'}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        formData.condition === 'used'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="font-medium">Used</span>
                      {formData.condition === 'used' && (
                        <svg className="w-4 h-4 text-orange-500 ml-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, condition: 'refurbished' }))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.condition === 'refurbished'
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                      aria-pressed={formData.condition === 'refurbished'}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        formData.condition === 'refurbished'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="font-medium">Refurbished</span>
                      {formData.condition === 'refurbished' && (
                        <svg className="w-4 h-4 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {!formData.condition && hasSubmitted && (
                    <div id="condition-required" className="text-yellow-600 text-sm mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      Product condition must be selected
                    </div>
                  )}
                </div>

                {/* Product Variants Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Layers className="w-3 h-3 text-indigo-600" />
                    </div>
                      <h3 className="text-lg font-semibold text-gray-900">Variants</h3>
                      </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700">Use Variants</label>
                      {useVariants && (
                      <button
                        type="button"
                                                  onClick={() => {
                          setVariants(prev => prev.map((v, idx) => ({
                            ...v,
                            sku: generateVariantSKU(idx + 1),
                            barcode: generateVariantSKU(idx + 1) // Sync barcode with SKU
                          })));
                          toast.success('Variant SKUs/Barcodes auto-generated');
                        }}
                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                        title="Auto-generate all variant SKUs/Barcodes"
                      >
                        Auto-generate SKUs/Barcodes
                      </button>
                      )}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={useVariants}
                        onClick={() => {
                          setUseVariants(prev => {
                            const next = !prev;
                            if (next) {
                              if (variants.length === 0) {
                                addVariant();
                              }
                              setShowVariants(true);
                            } else {
                              setShowVariants(false);
                            }
                            return next;
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${useVariants ? 'bg-blue-600' : 'bg-gray-300'}`}
                        aria-label="Toggle variants"
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${useVariants ? 'translate-x-5' : 'translate-x-1'}`}
                        />
                      </button>

                    </div>
                  </div>
                  
                  {useVariants && showVariants && (
                    <div className="space-y-4">
                      {/* Variants List */}
                      <div className="space-y-3">
                        {variants.map((variant, index) => (
                          <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                            draggable={isReorderingVariants}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={() => setDraggedVariantIndex(null)}
                            style={{ cursor: isReorderingVariants ? 'grabbing' : 'grab' }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                {isReorderingVariants && (
                                  <div className="w-6 h-6 flex items-center justify-center text-gray-400">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 6h8v2H8V6zm0 5h8v2H8v-2zm0 5h8v2H8v-2z"/>
                                    </svg>
                                  </div>
                                )}
                                <h4 className="font-medium text-gray-900">{variant.name || `Variant ${index + 1}`}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                {!isReorderingVariants && (
                                  <button
                                    type="button"
                                    onClick={() => removeVariant(index)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                    aria-label="Remove variant"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                 <div className="relative">
                                 <input
                                   type="text"
                                   value={variant.name}
                                   onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                     className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors border-gray-300 focus:border-blue-500"
                                   placeholder="Name"
                                     autoComplete="off"
                                     autoCorrect="off"
                                     spellCheck={false}
                                 />
                                   <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                 </div>
                               </div>
                               
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">SKU/Barcode</label>
                                 <div className="relative">
                                 <input
                                   type="text"
                                   value={variant.sku}
                                   onChange={(e) => {
                                     const newValue = e.target.value.toUpperCase();
                                     updateVariant(index, 'sku', newValue);
                                     updateVariant(index, 'barcode', newValue); // Sync barcode with SKU
                                   }}
                                     className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors border-gray-300 focus:border-blue-500"
                                   placeholder="Auto-generated"
                                     autoComplete="off"
                                     autoCorrect="off"
                                     spellCheck={false}
                                   />
                                   <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                   <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                     <button
                                       type="button"
                                       onClick={() => {
                                         const newSKU = generateVariantSKU(index + 1);
                                         updateVariant(index, 'sku', newSKU);
                                         updateVariant(index, 'barcode', newSKU); // Sync barcode with SKU
                                       }}
                                       className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                                       title="Regenerate SKU/Barcode"
                                     >
                                       <RefreshCw size={14} />
                                     </button>
                                   </div>
                                 </div>
                                 <div className="text-xs text-gray-500 mt-1">
                                   SKU and barcode are automatically synchronized
                                 </div>
                               </div>
                               </div>

                            {/* Variant Specifications Button */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentVariantIndex(index);
                                  setShowVariantSpecificationsModal(true);
                                }}
                                className="group w-full bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {/* Simple icon */}
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors duration-200">
                                      <Layers className="w-4 h-4 text-white" />
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="text-left">
                                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                                        Specifications
                                      </h4>
                                      <p className="text-xs text-gray-600">
                                        {variant.attributes && Object.keys(variant.attributes).length > 0 
                                          ? `${Object.keys(variant.attributes).length} configured`
                                          : 'Add specifications'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Right side */}
                                  <div className="flex items-center gap-2">
                                    {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                                      <div className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md">
                                        {Object.keys(variant.attributes).length}
                                      </div>
                                    )}
                                    
                                    {/* Simple arrow */}
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                  </div>
                                </div>
                              </button>
                            </div>
                               
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                               {/* Cost Price */}
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                   Cost Price *
                                 </label>
                                 <div className="relative">
                                 <input
                                   type="text"
                                     className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors border-gray-300 focus:border-blue-500"
                                     placeholder="0"
                                     autoComplete="off"
                                     autoCorrect="off"
                                     spellCheck={false}
                                     value={!variant.costPrice || variant.costPrice === 0 ? '' : formatNumber(variant.costPrice)}
                                     onChange={(e) => handleVariantPriceChange(index, 'costPrice', e.target.value)}
                                     onFocus={() => handleVariantPriceFocus(index, 'costPrice')}
                                     onBlur={() => handleVariantPriceBlur(index, 'costPrice')}
                                   />
                                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                 </div>
                               </div>

                               {/* Selling Price */}
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                   Selling Price *
                                 </label>
                                 <div className="relative">
                                   <input
                                     type="text"
                                     className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors border-gray-300 focus:border-blue-500"
                                     placeholder="0"
                                     autoComplete="off"
                                     autoCorrect="off"
                                     spellCheck={false}
                                   value={!variant.price || variant.price === 0 ? '' : formatNumber(variant.price)}
                                   onChange={(e) => handleVariantPriceChange(index, 'price', e.target.value)}
                                   onFocus={() => handleVariantPriceFocus(index, 'price')}
                                   onBlur={() => handleVariantPriceBlur(index, 'price')}
                                 />
                                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                 </div>
                               </div>
                               
                               {/* Stock Quantity */}
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                   Stock Quantity *
                                 </label>
                                 <div className="relative">
                                   <div className="w-full py-3 px-3 pr-20 pl-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
                                     <span className="text-lg font-semibold text-gray-900">
                                       {variant.stockQuantity || 0}
                                     </span>
                                   </div>
                                   
                                   {/* Minus button on the left */}
                                   <button
                                     type="button"
                                     onClick={() => updateVariant(index, 'stockQuantity', Math.max(0, (variant.stockQuantity || 0) - 1))}
                                     className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                                     aria-label="Decrease stock quantity"
                                   >
                                     −
                                   </button>
                                   
                                   {/* Plus button on the right */}
                                   <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                     <button
                                       type="button"
                                       onClick={() => updateVariant(index, 'stockQuantity', (variant.stockQuantity || 0) + 1)}
                                       className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                                       aria-label="Increase stock quantity"
                                     >
                                       +
                                     </button>
                                   </div>
                                 </div>
                               </div>

                               {/* Min Stock Level */}
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                   Min Stock Level *
                                 </label>
                                 <div className="relative">
                                   <div className="w-full py-3 px-3 pr-20 pl-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
                                     <span className="text-lg font-semibold text-gray-900">
                                       {variant.minStockLevel || 0}
                                     </span>
                                   </div>
                                   
                                   {/* Minus button on the left */}
                                   <button
                                     type="button"
                                     onClick={() => updateVariant(index, 'minStockLevel', Math.max(0, (variant.minStockLevel || 0) - 1))}
                                     className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                                     aria-label="Decrease minimum stock level"
                                   >
                                     −
                                   </button>
                                   
                                   {/* Plus button on the right */}
                                   <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                     <button
                                       type="button"
                                       onClick={() => updateVariant(index, 'minStockLevel', (variant.minStockLevel || 0) + 1)}
                                       className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                                       aria-label="Increase minimum stock level"
                                     >
                                       +
                                     </button>
                                   </div>
                                 </div>
                               </div>
                             </div>
                            
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <button
                                type="button"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                <ChevronDown size={16} />
                                Show more
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Add Variant Button */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addVariant();
                          }}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Plus size={16} />
                          Add variant
                        </button>
                        <button
                          type="button"
                          onClick={toggleReorderMode}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                            isReorderingVariants 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {isReorderingVariants ? (
                            <>
                              <Check size={16} />
                              Done
                            </>
                          ) : (
                            <>
                              <Move size={16} />
                              Change variant sequence
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Specifications Button (only when not using variants) */}
                {!useVariants && (
                  <div className="col-span-full">
                    <button
                      type="button"
                      onClick={() => setShowSpecificationsModal(true)}
                      className="group w-full bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Simple icon */}
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors duration-200">
                            <Layers className="w-5 h-5 text-white" />
                          </div>
                          
                          {/* Content */}
                          <div className="text-left">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                              Product Specifications
                            </h3>
                            <p className="text-sm text-gray-600">
                              {formData.attributes && Object.keys(formData.attributes).length > 0 
                                ? `${Object.keys(formData.attributes).length} specification${Object.keys(formData.attributes).length !== 1 ? 's' : ''} configured`
                                : 'Define product attributes and specifications'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {/* Right side */}
                        <div className="flex items-center gap-2">
                          {formData.attributes && Object.keys(formData.attributes).length > 0 && (
                            <div className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md">
                              {Object.keys(formData.attributes).length}
                            </div>
                          )}
                          
                          {/* Simple arrow */}
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Pricing & Stock Section - Only show when not using variants */}
                {!useVariants && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Cost Price */}
                  <div>
                    <label 
                      htmlFor="cost-price"
                      className={`block mb-2 font-medium ${currentErrors.costPrice ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Cost Price *
                    </label>
                    <div className="relative">
                      <input
                        id="cost-price"
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                          currentErrors.costPrice ? 'border-red-500 focus:border-red-600' : 
                          !formData.costPrice && hasSubmitted ? 'border-yellow-300 focus:border-yellow-500' : 
                          'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="0"
                        value={!formData.costPrice || formData.costPrice === 0 ? '' : formatNumber(formData.costPrice)}
                        onChange={(e) => handlePriceChange('costPrice', e.target.value)}
                        onFocus={() => handlePriceFocus('costPrice')}
                        onBlur={() => handlePriceBlur('costPrice')}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        aria-describedby={!formData.costPrice && hasSubmitted ? "cost-price-required" : undefined}
                        aria-invalid={currentErrors.costPrice}
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                    {!formData.costPrice && hasSubmitted && (
                      <div id="cost-price-required" className="text-yellow-600 text-sm mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        Cost price must be provided
                      </div>
                    )}
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label 
                      htmlFor="selling-price"
                      className={`block mb-2 font-medium ${currentErrors.price ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Selling Price *
                    </label>
                    <div className="relative">
                      <input
                        id="selling-price"
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                          currentErrors.price ? 'border-red-500 focus:border-red-600' : 
                          !formData.price && hasSubmitted ? 'border-yellow-300 focus:border-yellow-500' : 
                          'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="0"
                        value={!formData.price || formData.price === 0 ? '' : formatNumber(formData.price)}
                        onChange={(e) => handlePriceChange('price', e.target.value)}
                        onFocus={() => handlePriceFocus('price')}
                        onBlur={() => handlePriceBlur('price')}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        aria-describedby={!formData.price && hasSubmitted ? "selling-price-required" : undefined}
                        aria-invalid={currentErrors.price}
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                    {!formData.price && hasSubmitted && (
                      <div id="selling-price-required" className="text-yellow-600 text-sm mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        Selling price must be provided
                      </div>
                    )}
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label 
                      htmlFor="stock-quantity"
                      className={`block mb-2 font-medium ${currentErrors.stockQuantity ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Stock Quantity *
                    </label>
                    <div className="relative">
                      <div className="w-full py-3 px-3 pr-20 pl-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-900">
                          {formData.stockQuantity || 0}
                        </span>
                      </div>
                      
                      {/* Minus button on the left */}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, stockQuantity: Math.max(0, (prev.stockQuantity || 0) - 1) }))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Decrease stock quantity"
                      >
                        −
                      </button>
                      
                      {/* Plus button on the right */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, stockQuantity: (prev.stockQuantity || 0) + 1 }))}
                          className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                          aria-label="Increase stock quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {!formData.stockQuantity && hasSubmitted && (
                      <div className="text-yellow-600 text-sm mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        Stock quantity must be provided
                      </div>
                    )}
                  </div>

                  {/* Min Stock Level */}
                  <div>
                    <label 
                      htmlFor="min-stock-level"
                      className={`block mb-2 font-medium ${currentErrors.minStockLevel ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Min Stock Level *
                    </label>
                    <div className="relative">
                      <div className="w-full py-3 px-3 pr-20 pl-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-900">
                          {formData.minStockLevel || 0}
                        </span>
                      </div>
                      
                      {/* Minus button on the left */}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, minStockLevel: Math.max(0, (prev.minStockLevel || 0) - 1) }))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Decrease minimum stock level"
                      >
                        −
                      </button>
                      
                      {/* Plus button on the right */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, minStockLevel: (prev.minStockLevel || 0) + 1 }))}
                          className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                          aria-label="Increase minimum stock level"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {!formData.minStockLevel && hasSubmitted && (
                      <div className="text-yellow-600 text-sm mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        Minimum stock level must be provided
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Internal Notes Section */}
                <div className="col-span-full space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Internal Notes</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInternalNotes(!showInternalNotes)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                    >
                      {showInternalNotes ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Hide
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Show
                        </>
                      )}
                    </button>
                  </div>
                  
                  {showInternalNotes && (
                    <div className="space-y-4">
                      <textarea
                        id="internal-notes"
                        className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none transition-colors"
                        placeholder="Add internal notes about this product..."
                        rows={4}
                        value={formData.internalNotes}
                        onChange={e => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>

                {/* Product Images Section */}
                <div className="col-span-full space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <div className="w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-3 h-3 text-pink-600" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
                    </div>
                  </div>
                
                  <div className="space-y-4">
                    <SimpleImageUpload
                      productId={tempProductId}
                      userId={currentUser?.id || ''}
                      onImagesChange={(images) => {
                        const formImages = images.map(img => ({
                          id: img.id,
                          image_url: img.url,
                          thumbnail_url: img.thumbnailUrl || img.url,
                          file_name: img.fileName,
                          file_size: img.fileSize,
                          is_primary: img.isPrimary,
                          uploaded_by: img.uploadedAt,
                          created_at: img.uploadedAt
                        }));
                        setFormData(prev => ({ ...prev, images: formImages }));
                        
                        // Show success message for image upload
                        if (images.length > 0) {
                          toast.success(`${images.length} image${images.length > 1 ? 's' : ''} uploaded successfully!`);
                        }
                      }}
                      maxFiles={5}
                    />
                  </div>
                </div>





                {/* Submit Button */}
               <div className="flex justify-end gap-2 mt-6">
                 <button
                   type="button"
                   className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                   onClick={() => navigate(-1)}
                   disabled={isLoading || isSubmitting}
                 >
                   Cancel
                 </button>
                 <button
                   type="button"
                   className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                     isFormValid 
                       ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' 
                       : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                   }`}
                   onClick={handleFormSubmit}
                   disabled={isLoading || isSubmitting || !isFormValid}
                 >
                   {isLoading || isSubmitting ? (
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       {formData.images && formData.images.length > 0 ? 'Creating Product & Uploading Images...' : 'Creating Product...'}
                     </div>
                   ) : (
                     <div className="flex items-center gap-2">
                       <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                       </svg>
                       Create Product
                     </div>
                   )}
                 </button>
               </div>
             </form>
           </div>
         </div>
        </GlassCard>
      </div>

      {/* Summary Modal */}
      {showSummaryModal && createdProduct && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                  Product Created Successfully!
                </h2>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              <div id="modal-description" className="space-y-6">
                {/* Product Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Product Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-medium">{createdProduct.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">SKU:</span>
                      <p className="font-medium">{createdProduct.sku}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Category:</span>
                      <p className="font-medium">{createdProduct.category_id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Price:</span>
                      <p className="font-medium">TZS {formatNumber(createdProduct.price)}</p>
                    </div>
                  </div>
                </div>

                {/* Image Upload Summary */}
                {formData.images && formData.images.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
                      <h3 className="font-semibold text-lg text-green-900">Images Uploaded Successfully</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-green-600">Images Uploaded:</span>
                        <p className="font-medium text-green-900">{formData.images.length} image{formData.images.length > 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <span className="text-sm text-green-600">Primary Image:</span>
                        <p className="font-medium text-green-900">
                          {formData.images.find(img => img.is_primary)?.file_name || formData.images[0]?.file_name || 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code Section */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-blue-900">QR Code</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Print QR codes for easy product identification and inventory management.
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => printQRCode(createdProduct.id, createdProduct.name)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      aria-label="Print QR code for product"
                    >
                      <QrCode size={20} aria-hidden="true" />
                      Print QR Code
                    </button>
                    
                    <button
                      onClick={() => {
                        const qrUrl = generateQRCode(createdProduct.id, createdProduct.name);
                        window.open(qrUrl, '_blank');
                      }}
                      className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                      aria-label="View QR code in new tab"
                    >
                      <ExternalLink size={20} aria-hidden="true" />
                      View QR Code
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowSummaryModal(false);
                      navigate('/lats/inventory');
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                    aria-label="Navigate to inventory page"
                  >
                    View in Inventory
                  </button>
                  <button
                    onClick={() => {
                      setShowSummaryModal(false);
                      // Reset form and create another product
                      window.location.reload();
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
                    aria-label="Create another product"
                  >
                    Create Another Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specifications Modal */}
      {showSpecificationsModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="specifications-modal-title"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 id="specifications-modal-title" className="text-2xl font-bold">
                      Product Specifications
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">
                      Add and manage product specifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSpecificationsModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="space-y-8">
                {/* Quick Add Section */}
                                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Quick Add Specifications</h3>
                  </div>
                  
                                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                     {[
                       { name: 'Color', color: 'red', icon: Palette, bgColor: 'bg-red-500' },
                       { name: 'Storage', color: 'blue', icon: HardDrive, bgColor: 'bg-blue-500' },
                       { name: 'RAM', color: 'green', icon: Zap, bgColor: 'bg-green-500' },
                       { name: 'Processor', color: 'purple', icon: Cpu, bgColor: 'bg-purple-500' },
                       { name: 'Screen Size', color: 'orange', icon: Monitor, bgColor: 'bg-orange-500' },
                       { name: 'Battery', color: 'teal', icon: Battery, bgColor: 'bg-teal-500' },
                       { name: 'Camera', color: 'pink', icon: Camera, bgColor: 'bg-pink-500' },
                       { name: 'Size', color: 'gray', icon: Ruler, bgColor: 'bg-gray-500' }
                     ].map((spec) => (
                       <button 
                         key={spec.name}
                         type="button" 
                         onClick={() => setFormData(prev => ({ 
                           ...prev, 
                           attributes: { 
                             ...(prev.attributes || {}), 
                             [spec.name.toLowerCase().replace(/\s+/g, '_')]: '' 
                           } 
                         }))} 
                         className={`group relative overflow-hidden bg-white rounded-lg p-4 border-2 border-transparent hover:border-${spec.color}-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
                       >
                         <div className="text-center space-y-3">
                           <div className={`w-12 h-12 ${spec.bgColor} rounded-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                             <spec.icon className="w-6 h-6 text-white" />
                           </div>
                           <div className={`text-sm font-semibold text-${spec.color}-700 group-hover:text-${spec.color}-800 transition-colors`}>
                             {spec.name}
                           </div>
                         </div>
                         <div className={`absolute inset-0 bg-gradient-to-br from-${spec.color}-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                       </button>
                     ))}
                    
                    <button 
                      type="button" 
                      onClick={() => { setShowProductCustomInput(true); setProductCustomAttributeInput(''); }} 
                      className="group relative overflow-hidden bg-white rounded-lg p-4 border-2 border-dashed border-indigo-300 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto group-hover:bg-indigo-200 transition-colors">
                          <Plus className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-sm font-medium text-indigo-700 group-hover:text-indigo-800">
                          Custom
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Custom Attribute Input */}
                {showProductCustomInput && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={productCustomAttributeInput}
                          onChange={(e) => setProductCustomAttributeInput(e.target.value)}
                          placeholder="Enter custom specification name..."
                          className="w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && productCustomAttributeInput.trim()) {
                              const clean = productCustomAttributeInput.trim().toLowerCase().replace(/\s+/g, '_');
                              setFormData(prev => ({ ...prev, attributes: { ...(prev.attributes || {}), [clean]: '' } }));
                              setShowProductCustomInput(false);
                              setProductCustomAttributeInput('');
                            }
                          }}
                          autoFocus
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => {
                            if (productCustomAttributeInput.trim()) {
                              const clean = productCustomAttributeInput.trim().toLowerCase().replace(/\s+/g, '_');
                              setFormData(prev => ({ ...prev, attributes: { ...(prev.attributes || {}), [clean]: '' } }));
                              setShowProductCustomInput(false);
                              setProductCustomAttributeInput('');
                            }
                          }} 
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Add
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setShowProductCustomInput(false); setProductCustomAttributeInput(''); }} 
                          className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Specifications List */}
                {formData.attributes && Object.keys(formData.attributes).length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Current Specifications</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {Object.keys(formData.attributes).length} spec{Object.keys(formData.attributes).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(formData.attributes).map(([key, value]) => (
                        <div key={key} className="relative">
                          <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">
                            {key.replace(/_/g, ' ')}
                          </label>
                          <input
                            type="text"
                            value={(value as string) || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, attributes: { ...(prev.attributes || {}), [key]: e.target.value } }))}
                            className="w-full py-2 px-3 pr-8 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-sm"
                            placeholder={key.replace(/_/g, ' ')}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => { 
                              const next = { ...(prev.attributes || {}) } as any; 
                              delete next[key]; 
                              return { ...prev, attributes: next }; 
                            })}
                            className="absolute right-2 top-7 text-red-500 hover:text-red-700"
                            title="Remove specification"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                                     <div className="text-center py-12">
                     <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                       <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                         <Layers className="w-6 h-6 text-white" />
                       </div>
                     </div>
                     <h3 className="text-xl font-semibold text-gray-900 mb-3">No Specifications Added</h3>
                     <p className="text-gray-500 max-w-md mx-auto">
                       Click the specification cards above to add product specifications. You can choose from common specs or create custom ones.
                     </p>
                   </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 rounded-b-lg border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {formData.attributes && Object.keys(formData.attributes).length > 0 
                    ? `${Object.keys(formData.attributes).length} specification${Object.keys(formData.attributes).length !== 1 ? 's' : ''} added`
                    : 'No specifications added yet'
                  }
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSpecificationsModal(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSpecificationsModal(false);
                      toast.success('Specifications saved successfully!');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Save & Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variant Specifications Modal */}
      {showVariantSpecificationsModal && currentVariantIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="variant-specifications-modal-title"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 id="variant-specifications-modal-title" className="text-2xl font-bold">
                      Variant Specifications
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">
                      {variants[currentVariantIndex]?.name || `Variant ${currentVariantIndex + 1}`} - Add and manage specifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVariantSpecificationsModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="space-y-8">
                {/* Quick Add Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Quick Add Specifications</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { name: 'Color', color: 'red', icon: Palette, bgColor: 'bg-red-500' },
                      { name: 'Storage', color: 'blue', icon: HardDrive, bgColor: 'bg-blue-500' },
                      { name: 'RAM', color: 'green', icon: Zap, bgColor: 'bg-green-500' },
                      { name: 'Processor', color: 'purple', icon: Cpu, bgColor: 'bg-purple-500' },
                      { name: 'Screen Size', color: 'orange', icon: Monitor, bgColor: 'bg-orange-500' },
                      { name: 'Battery', color: 'teal', icon: Battery, bgColor: 'bg-teal-500' },
                      { name: 'Camera', color: 'pink', icon: Camera, bgColor: 'bg-pink-500' },
                      { name: 'Size', color: 'gray', icon: Ruler, bgColor: 'bg-gray-500' }
                    ].map((spec) => (
                      <button 
                        key={spec.name}
                        type="button" 
                        onClick={() => addAttributeToVariant(currentVariantIndex, spec.name.toLowerCase().replace(/\s+/g, '_'))} 
                        className={`group relative overflow-hidden bg-white rounded-lg p-4 border-2 border-transparent hover:border-${spec.color}-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
                      >
                        <div className="text-center space-y-3">
                          <div className={`w-12 h-12 ${spec.bgColor} rounded-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                            <spec.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className={`text-sm font-semibold text-${spec.color}-700 group-hover:text-${spec.color}-800 transition-colors`}>
                            {spec.name}
                          </div>
                        </div>
                        <div className={`absolute inset-0 bg-gradient-to-br from-${spec.color}-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      </button>
                    ))}
                    
                    <button 
                      type="button" 
                      onClick={() => { setShowCustomInput(currentVariantIndex); setCustomAttributeInput(''); }} 
                      className="group relative overflow-hidden bg-white rounded-lg p-4 border-2 border-dashed border-indigo-300 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto group-hover:bg-indigo-200 transition-colors">
                          <Plus className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-sm font-medium text-indigo-700 group-hover:text-indigo-800">
                          Custom
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Custom Attribute Input */}
                {showCustomInput === currentVariantIndex && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={customAttributeInput}
                          onChange={(e) => setCustomAttributeInput(e.target.value)}
                          placeholder="Enter custom specification name..."
                          className="w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
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
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => handleCustomAttributeSubmit(currentVariantIndex)} 
                          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Add
                        </button>
                        <button 
                          type="button" 
                          onClick={cancelCustomAttribute} 
                          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Specifications List */}
                {variants[currentVariantIndex]?.attributes && Object.keys(variants[currentVariantIndex].attributes).length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Current Specifications</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {Object.keys(variants[currentVariantIndex].attributes).length} spec{Object.keys(variants[currentVariantIndex].attributes).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(variants[currentVariantIndex].attributes).map(([key, value]) => (
                        <div key={key} className="relative">
                          <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">
                            {key.replace(/_/g, ' ')}
                          </label>
                          <input
                            type="text"
                            value={value as string}
                            onChange={(e) => {
                              const newAttributes = { ...variants[currentVariantIndex].attributes, [key]: e.target.value };
                              updateVariant(currentVariantIndex, 'attributes', newAttributes);
                            }}
                            className="w-full py-2 px-3 pr-8 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-sm"
                            placeholder={key.replace(/_/g, ' ')}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                          />
                          <button
                            type="button"
                            onClick={() => removeAttributeFromVariant(currentVariantIndex, key)}
                            className="absolute right-2 top-7 text-red-500 hover:text-red-700"
                            title="Remove specification"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Layers className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No Specifications Added</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Click the specification cards above to add specifications for this variant. You can choose from common specs or create custom ones.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 rounded-b-lg border-t border-gray-200">
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
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVariantSpecificationsModal(false);
                      toast.success('Variant specifications saved successfully!');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Save & Close
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

export default AddProductPage;
