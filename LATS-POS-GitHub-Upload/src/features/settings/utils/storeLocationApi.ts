import { supabase } from '../../../lib/supabaseClient';
import { 
  StoreLocation, 
  CreateStoreLocationData, 
  UpdateStoreLocationData, 
  StoreLocationFilters,
  StoreLocationStats 
} from '../types/storeLocation';

export class StoreLocationApi {
  private tableName = 'lats_store_locations';

  async getAll(filters?: StoreLocationFilters): Promise<StoreLocation[]> {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .order('priority_order', { ascending: true })
      .order('name', { ascending: true });

    if (filters) {
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      }
      if (filters.city) {
        query = query.eq('city', filters.city);
      }
      if (filters.region) {
        query = query.eq('region', filters.region);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.is_main_branch !== undefined) {
        query = query.eq('is_main_branch', filters.is_main_branch);
      }
      if (filters.has_repair_service !== undefined) {
        query = query.eq('has_repair_service', filters.has_repair_service);
      }
      if (filters.has_sales_service !== undefined) {
        query = query.eq('has_sales_service', filters.has_sales_service);
      }
      if (filters.has_delivery_service !== undefined) {
        query = query.eq('has_delivery_service', filters.has_delivery_service);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch store locations: ${error.message}`);
    }

    return data || [];
  }

  async getById(id: string): Promise<StoreLocation | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch store location: ${error.message}`);
    }

    return data;
  }

  async getByCode(code: string): Promise<StoreLocation | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch store location: ${error.message}`);
    }

    return data;
  }

  async create(data: CreateStoreLocationData): Promise<StoreLocation> {
    // Check if code already exists
    const existingLocation = await this.getByCode(data.code);
    if (existingLocation) {
      throw new Error(`Store location with code '${data.code}' already exists`);
    }

    // If this is set as main branch, unset other main branches
    if (data.is_main_branch) {
      await supabase
        .from(this.tableName)
        .update({ is_main_branch: false })
        .eq('is_main_branch', true);
    }

    const { data: newLocation, error } = await supabase
      .from(this.tableName)
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create store location: ${error.message}`);
    }

    return newLocation;
  }

  async update(id: string, data: UpdateStoreLocationData): Promise<StoreLocation> {
    // Check if code already exists (if code is being updated)
    if (data.code) {
      const existingLocation = await this.getByCode(data.code);
      if (existingLocation && existingLocation.id !== id) {
        throw new Error(`Store location with code '${data.code}' already exists`);
      }
    }

    // If this is set as main branch, unset other main branches
    if (data.is_main_branch) {
      await supabase
        .from(this.tableName)
        .update({ is_main_branch: false })
        .eq('is_main_branch', true)
        .neq('id', id);
    }

    const { data: updatedLocation, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update store location: ${error.message}`);
    }

    return updatedLocation;
  }

  async delete(id: string): Promise<void> {
    // Check if this is the only main branch
    const location = await this.getById(id);
    if (location?.is_main_branch) {
      const mainBranches = await this.getAll({ is_main_branch: true });
      if (mainBranches.length <= 1) {
        throw new Error('Cannot delete the only main branch. Please set another location as main branch first.');
      }
    }

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete store location: ${error.message}`);
    }
  }

  async getStats(): Promise<StoreLocationStats> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('is_active, is_main_branch, current_staff_count, monthly_target, store_size_sqm');

    if (error) {
      throw new Error(`Failed to fetch store location stats: ${error.message}`);
    }

    const locations = data || [];
    
    const stats: StoreLocationStats = {
      total_locations: locations.length,
      active_locations: locations.filter(l => l.is_active).length,
      main_branches: locations.filter(l => l.is_main_branch).length,
      total_staff: locations.reduce((sum, l) => sum + (l.current_staff_count || 0), 0),
      total_monthly_target: locations.reduce((sum, l) => sum + (l.monthly_target || 0), 0),
      average_store_size: locations.length > 0 
        ? locations.reduce((sum, l) => sum + (l.store_size_sqm || 0), 0) / locations.length 
        : 0
    };

    return stats;
  }

  async getCities(): Promise<string[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('city')
      .not('city', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch cities: ${error.message}`);
    }

    const cities = [...new Set(data?.map(l => l.city) || [])];
    return cities.sort();
  }

  async getRegions(): Promise<string[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('region')
      .not('region', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch regions: ${error.message}`);
    }

    const regions = [...new Set(data?.map(l => l.region) || [])];
    return regions.sort();
  }

  async toggleActive(id: string): Promise<StoreLocation> {
    const location = await this.getById(id);
    if (!location) {
      throw new Error('Store location not found');
    }

    return this.update(id, { is_active: !location.is_active });
  }

  async setMainBranch(id: string): Promise<StoreLocation> {
    // Unset all other main branches
    await supabase
      .from(this.tableName)
      .update({ is_main_branch: false })
      .eq('is_main_branch', true);

    // Set this location as main branch
    return this.update(id, { is_main_branch: true });
  }
}

export const storeLocationApi = new StoreLocationApi();
