import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Package, DollarSign, MapPin, Image as ImageIcon, X } from 'lucide-react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import CategoryInput from '../../../shared/components/ui/CategoryInput';
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { SimpleImageUpload } from '../../../../components/SimpleImageUpload';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { SparePart } from '../../types/spareParts';
import { toast } from 'react-hot-toast';

interface SparePartFormStepsProps {
  sparePart?: SparePart | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const SparePartFormSteps: React.FC<SparePartFormStepsProps> = ({ 
  sparePart, 
  onSave, 
  onCancel 
}) => {
  const { categories, suppliers, loadSparePartCategories, loadSuppliers } = useInventoryStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: sparePart?.name || '',
    partNumber: sparePart?.part_number || '',
    categoryId: sparePart?.category_id || null,
    brand: sparePart?.brand || '',
    description: sparePart?.description || '',
    
    // Step 2: Pricing & Stock
    costPrice: sparePart?.cost_price || 0,
    sellingPrice: sparePart?.selling_price || 0,
    quantity: sparePart?.quantity || 0,
    minQuantity: sparePart?.min_quantity || 0,
    
    // Step 3: Location & Images
    location: sparePart?.location || '',
    supplierId: sparePart?.supplier_id || null,
    images: sparePart?.images || [],
    condition: sparePart?.condition || 'new'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, title: 'Basic Info', icon: Package, description: 'Name, category, and description' },
    { id: 2, title: 'Pricing & Stock', icon: DollarSign, description: 'Cost, price, and inventory' },
    { id: 3, title: 'Location & Images', icon: MapPin, description: 'Storage location and photos' }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.categoryId) newErrors.categoryId = 'Category is required';
        break;
      case 2:
        if (formData.costPrice < 0) newErrors.costPrice = 'Cost price cannot be negative';
        if (formData.sellingPrice < 0) newErrors.sellingPrice = 'Selling price cannot be negative';
        if (formData.quantity < 0) newErrors.quantity = 'Quantity cannot be negative';
        if (formData.minQuantity < 0) newErrors.minQuantity = 'Minimum quantity cannot be negative';
        break;
      case 3:
        // Optional validation for step 3
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving spare part:', error);
      toast.error('Failed to save spare part');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter part name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part Number
              </label>
              <input
                type="text"
                value={formData.partNumber}
                onChange={(e) => updateFormData('partNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter part number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <CategoryInput
                value={formData.categoryId}
                onChange={(value) => updateFormData('categoryId', value)}
                categories={categories}
                error={errors.categoryId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => updateFormData('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter part description"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price
                </label>
                <PriceInput
                  value={formData.costPrice}
                  onChange={(value) => updateFormData('costPrice', value)}
                  placeholder="0.00"
                  error={errors.costPrice}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price
                </label>
                <PriceInput
                  value={formData.sellingPrice}
                  onChange={(value) => updateFormData('sellingPrice', value)}
                  placeholder="0.00"
                  error={errors.sellingPrice}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => updateFormData('quantity', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minQuantity}
                  onChange={(e) => updateFormData('minQuantity', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.minQuantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.minQuantity && <p className="text-red-500 text-xs mt-1">{errors.minQuantity}</p>}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Shelf A1, Room 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                value={formData.supplierId || ''}
                onChange={(e) => updateFormData('supplierId', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => updateFormData('condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Images
              </label>
              <SimpleImageUpload
                images={formData.images}
                onImagesChange={(images) => updateFormData('images', images)}
                maxImages={5}
                className="w-full"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {sparePart ? 'Edit Spare Part' : 'Add New Spare Part'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive ? 'border-blue-500 bg-blue-500 text-white' :
                      isCompleted ? 'border-green-500 bg-green-500 text-white' :
                      'border-gray-300 bg-white text-gray-400'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
              </p>
              <p className="text-xs text-gray-500">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <GlassButton
              onClick={handlePrevious}
              disabled={currentStep === 1}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </GlassButton>

            <div className="flex gap-2">
              <GlassButton
                onClick={onCancel}
                variant="outline"
              >
                Cancel
              </GlassButton>
              
              {currentStep < steps.length ? (
                <GlassButton
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </GlassButton>
              ) : (
                <GlassButton
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {sparePart ? 'Update Part' : 'Create Part'}
                    </>
                  )}
                </GlassButton>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SparePartFormSteps;
