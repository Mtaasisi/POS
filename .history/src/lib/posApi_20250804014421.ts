import { supabase } from './supabaseClient';

// Types for POS operations
export interface SaleOrder {
  id: string;
  customer_id?: string;
  order_date: Date;
  status: 'pending' | 'completed' | 'on_hold' | 'cancelled' | 'partially_paid' | 'delivered' | 'payment_on_delivery';
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  shipping_cost: number;
  final_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'installment' | 'payment_on_delivery';
  created_by: string;
  customer_type: 'retail' | 'wholesale';
  delivery_address?: string;
  delivery_city?: string;
  delivery_method?: 'local_transport' | 'air_cargo' | 'bus_cargo' | 'pickup';
  delivery_notes?: string;
  location_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SaleOrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  item_total: number;
  is_external_product: boolean;
  external_product_details?: {
    name: string;
    description: string;
    price: number;
  };
}

export interface InstallmentPayment {
  id: string;
  order_id: string;
  payment_date: Date;
  amount: number;
  payment_method: string;
  notes?: string;
  created_by: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: Date;
}

export interface LoyaltyCustomer {
  id: string;
  customer_id: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_spent: number;
  join_date: Date;
  last_visit: Date;
  rewards_redeemed: number;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  discount_amount?: number;
  discount_percentage?: number;
  category: 'discount' | 'free_item' | 'cashback' | 'upgrade';
  is_active: boolean;
  tier_required: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface GiftCard {
  id: string;
  card_number: string;
  initial_amount: number;
  current_balance: number;
  is_active: boolean;
  issued_by: string;
  issued_at: Date;
  expires_at?: Date;
  created_at: Date;
}

export interface GiftCardTransaction {
  id: string;
  gift_card_id: string;
  transaction_type: 'purchase' | 'redemption' | 'refund';
  amount: number;
  order_id?: string;
  processed_by: string;
  created_at: Date;
}

export interface GiftCardTemplate {
  id: string;
  name: string;
  design: 'classic' | 'modern' | 'premium' | 'seasonal' | 'birthday' | 'holiday' | 'celebration';
  amounts: number[];
  description: string;
  isActive: boolean;
  icon: string;
  color: string;
}

export interface GiftCardCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  amounts: number[];
  isSeasonal: boolean;
  templates: string[];
}

export interface GiftCardAnalytics {
  totalCards: number;
  totalValue: number;
  redeemedValue: number;
  activeCards: number;
  expiredCards: number;
  monthlySales: { month: string; amount: number }[];
  popularAmounts: { amount: number; count: number }[];
  redemptionRate: number;
}

export interface BulkGiftCardRequest {
  quantity: number;
  amount: number;
  template?: string;
  prefix?: string;
  notes?: string;
  category?: string;
}

export interface GiftCardSearch {
  cardNumber?: string;
  amountRange?: { min: number; max: number };
  dateRange?: { start: Date; end: Date };
  status?: 'active' | 'inactive' | 'expired';
  issuedBy?: string;
  template?: string;
  category?: string;
}

// POS API Functions
export const posApi = {
  // Sales Orders
  async createSaleOrder(orderData: Partial<SaleOrder>): Promise<SaleOrder> {
    // Get default location if location_id is not provided
    if (!orderData.location_id) {
      const { data: defaultLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('name', 'Main Repair Center')
        .single();
      
      if (defaultLocation) {
        orderData.location_id = defaultLocation.id;
      }
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSaleOrder(orderId: string, updates: Partial<SaleOrder>): Promise<SaleOrder> {
    const { data, error } = await supabase
      .from('sales_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSaleOrders(filters?: any): Promise<SaleOrder[]> {
    let query = supabase.from('sales_orders').select('*');
    
    if (filters) {
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.location_id) query = query.eq('location_id', filters.location_id);
      if (filters.date_from) query = query.gte('order_date', filters.date_from);
      if (filters.date_to) query = query.lte('order_date', filters.date_to);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Installment Payments
  async recordInstallmentPayment(paymentData: Partial<InstallmentPayment>): Promise<InstallmentPayment> {
    const { data, error } = await supabase
      .from('installment_payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getInstallmentPayments(orderId: string): Promise<InstallmentPayment[]> {
    const { data, error } = await supabase
      .from('installment_payments')
      .select('*')
      .eq('order_id', orderId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Product Pricing
  async getProductPrice(productId: string, variantId: string, customerType: 'retail' | 'wholesale'): Promise<number> {
    const { data, error } = await supabase
      .from('product_variants')
      .select('selling_price, wholesale_price')
      .eq('id', variantId)
      .single();

    if (error) throw error;
    
    return customerType === 'wholesale' ? data.wholesale_price : data.selling_price;
  },

  // Inventory Management
  async deductInventory(variantId: string, quantity: number): Promise<void> {
    try {
      // First get current stock - try both column names
      const { data: currentStock, error: fetchError } = await supabase
        .from('product_variants')
        .select('quantity_in_stock, stock_quantity')
        .eq('id', variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentStock) throw new Error('Product variant not found');

      // Use the available stock column
      const currentStockValue = currentStock.quantity_in_stock || currentStock.stock_quantity || 0;
      const newStock = Math.max(0, currentStockValue - quantity);

      // Update using the correct column name
      const updateData: any = {};
      if (currentStock.quantity_in_stock !== undefined) {
        updateData.quantity_in_stock = newStock;
      } else if (currentStock.stock_quantity !== undefined) {
        updateData.stock_quantity = newStock;
      }

      const { error } = await supabase
        .from('product_variants')
        .update(updateData)
        .eq('id', variantId);

      if (error) throw error;
    } catch (error) {
      console.warn('Failed to deduct inventory:', error);
      // Don't throw error to prevent sale from failing
    }
  },

  async getInventoryItems(locationId?: string): Promise<any[]> {
    let query = supabase
      .from('product_variants')
      .select(`
        *,
        products (
          name,
          category,
          description
        )
      `);

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Locations
  async getLocations(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getLocationStats(locationId: string, date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('sales_orders')
      .select('total_amount, status')
      .eq('location_id', locationId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (error) throw error;

    const totalSales = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const completedOrders = data?.filter(order => order.status === 'completed').length || 0;

    return {
      totalSales,
      completedOrders,
      totalOrders: data?.length || 0
    };
  },

  // Loyalty Program
  async getLoyaltyCustomer(customerId: string): Promise<LoyaltyCustomer | null> {
    const { data, error } = await supabase
      .from('loyalty_customers')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateLoyaltyPoints(customerId: string, pointsToAdd: number): Promise<void> {
    // First get current points
    const { data: currentCustomer, error: fetchError } = await supabase
      .from('loyalty_customers')
      .select('points')
      .eq('customer_id', customerId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (currentCustomer) {
      // Update existing customer
      const { error } = await supabase
        .from('loyalty_customers')
        .update({ 
          points: (currentCustomer.points || 0) + pointsToAdd,
          last_visit: new Date().toISOString()
        })
        .eq('customer_id', customerId);

      if (error) throw error;
    } else {
      // Create new loyalty customer
      const { error } = await supabase
        .from('loyalty_customers')
        .insert([{
          customer_id: customerId,
          points: pointsToAdd,
          last_visit: new Date().toISOString()
        }]);

      if (error) throw error;
    }
  },

  async getLoyaltyRewards(): Promise<LoyaltyReward[]> {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('is_active', true)
      .order('points_cost');

    if (error) throw error;
    return data || [];
  },

  async redeemLoyaltyReward(customerId: string, rewardId: string): Promise<void> {
    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('loyalty_rewards')
      .select('points_cost')
      .eq('id', rewardId)
      .single();

    if (rewardError) throw rewardError;

    // Get current customer points
    const { data: customer, error: customerError } = await supabase
      .from('loyalty_customers')
      .select('points, rewards_redeemed')
      .eq('customer_id', customerId)
      .single();

    if (customerError) throw customerError;

    // Deduct points from customer
    const { error: updateError } = await supabase
      .from('loyalty_customers')
      .update({ 
        points: Math.max(0, (customer.points || 0) - reward.points_cost),
        rewards_redeemed: (customer.rewards_redeemed || 0) + 1
      })
      .eq('customer_id', customerId);

    if (updateError) throw updateError;
  },

  // Gift Card Management
  async createGiftCard(cardData: Partial<GiftCard>): Promise<GiftCard> {
    // Generate unique card number if not provided
    if (!cardData.card_number) {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8);
      cardData.card_number = `GC${timestamp}${random}`.toUpperCase();
    }

    const { data, error } = await supabase
      .from('gift_cards')
      .insert([cardData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getGiftCard(cardNumber: string): Promise<GiftCard | null> {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('card_number', cardNumber)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateGiftCardBalance(cardId: string, newBalance: number): Promise<void> {
    const { error } = await supabase
      .from('gift_cards')
      .update({ current_balance: newBalance })
      .eq('id', cardId);

    if (error) throw error;
  },

  async recordGiftCardTransaction(transactionData: Partial<GiftCardTransaction>): Promise<GiftCardTransaction> {
    const { data, error } = await supabase
      .from('gift_card_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getGiftCardTransactions(cardId: string): Promise<GiftCardTransaction[]> {
    const { data, error } = await supabase
      .from('gift_card_transactions')
      .select('*')
      .eq('gift_card_id', cardId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async redeemGiftCard(cardNumber: string, amount: number, orderId?: string): Promise<GiftCard> {
    // Get gift card
    const giftCard = await this.getGiftCard(cardNumber);
    if (!giftCard) {
      throw new Error('Gift card not found or inactive');
    }

    if (giftCard.current_balance < amount) {
      throw new Error('Insufficient balance on gift card');
    }

    // Update balance
    const newBalance = giftCard.current_balance - amount;
    await this.updateGiftCardBalance(giftCard.id, newBalance);

    // Record transaction
    await this.recordGiftCardTransaction({
      gift_card_id: giftCard.id,
      transaction_type: 'redemption',
      amount: amount,
      order_id: orderId,
      processed_by: (await supabase.auth.getUser()).data.user?.id || 'system'
    });

    // Return updated gift card
    return { ...giftCard, current_balance: newBalance };
  },

  async purchaseGiftCard(amount: number, customerId?: string, template?: string): Promise<GiftCard> {
    const cardData = {
      initial_amount: amount,
      current_balance: amount,
      issued_by: (await supabase.auth.getUser()).data.user?.id || 'system'
    };

    const giftCard = await this.createGiftCard(cardData);

    // Record purchase transaction
    await this.recordGiftCardTransaction({
      gift_card_id: giftCard.id,
      transaction_type: 'purchase',
      amount: amount,
      processed_by: (await supabase.auth.getUser()).data.user?.id || 'system'
    });

    return giftCard;
  },

  // Enhanced Gift Card Functions
  async getGiftCardTemplates(): Promise<GiftCardTemplate[]> {
    // For now, return predefined templates
    return [
      {
        id: 'classic',
        name: 'Classic Design',
        design: 'classic',
        amounts: [1000, 2500, 5000, 10000],
        description: 'Elegant and timeless design',
        isActive: true,
        icon: '🎁',
        color: '#3B82F6'
      },
      {
        id: 'birthday',
        name: 'Birthday Celebration',
        design: 'birthday',
        amounts: [1000, 2500, 5000, 10000],
        description: 'Perfect for birthday celebrations',
        isActive: true,
        icon: '🎂',
        color: '#EC4899'
      },
      {
        id: 'holiday',
        name: 'Holiday Special',
        design: 'holiday',
        amounts: [1000, 2500, 5000, 10000],
        description: 'Festive holiday designs',
        isActive: true,
        icon: '🎄',
        color: '#10B981'
      },
      {
        id: 'premium',
        name: 'Premium Collection',
        design: 'premium',
        amounts: [5000, 10000, 25000, 50000],
        description: 'Luxury premium designs',
        isActive: true,
        icon: '💎',
        color: '#8B5CF6'
      }
    ];
  },

  async getGiftCardCategories(): Promise<GiftCardCategory[]> {
    return [
      {
        id: 'birthday',
        name: 'Birthday Cards',
        icon: '🎂',
        description: 'Perfect for birthday celebrations',
        amounts: [1000, 2500, 5000, 10000],
        isSeasonal: false,
        templates: ['birthday', 'classic']
      },
      {
        id: 'holiday',
        name: 'Holiday Cards',
        icon: '🎄',
        description: 'Festive holiday designs',
        amounts: [1000, 2500, 5000, 10000],
        isSeasonal: true,
        templates: ['holiday', 'classic']
      },
      {
        id: 'celebration',
        name: 'Celebration Cards',
        icon: '🎉',
        description: 'For all celebrations',
        amounts: [1000, 2500, 5000, 10000],
        isSeasonal: false,
        templates: ['classic', 'premium']
      },
      {
        id: 'get-well',
        name: 'Get Well Cards',
        icon: '🏥',
        description: 'Health and wellness wishes',
        amounts: [1000, 2500, 5000],
        isSeasonal: false,
        templates: ['classic']
      },
      {
        id: 'graduation',
        name: 'Graduation Cards',
        icon: '🎓',
        description: 'Academic achievements',
        amounts: [2500, 5000, 10000, 25000],
        isSeasonal: false,
        templates: ['premium', 'classic']
      }
    ];
  },

  async createBulkGiftCards(request: BulkGiftCardRequest): Promise<GiftCard[]> {
    const giftCards: GiftCard[] = [];
    const userId = (await supabase.auth.getUser()).data.user?.id || 'system';

    for (let i = 0; i < request.quantity; i++) {
      const cardData = {
        initial_amount: request.amount,
        current_balance: request.amount,
        issued_by: userId
      };

      const giftCard = await this.createGiftCard(cardData);
      giftCards.push(giftCard);

      // Record purchase transaction
      await this.recordGiftCardTransaction({
        gift_card_id: giftCard.id,
        transaction_type: 'purchase',
        amount: request.amount,
        processed_by: userId
      });
    }

    return giftCards;
  },

  async searchGiftCards(searchParams: GiftCardSearch): Promise<GiftCard[]> {
    let query = supabase
      .from('gift_cards')
      .select('*');

    if (searchParams.cardNumber) {
      query = query.ilike('card_number', `%${searchParams.cardNumber}%`);
    }

    if (searchParams.amountRange) {
      query = query
        .gte('initial_amount', searchParams.amountRange.min)
        .lte('initial_amount', searchParams.amountRange.max);
    }

    if (searchParams.dateRange) {
      query = query
        .gte('created_at', searchParams.dateRange.start.toISOString())
        .lte('created_at', searchParams.dateRange.end.toISOString());
    }

    if (searchParams.status) {
      if (searchParams.status === 'expired') {
        query = query.lt('expires_at', new Date().toISOString());
      } else {
        query = query.eq('is_active', searchParams.status === 'active');
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getGiftCardAnalytics(): Promise<GiftCardAnalytics> {
    // Get total cards and value
    const { data: allCards, error: cardsError } = await supabase
      .from('gift_cards')
      .select('initial_amount, current_balance, is_active, expires_at');

    if (cardsError) throw cardsError;

    const totalCards = allCards?.length || 0;
    const totalValue = allCards?.reduce((sum, card) => sum + card.initial_amount, 0) || 0;
    const redeemedValue = allCards?.reduce((sum, card) => sum + (card.initial_amount - card.current_balance), 0) || 0;
    const activeCards = allCards?.filter(card => card.is_active).length || 0;
    const expiredCards = allCards?.filter(card => card.expires_at && new Date(card.expires_at) < new Date()).length || 0;

    // Get monthly sales data
    const { data: transactions, error: transError } = await supabase
      .from('gift_card_transactions')
      .select('amount, created_at')
      .eq('transaction_type', 'purchase')
      .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());

    if (transError) throw transError;

    // Group by month
    const monthlySales = transactions?.reduce((acc, trans) => {
      const month = new Date(trans.created_at).toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + trans.amount;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get popular amounts
    const popularAmounts = allCards?.reduce((acc, card) => {
      acc[card.initial_amount] = (acc[card.initial_amount] || 0) + 1;
      return acc;
    }, {} as Record<number, number>) || {};

    const redemptionRate = totalValue > 0 ? (redeemedValue / totalValue) * 100 : 0;

    return {
      totalCards,
      totalValue,
      redeemedValue,
      activeCards,
      expiredCards,
      monthlySales: Object.entries(monthlySales).map(([month, amount]) => ({ month, amount })),
      popularAmounts: Object.entries(popularAmounts).map(([amount, count]) => ({ 
        amount: parseInt(amount.toString()), 
        count 
      })),
      redemptionRate
    };
  },

  async exportGiftCardsToCSV(cardIds: string[]): Promise<string> {
    const { data: cards, error } = await supabase
      .from('gift_cards')
      .select('*')
      .in('id', cardIds);

    if (error) throw error;

    const csvHeaders = 'Card Number,Initial Amount,Current Balance,Status,Issued Date\n';
    const csvRows = cards?.map(card => 
      `${card.card_number},${card.initial_amount},${card.current_balance},${card.is_active ? 'Active' : 'Inactive'},${new Date(card.issued_at).toLocaleDateString()}`
    ).join('\n') || '';

    return csvHeaders + csvRows;
  },

  // Analytics and Reports
  async getSalesAnalytics(locationId: string, period: 'today' | 'week' | 'month'): Promise<any> {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .select('total_amount, status, created_at')
      .eq('location_id', locationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (error) throw error;

    const totalSales = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const completedOrders = data?.filter(order => order.status === 'completed').length || 0;
    const averageOrderValue = completedOrders > 0 ? totalSales / completedOrders : 0;

    return {
      totalSales,
      completedOrders,
      averageOrderValue,
      period
    };
  },

  async getPopularProducts(locationId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('sales_order_items')
      .select(`
        quantity,
        unit_price,
        products (
          name,
          category
        )
      `)
      .eq('sales_orders.location_id', locationId)
      .limit(limit);

    if (error) throw error;

    // Group by product and calculate totals
    const productStats = data?.reduce((acc, item) => {
      const productName = (item.products as any)?.name || 'Unknown';
      if (!acc[productName]) {
        acc[productName] = { quantity: 0, revenue: 0 };
      }
      acc[productName].quantity += item.quantity;
      acc[productName].revenue += item.quantity * item.unit_price;
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number }>);

    return Object.entries(productStats || {}).map(([name, stats]) => ({
      name,
      quantity: stats.quantity,
      revenue: stats.revenue
    }));
  }
}; 