import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';

export interface SaleItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice: number;
  profit: number;
}

export interface SaleData {
  id: string;
  saleNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: {
    type: string;
    details: any;
    amount: number;
  };
  paymentStatus: 'pending' | 'completed' | 'failed';
  soldBy: string;
  soldAt: string;
  createdAt: string;
  notes?: string;
}

export interface ProcessSaleResult {
  success: boolean;
  saleId?: string;
  error?: string;
  sale?: SaleData;
}

class SaleProcessingService {
  // Process a complete sale with all necessary operations
  async processSale(saleData: Omit<SaleData, 'id' | 'saleNumber' | 'createdAt'>): Promise<ProcessSaleResult> {
    try {
      console.log('🔄 Processing sale...', { itemCount: saleData.items.length, total: saleData.total });

      // 1. Validate stock availability
      const stockValidation = await this.validateStock(saleData.items);
      if (!stockValidation.success) {
        return { success: false, error: stockValidation.error };
      }

      // 2. Calculate costs and profits
      const itemsWithCosts = await this.calculateCostsAndProfits(saleData.items);
      
      // 3. Save sale to database
      const saleResult = await this.saveSaleToDatabase({
        ...saleData,
        items: itemsWithCosts
      });

      if (!saleResult.success) {
        return { success: false, error: saleResult.error };
      }

      // 4. Update inventory
      const inventoryResult = await this.updateInventory(saleData.items);
      if (!inventoryResult.success) {
        console.warn('⚠️ Sale saved but inventory update failed:', inventoryResult.error);
        // Don't fail the sale if inventory update fails, but log it
      }

      // 5. Generate receipt
      const receiptResult = await this.generateReceipt(saleResult.sale!);
      if (!receiptResult.success) {
        console.warn('⚠️ Receipt generation failed:', receiptResult.error);
      }

      // 6. Send notifications (optional)
      await this.sendNotifications(saleResult.sale!);

      console.log('✅ Sale processed successfully:', saleResult.saleId);
      toast.success('Sale completed successfully!');

      return {
        success: true,
        saleId: saleResult.saleId,
        sale: saleResult.sale
      };

    } catch (error) {
      console.error('❌ Error processing sale:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Validate stock availability for all items
  private async validateStock(items: SaleItem[]): Promise<{ success: boolean; error?: string }> {
    try {
      for (const item of items) {
        const { data: variant, error } = await supabase
          .from('lats_product_variants')
          .select('quantity')
          .eq('id', item.variantId)
          .single();

        if (error) {
          console.error('❌ Error checking stock for variant:', item.variantId, error);
          return { success: false, error: `Failed to check stock for ${item.productName}` };
        }

        if (!variant || variant.quantity < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${item.productName} (${item.variantName}). Available: ${variant?.quantity || 0}, Requested: ${item.quantity}`
          };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error validating stock:', error);
      return { success: false, error: 'Failed to validate stock availability' };
    }
  }

  // Calculate costs and profits for all items
  private async calculateCostsAndProfits(items: SaleItem[]): Promise<SaleItem[]> {
    try {
      const itemsWithCosts = await Promise.all(
        items.map(async (item) => {
          // Get cost price from variant
          const { data: variant, error } = await supabase
            .from('lats_product_variants')
            .select('cost_price')
            .eq('id', item.variantId)
            .single();

          if (error) {
            console.warn('⚠️ Could not get cost price for variant:', item.variantId, error);
          }

          const costPrice = variant?.cost_price || 0;
          const totalCost = costPrice * item.quantity;
          const profit = item.totalPrice - totalCost;

          return {
            ...item,
            costPrice,
            profit
          };
        })
      );

      return itemsWithCosts;
    } catch (error) {
      console.error('❌ Error calculating costs:', error);
      // Return items with default costs if calculation fails
      return items.map(item => ({
        ...item,
        costPrice: 0,
        profit: item.totalPrice
      }));
    }
  }

  // Save sale to database
  private async saveSaleToDatabase(saleData: SaleData): Promise<{ success: boolean; saleId?: string; sale?: SaleData; error?: string }> {
    try {
      // Generate sale number
      const saleNumber = this.generateSaleNumber();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const soldBy = user?.email || 'system';

      // Create sale record
      const { data: sale, error: saleError } = await supabase
        .from('lats_sales')
        .insert([{
          sale_number: saleNumber,
          customer_id: saleData.customerId || null,
          total_amount: saleData.total,
          payment_method: saleData.paymentMethod.type,
          status: saleData.paymentStatus,
          created_by: user?.id || null,
          notes: saleData.notes || null
        }])
        .select()
        .single();

      if (saleError) {
        console.error('❌ Error creating sale:', saleError);
        return { success: false, error: `Failed to create sale: ${saleError.message}` };
      }

      // Create sale items
      const saleItems = saleData.items.map(item => ({
        sale_id: sale.id,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        price: item.unitPrice,
        total_price: item.totalPrice,
        cost_price: item.costPrice,
        profit: item.profit
      }));

      const { error: itemsError } = await supabase
        .from('lats_sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('❌ Error creating sale items:', itemsError);
        return { success: false, error: `Sale created but items failed: ${itemsError.message}` };
      }

      // Create complete sale object
      const completeSale: SaleData = {
        ...saleData,
        id: sale.id,
        saleNumber,
        soldBy,
        createdAt: sale.created_at
      };

      console.log('✅ Sale saved to database:', sale.id);
      return { success: true, saleId: sale.id, sale: completeSale };

    } catch (error) {
      console.error('❌ Error saving sale to database:', error);
      return { success: false, error: 'Failed to save sale to database' };
    }
  }

  // Update inventory after sale
  private async updateInventory(items: SaleItem[]): Promise<{ success: boolean; error?: string }> {
    try {
      for (const item of items) {
        // Update variant quantity
        const { error: updateError } = await supabase
          .from('lats_product_variants')
          .update({ 
            quantity: supabase.sql`quantity - ${item.quantity}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.variantId);

        if (updateError) {
          console.error('❌ Error updating inventory for variant:', item.variantId, updateError);
          return { success: false, error: `Failed to update inventory for ${item.productName}` };
        }

        // Create stock movement record
        await supabase
          .from('lats_stock_movements')
          .insert([{
            product_id: item.productId,
            variant_id: item.variantId,
            movement_type: 'sale',
            quantity: -item.quantity,
            reference: `Sale ${item.sku}`,
            notes: `Sold ${item.quantity} units of ${item.productName} (${item.variantName})`,
            created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
          }]);
      }

      console.log('✅ Inventory updated successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error updating inventory:', error);
      return { success: false, error: 'Failed to update inventory' };
    }
  }

  // Generate receipt
  private async generateReceipt(sale: SaleData): Promise<{ success: boolean; error?: string }> {
    try {
      // Create receipt record
      const { error: receiptError } = await supabase
        .from('lats_receipts')
        .insert([{
          sale_id: sale.id,
          receipt_number: `RCP-${sale.saleNumber}`,
          customer_name: sale.customerName || 'Walk-in Customer',
          customer_phone: sale.customerPhone || null,
          total_amount: sale.total,
          payment_method: sale.paymentMethod.type,
          items_count: sale.items.length,
          generated_by: sale.soldBy,
          receipt_content: {
            sale: sale,
            generated_at: new Date().toISOString(),
            business_info: {
              name: 'LATS Business',
              address: 'Dar es Salaam, Tanzania',
              phone: '+255 123 456 789',
              email: 'info@lats.com'
            }
          }
        }]);

      if (receiptError) {
        console.error('❌ Error generating receipt:', receiptError);
        return { success: false, error: 'Failed to generate receipt' };
      }

      console.log('✅ Receipt generated successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error generating receipt:', error);
      return { success: false, error: 'Failed to generate receipt' };
    }
  }

  // Send notifications (SMS, email, etc.)
  private async sendNotifications(sale: SaleData): Promise<void> {
    try {
      // Send SMS notification if customer phone is provided
      if (sale.customerPhone) {
        await this.sendSMSNotification(sale);
      }

      // Send email receipt if customer email is provided
      if (sale.customerEmail) {
        await this.sendEmailReceipt(sale);
      }

    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      // Don't fail the sale if notifications fail
    }
  }

  // Send SMS notification
  private async sendSMSNotification(sale: SaleData): Promise<void> {
    try {
      const message = this.generateSMSMessage(sale);
      
      // Use the SMS service from the reports feature
      const { sendBulkSMS } = await import('../features/reports/utils/smsService');
      
      const result = await sendBulkSMS([sale.customerPhone!], message);
      
      if (result.success) {
        console.log('📱 SMS notification sent successfully for sale:', sale.saleNumber);
      } else {
        console.error('❌ Failed to send SMS notification:', result.error);
      }
    } catch (error) {
      console.error('Error sending SMS notification:', error);
    }
  }

  // Generate SMS message
  private generateSMSMessage(sale: SaleData): string {
    const items = sale.items.map(item => `${item.productName} x${item.quantity}`).join(', ');
    const discountText = sale.discount > 0 ? `\nDiscount: ${this.formatMoney(sale.discount)}` : '';
    
    return `Thank you for your purchase!
Sale #${sale.saleNumber}
Items: ${items}
Total: ${this.formatMoney(sale.total)}${discountText}
Payment: ${sale.paymentMethod.type.toUpperCase()}
Thank you for choosing us!`;
  }

  // Send email receipt
  private async sendEmailReceipt(sale: SaleData): Promise<void> {
    try {
      const receiptContent = this.generateEmailReceipt(sale);
      
      // Use the email service
      const { sendEmail } = await import('./emailService');
      
      const result = await sendEmail({
        to: sale.customerEmail!,
        subject: `Receipt for Sale #${sale.saleNumber}`,
        html: receiptContent
      });
      
      if (result.success) {
        console.log('📧 Email receipt sent successfully for sale:', sale.saleNumber);
      } else {
        console.error('❌ Failed to send email receipt:', result.error);
      }
    } catch (error) {
      console.error('Error sending email receipt:', error);
    }
  }

  // Generate email receipt
  private generateEmailReceipt(sale: SaleData): string {
    const itemsHtml = sale.items.map(item => `
      <tr>
        <td>${item.productName} - ${item.variantName}</td>
        <td>${item.quantity}</td>
        <td>${this.formatMoney(item.unitPrice)}</td>
        <td>${this.formatMoney(item.totalPrice)}</td>
      </tr>
    `).join('');

    const discountRow = sale.discount > 0 ? `
      <tr>
        <td colspan="3" style="text-align: right; font-weight: bold;">Discount:</td>
        <td>-${this.formatMoney(sale.discount)}</td>
      </tr>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - Sale #${sale.saleNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .total { font-weight: bold; font-size: 1.2em; }
          .footer { margin-top: 30px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>Sales Receipt</h1>
            <p>Sale #${sale.saleNumber}</p>
            <p>Date: ${new Date(sale.soldAt).toLocaleDateString()}</p>
            <p>Time: ${new Date(sale.soldAt).toLocaleTimeString()}</p>
          </div>
          
          <div>
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${sale.customerName}</p>
            ${sale.customerPhone ? `<p><strong>Phone:</strong> ${sale.customerPhone}</p>` : ''}
            ${sale.customerEmail ? `<p><strong>Email:</strong> ${sale.customerEmail}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              ${discountRow}
              <tr>
                <td colspan="3" style="text-align: right; font-weight: bold;">Subtotal:</td>
                <td>${this.formatMoney(sale.subtotal)}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right; font-weight: bold;">Tax:</td>
                <td>${this.formatMoney(sale.tax)}</td>
              </tr>
              <tr class="total">
                <td colspan="3" style="text-align: right;">Total:</td>
                <td>${this.formatMoney(sale.total)}</td>
              </tr>
            </tbody>
          </table>
          
          <div>
            <p><strong>Payment Method:</strong> ${sale.paymentMethod.type.toUpperCase()}</p>
            <p><strong>Sold By:</strong> ${sale.soldBy}</p>
            ${sale.notes ? `<p><strong>Notes:</strong> ${sale.notes}</p>` : ''}
          </div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>For any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Format money helper
  private formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Generate unique sale number
  private generateSaleNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `SALE-${timestamp}-${random}`;
  }

  // Get sale by ID
  async getSaleById(saleId: string): Promise<SaleData | null> {
    try {
      const { data: sale, error } = await supabase
        .from('lats_sales')
        .select(`
          *,
          lats_sale_items (
            *,
            lats_products (name),
            lats_product_variants (name, sku)
          )
        `)
        .eq('id', saleId)
        .single();

      if (error) {
        console.error('❌ Error fetching sale:', error);
        return null;
      }

      return sale;
    } catch (error) {
      console.error('❌ Error fetching sale:', error);
      return null;
    }
  }

  // Get recent sales
  async getRecentSales(limit: number = 10): Promise<SaleData[]> {
    try {
      const { data: sales, error } = await supabase
        .from('lats_sales')
        .select(`
          *,
          lats_sale_items (
            *,
            lats_products (name),
            lats_product_variants (name, sku)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching recent sales:', error);
        return [];
      }

      return sales || [];
    } catch (error) {
      console.error('❌ Error fetching recent sales:', error);
      return [];
    }
  }
}

export const saleProcessingService = new SaleProcessingService();
