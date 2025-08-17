import React, { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { ImageUpload } from '../../../components/ImageUpload';
import { ImageGallery } from '../../../components/ImageGallery';
import { ImageUploadService } from '../../../lib/imageUpload';
import { EnhancedImageUploadService } from '../../../lib/enhancedImageUpload';
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
  Check, Move, ExternalLink
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

  images: z.array(ProductImageSchema).default([]),
  metadata: z.record(z.string()).optional().default({}),
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
  const [completionPercentage, setCompletionPercentage] = useState(0);
  // State for variants
  const [variants, setVariants] = useState<any[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [isReorderingVariants, setIsReorderingVariants] = useState(false);
  const [draggedVariantIndex, setDraggedVariantIndex] = useState<number | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const { currentUser, refreshSession } = useAuth();
  const [tempProductId, setTempProductId] = useState('temp-product-' + Date.now());
  const [galleryKey, setGalleryKey] = useState(0); // Add this to force ImageGallery refresh

  // Additional state variables like NewDevicePage
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

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
    storeShelf: '',
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 5,

    images: [],
    metadata: {}
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

  // Calculate form completion percentage
  useEffect(() => {
    const requiredFields = [
      formData.name ? 1 : 0,
      formData.sku ? 1 : 0,
      formData.categoryId ? 1 : 0,
      formData.condition ? 1 : 0,
      formData.price >= 0 ? 1 : 0,
      formData.costPrice >= 0 ? 1 : 0,
      formData.stockQuantity >= 0 ? 1 : 0,
      formData.minStockLevel >= 0 ? 1 : 0
    ];
    const percentage = Math.round((requiredFields.reduce((a, b) => a + b, 0) / requiredFields.length) * 100);
    setCompletionPercentage(percentage);
  }, [formData.name, formData.sku, formData.categoryId, formData.condition, formData.price, formData.costPrice, formData.stockQuantity, formData.minStockLevel]);

  // Load data on mount
  useEffect(() => {
    loadCategories();
    loadBrands();
    loadSuppliers();
    loadLocalBrands();
  }, [loadCategories, loadBrands, loadSuppliers]);

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
  const handleFormSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create simplified product data with only essential fields
      // Find brand ID from brand name
      const selectedBrand = localBrands.find(brand => brand.name === formData.brand);
      const brandId = selectedBrand?.id || null;

      const productData = {
        name: formData.name,
        description: formData.description || '',
        sku: formData.sku,
        barcode: formData.barcode || formData.sku,
        category_id: formData.categoryId,
        brand_id: brandId,
        supplier_id: formData.supplierId || null,
        cost_price: formData.costPrice || 0,
        selling_price: formData.price || 0,
        stock_quantity: formData.stockQuantity || 0,
        min_stock_level: formData.minStockLevel || 5,
        is_active: true
      };

      console.log('Submitting product data:', productData);

      // Insert product into database
      const { data: product, error } = await supabase
        .from('lats_products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        toast.error(`Failed to create product: ${error.message}`);
        return;
      }

      // Show success message and summary modal
      toast.success('Product created successfully!');
      setCreatedProduct(product);
      setShowSummaryModal(true);

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
    
    // Set both SKU and barcode to the same value
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
    if (name && categoryId && !currentSku) {
      generateAutoSKU();
    }
  }, [formData.name, formData.categoryId]);

  // Form validation function
  const validateForm = () => {
    const errors: { [key: string]: boolean } = {};
    let valid = true;
    
    if (!formData.name.trim()) {
      errors.name = true;
      valid = false;
    }
    if (!formData.brand.trim()) {
      errors.brand = true;
      valid = false;
    }
    if (!formData.sku.trim()) {
      errors.sku = true;
      valid = false;
    }
    if (!formData.categoryId) {
      errors.categoryId = true;
      valid = false;
    }
    if (!formData.condition) {
      errors.condition = true;
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
    
    setFieldErrors(errors);
    return valid;
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

    // Auto-generate SKU
    if (formData.sku) {
      const baseSku = formData.sku.replace(/-VARIANT$/, '');
      newVariant.sku = `${baseSku}-${newVariant.name.replace(/\s+/g, '-').toUpperCase()}`;
    }

    setVariants(prev => [...prev, newVariant]);
  };

  // Add attribute to a variant
  const addAttributeToVariant = (variantIndex: number, attributeName: string) => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes, [attributeName]: '' };
    updateVariant(variantIndex, 'attributes', newAttributes);
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
      toast.error('At least one variant is required');
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
    if (currentValue === '' || currentValue === null || currentValue === undefined) {
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
        {/* Quick Actions Panel */}
        {completionPercentage >= 80 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-900">Quick Actions</h4>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {completionPercentage}% Complete
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(true)}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <Settings size={16} className="text-orange-500" />
                <span className="text-sm font-medium">Advanced Settings</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowVariants(true)}
                disabled={!formData.name || !formData.categoryId}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <Layers size={16} className="text-purple-500" />
                <span className="text-sm font-medium">Add Variants</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  // Auto-generate SKU
                  generateAutoSKU();
                }}
                disabled={!formData.name || !formData.categoryId}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <QrCode size={16} className="text-green-500" />
                <span className="text-sm font-medium">Auto SKU</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  // Preview product
                  console.log('Preview product:', formData);
                }}
                disabled={!formData.name || !formData.categoryId}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <Eye size={16} className="text-purple-500" />
                <span className="text-sm font-medium">Preview</span>
              </button>
            </div>
          </div>
        )}

        <GlassCard className="mb-6">


          {/* Unified Product Form */}
          <div className="space-y-6">
            {/* Product Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                Product Information
              </h3>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brand */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.brand ? 'text-red-600' : 'text-gray-700'}`}>
                      Brand *
                      {!formData.brand && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                    </label>
                    <BrandInput
                      value={formData.brand}
                      onChange={val => setFormData(prev => ({ ...prev, brand: val }))}
                      placeholder="Enter brand"
                      required
                      className={`w-full ${!formData.brand ? 'ring-2 ring-yellow-200' : ''}`}
                    />
                  </div>
                  
                  {/* Product Name & Model */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.name ? 'text-red-600' : 'text-gray-700'}`}>
                      Product Name & Model *
                      {!formData.name && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.name ? 'border-red-500 focus:border-red-600' : !formData.name ? 'border-yellow-300 focus:border-yellow-500' : 'border-gray-300 focus:border-blue-500'}`}
                        placeholder="Enter product name and model (e.g., iPhone 14 Pro, Samsung Galaxy S23)"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      {isCheckingName && (
                        <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={18} />
                      )}
                      {nameExists && !isCheckingName && (
                        <AlertIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                      )}
                    </div>
                    {nameExists && !isCheckingName && (
                      <div className="text-orange-600 text-sm mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
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
                  </div>
                  
                  {/* SKU/Barcode */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.sku ? 'text-red-600' : 'text-gray-700'}`}>
                      SKU/Barcode *
                      {!formData.sku && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.sku ? 'border-red-500 focus:border-red-600' : !formData.sku ? 'border-yellow-300 focus:border-yellow-500' : 'border-gray-300 focus:border-blue-500'}`}
                        placeholder="Enter SKU, barcode, serial number, or IMEI"
                        value={formData.sku}
                        onChange={e => {
                          const newValue = e.target.value.toUpperCase();
                          setFormData(prev => ({ 
                            ...prev, 
                            sku: newValue,
                            barcode: newValue 
                          }));
                        }}
                        onClick={() => {
                          if (formData.sku) {
                            setFormData(prev => ({ ...prev, sku: '', barcode: '' }));
                          }
                        }}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                    {/* <p className="text-xs text-gray-500 mt-2">
                      Auto-generated from product name and category. Click to clear and enter manually.
                    </p> */}
                  </div>
                  
                  {/* Category */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.categoryId ? 'text-red-600' : 'text-gray-700'}`}>
                      Category *
                      {!formData.categoryId && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                    </label>
                    <select
                      className={`w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.categoryId ? 'border-red-500 focus:border-red-600' : !formData.categoryId ? 'border-yellow-300 focus:border-yellow-500' : 'border-gray-300 focus:border-blue-500'}`}
                      value={formData.categoryId}
                      onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  

                  
                  {/* Store Shelf */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Store Shelf</label>
                    <input
                      type="text"
                      className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., A1, B2, Shelf 3"
                      value={formData.storeShelf}
                      onChange={e => setFormData(prev => ({ ...prev, storeShelf: e.target.value }))}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                  
                  {/* Supplier */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Supplier</label>
                    <select
                      className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      value={formData.supplierId}
                      onChange={e => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Condition Buttons */}
                <div>
                  <label className={`block mb-3 font-medium ${fieldErrors.condition ? 'text-red-600' : 'text-gray-700'}`}>
                    Condition *
                    {!formData.condition && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, condition: 'new' }))}
                      className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.condition === 'new'
                          ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        formData.condition === 'new'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="font-medium">New</span>
                      {formData.condition === 'new' && (
                        <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, condition: 'used' }))}
                      className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.condition === 'used'
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        formData.condition === 'used'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="font-medium">Used</span>
                      {formData.condition === 'used' && (
                        <svg className="w-4 h-4 text-orange-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, condition: 'refurbished' }))}
                      className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.condition === 'refurbished'
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        formData.condition === 'refurbished'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="font-medium">Refurbished</span>
                      {formData.condition === 'refurbished' && (
                        <svg className="w-4 h-4 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pricing & Stock Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Cost Price */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.costPrice ? 'text-red-600' : 'text-gray-700'}`}>
                      Cost Price *
                      {!formData.costPrice && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.costPrice ? 'border-red-500 focus:border-red-600' : !formData.costPrice ? 'border-yellow-300 focus:border-yellow-500' : 'border-gray-300 focus:border-blue-500'}`}
                        placeholder="0.00"
                        value={formData.costPrice === 0 ? '' : formatNumber(formData.costPrice)}
                        onChange={(e) => handlePriceChange('costPrice', e.target.value)}
                        onFocus={() => handlePriceFocus('costPrice')}
                        onBlur={() => handlePriceBlur('costPrice')}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.price ? 'text-red-600' : 'text-gray-700'}`}>
                      Selling Price *
                      {!formData.price && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.price ? 'border-red-500 focus:border-red-600' : !formData.price ? 'border-yellow-300 focus:border-yellow-500' : 'border-gray-300 focus:border-blue-500'}`}
                        placeholder="0.00"
                        value={formData.price === 0 ? '' : formatNumber(formData.price)}
                        onChange={(e) => handlePriceChange('price', e.target.value)}
                        onFocus={() => handlePriceFocus('price')}
                        onBlur={() => handlePriceBlur('price')}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.stockQuantity ? 'text-red-600' : 'text-gray-700'}`}>
                      Stock Quantity *
                      {!formData.stockQuantity && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                    </label>
                    <div className="relative">
                      <div className="w-full py-3 px-3 pr-24 pl-24 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-900">
                          {formData.stockQuantity || 0}
                        </span>
                      </div>
                      
                      {/* Minus button on the left */}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, stockQuantity: Math.max(0, (prev.stockQuantity || 0) - 1) }))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Decrease stock quantity"
                      >
                        −
                      </button>
                      
                      {/* Plus button on the right */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, stockQuantity: (prev.stockQuantity || 0) + 1 }))}
                          className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                          aria-label="Increase stock quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Min Stock Level */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.minStockLevel ? 'text-red-600' : 'text-gray-700'}`}>
                      Min Stock Level *
                      {!formData.minStockLevel && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                    </label>
                    <div className="relative">
                      <div className="w-full py-3 px-3 pr-24 pl-24 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-900">
                          {formData.minStockLevel || 0}
                        </span>
                      </div>
                      
                      {/* Minus button on the left */}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, minStockLevel: Math.max(0, (prev.minStockLevel || 0) - 1) }))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Decrease minimum stock level"
                      >
                        −
                      </button>
                      
                      {/* Plus button on the right */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, minStockLevel: (prev.minStockLevel || 0) + 1 }))}
                          className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                          aria-label="Increase minimum stock level"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                                 {/* Description */}
                 <div className="md:col-span-2">
                   <label className="block mb-2 font-medium text-gray-700">Product Description</label>
                   <textarea
                     className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                     placeholder="Enter detailed product description..."
                     rows={4}
                     value={formData.description}
                     onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                     autoComplete="off"
                     autoCorrect="off"
                     spellCheck={false}
                   />
                 </div>

                 {/* Product Images Section */}
                 <div className="space-y-4">
                   <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                     <div className="w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center">
                       <ImageIcon className="w-3 h-3 text-pink-600" />
                     </div>
                     <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
                   </div>
                   
                   <div className="space-y-4">
                     <div>
                       <label className="block mb-2 font-medium text-sm text-gray-700">
                         Product Images
                       </label>
                       
                       <ImageUpload
                         productId={tempProductId}
                         userId={currentUser?.id || ''}
                         onUploadComplete={(images) => {
                           console.log('📤 AddProductPage: Upload completed with images:', images);
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
                           console.log('📤 AddProductPage: Form images mapped:', formImages);
                           setFormData(prev => ({ ...prev, images: formImages }));
                           // Force ImageGallery to refresh by updating the key after a short delay
                           setTimeout(() => {
                             console.log('🔄 AddProductPage: Updating gallery key to force refresh');
                             setGalleryKey(prev => prev + 1);
                           }, 500);
                         }}
                         onUploadError={(error) => {
                           toast.error(`Upload failed: ${error}`);
                         }}
                         maxFiles={5}
                       />
                       
                       {/* ImageGallery component hidden - images are now managed within the upload component */}
                       {/* <ImageGallery
                         key={galleryKey} // Force re-render when images are uploaded
                         productId={tempProductId}
                         onImagesChange={(images) => {
                           console.log('📥 AddProductPage: ImageGallery onImagesChange called with:', images);
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
                           console.log('📥 AddProductPage: Form images updated:', formImages);
                           setFormData(prev => ({ ...prev, images: formImages }));
                         }}
                       /> */}
                     </div>
                                      </div>
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
                   </div>
                   
                   {showVariants && (
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
                             
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                  <input
                                    type="text"
                                    value={variant.name}
                                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                    className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-sm"
                                    placeholder="Name"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                                  <input
                                    type="text"
                                    value={variant.sku}
                                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                    className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-sm"
                                    placeholder="Auto-generated"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                                  <input
                                    type="text"
                                    value={variant.price === 0 ? '' : formatNumber(variant.price)}
                                    onChange={(e) => handleVariantPriceChange(index, 'price', e.target.value)}
                                    className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-sm"
                                    onFocus={() => handleVariantPriceFocus(index, 'price')}
                                    onBlur={() => handleVariantPriceBlur(index, 'price')}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Original Price</label>
                                  <input
                                    type="text"
                                    value={variant.costPrice === 0 ? '' : formatNumber(variant.costPrice)}
                                    onChange={(e) => handleVariantPriceChange(index, 'costPrice', e.target.value)}
                                    className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-sm"
                                    onFocus={() => handleVariantPriceFocus(index, 'costPrice')}
                                    onBlur={() => handleVariantPriceBlur(index, 'costPrice')}
                                  />
                                </div>
                              </div>

                             {/* Variant Values Section */}
                             <div className="mt-4 pt-4 border-t border-gray-100">
                               <div className="flex items-center justify-between mb-3">
                                 <h5 className="text-sm font-medium text-gray-700">Variant Values</h5>
                                 <div className="flex gap-1">
                                   <button
                                     type="button"
                                     onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       addAttributeToVariant(index, 'color');
                                     }}
                                     className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                   >
                                     + Color
                                   </button>
                                   <button
                                     type="button"
                                     onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       addAttributeToVariant(index, 'storage');
                                     }}
                                     className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                   >
                                     + Storage
                                   </button>
                                   <button
                                     type="button"
                                     onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       addAttributeToVariant(index, 'size');
                                     }}
                                     className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                   >
                                     + Size
                                   </button>
                                 </div>
                               </div>
                               
                               {Object.keys(variant.attributes).length > 0 ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                   {Object.entries(variant.attributes).map(([key, value]) => (
                                     <div key={key} className="relative">
                                       <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">
                                         {key}
                                       </label>
                                       <input
                                         type="text"
                                         value={value as string}
                                         onChange={(e) => {
                                           const newAttributes = { ...variant.attributes, [key]: e.target.value };
                                           updateVariant(index, 'attributes', newAttributes);
                                         }}
                                         className="w-full py-2 px-3 pr-8 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-sm"
                                         placeholder={`Enter ${key} values (comma separated)`}
                                       />
                                       <button
                                         type="button"
                                         onClick={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           removeAttributeFromVariant(index, key);
                                         }}
                                         className="absolute right-2 top-7 text-red-500 hover:text-red-700"
                                         title="Remove option"
                                       >
                                         <X size={14} />
                                       </button>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <p className="text-sm text-gray-500 text-center py-3">
                                   Click the buttons above to add variant values like color, storage, or size
                                 </p>
                               )}
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
                      completionPercentage === 100 
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' 
                        : completionPercentage >= 70
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                    onClick={handleFormSubmit}
                    disabled={isLoading || isSubmitting || completionPercentage < 100}
                  >
                    {isLoading || isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : completionPercentage === 100 ? (
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Create Product
                      </div>
                    ) : completionPercentage >= 70 ? (
                      <div className="flex items-center gap-2">
                        <span>Almost Ready ({completionPercentage}%)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Complete Form ({completionPercentage}%)</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Product Created Successfully!</h2>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
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
                    >
                      <QrCode size={20} />
                      Print QR Code
                    </button>
                    
                    <button
                      onClick={() => {
                        const qrUrl = generateQRCode(createdProduct.id, createdProduct.name);
                        window.open(qrUrl, '_blank');
                      }}
                      className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <ExternalLink size={20} />
                      View QR Code
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowSummaryModal(false);
                      navigate('/lats/inventory');
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
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
                  >
                    Create Another Product
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
