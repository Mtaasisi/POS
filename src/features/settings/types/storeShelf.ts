export interface StoreShelf {
  id: string;
  store_location_id: string;
  name: string;
  code: string;
  description?: string;
  
  // Shelf Details
  shelf_type: 'standard' | 'refrigerated' | 'display' | 'storage' | 'specialty';
  section?: string;
  aisle?: string;
  row_number?: number;
  column_number?: number;
  
  // Physical Details
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  max_weight_kg?: number;
  max_capacity?: number;
  current_capacity: number;
  
  // Location Details
  floor_level: number;
  zone?: 'front' | 'back' | 'left' | 'right' | 'center';
  coordinates?: { x: number; y: number; z: number };
  
  // Status & Settings
  is_active: boolean;
  is_accessible: boolean;
  requires_ladder: boolean;
  is_refrigerated: boolean;
  temperature_range?: { min: number; max: number };
  
  // Organization
  priority_order: number;
  color_code?: string;
  barcode?: string;
  
  // Additional Information
  notes?: string;
  images: string[];
  
  // Audit Fields
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  store_location?: {
    name: string;
    city: string;
  };
  products_count?: number;
}

export interface CreateStoreShelfData {
  store_location_id: string;
  name: string;
  code: string;
  description?: string;
  shelf_type?: 'standard' | 'refrigerated' | 'display' | 'storage' | 'specialty';
  section?: string;
  aisle?: string;
  row_number?: number;
  column_number?: number;
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  max_weight_kg?: number;
  max_capacity?: number;
  floor_level?: number;
  zone?: 'front' | 'back' | 'left' | 'right' | 'center';
  coordinates?: { x: number; y: number; z: number };
  is_active?: boolean;
  is_accessible?: boolean;
  requires_ladder?: boolean;
  is_refrigerated?: boolean;
  temperature_range?: { min: number; max: number };
  priority_order?: number;
  color_code?: string;
  barcode?: string;
  notes?: string;
  images?: string[];
}

export interface UpdateStoreShelfData extends Partial<CreateStoreShelfData> {
  id: string;
}

export interface StoreShelfFilters {
  store_location_id?: string;
  shelf_type?: string;
  section?: string;
  zone?: string;
  aisle?: string;
  row_number?: number;
  column_number?: number;
  floor_level?: number;
  is_active?: boolean;
  is_accessible?: boolean;
  is_refrigerated?: boolean;
  requires_ladder?: boolean;
  search?: string;
}

export interface StoreShelfStats {
  total_shelves: number;
  active_shelves: number;
  total_capacity: number;
  used_capacity: number;
  available_capacity: number;
  utilization_rate: number;
  shelves_by_type: Record<string, number>;
  shelves_by_section: Record<string, number>;
  shelves_by_zone: Record<string, number>;
}

export interface ShelfProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  stock_quantity: number;
  price: number;
  condition: string;
  category_name?: string;
  brand_name?: string;
  image_url?: string;
}

export interface ShelfWithProducts extends StoreShelf {
  products: ShelfProduct[];
}

export const SHELF_TYPES = [
  { value: 'standard', label: 'Standard Shelf' },
  { value: 'refrigerated', label: 'Refrigerated Shelf' },
  { value: 'display', label: 'Display Shelf' },
  { value: 'storage', label: 'Storage Shelf' },
  { value: 'specialty', label: 'Specialty Shelf' }
] as const;

export const SHELF_SECTIONS = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'parts', label: 'Parts' },
  { value: 'tools', label: 'Tools' },
  { value: 'cables', label: 'Cables' },
  { value: 'batteries', label: 'Batteries' },
  { value: 'screens', label: 'Screens' },
  { value: 'keyboards', label: 'Keyboards' },
  { value: 'other', label: 'Other' }
] as const;

export const SHELF_ZONES = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'center', label: 'Center' }
] as const;
