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

  // Payment functions
  static async getPayments(purchaseOrderId: string): Promise<PurchaseOrderPayment[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_order_payments')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      
      // Map database fields to TypeScript interface
      return (data || []).map((payment: any) => ({
        id: payment.id,
        purchaseOrderId: payment.purchase_order_id,
        method: payment.payment_method,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        reference: payment.reference,
        timestamp: payment.payment_date
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
          "user": audit.user,
          details: audit.details,
          timestamp: new Date().toISOString()
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
          updated_at: new Date().toISOString(),
          ...additionalData
        })
        .eq('id', purchaseOrderId);

      if (error) throw error;

      // Add audit entry
      await this.addAuditEntry({
        purchaseOrderId,
        action: `Status changed to ${status}`,
        user: userId,
        details: `Order status updated to ${status}`
      });

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // Enhanced partial receive functions
  static async updateReceivedQuantities(
    purchaseOrderId: string,
    receivedItems: Array<{ id: string; receivedQuantity: number }>,
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
