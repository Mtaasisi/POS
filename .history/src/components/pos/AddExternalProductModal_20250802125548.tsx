import React, { useState } from 'react';
import { CartItem } from '../../types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import Modal from '../ui/Modal';
import {
  Package,
  Plus,
  DollarSign,
  Hash,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Gift,
  ShoppingCart,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AddExternalProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: CartItem) => void;
}

const AddExternalProductModal: React.FC<AddExternalProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    quantity: 1
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const externalProduct: CartItem = {
      id: `external-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      quantity: formData.quantity,
      unit_price: formData.price,
      unit_cost: formData.price * 0.8, // Assume 20% margin for external products
      item_total: formData.price * formData.quantity,
      is_external_product: true,
      external_product_details: {
        name: formData.name,
        description: formData.description,
        price: formData.price
      }
    };

    onAddProduct(externalProduct);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      quantity: 1
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add External Product"
      size="lg"
    >
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Add External Product</h3>
              <p className="text-gray-600">Add products not in your inventory system</p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-purple-800">External Product Info</span>
            </div>
            <p className="text-sm text-purple-700">
              External products are items you sell but don't stock in your inventory. 
              These won't affect your stock levels and are perfect for drop-shipping or 
              special orders.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name..."
                className={`w-full px-4 py-3 pl-12 border-2 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                  errors.name ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              <Package className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            {errors.name && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Product Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description..."
                rows={3}
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              />
              <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Price and Quantity Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unit Price *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-3 pl-12 border-2 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.price ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              {errors.price && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.price}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  placeholder="1"
                  min="1"
                  className={`w-full px-4 py-3 pl-12 border-2 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.quantity ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                <Hash className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              {errors.quantity && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.quantity}
                </p>
              )}
            </div>
          </div>

          {/* Product Preview */}
          {formData.name && formData.price > 0 && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Product Preview</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold text-gray-900">{formData.name}</span>
                </div>
                
                {formData.description && (
                  <div className="flex items-start justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%]">
                      {formData.description}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Unit Price:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(formData.price)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-semibold text-gray-900">{formData.quantity}</span>
                </div>
                
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {formatCurrency(formData.price * formData.quantity)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <GlassButton
              type="submit"
              disabled={!formData.name || formData.price <= 0 || formData.quantity <= 0}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
              <Plus className="w-5 h-5" />
            </GlassButton>
            
            <GlassButton
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-6 py-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </GlassButton>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddExternalProductModal; 