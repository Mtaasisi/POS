import { supabase } from '../../../lib/supabaseClient';

export interface StoreShelf {
  id: string;
  store_location_id: string;
  name: string;
  code: string;
  description?: string;
  shelf_type: 'standard' | 'refrigerated' | 'display' | 'storage' | 'specialty';
  section?: string;
  aisle?: string;
  row_number?: number;
  column_number?: number;
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  max_weight_kg?: number;
  max_capacity?: number;
  current_capacity: number;
  floor_level: number;
  zone?: 'front' | 'back' | 'left' | 'right' | 'center';
  coordinates?: any;
  is_active: boolean;
  is_accessible: boolean;
  requires_ladder: boolean;
  is_refrigerated: boolean;
  temperature_range?: any;
  priority_order: number;
  color_code?: string;
  barcode?: string;
  notes?: string;
  images: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
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
  coordinates?: any;
  is_active?: boolean;
  is_accessible?: boolean;
  requires_ladder?: boolean;
  is_refrigerated?: boolean;
  temperature_range?: any;
  priority_order?: number;
  color_code?: string;
  barcode?: string;
  notes?: string;
  images?: string[];
}

export interface UpdateStoreShelfData extends Partial<CreateStoreShelfData> {}

export interface StoreShelfFilters {
  search?: string;
  store_location_id?: string;
  shelf_type?: string;
  section?: string;
  zone?: string;
  is_active?: boolean;
  is_accessible?: boolean;
  is_refrigerated?: boolean;
  requires_ladder?: boolean;
}

export interface StoreShelfStats {
  total_shelves: number;
  active_shelves: number;
  total_capacity: number;
  used_capacity: number;
  utilization_percentage: number;
  refrigerated_shelves: number;
  display_shelves: number;
  storage_shelves: number;
}

export class StoreShelfApi {
  private tableName = 'lats_store_shelves';

  async getAll(filters?: StoreShelfFilters): Promise<StoreShelf[]> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        store_location:lats_store_locations(name, code, city)
      `)
      .order('priority_order', { ascending: true })
      .order('name', { ascending: true });

    if (filters) {
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,section.ilike.%${filters.search}%`);
      }
      if (filters.store_location_id) {
        query = query.eq('store_location_id', filters.store_location_id);
      }
      if (filters.shelf_type) {
        query = query.eq('shelf_type', filters.shelf_type);
      }
      if (filters.section) {
        query = query.eq('section', filters.section);
      }
      if (filters.zone) {
        query = query.eq('zone', filters.zone);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.is_accessible !== undefined) {
        query = query.eq('is_accessible', filters.is_accessible);
      }
      if (filters.is_refrigerated !== undefined) {
        query = query.eq('is_refrigerated', filters.is_refrigerated);
      }
      if (filters.requires_ladder !== undefined) {
        query = query.eq('requires_ladder', filters.requires_ladder);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch store shelves: ${error.message}`);
    }

    return data || [];
  }

  async getById(id: string): Promise<StoreShelf | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        store_location:lats_store_locations(name, code, city)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch store shelf: ${error.message}`);
    }

    return data;
  }

  async getByCode(code: string): Promise<StoreShelf | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        store_location:lats_store_locations(name, code, city)
      `)
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch store shelf: ${error.message}`);
    }

    return data;
  }

  async getShelvesByLocation(locationId: string): Promise<StoreShelf[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('store_location_id', locationId)
      .eq('is_active', true)
      .order('priority_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch shelves for location: ${error.message}`);
    }

    return data || [];
  }

  async create(data: CreateStoreShelfData): Promise<StoreShelf> {
    const { data: shelf, error } = await supabase
      .from(this.tableName)
      .insert([{
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create store shelf: ${error.message}`);
    }

    return shelf;
  }

  async update(id: string, data: UpdateStoreShelfData): Promise<StoreShelf> {
    const { data: shelf, error } = await supabase
      .from(this.tableName)
      .update({
        ...data,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update store shelf: ${error.message}`);
    }

    return shelf;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete store shelf: ${error.message}`);
    }
  }

  async updateCapacity(id: string, currentCapacity: number): Promise<StoreShelf> {
    const { data: shelf, error } = await supabase
      .from(this.tableName)
      .update({
        current_capacity: currentCapacity,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update shelf capacity: ${error.message}`);
    }

    return shelf;
  }

  async moveProductToShelf(productId: string, shelfCode: string): Promise<void> {
    // First, get the shelf to check capacity
    const shelf = await this.getByCode(shelfCode);
    if (!shelf) {
      throw new Error(`Shelf with code ${shelfCode} not found`);
    }

    // Update the product's shelf assignment
    const { error: productError } = await supabase
      .from('lats_products')
      .update({ store_shelf: shelfCode })
      .eq('id', productId);

    if (productError) {
      throw new Error(`Failed to move product to shelf: ${productError.message}`);
    }

    // Update shelf capacity (increment by 1)
    await this.updateCapacity(shelf.id, shelf.current_capacity + 1);
  }

  async getStats(filters?: StoreShelfFilters): Promise<StoreShelfStats> {
    const shelves = await this.getAll(filters);
    
    const totalShelves = shelves.length;
    const activeShelves = shelves.filter(s => s.is_active).length;
    const totalCapacity = shelves.reduce((sum, s) => sum + (s.max_capacity || 0), 0);
    const usedCapacity = shelves.reduce((sum, s) => sum + s.current_capacity, 0);
    const utilizationPercentage = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;
    const refrigeratedShelves = shelves.filter(s => s.is_refrigerated).length;
    const displayShelves = shelves.filter(s => s.shelf_type === 'display').length;
    const storageShelves = shelves.filter(s => s.shelf_type === 'storage').length;

    return {
      total_shelves: totalShelves,
      active_shelves: activeShelves,
      total_capacity: totalCapacity,
      used_capacity: usedCapacity,
      utilization_percentage: Math.round(utilizationPercentage * 100) / 100,
      refrigerated_shelves: refrigeratedShelves,
      display_shelves: displayShelves,
      storage_shelves: storageShelves
    };
  }

  async generateShelfCode(locationId: string, section?: string): Promise<string> {
    const shelves = await this.getShelvesByLocation(locationId);
    const sectionShelves = section ? shelves.filter(s => s.section === section) : shelves;
    
    const baseCode = section ? `${section.toUpperCase().substring(0, 3)}` : 'SHELF';
    const existingCodes = sectionShelves.map(s => s.code);
    
    let counter = 1;
    let newCode = `${baseCode}${counter.toString().padStart(3, '0')}`;
    
    while (existingCodes.includes(newCode)) {
      counter++;
      newCode = `${baseCode}${counter.toString().padStart(3, '0')}`;
    }
    
    return newCode;
  }
}

export const storeShelfApi = new StoreShelfApi();
