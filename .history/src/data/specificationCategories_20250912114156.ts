import { 
  Palette, HardDrive, Zap, Cpu, Monitor, Battery, Camera, Ruler, 
  Hand, Unplug, RotateCcw, Lightbulb, Fingerprint, ScanFace, 
  Droplets, Wind, Shield, Lock, Vibrate, Usb, Cable, Speaker, 
  Mic, BatteryCharging, FastForward, PhoneCall, Expand, Radio, 
  Navigation, Headphones, PenTool, Wifi, Bluetooth, Thermometer,
  Volume2, VolumeX, Eye, Sun, Moon, Settings, Power
} from 'lucide-react';

export interface SpecificationItem {
  key: string;
  name: string;
  icon: any;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  unit?: string;
  placeholder?: string;
  category?: string; // Group by type for better organization
}

export interface SpecificationCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  specifications: SpecificationItem[];
}

export const specificationCategories: SpecificationCategory[] = [
  {
    id: 'laptop',
    name: 'Laptop',
    icon: Monitor,
    color: 'blue',
    specifications: [
      // Text Inputs
      { key: 'processor', name: 'Processor', icon: Cpu, type: 'text', placeholder: 'Intel i5, AMD Ryzen 5', category: 'text' },
      { key: 'graphics', name: 'Graphics', icon: Monitor, type: 'text', placeholder: 'Intel UHD, NVIDIA GTX', category: 'text' },
      { key: 'color', name: 'Color', icon: Palette, type: 'text', placeholder: 'Silver, Black, Gold', category: 'text' },
      
      // Number Inputs
      { key: 'high_refresh_rate', name: 'High Refresh Rate', icon: RotateCcw, type: 'number', unit: 'Hz', placeholder: '60', category: 'number' },
      { key: 'usb_c_ports', name: 'USB-C Ports', icon: Usb, type: 'number', unit: 'ports', placeholder: '2', category: 'number' },
      { key: 'usb_a_ports', name: 'USB-A Ports', icon: Usb, type: 'number', unit: 'ports', placeholder: '2', category: 'number' },
      { key: 'battery_life', name: 'Battery Life', icon: Battery, type: 'number', unit: 'hours', placeholder: '8', category: 'number' },
      { key: 'weight', name: 'Weight', icon: Ruler, type: 'number', unit: 'kg', placeholder: '1.5', category: 'number' },
      { key: 'thickness', name: 'Thickness', icon: Ruler, type: 'number', unit: 'mm', placeholder: '15', category: 'number' },
      
      // Select Dropdowns
      { key: 'screen_size', name: 'Screen Size', icon: Monitor, type: 'select', options: ['11"', '12"', '13"', '14"', '15"', '16"', '17"', '18"'], unit: 'inch', category: 'select' },
      { key: 'resolution', name: 'Resolution', icon: Monitor, type: 'select', options: ['HD (1366x768)', 'FHD (1920x1080)', 'QHD (2560x1440)', '4K (3840x2160)'], category: 'select' },
      { key: 'ram', name: 'RAM', icon: Zap, type: 'select', options: ['4GB', '8GB', '16GB', '32GB', '64GB'], category: 'select' },
      { key: 'storage', name: 'Storage', icon: HardDrive, type: 'select', options: ['128GB', '256GB', '512GB', '1TB', '2TB'], category: 'select' },
      { key: 'storage_type', name: 'Storage Type', icon: HardDrive, type: 'select', options: ['HDD', 'SSD', 'NVMe SSD'], category: 'select' },
      { key: 'wifi', name: 'Wi-Fi', icon: Wifi, type: 'select', options: ['Wi-Fi 5', 'Wi-Fi 6', 'Wi-Fi 6E'], category: 'select' },
      { key: 'bluetooth', name: 'Bluetooth', icon: Bluetooth, type: 'select', options: ['4.0', '5.0', '5.1', '5.2'], category: 'select' },
      
      // Boolean Toggles
      { key: 'touch_screen', name: 'Touch Screen', icon: Hand, type: 'boolean', category: 'boolean' },
      { key: 'oled_display', name: 'OLED Display', icon: Monitor, type: 'boolean', category: 'boolean' },
      { key: 'backlit_keyboard', name: 'Backlit Keyboard', icon: Lightbulb, type: 'boolean', category: 'boolean' },
      { key: 'fingerprint_scanner', name: 'Fingerprint Scanner', icon: Fingerprint, type: 'boolean', category: 'boolean' },
      { key: 'face_id', name: 'Face Recognition', icon: ScanFace, type: 'boolean', category: 'boolean' },
      { key: 'convertible', name: 'Convertible (2-in-1)', icon: RotateCcw, type: 'boolean', category: 'boolean' },
      { key: 'stylus_support', name: 'Stylus Support', icon: PenTool, type: 'boolean', category: 'boolean' },
      { key: 'hdmi_port', name: 'HDMI Port', icon: Cable, type: 'boolean', category: 'boolean' },
      { key: 'thunderbolt', name: 'Thunderbolt', icon: Cable, type: 'boolean', category: 'boolean' },
      { key: 'headphone_jack', name: 'Headphone Jack', icon: Headphones, type: 'boolean', category: 'boolean' },
      { key: 'fast_charging', name: 'Fast Charging', icon: FastForward, type: 'boolean', category: 'boolean' },
      { key: 'wireless_charging', name: 'Wireless Charging', icon: BatteryCharging, type: 'boolean', category: 'boolean' },
      { key: 'waterproof', name: 'Waterproof', icon: Droplets, type: 'boolean', category: 'boolean' },
      { key: 'dust_resistant', name: 'Dust Resistant', icon: Wind, type: 'boolean', category: 'boolean' },
      { key: 'military_grade', name: 'Military Grade', icon: Shield, type: 'boolean', category: 'boolean' }
    ]
  },
  {
    id: 'mobile',
    name: 'Mobile',
    icon: PhoneCall,
    color: 'green',
    specifications: [
      // Text Inputs
      { key: 'processor', name: 'Processor', icon: Cpu, type: 'text', placeholder: 'Snapdragon 888, A15 Bionic', category: 'text' },
      { key: 'rear_camera', name: 'Rear Camera', icon: Camera, type: 'text', placeholder: '48MP + 12MP + 5MP', category: 'text' },
      { key: 'front_camera', name: 'Front Camera', icon: Camera, type: 'text', placeholder: '12MP', category: 'text' },
      { key: 'fast_charging', name: 'Fast Charging', icon: FastForward, type: 'text', placeholder: '25W, 45W, 65W', category: 'text' },
      { key: 'color', name: 'Color', icon: Palette, type: 'text', placeholder: 'Black, White, Blue', category: 'text' },
      
      // Number Inputs
      { key: 'screen_size', name: 'Screen Size', icon: Monitor, type: 'number', unit: 'inch', placeholder: '6.1', category: 'number' },
      { key: 'optical_zoom', name: 'Optical Zoom', icon: Camera, type: 'number', unit: 'x', placeholder: '3', category: 'number' },
      { key: 'weight', name: 'Weight', icon: Ruler, type: 'number', unit: 'g', placeholder: '180', category: 'number' },
      { key: 'thickness', name: 'Thickness', icon: Ruler, type: 'number', unit: 'mm', placeholder: '8.1', category: 'number' },
      { key: 'battery_capacity', name: 'Battery Capacity', icon: Battery, type: 'number', unit: 'mAh', placeholder: '4000', category: 'number' },
      { key: 'battery_life', name: 'Battery Life', icon: Battery, type: 'number', unit: 'hours', placeholder: '24', category: 'number' },
      
      // Select Dropdowns
      { key: 'resolution', name: 'Resolution', icon: Monitor, type: 'select', options: ['HD+', 'FHD+', 'QHD+', '4K'], category: 'select' },
      { key: 'display_type', name: 'Display Type', icon: Monitor, type: 'select', options: ['LCD', 'OLED', 'AMOLED', 'Super AMOLED'], category: 'select' },
      { key: 'refresh_rate', name: 'Refresh Rate', icon: RotateCcw, type: 'select', options: ['60Hz', '90Hz', '120Hz', '144Hz'], category: 'select' },
      { key: 'ram', name: 'RAM', icon: Zap, type: 'select', options: ['4GB', '6GB', '8GB', '12GB', '16GB'], category: 'select' },
      { key: 'storage', name: 'Storage', icon: HardDrive, type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'], category: 'select' },
      { key: 'video_recording', name: 'Video Recording', icon: Camera, type: 'select', options: ['4K@30fps', '4K@60fps', '8K@30fps'], category: 'select' },
      { key: 'waterproof', name: 'Waterproof', icon: Droplets, type: 'select', options: ['IP67', 'IP68'], category: 'select' },
      
      // Boolean Toggles
      { key: 'touch_screen', name: 'Touch Screen', icon: Hand, type: 'boolean', category: 'boolean' },
      { key: 'expandable_storage', name: 'Expandable Storage', icon: Expand, type: 'boolean', category: 'boolean' },
      { key: 'fingerprint_scanner', name: 'Fingerprint Scanner', icon: Fingerprint, type: 'boolean', category: 'boolean' },
      { key: 'face_id', name: 'Face Recognition', icon: ScanFace, type: 'boolean', category: 'boolean' },
      { key: 'wireless_charging', name: 'Wireless Charging', icon: BatteryCharging, type: 'boolean', category: 'boolean' },
      { key: 'reverse_charging', name: 'Reverse Charging', icon: BatteryCharging, type: 'boolean', category: 'boolean' },
      { key: 'nfc', name: 'NFC', icon: Radio, type: 'boolean', category: 'boolean' },
      { key: '5g_support', name: '5G Support', icon: Radio, type: 'boolean', category: 'boolean' },
      { key: 'stereo_speakers', name: 'Stereo Speakers', icon: Speaker, type: 'boolean', category: 'boolean' },
      { key: 'headphone_jack', name: 'Headphone Jack', icon: Headphones, type: 'boolean', category: 'boolean' },
      { key: 'noise_cancellation', name: 'Noise Cancellation', icon: Mic, type: 'boolean', category: 'boolean' },
      { key: 'dust_resistant', name: 'Dust Resistant', icon: Wind, type: 'boolean', category: 'boolean' },
      { key: 'drop_resistant', name: 'Drop Resistant', icon: Shield, type: 'boolean', category: 'boolean' }
    ]
  },
  {
    id: 'monitor',
    name: 'Monitor',
    icon: Monitor,
    color: 'purple',
    specifications: [
      // Text Inputs
      { key: 'color_accuracy', name: 'Color Accuracy', icon: Palette, type: 'text', placeholder: 'ΔE < 2', category: 'text' },
      { key: 'contrast_ratio', name: 'Contrast Ratio', icon: Eye, type: 'text', placeholder: '1000:1', category: 'text' },
      { key: 'color', name: 'Color', icon: Palette, type: 'text', placeholder: 'Black, White, Silver', category: 'text' },
      
      // Number Inputs
      { key: 'response_time', name: 'Response Time', icon: Zap, type: 'number', unit: 'ms', placeholder: '1', category: 'number' },
      { key: 'brightness', name: 'Brightness', icon: Sun, type: 'number', unit: 'nits', placeholder: '300', category: 'number' },
      { key: 'hdmi_ports', name: 'HDMI Ports', icon: Cable, type: 'number', unit: 'ports', placeholder: '2', category: 'number' },
      { key: 'displayport_ports', name: 'DisplayPort Ports', icon: Cable, type: 'number', unit: 'ports', placeholder: '1', category: 'number' },
      { key: 'usb_hub', name: 'USB Hub', icon: Usb, type: 'number', unit: 'ports', placeholder: '4', category: 'number' },
      { key: 'weight', name: 'Weight', icon: Ruler, type: 'number', unit: 'kg', placeholder: '5.5', category: 'number' },
      { key: 'thickness', name: 'Thickness', icon: Ruler, type: 'number', unit: 'mm', placeholder: '50', category: 'number' },
      { key: 'stand_height', name: 'Stand Height', icon: Ruler, type: 'number', unit: 'mm', placeholder: '100-150', category: 'number' },
      { key: 'power_consumption', name: 'Power Consumption', icon: Power, type: 'number', unit: 'W', placeholder: '25', category: 'number' },
      
      // Select Dropdowns
      { key: 'screen_size', name: 'Screen Size', icon: Monitor, type: 'select', options: ['21"', '24"', '27"', '32"', '34"', '43"', '49"'], unit: 'inch', category: 'select' },
      { key: 'resolution', name: 'Resolution', icon: Monitor, type: 'select', options: ['FHD (1920x1080)', 'QHD (2560x1440)', '4K (3840x2160)', '5K (5120x2880)', '8K (7680x4320)'], category: 'select' },
      { key: 'aspect_ratio', name: 'Aspect Ratio', icon: Monitor, type: 'select', options: ['16:9', '16:10', '21:9', '32:9', '4:3'], category: 'select' },
      { key: 'refresh_rate', name: 'Refresh Rate', icon: RotateCcw, type: 'select', options: ['60Hz', '75Hz', '120Hz', '144Hz', '165Hz', '240Hz'], unit: 'Hz', category: 'select' },
      { key: 'panel_type', name: 'Panel Type', icon: Monitor, type: 'select', options: ['IPS', 'VA', 'TN', 'OLED', 'Mini LED'], category: 'select' },
      { key: 'color_gamut', name: 'Color Gamut', icon: Palette, type: 'select', options: ['sRGB', 'Adobe RGB', 'DCI-P3', 'Rec. 2020'], category: 'select' },
      { key: 'hdr_support', name: 'HDR Support', icon: Monitor, type: 'select', options: ['HDR10', 'HDR10+', 'Dolby Vision', 'None'], category: 'select' },
      { key: 'energy_rating', name: 'Energy Rating', icon: Power, type: 'select', options: ['A+++', 'A++', 'A+', 'A', 'B', 'C'], category: 'select' },
      
      // Boolean Toggles
      { key: 'g_sync', name: 'G-Sync', icon: Settings, type: 'boolean', category: 'boolean' },
      { key: 'freesync', name: 'FreeSync', icon: Settings, type: 'boolean', category: 'boolean' },
      { key: 'curved', name: 'Curved Display', icon: Monitor, type: 'boolean', category: 'boolean' },
      { key: 'touch_screen', name: 'Touch Screen', icon: Hand, type: 'boolean', category: 'boolean' },
      { key: 'built_in_speakers', name: 'Built-in Speakers', icon: Speaker, type: 'boolean', category: 'boolean' },
      { key: 'webcam', name: 'Built-in Webcam', icon: Camera, type: 'boolean', category: 'boolean' },
      { key: 'microphone', name: 'Built-in Microphone', icon: Mic, type: 'boolean', category: 'boolean' },
      { key: 'usb_c_port', name: 'USB-C Port', icon: Usb, type: 'boolean', category: 'boolean' },
      { key: 'audio_out', name: 'Audio Out', icon: Headphones, type: 'boolean', category: 'boolean' },
      { key: 'ethernet', name: 'Ethernet Port', icon: Cable, type: 'boolean', category: 'boolean' },
      { key: 'tilt', name: 'Tilt Adjustment', icon: RotateCcw, type: 'boolean', category: 'boolean' },
      { key: 'swivel', name: 'Swivel Adjustment', icon: RotateCcw, type: 'boolean', category: 'boolean' },
      { key: 'height_adjustable', name: 'Height Adjustable', icon: Ruler, type: 'boolean', category: 'boolean' },
      { key: 'pivot', name: 'Pivot (Portrait)', icon: RotateCcw, type: 'boolean', category: 'boolean' },
      { key: 'wall_mountable', name: 'Wall Mountable', icon: Shield, type: 'boolean', category: 'boolean' }
    ]
  },
  {
    id: 'tablet',
    name: 'Tablet',
    icon: Monitor,
    color: 'orange',
    specifications: [
      // Text Inputs
      { key: 'processor', name: 'Processor', icon: Cpu, type: 'text', placeholder: 'Apple A14, Snapdragon 870', category: 'text' },
      { key: 'rear_camera', name: 'Rear Camera', icon: Camera, type: 'text', placeholder: '12MP', category: 'text' },
      { key: 'front_camera', name: 'Front Camera', icon: Camera, type: 'text', placeholder: '7MP', category: 'text' },
      { key: 'color', name: 'Color', icon: Palette, type: 'text', placeholder: 'Space Gray, Silver', category: 'text' },
      
      // Number Inputs
      { key: 'screen_size', name: 'Screen Size', icon: Monitor, type: 'number', unit: 'inch', placeholder: '10.9', category: 'number' },
      { key: 'weight', name: 'Weight', icon: Ruler, type: 'number', unit: 'g', placeholder: '500', category: 'number' },
      { key: 'thickness', name: 'Thickness', icon: Ruler, type: 'number', unit: 'mm', placeholder: '6.1', category: 'number' },
      { key: 'battery_life', name: 'Battery Life', icon: Battery, type: 'number', unit: 'hours', placeholder: '10', category: 'number' },
      
      // Select Dropdowns
      { key: 'resolution', name: 'Resolution', icon: Monitor, type: 'select', options: ['HD', 'FHD', 'QHD', '4K'], category: 'select' },
      { key: 'display_type', name: 'Display Type', icon: Monitor, type: 'select', options: ['LCD', 'OLED', 'AMOLED'], category: 'select' },
      { key: 'ram', name: 'RAM', icon: Zap, type: 'select', options: ['4GB', '6GB', '8GB', '12GB'], category: 'select' },
      { key: 'storage', name: 'Storage', icon: HardDrive, type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'], category: 'select' },
      { key: 'wifi', name: 'Wi-Fi', icon: Wifi, type: 'select', options: ['Wi-Fi 5', 'Wi-Fi 6', 'Wi-Fi 6E'], category: 'select' },
      { key: 'bluetooth', name: 'Bluetooth', icon: Bluetooth, type: 'select', options: ['4.0', '5.0', '5.1', '5.2'], category: 'select' },
      
      // Boolean Toggles
      { key: 'touch_screen', name: 'Touch Screen', icon: Hand, type: 'boolean', category: 'boolean' },
      { key: 'stylus_support', name: 'Stylus Support', icon: PenTool, type: 'boolean', category: 'boolean' },
      { key: 'expandable_storage', name: 'Expandable Storage', icon: Expand, type: 'boolean', category: 'boolean' },
      { key: 'fingerprint_scanner', name: 'Fingerprint Scanner', icon: Fingerprint, type: 'boolean', category: 'boolean' },
      { key: 'face_id', name: 'Face Recognition', icon: ScanFace, type: 'boolean', category: 'boolean' },
      { key: 'keyboard_support', name: 'Keyboard Support', icon: Unplug, type: 'boolean', category: 'boolean' },
      { key: 'cellular', name: 'Cellular Support', icon: PhoneCall, type: 'boolean', category: 'boolean' },
      { key: 'gps', name: 'GPS', icon: Navigation, type: 'boolean', category: 'boolean' },
      { key: 'usb_c_port', name: 'USB-C Port', icon: Usb, type: 'boolean', category: 'boolean' },
      { key: 'headphone_jack', name: 'Headphone Jack', icon: Headphones, type: 'boolean', category: 'boolean' },
      { key: 'fast_charging', name: 'Fast Charging', icon: FastForward, type: 'boolean', category: 'boolean' },
      { key: 'wireless_charging', name: 'Wireless Charging', icon: BatteryCharging, type: 'boolean', category: 'boolean' }
    ]
  },
  {
    id: 'accessories',
    name: 'Accessories',
    icon: Cable,
    color: 'gray',
    specifications: [
      // Text Inputs
      { key: 'type', name: 'Type', icon: Cable, type: 'text', placeholder: 'Charger, Cable, Case', category: 'text' },
      { key: 'compatibility', name: 'Compatibility', icon: Settings, type: 'text', placeholder: 'iPhone, Samsung, Universal', category: 'text' },
      { key: 'color', name: 'Color', icon: Palette, type: 'text', placeholder: 'Black, White, Blue', category: 'text' },
      { key: 'material', name: 'Material', icon: Shield, type: 'text', placeholder: 'Plastic, Metal, Leather', category: 'text' },
      { key: 'power_output', name: 'Power Output', icon: Power, type: 'text', placeholder: '20W, 65W', category: 'text' },
      { key: 'dimensions', name: 'Dimensions', icon: Ruler, type: 'text', placeholder: 'L x W x H', category: 'text' },
      
      // Number Inputs
      { key: 'cable_length', name: 'Cable Length', icon: Ruler, type: 'number', unit: 'm', placeholder: '1', category: 'number' },
      { key: 'battery_life', name: 'Battery Life', icon: Battery, type: 'number', unit: 'hours', placeholder: '20', category: 'number' },
      { key: 'weight', name: 'Weight', icon: Ruler, type: 'number', unit: 'g', placeholder: '50', category: 'number' },
      
      // Select Dropdowns
      { key: 'connector_type', name: 'Connector Type', icon: Usb, type: 'select', options: ['USB-A', 'USB-C', 'Lightning', 'Micro USB'], category: 'select' },
      { key: 'protection_level', name: 'Protection Level', icon: Shield, type: 'select', options: ['Basic', 'Drop Protection', 'Waterproof', 'Military Grade'], category: 'select' },
      { key: 'audio_type', name: 'Audio Type', icon: Headphones, type: 'select', options: ['Wired', 'Wireless', 'Bluetooth', 'USB-C'], category: 'select' },
      
      // Boolean Toggles
      { key: 'fast_charging', name: 'Fast Charging', icon: FastForward, type: 'boolean', category: 'boolean' },
      { key: 'wireless_charging', name: 'Wireless Charging', icon: BatteryCharging, type: 'boolean', category: 'boolean' },
      { key: 'transparency', name: 'Transparent', icon: Eye, type: 'boolean', category: 'boolean' },
      { key: 'magnetic', name: 'Magnetic', icon: Settings, type: 'boolean', category: 'boolean' },
      { key: 'kickstand', name: 'Kickstand', icon: Settings, type: 'boolean', category: 'boolean' },
      { key: 'noise_cancellation', name: 'Noise Cancellation', icon: Mic, type: 'boolean', category: 'boolean' },
      { key: 'microphone', name: 'Microphone', icon: Mic, type: 'boolean', category: 'boolean' }
    ]
  }
];

export const getSpecificationsByCategory = (categoryId: string): SpecificationItem[] => {
  const category = specificationCategories.find(cat => cat.id === categoryId);
  return category ? category.specifications : [];
};

export const getCategoryById = (categoryId: string): SpecificationCategory | undefined => {
  return specificationCategories.find(cat => cat.id === categoryId);
};

export const getSpecificationsByType = (categoryId: string): Record<string, SpecificationItem[]> => {
  const specifications = getSpecificationsByCategory(categoryId);
  const grouped: Record<string, SpecificationItem[]> = {
    text: [],
    number: [],
    select: [],
    boolean: []
  };
  
  specifications.forEach(spec => {
    if (grouped[spec.type]) {
      grouped[spec.type].push(spec);
    }
  });
  
  return grouped;
};

export const getTypeDisplayName = (type: string): string => {
  const typeNames: Record<string, string> = {
    text: 'Text Fields',
    number: 'Number Fields', 
    select: 'Dropdown Selections',
    boolean: 'Yes/No Features'
  };
  return typeNames[type] || type;
};
