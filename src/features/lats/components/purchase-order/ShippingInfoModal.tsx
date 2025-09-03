// ShippingInfoModal component - For managing shipping information for purchase orders
import React, { useState, useEffect } from 'react';
import {
  Truck, Package, Calendar, MapPin, User, Phone, CreditCard,
  CheckCircle, XCircle, AlertCircle, X, Save
} from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';
import { ShippingInfo } from '../../types/inventory';

interface ShippingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shippingInfo: ShippingInfo) => Promise<void>;
  existingShippingInfo?: ShippingInfo | null;
  orderNumber: string;
  isLoading?: boolean;
}

const ShippingInfoModal: React.FC<ShippingInfoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingShippingInfo,
  orderNumber,
  isLoading = false
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<ShippingInfo>>({
    carrier: '',
    trackingNumber: '',
    shippingMethod: '',
    estimatedDelivery: '',
    shippingCost: undefined,
    notes: '',
    shippedDate: new Date().toISOString().split('T')[0],
    shippedBy: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with existing data
  useEffect(() => {
    if (existingShippingInfo) {
      setFormData({
        carrier: existingShippingInfo.carrier || '',
        trackingNumber: existingShippingInfo.trackingNumber || '',
        shippingMethod: existingShippingInfo.shippingMethod || '',
        estimatedDelivery: existingShippingInfo.estimatedDelivery ? 
          new Date(existingShippingInfo.estimatedDelivery).toISOString().split('T')[0] : '',
        shippingCost: existingShippingInfo.shippingCost,
        notes: existingShippingInfo.notes || '',
        shippedDate: existingShippingInfo.shippedDate ?
          new Date(existingShippingInfo.shippedDate).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        shippedBy: existingShippingInfo.shippedBy || ''
      });
    }
  }, [existingShippingInfo]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.carrier?.trim()) {
      newErrors.carrier = 'Carrier is required';
    }
    if (!formData.trackingNumber?.trim()) {
      newErrors.trackingNumber = 'Tracking number is required';
    }
    if (!formData.shippingMethod?.trim()) {
      newErrors.shippingMethod = 'Shipping method is required';
    }
    if (!formData.estimatedDelivery) {
      newErrors.estimatedDelivery = 'Estimated delivery date is required';
    }
    if (!formData.shippedDate) {
      newErrors.shippedDate = 'Shipped date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const shippingInfo: ShippingInfo = {
        carrier: formData.carrier!,
        trackingNumber: formData.trackingNumber!,
        shippingMethod: formData.shippingMethod!,
        estimatedDelivery: formData.estimatedDelivery!,
        shippedDate: formData.shippedDate!,
        shippingCost: formData.shippingCost,
        notes: formData.notes,
        shippedBy: formData.shippedBy
      };

      await onSave(shippingInfo);
      toast.success('Shipping information saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving shipping info:', error);
      toast.error('Failed to save shipping information');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ShippingInfo, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const shippingCarriers = [
    'DHL Express',
    'FedEx',
    'UPS',
    'DPD',
    'PostNet Tanzania',
    'Speed Post',
    'Aramex',
    'TNT',
    'Other'
  ];

  const shippingMethods = [
    'Express Delivery',
    'Standard Delivery',
    'Economy Delivery',
    'Next Day Delivery',
    'Same Day Delivery',
    'Pickup',
    'Other'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <GlassCard className="m-0 border-0 shadow-none">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>
              <p className="text-gray-600 mt-1">Purchase Order: {orderNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {/* Shipping Details Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Shipping Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Carrier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carrier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.carrier}
                    onChange={(e) => handleInputChange('carrier', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.carrier ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select carrier</option>
                    {shippingCarriers.map(carrier => (
                      <option key={carrier} value={carrier}>{carrier}</option>
                    ))}
                  </select>
                  {errors.carrier && <p className="text-red-500 text-sm mt-1">{errors.carrier}</p>}
                </div>

                {/* Tracking Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.trackingNumber}
                    onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                    placeholder="Enter tracking number"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.trackingNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.trackingNumber && <p className="text-red-500 text-sm mt-1">{errors.trackingNumber}</p>}
                </div>

                {/* Shipping Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.shippingMethod}
                    onChange={(e) => handleInputChange('shippingMethod', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.shippingMethod ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select method</option>
                    {shippingMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                  {errors.shippingMethod && <p className="text-red-500 text-sm mt-1">{errors.shippingMethod}</p>}
                </div>

                {/* Shipping Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Cost (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.shippingCost || ''}
                    onChange={(e) => handleInputChange('shippingCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Date Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Date Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Shipped Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipped Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.shippedDate}
                    onChange={(e) => handleInputChange('shippedDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.shippedDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.shippedDate && <p className="text-red-500 text-sm mt-1">{errors.shippedDate}</p>}
                </div>

                {/* Estimated Delivery */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delivery <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.estimatedDelivery}
                    onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.estimatedDelivery ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.estimatedDelivery && <p className="text-red-500 text-sm mt-1">{errors.estimatedDelivery}</p>}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Additional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Shipped By */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipped By
                  </label>
                  <input
                    type="text"
                    value={formData.shippedBy}
                    onChange={(e) => handleInputChange('shippedBy', e.target.value)}
                    placeholder="Enter shipper name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional shipping notes or special instructions"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
            <GlassButton
              onClick={onClose}
              variant="outline"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </GlassButton>

            <GlassButton
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : existingShippingInfo ? 'Update Shipping' : 'Save Shipping'}
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ShippingInfoModal;