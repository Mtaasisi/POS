export interface StoreLocation {
  id: string;
  name: string;
  code: string;
  description?: string;
  
  // Location Details
  address: string;
  city: string;
  region?: string;
  country: string;
  postal_code?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  
  // Contact Information
  phone?: string;
  email?: string;
  whatsapp?: string;
  
  // Business Details
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  
  // Operating Hours
  opening_hours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  is_24_hours: boolean;
  
  // Store Features
  has_parking: boolean;
  has_wifi: boolean;
  has_repair_service: boolean;
  has_sales_service: boolean;
  has_delivery_service: boolean;
  
  // Capacity & Size
  store_size_sqm?: number;
  max_capacity?: number;
  current_staff_count: number;
  
  // Status & Settings
  is_active: boolean;
  is_main_branch: boolean;
  priority_order: number;
  
  // Financial Information
  monthly_rent?: number;
  utilities_cost?: number;
  monthly_target?: number;
  
  // Additional Information
  notes?: string;
  images: string[];
  
  // Audit Fields
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStoreLocationData {
  name: string;
  code: string;
  description?: string;
  address: string;
  city: string;
  region?: string;
  country?: string;
  postal_code?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  phone?: string;
  email?: string;
  whatsapp?: string;
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  opening_hours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  is_24_hours?: boolean;
  has_parking?: boolean;
  has_wifi?: boolean;
  has_repair_service?: boolean;
  has_sales_service?: boolean;
  has_delivery_service?: boolean;
  store_size_sqm?: number;
  max_capacity?: number;
  current_staff_count?: number;
  is_active?: boolean;
  is_main_branch?: boolean;
  priority_order?: number;
  monthly_rent?: number;
  utilities_cost?: number;
  monthly_target?: number;
  notes?: string;
  images?: string[];
}

export interface UpdateStoreLocationData extends Partial<CreateStoreLocationData> {
  id: string;
}

export interface StoreLocationFilters {
  search?: string;
  city?: string;
  region?: string;
  is_active?: boolean;
  is_main_branch?: boolean;
  has_repair_service?: boolean;
  has_sales_service?: boolean;
  has_delivery_service?: boolean;
}

export interface StoreLocationStats {
  total_locations: number;
  active_locations: number;
  main_branches: number;
  total_staff: number;
  total_monthly_target: number;
  average_store_size: number;
}
