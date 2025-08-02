// Points configuration for loyalty system
export interface PointsConfig {
  basePoints: number;
  brandBonuses: Record<string, number>;
  modelBonuses: Record<string, number>;
  deviceTypeBonuses: Record<string, number>;
  // Additional configuration options
  enablePointsForNewDevices: boolean;
  maxPointsPerDay: number;
  customerLoyaltyMultipliers: Record<string, number>;
}

export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  basePoints: 100,
  brandBonuses: {
    'apple': 5,
    'samsung': 3,
    'google': 2,
    'xiaomi': 1,
    'huawei': 1,
  },
  modelBonuses: {
    'iphone 15': 3,
    'iphone 14': 2,
    'galaxy s24': 3,
    'galaxy s23': 2,
    'pixel 8': 2,
    'pixel 7': 1,
  },
  deviceTypeBonuses: {
    'smartphone': 0,
    'tablet': 2,
    'laptop': 5,
    'desktop': 3,
    'smartwatch': 1,
  },
  enablePointsForNewDevices: true,
  maxPointsPerDay: 50,
  customerLoyaltyMultipliers: {
    'bronze': 1.0,
    'silver': 1.1,
    'gold': 1.2,
    'platinum': 1.5,
  },
};

export function calculatePointsForDevice(
  deviceData: { brand?: string; model?: string; deviceType?: string },
  customerLoyaltyLevel?: string,
  config: PointsConfig = DEFAULT_POINTS_CONFIG
): number {
  if (!config.enablePointsForNewDevices) {
    return 0;
  }
  
  let points = config.basePoints;
  
  // Add brand bonus
  if (deviceData.brand) {
    const brandBonus = config.brandBonuses[deviceData.brand.toLowerCase()];
    if (brandBonus) {
      points += brandBonus;
    }
  }
  
  // Add model bonus
  if (deviceData.model) {
    const model = deviceData.model.toLowerCase();
    for (const [modelPattern, bonus] of Object.entries(config.modelBonuses)) {
      if (model.includes(modelPattern.toLowerCase())) {
        points += bonus;
        break; // Only apply the first matching model bonus
      }
    }
  }
  
  // Add device type bonus
  if (deviceData.deviceType) {
    const deviceTypeBonus = config.deviceTypeBonuses[deviceData.deviceType.toLowerCase()];
    if (deviceTypeBonus) {
      points += deviceTypeBonus;
    }
  }
  
  // Apply loyalty level multiplier
  if (customerLoyaltyLevel) {
    const multiplier = config.customerLoyaltyMultipliers[customerLoyaltyLevel.toLowerCase()] || 1.0;
    points = Math.round(points * multiplier);
  }
  
  return points;
}

export function shouldAwardPoints(
  customerId: string,
  customerLoyaltyLevel?: string,
  config: PointsConfig = DEFAULT_POINTS_CONFIG
): boolean {
  // Add any business logic here for when points should/shouldn't be awarded
  // For example: VIP customers always get points, new customers get bonus points, etc.
  return config.enablePointsForNewDevices;
} 