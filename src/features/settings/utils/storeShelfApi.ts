import { supabase } from '../../../lib/supabaseClient';
import { 
  StoreShelf, 
  CreateStoreShelfData, 
  UpdateStoreShelfData, 
  StoreShelfFilters, 
  StoreShelfStats,
  ShelfWithProducts,
  ShelfProduct
} from '../types/storeShelf';

export class StoreShelfApi {
  private tableName = 'lats_store_shelves';

  async getAll(filters?: StoreShelfFilters): Promise<StoreShelf[]> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        store_location:lats_store_locations(name, city)
      `)
      .order('priority_order', { ascending: true })
      .order('name', { ascending: true });

    if (filters) {
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
      if (filters.aisle) {
        query = query.eq('aisle', filters.aisle);
      }
      if (filters.row_number !== undefined) {
        query = query.eq('row_number', filters.row_number);
      }
      if (filters.column_number !== undefined) {
        query = query.eq('column_number', filters.column_number);
      }
      if (filters.floor_level !== undefined) {
        query = query.eq('floor_level', filters.floor_level);
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
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching shelves:', error);
      throw new Error('Failed to fetch shelves');
    }

    return data || [];
  }

  async getById(id: string): Promise<StoreShelf | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        store_location:lats_store_locations(name, city)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching shelf:', error);
      return null;
    }

    return data;
  }

  async getByCode(code: string, storeLocationId?: string): Promise<StoreShelf | null> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        store_location:lats_store_locations(name, city)
      `)
      .eq('code', code);

    if (storeLocationId) {
      query = query.eq('store_location_id', storeLocationId);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching shelf by code:', error);
      return null;
    }

    return data;
  }

  async create(data: CreateStoreShelfData): Promise<StoreShelf> {
    // Check if code already exists for this store location
    const existingShelf = await this.getByCode(data.code, data.store_location_id);
    if (existingShelf) {
      throw new Error(`Shelf with code ${data.code} already exists in this store location`);
    }

    const { data: newShelf, error } = await supabase
      .from(this.tableName)
      .insert([data])
      .select(`
        *,
        store_location:lats_store_locations(name, city)
      `)
      .single();

    if (error) {
      console.error('Error creating shelf:', error);
      throw new Error('Failed to create shelf');
    }

    return newShelf;
  }

  async update(id: string, data: UpdateStoreShelfData): Promise<StoreShelf> {
    // Check if code already exists for this store location (if code is being updated)
    if (data.code) {
      const existingShelf = await this.getByCode(data.code, data.store_location_id);
      if (existingShelf && existingShelf.id !== id) {
        throw new Error(`Shelf with code ${data.code} already exists in this store location`);
      }
    }

    const { data: updatedShelf, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select(`
        *,
        store_location:lats_store_locations(name, city)
      `)
      .single();

    if (error) {
      console.error('Error updating shelf:', error);
      throw new Error('Failed to update shelf');
    }

    return updatedShelf;
  }

  async delete(id: string): Promise<void> {
    // Check if shelf has products
    const products = await this.getShelfProducts(id);
    if (products.length > 0) {
      throw new Error('Cannot delete shelf that contains products. Please move or remove all products first.');
    }

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shelf:', error);
      throw new Error('Failed to delete shelf');
    }
  }

  async getStats(storeLocationId?: string): Promise<StoreShelfStats> {
    let query = supabase
      .from(this.tableName)
      .select('*');

    if (storeLocationId) {
      query = query.eq('store_location_id', storeLocationId);
    }

    const { data: shelves, error } = await query;

    if (error) {
      console.error('Error fetching shelf stats:', error);
      throw new Error('Failed to fetch shelf statistics');
    }

    const totalShelves = shelves?.length || 0;
    const activeShelves = shelves?.filter(s => s.is_active).length || 0;
    const totalCapacity = shelves?.reduce((sum, s) => sum + (s.max_capacity || 0), 0) || 0;
    const usedCapacity = shelves?.reduce((sum, s) => sum + s.current_capacity, 0) || 0;
    const availableCapacity = totalCapacity - usedCapacity;
    const utilizationRate = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

    // Group by type
    const shelvesByType: Record<string, number> = {};
    shelves?.forEach(shelf => {
      shelvesByType[shelf.shelf_type] = (shelvesByType[shelf.shelf_type] || 0) + 1;
    });

    // Group by section
    const shelvesBySection: Record<string, number> = {};
    shelves?.forEach(shelf => {
      if (shelf.section) {
        shelvesBySection[shelf.section] = (shelvesBySection[shelf.section] || 0) + 1;
      }
    });

    // Group by zone
    const shelvesByZone: Record<string, number> = {};
    shelves?.forEach(shelf => {
      if (shelf.zone) {
        shelvesByZone[shelf.zone] = (shelvesByZone[shelf.zone] || 0) + 1;
      }
    });

    return {
      total_shelves: totalShelves,
      active_shelves: activeShelves,
      total_capacity: totalCapacity,
      used_capacity: usedCapacity,
      available_capacity: availableCapacity,
      utilization_rate: utilizationRate,
      shelves_by_type: shelvesByType,
      shelves_by_section: shelvesBySection,
      shelves_by_zone: shelvesByZone
    };
  }

  async getShelfProducts(shelfId: string): Promise<ShelfProduct[]> {
    const { data, error } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        sku,
        barcode,
        total_quantity,
        total_value,
        condition,
        category:lats_categories(name),
        brand:lats_brands(name),
        images
      `)
      .eq('store_shelf', shelfId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching shelf products:', error);
      return [];
    }

    return (data || []).map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      stock_quantity: product.total_quantity,
      price: product.total_value,
      condition: product.condition,
      category_name: product.category?.name,
      brand_name: product.brand?.name,
      image_url: product.images?.[0]
    }));
  }

  async getShelfWithProducts(shelfId: string): Promise<ShelfWithProducts | null> {
    const shelf = await this.getById(shelfId);
    if (!shelf) return null;

    const products = await this.getShelfProducts(shelfId);

    return {
      ...shelf,
      products
    };
  }

  async getShelvesByLocation(storeLocationId: string): Promise<StoreShelf[]> {
    return this.getAll({ store_location_id: storeLocationId });
  }

  async getSections(storeLocationId?: string): Promise<string[]> {
    let query = supabase
      .from(this.tableName)
      .select('section')
      .not('section', 'is', null);

    if (storeLocationId) {
      query = query.eq('store_location_id', storeLocationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sections:', error);
      return [];
    }

    const sections = [...new Set(data?.map(s => s.section).filter(Boolean))];
    return sections.sort();
  }

  async getZones(storeLocationId?: string): Promise<string[]> {
    let query = supabase
      .from(this.tableName)
      .select('zone')
      .not('zone', 'is', null);

    if (storeLocationId) {
      query = query.eq('store_location_id', storeLocationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching zones:', error);
      return [];
    }

    const zones = [...new Set(data?.map(s => s.zone).filter(Boolean))];
    return zones.sort();
  }

  async toggleActive(id: string): Promise<StoreShelf> {
    const shelf = await this.getById(id);
    if (!shelf) {
      throw new Error('Shelf not found');
    }

    return this.update(id, { is_active: !shelf.is_active });
  }

  async toggleAccessible(id: string): Promise<StoreShelf> {
    const shelf = await this.getById(id);
    if (!shelf) {
      throw new Error('Shelf not found');
    }

    return this.update(id, { is_accessible: !shelf.is_accessible });
  }

  async moveProductToShelf(productId: string, shelfCode: string): Promise<void> {
    // Verify shelf exists
    const shelf = await this.getByCode(shelfCode);
    if (!shelf) {
      throw new Error(`Shelf with code ${shelfCode} not found`);
    }

    if (!shelf.is_active) {
      throw new Error(`Shelf ${shelfCode} is not active`);
    }

    // Check capacity
    if (shelf.max_capacity && shelf.current_capacity >= shelf.max_capacity) {
      throw new Error(`Shelf ${shelfCode} is at maximum capacity`);
    }

    // Update product shelf
    const { error } = await supabase
      .from('lats_products')
      .update({ store_shelf: shelfCode })
      .eq('id', productId);

    if (error) {
      console.error('Error moving product to shelf:', error);
      throw new Error('Failed to move product to shelf');
    }
  }

  async removeProductFromShelf(productId: string): Promise<void> {
    const { error } = await supabase
      .from('lats_products')
      .update({ store_shelf: null })
      .eq('id', productId);

    if (error) {
      console.error('Error removing product from shelf:', error);
      throw new Error('Failed to remove product from shelf');
    }
  }
}

export const storeShelfApi = new StoreShelfApi();
