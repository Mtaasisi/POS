import { supabase } from '../../../lib/supabaseClient';

/**
 * Concise Database-Integrated Purchase Order Actions Service
 * Handles all action button operations with direct database integration
 */

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface QualityCheckData {
  itemId: string;
  status: 'passed' | 'failed' | 'attention';
  notes?: string;
}

export interface ReturnOrderData {
  reason: string;
  items: Array<{ itemId: string; quantity: number }>;
  returnType: string;
  notes?: string;
}

export interface BulkActionData {
  itemIds: string[];
  action: 'update_status' | 'assign_location' | 'export';
  value: string;
}

export class PurchaseOrderActionsService {
  
  // ===========================================
  // CORE ORDER ACTIONS
  // ===========================================
  
  /**
   * Delete a purchase order (draft only)
   */
  static async deleteOrder(orderId: string): Promise<ActionResult> {
    try {
      const { error } = await supabase
        .from('lats_purchase_orders')
        .delete()
        .eq('id', orderId)
        .eq('status', 'draft');

      if (error) throw error;
      
      return { success: true, message: 'Order deleted successfully' };
    } catch (error) {
      console.error('Error deleting order:', error);
      return { success: false, message: 'Failed to delete order' };
    }
  }

  /**
   * Cancel a purchase order (approved orders only)
   */
  static async cancelOrder(orderId: string): Promise<ActionResult> {
    try {
      const { error } = await supabase
        .from('lats_purchase_orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .in('status', ['sent', 'confirmed']);

      if (error) throw error;
      
      return { success: true, message: 'Order cancelled successfully' };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, message: 'Failed to cancel order' };
    }
  }

  /**
   * Duplicate a purchase order
   */
  static async duplicateOrder(orderId: string): Promise<ActionResult> {
    try {
      // Get original order
      const { data: originalOrder, error: fetchError } = await supabase
        .from('lats_purchase_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Generate unique order number to avoid conflicts
      const timestamp = Date.now();
      const uniqueOrderNumber = `${originalOrder.order_number}-COPY-${timestamp}`;

      // Create duplicate order
      const duplicateOrder = {
        ...originalOrder,
        order_number: uniqueOrderNumber,
        status: 'draft',
        payment_status: 'unpaid',
        total_paid: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Remove ID to create new record
      delete duplicateOrder.id;

      const { data: newOrder, error: createError } = await supabase
        .from('lats_purchase_orders')
        .insert(duplicateOrder)
        .select()
        .single();

      if (createError) throw createError;

      // Duplicate order items
      const { data: originalItems, error: itemsError } = await supabase
        .from('lats_purchase_order_items')
        .select('*')
        .eq('purchase_order_id', orderId);

      if (itemsError) throw itemsError;

      if (originalItems && originalItems.length > 0) {
        const duplicateItems = originalItems.map(item => ({
          ...item,
          purchase_order_id: newOrder.id,
          received_quantity: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: itemsCreateError } = await supabase
          .from('lats_purchase_order_items')
          .insert(duplicateItems.map(({ id, ...item }) => item));

        if (itemsCreateError) throw itemsCreateError;
      }

      console.log('✅ Order duplicated successfully:', {
        originalOrderId: orderId,
        newOrderId: newOrder.id,
        newOrderNumber: newOrder.order_number,
        itemsDuplicated: originalItems?.length || 0
      });

      return { success: true, message: 'Order duplicated successfully', data: newOrder };
    } catch (error) {
      console.error('❌ Error duplicating order:', error);
      console.error('Error details:', {
        orderId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details
      });
      return { 
        success: false, 
        message: `Failed to duplicate order: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // ===========================================
  // QUALITY CONTROL ACTIONS
  // ===========================================
  
  /**
   * Update item quality check status
   */
  static async updateItemQualityCheck(itemId: string, status: string, notes?: string): Promise<ActionResult> {
    try {
      const { error } = await supabase
        .from('purchase_order_quality_checks')
        .insert({
          item_id: itemId,
          passed: status === 'passed',
          notes: notes || null,
          checked_by: 'system', // TODO: Get from auth context
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      
      return { success: true, message: 'Quality check updated' };
    } catch (error) {
      console.error('Error updating quality check:', error);
      return { success: false, message: 'Failed to update quality check' };
    }
  }

  /**
   * Complete quality check process
   */
  static async completeQualityCheck(orderId: string): Promise<ActionResult> {
    try {
      // Update order status to quality_checked
      const { error } = await supabase
        .from('lats_purchase_orders')
        .update({ 
          status: 'quality_checked',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      return { success: true, message: 'Quality check completed' };
    } catch (error) {
      console.error('Error completing quality check:', error);
      return { success: false, message: 'Failed to complete quality check' };
    }
  }

  // ===========================================
  // COMMUNICATION ACTIONS
  // ===========================================
  
  /**
   * Send SMS to supplier
   */
  static async sendSMS(phone: string, message: string, orderId: string): Promise<ActionResult> {
    try {
      // Log SMS attempt in messages table
      const { error } = await supabase
        .from('purchase_order_messages')
        .insert({
          purchase_order_id: orderId,
          sender: 'system',
          content: `SMS sent to ${phone}: ${message}`,
          type: 'system',
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      
      // TODO: Integrate with actual SMS service (Twilio, etc.)
      console.log(`SMS to ${phone}: ${message}`);
      
      return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return { success: false, message: 'Failed to send SMS' };
    }
  }

  // ===========================================
  // NOTES ACTIONS
  // ===========================================
  
  /**
   * Add note to purchase order
   */
  static async addNote(orderId: string, content: string, author: string): Promise<ActionResult> {
    try {
      const { data, error } = await supabase
        .from('purchase_order_messages')
        .insert({
          purchase_order_id: orderId,
          sender: author,
          content: content,
          type: 'user',
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      return { success: true, message: 'Note added successfully', data };
    } catch (error) {
      console.error('Error adding note:', error);
      return { success: false, message: 'Failed to add note' };
    }
  }

  /**
   * Get notes for purchase order
   */
  static async getNotes(orderId: string): Promise<ActionResult> {
    try {
      const { data, error } = await supabase
        .from('purchase_order_messages')
        .select('*')
        .eq('purchase_order_id', orderId)
        .eq('type', 'user')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      return { success: true, message: 'Notes retrieved', data: data || [] };
    } catch (error) {
      console.error('Error getting notes:', error);
      return { success: false, message: 'Failed to get notes' };
    }
  }

  // ===========================================
  // BULK ACTIONS
  // ===========================================
  
  /**
   * Bulk update item status
   */
  static async bulkUpdateStatus(itemIds: string[], status: string): Promise<ActionResult> {
    try {
      const { error } = await supabase
        .from('lats_purchase_order_items')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .in('id', itemIds);

      if (error) throw error;
      
      return { success: true, message: `Updated ${itemIds.length} items` };
    } catch (error) {
      console.error('Error bulk updating status:', error);
      return { success: false, message: 'Failed to update items' };
    }
  }

  /**
   * Bulk assign location
   */
  static async bulkAssignLocation(itemIds: string[], location: string): Promise<ActionResult> {
    try {
      const { error } = await supabase
        .from('lats_purchase_order_items')
        .update({ 
          location: location,
          updated_at: new Date().toISOString()
        })
        .in('id', itemIds);

      if (error) throw error;
      
      return { success: true, message: `Assigned ${itemIds.length} items to ${location}` };
    } catch (error) {
      console.error('Error bulk assigning location:', error);
      return { success: false, message: 'Failed to assign location' };
    }
  }

  // ===========================================
  // RETURN ORDER ACTIONS
  // ===========================================
  
  /**
   * Create return order
   */
  static async createReturnOrder(orderId: string, returnData: ReturnOrderData): Promise<ActionResult> {
    try {
      // Create return order record
      const { data: returnOrder, error: createError } = await supabase
        .from('purchase_order_returns')
        .insert({
          purchase_order_id: orderId,
          reason: returnData.reason,
          return_type: returnData.returnType,
          notes: returnData.notes || null,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      // Create return order items
      const returnItems = returnData.items.map(item => ({
        return_order_id: returnOrder.id,
        item_id: item.itemId,
        quantity: item.quantity,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_return_items')
        .insert(returnItems);

      if (itemsError) throw itemsError;

      return { success: true, message: 'Return order created successfully', data: returnOrder };
    } catch (error) {
      console.error('Error creating return order:', error);
      return { success: false, message: 'Failed to create return order' };
    }
  }

  // ===========================================
  // AUDIT LOGGING
  // ===========================================
  
  /**
   * Log action for audit trail
   */
  static async logAction(orderId: string, action: string, details: any): Promise<void> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.warn('No authenticated user found for audit logging:', userError);
        return;
      }

      await supabase
        .from('purchase_order_audit')
        .insert({
          purchase_order_id: orderId,
          action: action,
          details: details,
          user_id: user.id,
          created_by: user.id,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't throw error to avoid breaking the main action
    }
  }
}

export default PurchaseOrderActionsService;
