// Shipping default configuration
// This file centralizes all shipping-related defaults

export interface ShippingDefaults {
  defaultCity: string;
  defaultCountry: string;
  defaultAddress: string;
  defaultCurrency: string;
  defaultTimezone: string;
  defaultPhoneCode: string;
  defaultShippingMethod: 'air' | 'sea' | 'standard';
  defaultDeliveryDays: number;
  defaultMaxDeliveryDays: number;
}

// Default shipping configuration
export const SHIPPING_DEFAULTS: ShippingDefaults = {
  // Change these values to customize your default shipping destination
  defaultCity: 'Dar es Salaam',
  defaultCountry: 'Tanzania',
  defaultAddress: 'Dar es Salaam, Tanzania',
  defaultCurrency: 'TZS',
  defaultTimezone: 'Africa/Dar_es_Salaam',
  defaultPhoneCode: '+255',
  defaultShippingMethod: 'standard',
  defaultDeliveryDays: 7,
  defaultMaxDeliveryDays: 30
};

// Alternative configurations for different regions
export const SHIPPING_CONFIGS = {
  TANZANIA: {
    defaultCity: 'Dar es Salaam',
    defaultCountry: 'Tanzania',
    defaultAddress: 'Dar es Salaam, Tanzania',
    defaultCurrency: 'TZS',
    defaultTimezone: 'Africa/Dar_es_Salaam',
    defaultPhoneCode: '+255'
  },
  KENYA: {
    defaultCity: 'Nairobi',
    defaultCountry: 'Kenya',
    defaultAddress: 'Nairobi, Kenya',
    defaultCurrency: 'KES',
    defaultTimezone: 'Africa/Nairobi',
    defaultPhoneCode: '+254'
  },
  UGANDA: {
    defaultCity: 'Kampala',
    defaultCountry: 'Uganda',
    defaultAddress: 'Kampala, Uganda',
    defaultCurrency: 'UGX',
    defaultTimezone: 'Africa/Kampala',
    defaultPhoneCode: '+256'
  },
  RWANDA: {
    defaultCity: 'Kigali',
    defaultCountry: 'Rwanda',
    defaultAddress: 'Kigali, Rwanda',
    defaultCurrency: 'RWF',
    defaultTimezone: 'Africa/Kigali',
    defaultPhoneCode: '+250'
  }
};

// Function to get shipping defaults (can be extended to read from user settings)
export const getShippingDefaults = (region?: keyof typeof SHIPPING_CONFIGS): ShippingDefaults => {
  if (region && SHIPPING_CONFIGS[region]) {
    return {
      ...SHIPPING_DEFAULTS,
      ...SHIPPING_CONFIGS[region]
    };
  }
  return SHIPPING_DEFAULTS;
};

// Function to update shipping defaults (for future user settings integration)
export const updateShippingDefaults = (newDefaults: Partial<ShippingDefaults>): ShippingDefaults => {
  return {
    ...SHIPPING_DEFAULTS,
    ...newDefaults
  };
};
