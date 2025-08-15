// AddExternalProductModal component for LATS module
import React, { useState } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { X, Package, DollarSign, Hash, Tag, Plus } from 'lucide-react';

interface ExternalProductData {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;
  brand: string;
  barcode?: string;
  notes?: string;
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
    brand: '',
    barcode: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof ExternalProductData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || formData.price <= 0) return;
    
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onProductAdded(formData);
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sku = `EXT-${timestamp}-${random}`;
    handleInputChange('sku', sku);
  };

  const quickCategories = [
    'Electronics', 'Clothing', 'Accessories', 'Home & Garden', 
    'Sports', 'Books', 'Food & Beverages', 'Other'
  ];

  const quickBrands = [
    'Generic', 'Local Brand', 'International Brand', 'Custom'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Product Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      placeholder="Enter SKU"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateSKU}
                      className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Generate SKU"
                    >
                      <Hash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pricing & Quantity
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (TZS) <span className="text-red-500">*</span>
                  </label>
                  <PriceInput
                    value={formData.price}
                    onChange={(value) => handleInputChange('price', value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Category & Brand */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Category & Brand
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="">Select category</option>
                    {quickCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="">Select brand</option>
                    {quickBrands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Enter barcode (optional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Any additional notes"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-2">Product Summary</h4>
              <div className="space-y-1 text-sm text-orange-800">
                <div className="flex justify-between">
                  <span>Product:</span>
                  <span className="font-medium">{formData.name || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span>SKU:</span>
                  <span className="font-medium">{formData.sku || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium text-green-600">
                    TZS {formData.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-medium">{formData.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Value:</span>
                  <span className="font-medium text-green-600">
                    TZS {(formData.price * formData.quantity).toLocaleString()}
                  </span>
                </div>
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
