import { 
  Cpu, 
  HardDrive, 
  Monitor, 
  Battery, 
  Camera, 
  Palette, 
  Ruler, 
  MemoryStick,
  Smartphone,
  Tablet,
  Laptop,
  Headphones,
  Speaker,
  Wifi,
  Bluetooth,
  Usb,
  Cable,
  Power,
  Volume2,
  Mic,
  Keyboard,
  Mouse,
  Gamepad2,
  Watch,
  Globe,
  Shield,
  Zap,
  Thermometer,
  Gauge,
  Settings,
  Package,
  MapPin,
  Hand,
  Unplug,
  FlipHorizontal,
  Fingerprint,
  ScanFace,
  Droplets,
  Wind,
  BatteryCharging,
  FastForward,
  Expand,
  PhoneCall,
  PenTool
} from 'lucide-react';

// Specification utilities for consistent handling across the application
export interface ProductSpecification {
  [key: string]: string | number;
}

// Common specification keys for consistency
export const SPECIFICATION_KEYS = {
  // Storage & Memory
  STORAGE: 'storage',
  RAM: 'ram',
  MEMORY: 'memory',
  
  // Performance
  PROCESSOR: 'processor',
  CPU: 'cpu',
  GPU: 'gpu',
  
  // Display
  SCREEN_SIZE: 'screen_size',
  DISPLAY: 'display',
  RESOLUTION: 'resolution',
  
  // Battery
  BATTERY: 'battery',
  BATTERY_CAPACITY: 'battery_capacity',
  
  // Camera
  CAMERA: 'camera',
  FRONT_CAMERA: 'front_camera',
  REAR_CAMERA: 'rear_camera',
  
  // Physical
  COLOR: 'color',
  WEIGHT: 'weight',
  DIMENSIONS: 'dimensions',
  SIZE: 'size',
  
  // Connectivity
  WIFI: 'wifi',
  BLUETOOTH: 'bluetooth',
  NETWORK: 'network',
  
  // Software
  OS: 'os',
  OPERATING_SYSTEM: 'operating_system',
  
  // Warranty
  WARRANTY: 'warranty',
  WARRANTY_PERIOD: 'warranty_period',
  
  // Features (Boolean/Yes-No)
  TOUCH: 'touch',
  TOUCHSCREEN: 'touchscreen',
  OLED_DISPLAY: 'oled_display',
  HDR_SUPPORT: 'hdr_support',
  HIGH_REFRESH_RATE: 'high_refresh_rate',
  DETACHABLE: 'detachable',
  CONVERTIBLE: 'convertible',
  BACKLIT_KEYBOARD: 'backlit_keyboard',
  FINGERPRINT_SCANNER: 'fingerprint_scanner',
  FACE_ID: 'face_id',
  SECURITY_CHIP: 'security_chip',
  ENCRYPTION: 'encryption',
  WATERPROOF: 'waterproof',
  DUST_RESISTANT: 'dust_resistant',
  DROP_RESISTANT: 'drop_resistant',
  SCRATCH_RESISTANT: 'scratch_resistant',
  WIRELESS_CHARGING: 'wireless_charging',
  FAST_CHARGING: 'fast_charging',
  REVERSE_CHARGING: 'reverse_charging',
  REMOVABLE_BATTERY: 'removable_battery',
  EXPANDABLE_STORAGE: 'expandable_storage',
  CLOUD_STORAGE: 'cloud_storage',
  DUAL_SIM: 'dual_sim',
  ESIM_SUPPORT: 'esim_support',
  NFC: 'nfc',
  GPS: 'gps',
  FIVE_G_SUPPORT: '5g_support',
  WIFI_6: 'wifi_6',
  HEADPHONE_JACK: 'headphone_jack',
  STEREO_SPEAKERS: 'stereo_speakers',
  NOISE_CANCELLATION: 'noise_cancellation',
  STYLUS_SUPPORT: 'stylus_support',
  HAPTIC_FEEDBACK: 'haptic_feedback',
  USB_C_PORT: 'usb_c_port',
  THUNDERBOLT: 'thunderbolt',
  HDMI_PORT: 'hdmi_port',
  SD_CARD_SLOT: 'sd_card_slot'
} as const;

// Specification categories for UI organization
export const SPECIFICATION_CATEGORIES = {
  PERFORMANCE: {
    label: 'Performance',
    keys: [SPECIFICATION_KEYS.PROCESSOR, SPECIFICATION_KEYS.CPU, SPECIFICATION_KEYS.GPU, SPECIFICATION_KEYS.RAM, SPECIFICATION_KEYS.MEMORY]
  },

  DISPLAY: {
    label: 'Display',
    keys: [SPECIFICATION_KEYS.SCREEN_SIZE, SPECIFICATION_KEYS.DISPLAY, SPECIFICATION_KEYS.RESOLUTION, SPECIFICATION_KEYS.TOUCH, SPECIFICATION_KEYS.TOUCHSCREEN]
  },
  CAMERA: {
    label: 'Camera',
    keys: [SPECIFICATION_KEYS.CAMERA, SPECIFICATION_KEYS.FRONT_CAMERA, SPECIFICATION_KEYS.REAR_CAMERA]
  },
  BATTERY: {
    label: 'Battery & Charging',
    keys: [SPECIFICATION_KEYS.BATTERY, SPECIFICATION_KEYS.BATTERY_CAPACITY, SPECIFICATION_KEYS.WIRELESS_CHARGING, SPECIFICATION_KEYS.FAST_CHARGING, SPECIFICATION_KEYS.REVERSE_CHARGING, SPECIFICATION_KEYS.REMOVABLE_BATTERY]
  },
  PHYSICAL: {
    label: 'Physical',
    keys: [SPECIFICATION_KEYS.COLOR, SPECIFICATION_KEYS.WEIGHT, SPECIFICATION_KEYS.DIMENSIONS, SPECIFICATION_KEYS.SIZE]
  },
  CONNECTIVITY: {
    label: 'Connectivity',
    keys: [SPECIFICATION_KEYS.WIFI, SPECIFICATION_KEYS.BLUETOOTH, SPECIFICATION_KEYS.NETWORK, SPECIFICATION_KEYS.NFC, SPECIFICATION_KEYS.GPS, SPECIFICATION_KEYS.DUAL_SIM, SPECIFICATION_KEYS.ESIM_SUPPORT, SPECIFICATION_KEYS.FIVE_G_SUPPORT, SPECIFICATION_KEYS.WIFI_6]
  },
  AUDIO: {
    label: 'Audio',
    keys: [SPECIFICATION_KEYS.STEREO_SPEAKERS, SPECIFICATION_KEYS.NOISE_CANCELLATION]
  },
  STORAGE: {
    label: 'Storage & Expansion',
    keys: [SPECIFICATION_KEYS.STORAGE, SPECIFICATION_KEYS.EXPANDABLE_STORAGE, SPECIFICATION_KEYS.CLOUD_STORAGE]
  },
  SOFTWARE: {
    label: 'Software',
    keys: [SPECIFICATION_KEYS.OS, SPECIFICATION_KEYS.OPERATING_SYSTEM]
  },
  FEATURES: {
    label: 'Features',
    keys: [
      SPECIFICATION_KEYS.TOUCH,
      SPECIFICATION_KEYS.OLED_DISPLAY,
      SPECIFICATION_KEYS.HDR_SUPPORT,
      SPECIFICATION_KEYS.HIGH_REFRESH_RATE,
      SPECIFICATION_KEYS.DETACHABLE, 
      SPECIFICATION_KEYS.CONVERTIBLE,
      SPECIFICATION_KEYS.BACKLIT_KEYBOARD,
      SPECIFICATION_KEYS.STYLUS_SUPPORT,
      SPECIFICATION_KEYS.HAPTIC_FEEDBACK
    ]
  },
  SECURITY: {
    label: 'Security',
    keys: [
      SPECIFICATION_KEYS.FINGERPRINT_SCANNER,
      SPECIFICATION_KEYS.FACE_ID,
      SPECIFICATION_KEYS.SECURITY_CHIP,
      SPECIFICATION_KEYS.ENCRYPTION
    ]
  },
  DURABILITY: {
    label: 'Durability',
    keys: [
      SPECIFICATION_KEYS.WATERPROOF,
      SPECIFICATION_KEYS.DUST_RESISTANT,
      SPECIFICATION_KEYS.DROP_RESISTANT,
      SPECIFICATION_KEYS.SCRATCH_RESISTANT
    ]
  },
  PORTS: {
    label: 'Ports & Connectors',
    keys: [
      SPECIFICATION_KEYS.USB_C_PORT,
      SPECIFICATION_KEYS.THUNDERBOLT,
      SPECIFICATION_KEYS.HDMI_PORT,
      SPECIFICATION_KEYS.SD_CARD_SLOT,
      SPECIFICATION_KEYS.HEADPHONE_JACK
    ]
  },
  WARRANTY: {
    label: 'Warranty',
    keys: [SPECIFICATION_KEYS.WARRANTY, SPECIFICATION_KEYS.WARRANTY_PERIOD]
  }
} as const;

// Color coding for different specification types
export const getSpecificationColor = (key: string): string => {
  const lowerKey = key.toLowerCase();
  
  // Performance specs
  if (lowerKey.includes('ram') || lowerKey.includes('memory')) {
    return 'bg-green-100 text-green-700 border-green-200';
  }
  if (lowerKey.includes('processor') || lowerKey.includes('cpu') || lowerKey.includes('gpu')) {
    return 'bg-purple-100 text-purple-700 border-purple-200';
  }
  
  // Storage specs
  if (lowerKey.includes('storage') || lowerKey.includes('capacity') || lowerKey.includes('disk')) {
    return 'bg-blue-100 text-blue-700 border-blue-200';
  }
  
  // Display specs
  if (lowerKey.includes('screen') || lowerKey.includes('display') || lowerKey.includes('resolution')) {
    return 'bg-orange-100 text-orange-700 border-orange-200';
  }
  
  // Camera specs
  if (lowerKey.includes('camera')) {
    return 'bg-pink-100 text-pink-700 border-pink-200';
  }
  
  // Battery specs
  if (lowerKey.includes('battery')) {
    return 'bg-teal-100 text-teal-700 border-teal-200';
  }
  
  // Physical specs
  if (lowerKey.includes('color')) {
    return 'bg-red-100 text-red-700 border-red-200';
  }
  if (lowerKey.includes('weight') || lowerKey.includes('dimension') || lowerKey.includes('size')) {
    return 'bg-gray-100 text-gray-700 border-gray-200';
  }
  
  // Connectivity specs
  if (lowerKey.includes('wifi') || lowerKey.includes('bluetooth') || lowerKey.includes('network')) {
    return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  }
  
  // Software specs
  if (lowerKey.includes('os') || lowerKey.includes('operating')) {
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  }
  
  // Feature specs (boolean)
  if (lowerKey.includes('touch') || lowerKey.includes('oled') || lowerKey.includes('hdr') || lowerKey.includes('refresh') ||
      lowerKey.includes('detachable') || lowerKey.includes('convertible') || lowerKey.includes('backlit') || 
      lowerKey.includes('fingerprint') || lowerKey.includes('face_id') || lowerKey.includes('security_chip') || lowerKey.includes('encryption') ||
      lowerKey.includes('waterproof') || lowerKey.includes('dust_resistant') || lowerKey.includes('drop_resistant') || lowerKey.includes('scratch_resistant') ||
      lowerKey.includes('wireless_charging') || lowerKey.includes('fast_charging') || lowerKey.includes('reverse_charging') ||
      lowerKey.includes('removable_battery') || lowerKey.includes('expandable') || lowerKey.includes('cloud_storage') ||
      lowerKey.includes('dual_sim') || lowerKey.includes('esim') || lowerKey.includes('nfc') || lowerKey.includes('gps') ||
      lowerKey.includes('5g_support') || lowerKey.includes('wifi_6') || lowerKey.includes('headphone_jack') ||
      lowerKey.includes('stereo_speakers') || lowerKey.includes('noise_cancellation') || lowerKey.includes('stylus') ||
      lowerKey.includes('haptic') || lowerKey.includes('usb_c') || lowerKey.includes('thunderbolt') || 
      lowerKey.includes('hdmi') || lowerKey.includes('sd_card')) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
  
  // Default
  return 'bg-indigo-100 text-indigo-700 border-indigo-200';
};

// Format specification values with proper units
export const formatSpecificationValue = (key: string, value: string | number): string => {
  const lowerKey = key.toLowerCase();
  const stringValue = String(value).toLowerCase();
  
  // Storage related
  if (lowerKey.includes('storage') || lowerKey.includes('capacity') || lowerKey.includes('disk')) {
    if (stringValue.includes('gb') || stringValue.includes('gigabyte')) {
      return String(value);
    }
    if (stringValue.includes('tb') || stringValue.includes('terabyte')) {
      return String(value);
    }
    if (stringValue.includes('mb') || stringValue.includes('megabyte')) {
      return String(value);
    }
    // If it's just a number, assume GB
    if (/^\d+$/.test(String(value))) {
      return `${value} GB`;
    }
  }
  
  // RAM/Memory related
  if (lowerKey.includes('ram') || lowerKey.includes('memory') || lowerKey.includes('ddr')) {
    if (stringValue.includes('gb') || stringValue.includes('gigabyte')) {
      return String(value);
    }
    if (stringValue.includes('mb') || stringValue.includes('megabyte')) {
      return String(value);
    }
    // If it's just a number, assume GB
    if (/^\d+$/.test(String(value))) {
      return `${value} GB`;
    }
  }
  
  // Screen/Display related
  if (lowerKey.includes('screen') || lowerKey.includes('display') || lowerKey.includes('monitor') || lowerKey.includes('size')) {
    if (stringValue.includes('inch') || stringValue.includes('"') || stringValue.includes('in')) {
      return String(value);
    }
    // If it's just a number, assume inches
    if (/^\d+(\.\d+)?$/.test(String(value))) {
      return `${value}"`;
    }
  }
  
  // Weight related
  if (lowerKey.includes('weight') || lowerKey.includes('mass')) {
    if (stringValue.includes('kg') || stringValue.includes('kilogram')) {
      return String(value);
    }
    if (stringValue.includes('g') || stringValue.includes('gram')) {
      return String(value);
    }
    if (stringValue.includes('lb') || stringValue.includes('pound')) {
      return String(value);
    }
    // If it's just a number, assume kg
    if (/^\d+(\.\d+)?$/.test(String(value))) {
      return `${value} kg`;
    }
  }
  
  // Battery related
  if (lowerKey.includes('battery') || lowerKey.includes('mah')) {
    if (stringValue.includes('mah') || stringValue.includes('milliampere')) {
      return String(value);
    }
    if (stringValue.includes('wh') || stringValue.includes('watt')) {
      return String(value);
    }
    // If it's just a number, assume mAh
    if (/^\d+$/.test(String(value))) {
      return `${value} mAh`;
    }
  }
  
  // Processor/CPU related
  if (lowerKey.includes('processor') || lowerKey.includes('cpu') || lowerKey.includes('ghz')) {
    if (stringValue.includes('ghz') || stringValue.includes('gigahertz')) {
      return String(value);
    }
    if (stringValue.includes('mhz') || stringValue.includes('megahertz')) {
      return String(value);
    }
    // If it's just a number, assume GHz
    if (/^\d+(\.\d+)?$/.test(String(value))) {
      return `${value} GHz`;
    }
  }
  
  // Resolution related
  if (lowerKey.includes('resolution') || lowerKey.includes('pixel') || lowerKey.includes('hd')) {
    if (stringValue.includes('p') || stringValue.includes('pixel')) {
      return String(value);
    }
    if (stringValue.includes('x') && /^\d+x\d+$/.test(String(value))) {
      return String(value);
    }
  }
  
  // Dimensions related
  if (lowerKey.includes('dimension') || lowerKey.includes('length') || lowerKey.includes('width') || lowerKey.includes('height')) {
    if (stringValue.includes('cm') || stringValue.includes('centimeter')) {
      return String(value);
    }
    if (stringValue.includes('mm') || stringValue.includes('millimeter')) {
      return String(value);
    }
    if (stringValue.includes('inch') || stringValue.includes('"') || stringValue.includes('in')) {
      return String(value);
    }
    // If it's just a number, assume cm
    if (/^\d+(\.\d+)?$/.test(String(value))) {
      return `${value} cm`;
    }
  }
  
  // Boolean/Feature related (Yes/No values)
  if (lowerKey.includes('touch') || lowerKey.includes('oled') || lowerKey.includes('hdr') || lowerKey.includes('refresh') ||
      lowerKey.includes('detachable') || lowerKey.includes('convertible') || lowerKey.includes('backlit') || 
      lowerKey.includes('fingerprint') || lowerKey.includes('face_id') || lowerKey.includes('security_chip') || lowerKey.includes('encryption') ||
      lowerKey.includes('waterproof') || lowerKey.includes('dust_resistant') || lowerKey.includes('drop_resistant') || lowerKey.includes('scratch_resistant') ||
      lowerKey.includes('wireless_charging') || lowerKey.includes('fast_charging') || lowerKey.includes('reverse_charging') ||
      lowerKey.includes('removable_battery') || lowerKey.includes('expandable') || lowerKey.includes('cloud_storage') ||
      lowerKey.includes('dual_sim') || lowerKey.includes('esim') || lowerKey.includes('nfc') || lowerKey.includes('gps') ||
      lowerKey.includes('5g_support') || lowerKey.includes('wifi_6') || lowerKey.includes('headphone_jack') ||
      lowerKey.includes('stereo_speakers') || lowerKey.includes('noise_cancellation') || lowerKey.includes('stylus') ||
      lowerKey.includes('haptic') || lowerKey.includes('usb_c') || lowerKey.includes('thunderbolt') || 
      lowerKey.includes('hdmi') || lowerKey.includes('sd_card')) {
    
    const boolValue = String(value).toLowerCase();
    if (boolValue === 'true' || boolValue === 'yes' || boolValue === '1' || boolValue === 'enabled') {
      return 'Yes';
    }
    if (boolValue === 'false' || boolValue === 'no' || boolValue === '0' || boolValue === 'disabled') {
      return 'No';
    }
    // If already formatted as Yes/No, clean it up
    if (boolValue.includes('yes') || boolValue.includes('✓')) {
      return 'Yes';
    }
    if (boolValue.includes('no') || boolValue.includes('✗')) {
      return 'No';
    }
  }
  
  // Return original value if no formatting applies
  return String(value);
};

// Parse specification string to object
export const parseSpecification = (specification: string | null): ProductSpecification => {
  if (!specification) return {};
  
  try {
    return JSON.parse(specification);
  } catch {
    // If it's not valid JSON, return empty object
    return {};
  }
};

// Stringify specification object to JSON string
export const stringifySpecification = (specification: ProductSpecification): string => {
  return JSON.stringify(specification);
};

// Validate specification object
export const validateSpecification = (specification: ProductSpecification): boolean => {
  try {
    // Check if all values are strings or numbers
    return Object.values(specification).every(value => 
      typeof value === 'string' || typeof value === 'number'
    );
  } catch {
    return false;
  }
};

// Get specification count
export const getSpecificationCount = (specification: ProductSpecification | string | null): number => {
  if (!specification) return 0;
  
  const spec = typeof specification === 'string' ? parseSpecification(specification) : specification;
  return Object.keys(spec).length;
};

// Get specifications by category
export const getSpecificationsByCategory = (specification: ProductSpecification | string | null) => {
  if (!specification) return {};
  
  const spec = typeof specification === 'string' ? parseSpecification(specification) : specification;
  const categorized: Record<string, ProductSpecification> = {};
  
  Object.entries(spec).forEach(([key, value]) => {
    let category = 'Other';
    
    // Find which category this key belongs to
    for (const [catKey, cat] of Object.entries(SPECIFICATION_CATEGORIES)) {
      if (cat.keys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        category = cat.label;
        break;
      }
    }
    
    if (!categorized[category]) {
      categorized[category] = {};
    }
    
    categorized[category][key] = value;
  });
  
  return categorized;
};

/**
 * Get icon component for specification key
 * @param specKey - The specification key
 * @returns Icon component or null if no match
 */
export const getSpecificationIcon = (specKey: string) => {
  const spec = specKey.toLowerCase();
  
  // Hardware specifications
  if (spec.includes('ram') || spec.includes('memory')) return MemoryStick;
  if (spec.includes('storage') || spec.includes('ssd') || spec.includes('hdd')) return HardDrive;
  if (spec.includes('processor') || spec.includes('cpu')) return Cpu;
  if (spec.includes('gpu') || spec.includes('graphics')) return Cpu;
  if (spec.includes('screen') || spec.includes('display') || spec.includes('monitor')) return Monitor;
  if (spec.includes('battery')) return Battery;
  if (spec.includes('camera') || spec.includes('webcam')) return Camera;
  if (spec.includes('color') || spec.includes('colour')) return Palette;
  if (spec.includes('size') || spec.includes('dimension')) return Ruler;
  
  // Device types
  if (spec.includes('phone') || spec.includes('mobile')) return Smartphone;
  if (spec.includes('tablet')) return Tablet;
  if (spec.includes('laptop') || spec.includes('notebook')) return Laptop;
  if (spec.includes('desktop') || spec.includes('pc')) return Monitor;
  if (spec.includes('watch') || spec.includes('smartwatch')) return Watch;
  
  // Audio/Video
  if (spec.includes('speaker') || spec.includes('audio')) return Speaker;
  if (spec.includes('headphone') || spec.includes('earphone')) return Headphones;
  if (spec.includes('microphone') || spec.includes('mic')) return Mic;
  if (spec.includes('volume')) return Volume2;
  
  // Features (Boolean specifications)
  if (spec.includes('touch') || spec.includes('touchscreen')) return Hand;
  if (spec.includes('detachable')) return Unplug;
  if (spec.includes('convertible')) return FlipHorizontal;
  if (spec.includes('fingerprint')) return Fingerprint;
  if (spec.includes('face_id')) return ScanFace;
  if (spec.includes('waterproof')) return Droplets;
  if (spec.includes('dust_resistant')) return Wind;
  if (spec.includes('wireless_charging')) return BatteryCharging;
  if (spec.includes('fast_charging')) return FastForward;
  if (spec.includes('expandable')) return Expand;
  if (spec.includes('dual_sim')) return PhoneCall;
  if (spec.includes('headphone_jack')) return Headphones;
  if (spec.includes('stylus')) return PenTool;
  
  // Connectivity
  if (spec.includes('wifi') || spec.includes('wireless')) return Wifi;
  if (spec.includes('bluetooth')) return Bluetooth;
  if (spec.includes('usb')) return Usb;
  if (spec.includes('cable') || spec.includes('wire')) return Cable;
  if (spec.includes('network') || spec.includes('ethernet')) return Globe;
  
  // Power & Performance
  if (spec.includes('power') || spec.includes('watt')) return Power;
  if (spec.includes('voltage') || spec.includes('volt')) return Zap;
  if (spec.includes('temperature') || spec.includes('temp')) return Thermometer;
  if (spec.includes('speed') || spec.includes('frequency')) return Gauge;
  
  // Input/Output
  if (spec.includes('keyboard')) return Keyboard;
  if (spec.includes('mouse') || spec.includes('trackpad')) return Mouse;
  if (spec.includes('gamepad') || spec.includes('controller')) return Gamepad2;
  
  // Security & Features
  if (spec.includes('security') || spec.includes('fingerprint')) return Shield;
  if (spec.includes('setting') || spec.includes('config')) return Settings;
  
  // Return null for unmatched specifications
  return null;
};

/**
 * Get tooltip text for specification icon
 * @param specKey - The specification key
 * @returns Tooltip text
 */
export const getSpecificationTooltip = (specKey: string): string => {
  return specKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get shelf display information
 * @param shelfInfo - Shelf information object
 * @returns Formatted shelf display string
 */
export const getShelfDisplay = (shelfInfo: {
  shelfName?: string;
  shelfCode?: string;
  storeLocationName?: string;
  storeLocationCity?: string;
  storageRoomCode?: string;
  isRefrigerated?: boolean;
  requiresLadder?: boolean;
}): string => {
  const parts: string[] = [];
  
  if (shelfInfo.shelfName) {
    parts.push(shelfInfo.shelfName);
  }
  
  if (shelfInfo.storageRoomCode) {
    parts.push(shelfInfo.storageRoomCode);
  }
  
  if (shelfInfo.storeLocationName) {
    parts.push(shelfInfo.storeLocationName);
  }
  
  if (parts.length === 0) {
    return 'No shelf assigned';
  }
  
  return parts.join(' • ');
};

/**
 * Get shelf icon based on shelf properties
 * @param shelfInfo - Shelf information object
 * @returns Icon component
 */
export const getShelfIcon = (shelfInfo: {
  isRefrigerated?: boolean;
  requiresLadder?: boolean;
}): any => {
  if (shelfInfo.isRefrigerated) {
    return Battery; // Use battery icon for refrigerated shelves
  }
  if (shelfInfo.requiresLadder) {
    return Settings; // Use settings icon for ladder-required shelves
  }
  return MapPin; // Default location icon
};

/**
 * Generate specification templates for quick selection
 * @returns Object with specification templates
 */
export const getSpecificationTemplates = () => {
  return {
    LAPTOP: {
      label: 'Laptop Features',
      specifications: {
        [SPECIFICATION_KEYS.TOUCH]: { label: 'Touch Screen', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.DETACHABLE]: { label: 'Detachable Keyboard', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.CONVERTIBLE]: { label: 'Convertible (2-in-1)', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.BACKLIT_KEYBOARD]: { label: 'Backlit Keyboard', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.FINGERPRINT_SCANNER]: { label: 'Fingerprint Scanner', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.FACE_ID]: { label: 'Face Recognition', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.STYLUS_SUPPORT]: { label: 'Stylus Support', type: 'boolean', defaultValue: false }
      }
    },
    PHONE: {
      label: 'Phone Features',
      specifications: {
        [SPECIFICATION_KEYS.TOUCH]: { label: 'Touch Screen', type: 'boolean', defaultValue: true },
        [SPECIFICATION_KEYS.FINGERPRINT_SCANNER]: { label: 'Fingerprint Scanner', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.FACE_ID]: { label: 'Face Recognition', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.WATERPROOF]: { label: 'Waterproof', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.DUST_RESISTANT]: { label: 'Dust Resistant', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.WIRELESS_CHARGING]: { label: 'Wireless Charging', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.FAST_CHARGING]: { label: 'Fast Charging', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.DUAL_SIM]: { label: 'Dual SIM', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.NFC]: { label: 'NFC', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.HEADPHONE_JACK]: { label: 'Headphone Jack', type: 'boolean', defaultValue: false }
      }
    },
    TABLET: {
      label: 'Tablet Features',
      specifications: {
        [SPECIFICATION_KEYS.TOUCH]: { label: 'Touch Screen', type: 'boolean', defaultValue: true },
        [SPECIFICATION_KEYS.DETACHABLE]: { label: 'Detachable Keyboard', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.STYLUS_SUPPORT]: { label: 'Stylus Support', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.FINGERPRINT_SCANNER]: { label: 'Fingerprint Scanner', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.FACE_ID]: { label: 'Face Recognition', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.WIRELESS_CHARGING]: { label: 'Wireless Charging', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.FAST_CHARGING]: { label: 'Fast Charging', type: 'boolean', defaultValue: false }
      }
    },
    GENERAL: {
      label: 'General Features',
      specifications: {
        [SPECIFICATION_KEYS.TOUCH]: { label: 'Touch Screen', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.WATERPROOF]: { label: 'Waterproof', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.DUST_RESISTANT]: { label: 'Dust Resistant', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.EXPANDABLE_STORAGE]: { label: 'Expandable Storage', type: 'boolean', defaultValue: false },
        [SPECIFICATION_KEYS.REMOVABLE_BATTERY]: { label: 'Removable Battery', type: 'boolean', defaultValue: false }
      }
    }
  };
};

/**
 * Format boolean specification value for display
 * @param value - The boolean value
 * @returns Formatted display string
 */
export const formatBooleanSpecification = (value: boolean | string): string => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  const stringValue = String(value).toLowerCase();
  if (stringValue === 'true' || stringValue === 'yes' || stringValue === '1' || stringValue === 'enabled') {
    return 'Yes';
  }
  if (stringValue === 'false' || stringValue === 'no' || stringValue === '0' || stringValue === 'disabled') {
    return 'No';
  }
  
  return String(value);
};
