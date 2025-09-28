import { supabase } from '../../../lib/supabaseClient';

export interface StorageRoom {
  id: string;
  store_location_id: string;
  name?: string;
  code: string;
  description?: string;
  floor_level: number;
  area_sqm?: number;
  max_capacity?: number;
  current_capacity: number;
  is_active: boolean;
  is_secure: boolean;
  requires_access_card: boolean;
  color_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStorageRoomData {
  store_location_id: string;
  name?: string;
  code: string;
  description?: string;
  floor_level: number;
  area_sqm?: number;
  max_capacity?: number;
  is_active: boolean;
  is_secure: boolean;
  requires_access_card: boolean;
  color_code?: string;
  notes?: string;
}

export interface UpdateStorageRoomData extends Partial<CreateStorageRoomData> {
  id: string;
}

class StorageRoomApi {
  private tableName = 'lats_storage_rooms';

  async getAll(): Promise<StorageRoom[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching storage rooms:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<StorageRoom | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching storage room:', error);
      throw error;
    }
  }

  async getByStoreLocation(storeLocationId: string): Promise<StorageRoom[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('store_location_id', storeLocationId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching storage rooms by location:', error);
      throw error;
    }
  }

  async create(storageRoomData: CreateStorageRoomData): Promise<StorageRoom> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([storageRoomData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating storage room:', error);
      throw error;
    }
  }

  async update(updateData: UpdateStorageRoomData): Promise<StorageRoom> {
    try {
      const { id, ...updateFields } = updateData;
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating storage room:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting storage room:', error);
      throw error;
    }
  }

  async getActive(): Promise<StorageRoom[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active storage rooms:', error);
      throw error;
    }
  }

  async getSecure(): Promise<StorageRoom[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('is_secure', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching secure storage rooms:', error);
      throw error;
    }
  }

  async updateCapacity(id: string, currentCapacity: number): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ current_capacity: currentCapacity })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating storage room capacity:', error);
      throw error;
    }
  }

  async search(query: string): Promise<StorageRoom[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${query}%,code.ilike.%${query}%,description.ilike.%${query}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching storage rooms:', error);
      throw error;
    }
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    secure: number;
    totalCapacity: number;
    usedCapacity: number;
  }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('is_active, is_secure, max_capacity, current_capacity');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        active: data?.filter(room => room.is_active).length || 0,
        secure: data?.filter(room => room.is_secure).length || 0,
        totalCapacity: data?.reduce((sum, room) => sum + (room.max_capacity || 0), 0) || 0,
        usedCapacity: data?.reduce((sum, room) => sum + (room.current_capacity || 0), 0) || 0,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching storage room stats:', error);
      throw error;
    }
  }
}

export const storageRoomApi = new StorageRoomApi();
