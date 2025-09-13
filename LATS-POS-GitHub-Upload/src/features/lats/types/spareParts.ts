// Spare Parts TypeScript Interfaces
// Matches the database schema in 20241205000000_enhance_spare_parts_table.sql

export interface SparePart {
  id: string;
  name: string;
  part_number: string;
  category_id: string;
  brand?: string;
  supplier_id?: string;
  condition?: 'new' | 'used' | 'refurbished';
  description?: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  location?: string;
  compatible_devices?: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data (not in database)
  category?: Category;
  supplier?: Supplier;
  created_by_user?: User;
  updated_by_user?: User;
}

export interface SparePartUsage {
  id: string;
  spare_part_id: string;
  quantity_used: number;
  used_by?: string;
  used_for?: string;
  device_id?: string;
  created_at: string;
  
  // Joined data (not in database)
  spare_part?: SparePart;
  used_by_user?: User;
  device?: Device;
}

export interface SparePartFormData {
  name: string;
  part_number: string;
  category_id: string;

  supplier_id: string;
  condition: 'new' | 'used' | 'refurbished';
  description: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  location: string;
  compatible_devices: string;
  images: any[];
}

export interface SparePartCreateData {
  name: string;
  part_number: string;
  category_id: string;
  brand?: string;
  supplier_id?: string;
  condition?: 'new' | 'used' | 'refurbished';
  description?: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  location?: string;
  compatible_devices?: string;
}

export interface SparePartUpdateData extends Partial<SparePartCreateData> {
  id: string;
}

export interface SparePartUsageCreateData {
  spare_part_id: string;
  quantity_used: number;
  used_by?: string;
  used_for?: string;
  device_id?: string;
}

// Supporting interfaces (imported from other files)
export interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  name: string;
  model?: string;

  serial_number?: string;
  created_at: string;
  updated_at: string;
}

// API Response interfaces
export interface SparePartResponse {
  data: SparePart;
  message: string;
  ok: boolean;
}

export interface SparePartsResponse {
  data: SparePart[];
  message: string;
  ok: boolean;
  total: number;
  page: number;
  limit: number;
}

export interface SparePartUsageResponse {
  data: SparePartUsage;
  message: string;
  ok: boolean;
}

export interface SparePartUsagesResponse {
  data: SparePartUsage[];
  message: string;
  ok: boolean;
  total: number;
  page: number;
  limit: number;
}

// Filter and search interfaces
export interface SparePartFilters {
  category_id?: string;
  supplier_id?: string;
  condition?: 'new' | 'used' | 'refurbished';

  is_active?: boolean;
  low_stock?: boolean;
  out_of_stock?: boolean;
  search?: string;
}

export interface SparePartSortOptions {
  field: 'name' | 'part_number' | 'cost_price' | 'selling_price' | 'quantity' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

// Statistics interfaces
export interface SparePartStats {
  total_spare_parts: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  categories_count: number;
  suppliers_count: number;
}

export interface SparePartCategoryStats {
  category_id: string;
  category_name: string;
  spare_parts_count: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface SparePartSupplierStats {
  supplier_id: string;
  supplier_name: string;
  spare_parts_count: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}
