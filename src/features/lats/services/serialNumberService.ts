import { supabase } from '../../../lib/supabaseClient';

export interface InventoryItem {
  id: string;
  product_id: string;
  variant_id?: string;
  serial_number: string;
  imei?: string;
  mac_address?: string;
  barcode?: string;
  status: 'available' | 'reserved' | 'sold' | 'damaged' | 'returned' | 'repair' | 'warranty';
  location?: string;
  shelf?: string;
  bin?: string;
  purchase_date?: string;
  warranty_start?: string;
  warranty_end?: string;
  cost_price?: number;
  selling_price?: number;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface SerialNumberMovement {
  id: string;
  inventory_item_id: string;
  movement_type: 'received' | 'sold' | 'returned' | 'damaged' | 'repair' | 'warranty' | 'location_change';
  from_status?: string;
  to_status: string;
  from_location?: string;
  to_location?: string;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

class SerialNumberService {
  // Get all inventory items for a product
  async getInventoryItems(productId: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching inventory items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  }

  // Get available inventory items for a product
  async getAvailableItems(productId: string, limit: number = 10): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'available')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching available items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching available items:', error);
      throw error;
    }
  }

  // Create a new inventory item
  async createInventoryItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([itemData])
        .select()
        .single();

      if (error) {
        console.error('Error creating inventory item:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  // Update an inventory item
  async updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating inventory item:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  // Delete an inventory item
  async deleteInventoryItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting inventory item:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  // Generate serial numbers for a product
  async generateSerialNumbers(
    productId: string,
    quantity: number,
    prefix?: string
  ): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('generate_serial_numbers', {
        product_id_param: productId,
        quantity_param: quantity,
        prefix_param: prefix
      });

      if (error) {
        console.error('Error generating serial numbers:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error generating serial numbers:', error);
      throw error;
    }
  }

  // Check if serial number is unique for a product
  async isSerialNumberUnique(productId: string, serialNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_serial_number_unique', {
        product_id_param: productId,
        serial_number_param: serialNumber
      });

      if (error) {
        console.error('Error checking serial number uniqueness:', error);
        throw error;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking serial number uniqueness:', error);
      throw error;
    }
  }

  // Get available serial numbers for a product
  async getAvailableSerialNumbers(productId: string, limit: number = 10): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase.rpc('get_available_serial_numbers', {
        product_id_param: productId,
        limit_param: limit
      });

      if (error) {
        console.error('Error fetching available serial numbers:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching available serial numbers:', error);
      throw error;
    }
  }

  // Update item status and create movement record
  async updateItemStatus(
    itemId: string,
    newStatus: string,
    fromStatus?: string,
    referenceId?: string,
    referenceType?: string,
    notes?: string
  ): Promise<void> {
    try {
      // Update the item status
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ status: newStatus })
        .eq('id', itemId);

      if (updateError) {
        console.error('Error updating item status:', updateError);
        throw updateError;
      }

      // Create movement record
      const { error: movementError } = await supabase
        .from('serial_number_movements')
        .insert([{
          inventory_item_id: itemId,
          movement_type: this.getMovementType(fromStatus, newStatus),
          from_status: fromStatus,
          to_status: newStatus,
          reference_id: referenceId,
          reference_type: referenceType,
          notes: notes
        }]);

      if (movementError) {
        console.error('Error creating movement record:', movementError);
        throw movementError;
      }
    } catch (error) {
      console.error('Error updating item status:', error);
      throw error;
    }
  }

  // Get movement history for an item
  async getItemMovements(itemId: string): Promise<SerialNumberMovement[]> {
    try {
      const { data, error } = await supabase
        .from('serial_number_movements')
        .select('*')
        .eq('inventory_item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching item movements:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching item movements:', error);
      throw error;
    }
  }

  // Search inventory items
  async searchInventoryItems(
    productId: string,
    searchTerm: string,
    statusFilter?: string
  ): Promise<InventoryItem[]> {
    try {
      let query = supabase
        .from('inventory_items')
        .select('*')
        .eq('product_id', productId);

      if (searchTerm) {
        query = query.or(`serial_number.ilike.%${searchTerm}%,imei.ilike.%${searchTerm}%,mac_address.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching inventory items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching inventory items:', error);
      throw error;
    }
  }

  // Get inventory statistics for a product
  async getInventoryStats(productId: string): Promise<{
    total: number;
    available: number;
    reserved: number;
    sold: number;
    damaged: number;
    returned: number;
    repair: number;
    warranty: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('status')
        .eq('product_id', productId);

      if (error) {
        console.error('Error fetching inventory stats:', error);
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        available: 0,
        reserved: 0,
        sold: 0,
        damaged: 0,
        returned: 0,
        repair: 0,
        warranty: 0
      };

      data?.forEach(item => {
        switch (item.status) {
          case 'available':
            stats.available++;
            break;
          case 'reserved':
            stats.reserved++;
            break;
          case 'sold':
            stats.sold++;
            break;
          case 'damaged':
            stats.damaged++;
            break;
          case 'returned':
            stats.returned++;
            break;
          case 'repair':
            stats.repair++;
            break;
          case 'warranty':
            stats.warranty++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  }

  // Helper method to determine movement type
  private getMovementType(fromStatus?: string, toStatus?: string): string {
    if (!fromStatus || !toStatus) return 'location_change';
    
    if (toStatus === 'sold') return 'sold';
    if (toStatus === 'returned') return 'returned';
    if (toStatus === 'damaged') return 'damaged';
    if (toStatus === 'repair') return 'repair';
    if (toStatus === 'warranty') return 'warranty';
    
    return 'location_change';
  }
}

export const serialNumberService = new SerialNumberService();
