import React, { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';

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

const EditProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { 
    categories, 
    brands: storeBrands, 
    suppliers,
    updateProduct,
    loadCategories,
    loadBrands,
    loadSuppliers,
    getProduct,
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
    description: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brand: '',
    supplierId: '',
    condition: '',
    
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 5,

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

  // Load product data when productId changes
  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  // Ensure variants are always shown for products with original variants
  useEffect(() => {
    if (hasOriginalVariants) {
      setUseVariants(true);
      setShowVariants(true);
    }
  }, [hasOriginalVariants]);

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

  const loadProductData = async () => {
    if (!productId) return;
    
    setIsLoading(true);
    try {
      const response = await getProduct(productId);
      if (response.ok && response.data) {
        const product = response.data;
        
        // Find brand name from brandId if available
        let brandName = '';
        if (product.brandId) {
          const brand = localBrands.find(b => b.id === product.brandId);
          brandName = brand?.name || '';
        }
        
        setFormData({
          name: product.name || '',
          description: product.description || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          categoryId: product.categoryId || '',
          brand: brandName,
          supplierId: product.supplierId || '',
          condition: product.condition || '',
          
          price: product.price || 0,
          costPrice: product.costPrice || 0,
          stockQuantity: product.stockQuantity || 0,
          minStockLevel: product.minStockLevel || 5,
          images: product.images || [],
          metadata: {},
          attributes: {}
        });
        
        // Load variants if they exist
        if (product.variants && product.variants.length > 0) {
          setVariants(product.variants);
          setUseVariants(true);
          setShowVariants(true);
          setHasOriginalVariants(true);
        }
      } else {
        toast.error('Failed to load product data');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product data');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Automatic SKU/Barcode generation
  const generateAutoSKU = () => {
    const name = formData.name;
    const categoryId = formData.categoryId;
    
    if (!name || !categoryId) {
      return '';
    }

    // Generate SKU based on name and category
    const category = categories.find(cat => cat.id === categoryId);
    const categoryPrefix = category ? category.name.substring(0, 3).toUpperCase() : 'PROD';
    const namePrefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-4);
    
    const generatedSKU = `${categoryPrefix}-${namePrefix}-${timestamp}`;
    
    // Set both SKU and barcode to the same value
    setFormData(prev => ({ 
      ...prev, 
      sku: generatedSKU,
      barcode: generatedSKU 
    }));

    return generatedSKU;
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

  // Calculate completion percentage
  const calculateCompletion = () => {
    const fields = [
      formData.name,
      formData.sku,
      formData.categoryId,
      formData.condition,
      formData.price,
      formData.stockQuantity
    ];
    
    const filledFields = fields.filter(field => 
      field !== '' && field !== 0 && field !== null && field !== undefined
    ).length;
    
    return Math.round((filledFields / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  // Get current validation errors for display - only show after submission
  const currentErrors = React.useMemo(() => {
    if (!hasSubmitted) return {};
    const { errors } = validateForm();
    return errors;
  }, [validateForm, hasSubmitted]);

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
            barcode: v.barcode || formData.barcode || formData.sku,
            sellingPrice: v.price || 0,
            costPrice: v.costPrice || 0,
            quantity: v.stockQuantity || 0,
            minQuantity: v.minStockLevel || 5,
            attributes: v.attributes || {}
          }))
        : [{
            sku: formData.sku,
            name: formData.name,
            barcode: formData.barcode || formData.sku,
            sellingPrice: formData.price || 0,
            costPrice: formData.costPrice || 0,
            quantity: formData.stockQuantity || 0,
            minQuantity: formData.minStockLevel || 5,
            attributes: formData.attributes || {}
          }];

      // Create product data using the proper structure
      const productData = {
        name: formData.name,
        description: formData.description || '',
        sku: formData.sku,
        categoryId: formData.categoryId,
        brandId: brandId,
        supplierId: formData.supplierId || null,
        variants: variantsPayload,
        images: formData.images || [],
        isActive: true
      };

      // Use the store's updateProduct function to ensure proper cache management
      const response = await updateProduct(productId!, productData);
      
      if (!response.ok) {
        throw new Error(response.message || 'Failed to update product');
      }
      
      const product = response.data;

      // Show success message and summary modal
      toast.success('Product updated successfully!');
      setCreatedProduct(product);
      setShowSummaryModal(true);
      
      // Force refresh the inventory data to ensure updated product appears
      const { loadProducts } = useInventoryStore.getState();
      await loadProducts();

    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/lats/inventory" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600">Update product information and details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500">
              Completion: {completionPercentage}%
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Basic Information */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label 
                  htmlFor="product-name"
                  className={`block text-sm font-medium ${currentErrors.name ? 'text-red-600' : 'text-gray-700'} mb-2`}
                >
                  Product Name *
                </label>
                <div className="relative">
                  <input
                    id="product-name"
                    type="text"
                    className={`w-full px-4 py-3 text-lg border-2 rounded-lg bg-white/30 backdrop-blur-md focus:ring-2 transition-all duration-200 ${
                      currentErrors.name ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : 
                      !formData.name && hasSubmitted ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500/20' : 
                      'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-describedby={
                      isCheckingName ? "name-checking" :
                      nameExists ? "name-exists" :
                      !formData.name && hasSubmitted ? "name-required" : undefined
                    }
                    aria-invalid={currentErrors.name || nameExists}
                    required
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

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="Enter SKU"
                    required
                  />
                  <GlassButton
                    type="button"
                    onClick={() => {
                      const newSku = generateAutoSKU();
                      setFormData(prev => ({ ...prev, sku: newSku }));
                      hasGeneratedSKU.current = true;
                    }}
                    className="px-4 py-3"
                  >
                    <RefreshCw size={16} />
                  </GlassButton>
                </div>
                {currentErrors.sku && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertIcon size={14} />
                    {currentErrors.sku}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, categoryId: e.target.value }));
                    if (hasGeneratedSKU.current) {
                      clearSKUAndBarcode();
                    }
                  }}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {currentErrors.categoryId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertIcon size={14} />
                    {currentErrors.categoryId}
                  </p>
                )}
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <BrandInput
                  value={formData.brand}
                  onChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
                  placeholder="Enter brand name"
                  required={false}
                  className="w-full"
                  showSuggestions={true}
                  disabled={false}
                />
              </div>

              {/* Store Location and Shelf Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Store Location */}
                <div>
                  <label htmlFor="store-location-select" className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Store Location
                  </label>
                  <select
                    id="store-location-select"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    value={formData.storeLocationId || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      storeLocationId: e.target.value,
                      
                    }))}
                  >
                    <option value="">Select Store Location</option>
                    {storeLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shelf Selection */}
                <div>
                  <label htmlFor="store-shelf-select" className="block text-sm font-medium text-gray-700 mb-2">
                    <Layers className="w-4 h-4 inline mr-2" />
                    Shelf
                  </label>
                  <select
                    id="store-shelf-select"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"

                    disabled={!formData.storeLocationId}
                  >
                    <option value="">
                      {!formData.storeLocationId 
                        ? 'Select Location First' 
                        : 'Select Shelf'
                      }
                    </option>
                    {shelves.map((shelf) => (
                      <option key={shelf.id} value={shelf.code}>
                        {shelf.name} ({shelf.code}) - {shelf.current_capacity}/{shelf.max_capacity || '∞'}
                      </option>
                    ))}
                  </select>
                  {formData.storeLocationId && shelves.length === 0 && (
                    <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-sm text-yellow-800">
                        No shelves found for this location. 
                        <button
                          type="button"
                          onClick={() => window.open('/lats/inventory-management?shelves', '_blank')}
                          className="text-blue-600 hover:text-blue-800 ml-1 underline"
                                                  >
                            Manage shelves
                          </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label 
                  htmlFor="supplier-select" 
                  className={`block text-sm font-medium ${currentErrors.supplierId ? 'text-red-600' : 'text-gray-700'} mb-2`}
                >
                  Supplier *
                </label>
                <select
                  id="supplier-select"
                  className={`w-full px-4 py-3 text-lg border-2 rounded-lg bg-white/30 backdrop-blur-md focus:ring-2 transition-all duration-200 ${
                    currentErrors.supplierId ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : 
                    'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  value={formData.supplierId}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                  required
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {currentErrors.supplierId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertIcon size={14} />
                    {currentErrors.supplierId}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                placeholder="Enter product description"
              />
            </div>
          </GlassCard>

          {/* Condition Section */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-6">
              <Tag className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Product Condition</h2>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${currentErrors.condition ? 'text-red-600' : 'text-gray-700'} mb-3`}>
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
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    formData.condition === 'new'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="font-medium">New</span>
                  {formData.condition === 'new' && (
                    <Check className="w-4 h-4 text-green-500 ml-auto" />
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
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Used</span>
                  {formData.condition === 'used' && (
                    <Check className="w-4 h-4 text-orange-500 ml-auto" />
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
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Refurbished</span>
                  {formData.condition === 'refurbished' && (
                    <Check className="w-4 h-4 text-blue-500 ml-auto" />
                  )}
                </button>
              </div>
              {currentErrors.condition && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertIcon size={14} />
                  {currentErrors.condition}
                </p>
              )}
            </div>
          </GlassCard>

          {/* Pricing & Stock Section */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Pricing & Stock</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Cost Price */}
              <div>
                <label 
                  htmlFor="cost-price"
                  className={`block text-sm font-medium ${currentErrors.costPrice ? 'text-red-600' : 'text-gray-700'} mb-2`}
                >
                  Cost Price *
                </label>
                <div className="relative">
                  <input
                    id="cost-price"
                    type="text"
                    className={`w-full px-4 py-3 text-lg border-2 rounded-lg bg-white/30 backdrop-blur-md focus:ring-2 transition-all duration-200 ${
                      currentErrors.costPrice ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : 
                      'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    placeholder="0"
                    value={!formData.costPrice || formData.costPrice === 0 ? '' : formatNumber(formData.costPrice)}
                    onChange={(e) => handlePriceChange('costPrice', e.target.value)}
                    onFocus={handleCostPriceFocusWrapper}
                    onBlur={() => handlePriceBlur('costPrice')}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                  />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                </div>
                {currentErrors.costPrice && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertIcon size={14} />
                    {currentErrors.costPrice}
                  </p>
                )}
              </div>

              {/* Selling Price */}
              <div>
                <label 
                  htmlFor="selling-price"
                  className={`block text-sm font-medium ${currentErrors.price ? 'text-red-600' : 'text-gray-700'} mb-2`}
                >
                  Selling Price *
                </label>
                <div className="relative">
                  <input
                    id="selling-price"
                    type="text"
                    className={`w-full px-4 py-3 text-lg border-2 rounded-lg bg-white/30 backdrop-blur-md focus:ring-2 transition-all duration-200 ${
                      currentErrors.price ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : 
                      'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    placeholder="0"
                    value={!formData.price || formData.price === 0 ? '' : formatNumber(formData.price)}
                    onChange={(e) => handlePriceChange('price', e.target.value)}
                    onFocus={handlePriceFocusWrapper}
                    onBlur={() => handlePriceBlur('price')}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                  />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                </div>
                {currentErrors.price && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertIcon size={14} />
                    {currentErrors.price}
                  </p>
                )}
              </div>

              {/* Stock Quantity */}
              <div>
                <label 
                  htmlFor="stock-quantity"
                  className={`block text-sm font-medium ${currentErrors.stockQuantity ? 'text-red-600' : 'text-gray-700'} mb-2`}
                >
                  Stock Quantity *
                </label>
                <div className="relative">
                  <div className="w-full px-4 py-3 pr-20 pl-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
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
                {currentErrors.stockQuantity && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertIcon size={14} />
                    {currentErrors.stockQuantity}
                  </p>
                )}
              </div>

              {/* Min Stock Level */}
              <div>
                <label 
                  htmlFor="min-stock-level"
                  className={`block text-sm font-medium ${currentErrors.minStockLevel ? 'text-red-600' : 'text-gray-700'} mb-2`}
                >
                  Min Stock Level *
                </label>
                <div className="relative">
                  <div className="w-full px-4 py-3 pr-20 pl-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
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
                {currentErrors.minStockLevel && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertIcon size={14} />
                    {currentErrors.minStockLevel}
                  </p>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Internal Notes Section */}
          <GlassCard>
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Internal Notes</h2>
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
                  id="product-description"
                  className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none transition-colors"
                  placeholder="Internal notes"
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            )}
          </GlassCard>

          {/* Product Images Section */}
          <GlassCard>
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200 mb-6">
              <div className="w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-pink-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">Product Images</h2>
              </div>
            </div>
          
            <div className="space-y-4">
              <SimpleImageUpload
                productId={productId || 'temp-product-' + Date.now()}
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
          </GlassCard>

          {/* Product Variants Section */}
          <GlassCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Layers className="w-3 h-3 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Variants</h2>
                </div>
                <div className="flex items-center gap-3">
                  {/* Show variant toggle only if product doesn't have original variants */}
                  {!hasOriginalVariants && (
                    <>
                      <label className="text-sm text-gray-700">Use Variants</label>
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
                    </>
                  )}
                  
                  {/* Show auto-generate SKUs button when using variants */}
                  {useVariants && (
                    <button
                      type="button"
                      onClick={() => {
                        setVariants(prev => prev.map((v, idx) => ({
                          ...v,
                          sku: generateVariantSKU(idx + 1)
                        })));
                        toast.success('Variant SKUs auto-generated');
                      }}
                      className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                      title="Auto-generate all variant SKUs"
                    >
                      Auto-generate SKUs
                    </button>
                  )}
                  
                  {/* Show/hide variants button - only for products without original variants */}
                  {useVariants && !hasOriginalVariants && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
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
                  )}
                  
                  {/* Add variants button for products without original variants */}
                  {!hasOriginalVariants && !useVariants && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseVariants(true);
                        setShowVariants(true);
                        if (variants.length === 0) {
                          addVariant();
                        }
                        toast.success('Variants enabled. You can now add product variants.');
                      }}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Plus size={16} />
                      Add Variants
                    </button>
                  )}
                </div>
              </div>
              
              {/* Variant status information */}
              {hasOriginalVariants && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <Layers className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">Product with Variants</h3>
                      <p className="text-sm text-blue-700">
                        This product was created with {variants.length} variant{variants.length !== 1 ? 's' : ''}. 
                        You can edit existing variants below.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {!hasOriginalVariants && !useVariants && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                      <Package className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Single Product</h3>
                      <p className="text-sm text-gray-700">
                        This product was created without variants. You can add variants if needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {(useVariants && showVariants) || hasOriginalVariants && (
                <div className="space-y-4">
                  {/* Variants List */}
                  <div className="space-y-3">
                    {variants.map((variant, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-900">{variant.name || `Variant ${index + 1}`}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              aria-label="Remove variant"
                            >
                              <Trash2 size={16} />
                            </button>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
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
                                  }}
                                  className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                                  title="Regenerate SKU"
                                >
                                  <RefreshCw size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pricing and Stock Fields */}
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
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Product Specifications Button (only when not using variants) */}
          {!useVariants && (
            <GlassCard>
              <div className="col-span-full">
                <button
                  type="button"
                  onClick={() => setShowSpecificationsModal(true)}
                  className="group w-full bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors duration-200">
                        <Layers className="w-5 h-5 text-white" />
                      </div>
                      
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
                    
                    <div className="flex items-center gap-2">
                      {formData.attributes && Object.keys(formData.attributes).length > 0 && (
                        <div className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md">
                          {Object.keys(formData.attributes).length}
                        </div>
                      )}
                      
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </GlassCard>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <GlassButton
              type="button"
              onClick={() => navigate('/lats/inventory')}
              variant="secondary"
              className="px-8 py-3"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Update Product
                </>
              )}
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductPage;
