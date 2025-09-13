import React, { useCallback, useState } from 'react';

interface DeliverySettings {
  enable_delivery: boolean;
  default_delivery_fee: number;
  free_delivery_threshold: number;
  max_delivery_distance: number;
  enable_delivery_areas: boolean;
  delivery_areas: string[];
  area_delivery_fees: Record<string, number>;
  area_delivery_times: Record<string, number>;
  enable_delivery_hours: boolean;
  delivery_start_time: string;
  delivery_end_time: string;
  enable_same_day_delivery: boolean;
  enable_next_day_delivery: boolean;
  delivery_time_slots: string[];
  notify_customer_on_delivery: boolean;
  notify_driver_on_assignment: boolean;
  enable_sms_notifications: boolean;
  enable_email_notifications: boolean;
  enable_driver_assignment: boolean;
  driver_commission: number;
  require_signature: boolean;
  enable_driver_tracking: boolean;
  enable_scheduled_delivery: boolean;
  enable_partial_delivery: boolean;
  require_advance_payment: boolean;
  advance_payment_percent: number;
  deliveryMethod?: string;
  deliveryDistance?: number;
}

interface DynamicDeliveryCalculatorProps {
  subtotal: number;
  deliverySettings: DeliverySettings;
  onDeliveryFeeChange: (fee: number) => void;
}

const DynamicDeliveryCalculator: React.FC<DynamicDeliveryCalculatorProps> = ({
  subtotal,
  deliverySettings,
  onDeliveryFeeChange
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState(deliverySettings.deliveryMethod || 'standard');
  const [deliveryDistance, setDeliveryDistance] = useState(deliverySettings.deliveryDistance || 0);
  const [selectedArea, setSelectedArea] = useState<string>('');

  const calculateDeliveryFee = useCallback((subtotal: number, method: string, distance: number) => {
    if (!deliverySettings?.enable_delivery) return 0;
    
    // Check if order qualifies for free delivery
    if (subtotal >= deliverySettings.free_delivery_threshold) return 0;
    
    let baseFee = deliverySettings.default_delivery_fee || 2000;
    
    // Apply delivery method multipliers
    switch (method) {
      case 'express':
        baseFee *= 1.5; // 50% premium for express
        break;
      case 'same-day':
        baseFee *= 2.0; // 100% premium for same day
        break;
      case 'standard':
      default:
        baseFee *= 1.0; // Standard rate
        break;
    }
    
    // Apply distance-based fees
    if (distance > 0) {
      const distanceFee = Math.ceil(distance / 5) * 500; // 500 TZS per 5km
      baseFee += distanceFee;
    }
    
    // Apply time-based fees (rush hour, late night, etc.)
    const currentHour = new Date().getHours();
    if (currentHour >= 17 && currentHour <= 19) {
      baseFee *= 1.2; // 20% rush hour fee
    } else if (currentHour >= 22 || currentHour <= 6) {
      baseFee *= 1.3; // 30% late night fee
    }
    
    // Apply order value discounts for larger orders
    if (subtotal >= 50000) {
      baseFee *= 0.8; // 20% discount for orders over 50K
    } else if (subtotal >= 25000) {
      baseFee *= 0.9; // 10% discount for orders over 25K
    }
    
    return Math.round(baseFee);
  }, [deliverySettings]);

  // Calculate and notify parent of delivery fee changes
  React.useEffect(() => {
    const fee = calculateDeliveryFee(subtotal, deliveryMethod, deliveryDistance);
    onDeliveryFeeChange(fee);
  }, [subtotal, deliveryMethod, deliveryDistance, selectedArea, calculateDeliveryFee, onDeliveryFeeChange]);

  if (!deliverySettings.enable_delivery) {
    return null;
  }

  const currentFee = calculateDeliveryFee(subtotal, deliveryMethod, deliveryDistance);
  const isFreeDelivery = subtotal >= deliverySettings.free_delivery_threshold;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Delivery Options</h3>
      
      <div className="space-y-3">
        {/* Delivery Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Method
          </label>
          <select
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="standard">Standard (2-3 days)</option>
            <option value="express">Express (1-2 days)</option>
            <option value="same-day">Same Day</option>
          </select>
        </div>

        {/* Area Selection */}
        {deliverySettings.enable_delivery_areas && deliverySettings.delivery_areas.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Area
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select area</option>
              {deliverySettings.delivery_areas.map((area) => (
                <option key={area} value={area}>
                  {area} ({deliverySettings.area_delivery_fees[area] || deliverySettings.default_delivery_fee} TZS)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Distance Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Distance (km)
          </label>
          <input
            type="number"
            value={deliveryDistance}
            onChange={(e) => setDeliveryDistance(Number(e.target.value))}
            min="0"
            step="0.5"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter delivery distance"
          />
        </div>

        {/* Fee Breakdown */}
        <div className="bg-gray-50 rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Base Fee:</span>
            <span className="text-sm font-medium">
              {selectedArea && deliverySettings.area_delivery_fees[selectedArea] 
                ? `${deliverySettings.area_delivery_fees[selectedArea]} TZS (${selectedArea})`
                : `${deliverySettings.default_delivery_fee} TZS (Default)`
              }
            </span>
          </div>
          
          {deliveryMethod !== 'standard' && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-600">
                {deliveryMethod === 'express' ? 'Express Premium (+50%)' : 'Same Day Premium (+100%)'}:
              </span>
              <span className="text-sm font-medium">
                                 +{deliveryMethod === 'express' ? Math.round(deliverySettings.default_delivery_fee * 0.5) : deliverySettings.default_delivery_fee} TZS
              </span>
            </div>
          )}
          
          {deliveryDistance > 0 && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-600">Distance Fee:</span>
              <span className="text-sm font-medium">
                +{Math.ceil(deliveryDistance / 5) * 500} TZS
              </span>
            </div>
          )}
          
          {/* Time-based fees */}
          {(() => {
            const currentHour = new Date().getHours();
            if (currentHour >= 17 && currentHour <= 19) {
              return (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Rush Hour Fee (+20%):</span>
                  <span className="text-sm font-medium text-orange-600">
                    +{Math.round(currentFee * 0.2)} TZS
                  </span>
                </div>
              );
            } else if (currentHour >= 22 || currentHour <= 6) {
              return (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Late Night Fee (+30%):</span>
                  <span className="text-sm font-medium text-orange-600">
                    +{Math.round(currentFee * 0.3)} TZS
                  </span>
                </div>
              );
            }
            return null;
          })()}
          
          {/* Order value discounts */}
          {subtotal >= 25000 && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-600">
                {subtotal >= 50000 ? 'Large Order Discount (-20%)' : 'Medium Order Discount (-10%)'}:
              </span>
              <span className="text-sm font-medium text-green-600">
                -{Math.round(currentFee * (subtotal >= 50000 ? 0.2 : 0.1))} TZS
              </span>
            </div>
          )}
          
          <div className="border-t border-gray-200 mt-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-800">Total Delivery Fee:</span>
              <span className="text-base font-bold text-blue-600">
                {isFreeDelivery ? 'FREE' : `${currentFee} TZS`}
              </span>
            </div>
          </div>
        </div>

        {/* Free delivery notice */}
        {isFreeDelivery && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center">
              <span className="text-green-600 font-medium">
                                 🎉 Free delivery! Order value exceeds {deliverySettings.free_delivery_threshold} TZS
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicDeliveryCalculator;
