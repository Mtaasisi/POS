import React from 'react';
import { DeliveryMethod } from '../../types';
import GlassButton from '../ui/GlassButton';
import {
  Truck,
  MapPin,
  Package,
  Clock,
  Plane,
  Bus,
  Home,
  Navigation,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Phone,
  Mail,
  Globe,
  Building,
  Car
} from 'lucide-react';

interface DeliverySectionProps {
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  deliveryCity: string;
  setDeliveryCity: (city: string) => void;
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  deliveryNotes: string;
  setDeliveryNotes: (notes: string) => void;
}

const DeliverySection: React.FC<DeliverySectionProps> = ({
  deliveryAddress,
  setDeliveryAddress,
  deliveryCity,
  setDeliveryCity,
  deliveryMethod,
  setDeliveryMethod,
  deliveryNotes,
  setDeliveryNotes
}) => {
  const getDeliveryMethodIcon = (method: DeliveryMethod) => {
    switch (method) {
      case 'local_transport':
        return <Truck className="w-5 h-5" />;
      case 'air_cargo':
        return <Plane className="w-5 h-5" />;
      case 'bus_cargo':
        return <Bus className="w-5 h-5" />;
      case 'pickup':
        return <Home className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getDeliveryMethodColor = (method: DeliveryMethod) => {
    switch (method) {
      case 'local_transport':
        return 'from-blue-500 to-indigo-600';
      case 'air_cargo':
        return 'from-purple-500 to-pink-600';
      case 'bus_cargo':
        return 'from-green-500 to-emerald-600';
      case 'pickup':
        return 'from-orange-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getDeliveryMethodLabel = (method: DeliveryMethod) => {
    switch (method) {
      case 'local_transport':
        return 'Local Transport';
      case 'air_cargo':
        return 'Air Cargo';
      case 'bus_cargo':
        return 'Bus Cargo';
      case 'pickup':
        return 'Pickup';
      default:
        return method;
    }
  };

  const getDeliveryMethodDescription = (method: DeliveryMethod) => {
    switch (method) {
      case 'local_transport':
        return 'Fast local delivery within the city';
      case 'air_cargo':
        return 'Express air freight for urgent deliveries';
      case 'bus_cargo':
        return 'Economical bus transport for larger items';
      case 'pickup':
        return 'Customer picks up from our location';
      default:
        return '';
    }
  };

  const getDeliveryMethodTime = (method: DeliveryMethod) => {
    switch (method) {
      case 'local_transport':
        return '1-2 days';
      case 'air_cargo':
        return 'Same day';
      case 'bus_cargo':
        return '3-5 days';
      case 'pickup':
        return 'Immediate';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Delivery Method Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-4">
          Delivery Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['local_transport', 'air_cargo', 'bus_cargo', 'pickup'] as DeliveryMethod[]).map((method) => (
            <GlassButton
              key={method}
              variant={deliveryMethod === method ? 'default' : 'outline'}
              onClick={() => setDeliveryMethod(method)}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                deliveryMethod === method
                  ? `bg-gradient-to-r ${getDeliveryMethodColor(method)} text-white shadow-lg`
                  : 'border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              {getDeliveryMethodIcon(method)}
              <div className="text-left">
                <span className="font-medium block">{getDeliveryMethodLabel(method)}</span>
                <span className="text-xs opacity-75">{getDeliveryMethodTime(method)}</span>
              </div>
            </GlassButton>
          ))}
        </div>
      </div>

      {/* Delivery Method Info */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            {getDeliveryMethodIcon(deliveryMethod)}
          </div>
          <div>
            <span className="font-semibold text-blue-800">{getDeliveryMethodLabel(deliveryMethod)}</span>
            <p className="text-sm text-blue-700">{getDeliveryMethodDescription(deliveryMethod)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Clock className="w-4 h-4" />
          <span>Estimated delivery: {getDeliveryMethodTime(deliveryMethod)}</span>
        </div>
      </div>

      {/* Delivery Address */}
      {deliveryMethod !== 'pickup' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Delivery Address
            </label>
            <div className="relative">
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter full delivery address..."
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
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
                placeholder="Enter city..."
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <Building className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </div>
      )}

      {/* Pickup Information */}
      {deliveryMethod === 'pickup' && (
        <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Home className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-800">Pickup Information</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">123 Main Street, Downtown</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">+255 123 456 789</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">Mon-Fri: 8:00 AM - 6:00 PM</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">Please bring valid ID for pickup</span>
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
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            placeholder="Add any special delivery instructions, landmarks, or contact information..."
            rows={3}
            className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
          />
          <Navigation className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Delivery Summary */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <Package className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold text-emerald-800">Delivery Summary</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Method:</span>
            <span className="font-medium text-gray-900">{getDeliveryMethodLabel(deliveryMethod)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Time:</span>
            <span className="font-medium text-gray-900">{getDeliveryMethodTime(deliveryMethod)}</span>
          </div>
          
          {deliveryMethod !== 'pickup' && deliveryAddress && (
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Address:</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%]">
                {deliveryAddress}
                {deliveryCity && `, ${deliveryCity}`}
              </span>
            </div>
          )}
          
          {deliveryNotes && (
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Notes:</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%]">
                {deliveryNotes}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Status */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-purple-800">Delivery Status</span>
        </div>
        
        <div className="flex items-center gap-2">
          {deliveryMethod === 'pickup' ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Ready for Pickup</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-600 font-medium">Will be delivered after payment</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliverySection; 