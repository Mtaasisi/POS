import React from 'react';
import { DeliveryMethod } from '../../types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import {
  Truck,
  MapPin,
  Edit,
  Plane,
  Bus,
  Home,
  Navigation,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DeliverySummaryCardProps {
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  deliveryCity: string;
  onOpenDeliveryModal: () => void;
}

const DeliverySummaryCard: React.FC<DeliverySummaryCardProps> = ({
  deliveryMethod,
  deliveryAddress,
  deliveryCity,
  onOpenDeliveryModal
}) => {
  const getDeliveryMethodIcon = (method: DeliveryMethod) => {
    switch (method) {
      case 'local_transport':
        return <Truck className="w-4 h-4" />;
      case 'air_cargo':
        return <Plane className="w-4 h-4" />;
      case 'bus_cargo':
        return <Bus className="w-4 h-4" />;
      case 'pickup':
        return <Home className="w-4 h-4" />;
      default:
        return <Truck className="w-4 h-4" />;
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

  const getDeliveryMethodColor = (method: DeliveryMethod) => {
    switch (method) {
      case 'local_transport':
        return 'text-blue-600 bg-blue-100';
      case 'air_cargo':
        return 'text-purple-600 bg-purple-100';
      case 'bus_cargo':
        return 'text-green-600 bg-green-100';
      case 'pickup':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Delivery</h3>
            <p className="text-sm text-gray-600">Method & address</p>
          </div>
        </div>
        
        <GlassButton
          onClick={onOpenDeliveryModal}
          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
        >
          <Edit className="w-4 h-4 mr-2" />
          Configure
        </GlassButton>
      </div>

      <div className="space-y-3">
        {/* Delivery Method */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50 rounded-xl">
          <div className="flex items-center gap-2">
            {getDeliveryMethodIcon(deliveryMethod)}
            <span className="font-medium text-gray-900">{getDeliveryMethodLabel(deliveryMethod)}</span>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDeliveryMethodColor(deliveryMethod)}`}>
            {getDeliveryMethodTime(deliveryMethod)}
          </span>
        </div>

        {/* Delivery Address */}
        {deliveryMethod !== 'pickup' && deliveryAddress ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{deliveryAddress}</p>
                {deliveryCity && (
                  <p className="text-gray-600">{deliveryCity}</p>
                )}
              </div>
            </div>
          </div>
        ) : deliveryMethod === 'pickup' ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-gray-900">Customer Pickup</span>
            </div>
            <p className="text-gray-600 text-xs">Customer will pick up from our location</p>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">No delivery address set</span>
            </div>
          </div>
        )}

        {/* Delivery Status */}
        <div className="flex items-center gap-2 pt-2">
          {deliveryMethod === 'pickup' ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Ready for Pickup</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-600 font-medium">Will be delivered after payment</span>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default DeliverySummaryCard; 