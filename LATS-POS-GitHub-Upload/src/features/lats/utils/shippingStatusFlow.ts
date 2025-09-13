import { ShippingStatus } from '../types/inventory';

// Define the step-by-step status progression
export const SHIPPING_STATUS_FLOW: ShippingStatus[] = [
  'pending',
  'picked_up', 
  'in_transit',
  'out_for_delivery',
  'delivered',
  'arrived',
  'ready_for_inventory',
  'received'
];

// Special statuses that can occur at any time
export const SPECIAL_STATUSES: ShippingStatus[] = [
  'exception'
];

// All valid statuses
export const ALL_VALID_STATUSES: ShippingStatus[] = [
  ...SHIPPING_STATUS_FLOW,
  ...SPECIAL_STATUSES
];

// Status mapping for legacy or external statuses
export const STATUS_MAPPING: Record<string, ShippingStatus> = {
  'shipped': 'in_transit',  // Map legacy 'shipped' to 'in_transit'
  'delivered': 'delivered',
  'pending': 'pending',
  'picked_up': 'picked_up',
  'in_transit': 'in_transit',
  'out_for_delivery': 'out_for_delivery',
  'arrived': 'arrived',
  'ready_for_inventory': 'ready_for_inventory',
  'received': 'received',
  'exception': 'exception'
};

/**
 * Normalize status to a valid ShippingStatus
 */
export function normalizeStatus(status: string): ShippingStatus {
  const normalized = STATUS_MAPPING[status.toLowerCase()];
  if (normalized) {
    return normalized;
  }
  
  // If it's already a valid status, return it
  if (ALL_VALID_STATUSES.includes(status as ShippingStatus)) {
    return status as ShippingStatus;
  }
  
  console.warn(`⚠️ [ShippingStatusFlow] Unknown status: ${status}. Defaulting to 'pending'.`);
  return 'pending';
}

// Status descriptions
export const STATUS_DESCRIPTIONS: Record<ShippingStatus, string> = {
  'pending': 'Shipment is pending pickup',
  'picked_up': 'Package has been picked up by carrier',
  'in_transit': 'Package is in transit to destination',
  'out_for_delivery': 'Package is out for final delivery',
  'delivered': 'Package has been delivered',
  'arrived': 'Container/ship/truck has arrived at destination',
  'ready_for_inventory': 'Products validated and ready for inventory',
  'received': 'Shipment received into inventory',
  'exception': 'Delivery exception occurred'
};

// Status icons (using Lucide React icons)
export const STATUS_ICONS: Record<ShippingStatus, string> = {
  'pending': 'Clock',
  'picked_up': 'Package',
  'in_transit': 'Truck',
  'out_for_delivery': 'MapPin',
  'delivered': 'CheckCircle',
  'arrived': 'Building',
  'ready_for_inventory': 'PackageCheck',
  'received': 'CheckCircle',
  'exception': 'AlertTriangle'
};

// Status colors
export const STATUS_COLORS: Record<ShippingStatus, string> = {
  'pending': 'text-yellow-600 bg-yellow-100',
  'picked_up': 'text-blue-600 bg-blue-100',
  'in_transit': 'text-purple-600 bg-purple-100',
  'out_for_delivery': 'text-orange-600 bg-orange-100',
  'delivered': 'text-green-600 bg-green-100',
  'arrived': 'text-indigo-600 bg-indigo-100',
  'ready_for_inventory': 'text-cyan-600 bg-cyan-100',
  'received': 'text-green-600 bg-green-100',
  'exception': 'text-red-600 bg-red-100'
};

/**
 * Get the current position of a status in the flow
 */
export function getStatusPosition(status: ShippingStatus): number {
  return SHIPPING_STATUS_FLOW.indexOf(status);
}

/**
 * Get the next valid statuses from the current status
 */
export function getNextValidStatuses(currentStatus: ShippingStatus): ShippingStatus[] {
  const currentPosition = getStatusPosition(currentStatus);
  
  if (currentPosition === -1) {
    // If current status is not in the main flow (e.g., exception), 
    // allow going back to the main flow
    return SHIPPING_STATUS_FLOW;
  }
  
  // Get the next status in the flow
  const nextStatus = SHIPPING_STATUS_FLOW[currentPosition + 1];
  const validStatuses: ShippingStatus[] = [];
  
  if (nextStatus) {
    validStatuses.push(nextStatus);
  }
  
  // Always allow exception status
  validStatuses.push('exception');
  
  return validStatuses;
}

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(fromStatus: ShippingStatus, toStatus: ShippingStatus): boolean {
  // Exception can be set from any status
  if (toStatus === 'exception') {
    return true;
  }
  
  // From exception, can go to any status in the main flow
  if (fromStatus === 'exception') {
    return SHIPPING_STATUS_FLOW.includes(toStatus);
  }
  
  // Check if it's a valid next status
  const nextValidStatuses = getNextValidStatuses(fromStatus);
  return nextValidStatuses.includes(toStatus);
}

/**
 * Get all statuses that have been used (from shipping events)
 */
export function getUsedStatuses(shippingEvents: Array<{ status: string }>): ShippingStatus[] {
  const usedStatuses = new Set<ShippingStatus>();
  
  shippingEvents.forEach(event => {
    if (ALL_VALID_STATUSES.includes(event.status as ShippingStatus)) {
      usedStatuses.add(event.status as ShippingStatus);
    }
  });
  
  return Array.from(usedStatuses);
}

/**
 * Get available statuses for update (next valid statuses that haven't been used)
 */
export function getAvailableStatuses(
  currentStatus: ShippingStatus, 
  shippingEvents: Array<{ status: string }>
): ShippingStatus[] {
  const nextValidStatuses = getNextValidStatuses(currentStatus);
  const usedStatuses = getUsedStatuses(shippingEvents);
  
  // Filter out statuses that have already been used
  return nextValidStatuses.filter(status => !usedStatuses.includes(status));
}

/**
 * Check if a status has been used before
 */
export function hasStatusBeenUsed(status: ShippingStatus, shippingEvents: Array<{ status: string }>): boolean {
  return shippingEvents.some(event => event.status === status);
}

/**
 * Get status progression percentage
 */
export function getStatusProgress(currentStatus: ShippingStatus): number {
  const position = getStatusPosition(currentStatus);
  if (position === -1) return 0;
  
  return Math.round((position / (SHIPPING_STATUS_FLOW.length - 1)) * 100);
}

// Field configuration for each status
export interface StatusFieldConfig {
  required: string[];
  optional: string[];
  description: string;
  location: string;
}

export const STATUS_FIELD_CONFIGS: Record<ShippingStatus, StatusFieldConfig> = {
  'pending': {
    required: ['location'],
    optional: ['notes'],
    description: 'Shipment is pending pickup',
    location: 'Origin location'
  },
  'picked_up': {
    required: ['location'],
    optional: ['notes'],
    description: 'Package has been picked up by carrier',
    location: 'Pickup location'
  },
  'in_transit': {
    required: ['location', 'transitType'],
    optional: ['notes'],
    description: 'Package is in transit to destination',
    location: 'Current transit location'
  },
  'out_for_delivery': {
    required: ['location'],
    optional: ['estimatedArrival', 'notes'],
    description: 'Package is out for final delivery',
    location: 'Delivery area'
  },
  'arrived': {
    required: ['location'],
    optional: ['notes'],
    description: 'Container/ship/truck has arrived at destination',
    location: 'Arrival location (port/airport/warehouse)'
  },
  'ready_for_inventory': {
    required: ['location'],
    optional: ['notes'],
    description: 'Products validated and ready for inventory',
    location: 'Warehouse location'
  },
  'delivered': {
    required: ['location'],
    optional: ['notes'],
    description: 'Package has been delivered',
    location: 'Delivery location'
  },
  'received': {
    required: ['location', 'recipientName', 'recipientPhone'],
    optional: ['notes'],
    description: 'Shipment received into inventory',
    location: 'Receiving location'
  },
  'exception': {
    required: ['location', 'exceptionType', 'exceptionDescription'],
    optional: ['resolutionPlan', 'notes'],
    description: 'Delivery exception occurred',
    location: 'Exception location'
  }
};

/**
 * Get field configuration for a specific status
 */
export function getStatusFieldConfig(status: ShippingStatus): StatusFieldConfig {
  const config = STATUS_FIELD_CONFIGS[status];
  if (!config) {
    console.warn(`⚠️ [ShippingStatusFlow] Unknown status: ${status}. Using default configuration.`);
    return {
      required: ['location'],
      optional: ['notes'],
      description: 'Unknown status',
      location: 'Unknown location'
    };
  }
  return config;
}

/**
 * Get all required fields for a status
 */
export function getRequiredFields(status: ShippingStatus): string[] {
  const config = STATUS_FIELD_CONFIGS[status];
  return config ? config.required : ['location'];
}

/**
 * Get all optional fields for a status
 */
export function getOptionalFields(status: ShippingStatus): string[] {
  const config = STATUS_FIELD_CONFIGS[status];
  return config ? config.optional : ['notes'];
}

/**
 * Check if a field is required for a status
 */
export function isFieldRequired(status: ShippingStatus, field: string): boolean {
  const config = STATUS_FIELD_CONFIGS[status];
  return config ? config.required.includes(field) : false;
}

/**
 * Check if a field is optional for a status
 */
export function isFieldOptional(status: ShippingStatus, field: string): boolean {
  const config = STATUS_FIELD_CONFIGS[status];
  return config ? config.optional.includes(field) : false;
}

/**
 * Get previously filled data for fields that should be reused
 */
export function getPreviouslyFilledData(shippingInfo: any, field: string): any {
  if (!shippingInfo) return null;
  
  // Map field names to database column names
  const fieldMapping: Record<string, string> = {
    'packageCount': 'package_count',
    'totalCbm': 'total_cbm',
    'pricePerCbm': 'price_per_cbm',
    'totalCbmCost': 'total_cbm_cost',
    'requireSignature': 'require_signature',
    'enableInsurance': 'enable_insurance',
    'insuranceValue': 'insurance_value',
    'freightCost': 'freight_cost',
    'deliveryCost': 'delivery_cost',
    'insuranceCost': 'insurance_cost',
    'customsCost': 'customs_cost',
    'handlingCost': 'handling_cost',
    'totalShippingCost': 'total_shipping_cost',
    'shippingCostCurrency': 'shipping_cost_currency',
    'containerNumber': 'container_number',
    'billOfLading': 'bill_of_lading',
    'selectedAgentId': 'shipping_agent_id',
    'cargoType': 'cargo_type',
    'itemDescription': 'item_description',
    'receiptNumber': 'receipt_number',
    'extraTransportCost': 'extra_transport_cost',
    'unitPrice': 'unit_price',
    'totalCost': 'total_cost',
    'departureTerminal': 'departure_terminal',
    'arrivalTerminal': 'arrival_terminal',
    'routeNumber': 'route_number'
  };
  
  const dbField = fieldMapping[field] || field;
  return shippingInfo[dbField];
}

/**
 * Check if a field should show as read-only (already filled in previous status)
 */
export function isFieldReadOnly(shippingInfo: any, field: string, currentStatus: ShippingStatus): boolean {
  const previouslyFilledData = getPreviouslyFilledData(shippingInfo, field);
  
  // If data exists and it's not the first status where this field is introduced, make it read-only
  if (previouslyFilledData !== null && previouslyFilledData !== undefined && previouslyFilledData !== '') {
    // Define which status first introduces each field
    const fieldFirstStatus: Record<string, ShippingStatus> = {
      'packageCount': 'pending',
      'totalCbm': 'pending',
      'pricePerCbm': 'pending',
      'totalCbmCost': 'pending',
      'requireSignature': 'pending',
      'enableInsurance': 'pending',
      'insuranceValue': 'pending',
      'freightCost': 'in_transit',
      'deliveryCost': 'in_transit',
      'insuranceCost': 'in_transit',
      'customsCost': 'in_transit',
      'handlingCost': 'in_transit',
      'totalShippingCost': 'in_transit',
      'shippingCostCurrency': 'in_transit',
      'containerNumber': 'in_transit',
      'billOfLading': 'in_transit',
      'selectedAgentId': 'in_transit',
      'cargoType': 'in_transit',
      'itemDescription': 'in_transit',
      'receiptNumber': 'in_transit',
      'extraTransportCost': 'in_transit',
      'unitPrice': 'in_transit',
      'totalCost': 'in_transit',
      'departureTerminal': 'in_transit',
      'arrivalTerminal': 'in_transit',
      'routeNumber': 'in_transit',
      'flightNumber': 'in_transit',
      'vesselName': 'in_transit',
      'departureLocation': 'in_transit',
      'arrivalLocation': 'in_transit',
      'estimatedArrival': 'out_for_delivery',
      'deliveryMethod': 'out_for_delivery',
      'recipientName': 'received',
      'recipientPhone': 'received',
      'exceptionType': 'exception',
      'exceptionDescription': 'exception',
      'resolutionPlan': 'exception'
    };
    
    const firstStatus = fieldFirstStatus[field];
    if (firstStatus && currentStatus !== firstStatus) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get fields specific to transit type for in_transit status
 * Note: Fields that are typically provided by agents are removed to avoid duplication
 */
export function getTransitTypeFields(transitType: string): string[] {
  switch (transitType) {
    case 'sea':
      // Keep only essential tracking fields, remove agent-provided pricing and operational details
      return [
        'containerNumber', 'billOfLading'
      ];
    case 'air':
      // Air shipping with agent selection and cargo details
      return [
        'selectedAgentId', 'cargoType', 'itemDescription', 'receiptNumber', 'extraTransportCost', 'unitPrice', 'totalCost'
      ];
    case 'ground':
      // Ground shipping doesn't use agents, so keep all relevant fields
      return [
        'departureTerminal', 'arrivalTerminal', 'routeNumber'
      ];
    default:
      return [];
  }
}

/**
 * Get all fields for a status, including transit-type specific fields
 */
export function getStatusFieldsWithTransitType(status: ShippingStatus, transitType?: string): string[] {
  const baseConfig = STATUS_FIELD_CONFIGS[status];
  
  // Handle undefined status gracefully
  if (!baseConfig) {
    console.warn(`⚠️ [ShippingStatusFlow] Unknown status: ${status}. Using default fields.`);
    return ['location', 'notes'];
  }
  
  const allFields = [...baseConfig.required, ...baseConfig.optional];
  
  // If it's in_transit status and transit type is specified, add transit-specific fields
  if (status === 'in_transit' && transitType) {
    const transitFields = getTransitTypeFields(transitType);
    return [...allFields, ...transitFields];
  }
  
  return allFields;
}

/**
 * Get status-specific fields that should be shown for a particular status
 * This ensures only relevant fields are displayed for each status
 */
export function getStatusSpecificFields(status: ShippingStatus | string, transitType?: string): {
  required: string[];
  optional: string[];
  transitSpecific: string[];
} {
  // Normalize the status to ensure it's valid
  const normalizedStatus = typeof status === 'string' ? normalizeStatus(status) : status;
  const baseConfig = STATUS_FIELD_CONFIGS[normalizedStatus];
  
  // Handle undefined status gracefully
  if (!baseConfig) {
    console.warn(`⚠️ [ShippingStatusFlow] Unknown status: ${status} (normalized: ${normalizedStatus}). Using default configuration.`);
    return {
      required: ['location'],
      optional: ['notes'],
      transitSpecific: []
    };
  }
  
  const required = [...baseConfig.required];
  const optional = [...baseConfig.optional];
  let transitSpecific: string[] = [];
  
  // Add transit-specific fields only for in_transit status
  if (normalizedStatus === 'in_transit' && transitType) {
    transitSpecific = getTransitTypeFields(transitType);
  }
  
  return {
    required,
    optional,
    transitSpecific
  };
}
