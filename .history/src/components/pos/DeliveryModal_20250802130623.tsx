import React, { useState } from 'react';
import { DeliveryMethod } from '../../types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import Modal from '../ui/Modal';
import {
  Truck,
  MapPin,
  Plane,
  Bus,
  Home,
  Edit,
  CheckCircle,
  Clock,
  Navigation,
  Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  deliveryCity: string;
  setDeliveryCity: (city: string) => void;
  deliveryNotes: string;
  setDeliveryNotes: (notes: string) => void;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  deliveryMethod,
  setDeliveryMethod,
  deliveryAddress,
  setDeliveryAddress,
  deliveryCity,
  setDeliveryCity,
  deliveryNotes,
  setDeliveryNotes
}) => {
  const [tempAddress, setTempAddress] = useState(deliveryAddress);
  const [tempCity, setTempCity] = useState(deliveryCity);
  const [tempNotes, setTempNotes] = useState(deliveryNotes);

  const deliveryMethods = [
    { 
      value: 'local_transport', 
      label: 'Local Transport', 
      icon: <Truck className="w-4 h-4" />, 
      color: 'from-blue-500 to-indigo-600',
      description: 'Delivery within the city (1-2 days)',
      cost: '5,000 - 15,000 TZS'
    },
    { 
      value: 'air_cargo', 
      label: 'Air Cargo', 
      icon: <Plane className="w-4 h-4" />, 
      color: 'from-purple-500 to-pink-600',
      description: 'Fast delivery by air (Same day)',
      cost: '25,000 - 50,000 TZS'
    },
    { 
      value: 'bus_cargo', 
      label: 'Bus Cargo', 
      icon: <Bus className="w-4 h-4" />, 
      color: 'from-green-500 to-emerald-600',
      description: 'Economical delivery by bus (3-5 days)',
      cost: '10,000 - 25,000 TZS'
    },
    { 
      value: 'pickup', 
      label: 'Pickup', 
      icon: <Home className="w-4 h-4" />, 
      color: 'from-orange-500 to-red-600',
      description: 'Customer picks up from our location',
      cost: 'Free'
    }
  ];

  const handleConfirm = () => {
    setDeliveryAddress(tempAddress);
    setDeliveryCity(tempCity);
    setDeliveryNotes(tempNotes);
    toast.success('Delivery configuration updated');
    onClose();
  };

  const handleCancel = () => {
    setTempAddress(deliveryAddress);
    setTempCity(deliveryCity);
    setTempNotes(deliveryNotes);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Delivery Configuration"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Delivery Method Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Delivery Method
          </label>
          <div className="space-y-3">
            {deliveryMethods.map((method) => (
              <div
                key={method.value}
                onClick={() => setDeliveryMethod(method.value as DeliveryMethod)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  deliveryMethod === method.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${deliveryMethod === method.value ? `bg-gradient-to-r ${method.color}` : 'bg-gray-100'}`}>
                      <div className={deliveryMethod === method.value ? 'text-white' : 'text-gray-600'}>
                        {method.icon}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{method.label}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Cost: {method.cost}</p>
                    </div>
                  </div>
                  
                  {deliveryMethod === method.value && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address (only show if not pickup) */}
        {deliveryMethod !== 'pickup' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Address
              </label>
              <div className="relative">
                <textarea
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  placeholder="Enter delivery address..."
                  rows={3}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                />
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tempCity}
                  onChange={(e) => setTempCity(e.target.value)}
                  placeholder="Enter city..."
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <Navigation className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          </div>
        )}

        {/* Pickup Information */}
        {deliveryMethod === 'pickup' && (
          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Home className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Pickup Information</h4>
                <p className="text-sm text-gray-600">Customer will collect from our location</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Our Store Address</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Business Hours: 8:00 AM - 6:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Please bring ID for collection</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Delivery Notes
          </label>
          <div className="relative">
            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Add any special delivery instructions..."
              rows={3}
              className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
            />
            <Edit className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Delivery Summary */}
        <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-3">Delivery Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Method:</span>
              <span className="font-semibold text-gray-900">
                {deliveryMethods.find(m => m.value === deliveryMethod)?.label}
              </span>
            </div>
            
            {deliveryMethod !== 'pickup' && (
              <>
                {tempAddress && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-semibold text-gray-900 max-w-xs truncate">
                      {tempAddress}
                    </span>
                  </div>
                )}
                
                {tempCity && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">City:</span>
                    <span className="font-semibold text-gray-900">{tempCity}</span>
                  </div>
                )}
              </>
            )}
            
            {tempNotes && (
              <div className="flex justify-between">
                <span className="text-gray-600">Notes:</span>
                <span className="font-semibold text-gray-900 max-w-xs truncate">
                  {tempNotes}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <GlassButton
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Delivery
          </GlassButton>
          
          <GlassButton
            variant="outline"
            onClick={handleCancel}
            className="border-2 border-gray-200 hover:border-gray-300"
          >
            Cancel
          </GlassButton>
        </div>
      </div>
    </Modal>
  );
};

export default DeliveryModal; 