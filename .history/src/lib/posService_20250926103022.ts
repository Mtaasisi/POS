import { supabase } from './supabaseClient';

export interface POSSale {
  id?: string;
  sale_number: string;
  customer_id?: string | null;
  total_amount: number;
  payment_method: string;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface POSSaleItem {
  id?: string;
  sale_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

class POSService {
  // Save a complete sale with items
  async saveSale(
    saleData: Omit<POSSale, 'id' | 'created_at' | 'updated_at'>,
    saleItems: Omit<POSSaleItem, 'id' | 'sale_id' | 'created_at'>[]
  ): Promise<{ success: boolean; saleId?: string; error?: string }> {
    try {
      console.log('💾 Saving POS sale to database...', { saleData, itemCount: saleItems.length });

      // Insert the sale first
      const { data: sale, error: saleError } = await supabase
        .from('lats_sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) {
        console.error('❌ Error saving sale:', saleError);
        return { success: false, error: saleError.message };
      }

      if (!sale) {
        console.error('❌ No sale data returned');
        return { success: false, error: 'No sale data returned' };
      }

      console.log('✅ Sale saved successfully:', sale.id);

      // Insert sale items
      const itemsWithSaleId = saleItems.map(item => ({
        ...item,
        sale_id: sale.id
      }));

      const { error: itemsError } = await supabase
        .from('lats_sale_items')
        .insert(itemsWithSaleId);

      if (itemsError) {
        console.error('❌ Error saving sale items:', itemsError);
        // Note: We don't rollback the sale here as the stock has already been deducted
        return { success: false, error: `Sale saved but items failed: ${itemsError.message}` };
      }

      console.log('✅ Sale items saved successfully');
      return { success: true, saleId: sale.id };

    } catch (error) {
      console.error('❌ Unexpected error saving sale:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Generate a unique sale number
  generateSaleNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SALE-${timestamp}-${random}`;
  }

  // Convert cart items to sale items format
  convertCartItemsToSaleItems(
    cartItems: CartItem[],
    saleId: string
  ): Omit<POSSaleItem, 'id' | 'created_at'>[] {
    return cartItems.map(item => ({
      sale_id: saleId,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.totalPrice
    }));
  }

  // Get sales by date range
  async getSalesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<{ success: boolean; sales?: POSSale[]; error?: string }> {
    try {
      // Use simplified query to avoid 400 errors
      const { data: sales, error } = await supabase
        .from('lats_sales')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ POS service sales query failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Loaded ${sales?.length || 0} POS service sales`);
      return { success: true, sales: sales || [] };

    } catch (error) {
      console.error('❌ Unexpected error fetching sales:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get recent sales
  async getRecentSales(limit: number = 10): Promise<{ success: boolean; sales?: POSSale[]; error?: string }> {
    try {
      const { data: sales, error } = await supabase
        .from('lats_sales')
        .select(`
          *,
          lats_sale_items(
            *,
            lats_products(name, description),
            lats_product_variants(name, sku, attributes)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Complex POS service recent sales query failed, trying simpler query:', error.message);
        
        // Fallback to simpler query without joins
        const { data: simpleSales, error: simpleError } = await supabase
          .from('lats_sales')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (simpleError) {
          console.error('❌ Simple POS service recent sales query also failed:', simpleError);
          return { success: false, error: simpleError.message };
        }

        console.log(`✅ Loaded ${simpleSales?.length || 0} POS service recent sales (without joins)`);
        return { success: true, sales: simpleSales || [] };
      }

      return { success: true, sales: sales || [] };

    } catch (error) {
      console.error('❌ Unexpected error fetching recent sales:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const posService = new POSService();
