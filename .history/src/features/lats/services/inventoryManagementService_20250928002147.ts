import { supabase } from '../../../lib/supabaseClient';

export interface InventoryItem {
  id: string;
  product_id: string;
  variant_id?: string;
  serial_number?: string;
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
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    sku: string;
  };
  variant?: {
    name: string;
    sku: string;
  };
}

export interface InventoryAuditEntry {
  field_name: string;
  old_value?: string;
  new_value?: string;
  changed_by: string;
  changed_at: string;
  reason?: string;
}

export interface InventoryStats {
  status: string;
  count: number;
  total_value: number;
}

export interface UpdateInventoryItemRequest {
  itemId: string;
  status?: string;
  location?: string;
  shelf?: string;
  bin?: string;
  reason?: string;
}

export interface BulkUpdateRequest {
  itemIds: string[];
  status: string;
  reason?: string;
}

class InventoryManagementService {
  /**
   * Update inventory item status with audit trail
   */
  static async updateItemStatus(request: UpdateInventoryItemRequest): Promise<{
    success: boolean;
    data?: InventoryItem;
    error?: string;
  }> {
    try {
      console.log('🔧 [InventoryManagementService] Updating item status:', request);

      const { data, error } = await supabase.rpc('update_inventory_item_status', {
        item_id: request.itemId,
        new_status: request.status,
        reason: request.reason || null,
        location: request.location || null,
        shelf: request.shelf || null,
        bin: request.bin || null
      });

      if (error) {
        console.error('❌ [InventoryManagementService] Update failed:', error);
        return { success: false, error: error.message };
      }

      // Fetch updated item
      const { data: updatedItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select(`
          *,
          product:product_id(name, sku),
          variant:variant_id(name, sku)
        `)
        .eq('id', request.itemId)
        .single();

      if (fetchError) {
        console.error('❌ [InventoryManagementService] Failed to fetch updated item:', fetchError);
        return { success: false, error: 'Item updated but failed to fetch updated data' };
      }

      console.log('✅ [InventoryManagementService] Item status updated successfully');
      return { success: true, data: updatedItem };
    } catch (error) {
      console.error('❌ [InventoryManagementService] Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Bulk update inventory items
   */
  static async bulkUpdateItems(request: BulkUpdateRequest): Promise<{
    success: boolean;
    data?: { updated_count: number };
    error?: string;
  }> {
    try {
      console.log('🔧 [InventoryManagementService] Bulk updating items:', {
        count: request.itemIds.length,
        status: request.status
      });

      const { data, error } = await supabase.rpc('bulk_update_inventory_status', {
        item_ids: request.itemIds,
        new_status: request.status,
        reason: request.reason || null
      });

      if (error) {
        console.error('❌ [InventoryManagementService] Bulk update failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [InventoryManagementService] Bulk update completed:', data);
      return { success: true, data: { updated_count: data || 0 } };
    } catch (error) {
      console.error('❌ [InventoryManagementService] Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get inventory item history/audit trail
   */
  static async getItemHistory(itemId: string): Promise<{
    success: boolean;
    data?: InventoryAuditEntry[];
    error?: string;
  }> {
    try {
      console.log('🔍 [InventoryManagementService] Fetching item history:', itemId);

      const { data, error } = await supabase.rpc('get_inventory_item_history', {
        item_id: itemId
      });

      if (error) {
        console.error('❌ [InventoryManagementService] Failed to fetch history:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [InventoryManagementService] History fetched:', data?.length || 0, 'entries');
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ [InventoryManagementService] Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get inventory statistics for purchase order
   */
  static async getPurchaseOrderStats(purchaseOrderId: string): Promise<{
    success: boolean;
    data?: InventoryStats[];
    error?: string;
  }> {
    try {
      console.log('📊 [InventoryManagementService] Fetching PO stats:', purchaseOrderId);

      const { data, error } = await supabase.rpc('get_po_inventory_stats', {
        po_id: purchaseOrderId
      });

      if (error) {
        console.error('❌ [InventoryManagementService] Failed to fetch stats:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [InventoryManagementService] Stats fetched:', data?.length || 0, 'categories');
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ [InventoryManagementService] Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Export inventory items to CSV
   */
  static async exportItemsToCSV(
    purchaseOrderId: string,
    filters?: {
      status?: string;
      location?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    try {
      console.log('📤 [InventoryManagementService] Exporting items to CSV:', purchaseOrderId);

      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          product:product_id(name, sku),
          variant:variant_id(name, sku)
        `)
        .eq('metadata->>purchase_order_id', purchaseOrderId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.location) {
        query = query.eq('location', filters.location);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data: items, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [InventoryManagementService] Failed to fetch items for export:', error);
        return { success: false, error: error.message };
      }

      // Generate CSV
      const headers = [
        'Serial Number',
        'Product Name',
        'Product SKU',
        'Variant',
        'IMEI',
        'MAC Address',
        'Barcode',
        'Status',
        'Location',
        'Shelf',
        'Bin',
        'Cost Price',
        'Selling Price',
        'Purchase Date',
        'Warranty Start',
        'Warranty End',
        'Notes',
        'Created Date'
      ];

      const csvRows = [
        headers.join(','),
        ...(items || []).map(item => [
          item.serial_number || '',
          item.product?.name || '',
          item.product?.sku || '',
          item.variant?.name || '',
          item.imei || '',
          item.mac_address || '',
          item.barcode || '',
          item.status || '',
          item.location || '',
          item.shelf || '',
          item.bin || '',
          item.cost_price || '',
          item.selling_price || '',
          item.purchase_date || '',
          item.warranty_start || '',
          item.warranty_end || '',
          (item.notes || '').replace(/,/g, ';'),
          item.created_at || ''
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');

      console.log('✅ [InventoryManagementService] CSV export completed:', items?.length || 0, 'items');
      return { success: true, data: csvContent };
    } catch (error) {
      console.error('❌ [InventoryManagementService] Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get available locations for dropdown
   */
  static async getAvailableLocations(): Promise<{
    success: boolean;
    data?: string[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('location')
        .not('location', 'is', null)
        .neq('location', '');

      if (error) {
        return { success: false, error: error.message };
      }

      const locations = [...new Set((data || []).map(item => item.location).filter(Boolean))];
      return { success: true, data: locations };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

export default InventoryManagementService;
