import { useState, useCallback, useEffect } from 'react';

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

interface DeliveryCalculation {
  baseFee: number;
  methodMultiplier: number;
  distanceFee: number;
  timeMultiplier: number;
  orderDiscount: number;
  finalFee: number;
  isFreeDelivery: boolean;
  breakdown: {
    base: number;
    method: number;
    distance: number;
    time: number;
    discount: number;
  };
}

export const useDynamicDelivery = (deliverySettings: DeliverySettings) => {
  const [deliveryMethod, setDeliveryMethod] = useState(deliverySettings.deliveryMethod || 'standard');
  const [deliveryDistance, setDeliveryDistance] = useState(deliverySettings.deliveryDistance || 0);
  const [currentFee, setCurrentFee] = useState(0);

  const calculateDeliveryFee = useCallback((subtotal: number, selectedArea?: string): DeliveryCalculation => {
    if (!deliverySettings?.enable_delivery) {
      return {
        baseFee: 0,
        methodMultiplier: 1,
        distanceFee: 0,
        timeMultiplier: 1,
        orderDiscount: 1,
        finalFee: 0,
        isFreeDelivery: false,
        breakdown: { base: 0, method: 0, distance: 0, time: 0, discount: 0 }
      };
    }

    // Check if order qualifies for free delivery
    if (subtotal >= deliverySettings.free_delivery_threshold) {
      return {
        baseFee: deliverySettings.default_delivery_fee,
        methodMultiplier: 1,
        distanceFee: 0,
        timeMultiplier: 1,
        orderDiscount: 1,
        finalFee: 0,
        isFreeDelivery: true,
        breakdown: { base: 0, method: 0, distance: 0, time: 0, discount: 0 }
      };
    }

    // Use area-based fee if available, otherwise use default
    let baseFee = deliverySettings.default_delivery_fee || 2000;
    if (deliverySettings.enable_delivery_areas && selectedArea && deliverySettings.area_delivery_fees[selectedArea]) {
      baseFee = deliverySettings.area_delivery_fees[selectedArea];
    }
    let methodMultiplier = 1;
    let distanceFee = 0;
    let timeMultiplier = 1;
    let orderDiscount = 1;

    // Apply delivery method multipliers
    switch (deliveryMethod) {
      case 'express':
        methodMultiplier = 1.5; // 50% premium for express
        break;
      case 'same-day':
        methodMultiplier = 2.0; // 100% premium for same day
        break;
      case 'standard':
      default:
        methodMultiplier = 1.0; // Standard rate
        break;
    }

    // Apply distance-based fees
    if (deliveryDistance > 0) {
      distanceFee = Math.ceil(deliveryDistance / 5) * 500; // 500 TZS per 5km
    }

    // Apply time-based fees (rush hour, late night, etc.)
    const currentHour = new Date().getHours();
    if (currentHour >= 17 && currentHour <= 19) {
      timeMultiplier = 1.2; // 20% rush hour fee
    } else if (currentHour >= 22 || currentHour <= 6) {
      timeMultiplier = 1.3; // 30% late night fee
    }

    // Apply order value discounts for larger orders
    if (subtotal >= 50000) {
      orderDiscount = 0.8; // 20% discount for orders over 50K
    } else if (subtotal >= 25000) {
      orderDiscount = 0.9; // 10% discount for orders over 25K
    }

    // Calculate final fee
    const methodFee = baseFee * methodMultiplier;
    const timeFee = methodFee * timeMultiplier;
    const distanceFeeApplied = timeFee + distanceFee;
    const finalFee = Math.round(distanceFeeApplied * orderDiscount);

    return {
      baseFee,
      methodMultiplier,
      distanceFee,
      timeMultiplier,
      orderDiscount,
      finalFee,
      isFreeDelivery: false,
      breakdown: {
        base: baseFee,
        method: methodFee - baseFee,
        distance: distanceFee,
        time: timeFee - methodFee,
        discount: distanceFeeApplied - finalFee
      }
    };
  }, [deliverySettings, deliveryMethod, deliveryDistance]);

  const updateDeliveryMethod = useCallback((method: string) => {
    setDeliveryMethod(method);
  }, []);

  const updateDeliveryDistance = useCallback((distance: number) => {
    setDeliveryDistance(distance);
  }, []);

  const getDeliveryMethodInfo = useCallback((method: string) => {
    switch (method) {
      case 'express':
        return { name: 'Express Delivery', time: '1-2 business days', multiplier: 1.5 };
      case 'same-day':
        return { name: 'Same Day Delivery', time: 'Same day', multiplier: 2.0 };
      case 'standard':
      default:
        return { name: 'Standard Delivery', time: '2-3 business days', multiplier: 1.0 };
    }
  }, []);

  const getTimeBasedInfo = useCallback(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 17 && currentHour <= 19) {
      return { type: 'rush_hour', name: 'Rush Hour', multiplier: 1.2, description: '5 PM - 7 PM' };
    } else if (currentHour >= 22 || currentHour <= 6) {
      return { type: 'late_night', name: 'Late Night', multiplier: 1.3, description: '10 PM - 6 AM' };
    }
    return { type: 'normal', name: 'Normal Hours', multiplier: 1.0, description: 'Regular pricing' };
  }, []);

  const getOrderDiscountInfo = useCallback((subtotal: number) => {
    if (subtotal >= 50000) {
      return { type: 'large_order', name: 'Large Order Discount', multiplier: 0.8, description: 'Orders over 50K TZS' };
    } else if (subtotal >= 25000) {
      return { type: 'medium_order', name: 'Medium Order Discount', multiplier: 0.9, description: 'Orders over 25K TZS' };
    }
    return { type: 'no_discount', name: 'No Discount', multiplier: 1.0, description: 'Standard pricing' };
  }, []);

  return {
    deliveryMethod,
    deliveryDistance,
    currentFee,
    calculateDeliveryFee,
    updateDeliveryMethod,
    updateDeliveryDistance,
    getDeliveryMethodInfo,
    getTimeBasedInfo,
    getOrderDiscountInfo
  };
};
