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
      return data || [];
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

  // Partial receive functions
  static async updateReceivedQuantities(
    purchaseOrderId: string,
    receivedItems: Array<{ id: string; receivedQuantity: number }>,
    userId: string
  ): Promise<boolean> {
    try {
      // First, verify that all items exist and belong to this purchase order
      const { data: existingItems, error: fetchError } = await supabase
        .from('lats_purchase_order_items')
        .select('id, purchase_order_id')
        .eq('purchase_order_id', purchaseOrderId);

      if (fetchError) {
        console.error('Error fetching existing items:', fetchError);
        return false;
      }

      const existingItemIds = new Set(existingItems?.map(item => item.id) || []);
      const validItems = receivedItems.filter(item => existingItemIds.has(item.id));

      if (validItems.length === 0) {
        console.error('No valid items found for update');
        return false;
      }

      if (validItems.length !== receivedItems.length) {
        console.warn(`Some items not found: ${receivedItems.length - validItems.length} items skipped`);
      }

      // Update each valid item's received quantity
      for (const item of validItems) {
        const { error } = await supabase
          .from('lats_purchase_order_items')
          .update({ 
            received_quantity: item.receivedQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)
          .eq('purchase_order_id', purchaseOrderId); // Extra safety check

        if (error) {
          console.error(`Error updating item ${item.id}:`, error);
          // Continue with other items instead of failing completely
          continue;
        }
      }

      // Add audit entry
      await this.addAuditEntry({
        purchaseOrderId,
        action: 'Partial receive',
        user: userId,
        details: `Received ${validItems.length} items`
      });

      return true;
    } catch (error) {
      console.error('Error updating received quantities:', error);
      return false;
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
  user TEXT NOT NULL,
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
