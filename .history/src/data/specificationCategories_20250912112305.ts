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
      // Display
      { key: 'screen_size', name: 'Screen Size', icon: Monitor, type: 'select', options: ['11"', '12"', '13"', '14"', '15"', '16"', '17"', '18"'], unit: 'inch' },
      { key: 'resolution', name: 'Resolution', icon: Monitor, type: 'select', options: ['HD (1366x768)', 'FHD (1920x1080)', 'QHD (2560x1440)', '4K (3840x2160)'] },
      { key: 'touch_screen', name: 'Touch Screen', icon: Hand, type: 'boolean' },
      { key: 'oled_display', name: 'OLED Display', icon: Monitor, type: 'boolean' },
      { key: 'high_refresh_rate', name: 'High Refresh Rate', icon: RotateCcw, type: 'number', unit: 'Hz', placeholder: '60' },
      
      // Performance
      { key: 'processor', name: 'Processor', icon: Cpu, type: 'text', placeholder: 'Intel i5, AMD Ryzen 5' },
      { key: 'ram', name: 'RAM', icon: Zap, type: 'select', options: ['4GB', '8GB', '16GB', '32GB', '64GB'] },
      { key: 'storage', name: 'Storage', icon: HardDrive, type: 'select', options: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
      { key: 'storage_type', name: 'Storage Type', icon: HardDrive, type: 'select', options: ['HDD', 'SSD', 'NVMe SSD'] },
      { key: 'graphics', name: 'Graphics', icon: Monitor, type: 'text', placeholder: 'Intel UHD, NVIDIA GTX' },
      
      // Features
      { key: 'backlit_keyboard', name: 'Backlit Keyboard', icon: Lightbulb, type: 'boolean' },
      { key: 'fingerprint_scanner', name: 'Fingerprint Scanner', icon: Fingerprint, type: 'boolean' },
      { key: 'face_id', name: 'Face Recognition', icon: ScanFace, type: 'boolean' },
      { key: 'convertible', name: 'Convertible (2-in-1)', icon: RotateCcw, type: 'boolean' },
      { key: 'stylus_support', name: 'Stylus Support', icon: PenTool, type: 'boolean' },
      
      // Connectivity
      { key: 'wifi', name: 'Wi-Fi', icon: Wifi, type: 'select', options: ['Wi-Fi 5', 'Wi-Fi 6', 'Wi-Fi 6E'] },
      { key: 'bluetooth', name: 'Bluetooth', icon: Bluetooth, type: 'select', options: ['4.0', '5.0', '5.1', '5.2'] },
      { key: 'usb_c_ports', name: 'USB-C Ports', icon: Usb, type: 'number', unit: 'ports', placeholder: '2' },
      { key: 'usb_a_ports', name: 'USB-A Ports', icon: Usb, type: 'number', unit: 'ports', placeholder: '2' },
      { key: 'hdmi_port', name: 'HDMI Port', icon: Cable, type: 'boolean' },
      { key: 'thunderbolt', name: 'Thunderbolt', icon: Cable, type: 'boolean' },
      { key: 'headphone_jack', name: 'Headphone Jack', icon: Headphones, type: 'boolean' },
      
      // Battery & Power
      { key: 'battery_life', name: 'Battery Life', icon: Battery, type: 'number', unit: 'hours', placeholder: '8' },
      { key: 'fast_charging', name: 'Fast Charging', icon: FastForward, type: 'boolean' },
      { key: 'wireless_charging', name: 'Wireless Charging', icon: BatteryCharging, type: 'boolean' },
      
      // Physical
      { key: 'weight', name: 'Weight', icon: Ruler, type: 'number', unit: 'kg', placeholder: '1.5' },
      { key: 'thickness', name: 'Thickness', icon: Ruler, type: 'number', unit: 'mm', placeholder: '15' },
      { key: 'color', name: 'Color', icon: Palette, type: 'text', placeholder: 'Silver, Black, Gold' },
      
      // Durability
      { key: 'waterproof', name: 'Waterproof', icon: Droplets, type: 'boolean' },
      { key: 'dust_resistant', name: 'Dust Resistant', icon: Wind, type: 'boolean' },
      { key: 'military_grade', name: 'Military Grade', icon: Shield, type: 'boolean' }
    ]
  },
  {
    id: 'mobile',
    name: 'Mobile',
    icon: PhoneCall,
    color: 'green',
    specifications: [
      // Display
      { key: 'screen_size', name: 'Screen Size', icon: Monitor, type: 'number', unit: 'inch', placeholder: '6.1' },
      { key: 'resolution', name: 'Resolution', icon: Monitor, type: 'select', options: ['HD+', 'FHD+', 'QHD+', '4K'] },
      { key: 'display_type', name: 'Display Type', icon: Monitor, type: 'select', options: ['LCD', 'OLED', 'AMOLED', 'Super AMOLED'] },
      { key: 'refresh_rate', name: 'Refresh Rate', icon: RotateCcw, type: 'select', options: ['60Hz', '90Hz', '120Hz', '144Hz'] },
      { key: 'touch_screen', name: 'Touch Screen', icon: Hand, type: 'boolean' },
      
      // Performance
      { key: 'processor', name: 'Processor', icon: Cpu, type: 'text', placeholder: 'Snapdragon 888, A15 Bionic' },
      { key: 'ram', name: 'RAM', icon: Zap, type: 'select', options: ['4GB', '6GB', '8GB', '12GB', '16GB'] },
      { key: 'storage', name: 'Storage', icon: HardDrive, type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
      { key: 'expandable_storage', name: 'Expandable Storage', icon: Expand, type: 'boolean' },
      
      // Camera
      { key: 'rear_camera', name: 'Rear Camera', icon: Camera, type: 'text', placeholder: '48MP + 12MP + 5MP' },
      { key: 'front_camera', name: 'Front Camera', icon: Camera, type: 'text', placeholder: '12MP' },
      { key: 'optical_zoom', name: 'Optical Zoom', icon: Camera, type: 'number', unit: 'x', placeholder: '3' },
      { key: 'video_recording', name: 'Video Recording', icon: Camera, type: 'select', options: ['4K@30fps', '4K@60fps', '8K@30fps'] },
      
      // Features
      { key: 'fingerprint_scanner', name: 'Fingerprint Scanner', icon: Fingerprint, type: 'boolean' },
      { key: 'face_id', name: 'Face Recognition', icon: ScanFace, type: 'boolean' },
      { key: 'wireless_charging', name: 'Wireless Charging', icon: BatteryCharging, type: 'boolean' },
      { key: 'fast_charging', name: 'Fast Charging', icon: FastForward, type: 'text', placeholder: '25W, 45W, 65W' },
      { key: 'reverse_charging', name: 'Reverse Charging', icon: BatteryCharging, type: 'boolean' },
      { key: 'nfc', name: 'NFC', icon: Radio, type: 'boolean' },
      { key: '5g_support', name: '5G Support', icon: Radio, type: 'boolean' },
      
      // Audio
      { key: 'stereo_speakers', name: 'Stereo Speakers', icon: Speaker, type: 'boolean' },
      { key: 'headphone_jack', name: 'Headphone Jack', icon: Headphones, type: 'boolean' },
      { key: 'noise_cancellation', name: 'Noise Cancellation', icon: Mic, type: 'boolean' },
      
      // Physical
      { key: 'weight', name: 'Weight', icon: Ruler, type: 'number', unit: 'g', placeholder: '180' },
      { key: 'thickness', name: 'Thickness', icon: Ruler, type: 'number', unit: 'mm', placeholder: '8.1' },
      { key: 'color', name: 'Color', icon: Palette, type: 'text', placeholder: 'Black, White, Blue' },
      
      // Battery
      { key: 'battery_capacity', name: 'Battery Capacity', icon: Battery, type: 'number', unit: 'mAh', placeholder: '4000' },
      { key: 'battery_life', name: 'Battery Life', icon: Battery, type: 'number', unit: 'hours', placeholder: '24' },
      
      // Durability
      { key: 'waterproof', name: 'Waterproof', icon: Droplets, type: 'select', options: ['IP67', 'IP68'] },
      { key: 'dust_resistant', name: 'Dust Resistant', icon: Wind, type: 'boolean' },
      { key: 'drop_resistant', name: 'Drop Resistant', icon: Shield, type: 'boolean' }
    ]
  },
  {
    id: 'monitor',
    name: 'Monitor',
    icon: Monitor,
    color: 'purple',
    specifications: [
      // Display
      { key: 'screen_size', name: 'Screen Size', icon: Monitor, type: 'select', options: ['21"', '24"', '27"', '32"', '34"', '43"', '49"'], unit: 'inch' },
      { key: 'resolution', name: 'Resolution', icon: Monitor, type: 'select', options: ['FHD (1920x1080)', 'QHD (2560x1440)', '4K (3840x2160)', '5K (5120x2880)', '8K (7680x4320)'] },
      { key: 'aspect_ratio', name: 'Aspect Ratio', icon: Monitor, type: 'select', options: ['16:9', '16:10', '21:9', '32:9', '4:3'] },
      { key: 'refresh_rate', name: 'Refresh Rate', icon: RotateCcw, type: 'select', options: ['60Hz', '75Hz', '120Hz', '144Hz', '165Hz', '240Hz'], unit: 'Hz' },
      { key: 'response_time', name: 'Response Time', icon: Zap, type: 'number', unit: 'ms', placeholder: '1' },
      
      // Panel Technology
      { key: 'panel_type', name: 'Panel Type', icon: Monitor, type: 'select', options: ['IPS', 'VA', 'TN', 'OLED', 'Mini LED'] },
      { key: 'color_gamut', name: 'Color Gamut', icon: Palette, type: 'select', options: ['sRGB', 'Adobe RGB', 'DCI-P3', 'Rec. 2020'] },
      { key: 'color_accuracy', name: 'Color Accuracy', icon: Palette, type: 'text', placeholder: 'ΔE < 2' },
      { key: 'brightness', name: 'Brightness', icon: Sun, type: 'number', unit: 'nits', placeholder: '300' },
      { key: 'contrast_ratio', name: 'Contrast Ratio', icon: Eye, type: 'text', placeholder: '1000:1' },
      
      // Features
      { key: 'hdr_support', name: 'HDR Support', icon: Monitor, type: 'select', options: ['HDR10', 'HDR10+', 'Dolby Vision', 'None'] },
      { key: 'g_sync', name: 'G-Sync', icon: Settings, type: 'boolean' },
      { key: 'freesync', name: 'FreeSync', icon: Settings, type: 'boolean' },
      { key: 'curved', name: 'Curved Display', icon: Monitor, type: 'boolean' },
      { key: 'touch_screen', name: 'Touch Screen', icon: Hand, type: 'boolean' },
      { key: 'built_in_speakers', name: 'Built-in Speakers', icon: Speaker, type: 'boolean' },
      { key: 'webcam', name: 'Built-in Webcam', icon: Camera, type: 'boolean' },
      { key: 'microphone', name: 'Built-in Microphone', icon: Mic, type: 'boolean' },
      
      // Connectivity
      { key: 'hdmi_ports', name: 'HDMI Ports', icon: Cable, type: 'number', unit: 'ports', placeholder: '2' },
      { key: 'displayport_ports', name: 'DisplayPort Ports', icon: Cable, type: 'number', unit: 'ports', placeholder: '1' },
      { key: 'usb_c_port', name: 'USB-C Port', icon: Usb, type: 'boolean' },
      { key: 'usb_hub', name: 'USB Hub', icon: Usb, type: 'number', unit: 'ports', placeholder: '4' },
      { key: 'audio_out', name: 'Audio Out', icon: Headphones, type: 'boolean' },
      { key: 'ethernet', name: 'Ethernet Port', icon: Cable, type: 'boolean' },
      
      // Physical
      { key: 'weight', name: 'Weight', icon: Ruler, type: 'number', unit: 'kg', placeholder: '5.5' },
      { key: 'thickness', name: 'Thickness', icon: Ruler, type: 'number', unit: 'mm', placeholder: '50' },
      { key: 'stand_height', name: 'Stand Height', icon: Ruler, type: 'number', unit: 'mm', placeholder: '100-150' },
      { key: 'color', name: 'Color', icon: Palette, type: 'text', placeholder: 'Black, White, Silver' },
      
      // Adjustability
      { key: 'tilt', name: 'Tilt Adjustment', icon: RotateCcw, type: 'boolean' },
      { key: 'swivel', name: 'Swivel Adjustment', icon: RotateCcw, type: 'boolean' },
      { key: 'height_adjustable', name: 'Height Adjustable', icon: Ruler, type: 'boolean' },
      { key: 'pivot', name: 'Pivot (Portrait)', icon: RotateCcw, type: 'boolean' },
      { key: 'wall_mountable', name: 'Wall Mountable', icon: Shield, type: 'boolean' },
      
      // Power
      { key: 'power_consumption', name: 'Power Consumption', icon: Power, type: 'number', unit: 'W', placeholder: '25' },
      { key: 'energy_rating', name: 'Energy Rating', icon: Power, type: 'select', options: ['A+++', 'A++', 'A+', 'A', 'B', 'C'] }
    ]
  },
  {
    id: 'tablet',
    name: 'Tablet',
    icon: Monitor,
    color: 'orange',
    specifications: [
      // Display
      { key: 'screen_size', name: 'Screen Size', icon: Monitor, type: 'number', unit: 'inch', placeholder: '10.9' },
      { key: 'resolution', name: 'Resolution', icon: Monitor, type: 'select', options: ['HD', 'FHD', 'QHD', '4K'] },
      { key: 'display_type', name: 'Display Type', icon: Monitor, type: 'select', options: ['LCD', 'OLED', 'AMOLED'] },
      { key: 'touch_screen', name: 'Touch Screen', icon: Hand, type: 'boolean' },
      { key: 'stylus_support', name: 'Stylus Support', icon: PenTool, type: 'boolean' },
      
      // Performance
      { key: 'processor', name: 'Processor', icon: Cpu, type: 'text', placeholder: 'Apple A14, Snapdragon 870' },
      { key: 'ram', name: 'RAM', icon: Zap, type: 'select', options: ['4GB', '6GB', '8GB', '12GB'] },
      { key: 'storage', name: 'Storage', icon: HardDrive, type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
      { key: 'expandable_storage', name: 'Expandable Storage', icon: Expand, type: 'boolean' },
      
      // Camera
      { key: 'rear_camera', name: 'Rear Camera', icon: Camera, type: 'text', placeholder: '12MP' },
      { key: 'front_camera', name: 'Front Camera', icon: Camera, type: 'text', placeholder: '7MP' },
      
      // Features
      { key: 'fingerprint_scanner', name: 'Fingerprint Scanner', icon: Fingerprint, type: 'boolean' },
      { key: 'face_id', name: 'Face Recognition', icon: ScanFace, type: 'boolean' },
      { key: 'keyboard_support', name: 'Keyboard Support', icon: Unplug, type: 'boolean' },
      { key: 'cellular', name: 'Cellular Support', icon: PhoneCall, type: 'boolean' },
      { key: 'gps', name: 'GPS', icon: Navigation, type: 'boolean' },
      
      // Connectivity
      { key: 'wifi', name: 'Wi-Fi', icon: Wifi, type: 'select', options: ['Wi-Fi 5', 'Wi-Fi 6', 'Wi-Fi 6E'] },
      { key: 'bluetooth', name: 'Bluetooth', icon: Bluetooth, type: 'select', options: ['4.0', '5.0', '5.1', '5.2'] },
      { key: 'usb_c_port', name: 'USB-C Port', icon: Usb, type: 'boolean' },
      { key: 'headphone_jack', name: 'Headphone Jack', icon: Headphones, type: 'boolean' },
      
      // Physical
      { key: 'weight', name: 'Weight', icon: Ruler, type: 'number', unit: 'g', placeholder: '500' },
      { key: 'thickness', name: 'Thickness', icon: Ruler, type: 'number', unit: 'mm', placeholder: '6.1' },
      { key: 'color', name: 'Color', icon: Palette, type: 'text', placeholder: 'Space Gray, Silver' },
      
      // Battery
      { key: 'battery_life', name: 'Battery Life', icon: Battery, type: 'number', unit: 'hours', placeholder: '10' },
      { key: 'fast_charging', name: 'Fast Charging', icon: FastForward, type: 'boolean' },
      { key: 'wireless_charging', name: 'Wireless Charging', icon: BatteryCharging, type: 'boolean' }
    ]
  },
  {
    id: 'accessories',
    name: 'Accessories',
    icon: Cable,
    color: 'gray',
    specifications: [
      // General
      { key: 'type', name: 'Type', icon: Cable, type: 'text', placeholder: 'Charger, Cable, Case' },
      { key: 'compatibility', name: 'Compatibility', icon: Settings, type: 'text', placeholder: 'iPhone, Samsung, Universal' },
      { key: 'color', name: 'Color', icon: Palette, type: 'text', placeholder: 'Black, White, Blue' },
      { key: 'material', name: 'Material', icon: Shield, type: 'text', placeholder: 'Plastic, Metal, Leather' },
      
      // Cables & Chargers
      { key: 'cable_length', name: 'Cable Length', icon: Ruler, type: 'number', unit: 'm', placeholder: '1' },
      { key: 'connector_type', name: 'Connector Type', icon: Usb, type: 'select', options: ['USB-A', 'USB-C', 'Lightning', 'Micro USB'] },
      { key: 'power_output', name: 'Power Output', icon: Power, type: 'text', placeholder: '20W, 65W' },
      { key: 'fast_charging', name: 'Fast Charging', icon: FastForward, type: 'boolean' },
      { key: 'wireless_charging', name: 'Wireless Charging', icon: BatteryCharging, type: 'boolean' },
      
      // Cases & Protection
      { key: 'protection_level', name: 'Protection Level', icon: Shield, type: 'select', options: ['Basic', 'Drop Protection', 'Waterproof', 'Military Grade'] },
      { key: 'transparency', name: 'Transparent', icon: Eye, type: 'boolean' },
      { key: 'magnetic', name: 'Magnetic', icon: Settings, type: 'boolean' },
      { key: 'kickstand', name: 'Kickstand', icon: Settings, type: 'boolean' },
      
      // Audio
      { key: 'audio_type', name: 'Audio Type', icon: Headphones, type: 'select', options: ['Wired', 'Wireless', 'Bluetooth', 'USB-C'] },
      { key: 'noise_cancellation', name: 'Noise Cancellation', icon: Mic, type: 'boolean' },
      { key: 'microphone', name: 'Microphone', icon: Mic, type: 'boolean' },
      { key: 'battery_life', name: 'Battery Life', icon: Battery, type: 'number', unit: 'hours', placeholder: '20' },
      
      // Physical
      { key: 'weight', name: 'Weight', icon: Ruler, type: 'number', unit: 'g', placeholder: '50' },
      { key: 'dimensions', name: 'Dimensions', icon: Ruler, type: 'text', placeholder: 'L x W x H' }
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
