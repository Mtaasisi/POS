import React, { useState } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { 
  Truck, 
  MapPin, 
  Building, 
  X, 
  Check,
  Clock,
  Package,
  Car
} from 'lucide-react';

interface DeliveryOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deliveryData: {
    method: string;
    address: string;
    city: string;
    notes: string;
  }) => void;
  currentDeliveryData?: {
    method: string;
    address: string;
    city: string;
    notes: string;
  };
}

const DeliveryOptionsModal: React.FC<DeliveryOptionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentDeliveryData
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState(currentDeliveryData?.method || 'pickup');
  const [deliveryAddress, setDeliveryAddress] = useState(currentDeliveryData?.address || '');
  const [deliveryCity, setDeliveryCity] = useState(currentDeliveryData?.city || '');
  const [deliveryNotes, setDeliveryNotes] = useState(currentDeliveryData?.notes || '');

  const deliveryMethods = [
    {
      id: 'pickup',
      name: 'Pickup',
      icon: Building,
      description: 'Customer picks up from store',
      color: 'bg-blue-500'
    },
    {
      id: 'local_transport',
      name: 'Local Transport',
      icon: Car,
      description: 'Local delivery service',
      color: 'bg-green-500'
    },
    {
      id: 'air_cargo',
      name: 'Air Cargo',
      icon: Package,
      description: 'Fast air delivery',
      color: 'bg-purple-500'
    },
    {
      id: 'bus_cargo',
      name: 'Bus Cargo',
      icon: Truck,
      description: 'Bus transport delivery',
      color: 'bg-orange-500'
    }
  ];

  const handleConfirm = () => {
    onConfirm({
      method: deliveryMethod,
      address: deliveryAddress,
      city: deliveryCity,
      notes: deliveryNotes
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <GlassCard className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Delivery Options</h2>
              <p className="text-sm text-gray-600">Configure delivery settings for this order</p>
            </div>
          </div>
          <GlassButton
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X size={16} />
          </GlassButton>
        </div>

        {/* Delivery Method Selection */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Delivery Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deliveryMethods.map((method) => {
              const IconComponent = method.icon;
              return (
                <div
                  key={method.id}
                  onClick={() => setDeliveryMethod(method.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    deliveryMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${method.color} flex items-center justify-center`}>
                      <IconComponent size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{method.name}</h4>
                        {deliveryMethod === method.id && (
                          <Check size={16} className="text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address (only show if not pickup) */}
        {deliveryMethod !== 'pickup' && (
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900">Delivery Address</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={14} className="inline mr-1" />
                Street Address
              </label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter delivery address..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building size={14} className="inline mr-1" />
                City
              </label>
              <input
                type="text"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
                placeholder="Enter city..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={14} className="inline mr-1" />
                Delivery Notes
              </label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Any special delivery instructions..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Pickup Information */}
        {deliveryMethod === 'pickup' && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Building size={20} className="text-blue-600" />
                <h4 className="font-medium text-blue-900">Pickup Information</h4>
              </div>
              <p className="text-sm text-blue-700">
                Customer will pick up their order from the store location. 
                No delivery address is required.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <GlassButton
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </GlassButton>
          <GlassButton
            onClick={handleConfirm}
            className="flex-1 bg-blue-500 text-white"
          >
            <Check size={16} className="mr-2" />
            Confirm Delivery
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default DeliveryOptionsModal; 