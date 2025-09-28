import { supabase } from '../../../../lib/supabaseClient';

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
  cost_price?: number;
  selling_price?: number;
  notes?: string;
  created_at: string;
}

export interface SaleInventoryItem {
  id: string;
  sale_id: string;
  inventory_item_id: string;
  customer_id?: string;
  created_at: string;
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

class SerialNumberSalesService {
  /**
   * Check if a product has serialized items
   */
  async hasSerializedItems(productId: string, variantId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('inventory_items')
        .select('id')
        .eq('product_id', productId)
        .eq('status', 'available')
        .limit(1);

      if (variantId) {
        query = query.eq('variant_id', variantId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking serialized items:', error);
        return false;
      }

      return (data && data.length > 0) || false;
    } catch (error) {
      console.error('Error checking serialized items:', error);
      return false;
    }
  }

  /**
   * Get available serialized items for a product
   */
  async getAvailableItems(productId: string, variantId?: string): Promise<InventoryItem[]> {
    try {
      let query = supabase
        .from('inventory_items')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'available');

      if (variantId) {
        query = query.eq('variant_id', variantId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting available items:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting available items:', error);
      return [];
    }
  }

  /**
   * Link serialized items to a sale
   */
  async linkItemsToSale(
    saleId: string,
    inventoryItemIds: string[],
    customerId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'system';

      // Create sale inventory item links
      const saleInventoryItems = inventoryItemIds.map(itemId => ({
        sale_id: saleId,
        inventory_item_id: itemId,
        customer_id: customerId
      }));

      const { error: linkError } = await supabase
        .from('sale_inventory_items')
        .insert(saleInventoryItems);

      if (linkError) {
        console.error('Error linking items to sale:', linkError);
        return { success: false, error: linkError.message };
      }

      // Update inventory item status to 'sold'
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ status: 'sold' })
        .in('id', inventoryItemIds);

      if (updateError) {
        console.error('Error updating item status:', updateError);
        return { success: false, error: updateError.message };
      }

      // Create movement records for each item
      const movements = inventoryItemIds.map(itemId => ({
        inventory_item_id: itemId,
        movement_type: 'sold' as const,
        from_status: 'available',
        to_status: 'sold',
        reference_id: saleId,
        reference_type: 'sale',
        notes: `Item sold in sale ${saleId}`,
        created_by: userId
      }));

      const { error: movementError } = await supabase
        .from('serial_number_movements')
        .insert(movements);

      if (movementError) {
        console.warn('Warning: Failed to create movement records:', movementError);
        // Don't fail the entire operation for this
      }

      return { success: true };
    } catch (error) {
      console.error('Error linking items to sale:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get serialized items for a specific sale
   */
  async getSaleItems(saleId: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('sale_inventory_items')
        .select(`
          *,
          inventory_item:inventory_items(*)
        `)
        .eq('sale_id', saleId);

      if (error) {
        console.error('Error getting sale items:', error);
        return [];
      }

      return data?.map(item => item.inventory_item).filter(Boolean) || [];
    } catch (error) {
      console.error('Error getting sale items:', error);
      return [];
    }
  }

  /**
   * Get customer's purchase history with serial numbers
   */
  async getCustomerSerialHistory(customerId: string): Promise<{
    sales: Array<{
      sale_id: string;
      sale_date: string;
      total_amount: number;
      items: InventoryItem[];
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('sale_inventory_items')
        .select(`
          sale_id,
          created_at,
          inventory_item:inventory_items(*),
          sale:lats_sales(total_amount, created_at)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting customer serial history:', error);
        return { sales: [] };
      }

      // Group by sale
      const salesMap = new Map();
      
      data?.forEach(item => {
        const saleId = item.sale_id;
        if (!salesMap.has(saleId)) {
          salesMap.set(saleId, {
            sale_id: saleId,
            sale_date: item.sale?.created_at || item.created_at,
            total_amount: item.sale?.total_amount || 0,
            items: []
          });
        }
        if (item.inventory_item) {
          salesMap.get(saleId).items.push(item.inventory_item);
        }
      });

      return { sales: Array.from(salesMap.values()) };
    } catch (error) {
      console.error('Error getting customer serial history:', error);
      return { sales: [] };
    }
  }

  /**
   * Handle item return
   */
  async returnItem(
    inventoryItemId: string,
    reason: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'system';

      // Update item status to 'returned'
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          status: 'returned',
          notes: notes || reason
        })
        .eq('id', inventoryItemId);

      if (updateError) {
        console.error('Error updating item status:', updateError);
        return { success: false, error: updateError.message };
      }

      // Create movement record
      const { error: movementError } = await supabase
        .from('serial_number_movements')
        .insert({
          inventory_item_id: inventoryItemId,
          movement_type: 'returned',
          from_status: 'sold',
          to_status: 'returned',
          notes: reason,
          created_by: userId
        });

      if (movementError) {
        console.warn('Warning: Failed to create movement record:', movementError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error returning item:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get item movement history
   */
  async getItemHistory(inventoryItemId: string): Promise<SerialNumberMovement[]> {
    try {
      const { data, error } = await supabase
        .from('serial_number_movements')
        .select('*')
        .eq('inventory_item_id', inventoryItemId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting item history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting item history:', error);
      return [];
    }
  }
}

export const serialNumberSalesService = new SerialNumberSalesService();
