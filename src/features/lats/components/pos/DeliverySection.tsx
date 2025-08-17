// DeliverySection component for LATS module
import React, { useState } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { X, MapPin, Clock, User, Phone, Truck, CheckCircle } from 'lucide-react';

interface DeliveryFormData {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryNotes: string;
  deliveryFee: number;
  deliveryMethod: 'standard' | 'express' | 'same-day';
}

interface DeliverySectionProps {
  isOpen: boolean;
  onClose: () => void;
  onDeliverySet: (delivery: DeliveryFormData) => void;
  selectedCustomer?: {
    name: string;
    phone: string;
  } | null;
}

const DeliverySection: React.FC<DeliverySectionProps> = ({
  isOpen,
  onClose,
  onDeliverySet,
  selectedCustomer
}) => {
  const [formData, setFormData] = useState<DeliveryFormData>({
    customerName: selectedCustomer?.name || '',
    customerPhone: selectedCustomer?.phone || '',
    deliveryAddress: '',
    deliveryDate: '',
    deliveryTime: '',
    deliveryNotes: '',
    deliveryFee: 0,
    deliveryMethod: 'standard'
  });

  // Update form data when selectedCustomer changes
  React.useEffect(() => {
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone
      }));
    }
  }, [selectedCustomer]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof DeliveryFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onDeliverySet(formData);
    } catch (error) {
      console.error('Error setting delivery:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeliveryFee = (method: string) => {
    switch (method) {
      case 'standard': return 500;
      case 'express': return 1000;
      case 'same-day': return 2000;
      default: return 500;
    }
  };

  const deliveryMethods = [
    { id: 'standard', name: 'Standard Delivery', time: '2-3 business days', fee: 500 },
    { id: 'express', name: 'Express Delivery', time: '1-2 business days', fee: 1000 },
    { id: 'same-day', name: 'Same Day Delivery', time: 'Same day', fee: 2000 }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Delivery Setup</h2>
                <p className="text-sm text-gray-600">Configure delivery options for this order</p>
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
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Delivery Address
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address
                </label>
                <textarea
                  value={formData.deliveryAddress}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter complete delivery address"
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* Delivery Method */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Delivery Method
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {deliveryMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.deliveryMethod === method.id
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      handleInputChange('deliveryMethod', method.id);
                      handleInputChange('deliveryFee', method.fee);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{method.name}</span>
                      {formData.deliveryMethod === method.id && (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{method.time}</p>
                    <p className="text-sm font-medium text-blue-600">TZS {method.fee}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Date & Time */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Delivery Schedule
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
                  <select
                    value={formData.deliveryTime}
                    onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  >
                    <option value="">Select time</option>
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 3 PM)</option>
                    <option value="evening">Evening (3 PM - 6 PM)</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Delivery Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Notes
              </label>
              <textarea
                value={formData.deliveryNotes}
                onChange={(e) => handleInputChange('deliveryNotes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Any special instructions for delivery..."
                rows={2}
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Delivery Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Delivery Method:</span>
                  <span className="font-medium">
                    {deliveryMethods.find(m => m.id === formData.deliveryMethod)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span className="font-medium text-green-600">
                    TZS {formData.deliveryFee}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Date:</span>
                  <span className="font-medium">{formData.deliveryDate || 'Not set'}</span>
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
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              >
                {isSubmitting ? 'Setting Delivery...' : 'Set Delivery'}
              </GlassButton>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
};

export default DeliverySection;
