// AddExternalProductModal component for LATS module
import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { X, Package, DollarSign, Hash, Tag, Plus, Search, UserPlus, Layers } from 'lucide-react';
import { getCategories } from '../../../../lib/categoryApi';
import CategoryInput from '@/features/shared/components/ui/CategoryInput';

import { createExternalProduct } from '../../../../lib/externalProductApi';

interface ExternalProductData {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;

  barcode?: string;
  notes?: string;
  // Enhanced fields for supplier tracking and returns
  supplierName: string;
  supplierPhone?: string;
  purchaseDate: string;
  purchasePrice: number;
  purchaseQuantity: number;
  warrantyInfo?: string;
  returnPolicy?: string;
  productCondition: 'new' | 'used' | 'refurbished';
}

interface AddExternalProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (product: ExternalProductData) => void;
}

const AddExternalProductModal: React.FC<AddExternalProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded
}) => {
  const [formData, setFormData] = useState<ExternalProductData>({
    name: '',
    sku: '',
    price: 0,
    quantity: 1,
    category: '',
    barcode: '',
    notes: '',
    // Enhanced fields for supplier tracking and returns
    supplierName: '',
    supplierPhone: '',
    purchaseDate: '',
    purchasePrice: 0,
    purchaseQuantity: 1,
    warrantyInfo: '',
    returnPolicy: '',
    productCondition: 'new'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const [loadingData, setLoadingData] = useState(false);

  // Fetch categories when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (isOpen) {
        setLoadingData(true);
        try {
          const categoriesData = await getCategories();
          
          setCategories(categoriesData);
          
          // Auto-fill purchase date and generate SKU
          const today = new Date().toISOString().split('T')[0];
          const timestamp = Date.now().toString().slice(-6);
          const random = Math.random().toString(36).substring(2, 5).toUpperCase();
          const sku = `EXT-${timestamp}-${random}`;
          
          setFormData(prev => ({
            ...prev,
            purchaseDate: today,
            sku: sku
          }));
        } catch (error) {
          console.error('Error fetching categories:', error);
        } finally {
          setLoadingData(false);
        }
      }
    };
    
    fetchData();
  }, [isOpen]);

  const handleInputChange = (field: keyof ExternalProductData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!formData.name.trim()) {
      alert('Please enter a product name');
      return;
    }
    
    if (!formData.sku.trim()) {
      alert('Please enter a SKU or generate one');
      return;
    }
    
    if (formData.price <= 0) {
      alert('Please enter a valid price greater than 0');
      return;
    }
    
    if (formData.quantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }
    
    if (!formData.supplierName.trim()) {
      alert('Please enter a supplier name');
      return;
    }
    

    
    if (formData.purchasePrice <= 0) {
      alert('Please enter a valid purchase price greater than 0');
      return;
    }
    
    if (formData.purchaseQuantity <= 0) {
      alert('Please enter a valid purchase quantity greater than 0');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Save to database first
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category.trim() || null,
        barcode: formData.barcode?.trim() || null,
        supplier_name: formData.supplierName.trim(),
        supplier_phone: formData.supplierPhone?.trim() || null,
        purchase_date: formData.purchaseDate,
        purchase_price: formData.purchasePrice,
        purchase_quantity: formData.purchaseQuantity,
        selling_price: formData.price,
        warranty_info: formData.warrantyInfo?.trim() || null,
        product_condition: formData.productCondition,
        notes: formData.notes?.trim() || null
      };
      
      const savedProduct = await createExternalProduct(productData);
      console.log('✅ External product saved to database:', savedProduct);
      
      // Validate the product data before calling onProductAdded
      const validatedProduct = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        price: formData.price,
        quantity: formData.quantity,
        category: formData.category.trim(),
        barcode: formData.barcode?.trim() || '',
        notes: formData.notes?.trim() || '',
        // Enhanced fields for supplier tracking and returns
        supplierName: formData.supplierName.trim(),
        supplierPhone: formData.supplierPhone?.trim(),
        purchaseDate: formData.purchaseDate,
        purchasePrice: formData.purchasePrice,
        purchaseQuantity: formData.purchaseQuantity,
        warrantyInfo: formData.warrantyInfo?.trim(),
        returnPolicy: formData.returnPolicy?.trim(),
        productCondition: formData.productCondition
      };
      
      onProductAdded(validatedProduct);
      
      // Reset form after successful submission
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      const newSku = `EXT-${timestamp}-${random}`;
      
      setFormData({
        name: '',
        sku: newSku,
        price: 0,
        quantity: 1,
        category: '',
        barcode: '',
        notes: '',
        // Enhanced fields for supplier tracking and returns
        supplierName: '',
        supplierPhone: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        purchaseQuantity: 1,
        warrantyInfo: '',
        returnPolicy: '',
        productCondition: 'new'
      });
      
      setShowNotes(false);
      setShowSupplierSuggestions(false);
      
    } catch (error) {
      console.error('Error adding external product:', error);
      alert('Failed to add external product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };





  // Mock suppliers data - in real app, this would come from database
  const mockSuppliers = [
    { id: '1', name: 'Tech Supplier Ltd', phone: '+255 700 123 456' },
    { id: '2', name: 'Electronics Plus', phone: '+255 700 234 567' },
    { id: '3', name: 'Mobile World', phone: '+255 700 345 678' },
    { id: '4', name: 'Digital Solutions', phone: '+255 700 456 789' }
  ];

  const filteredSuppliers = mockSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(formData.supplierName.toLowerCase()) ||
    supplier.phone.includes(formData.supplierName)
  );

  const handleSupplierSelect = (supplier: any) => {
    setFormData(prev => ({
      ...prev,
      supplierName: supplier.name,
      supplierPhone: supplier.phone
    }));
    setShowSupplierSuggestions(false);
  };

  const handleCreateNewSupplier = () => {
    setShowSupplierSuggestions(false);
    // Focus on supplier name field for manual entry
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add External Product</h2>
                <p className="text-sm text-gray-600">Quick entry for products not in inventory</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Product Information */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Enter product name"
                      required
                    />
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    SKU/Barcode/Serial <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Auto-generated SKU"
                      required
                    />
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Category
                  </label>
                  <CategoryInput
                    value={formData.category}
                    onChange={(categoryId) => {
                      const selectedCategory = categories.find(cat => cat.id === categoryId);
                      handleInputChange('category', selectedCategory?.name || '');
                    }}
                    categories={categories}
                    placeholder="Select category"
                    disabled={loadingData}
                    className="w-full"
                  />
                </div>
                

              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Product Condition <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'new', label: 'New', color: 'bg-green-500 hover:bg-green-600' },
                    { value: 'used', label: 'Used', color: 'bg-blue-500 hover:bg-blue-600' },
                    { value: 'refurbished', label: 'Refurbished', color: 'bg-purple-500 hover:bg-purple-600' }
                  ].map((condition) => (
                    <button
                      key={condition.value}
                      type="button"
                      onClick={() => handleInputChange('productCondition', condition.value as 'new' | 'used' | 'refurbished')}
                      className={`px-3 py-3 text-sm rounded-lg border transition-colors ${
                        formData.productCondition === condition.value
                          ? `${condition.color} text-white border-transparent`
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {condition.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="space-y-4">
              
              <div className="relative">
                <label className="block text-gray-700 mb-2 font-medium">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => {
                      handleInputChange('supplierName', e.target.value);
                      setShowSupplierSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowSupplierSuggestions(formData.supplierName.length > 0)}
                    onBlur={() => setTimeout(() => setShowSupplierSuggestions(false), 200)}
                    className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter supplier name"
                    required
                  />
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                </div>
                
                {/* Supplier Suggestions Dropdown */}
                {showSupplierSuggestions && filteredSuppliers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        onClick={() => handleSupplierSelect(supplier)}
                        className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors last:border-b-0"
                      >
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-gray-600">{supplier.phone}</div>
                      </div>
                    ))}
                    
                    <button
                      onClick={handleCreateNewSupplier}
                      className="w-full p-3 border-t border-gray-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create New Supplier
                    </button>
                  </div>
                )}
              </div>


            </div>

            {/* Purchase & Pricing Information */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Purchase Price (TZS) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <PriceInput
                      value={formData.purchasePrice}
                      onChange={(value) => handleInputChange('purchasePrice', value)}
                      placeholder="0"
                      className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Purchase Quantity <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={formData.purchaseQuantity}
                      onChange={(e) => handleInputChange('purchaseQuantity', parseInt(e.target.value) || 1)}
                      className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Selling Price (TZS) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <PriceInput
                    value={formData.price}
                    onChange={(value) => handleInputChange('price', value)}
                    placeholder="0"
                    className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                </div>
              </div>


            </div>

                    {/* Warranty & Return Information */}
        <div className="space-y-4">
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Warranty (Months)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 3, 6, 12].map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => handleInputChange('warrantyInfo', months === 0 ? 'No warranty' : `${months} months`)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.warrantyInfo === (months === 0 ? 'No warranty' : `${months} months`)
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {months === 0 ? 'None' : `${months}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Notes - Optional with Plus Button */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-700 font-medium">
                    Additional Notes
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNotes(!showNotes)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Plus className={`w-4 h-4 transition-transform ${showNotes ? 'rotate-45' : ''}`} />
                  </button>
                </div>
                {showNotes && (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Any additional notes about the product or supplier"
                    rows={3}
                  />
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Summary</h4>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    TZS {formData.price.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Profit: TZS {((formData.price - formData.purchasePrice) * formData.quantity).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>{formData.name || 'Product name'}</div>
                <div className="text-right">{formData.supplierName || 'Supplier'}</div>
                <div>{formData.category || 'Category'}</div>
                <div className="text-right capitalize">{formData.productCondition}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <GlassButton
                type="button"
                onClick={onClose}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.sku || formData.price <= 0}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white"
              >
                {isSubmitting ? 'Adding Product...' : 'Add to Cart'}
              </GlassButton>
            </div>
            

          </form>
        </div>
      </GlassCard>
    </div>
  );
};

export default AddExternalProductModal;

