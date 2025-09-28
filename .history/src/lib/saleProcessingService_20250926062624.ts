import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';
import { emitSaleCompleted, emitStockUpdate } from '../features/lats/lib/data/eventBus';

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
  discountType?: 'fixed' | 'percentage';
  discountValue?: number;
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
      console.log('🔍 Sale data received:', JSON.stringify(saleData, null, 2));

      // Validate customer information - customer selection is required
      if (!saleData.customerId) {
        return { success: false, error: 'Please select a customer before creating a sale' };
      }
      
      const finalCustomerId = saleData.customerId;

      // 1. Combined stock validation and cost calculation (ultra-optimized)
      const { stockValidation, itemsWithCosts } = await this.validateStockAndCalculateCosts(saleData.items);

      if (!stockValidation.success) {
        return { success: false, error: stockValidation.error };
      }
      
      // 3. Save sale to database
      const saleResult = await this.saveSaleToDatabase({
        ...saleData,
        items: itemsWithCosts
      });

      if (!saleResult.success) {
        return { success: false, error: saleResult.error };
      }

      // 4. Run post-sale operations in parallel (non-critical for transaction completion)
      const [inventoryResult, receiptResult, customerResult] = await Promise.allSettled([
        this.updateInventory(saleData.items),
        this.generateReceipt(saleResult.sale!),
        this.updateCustomerStats(saleData)
      ]);

      // Handle inventory update result
      if (inventoryResult.status === 'rejected') {
        console.warn('⚠️ Sale saved but inventory update failed:', inventoryResult.reason);
      } else if (!inventoryResult.value.success) {
        console.warn('⚠️ Sale saved but inventory update failed:', inventoryResult.value.error);
      }

      // Handle receipt generation result
      if (receiptResult.status === 'rejected') {
        console.warn('⚠️ Receipt generation failed:', receiptResult.reason);
      } else if (!receiptResult.value.success) {
        console.warn('⚠️ Receipt generation failed:', receiptResult.value.error);
      }

      // Handle customer update result
      if (customerResult.status === 'rejected') {
        console.warn('⚠️ Customer stats update failed:', customerResult.reason);
      } else if (!customerResult.value.success) {
        console.warn('⚠️ Customer stats update failed:', customerResult.value.error);
      }

      // 5. Send notifications asynchronously (don't wait for completion)
      this.sendNotifications(saleResult.sale!).catch(error => {
        console.warn('⚠️ Notification sending failed:', error);
      });

      console.log('✅ Sale processed successfully:', saleResult.saleId);
      toast.success('Sale completed successfully!');

      // Emit sale completion event for real-time updates
      emitSaleCompleted(saleResult.sale);

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

  // Combined stock validation and cost calculation (ultra-optimized single query)
  private async validateStockAndCalculateCosts(items: SaleItem[]): Promise<{
    stockValidation: { success: boolean; error?: string };
    itemsWithCosts: SaleItem[];
  }> {
    try {
      const variantIds = items.map(item => item.variantId);
      
      // Single query to get both quantity and cost_price for all variants
      const { data: variants, error } = await supabase
        .from('lats_product_variants')
        .select('id, quantity, cost_price')
        .in('id', variantIds);

      if (error) {
        console.error('❌ Error fetching variant data:', error);
        return {
          stockValidation: { success: false, error: 'Failed to check stock and costs' },
          itemsWithCosts: items.map(item => ({ ...item, costPrice: 0, profit: item.totalPrice }))
        };
      }

      // Create maps for quick lookup
      const variantDataMap = new Map(variants?.map(v => [v.id, v]) || []);

      // Validate stock and calculate costs in single pass
      const itemsWithCosts: SaleItem[] = [];
      
      for (const item of items) {
        const variantData = variantDataMap.get(item.variantId);
        
        if (!variantData) {
          return {
            stockValidation: { success: false, error: `Product variant not found: ${item.productName}` },
            itemsWithCosts: []
          };
        }
        
        if (variantData.quantity < item.quantity) {
          return {
            stockValidation: { 
              success: false, 
              error: `Insufficient stock for ${item.productName} (${item.variantName}). Available: ${variantData.quantity}, Requested: ${item.quantity}` 
            },
            itemsWithCosts: []
          };
        }

        // Calculate costs and profits
        const costPrice = variantData.cost_price || 0;
        const totalCost = costPrice * item.quantity;
        const profit = item.totalPrice - totalCost;

        itemsWithCosts.push({
          ...item,
          costPrice,
          profit
        });
      }

      return {
        stockValidation: { success: true },
        itemsWithCosts
      };
    } catch (error) {
      console.error('❌ Error in combined validation and calculation:', error);
      return {
        stockValidation: { success: false, error: 'Failed to validate stock and calculate costs' },
        itemsWithCosts: items.map(item => ({ ...item, costPrice: 0, profit: item.totalPrice }))
      };
    }
  }

  // Validate stock availability for all items (optimized with single query)
  private async validateStock(items: SaleItem[]): Promise<{ success: boolean; error?: string }> {
    try {
      const variantIds = items.map(item => item.variantId);
      
      // Single query to get all variant quantities
      const { data: variants, error } = await supabase
        .from('lats_product_variants')
        .select('id, quantity')
        .in('id', variantIds);

      if (error) {
        console.error('❌ Error checking stock for variants:', error);
        return { success: false, error: 'Failed to check stock availability' };
      }

      // Create a map for quick lookup
      const variantStockMap = new Map(variants?.map(v => [v.id, v.quantity]) || []);

      // Check stock for each item
      for (const item of items) {
        const availableStock = variantStockMap.get(item.variantId);
        
        if (availableStock === undefined) {
          return { success: false, error: `Product variant not found: ${item.productName}` };
        }
        
        if (availableStock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${item.productName} (${item.variantName}). Available: ${availableStock}, Requested: ${item.quantity}`
          };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error validating stock:', error);
      return { success: false, error: 'Failed to validate stock availability' };
    }
  }

  // Calculate costs and profits for all items (optimized with single query)
  private async calculateCostsAndProfits(items: SaleItem[]): Promise<SaleItem[]> {
    try {
      const variantIds = items.map(item => item.variantId);
      
      // Single query to get all cost prices
      const { data: variants, error } = await supabase
        .from('lats_product_variants')
        .select('id, cost_price')
        .in('id', variantIds);

      if (error) {
        console.warn('⚠️ Could not get cost prices for variants:', error);
        // Return items with default costs if query fails
        return items.map(item => ({
          ...item,
          costPrice: 0,
          profit: item.totalPrice
        }));
      }

      // Create a map for quick lookup
      const costPriceMap = new Map(variants?.map(v => [v.id, v.cost_price || 0]) || []);

      // Calculate costs and profits for each item
      const itemsWithCosts = items.map(item => {
        const costPrice = costPriceMap.get(item.variantId) || 0;
        const totalCost = costPrice * item.quantity;
        const profit = item.totalPrice - totalCost;

        return {
          ...item,
          costPrice,
          profit
        };
      });

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
      
      // Get user name from user metadata or email
      const cashierName = user?.user_metadata?.name || 
                         user?.user_metadata?.full_name || 
                         user?.email?.split('@')[0] || 
                         'System User';

      // Create sale record - matching exact database structure
      const { data: sale, error: saleError } = await supabase
        .from('lats_sales')
        .insert([{
          sale_number: saleNumber,
          customer_id: finalCustomerId, // Customer ID is required - validated above
          total_amount: saleData.total,
          payment_method: JSON.stringify(saleData.paymentMethod),
          status: saleData.paymentStatus || 'completed',
          created_by: cashierName,
          // Add optional columns if they exist
          ...(saleData.subtotal !== undefined && { subtotal: saleData.subtotal }),
          ...(saleData.discount !== undefined && { discount_amount: saleData.discount }),
          ...(saleData.discountType && { discount_type: saleData.discountType }),
          ...(saleData.discountValue !== undefined && { discount_value: saleData.discountValue }),
          ...(saleData.customerName && { customer_name: saleData.customerName }),
          ...(saleData.customerPhone && { customer_phone: saleData.customerPhone }),
          ...(saleData.tax !== undefined && { tax: saleData.tax }),
          ...(saleData.notes && { notes: saleData.notes })
        }])
        .select()
        .single();

      if (saleError) {
        console.error('❌ Error creating sale:', saleError);
        return { success: false, error: `Failed to create sale: ${saleError.message}` };
      }

      // Create sale items - matching exact database structure
      const saleItems = saleData.items.map(item => {
        // Validate UUIDs
        const isValidUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
        
        if (!isValidUUID(item.productId)) {
          console.error('❌ Invalid product_id UUID:', item.productId);
        }
        if (!isValidUUID(item.variantId)) {
          console.error('❌ Invalid variant_id UUID:', item.variantId);
        }
        
        // Debug pricing values
        console.log('🔍 Item pricing debug:', {
          productId: item.productId,
          variantId: item.variantId,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          costPrice: item.costPrice,
          profit: item.profit
        });
        
        return {
          sale_id: sale.id,
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.unitPrice || 0, // Unit price field (matches database schema)
          total_price: item.totalPrice || 0, // Total price field
          cost_price: item.costPrice || 0, // Cost price field
          profit: item.profit || 0 // Profit field
        };
      });

      console.log('🔍 Inserting sale items:', saleItems);

      const { error: itemsError } = await supabase
        .from('lats_sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('❌ Error creating sale items:', itemsError);
        console.error('❌ Sale items data:', saleItems);
        console.error('❌ Sale ID:', sale.id);
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

  // Update customer statistics after sale
  private async updateCustomerStats(saleData: SaleData): Promise<{ success: boolean; error?: string }> {
    try {
      // Only update if customer ID is provided
      if (!saleData.customerId) {
        console.log('ℹ️ No customer ID provided, skipping customer stats update');
        return { success: true };
      }

      console.log('🔄 Updating customer stats for customer:', saleData.customerId);

      // Calculate points earned (1 point per 1000 TZS)
      const pointsEarned = Math.floor(saleData.total / 1000);

      // Update customer record with new stats
      const { error: updateError } = await supabase
        .from('lats_customers')
        .update({
          total_spent: supabase.raw(`total_spent + ${saleData.total}`),
          total_orders: supabase.raw('total_orders + 1'),
          points: supabase.raw(`points + ${pointsEarned}`),
          last_visit: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', saleData.customerId);

      if (updateError) {
        console.error('❌ Error updating customer stats:', updateError);
        return { success: false, error: `Failed to update customer stats: ${updateError.message}` };
      }

      console.log('✅ Customer stats updated successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error updating customer stats:', error);
      return { success: false, error: 'Failed to update customer stats' };
    }
  }

  // Update inventory after sale (optimized with batched operations)
  private async updateInventory(items: SaleItem[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user once for all stock movements
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'system';
      
      // First, get current quantities for all variants
      const variantIds = items.map(item => item.variantId);
      const { data: currentVariants, error: fetchError } = await supabase
        .from('lats_product_variants')
        .select('id, quantity')
        .in('id', variantIds);
      
      if (fetchError) {
        throw new Error(`Failed to fetch current stock: ${fetchError.message}`);
      }

      // Create a map for quick lookup
      const currentStockMap = new Map(currentVariants.map(v => [v.id, v.quantity]));

      // Batch inventory updates and stock movements in parallel
      const updatePromises = items.map(item => {
        const currentQuantity = currentStockMap.get(item.variantId) || 0;
        const newQuantity = Math.max(0, currentQuantity - item.quantity);
        
        // Update with calculated quantity
        return supabase
          .from('lats_product_variants')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.variantId);
      });

      // Prepare all stock movement records for batch insert
      const stockMovements = items.map(item => {
        const currentQuantity = currentStockMap.get(item.variantId) || 0;
        const newQuantity = Math.max(0, currentQuantity - item.quantity);
        
        return {
          product_id: item.productId,
          variant_id: item.variantId,
          type: 'out',
          quantity: item.quantity,
          previous_quantity: currentQuantity,
          new_quantity: newQuantity,
          reason: 'Sale',
          reference: `Sale ${item.sku}`,
          notes: `Sold ${item.quantity} units of ${item.productName} (${item.variantName})`,
          created_by: userId
        };
      });

      // Execute inventory updates in parallel
      const updateResults = await Promise.allSettled(updatePromises);
      
      // Check if any inventory updates failed
      for (let i = 0; i < updateResults.length; i++) {
        const result = updateResults[i];
        if (result.status === 'rejected') {
          console.error('❌ Inventory update failed for item:', items[i], result.reason);
          return { success: false, error: `Failed to update inventory for ${items[i].productName}` };
        }
        if (result.status === 'fulfilled' && result.value.error) {
          console.error('❌ Inventory update error for item:', items[i], result.value.error);
          return { success: false, error: `Failed to update inventory for ${items[i].productName}` };
        }
      }

      // Batch insert all stock movements
      const { error: movementError } = await supabase
        .from('lats_stock_movements')
        .insert(stockMovements);

      if (movementError) {
        console.warn('⚠️ Stock movements creation failed:', movementError);
        // Don't fail the sale if stock movements fail
      }

      console.log('✅ Inventory updated successfully');
      
      // Emit stock updated events for real-time updates
      items.forEach(item => {
        emitStockUpdate(item.productId, item.variantId, item.quantity);
      });
      
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

      // Email service disabled - only SMS notifications are sent
      // if (sale.customerEmail) {
      //   await this.sendEmailReceipt(sale);
      // }

    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      // Don't fail the sale if notifications fail
    }
  }

  // Send SMS notification
  private async sendSMSNotification(sale: SaleData): Promise<void> {
    try {
      const message = this.generateSMSMessage(sale);
      
      // Use the SMS service
      const { sendBulkSMS } = await import('../services/smsService');
      
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

  // Email service disabled - function commented out
  // private async sendEmailReceipt(sale: SaleData): Promise<void> {
  //   try {
  //     const receiptContent = this.generateEmailReceipt(sale);
  //     
  //     // Use the email service  
  //     const { emailService } = await import('../services/emailService');
  //     
  //     const result = await emailService.sendEmail({
  //       to: sale.customerEmail!,
  //       subject: `Receipt for Sale #${sale.saleNumber}`,
  //       html: receiptContent
  //     });
  //     
  //     if (result.success) {
  //       console.log('📧 Email receipt sent successfully for sale:', sale.saleNumber);
  //     } else {
  //       console.error('❌ Failed to send email receipt:', result.error);
  //     }
  //   } catch (error) {
  //     console.error('Error sending email receipt:', error);
  //   }
  // }

  // Email service disabled - function commented out
  // private generateEmailReceipt(sale: SaleData): string {
  //   const itemsHtml = sale.items.map(item => `
  //     <tr>
  //       <td>${item.productName} - ${item.variantName}</td>
  //       <td>${item.quantity}</td>
  //       <td>${this.formatMoney(item.unitPrice)}</td>
  //       <td>${this.formatMoney(item.totalPrice)}</td>
  //     </tr>
  //   `).join('');

  //   const discountRow = sale.discount > 0 ? `
  //     <tr>
  //       <td colspan="3" style="text-align: right; font-weight: bold;">Discount:</td>
  //       <td>-${this.formatMoney(sale.discount)}</td>
  //     </tr>
  //   ` : '';

  //   return `
  //     <!DOCTYPE html>
  //     <html>
  //     <head>
  //       <meta charset="utf-8">
  //       <title>Receipt - Sale #${sale.saleNumber}</title>
  //       <style>
  //         body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
  //         .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
  //         .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
  //         table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  //         th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
  //         th { background-color: #f5f5f5; font-weight: bold; }
  //         .total { font-weight: bold; font-size: 1.2em; }
  //         .footer { margin-top: 30px; text-align: center; color: #666; }
  //       </style>
  //     </head>
  //     <body>
  //       <div class="receipt">
  //         <div class="header">
  //           <h1>Sales Receipt</h1>
  //           <p>Sale #${sale.saleNumber}</p>
  //           <p>Date: ${new Date(sale.soldAt).toLocaleDateString()}</p>
  //           <p>Time: ${new Date(sale.soldAt).toLocaleTimeString()}</p>
  //         </div>
  //         
  //         <div>
  //           <h3>Customer Information</h3>
  //           <p><strong>Name:</strong> ${sale.customerName}</p>
  //           ${sale.customerPhone ? `<p><strong>Phone:</strong> ${sale.customerPhone}</p>` : ''}
  //           ${sale.customerEmail ? `<p><strong>Email:</strong> ${sale.customerEmail}</p>` : ''}
  //         </div>
  //         
  //         <table>
  //           <thead>
  //             <tr>
  //               <th>Item</th>
  //               <th>Qty</th>
  //               <th>Price</th>
  //               <th>Total</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             ${itemsHtml}
  //             ${discountRow}
  //             <tr>
  //               <td colspan="3" style="text-align: right; font-weight: bold;">Subtotal:</td>
  //               <td>${this.formatMoney(sale.subtotal)}</td>
  //             </tr>
  //             <tr>
  //               <td colspan="3" style="text-align: right; font-weight: bold;">Tax:</td>
  //               <td>${this.formatMoney(sale.tax)}</td>
  //             </tr>
  //             <tr class="total">
  //               <td colspan="3" style="text-align: right;">Total:</td>
  //               <td>${this.formatMoney(sale.total)}</td>
  //             </tr>
  //           </tbody>
  //         </table>
  //         
  //         <div>
  //           <p><strong>Payment Method:</strong> ${sale.paymentMethod.type.toUpperCase()}</p>
  //           <p><strong>Sold By:</strong> ${sale.soldBy}</p>
  //           ${sale.notes ? `<p><strong>Notes:</strong> ${sale.notes}</p>` : ''}
  //         </div>
  //         
  //         <div class="footer">
  //           <p>Thank you for your purchase!</p>
  //           <p>For any questions, please contact our support team.</p>
  //         </div>
  //       </div>
  //     </body>
  //     </html>
  //   `;
  // }

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
