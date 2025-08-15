import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { X, Save, Package, AlertCircle } from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { SparePart } from '../../types/inventory';
import { toast } from 'react-hot-toast';

interface SparePartFormProps {
  sparePart?: SparePart | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const SparePartForm: React.FC<SparePartFormProps> = ({ 
  sparePart, 
  onSave, 
  onCancel 
}) => {
  const { currentUser } = useAuth();
  const { categories, loadCategories } = useInventoryStore();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    partNumber: '',
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    minQuantity: 0,
    location: '',
    barcode: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Initialize form with existing data
  useEffect(() => {
    if (sparePart) {
      setFormData({
        name: sparePart.name,
        description: sparePart.description || '',
        categoryId: sparePart.categoryId,
        partNumber: sparePart.partNumber,
        costPrice: sparePart.costPrice,
        sellingPrice: sparePart.sellingPrice,
        quantity: sparePart.quantity,
        minQuantity: sparePart.minQuantity,
        location: sparePart.location || '',
        barcode: sparePart.barcode || '',
        isActive: sparePart.isActive
      });
    }
  }, [sparePart]);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.partNumber.trim()) {
      newErrors.partNumber = 'Part number is required';
    }

    if (formData.costPrice < 0) {
      newErrors.costPrice = 'Cost price cannot be negative';
    }

    if (formData.sellingPrice < 0) {
      newErrors.sellingPrice = 'Selling price cannot be negative';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }

    if (formData.minQuantity < 0) {
      newErrors.minQuantity = 'Minimum quantity cannot be negative';
    }

    if (formData.sellingPrice < formData.costPrice) {
      newErrors.sellingPrice = 'Selling price should be greater than or equal to cost price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving spare part:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {sparePart ? 'Edit Spare Part' : 'Add New Spare Part'}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter spare part name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Part Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part Number *
                </label>
                <input
                  type="text"
                  value={formData.partNumber}
                  onChange={(e) => handleInputChange('partNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.partNumber ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter part number"
                />
                {errors.partNumber && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.partNumber}
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
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.categoryId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.categoryId}
                  </p>
                )}
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter barcode (optional)"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter description (optional)"
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cost Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <PriceInput
                    value={formData.costPrice}
                    onChange={(value) => handleInputChange('costPrice', value)}
                    placeholder="0"
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.costPrice ? 'border-red-300' : 'border-gray-300'
                    }`}
                    error={errors.costPrice}
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <PriceInput
                    value={formData.sellingPrice}
                    onChange={(value) => handleInputChange('sellingPrice', value)}
                    placeholder="0"
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.sellingPrice ? 'border-red-300' : 'border-gray-300'
                    }`}
                    error={errors.sellingPrice}
                  />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.quantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.quantity}
                  </p>
                )}
              </div>

              {/* Minimum Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minQuantity}
                  onChange={(e) => handleInputChange('minQuantity', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.minQuantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.minQuantity && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.minQuantity}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Shelf A1, Drawer 3"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active (available for use)
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <GlassButton
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : (sparePart ? 'Update' : 'Create')}
              </GlassButton>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
};

export default SparePartForm;
