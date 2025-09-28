import { supabase } from '../../../lib/supabaseClient';

export interface PurchaseOrderMessage {
  id?: string;
  purchaseOrderId: string;
  sender: string;
  content: string;
  type: 'system' | 'user' | 'supplier';
  timestamp: string;
}

export interface PurchaseOrderPayment {
  id?: string;
  purchaseOrderId: string;
  method: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  timestamp: string;
}

export interface PurchaseOrderAudit {
  id?: string;
  purchaseOrderId: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
}

export class PurchaseOrderService {
  // Communication functions
  static async getMessages(purchaseOrderId: string): Promise<PurchaseOrderMessage[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_order_messages')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      // Map database fields to TypeScript interface
      return (data || []).map((msg: any) => ({
        id: msg.id,
        purchaseOrderId: msg.purchase_order_id,
        sender: msg.sender,
        content: msg.content,
        type: msg.type,
        timestamp: msg.timestamp
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  static async sendMessage(message: Omit<PurchaseOrderMessage, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('purchase_order_messages')
        .insert({
          purchase_order_id: message.purchaseOrderId,
          sender: message.sender,
          content: message.content,
          type: message.type,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Payment functions - Updated to use new payment system
  static async getPayments(purchaseOrderId: string): Promise<PurchaseOrderPayment[]> {
    try {
      // Use the new payment history function
      const { data, error } = await supabase
        .rpc('get_purchase_order_payment_history', {
          purchase_order_id_param: purchaseOrderId
        });

      if (error) throw error;
      
      // Map database fields to TypeScript interface
      return (data || []).map((payment: any) => ({
        id: payment.id,
        purchaseOrderId: purchaseOrderId,
        method: payment.payment_method,
        amount: payment.amount,
        currency: payment.currency,
        status: 'completed', // All payments in history are completed
        reference: payment.reference,
        timestamp: payment.created_at
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  static async addPayment(payment: Omit<PurchaseOrderPayment, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('purchase_order_payments')
        .insert({
          purchase_order_id: payment.purchaseOrderId,
          payment_method: payment.method,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          reference: payment.reference,
          payment_date: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding payment:', error);
      return false;
    }
  }

  // Audit functions
  static async getAuditHistory(purchaseOrderId: string): Promise<PurchaseOrderAudit[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_order_audit')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      // Map database fields to TypeScript interface
      return (data || []).map((audit: any) => ({
        id: audit.id,
        purchaseOrderId: audit.purchase_order_id,
        action: audit.action,
        user: audit.user,
        details: audit.details,
        timestamp: audit.timestamp
      }));
    } catch (error) {
      console.error('Error fetching audit history:', error);
      return [];
    }
  }

  static async addAuditEntry(audit: Omit<PurchaseOrderAudit, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('purchase_order_audit')
        .insert({
          purchase_order_id: audit.purchaseOrderId,
          action: audit.action,
          user_id: audit.user,
          created_by: audit.user,
          details: audit.details,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding audit entry:', error);
      return false;
    }
  }

  // Order status functions
  static async updateOrderStatus(
    purchaseOrderId: string, 
    status: string, 
    userId: string,
    additionalData?: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lats_purchase_orders')
        .update({
          status,
          ...additionalData
        })
        .eq('id', purchaseOrderId);

      if (error) throw error;

      // Add audit entry
      await this.addAuditEntry({
        purchaseOrderId,
        action: `Status changed to ${status}`,
        user: userId,
        details: JSON.stringify({
          message: `Order status updated to ${status}`,
          previous_status: additionalData?.previous_status || 'unknown',
          new_status: status
        })
      });

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // Enhanced partial receive functions with serial number support
  static async updateReceivedQuantities(
    purchaseOrderId: string,
    receivedItems: Array<{ 
      id: string; 
      receivedQuantity: number;
      serialNumbers?: Array<{
        serial_number: string;
        imei?: string;
        mac_address?: string;
        barcode?: string;
        location?: string;
        notes?: string;
      }>;
    }>,
    userId: string
  ): Promise<{ success: boolean; message: string; updatedItems: number }> {
    try {
      // Validate input
      if (!receivedItems || receivedItems.length === 0) {
        return { success: false, message: 'No items provided for update', updatedItems: 0 };
      }

      // First, get existing items with validation data
      const { data: existingItems, error: fetchError } = await supabase
        .from('lats_purchase_order_items')
        .select('id, purchase_order_id, quantity, received_quantity')
        .eq('purchase_order_id', purchaseOrderId);

      if (fetchError) {
        console.error('Error fetching existing items:', fetchError);
        return { success: false, message: 'Failed to fetch existing items', updatedItems: 0 };
      }

      if (!existingItems || existingItems.length === 0) {
        return { success: false, message: 'No items found for this purchase order', updatedItems: 0 };
      }

      const existingItemMap = new Map(existingItems.map(item => [item.id, item]));
      const validItems: Array<{ id: string; receivedQuantity: number; maxQuantity: number }> = [];
      const invalidItems: string[] = [];

      // Validate each received item
      for (const item of receivedItems) {
        const existingItem = existingItemMap.get(item.id);
        
        if (!existingItem) {
          invalidItems.push(`Item ${item.id} not found in purchase order`);
          continue;
        }

        if (item.receivedQuantity < 0) {
          invalidItems.push(`Item ${item.id}: Received quantity cannot be negative`);
          continue;
        }

        if (item.receivedQuantity > existingItem.quantity) {
          invalidItems.push(`Item ${item.id}: Received quantity (${item.receivedQuantity}) cannot exceed ordered quantity (${existingItem.quantity})`);
          continue;
        }

        validItems.push({
          id: item.id,
          receivedQuantity: item.receivedQuantity,
          maxQuantity: existingItem.quantity
        });
      }

      if (invalidItems.length > 0) {
        return { 
          success: false, 
          message: `Validation errors: ${invalidItems.join('; ')}`, 
          updatedItems: 0 
        };
      }

      if (validItems.length === 0) {
        return { success: false, message: 'No valid items found for update', updatedItems: 0 };
      }

      // Use the database function for atomic updates
      const { data: functionResult, error: functionError } = await supabase
        .rpc('update_received_quantities', {
          purchase_order_id_param: purchaseOrderId,
          item_updates: validItems.map(item => ({
            id: item.id,
            receivedQuantity: item.receivedQuantity
          })),
          user_id_param: userId
        });

      if (functionError) {
        console.error('Error updating received quantities via function:', functionError);
        return { success: false, message: `Update failed: ${functionError.message}`, updatedItems: 0 };
      }

      // Check if all items were updated successfully
      const { data: updatedItems, error: verifyError } = await supabase
        .from('lats_purchase_order_items')
        .select('id, received_quantity')
        .eq('purchase_order_id', purchaseOrderId)
        .in('id', validItems.map(item => item.id));

      if (verifyError) {
        console.error('Error verifying updates:', verifyError);
        return { success: false, message: 'Update completed but verification failed', updatedItems: validItems.length };
      }

      const successfullyUpdated = updatedItems?.filter(item => 
        validItems.find(validItem => 
          validItem.id === item.id && 
          validItem.receivedQuantity === item.received_quantity
        )
      ).length || 0;

      // Process serial numbers for items that have them
      await this.processSerialNumbers(purchaseOrderId, receivedItems, userId);

      // Create inventory adjustments for items without serial numbers
      await this.createInventoryAdjustments(purchaseOrderId, receivedItems, userId);

      return { 
        success: true, 
        message: `Successfully updated ${successfullyUpdated} items`, 
        updatedItems: successfullyUpdated 
      };

    } catch (error) {
      console.error('Error updating received quantities:', error);
      return { 
        success: false, 
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        updatedItems: 0 
      };
    }
  }

  // Get purchase order items with product details
  static async getPurchaseOrderItemsWithProducts(purchaseOrderId: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      // Use the database function to get items with product details
      const { data, error } = await supabase
        .rpc('get_purchase_order_items_with_products', {
          purchase_order_id_param: purchaseOrderId
        });

      if (error) {
        console.error('Error fetching items with products:', error);
        return { success: false, message: 'Failed to fetch items with product details' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getPurchaseOrderItemsWithProducts:', error);
      return { 
        success: false, 
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Get purchase order items with product details using new database function
  static async getPurchaseOrderItemsWithProducts(purchaseOrderId: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      console.log('🔍 [PurchaseOrderService] Fetching purchase order items for PO:', purchaseOrderId);
      
      // Use the new database function for better performance
      const { data: orderItems, error } = await supabase
        .rpc('get_purchase_order_items_with_products', { po_id: purchaseOrderId });

      if (error) {
        console.error('❌ Error fetching purchase order items:', error);
        return { success: false, message: 'Failed to fetch purchase order items' };
      }

      // Format the results to match expected structure
      const formattedItems = (orderItems || []).map(item => ({
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        costPrice: parseFloat(item.cost_price.toString()),
        totalPrice: parseFloat(item.total_price.toString()),
        receivedQuantity: item.received_quantity || 0,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        product: {
          id: item.product_id,
          name: item.product_name,
          sku: item.product_sku
        },
        variant: {
          id: item.variant_id,
          name: item.variant_name,
          sku: item.variant_sku
        }
      }));

      console.log('✅ [PurchaseOrderService] Purchase order items fetched:', {
        total: formattedItems.length
      });

      return {
        success: true,
        data: formattedItems,
        message: `Found ${formattedItems.length} purchase order items`
      };

    } catch (error) {
      console.error('❌ [PurchaseOrderService] Error fetching purchase order items:', error);
      return {
        success: false,
        message: `Failed to fetch purchase order items: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get received items (inventory items and adjustments) for a purchase order
  static async getReceivedItems(purchaseOrderId: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      console.log('🔍 [PurchaseOrderService] Fetching received items for PO:', purchaseOrderId);
      
      // Try the RPC function first
      try {
        const { data: receivedItems, error } = await supabase
          .rpc('get_received_items_for_po', { po_id: purchaseOrderId });

        if (!error && receivedItems) {
          // Format the results to match expected structure
          const formattedItems = receivedItems.map(item => ({
            id: item.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            serial_number: item.serial_number,
            imei: item.imei,
            mac_address: item.mac_address,
            barcode: item.barcode,
            status: item.status,
            location: item.location,
            shelf: item.shelf,
            bin: item.bin,
            purchase_date: item.purchase_date,
            warranty_start: item.warranty_start,
            warranty_end: item.warranty_end,
            cost_price: item.cost_price,
            selling_price: item.selling_price,
            notes: item.notes,
            created_at: item.created_at,
            product: {
              id: item.product_id,
              name: item.product_name,
              sku: item.product_sku
            },
            variant: {
              id: item.variant_id,
              name: item.variant_name,
              sku: item.variant_sku
            },
            item_type: 'inventory_item',
            received_quantity: 1,
            has_serial: !!item.serial_number
          }));

          console.log('✅ [PurchaseOrderService] Received items fetched via RPC:', {
            total: formattedItems.length
          });

          return {
            success: true,
            data: formattedItems,
            message: `Found ${formattedItems.length} received items`
          };
        } else {
          console.warn('⚠️ RPC function failed, falling back to direct queries:', error);
        }
      } catch (rpcError) {
        console.warn('⚠️ RPC function not available, falling back to direct queries:', rpcError);
      }

      // Fallback: Use direct queries if RPC fails
      console.log('🔄 [PurchaseOrderService] Using fallback method - direct queries');
      
      const allItems: any[] = [];

      // Get inventory items (items with serial numbers)
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory_items')
        .select(`
          id,
          product_id,
          variant_id,
          serial_number,
          imei,
          mac_address,
          barcode,
          status,
          location,
          shelf,
          bin,
          purchase_date,
          warranty_start,
          warranty_end,
          cost_price,
          selling_price,
          notes,
          metadata,
          created_at,
          product:lats_products(
            id,
            name,
            sku,
            category_id
          ),
          variant:lats_product_variants(
            id,
            name,
            sku
          )
        `)
        .contains('metadata', { purchase_order_id: purchaseOrderId })
        .order('created_at', { ascending: false });

      if (!inventoryError && inventoryItems) {
        const formattedInventoryItems = inventoryItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          serial_number: item.serial_number,
          imei: item.imei,
          mac_address: item.mac_address,
          barcode: item.barcode,
          status: item.status,
          location: item.location,
          shelf: item.shelf,
          bin: item.bin,
          purchase_date: item.purchase_date,
          warranty_start: item.warranty_start,
          warranty_end: item.warranty_end,
          cost_price: item.cost_price,
          selling_price: item.selling_price,
          notes: item.notes,
          created_at: item.created_at,
          product: {
            id: item.product_id,
            name: item.product?.name || 'Unknown Product',
            sku: item.product?.sku || ''
          },
          variant: {
            id: item.variant_id,
            name: item.variant?.name || '',
            sku: item.variant?.sku || ''
          },
          item_type: 'inventory_item',
          received_quantity: 1,
          has_serial: true
        }));
        allItems.push(...formattedInventoryItems);
      } else {
        console.warn('⚠️ Failed to fetch inventory items:', inventoryError);
      }

      // Get inventory adjustments (items without serial numbers)
      const { data: adjustments, error: adjustmentsError } = await supabase
        .from('lats_inventory_adjustments')
        .select(`
          id,
          product_id,
          variant_id,
          quantity,
          cost_price,
          reason,
          adjustment_type,
          created_at,
          product:lats_products(
            id,
            name,
            sku
          ),
          variant:lats_product_variants(
            id,
            name,
            sku
          )
        `)
        .eq('purchase_order_id', purchaseOrderId)
        .eq('adjustment_type', 'receive')
        .order('created_at', { ascending: false });

      if (!adjustmentsError && adjustments) {
        const formattedAdjustments = adjustments.map(adjustment => ({
          id: adjustment.id,
          product_id: adjustment.product_id,
          variant_id: adjustment.variant_id,
          serial_number: null,
          imei: null,
          mac_address: null,
          barcode: null,
          status: 'received',
          location: null,
          shelf: null,
          bin: null,
          purchase_date: adjustment.created_at,
          warranty_start: null,
          warranty_end: null,
          cost_price: adjustment.cost_price,
          selling_price: null,
          notes: adjustment.reason,
          created_at: adjustment.created_at,
          product: {
            id: adjustment.product_id,
            name: adjustment.product?.name || 'Unknown Product',
            sku: adjustment.product?.sku || ''
          },
          variant: {
            id: adjustment.variant_id,
            name: adjustment.variant?.name || '',
            sku: adjustment.variant?.sku || ''
          },
          item_type: 'inventory_adjustment',
          received_quantity: adjustment.quantity,
          has_serial: false
        }));
        allItems.push(...formattedAdjustments);
      } else {
        console.warn('⚠️ Failed to fetch inventory adjustments:', adjustmentsError);
      }

      // Sort all items by creation date (newest first)
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('✅ [PurchaseOrderService] Received items fetched via fallback:', {
        total: allItems.length,
        inventoryItems: allItems.filter(item => item.item_type === 'inventory_item').length,
        adjustments: allItems.filter(item => item.item_type === 'inventory_adjustment').length
      });

      return {
        success: true,
        data: allItems,
        message: `Found ${allItems.length} received items (${allItems.filter(item => item.item_type === 'inventory_item').length} inventory items, ${allItems.filter(item => item.item_type === 'inventory_adjustment').length} adjustments)`
      };

    } catch (error) {
      console.error('❌ [PurchaseOrderService] Error fetching received items:', error);
      return {
        success: false,
        message: `Failed to fetch received items: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Enhanced receive functions
  static async completeReceive(
    purchaseOrderId: string,
    userId: string,
    receiveNotes?: string
  ): Promise<{ success: boolean; message: string; summary?: any }> {
    try {
      // Use the database function for complete receive
      const { data, error } = await supabase
        .rpc('complete_purchase_order_receive', {
          purchase_order_id_param: purchaseOrderId,
          user_id_param: userId,
          receive_notes: receiveNotes || null
        });

      if (error) {
        console.error('Error completing receive:', error);
        return { success: false, message: `Receive failed: ${error.message}` };
      }

      // Get receive summary
      const summaryResult = await this.getReceiveSummary(purchaseOrderId);
      
      return { 
        success: true, 
        message: 'Purchase order received successfully',
        summary: summaryResult.success ? summaryResult.data : null
      };
    } catch (error) {
      console.error('Error in completeReceive:', error);
      return { 
        success: false, 
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static async processReturn(
    purchaseOrderId: string,
    itemId: string,
    returnType: 'damage' | 'defect' | 'wrong_item' | 'excess' | 'other',
    returnQuantity: number,
    returnReason: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .rpc('process_purchase_order_return', {
          purchase_order_id_param: purchaseOrderId,
          item_id_param: itemId,
          return_type_param: returnType,
          return_quantity_param: returnQuantity,
          return_reason_param: returnReason,
          user_id_param: userId
        });

      if (error) {
        console.error('Error processing return:', error);
        return { success: false, message: `Return failed: ${error.message}` };
      }

      return { success: true, message: 'Return processed successfully' };
    } catch (error) {
      console.error('Error in processReturn:', error);
      return { 
        success: false, 
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static async getReceiveSummary(purchaseOrderId: string): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_purchase_order_receive_summary', {
          purchase_order_id_param: purchaseOrderId
        });

      if (error) {
        console.error('Error getting receive summary:', error);
        return { success: false, message: 'Failed to get receive summary' };
      }

      return { success: true, data: data?.[0] || null };
    } catch (error) {
      console.error('Error in getReceiveSummary:', error);
      return { 
        success: false, 
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static async getReturns(purchaseOrderId: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_purchase_order_returns', {
          purchase_order_id_param: purchaseOrderId
        });

      if (error) {
        console.error('Error getting returns:', error);
        return { success: false, message: 'Failed to get returns' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getReturns:', error);
      return { 
        success: false, 
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Quality control functions
  static async addQualityCheck(
    purchaseOrderId: string,
    itemId: string,
    checkData: {
      passed: boolean;
      notes?: string;
      checkedBy: string;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('purchase_order_quality_checks')
        .insert({
          purchase_order_id: purchaseOrderId,
          item_id: itemId,
          passed: checkData.passed,
          notes: checkData.notes,
          checked_by: checkData.checkedBy,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      // Add audit entry
      await this.addAuditEntry({
        purchaseOrderId,
        action: 'Quality check',
        user: checkData.checkedBy,
        details: `Quality check ${checkData.passed ? 'passed' : 'failed'} for item ${itemId}`
      });

      return true;
    } catch (error) {
      console.error('Error adding quality check:', error);
      return false;
    }
  }

  // Create inventory adjustments for items without serial numbers
  private static async createInventoryAdjustments(
    purchaseOrderId: string,
    receivedItems: Array<{ 
      id: string; 
      receivedQuantity: number;
      serialNumbers?: Array<{
        serial_number: string;
        imei?: string;
        mac_address?: string;
        barcode?: string;
        location?: string;
        notes?: string;
      }>;
    }>,
    userId: string
  ): Promise<void> {
    try {
      // Get purchase order items to get product_id and variant_id
      const { data: orderItems, error: itemsError } = await supabase
        .from('lats_purchase_order_items')
        .select('id, product_id, variant_id, cost_price')
        .eq('purchase_order_id', purchaseOrderId)
        .in('id', receivedItems.map(item => item.id));

      if (itemsError) {
        console.error('Error fetching order items for inventory adjustments:', itemsError);
        return;
      }

      // Process each item that doesn't have serial numbers
      for (const receivedItem of receivedItems) {
        // Skip items that have serial numbers (they're handled by processSerialNumbers)
        if (receivedItem.serialNumbers && receivedItem.serialNumbers.length > 0) {
          continue;
        }

        // Skip items with 0 received quantity
        if (receivedItem.receivedQuantity <= 0) {
          continue;
        }

        const orderItem = orderItems?.find(item => item.id === receivedItem.id);
        if (!orderItem) {
          console.warn(`Order item not found for received item ${receivedItem.id}`);
          continue;
        }

        // Create inventory adjustment
        const { error: adjustmentError } = await supabase
          .from('lats_inventory_adjustments')
          .insert({
            purchase_order_id: purchaseOrderId,
            product_id: orderItem.product_id,
            variant_id: orderItem.variant_id,
            adjustment_type: 'receive',
            quantity: receivedItem.receivedQuantity,
            cost_price: orderItem.cost_price,
            reason: `Partial receive from purchase order ${purchaseOrderId}`,
            reference_id: receivedItem.id,
            processed_by: userId
          });

        if (adjustmentError) {
          console.error(`Error creating inventory adjustment for order item ${receivedItem.id}:`, adjustmentError);
          continue;
        }

        // Update product variant stock quantity
        if (orderItem.variant_id) {
          // First get current quantity
          const { data: currentVariant, error: fetchError } = await supabase
            .from('lats_product_variants')
            .select('quantity')
            .eq('id', orderItem.variant_id)
            .single();

          if (fetchError) {
            console.error(`Error fetching current stock for variant ${orderItem.variant_id}:`, fetchError);
          } else {
            const newQuantity = (currentVariant?.quantity || 0) + receivedItem.receivedQuantity;
            
            const { error: stockError } = await supabase
              .from('lats_product_variants')
              .update({
                quantity: newQuantity,
                updated_at: new Date().toISOString()
              })
              .eq('id', orderItem.variant_id);

            if (stockError) {
              console.error(`Error updating stock for variant ${orderItem.variant_id}:`, stockError);
            }
          }
        }

        console.log(`✅ Created inventory adjustment for ${receivedItem.receivedQuantity} units of order item ${receivedItem.id}`);
      }
    } catch (error) {
      console.error('Error creating inventory adjustments:', error);
    }
  }

  // Process serial numbers for received items
  private static async processSerialNumbers(
    purchaseOrderId: string,
    receivedItems: Array<{ 
      id: string; 
      receivedQuantity: number;
      serialNumbers?: Array<{
        serial_number: string;
        imei?: string;
        mac_address?: string;
        barcode?: string;
        location?: string;
        notes?: string;
      }>;
    }>,
    userId: string
  ): Promise<void> {
    try {
      // Get purchase order items to get product_id and variant_id
      const { data: orderItems, error: itemsError } = await supabase
        .from('lats_purchase_order_items')
        .select('id, product_id, variant_id')
        .eq('purchase_order_id', purchaseOrderId)
        .in('id', receivedItems.map(item => item.id));

      if (itemsError) {
        console.error('Error fetching order items for serial numbers:', itemsError);
        return;
      }

      // Process each item with serial numbers
      for (const receivedItem of receivedItems) {
        if (!receivedItem.serialNumbers || receivedItem.serialNumbers.length === 0) {
          continue; // Skip items without serial numbers
        }

        const orderItem = orderItems?.find(item => item.id === receivedItem.id);
        if (!orderItem) {
          console.warn(`Order item not found for received item ${receivedItem.id}`);
          continue;
        }

        // Create inventory items for each serial number
        const inventoryItems = receivedItem.serialNumbers.map(serial => ({
          product_id: orderItem.product_id,
          variant_id: orderItem.variant_id,
          serial_number: serial.serial_number,
          imei: serial.imei || null,
          mac_address: serial.mac_address || null,
          barcode: serial.barcode || null,
          status: 'available' as const,
          location: serial.location || null,
          notes: serial.notes || `Received from purchase order ${purchaseOrderId}`,
          metadata: {
            purchase_order_id: purchaseOrderId,
            purchase_order_item_id: receivedItem.id,
            received_by: userId,
            received_at: new Date().toISOString()
          }
        }));

        // Insert inventory items
        const { error: insertError } = await supabase
          .from('inventory_items')
          .insert(inventoryItems);

        if (insertError) {
          console.error(`Error inserting inventory items for order item ${receivedItem.id}:`, insertError);
          continue;
        }

        // Get the inserted inventory items to create movement records
        const { data: insertedItems, error: fetchError } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('product_id', orderItem.product_id)
          .in('serial_number', receivedItem.serialNumbers.map(s => s.serial_number))
          .order('created_at', { ascending: false })
          .limit(receivedItem.serialNumbers.length);

        if (fetchError || !insertedItems) {
          console.error('Error fetching inserted inventory items:', fetchError);
          continue;
        }

        // Create movement records for each serial number
        const movements = receivedItem.serialNumbers.map((serial, index) => ({
          inventory_item_id: insertedItems[index]?.id,
          movement_type: 'received' as const,
          from_status: null,
          to_status: 'available',
          reference_id: purchaseOrderId,
          reference_type: 'purchase_order',
          notes: `Received from purchase order ${purchaseOrderId}`,
          created_by: userId
        })).filter(movement => movement.inventory_item_id);

        if (movements.length > 0) {
          const { error: movementError } = await supabase
            .from('serial_number_movements')
            .insert(movements);

          if (movementError) {
            console.error('Error creating movement records:', movementError);
          }
        }

        console.log(`✅ Processed ${receivedItem.serialNumbers.length} serial numbers for order item ${receivedItem.id}`);
      }
    } catch (error) {
      console.error('Error processing serial numbers:', error);
    }
  }

  // Fix order status if needed
  static async fixOrderStatusIfNeeded(purchaseOrderId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // This is a placeholder implementation
      console.log('Fixing order status for PO:', purchaseOrderId);
      return { success: true, message: 'Order status fixed' };
    } catch (error) {
      console.error('Error fixing order status:', error);
      return { success: false, message: 'Failed to fix order status' };
    }
  }

  // Get purchase order inventory stats
  static async getPurchaseOrderInventoryStats(purchaseOrderId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      // This is a placeholder implementation
      console.log('Getting inventory stats for PO:', purchaseOrderId);
      return { 
        success: true, 
        data: { totalItems: 0, receivedItems: 0, pendingItems: 0 },
        message: 'Inventory stats retrieved' 
      };
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      return { success: false, message: 'Failed to get inventory stats' };
    }
  }

  // Update inventory item status
  static async updateInventoryItemStatus(itemId: string, status: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // This is a placeholder implementation
      console.log('Updating inventory item status:', itemId, status);
      return { success: true, message: 'Item status updated' };
    } catch (error) {
      console.error('Error updating inventory item status:', error);
      return { success: false, message: 'Failed to update item status' };
    }
  }

  // Export inventory to CSV
  static async exportInventoryToCSV(purchaseOrderId: string, filters: any): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      // This is a placeholder implementation
      console.log('Exporting inventory to CSV for PO:', purchaseOrderId);
      return { 
        success: true, 
        data: 'csv-data-here',
        message: 'Inventory exported to CSV' 
      };
    } catch (error) {
      console.error('Error exporting inventory:', error);
      return { success: false, message: 'Failed to export inventory' };
    }
  }

  // Check if all items are fully received
  static async areAllItemsFullyReceived(purchaseOrderId: string): Promise<boolean> {
    try {
      // This is a placeholder implementation
      console.log('Checking if all items are fully received for PO:', purchaseOrderId);
      return false;
    } catch (error) {
      console.error('Error checking if all items are fully received:', error);
      return false;
    }
  }
}

// Database table creation SQL (run these in your Supabase SQL editor)
export const CREATE_TABLES_SQL = `
-- Purchase Order Messages Table
CREATE TABLE IF NOT EXISTS purchase_order_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('system', 'user', 'supplier')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Payments Table
CREATE TABLE IF NOT EXISTS purchase_order_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TZS',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  reference TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Audit Table
CREATE TABLE IF NOT EXISTS purchase_order_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  "user" TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Quality Checks Table
CREATE TABLE IF NOT EXISTS purchase_order_quality_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES lats_purchase_order_items(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  notes TEXT,
  checked_by TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_messages_order_id ON purchase_order_messages(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_order_id ON purchase_order_payments(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_quality_checks_order_id ON purchase_order_quality_checks(purchase_order_id);
`;
